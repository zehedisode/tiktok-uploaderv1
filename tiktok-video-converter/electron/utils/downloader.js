const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const { getBinaryPath } = require('./binaryManager');
const { getVideoMetadata: probeFile } = require('./metadataCache');

// Temp dizinini al
function getTempDir() {
  const tempDir = path.join(app.getPath('temp'), 'youtube-to-tiktok');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

// Dosya adını temizle - ASCII only, güvenli
function sanitizeFilename(filename) {
  return filename
    .normalize('NFD') // Unicode normalize
    .replace(/[\u0300-\u036f]/g, '') // Diacritic işaretlerini kaldır
    .replace(/[^\x20-\x7E]/g, '') // ASCII olmayan karakterleri kaldır (yazdırılabilir ASCII)
    .replace(/[<>:"/\\|?*#]/g, '') // Geçersiz karakterleri kaldır (# dahil)
    .replace(/\s+/g, '_') // Boşlukları alt çizgi ile değiştir
    .replace(/[^\w_.]/g, '_') // Sadece alfanumerik, alt çizgi, nokta (tire kaldırıldı)
    .replace(/_+/g, '_') // Birden fazla alt çizgiyi tek yap
    .replace(/^_|_$/g, '') // Başındaki ve sonundaki alt çizgiyi kaldır
    .substring(0, 60) // Daha kısa limit (part1.mp4 eklenecek)
    || 'video'; // Eğer boş kalırsa default
}

// FFmpeg yolları main.js'de yapılandırılıyor

// Video bilgilerini al (retry ile)
async function getVideoInfo(url, retryCount = 0) {
  const MAX_RETRIES = 3;
  
  return new Promise((resolve, reject) => {
    const ytDlpPath = getBinaryPath('yt-dlp');
    
    // Binary dosyasının varlığını kontrol et
    if (!fs.existsSync(ytDlpPath)) {
      reject(new Error('yt-dlp binary bulunamadı. Lütfen uygulamayı yeniden başlatın.'));
      return;
    }
    
    const args = [
      '--dump-json',
      '--no-playlist',
      url
    ];

    let stdout = '';
    let stderr = '';
    
    // spawn kullan (execFile yerine - EBUSY sorununu önler)
    const ytProcess = spawn(ytDlpPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    ytProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ytProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ytProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(stdout);
          resolve({
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            uploader: info.uploader,
            description: info.description,
            id: info.id,
          });
        } catch (parseError) {
          if (retryCount < MAX_RETRIES) {
            // Retry: JSON parse hatası
            setTimeout(() => {
              getVideoInfo(url, retryCount + 1).then(resolve).catch(reject);
            }, 1000 * (retryCount + 1));
          } else {
            reject(new Error('Video bilgisi ayrıştırılamadı'));
          }
        }
      } else {
        // EBUSY veya diğer hatalar için retry
        if (retryCount < MAX_RETRIES && (stderr.includes('EBUSY') || stderr.includes('spawn'))) {
          console.log(`getVideoInfo retry ${retryCount + 1}/${MAX_RETRIES} - EBUSY hatası`);
          setTimeout(() => {
            getVideoInfo(url, retryCount + 1).then(resolve).catch(reject);
          }, 2000 * (retryCount + 1)); // Exponential backoff
        } else {
          reject(new Error(`Video bilgisi alınamadı: ${stderr || `Exit code: ${code}`}`));
        }
      }
    });

    ytProcess.on('error', (error) => {
      // EBUSY hatası için retry
      if (retryCount < MAX_RETRIES && (error.message.includes('EBUSY') || error.code === 'EBUSY')) {
        console.log(`getVideoInfo retry ${retryCount + 1}/${MAX_RETRIES} - spawn EBUSY`);
        setTimeout(() => {
          getVideoInfo(url, retryCount + 1).then(resolve).catch(reject);
        }, 2000 * (retryCount + 1));
      } else {
        reject(new Error(`yt-dlp çalıştırılamadı: ${error.message}`));
      }
    });
  });
}

// URL validation
function isValidYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const patterns = [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
    /^https?:\/\/.*youtube\.com\/watch\?v=[\w-]+/i,
    /^https?:\/\/youtu\.be\/[\w-]+/i,
  ];
  return patterns.some(pattern => pattern.test(url.trim()));
}

// Video indir
async function downloadVideo(url, progressCallback, retryCount = 0) {
  const MAX_RETRIES = 2; // Maksimum 2 retry
  
  // URL validation
  if (!isValidYouTubeUrl(url)) {
    throw new Error('Geçersiz YouTube URL: ' + url);
  }
  
  return new Promise((resolve, reject) => {
    const ytDlpPath = getBinaryPath('yt-dlp');
    const tempDir = getTempDir();
    // Sadece ID kullan - Türkçe karakter problemi yok
    const outputTemplate = path.join(tempDir, '%(id)s.%(ext)s');

    // Video indiriliyor (log main.js'de yapılıyor)

    // Format seçimi: Audio garantili formatlar (retry'a göre değişir)
    let formatString;
    
    if (retryCount === 0) {
      // İlk deneme: Audio+video içeren tek dosya formatları (daha garantili)
      formatString = [
        'best[height<=1080][acodec!=none][vcodec!=none][ext=mp4]/', // MP4 audio+video
        'best[height<=1080][acodec!=none][vcodec!=none]/', // Herhangi format audio+video
        'bestvideo[height<=1080]+bestaudio[ext=m4a]/', // Video+audio kombinasyonu
        'bestvideo[height<=1080]+bestaudio/', // Video+audio kombinasyonu (genel)
        'best[height<=720][acodec!=none][vcodec!=none]/', // 720p audio+video
        'best[height<=480][acodec!=none][vcodec!=none]/' // 480p audio+video
      ].join('');
    } else {
      // Retry: Düşük kalite ama MUTLAKA audio garantili
      formatString = [
        'best[height<=720][acodec!=none][vcodec!=none]/', // 720p audio+video
        'best[height<=480][acodec!=none][vcodec!=none]/', // 480p audio+video
        'best[height<=360][acodec!=none][vcodec!=none]/', // 360p audio+video
        'bestvideo[height<=720]+bestaudio[ext=m4a]/', // Video+audio kombinasyonu
        'bestvideo[height<=480]+bestaudio[ext=m4a]/', // Video+audio kombinasyonu
        'bestvideo+bestaudio[ext=m4a]/', // Herhangi video + AAC
        'bestvideo+bestaudio/', // Herhangi video + herhangi audio
        'best[acodec!=none][vcodec!=none]' // Son çare: Audio+video içeren tek dosya
      ].join('');
    }

    const args = [
      '-f', formatString,
      '--merge-output-format', 'mp4',
      // Audio garantisi için ekstra parametreler
      '--postprocessor-args', 'ffmpeg:-c:a copy', // Audio codec'i koru
      '--no-playlist',
      '--extractor-args', 'youtube:player_client=android', // Android client (daha fazla format)
      '-o', outputTemplate,
      '--newline',
      url
    ];

    const ytProcess = spawn(ytDlpPath, args, {
      windowsHide: true
    });
    let downloadPath = '';
    let mergedPath = '';
    let videoId = '';
    let videoCandidates = new Set();
    let audioCandidates = new Set();
    let errorOutput = '';
    const MAX_ERROR_OUTPUT_SIZE = 10000; // Max 10KB error output

    ytProcess.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Progress parsing
      const progressMatch = output.match(/(\d+\.\d+)%/);
      if (progressMatch && progressCallback) {
        const progress = parseFloat(progressMatch[1]);
        progressCallback(Math.round(progress));
      }

      // Destination filename
      const destMatch = output.match(/\[download\] Destination: (.+)/);
      if (destMatch) {
        const detectedPath = destMatch[1].trim();
        downloadPath = detectedPath;
        const idMatch = detectedPath.match(/([a-zA-Z0-9_-]{11})/);
        if (idMatch) {
          videoId = idMatch[1];
        }
        const ext = path.extname(detectedPath).toLowerCase();
        if (['.mp4', '.mov', '.mkv', '.webm'].includes(ext)) {
          videoCandidates.add(detectedPath);
        } else if (['.m4a', '.aac', '.webm', '.opus', '.mp3'].includes(ext)) {
          audioCandidates.add(detectedPath);
        }
      }

      // Merge info
      const mergeMatch = output.match(/\[Merger\] Merging formats into "(.+)"/);
      if (mergeMatch) {
        mergedPath = mergeMatch[1].trim();
        downloadPath = mergedPath;
      }

      // Already downloaded
      const alreadyMatch = output.match(/\[download\] (.+) has already been downloaded/);
      if (alreadyMatch) {
        downloadPath = alreadyMatch[1].trim();
      }
      
      // Final destination
      const finalMatch = output.match(/\[download\] (.+\.mp4) has already been downloaded/);
      if (finalMatch) {
        downloadPath = finalMatch[1].trim();
      }
      
      // Any .mp4/.webm mention
      const videoMatch = output.match(/([\w:._\\/-]+\.(mp4|mkv|webm))/i);
      if (videoMatch) {
        const potentialPath = videoMatch[1];
        if (potentialPath.includes(tempDir)) {
          videoCandidates.add(potentialPath);
        }
      }
    });

    ytProcess.stderr.on('data', (data) => {
      const err = data.toString();
      // Memory leak önleme: error output'u sınırla
      if (errorOutput.length < MAX_ERROR_OUTPUT_SIZE) {
        errorOutput += err;
      }
      // Sadece ciddi hatalar loglanır
      if (err.toLowerCase().includes('error') || err.toLowerCase().includes('failed')) {
        console.error('yt-dlp error:', err.trim());
      }
    });

    ytProcess.on('close', async (code) => {
      let candidateList = [mergedPath, ...videoCandidates, downloadPath, ...audioCandidates].filter(Boolean);
      const preferredExtOrder = ['.mp4', '.mov', '.mkv', '.webm'];
      let finalPath = candidateList.find((candidate) => {
        const ext = path.extname(candidate).toLowerCase();
        return preferredExtOrder.includes(ext) && fs.existsSync(candidate);
      }) || candidateList.find((candidate) => fs.existsSync(candidate));

      if ((!finalPath || !fs.existsSync(finalPath)) && videoId) {
        const files = fs.readdirSync(tempDir);
        const videoFile = files
          .filter((file) => file.includes(videoId))
          .map((file) => path.join(tempDir, file))
          .find((filePath) => {
            const ext = path.extname(filePath).toLowerCase();
            return preferredExtOrder.includes(ext) && fs.existsSync(filePath);
          });
        if (videoFile) {
          finalPath = videoFile;
        }
      }
      
      // Video ID'yi dosya adından çıkar (fallback)
      if (!videoId && finalPath) {
        const filename = path.basename(finalPath);
        const idMatch = filename.match(/([a-zA-Z0-9_-]{11})/);
        if (idMatch) {
          videoId = idMatch[1];
          // Video ID dosya adından çıkarıldı
        }
      }

      let audioMergeLog = 'Audio merge not required';
      let finalAudioStatus = 'unknown';

      try {
        if (finalPath && fs.existsSync(finalPath)) {
          const finalMetadata = await probeFile(finalPath);
          const finalHasAudio = finalMetadata.streams.some((s) => s.codec_type === 'audio');
          finalAudioStatus = finalHasAudio ? 'existing' : 'missing';

          if (!finalHasAudio && audioCandidates.size > 0) {
            const audioCandidate = pickBestAudioCandidate(audioCandidates);
            if (audioCandidate) {
              const mergedOutput = path.join(
                tempDir,
                `${videoId || path.basename(finalPath, path.extname(finalPath))}_merged.mp4`
              );

              // Audio merge başlatılıyor

              await new Promise((resolveMerge, rejectMerge) => {
                ffmpeg()
                  .input(finalPath)
                  .input(audioCandidate)
                  .outputOptions([
                    '-c:v', 'copy',
                    '-c:a', 'copy',
                    '-map', '0:v:0',
                    '-map', '1:a:0',
                    '-shortest',
                    '-movflags', '+faststart',
                  ])
                  .on('end', resolveMerge)
                  .on('error', rejectMerge)
                  .save(mergedOutput);
              });

              const mergedMetadata = await probeFile(mergedOutput);
              const mergedHasAudio = mergedMetadata.streams.some((s) => s.codec_type === 'audio');

              if (mergedHasAudio) {
                // Audio merge başarılı
                finalPath = mergedOutput;
                finalAudioStatus = 'merged';
                audioMergeLog = `Audio merged from ${audioCandidate}`;
              } else {
                audioMergeLog = 'Audio merge failed: merged file has no audio';
              }
            } else {
              audioMergeLog = 'Audio merge skipped: uygun audio candidate yok';
            }
          } else if (finalHasAudio) {
            audioMergeLog = 'Audio already present in video file';
          }
        }
      } catch (mergeError) {
        console.error('Audio merge hatası:', mergeError.message);
        audioMergeLog = `Audio merge exception: ${mergeError.message}`;
      }

      if (code === 0 && finalPath && fs.existsSync(finalPath)) {
        const stats = fs.statSync(finalPath);
        // İndirme tamamlandı
        
        // KRİTİK: Final dosyada audio kontrolü (merkezi fonksiyon ile)
        try {
          const { checkAudioStream, formatAudioInfo } = require('./audioHelper');
          const finalAudioCheck = await checkAudioStream(finalPath);
          
          if (!finalAudioCheck.hasAudio) {
            // KRİTİK: İndirilen dosyada audio YOK!
            
            // Audio candidate'lar varsa merge dene
            if (audioCandidates.size > 0) {
              const audioCandidate = pickBestAudioCandidate(audioCandidates);
              if (audioCandidate && fs.existsSync(audioCandidate)) {
                const mergedOutput = path.join(
                  tempDir,
                  `${videoId || path.basename(finalPath, path.extname(finalPath))}_final_merged.mp4`
                );
                
                try {
                  await new Promise((resolveMerge, rejectMerge) => {
                    ffmpeg()
                      .input(finalPath)
                      .input(audioCandidate)
                      .outputOptions([
                        '-c:v', 'copy',
                        '-c:a', 'aac', // AAC'ye encode et (daha güvenli)
                        '-b:a', '128k',
                        '-ar', '44100',
                        '-map', '0:v:0',
                        '-map', '1:a:0',
                        '-shortest',
                        '-movflags', '+faststart',
                      ])
                      .on('end', resolveMerge)
                      .on('error', rejectMerge)
                      .save(mergedOutput);
                  });
                  
                  const mergedCheckMetadata = await probeFile(mergedOutput);
                  const mergedCheckHasAudio = mergedCheckMetadata.streams.some(s => s.codec_type === 'audio');
                  
                  if (mergedCheckHasAudio) {
                    // Audio merge başarılı
                    // Eski dosyayı sil
                    try {
                      if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
                    } catch (unlinkErr) {
                      // Sessizce devam et
                    }
                    resolve(mergedOutput);
                    return;
                  }
                } catch (mergeErr) {
                  // Merge hatası, retry'ye geç
                }
              }
            }
            
            // Audio yoksa RETRY: Farklı format ile tekrar indir
            if (retryCount < MAX_RETRIES) {
              // Eski dosyayı sil
              try {
                if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
              } catch (unlinkErr) {
                // Sessizce devam et
              }
              
              // Retry download (recursive call)
              return downloadVideo(url, progressCallback, retryCount + 1).then(resolve).catch(reject);
            } else {
              // Max retry aşıldı, hata ver
              reject(new Error(
                `İndirilen video dosyasında audio stream bulunamadı (${MAX_RETRIES + 1} deneme sonrası)!\n` +
                `Video ID: ${videoId || 'UNKNOWN'}\n` +
                `Final Path: ${finalPath}\n` +
                `Audio Status: ${finalAudioStatus}\n` +
                `Audio Candidates: ${audioCandidates.size}\n` +
                `Bu video için audio'lu format bulunamadı. Lütfen farklı bir video deneyin.`
              ));
              return;
            }
            } else {
            // Audio mevcut
          }
        } catch (audioCheckError) {
          // Audio kontrolü başarısız, devam et
        }
        
        resolve(finalPath);
      } else {
        const detailedDebug = `\nURL: ${url}\nExit Code: ${code}\nVideo ID: ${videoId || 'UNKNOWN'}\nFinal Path: ${finalPath || 'NONE'}\nAudio Status: ${finalAudioStatus}\n${audioMergeLog}\nyt-dlp stderr: ${errorOutput}\nTemp files: ${fs.readdirSync(tempDir).join(', ')}`;
        reject(new Error(detailedDebug));
      }
    });

    ytProcess.on('error', (error) => {
      reject(new Error(`yt-dlp çalıştırılamadı: ${error.message}`));
    });
  });
}

// probeFile artık metadataCache'den geliyor

function pickBestAudioCandidate(audioCandidates) {
  if (!audioCandidates || audioCandidates.size === 0) {
    return null;
  }

  const priority = ['.m4a', '.aac', '.opus', '.webm', '.mp3', '.wav'];
  const candidates = Array.from(audioCandidates)
    .filter((candidate) => candidate && fs.existsSync(candidate))
    .sort((a, b) => {
      const extA = path.extname(a).toLowerCase();
      const extB = path.extname(b).toLowerCase();
      const idxA = priority.indexOf(extA === '' ? '.m4a' : extA);
      const idxB = priority.indexOf(extB === '' ? '.m4a' : extB);
      return (idxA === -1 ? priority.length : idxA) - (idxB === -1 ? priority.length : idxB);
    });

  return candidates[0] || null;
}

module.exports = {
  getVideoInfo,
  downloadVideo,
  sanitizeFilename,
  getTempDir,
};

