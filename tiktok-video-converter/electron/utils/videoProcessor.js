const path = require('path');
const fs = require('fs');
const { convertToVertical, splitVideo, addMultipleTextOverlays, getVideoMetadata } = require('./ffmpegHelper');
const { sanitizeFilename, getTempDir } = require('./downloader');
const { clearCache } = require('./metadataCache');
const { untrackProcess } = require('./processTracker');

async function processVideo(inputPath, outputDir, videoTitle, progressCallback, settings = {}, videoId = null) {
  const tempDir = getTempDir();
  const cleanTitle = sanitizeFilename(videoTitle);
  // Temp dosyalar için timestamp kullan - ASCII only
  const tempId = `video_${Date.now()}`;
  
  // Ayarları al
  const {
    videoPosition = 'center',
    partTextTemplate = 'Part {N}',
  } = settings;
  
  let verticalPath = null;
  let parts = [];
  
  try {
    console.log('=== VIDEO PROCESS BAŞLADI ===');
    console.log('Input:', inputPath);
    console.log('Output:', outputDir);

    // 0. Video dosyasını kontrol et
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Video dosyası bulunamadı: ${inputPath}`);
    }

    const fileStats = fs.statSync(inputPath);
    if (fileStats.size === 0) {
      throw new Error('Video dosyası boş!');
    }

    console.log(`Video boyutu: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

    // 0.5. Video ve Audio stream kontrolü (convertToVertical'dan önce) - Paralel yapıldı
    try {
      const { checkAudioStream } = require('./audioHelper');
      
      // Metadata ve audio kontrolünü paralel yap
      const [metadata, audioCheck] = await Promise.all([
        getVideoMetadata(inputPath),
        checkAudioStream(inputPath)
      ]);
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      
      if (!videoStream) {
        throw new Error('İndirilen dosyada video stream bulunamadı! Sadece ses dosyası indirilmiş olabilir. Lütfen farklı bir video deneyin.');
      }

      // KRİTİK: Audio kontrolü
      if (!audioCheck.hasAudio) {
        console.error('❌ KRİTİK HATA: İndirilen dosyada audio stream YOK!');
        throw new Error(
          'İndirilen video dosyasında audio stream bulunamadı!\n' +
          'Video sessiz olacak. Lütfen farklı bir video deneyin veya yt-dlp format seçimini kontrol edin.'
        );
      }
    } catch (metadataError) {
      if (metadataError.message.includes('stream bulunamadı') || metadataError.message.includes('audio stream')) {
        throw metadataError; // Bu hatayı direkt fırlat
      }
      console.warn('⚠️ Metadata kontrolü başarısız, devam ediliyor:', metadataError.message);
    }

    // 1. Dikey formata çevir (içinde video stream kontrolü var)
    progressCallback('converting', 0, 'Dikey formata çeviriliyor...');
    progressCallback('converting', 0, `Kaynak dosya: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
    verticalPath = path.join(tempDir, `${tempId}_vertical.mp4`);
    await convertToVertical(inputPath, verticalPath, (percent) => {
      progressCallback('converting', percent, `Dikey formata çeviriliyor... %${percent}`);
    }, videoPosition, videoId);

    // 2. 60 saniyelik parçalara böl
    progressCallback('splitting', 0, 'Parçalara bölünüyor...');
    parts = await splitVideo(verticalPath, tempDir, tempId, (percent) => {
      progressCallback('splitting', percent, `Parçalara bölünüyor... %${percent}`);
    }, videoId);

    // Parça dosyalarının varlığını kontrol et
    for (const part of parts) {
      if (!fs.existsSync(part.path)) {
        throw new Error(`Part dosyası bulunamadı: ${part.path}`);
      }
    }

    // 3. Her parçaya "Part N" yazısı ekle (paralel işleme ile optimize edildi)
    progressCallback('adding-text', 0, 'Part yazıları ekleniyor...');
    const finalParts = [];
    
    // Output klasörünü garanti et
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Paralel işlem sayısı (CPU core sayısına göre, maksimum performans)
    const os = require('os');
    const cpuCount = os.cpus().length;
    const maxParallelText = Math.min(8, Math.max(4, cpuCount));

    // Yazı ekleme işlemlerini hazırla
    const textProcessPromises = parts.map((part, i) => {
      const partNumber = part.partNumber || 1;
      
      // Part yazısını template'den oluştur
      const partText = parts.length === 1 ? '' : partTextTemplate.replace('{N}', partNumber);
      
      // Çıktı dosya adı
      const outputFilename = parts.length === 1 
        ? `${cleanTitle}.mp4`
        : `${cleanTitle}_part${partNumber}.mp4`;
      const outputPath = path.join(outputDir, outputFilename);

      // Part dosyasının son kontrolü
      if (!fs.existsSync(part.path)) {
        throw new Error(`FATAL: Part dosyası işlem sırasında kayboldu: ${part.path}`);
      }

      // Yazı ekleme (sadece birden fazla part varsa)
      if (parts.length > 1 && settings.textLayers && settings.textLayers.length > 0) {
        // Her katmana part numarasını ekle
        const layersWithText = settings.textLayers.map(layer => ({
          ...layer,
          text: layer.template.replace('{N}', partNumber),
        }));
        
        return addMultipleTextOverlays(part.path, outputPath, layersWithText, null, videoId ? `${videoId}_text_${i}` : null)
          .then(() => outputPath)
          .catch((textError) => {
            console.error('Text overlay hatası:', textError.message);
            throw new Error(`Text overlay başarısız: ${textError.message}`);
          });
      } else {
        // Tek parça varsa veya yazı yoksa direkt kopyala
        fs.copyFileSync(part.path, outputPath);
        return Promise.resolve(outputPath);
      }
    });

    // Batch'ler halinde paralel işle (CPU'yu aşırı yüklememek için)
    const batchSize = maxParallelText;
    let completedCount = 0;
    const totalParts = textProcessPromises.length;
    
    for (let i = 0; i < textProcessPromises.length; i += batchSize) {
      const batch = textProcessPromises.slice(i, i + batchSize);
      
      // Her batch için progress tracking
      const batchPromises = batch.map((promise) => {
        return promise.then((result) => {
          completedCount++;
          const progress = Math.round((completedCount / totalParts) * 100);
          progressCallback('adding-text', Math.min(100, progress), `Part yazıları ekleniyor... ${completedCount}/${totalParts} (%${Math.min(100, progress)})`);
          return result;
        });
      });
      
      const batchResults = await Promise.all(batchPromises);
      finalParts.push(...batchResults);
    }

    // Temp dosyaları paralel temizle (performans için)
    const cleanupPromises = [];
    
    // Part dosyalarını temizle
    for (const part of parts) {
      if (part.path && fs.existsSync(part.path)) {
        cleanupPromises.push(
          Promise.resolve().then(() => {
            try {
              fs.unlinkSync(part.path);
              clearCache(part.path);
            } catch {
              // Sessizce devam et
            }
          })
        );
      }
    }

    // Diğer temp dosyaları temizle
    if (fs.existsSync(inputPath)) {
      cleanupPromises.push(
        Promise.resolve().then(() => {
          try {
            fs.unlinkSync(inputPath);
            clearCache(inputPath);
          } catch {
            // Sessizce devam et
          }
        })
      );
    }
    if (verticalPath && fs.existsSync(verticalPath)) {
      cleanupPromises.push(
        Promise.resolve().then(() => {
          try {
            fs.unlinkSync(verticalPath);
            clearCache(verticalPath);
          } catch {
            // Sessizce devam et
          }
        })
      );
    }
    
    // Tüm temizleme işlemlerini paralel yap
    await Promise.all(cleanupPromises);

    // Video işleme tamamlandı

    return {
      success: true,
      parts: finalParts,
      title: videoTitle,
    };
  } catch (error) {
    // Hata durumunda da temp dosyaları paralel temizle
    try {
      const cleanupPromises = [];
      
      if (fs.existsSync(inputPath)) {
        cleanupPromises.push(
          Promise.resolve().then(() => {
            try {
              fs.unlinkSync(inputPath);
              clearCache(inputPath);
            } catch {}
          })
        );
      }
      if (verticalPath && fs.existsSync(verticalPath)) {
        cleanupPromises.push(
          Promise.resolve().then(() => {
            try {
              fs.unlinkSync(verticalPath);
              clearCache(verticalPath);
            } catch {}
          })
        );
      }
      // Parts'leri de temizle
      for (const part of parts) {
        if (part.path && fs.existsSync(part.path)) {
          cleanupPromises.push(
            Promise.resolve().then(() => {
              try {
                fs.unlinkSync(part.path);
                clearCache(part.path);
              } catch {}
            })
          );
        }
      }
      
      await Promise.all(cleanupPromises);
    } catch (cleanupError) {
      // Temizleme hatası kritik değil
    }
    
    // Process tracking'i temizle
    if (videoId) {
      untrackProcess(videoId);
    }
    
    console.error('❌ Video işleme hatası ayrıntı:', error);
    throw new Error(`Video işleme hatası: ${error.message}`);
  }
}

module.exports = {
  processVideo,
};

