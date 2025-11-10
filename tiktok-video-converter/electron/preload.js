const { contextBridge, ipcRenderer } = require('electron');

// Renderer process için güvenli API expose et
contextBridge.exposeInMainWorld('electronAPI', {
  // Klasör seçimi
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Video işlemleri
  getVideoInfo: (url) => ipcRenderer.invoke('get-video-info', url),
  processVideo: (data) => ipcRenderer.invoke('process-video', data),
  cancelTask: (videoId) => ipcRenderer.invoke('cancel-task', videoId),

  // Dosya sistemi
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  checkDiskSpace: (path) => ipcRenderer.invoke('check-disk-space', path),

  // Ayarlar
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // TikTok işlemleri (basitleştirilmiş)
  openTikTokUpload: () => ipcRenderer.invoke('open-tiktok-upload'),
  startTikTokUploader: (folderPath) => ipcRenderer.invoke('start-tiktok-uploader', folderPath),
  closeConverter: () => ipcRenderer.invoke('close-converter'),

  // Notlar
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNote: (note) => ipcRenderer.invoke('save-note', note),
  deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),

  // External link
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Progress dinleyicileri
  onVideoProgress: (callback) => {
    ipcRenderer.on('video-progress', (event, data) => callback(data));
  },

  // Dinleyicileri kaldır
  removeVideoProgressListener: () => {
    ipcRenderer.removeAllListeners('video-progress');
  },
});

