import React from 'react';
import { Folder, FolderOpen } from 'lucide-react';

function FolderSelector({ outputPath, onPathChange, disabled }) {
  const handleSelectFolder = async () => {
    const result = await window.electronAPI.selectFolder();
    if (result.success) {
      onPathChange(result.path);
    }
  };

  const handleOpenFolder = async () => {
    if (outputPath) {
      await window.electronAPI.openFolder(outputPath);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-1">
      <button
        className="btn-secondary flex items-center gap-2"
        onClick={handleSelectFolder}
        disabled={disabled}
      >
        <Folder size={18} />
        Klasör Seç
      </button>

      {outputPath && (
        <>
          <div className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 truncate">
            {outputPath}
          </div>
          <button
            className="text-primary-500 hover:text-primary-400 transition-colors p-2"
            onClick={handleOpenFolder}
            title="Klasörü Aç"
          >
            <FolderOpen size={20} />
          </button>
        </>
      )}
    </div>
  );
}

export default FolderSelector;

