import React, { useState, useEffect, useCallback } from 'react';
import MenuBar from './components/MenuBar';
import FolderSelector from './components/FolderSelector';
import VideoList from './components/VideoList';
import AdvancedSettingsModal from './components/AdvancedSettingsModal';
import NotesModal from './components/NotesModal';
import { Download, Trash2 } from 'lucide-react';

function App() {
  const [videos, setVideos] = useState([]);
  const [outputPath, setOutputPath] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState({
    maxConcurrent: 3,
    notifications: true,
    partTextTemplate: 'Part {N}',
    videoPosition: 'center',
    textFontSize: 70,
    textPosition: 'top',
    textYOffset: 80,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Tamamlanan videoları otomatik notlara kaydet
  const saveVideoToNotes = useCallback(async (video) => {
    try {
      const note = {
        id: Date.now().toString(),
        title: video.title || 'Video',
        youtubeLink: video.url,
        note: `${video.outputFiles?.length || 0} parça halinde işlendi`,
        episode: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await window.electronAPI.saveNote(note);
      console.log('Video otomatik olarak notlara kaydedildi:', video.title);
    } catch (error) {
      console.error('Otomatik not kaydetme hatası:', error);
    }
  }, []);

  // Callback fonksiyonlarını önce tanımla
  const updateVideoProgress = useCallback((data) => {
    setVideos((prevVideos) =>
      prevVideos.map((video) => {
        if (video.id === data.videoId) {
          const updatedVideo = {
              ...video,
              stage: data.stage,
              progress: data.progress,
              message: data.message,
              title: data.title || video.title,
              thumbnail: data.thumbnail || video.thumbnail,
              outputFiles: data.outputFiles || video.outputFiles,
              errorDetails: data.errorDetails || video.errorDetails,
              debugLog: data.debugLog || video.debugLog,
          };
          
          // Video tamamlandığında otomatik notlara kaydet
          if (data.stage === 'completed' && video.stage !== 'completed') {
            saveVideoToNotes(updatedVideo);
          }
          
          return updatedVideo;
        }
        return video;
      })
    );
  }, [saveVideoToNotes]);

  const handleStartAll = useCallback(async () => {
    if (!outputPath) {
      window.alert('Lütfen önce bir çıktı klasörü seçin.');
      return;
    }

    if (videos.length === 0) {
      window.alert('Lütfen en az bir video ekleyin.');
      return;
    }

    setIsProcessing(true);

    // Maksimum eşzamanlı işlem sınırı
    const maxConcurrent = settings.maxConcurrent || 3;
    const pendingVideos = videos.filter((v) => v.stage === 'pending');
    
    for (let i = 0; i < pendingVideos.length; i += maxConcurrent) {
      const batch = pendingVideos.slice(i, i + maxConcurrent);
      await Promise.all(
        batch.map((video) =>
          window.electronAPI.processVideo({
            url: video.url,
            outputPath: outputPath,
            videoId: video.id,
          })
        )
      );
    }

    setIsProcessing(false);

    if (settings.notifications) {
      new window.Notification('İşlem Tamamlandı', {
        body: `${videos.length} video başarıyla işlendi!`,
      });
    }
  }, [outputPath, videos, settings]);

  const handleClearAll = useCallback(() => {
    const hasProcessing = videos.some(v => v.stage !== 'completed' && v.stage !== 'error' && v.stage !== 'pending');
    
    if (hasProcessing) {
      const confirm = window.confirm(
        'Bazı videolar hala işleniyor. Temizlemek istediğinizden emin misiniz?'
      );
      if (!confirm) return;
    }

    // Sadece tamamlananları veya hata alanları temizle
    const confirmed = window.confirm(`${videos.length} video silinecek. Emin misiniz?`);
    if (confirmed) {
      setVideos([]);
      setUrlInput('');
    }
  }, [videos]);

  const loadSettings = async () => {
    const loadedSettings = await window.electronAPI.getSettings();
    setSettings(loadedSettings);
    if (loadedSettings.lastOutputPath) {
      setOutputPath(loadedSettings.lastOutputPath);
    }
  };

  useEffect(() => {
    // Ayarları yükle
    loadSettings();

    // Progress dinleyicisini ekle
    window.electronAPI.onVideoProgress((data) => {
      updateVideoProgress(data);
    });

    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      // Ctrl/Cmd+S: Ayarları aç
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setShowSettings(true);
      }
      // Ctrl/Cmd+,: Ayarları aç (alternatif)
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }
      // ESC: Modal kapat
      if (e.key === 'Escape' && showSettings) {
        setShowSettings(false);
      }
      // Ctrl/Cmd+Enter: Başlat
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isProcessing && videos.length > 0 && outputPath) {
        e.preventDefault();
        handleStartAll();
      }
      // Ctrl/Cmd+V: Paste (textarea odakta değilse)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && 
          document.activeElement.tagName !== 'TEXTAREA' && 
          document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        window.navigator.clipboard.readText().then(text => {
          if (text.includes('youtube.com') || text.includes('youtu.be')) {
            setUrlInput(prev => prev ? prev + '\n' + text : text);
            // URL input'a focus
            window.setTimeout(() => {
              const textarea = document.querySelector('textarea');
              if (textarea) textarea.focus();
            }, 0);
          }
        });
      }
      // Ctrl/Cmd+L: Tümünü temizle
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleClearAll();
      }
      // F5: Refresh
      if (e.key === 'F5') {
        e.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.electronAPI.removeVideoProgressListener();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSettings, isProcessing, videos.length, outputPath, handleClearAll, handleStartAll, updateVideoProgress]);

  const handleAddUrls = () => {
    const urls = urlInput
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      window.alert('Lütfen en az bir YouTube linki girin.');
      return;
    }

    const newVideos = urls.map((url, index) => ({
      id: `video-${Date.now()}-${index}`,
      url,
      title: 'Video yükleniyor...',
      thumbnail: '',
      stage: 'pending',
      progress: 0,
      message: 'Beklemede',
      outputFiles: [],
    }));

    setVideos((prev) => [...prev, ...newVideos]);
    setUrlInput('');
  };

  const handleCancelVideo = useCallback(async (videoId) => {
    await window.electronAPI.cancelTask(videoId);
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  }, []);

  const handleOpenFolder = useCallback(() => {
    window.electronAPI.openFolder(outputPath);
  }, [outputPath]);

  const handleUploadToTikTok = useCallback(async (video) => {
    if (!video.outputFiles || video.outputFiles.length === 0) {
      return;
    }

    // Video'nun çıktı klasörünü bul (outputPath kullan)
    const videoOutputPath = outputPath || video.outputPath;
    if (!videoOutputPath) {
      return;
    }

    try {
      // Uploader'ı başlat
      const result = await window.electronAPI.startTikTokUploader(videoOutputPath);
      
      if (!result.success) {
        return;
      }
      
      // Converter'ı kapat (kısa bir gecikme ile)
      setTimeout(() => {
        window.electronAPI.closeConverter();
      }, 500);
    } catch (error) {
      console.error('TikTok uploader başlatma hatası:', error);
    }
  }, [outputPath]);


  // Drag & Drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const text = e.dataTransfer.getData('text');
    if (text) {
      setUrlInput(prev => prev ? `${prev}\n${text}` : text);
    }
  }, []);

  const handlePaste = useCallback((e) => {
    // Ctrl+V ile toplu yapıştırma
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('text');
    
    if (pastedText && pastedText.includes('youtube.com')) {
      e.preventDefault();
      setUrlInput(prev => prev ? `${prev}\n${pastedText}` : pastedText);
    }
  }, []);

  const completedCount = videos.filter((v) => v.stage === 'completed').length;

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <MenuBar 
        onSettingsClick={() => setShowSettings(true)}
        onNotesClick={() => setShowNotes(true)}
      />
      
      <AdvancedSettingsModal 
        isOpen={showSettings} 
        onClose={() => {
          setShowSettings(false);
          loadSettings(); // Ayarları yeniden yükle
        }} 
      />

      <NotesModal 
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
      />

      <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              YouTube to TikTok Converter
            </h1>
            <p className="text-gray-400 mt-1">
              YouTube videolarını TikTok formatına (9:16) dönüştürün
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Tamamlanan</div>
              <div className="text-2xl font-bold text-primary-500">
                {completedCount} / {videos.length}
              </div>
            </div>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={handleStartAll}
              disabled={
                isProcessing || videos.length === 0 || !outputPath
              }
            >
              <Download size={18} />
              {isProcessing ? 'İşleniyor...' : 'Tümünü Başlat'}
            </button>
          </div>
        </div>

        {/* URL Girişi */}
        <div 
          className="card relative"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <label className="block text-sm font-medium text-gray-300 mb-2">
            YouTube Linkleri 
            <span className="text-xs text-gray-500 ml-2">
              (Her satıra bir link • Drag & Drop • Ctrl+V)
            </span>
          </label>
          <textarea
            className="textarea w-full h-24"
            placeholder="https://www.youtube.com/watch?v=... (veya buraya sürükleyip bırakın)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onPaste={handlePaste}
            disabled={isProcessing}
          />
          <button
            className="btn-primary mt-3"
            onClick={handleAddUrls}
            disabled={isProcessing || !urlInput.trim()}
          >
            Video Ekle
          </button>
        </div>

        {/* Klasör Seçici ve Kontroller */}
        <div className="card flex items-center justify-between">
          <FolderSelector
            outputPath={outputPath}
            onPathChange={setOutputPath}
            disabled={isProcessing}
          />

          <div className="flex gap-3">
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={handleClearAll}
              disabled={videos.length === 0}
            >
              <Trash2 size={18} />
              Temizle
            </button>
          </div>
        </div>

        {/* Video Listesi */}
        <div className="flex-1 overflow-hidden">
          <VideoList
            videos={videos}
            onCancel={handleCancelVideo}
            onOpenFolder={handleOpenFolder}
            onUploadToTikTok={handleUploadToTikTok}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

