const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

const platform = process.platform;

// Binary indirme URL'leri
const BINARIES = {
  'yt-dlp': {
    win32: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    darwin: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
    linux: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
  },
  'ffmpeg': {
    win32: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
    // macOS ve Linux için sistem paket yöneticilerini kullan
  }
};

function getBinariesDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'binaries');
  }
  return path.join(__dirname, '../binaries');
}

function getBinaryPath(name) {
  const binDir = getBinariesDir();
  const ext = platform === 'win32' ? '.exe' : '';
  return path.join(binDir, `${name}${ext}`);
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Redirect takibi
        return downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function ensureYtDlp() {
  const ytDlpPath = getBinaryPath('yt-dlp');
  
  if (fs.existsSync(ytDlpPath)) {
    // Windows'ta dosyanın erişilebilir olduğundan emin ol
    if (platform === 'win32') {
      try {
        // Dosyayı açmayı dene (read-only)
        const fd = fs.openSync(ytDlpPath, 'r');
        fs.closeSync(fd);
        // Dosya erişilebilir
        console.log('yt-dlp zaten mevcut');
        return ytDlpPath;
      } catch (err) {
        // Dosya kilitliyse yeniden indir
        console.log('yt-dlp dosyası kilitli, yeniden indiriliyor...');
        try {
          fs.unlinkSync(ytDlpPath);
        } catch {
          // Sessizce devam et
        }
      }
    } else {
      console.log('yt-dlp zaten mevcut');
      return ytDlpPath;
    }
  }

  console.log('yt-dlp indiriliyor...');
  const url = BINARIES['yt-dlp'][platform];
  
  if (!url) {
    throw new Error(`Platform desteklenmiyor: ${platform}`);
  }

  const binDir = getBinariesDir();
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // Geçici dosya adıyla indir (Windows kilitleme sorununu önler)
  const tempPath = platform === 'win32' 
    ? `${ytDlpPath}.tmp` 
    : ytDlpPath;
  
  await downloadFile(url, tempPath);

  // Windows'ta: Geçici dosyayı final konuma taşı
  if (platform === 'win32') {
    // Eski dosya varsa sil
    try {
      if (fs.existsSync(ytDlpPath)) {
        fs.unlinkSync(ytDlpPath);
      }
    } catch {
      // Sessizce devam et
    }
    
    // Kısa bir bekleme (dosya sistemi senkronizasyonu için)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Geçici dosyayı final konuma taşı
    fs.renameSync(tempPath, ytDlpPath);
    
    // Dosyanın erişilebilir olduğundan emin ol
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Unix sistemlerde çalıştırılabilir yap
  if (platform !== 'win32') {
    fs.chmodSync(ytDlpPath, 0o755);
  }

  console.log('yt-dlp indirildi:', ytDlpPath);
  return ytDlpPath;
}

async function ensureFfmpeg() {
  const ffmpegPath = getBinaryPath('ffmpeg');
  
  if (fs.existsSync(ffmpegPath)) {
    console.log('ffmpeg zaten mevcut');
    return ffmpegPath;
  }

  console.log('ffmpeg kontrol ediliyor...');

  // Sistem PATH'inde ffmpeg var mı kontrol et
  try {
    if (platform === 'win32') {
      execSync('where ffmpeg', { stdio: 'ignore' });
    } else {
      execSync('which ffmpeg', { stdio: 'ignore' });
    }
    console.log('Sistem ffmpeg kullanılacak');
    return 'ffmpeg'; // Sistem PATH'inden kullan
  } catch {
    // Sistem PATH'inde yok
  }

  // Windows için otomatik indirme
  if (platform === 'win32') {
    console.log('Windows için ffmpeg indirme önerilir.');
    console.log('Manuel indirme: https://www.gyan.dev/ffmpeg/builds/');
    throw new Error(
      'FFmpeg bulunamadı. Lütfen https://www.gyan.dev/ffmpeg/builds/ adresinden indirip binaries klasörüne koyun.'
    );
  }

  // macOS için Homebrew önerisi
  if (platform === 'darwin') {
    throw new Error(
      'FFmpeg bulunamadı. Lütfen Terminal\'de "brew install ffmpeg" komutunu çalıştırın.'
    );
  }

  // Linux için paket yöneticisi önerisi
  throw new Error(
    'FFmpeg bulunamadı. Lütfen "sudo apt install ffmpeg" veya "sudo yum install ffmpeg" komutunu çalıştırın.'
  );
}

async function ensureBinaries() {
  let ytDlpPath, ffmpegPath;
  
  try {
    ytDlpPath = await ensureYtDlp();
  } catch (error) {
    console.error('yt-dlp kontrol hatası:', error.message);
    ytDlpPath = null;
  }
  
  try {
    ffmpegPath = await ensureFfmpeg();
  } catch (error) {
    console.error('ffmpeg kontrol hatası:', error.message);
    ffmpegPath = null;
  }

  return {
    ytDlp: ytDlpPath,
    ffmpeg: ffmpegPath,
  };
}

module.exports = {
  ensureBinaries,
  getBinaryPath,
  getBinariesDir,
};

