const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const Store = require('electron-store');
const { downloadVideo, getVideoInfo } = require('./utils/downloader');
const { processVideo } = require('./utils/videoProcessor');
const { ensureBinaries } = require('./utils/binaryManager');
const { configureFfmpegPaths } = require('./utils/ffmpegConfig');
const { cancelProcess, cleanupAllProcesses } = require('./utils/processTracker');

const store = new Store();
let mainWindow;
const isDev = !app.isPackaged;

// Logs dizinini oluştur
const logsDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log buffer (batch yazma için)
let logBuffer = [];
const LOG_FLUSH_INTERVAL = 2000; // 2 saniyede bir yaz
const LOG_BUFFER_MAX = 50; // Maksimum buffer boyutu

// Log fonksiyonu (async, batch yazma)
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  // Console'a hemen yaz (development için)
  if (isDev || level === 'error') {
    console.log(logMessage.trim());
  }
  
  // Buffer'a ekle
  logBuffer.push(logMessage);
  
  // Buffer dolduysa veya error ise hemen yaz
  if (logBuffer.length >= LOG_BUFFER_MAX || level === 'error') {
    flushLogs();
  }
}

// Buffer'ı dosyaya yaz
function flushLogs() {
  if (logBuffer.length === 0) return;
  
  const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  const content = logBuffer.join('');
  logBuffer = [];
  
  fs.appendFile(logFile, content, (err) => {
    if (err) {
      console.error('Log yazma hatası:', err.message);
    }
  });
}

// Periyodik olarak buffer'ı temizle
setInterval(flushLogs, LOG_FLUSH_INTERVAL);

// Uygulama kapanırken buffer'ı temizle
app.on('before-quit', () => {
  flushLogs();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#1f2937',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'default',
    frame: true,
    show: false, // Başlangıçta gizle
  });

  // Pencere hazır olunca göster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log('Pencere gösterildi');
  });

  // Uygulama kapatılırken temp dosyalarını temizle
  mainWindow.on('close', () => {
    cleanupTempFiles();
  });

  // Render process crash handler
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log(`Render process crash: ${details.reason}`, 'error');
  });

  // Unresponsive handler
  mainWindow.on('unresponsive', () => {
    log('Pencere yanıt vermiyor!', 'warn');
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  log('Uygulama başlatılıyor...');
  
  // FFmpeg path'lerini yapılandır (tek seferlik, tüm modüllerden önce)
  configureFfmpegPaths();
  
  // Pencereyi hemen oluştur
  createWindow();
  
  // Binary'leri arka planda kontrol et
  try {
    await ensureBinaries();
    log('Binary\'ler hazır');
    // Pencere yüklenene kadar bekle
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('binaries-ready');
      });
    }
  } catch (error) {
    log(`Binary kontrol hatası: ${error.message}`, 'error');
    // Kullanıcıyı uyar ama uygulamayı kapat(ma)
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('binaries-error', error.message);
      });
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    cleanupAllProcesses();
    app.quit();
  }
});

// Uygulama kapanırken tüm process'leri temizle
app.on('before-quit', () => {
  cleanupAllProcesses();
});

// Temp dosyaları temizle
function cleanupTempFiles() {
  const tempDir = path.join(app.getPath('temp'), 'youtube-to-tiktok');
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      log('Temp dosyalar temizlendi');
    }
  } catch (error) {
    log(`Temp temizleme hatası: ${error.message}`, 'error');
  }
}

// IPC Handlers

// Klasör seçici
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      defaultPath: store.get('lastOutputPath', app.getPath('videos')),
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      store.set('lastOutputPath', selectedPath);
      log(`Klasör seçildi: ${selectedPath}`);
      return { success: true, path: selectedPath };
    }

    return { success: false };
  } catch (error) {
    log(`Klasör seçme hatası: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

// Video bilgisi al
ipcMain.handle('get-video-info', async (event, url) => {
  try {
    log(`Video bilgisi alınıyor: ${url}`);
    const info = await getVideoInfo(url);
    return { success: true, info };
  } catch (error) {
    log(`Video bilgisi alma hatası: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

// Video indir ve işle
ipcMain.handle('process-video', async (event, { url, outputPath, videoId }) => {
  try {
    log(`Video işleme başlatıldı: ${url}`);

    // Video bilgisini al
    mainWindow.webContents.send('video-progress', {
      videoId,
      stage: 'info',
      progress: 0,
      message: 'Video bilgileri alınıyor...',
    });

    const videoInfo = await getVideoInfo(url);

    // İndir
    mainWindow.webContents.send('video-progress', {
      videoId,
      stage: 'downloading',
      progress: 0,
      message: 'Video indiriliyor...',
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
    });

    const downloadPath = await downloadVideo(url, (progress) => {
      mainWindow.webContents.send('video-progress', {
        videoId,
        stage: 'downloading',
        progress: progress,
        message: `İndiriliyor... %${progress}`,
      });
    });

    // İşle
    mainWindow.webContents.send('video-progress', {
      videoId,
      stage: 'processing',
      progress: 0,
      message: 'Video işleniyor...',
    });

    // Ayarları al
    const userSettings = store.store;
    
    const result = await processVideo(downloadPath, outputPath, videoInfo.title, (stage, progress, message) => {
      mainWindow.webContents.send('video-progress', {
        videoId,
        stage,
        progress,
        message,
      });
    }, userSettings, videoId);

    // Tamamlandı
    mainWindow.webContents.send('video-progress', {
      videoId,
      stage: 'completed',
      progress: 100,
      message: `Tamamlandı! ${result.parts.length} parça oluşturuldu.`,
      outputFiles: result.parts,
    });

    log(`Video işleme tamamlandı: ${videoInfo.title} (${result.parts.length} parça)`);

    return { success: true, result };
  } catch (error) {
    log(`Video işleme hatası: ${error.message}`, 'error');
    log(`Hata stack: ${error.stack}`, 'error');
    
    mainWindow.webContents.send('video-progress', {
      videoId,
      stage: 'error',
      progress: 0,
      message: `Hata: ${error.message}`,
      errorDetails: error.stack || error.message,
      debugLog: `Video ID: ${videoId}\nURL: ${url}\nOutput Path: ${outputPath}\nHata: ${error.message}\nStack: ${error.stack}`
    });
    return { success: false, error: error.message };
  }
});

// İşlemi iptal et
ipcMain.handle('cancel-task', async (event, videoId) => {
  try {
    log(`Video iptal ediliyor: ${videoId}`);
    const cancelled = cancelProcess(videoId);
    if (cancelled) {
      log(`Video process iptal edildi: ${videoId}`);
    }
    return { success: true, cancelled };
  } catch (error) {
    log(`Video iptal hatası: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

// Klasörü aç
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath);
    log(`Klasör açıldı: ${folderPath}`);
    return { success: true };
  } catch (error) {
    log(`Klasör açma hatası: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

// Ayarları al
ipcMain.handle('get-settings', async () => {
  try {
    return {
      lastOutputPath: store.get('lastOutputPath', app.getPath('videos')),
      maxConcurrent: store.get('maxConcurrent', 3),
      notifications: store.get('notifications', true),
      textLayers: store.get('textLayers', [
        {
          id: Date.now(),
          enabled: true,
          template: 'Part {N}',
          fontFamily: 'Arial Bold',
          fontSize: 70,
          fontColor: '#FFFFFF',
          borderWidth: 4,
          borderColor: '#000000',
          shadowEnabled: true,
          position: 'top',
          xAlign: 'center',
          yOffset: 80,
          xOffset: 0,
        }
      ]),
      videoPosition: store.get('videoPosition', 'center'),
      partTextTemplate: store.get('partTextTemplate', 'Part {N}'),
    };
  } catch (error) {
    log(`Ayar okuma hatası: ${error.message}`, 'error');
    return {
      lastOutputPath: app.getPath('videos'),
      maxConcurrent: 3,
      notifications: true,
      textLayers: [],
      videoPosition: 'center',
      partTextTemplate: 'Part {N}',
    };
  }
});

// Ayarları kaydet
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    Object.keys(settings).forEach(key => {
      store.set(key, settings[key]);
    });
    log('Ayarlar kaydedildi');
    return { success: true };
  } catch (error) {
    log(`Ayar kaydetme hatası: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

// Disk alanı kontrolü (Şimdilik devre dışı - paket yok)
ipcMain.handle('check-disk-space', async () => {
  // TODO: check-disk-space paketi eklenecek
  // const checkDiskSpace = require('check-disk-space').default;
  // const diskSpace = await checkDiskSpace(path);
  return { 
    success: true, 
    free: 100 * 1024 * 1024 * 1024, // 100GB mock
    size: 500 * 1024 * 1024 * 1024  // 500GB mock
  };
});

// TikTok Creator Studio'yu tarayıcıda aç
ipcMain.handle('open-tiktok-upload', async () => {
  try {
    await shell.openExternal('https://www.tiktok.com/creator-center/upload?lang=tr-TR');
    log('TikTok Creator Studio tarayıcıda açıldı');
    return { success: true };
  } catch (error) {
    log(`TikTok açma hatası: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

// External link aç
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    log(`External link açıldı: ${url}`);
    return { success: true };
  } catch (error) {
    log(`External link açma hatası: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

// Notları getir
ipcMain.handle('get-notes', async () => {
  try {
    const notes = store.get('notes', []);
    log(`${notes.length} not yüklendi`);
    return notes;
  } catch (error) {
    log(`Notlar getirme hatası: ${error.message}`, 'error');
    return [];
  }
});

// Not kaydet
ipcMain.handle('save-note', async (event, note) => {
  try {
    const notes = store.get('notes', []);
    const existingIndex = notes.findIndex(n => n.id === note.id);
    
    if (existingIndex >= 0) {
      // Güncelle
      notes[existingIndex] = note;
      log(`Not güncellendi: ${note.title}`);
    } else {
      // Yeni ekle
      notes.unshift(note); // En üste ekle
      log(`Yeni not eklendi: ${note.title}`);
    }
    
    store.set('notes', notes);
    return { success: true, notes };
  } catch (error) {
    log(`Not kaydetme hatası: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
    };
  }
});

// Not sil
ipcMain.handle('delete-note', async (event, noteId) => {
  try {
    const notes = store.get('notes', []);
    const filteredNotes = notes.filter(n => n.id !== noteId);
    
    store.set('notes', filteredNotes);
    log(`Not silindi: ${noteId}`);
    return { success: true, notes: filteredNotes };
  } catch (error) {
    log(`Not silme hatası: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
    };
  }
});

// TikTok Uploader'ı başlat
ipcMain.handle('start-tiktok-uploader', async (event, folderPath) => {
  try {
    log(`TikTok Uploader başlatılıyor: ${folderPath}`);
    
    // Uploader projesinin yolunu bul (workspace root'unda)
    // __dirname = electron/ klasörü
    // .. = tiktok-video-converter/
    // .. = zehedisode/ (workspace root)
    const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
    const uploaderDir = path.join(workspaceRoot, 'tiktok-uploaderv1');
    
    // Alternatif: direkt workspace root'tan bul
    const altWorkspaceRoot = path.resolve(process.cwd(), '..');
    const altUploaderDir = path.join(altWorkspaceRoot, 'tiktok-uploaderv1');
    
    // Hangisi varsa onu kullan
    const finalUploaderDir = fs.existsSync(uploaderDir) ? uploaderDir : 
                            (fs.existsSync(altUploaderDir) ? altUploaderDir : uploaderDir);
    
    log(`Workspace root: ${workspaceRoot}`);
    log(`Uploader dir: ${finalUploaderDir}`);
    
    // Klasör varlığını kontrol et
    if (!fs.existsSync(finalUploaderDir)) {
      const errorMsg = `Uploader klasörü bulunamadı: ${finalUploaderDir}`;
      log(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
    
    const uploaderScript = path.join(finalUploaderDir, 'auto_upload.py');
    const guiAppPath = path.join(finalUploaderDir, 'gui_app.py');
    
    // GUI uygulaması var mı kontrol et
    if (!fs.existsSync(guiAppPath)) {
      const errorMsg = `GUI uygulaması bulunamadı: ${guiAppPath}`;
      log(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
    
    // Eğer auto_upload.py yoksa oluştur (ileride kullanılabilir)
    if (!fs.existsSync(uploaderScript)) {
      const autoUploadScript = `#!/usr/bin/env python3
"""Otomatik TikTok Video Yükleyici - Converter'dan çağrılır"""

import sys
import os
from pathlib import Path

# Proje root'unu path'e ekle
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from tiktok_uploader.upload import upload_videos
from tiktok_uploader.auth import AuthBackend

def main():
    if len(sys.argv) < 2:
        print("Kullanım: python auto_upload.py <klasor_yolu>")
        sys.exit(1)
    
    folder_path = sys.argv[1]
    
    if not os.path.isdir(folder_path):
        print(f"Hata: Klasör bulunamadı: {folder_path}")
        sys.exit(1)
    
    # Klasördeki tüm video dosyalarını bul
    video_files = []
    video_extensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv']
    folder = Path(folder_path)
    for video_file in folder.iterdir():
        if video_file.is_file() and video_file.suffix.lower() in video_extensions:
            video_files.append(video_file)
    
    if not video_files:
        print(f"Klasörde video dosyası bulunamadı: {folder_path}")
        sys.exit(1)
    
    # Video listesi oluştur
    videos = []
    for video_file in sorted(video_files):
        videos.append({
            'path': str(video_file),
            'description': f"#{Path(video_file).stem.replace(' ', '')}"
        })
    
    print(f"{len(videos)} video bulundu. Yükleniyor...")
    
    # Cookies dosyasını bul
    cookies_file = Path(project_root) / 'cookies.txt'
    if not cookies_file.exists():
        # Bir üst dizinde ara
        cookies_file = Path(project_root).parent / 'cookies.txt'
    
    if not cookies_file.exists():
        print("Hata: cookies.txt dosyası bulunamadı!")
        print("Lütfen cookies.txt dosyasını proje klasörüne koyun.")
        sys.exit(1)
    
    # Auth backend oluştur
    auth = AuthBackend(cookies=str(cookies_file))
    
    # Videoları yükle
    failed_videos = upload_videos(videos=videos, auth=auth)
    
    if failed_videos:
        print(f"\\n{len(failed_videos)} video yüklenemedi:")
        for video in failed_videos:
            print(f"  - {video.get('path', 'Bilinmeyen')}")
    else:
        print("\\nTüm videolar başarıyla yüklendi!")

if __name__ == '__main__':
    main()
`;
      
      fs.writeFileSync(uploaderScript, autoUploadScript, 'utf8');
      log(`Auto upload script oluşturuldu: ${uploaderScript}`);
    }
    
    // Python komutunu belirle (Windows'ta py, diğerlerinde python3)
    const pythonCmd = process.platform === 'win32' ? 'py' : 'python3';
    
    log(`Python komutu: ${pythonCmd}`);
    log(`GUI App: ${guiAppPath}`);
    log(`Klasör: ${folderPath}`);
    
    // Önce klasör yolunu environment variable olarak geçir
    // GUI uygulaması bunu okuyup otomatik yükleyebilir
    const env = { ...process.env };
    env.TIKTOK_UPLOAD_FOLDER = folderPath;
    
    // GUI uygulamasını başlat
    const uploaderProcess = spawn(pythonCmd, [guiAppPath], {
      cwd: finalUploaderDir,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: env,
      shell: process.platform === 'win32' // Windows'ta shell gerekli olabilir
    });
    
    // Hata ve çıktıları logla
    uploaderProcess.stdout.on('data', (data) => {
      log(`Uploader stdout: ${data.toString()}`);
    });
    
    uploaderProcess.stderr.on('data', (data) => {
      log(`Uploader stderr: ${data.toString()}`, 'error');
    });
    
    uploaderProcess.on('error', (error) => {
      log(`Uploader process hatası: ${error.message}`, 'error');
    });
    
    uploaderProcess.on('exit', (code) => {
      log(`Uploader process çıktı (kod: ${code})`);
    });
    
    // Process'i arka plana gönder (Windows'ta farklı)
    if (process.platform === 'win32') {
      uploaderProcess.unref();
    } else {
      uploaderProcess.unref();
    }
    
    log(`TikTok Uploader başlatıldı (PID: ${uploaderProcess.pid})`);
    
    // Kısa bir bekleme ekle ki process başlasın
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, pid: uploaderProcess.pid };
  } catch (error) {
    log(`TikTok Uploader başlatma hatası: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

// Converter'ı kapat
ipcMain.handle('close-converter', async () => {
  try {
    log('Converter kapatılıyor...');
    // Kısa bir gecikme ekle (UI güncellemesi için)
    setTimeout(() => {
      app.quit();
    }, 500);
    return { success: true };
  } catch (error) {
    log(`Converter kapatma hatası: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

