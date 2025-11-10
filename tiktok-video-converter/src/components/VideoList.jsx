import React from 'react';
import VideoCard from './VideoCard';

function VideoList({ videos, onCancel, onOpenFolder, onUploadToTikTok }) {
  if (videos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 opacity-20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            Henüz video eklenmedi
          </h3>
          <p className="text-gray-500">
            Yukarıdaki alana YouTube linklerini ekleyerek başlayın
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-2">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onCancel={onCancel}
            onOpenFolder={onOpenFolder}
            onUploadToTikTok={onUploadToTikTok}
          />
        ))}
    </div>
  );
}

export default VideoList;

