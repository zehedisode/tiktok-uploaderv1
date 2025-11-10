const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// Metadata cache (file path -> metadata)
const metadataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 dakika

/**
 * Video metadata'sını al (cache ile)
 */
function getVideoMetadata(inputPath) {
  return new Promise((resolve, reject) => {
    // Cache kontrolü
    const cached = metadataCache.get(inputPath);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < CACHE_TTL) {
        // Dosya varlığını kontrol et (sadece bir kez)
        try {
          if (fs.existsSync(inputPath)) {
            const fileStats = fs.statSync(inputPath);
            if (fileStats.mtimeMs === cached.mtime) {
              resolve(cached.metadata);
              return;
            }
          }
        } catch {
          // Dosya kontrolü başarısız, cache'i kullanma
        }
      }
      // Cache eski veya dosya değişmiş, cache'i temizle
      metadataCache.delete(inputPath);
    }

    // Cache yok veya eski, yeni metadata al
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        // Cache'e kaydet
        const fileStats = fs.statSync(inputPath);
        metadataCache.set(inputPath, {
          metadata,
          timestamp: Date.now(),
          mtime: fileStats.mtimeMs,
        });
        resolve(metadata);
      }
    });
  });
}

/**
 * Cache'i temizle (belirli bir dosya için veya tümü)
 */
function clearCache(filePath = null) {
  if (filePath) {
    metadataCache.delete(filePath);
  } else {
    metadataCache.clear();
  }
}

/**
 * Eski cache girişlerini temizle (TTL aşanlar)
 */
function cleanupOldCache() {
  const now = Date.now();
  for (const [path, cached] of metadataCache.entries()) {
    if (now - cached.timestamp >= CACHE_TTL) {
      metadataCache.delete(path);
    }
  }
}

// Her 10 dakikada bir eski cache'leri temizle
setInterval(cleanupOldCache, 10 * 60 * 1000);

module.exports = {
  getVideoMetadata,
  clearCache,
};

