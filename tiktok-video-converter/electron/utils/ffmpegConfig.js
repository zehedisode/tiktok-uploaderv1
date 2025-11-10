const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const { getBinaryPath } = require('./binaryManager');

let isConfigured = false;

/**
 * FFmpeg ve FFprobe path'lerini yapılandırır (tek seferlik)
 * Önce custom binary'leri kontrol eder, bulamazsa static paketleri kullanır
 */
function configureFfmpegPaths() {
  if (isConfigured) {
    return; // Zaten yapılandırılmış, tekrar yapma
  }

  try {
    // FFmpeg path
    const customFfmpegPath = getBinaryPath('ffmpeg');
    if (fs.existsSync(customFfmpegPath)) {
      ffmpeg.setFfmpegPath(customFfmpegPath);
    } else if (ffmpegStatic) {
      ffmpeg.setFfmpegPath(ffmpegStatic);
    }

    // FFprobe path
    const customFfprobePath = getBinaryPath('ffprobe');
    if (fs.existsSync(customFfprobePath)) {
      ffmpeg.setFfprobePath(customFfprobePath);
    } else if (ffprobeStatic && ffprobeStatic.path) {
      ffmpeg.setFfprobePath(ffprobeStatic.path);
    }

    isConfigured = true;
  } catch (error) {
    // Sessizce devam et, sistem PATH'inden kullanılabilir
  }
}

module.exports = { configureFfmpegPaths };

