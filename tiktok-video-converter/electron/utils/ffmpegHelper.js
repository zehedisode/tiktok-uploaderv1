const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { getVideoMetadata: getCachedMetadata } = require('./metadataCache');
const { checkAudioStream, formatAudioInfo } = require('./audioHelper');
const { trackProcess, untrackProcess } = require('./processTracker');

// Timeout değerleri (ms)
const TIMEOUTS = {
  CONVERT_MIN: 10 * 60 * 1000,  // Minimum 10 dakika
  CONVERT_MAX: 120 * 60 * 1000, // Maksimum 120 dakika (2 saat)
  SEGMENT: 10 * 60 * 1000,      // 10 dakika - Segment bölme (artırıldı)
  TEXT: 5 * 60 * 1000,          // 5 dakika - Yazı ekleme (artırıldı)
};

// Video uzunluğuna göre dinamik timeout hesapla
function calculateConvertTimeout(videoDurationSeconds) {
  if (!videoDurationSeconds || videoDurationSeconds <= 0) {
    return TIMEOUTS.CONVERT_MIN;
  }
  
  // Video süresinin 2 katı + 10 dakika güvenlik payı
  // Minimum 10 dakika, maksimum 120 dakika
  const calculatedTimeout = (videoDurationSeconds * 2 * 1000) + (10 * 60 * 1000);
  
  return Math.max(
    TIMEOUTS.CONVERT_MIN,
    Math.min(calculatedTimeout, TIMEOUTS.CONVERT_MAX)
  );
  }

// FFmpeg yolları main.js'de yapılandırılıyor

// Video metadata al (cache'li)
const getVideoMetadata = getCachedMetadata;

// Videoyu 9:16 formatına çevir (letterbox - üst/alt siyah barlar)
async function convertToVertical(inputPath, outputPath, progressCallback, videoPosition = 'center', videoId = null) {
  return new Promise(async (resolve, reject) => {
    try {
      // Önce video metadata'sını kontrol et
      const metadata = await getVideoMetadata(inputPath);
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      
      if (!videoStream) {
        reject(new Error('Video stream bulunamadı!'));
        return;
      }

      const videoDuration = metadata.format.duration || 0;

      // Audio stream kontrolü (merkezi fonksiyon ile)
      const audioCheck = await checkAudioStream(inputPath);
      const hasAudio = audioCheck.hasAudio;
      
      if (!hasAudio) {
        console.error('❌ UYARI: Input dosyasında audio stream YOK!');
      }

      // Video uzunluğuna göre dinamik timeout hesapla
      const convertTimeout = calculateConvertTimeout(videoDuration);
      const timeoutMinutes = Math.round(convertTimeout / 60000);

      // Video pozisyon hesaplama
      let padY;
      switch (videoPosition) {
        case 'top':
          padY = '0'; // Üstte
          break;
        case 'bottom':
          padY = '(oh-ih)'; // Altta
          break;
        case 'center':
        default:
          padY = '(oh-ih)/2'; // Ortada (varsayılan)
          break;
      }

      // 16:9 videoyu 9:16 canvas içine sığdır (KESMEDEN)
      // Üst ve/veya alt siyah barlar ekle (letterbox effect)
      const command = ffmpeg(inputPath)
        .inputOptions([
          '-hwaccel', 'auto', // Hardware acceleration (varsa)
          '-threads', '0' // Tüm CPU core'ları kullan
        ])
        .videoFilters([
          // 1. Videoyu 1080 genişliğe scale et (aspect ratio korunur)
          'scale=1080:-2:flags=lanczos',
          // 2. 1920 yüksekliğinde siyah canvas oluştur ve videoyu yerleştir
          `pad=1080:1920:(ow-iw)/2:${padY}:black`
        ])
        .videoCodec('libx264')
        .outputOptions([
          '-preset', 'veryfast', // Hız optimizasyonu (kaliteyi koruyarak)
          '-crf', '21', // Kaliteyi korumak için CRF'i biraz düşürdük (21 = medium ile 23 arası kalite)
          '-pix_fmt', 'yuv420p', // TikTok uyumluluğu (MUTLAKA gerekli!)
          '-movflags', '+faststart', // Web streaming için
          '-profile:v', 'high', // H.264 profil
          '-level', '4.2', // H.264 level
          '-threads', '0', // Tüm CPU core'ları kullan
          '-map', '0:v:0', // Video stream'ini açıkça belirt
          '-avoid_negative_ts', 'make_zero', // Timestamp sorunlarını önle
          '-fflags', '+genpts', // PTS (Presentation Time Stamp) oluştur
          '-tune', 'fastdecode' // Hızlı decode için optimize et
        ])
      
      // Audio varsa MUTLAKA ekle (kritik!)
      if (hasAudio) {
        command
          .audioCodec('aac') // AAC codec (TikTok uyumlu)
          .outputOptions([
            '-map', '0:a:0', // Audio stream'ini açıkça belirt
            '-b:a', '128k', // Audio bitrate
            '-ar', '44100', // Sample rate
            '-ac', '2' // Stereo (2 kanal)
          ]);
        // Audio stream eklenecek
      } else {
        console.error('❌ HATA: Audio stream yok! Video sessiz olacak.');
      }

      // Timeout mekanizması (dinamik)
      const timeout = setTimeout(() => {
        console.error(`FFmpeg timeout (${timeoutMinutes} dakika aşıldı)`);
        command.kill('SIGKILL');
        if (videoId) untrackProcess(videoId);
        reject(new Error(
          `Video dönüşümü zaman aşımına uğradı (${timeoutMinutes} dakika). ` +
          `Video çok uzun olabilir (${Math.round(videoDuration / 60)} dakika). ` +
          `Lütfen daha kısa bir video deneyin veya video kalitesini düşürün.`
        ));
      }, convertTimeout);

      // Process tracking
      if (videoId) {
        trackProcess(videoId, command, timeout);
      }

      command
        .on('progress', (progress) => {
          if (progressCallback && progress.percent) {
            progressCallback(Math.round(progress.percent));
          }
        })
        .on('end', async () => {
          clearTimeout(timeout);
          if (videoId) untrackProcess(videoId);
          
          // Output dosyasında audio kontrolü (merkezi fonksiyon ile)
          try {
            const outputAudioCheck = await checkAudioStream(outputPath);
            
            if (hasAudio && !outputAudioCheck.hasAudio) {
              console.error('❌ KRİTİK HATA: Output dosyasında audio kayboldu!');
              reject(new Error('Video dönüşümü sırasında audio stream kayboldu. Lütfen tekrar deneyin.'));
              return;
            }
          } catch (checkError) {
            // Kontrol başarısız olsa bile devam et
          }
          
          resolve(outputPath);
        })
        .on('error', (err) => {
          clearTimeout(timeout);
          if (videoId) untrackProcess(videoId);
          console.error('Video dönüşüm hatası:', err.message);
          reject(err);
        })
        .on('stderr', (stderrLine) => {
          // FFmpeg log'larını göster
          const line = stderrLine.trim();
          if (line.toLowerCase().includes('error') || line.toLowerCase().includes('audio') || line.toLowerCase().includes('stream')) {
            console.log('FFmpeg:', line);
          }
        })
        .save(outputPath);
    } catch (error) {
      console.error('❌ Metadata okuma hatası:', error.message);
      reject(error);
    }
  });
}

// Videoyu 60 saniyelik parçalara böl (paralel işleme ile optimize edildi)
function splitVideo(inputPath, outputDir, baseFilename, progressCallback, videoId = null) {
  return new Promise(async (resolve, reject) => {
    try {
      // Metadata ve audio kontrolünü paralel yap
      const [metadata, audioCheck] = await Promise.all([
        getVideoMetadata(inputPath),
        checkAudioStream(inputPath)
      ]);
      
      const duration = metadata.format.duration;
      const hasAudio = audioCheck.hasAudio;

      // 60 saniyeden kısa videolar bölünmez
      if (duration <= 60) {
        resolve([{ path: inputPath, duration, partNumber: 0 }]);
        return;
      }

      const segmentDuration = 60;
      const segmentCount = Math.ceil(duration / segmentDuration);
      
      // Paralel işlem sayısı (CPU core sayısına göre, maksimum performans)
      const os = require('os');
      const cpuCount = os.cpus().length;
      const maxParallel = Math.min(12, Math.max(6, cpuCount * 1.5)); // Video kırpma copy kullandığı için daha fazla paralel işlem yapabiliriz

      // Segment'leri paralel işle
      const segmentPromises = [];
      for (let i = 0; i < segmentCount; i++) {
        const startTime = i * segmentDuration;
        const partDuration = Math.min(segmentDuration, duration - startTime);
        const segmentPath = path.join(outputDir, `${baseFilename}_temp_${String(i).padStart(3, '0')}.mp4`);

        const segmentPromise = new Promise((partResolve, partReject) => {
          const command = ffmpeg(inputPath)
            .setStartTime(startTime)
            .setDuration(partDuration)
            .outputOptions([
              '-c:v', 'copy', // Video codec copy (hızlı)
              '-avoid_negative_ts', 'make_zero',
              '-movflags', '+faststart'
            ]);

          // Audio varsa MUTLAKA ekle (kritik!)
          if (hasAudio) {
            command
              .outputOptions([
                '-c:a', 'copy', // Audio codec copy (hızlı)
                '-map', '0:v:0', // Video stream
                '-map', '0:a:0'  // Audio stream (açıkça belirt)
              ]);
          } else {
            command.outputOptions(['-map', '0:v:0']); // Sadece video
          }

          // Timeout mekanizması
          const segmentTimeout = setTimeout(() => {
            console.error(`Segment ${i + 1} timeout`);
            command.kill('SIGKILL');
            if (videoId) untrackProcess(`${videoId}_segment_${i}`);
            partReject(new Error(`Segment ${i + 1} zaman aşımına uğradı`));
          }, TIMEOUTS.SEGMENT);

          // Process tracking
          if (videoId) {
            trackProcess(`${videoId}_segment_${i}`, command, segmentTimeout);
          }

          command
            .on('progress', (progress) => {
              // Progress tracking batch progress'te yapılacak
            })
            .on('end', async () => {
              clearTimeout(segmentTimeout);
              if (videoId) untrackProcess(`${videoId}_segment_${i}`);
              
              // Segment'te audio kontrolü (merkezi fonksiyon ile)
              try {
                const segmentAudioCheck = await checkAudioStream(segmentPath);
                
                if (hasAudio && !segmentAudioCheck.hasAudio) {
                  console.error(`Part ${i + 1}: ❌ KRİTİK: Audio kayboldu!`);
                }
              } catch {
                // Audio kontrolü başarısız, devam et
              }
              
              partResolve({ path: segmentPath, partNumber: i + 1 });
            })
            .on('error', (err) => {
              clearTimeout(segmentTimeout);
              if (videoId) untrackProcess(`${videoId}_segment_${i}`);
              console.error(`Part ${i + 1} hatası:`, err.message);
              partReject(err);
            })
            .on('stderr', (stderrLine) => {
              if (stderrLine.toLowerCase().includes('error')) {
                console.error(`FFmpeg stderr (Part ${i + 1}):`, stderrLine);
              }
            })
            .save(segmentPath);
        });

        segmentPromises.push(segmentPromise);
      }

      // Batch'ler halinde paralel işle (CPU'yu aşırı yüklememek için)
      const batchSize = maxParallel;
      let completedSegments = 0;
      const parts = [];
      
      for (let i = 0; i < segmentPromises.length; i += batchSize) {
        const batch = segmentPromises.slice(i, i + batchSize);
        
        // Her batch için progress tracking
        const batchPromises = batch.map((promise) => {
          return promise.then((result) => {
            completedSegments++;
            if (progressCallback) {
              const progress = Math.round((completedSegments / segmentPromises.length) * 100);
              progressCallback(Math.min(100, progress));
            }
            return result;
          });
        });
        
        const batchResults = await Promise.all(batchPromises);
        parts.push(...batchResults);
      }

      // Part numaralarına göre sırala
      parts.sort((a, b) => a.partNumber - b.partNumber);

      resolve(parts);
    } catch (error) {
      console.error('Split hatası:', error);
      reject(error);
    }
  });
}

// Font dosya yolunu al
function getFontPath(fontFamily) {
  const fontMap = {
    'Arial Bold': { win: 'arialbd.ttf', mac: 'Arial Bold.ttf', linux: 'DejaVuSans-Bold.ttf' },
    'Arial': { win: 'arial.ttf', mac: 'Arial.ttf', linux: 'DejaVuSans.ttf' },
    'Impact': { win: 'impact.ttf', mac: 'Impact.ttf', linux: 'DejaVuSans-Bold.ttf' },
    'Comic Sans MS Bold': { win: 'comicbd.ttf', mac: 'Comic Sans MS Bold.ttf', linux: 'DejaVuSans-Bold.ttf' },
    'Times New Roman Bold': { win: 'timesbd.ttf', mac: 'Times Bold.ttf', linux: 'DejaVuSerif-Bold.ttf' },
    'Verdana Bold': { win: 'verdanab.ttf', mac: 'Verdana Bold.ttf', linux: 'DejaVuSans-Bold.ttf' },
  };

  const font = fontMap[fontFamily] || fontMap['Arial Bold'];

  if (process.platform === 'win32') {
    return `C\\\\:/Windows/Fonts/${font.win}`;
  } else if (process.platform === 'darwin') {
    return `/System/Library/Fonts/Supplemental/${font.mac}`;
  } else {
    return `/usr/share/fonts/truetype/dejavu/${font.linux}`;
  }
}

// Videoya çoklu yazı ekle
async function addMultipleTextOverlays(inputPath, outputPath, textLayers, progressCallback, videoId = null) {
  if (!textLayers || textLayers.length === 0) {
    // Yazı yok, direkt kopyala
    fs.copyFileSync(inputPath, outputPath);
    return outputPath;
  }

  // Aktif katmanları filtrele
  const activeLayers = textLayers.filter(l => l.enabled);
  
  if (activeLayers.length === 0) {
    fs.copyFileSync(inputPath, outputPath);
    return outputPath;
  }

  // Her katman için drawtext filtresi oluştur
  const filters = activeLayers.map(layer => {
    const fontPath = getFontPath(layer.fontFamily);
    
    // X pozisyon
    let xPos;
    switch (layer.xAlign) {
      case 'left':
        xPos = layer.xOffset.toString();
        break;
      case 'right':
        xPos = `(w-text_w-${Math.abs(layer.xOffset)})`;
        break;
      case 'center':
      default:
        xPos = `(w-text_w)/2+${layer.xOffset}`;
        break;
    }

    // Y pozisyon
    const yPos = layer.position === 'top' 
      ? layer.yOffset.toString()
      : `(h-${layer.yOffset}-text_h)`;

    // Shadow
    const shadow = layer.shadowEnabled 
      ? `:shadowcolor=black@0.5:shadowx=2:shadowy=2`
      : '';

    // Border rengi hex'ten formatla
    const borderColor = layer.borderColor.replace('#', '0x');

    // Text escape: FFmpeg drawtext için özel karakterleri escape et
    const escapedText = layer.text
      .replace(/\\/g, '\\\\')  // Backslash
      .replace(/'/g, "\\'")    // Single quote
      .replace(/:/g, '\\:')    // Colon
      .replace(/\[/g, '\\[')   // Square brackets
      .replace(/\]/g, '\\]');

    return `drawtext=text='${escapedText}':fontfile=${fontPath}:fontsize=${layer.fontSize}:fontcolor=${layer.fontColor}:borderw=${layer.borderWidth}:bordercolor=${borderColor}:x=${xPos}:y=${yPos}${shadow}`;
  });

  // Filtreleri birleştir
  const videoFilter = filters.join(',');

  // Audio stream kontrolü (merkezi fonksiyon ile)
  let hasAudio = true; // Default: audio'yu koru
  try {
    const audioCheck = await checkAudioStream(inputPath);
    hasAudio = audioCheck.hasAudio;
  } catch {
    hasAudio = true; // Güvenli tarafta kal
  }

  return new Promise((resolve, reject) => {

    const command = ffmpeg(inputPath)
      .inputOptions([
        '-hwaccel', 'auto', // Hardware acceleration
        '-threads', '0' // Tüm CPU core'ları kullan
      ])
      .videoFilters(videoFilter)
      .videoCodec('libx264')
      .outputOptions([
        '-preset', 'veryfast', // Hız optimizasyonu (kaliteyi koruyarak)
        '-crf', '21', // Kaliteyi korumak için CRF'i biraz düşürdük
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-profile:v', 'high',
        '-level', '4.2',
        '-threads', '0', // Tüm CPU core'ları kullan
        '-map', '0:v:0', // Video stream'i açıkça belirt
        '-tune', 'fastdecode' // Hızlı decode için optimize et
      ]);

    // Audio varsa ekle
    if (hasAudio) {
      command
        .audioCodec('copy') // Audio codec copy (hızlı)
        .outputOptions(['-map', '0:a:0']); // Audio stream'i açıkça belirt
    }

    // Timeout mekanizması
    const textTimeout = setTimeout(() => {
      console.error('❌ Text overlay timeout');
      command.kill('SIGKILL');
      if (videoId) untrackProcess(`${videoId}_text`);
      reject(new Error('Yazı ekleme zaman aşımına uğradı'));
    }, TIMEOUTS.TEXT);

    // Process tracking
    if (videoId) {
      trackProcess(`${videoId}_text`, command, textTimeout);
    }

    command
      .on('progress', (progress) => {
        if (progressCallback && progress.percent) {
          progressCallback(Math.round(progress.percent));
        }
      })
      .on('end', async () => {
        clearTimeout(textTimeout);
        if (videoId) untrackProcess(`${videoId}_text`);
        
        // Output'ta audio kontrolü (merkezi fonksiyon ile)
        try {
          const outputAudioCheck = await checkAudioStream(outputPath);
          
          if (hasAudio && !outputAudioCheck.hasAudio) {
            console.error('❌ KRİTİK: Text overlay sonrası audio kayboldu!');
            reject(new Error('Yazı ekleme sırasında audio stream kayboldu.'));
            return;
          }
        } catch (checkError) {
          // Kontrol başarısız, devam et
        }
        
        resolve(outputPath);
      })
      .on('error', (err) => {
        clearTimeout(textTimeout);
        if (videoId) untrackProcess(`${videoId}_text`);
        console.error('Text overlay hatası:', err.message);
        reject(err);
      })
      .on('stderr', (stderrLine) => {
        if (stderrLine.toLowerCase().includes('error')) {
          console.error('FFmpeg stderr:', stderrLine);
        }
      })
      .save(outputPath);
  });
}

// Eski tek yazı fonksiyonu (geriye uyumluluk)
function addTextOverlay(inputPath, outputPath, text, progressCallback, textOptions = {}) {
  const {
    fontSize = 70,
    position = 'top',
    yOffset = 80,
    fontFamily = 'Arial Bold',
    fontColor = '#FFFFFF',
    borderWidth = 4,
    xAlign = 'center',
    xOffset = 0,
  } = textOptions;

  const layer = {
    enabled: true,
    text: text,
    fontFamily,
    fontSize,
    fontColor,
    borderWidth,
    borderColor: '#000000',
    shadowEnabled: true,
    position,
    xAlign,
    yOffset,
    xOffset,
  };

  return addMultipleTextOverlays(inputPath, outputPath, [layer], progressCallback);
}

module.exports = {
  getVideoMetadata,
  convertToVertical,
  splitVideo,
  addTextOverlay,
  addMultipleTextOverlays,
};

