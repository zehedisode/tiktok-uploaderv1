import React, { memo } from 'react';
import ProgressBar from './ProgressBar';
import { X, FolderOpen, CheckCircle, AlertCircle, Loader, Upload } from 'lucide-react';

const VideoCard = memo(({ video, onCancel, onOpenFolder, onUploadToTikTok }) => {
  const getStatusIcon = () => {
    switch (video.stage) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'pending':
        return <Loader className="text-gray-500" size={20} />;
      default:
        return <Loader className="text-primary-500 animate-spin" size={20} />;
    }
  };

  const getStageText = () => {
    switch (video.stage) {
      case 'info':
        return 'Bilgiler alınıyor...';
      case 'downloading':
        return 'İndiriliyor';
      case 'converting':
        return 'Dikey formata çeviriliyor';
      case 'splitting':
        return 'Parçalara bölünüyor';
      case 'adding-text':
        return 'Part yazıları ekleniyor';
      case 'completed':
        return 'Tamamlandı';
      case 'error':
        return 'Hata';
      case 'pending':
        return 'Beklemede';
      default:
        return 'İşleniyor';
    }
  };

  return (
    <div className="card animate-slide-in">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-40 h-28 object-cover rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-40 h-28 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </div>
          )}
        </div>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 mr-4">
              <h3 className="text-lg font-semibold text-white truncate">
                {video.title}
              </h3>
              <p className="text-sm text-gray-400 truncate">{video.url}</p>
            </div>

            <button
              onClick={() => onCancel(video.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              disabled={video.stage === 'completed'}
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <ProgressBar progress={video.progress} />

          {/* Durum */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium text-gray-300">
                {getStageText()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{video.message}</span>

        {video.stage === 'completed' && video.outputFiles?.length > 0 && (
          <>
            <button
              onClick={onOpenFolder}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm font-medium shadow-lg hover:shadow-xl"
            >
              <FolderOpen size={16} />
              <span>Klasörü Aç</span>
            </button>
            <button
              onClick={() => onUploadToTikTok && onUploadToTikTok(video)}
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm font-medium shadow-lg hover:shadow-xl"
            >
              <Upload size={16} />
              <span>TikTok'a Yükle</span>
            </button>
          </>
        )}
            </div>
          </div>

          {/* Detaylı Hata Mesajı */}
          {video.stage === 'error' && video.errorDetails && (
            <div className="mt-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
              <div className="text-xs text-red-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                {video.errorDetails}
              </div>
            </div>
          )}

          {/* Debug Log */}
          {video.debugLog && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                Debug Log (Geliştiriciler için)
              </summary>
              <div className="mt-2 p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                {video.debugLog}
              </div>
            </details>
          )}

          {/* Output Files */}
          {video.outputFiles?.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              {video.outputFiles.length} dosya oluşturuldu
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;

