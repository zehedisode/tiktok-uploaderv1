// FFmpeg process tracking için
const activeProcesses = new Map(); // videoId -> { command, timeout, startTime }

/**
 * Aktif bir FFmpeg process'ini kaydet
 */
function trackProcess(videoId, command, timeout) {
  activeProcesses.set(videoId, {
    command,
    timeout,
    startTime: Date.now(),
  });
}

/**
 * Process'i takipten çıkar
 */
function untrackProcess(videoId) {
  const process = activeProcesses.get(videoId);
  if (process) {
    if (process.timeout) {
      clearTimeout(process.timeout);
    }
    activeProcesses.delete(videoId);
  }
}

/**
 * Process'i iptal et (kill)
 */
function cancelProcess(videoId) {
  const process = activeProcesses.get(videoId);
  if (process) {
    try {
      if (process.command && typeof process.command.kill === 'function') {
        process.command.kill('SIGKILL');
      }
      if (process.timeout) {
        clearTimeout(process.timeout);
      }
      activeProcesses.delete(videoId);
      return true;
    } catch (error) {
      console.error(`Process kill hatası (${videoId}):`, error.message);
      return false;
    }
  }
  return false;
}

/**
 * Tüm aktif process'leri listele
 */
function getActiveProcesses() {
  return Array.from(activeProcesses.keys());
}

/**
 * Tüm process'leri temizle (uygulama kapanırken)
 */
function cleanupAllProcesses() {
  for (const [videoId, process] of activeProcesses.entries()) {
    try {
      if (process.command && typeof process.command.kill === 'function') {
        process.command.kill('SIGKILL');
      }
      if (process.timeout) {
        clearTimeout(process.timeout);
      }
    } catch (error) {
      // Sessizce devam et
    }
  }
  activeProcesses.clear();
}

module.exports = {
  trackProcess,
  untrackProcess,
  cancelProcess,
  getActiveProcesses,
  cleanupAllProcesses,
};

