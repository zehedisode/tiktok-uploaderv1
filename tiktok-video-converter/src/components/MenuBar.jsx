import React from 'react';
import { Settings, FileText } from 'lucide-react';

function MenuBar({ onSettingsClick, onNotesClick }) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">YT</span>
          </div>
          <span className="font-semibold text-white">YouTube Converter</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onNotesClick}
          className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
          title="İçerik Notları"
        >
          <FileText size={20} />
        </button>
        <button
          onClick={onSettingsClick}
          className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
          title="Ayarlar (Ctrl+S)"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}

export default MenuBar;

