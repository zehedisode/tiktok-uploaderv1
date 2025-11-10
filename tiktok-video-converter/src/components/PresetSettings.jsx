import React from 'react';
import { Sparkles } from 'lucide-react';

const PRESETS = [
  {
    id: 'tiktok-default',
    name: 'TikTok Standart',
    icon: '🎵',
    desc: 'Klasik TikTok stili',
    settings: {
      videoPosition: 'center',
      textLayers: [
        {
          id: 1,
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
      ]
    }
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    icon: '📺',
    desc: 'YouTube Shorts optimize',
    settings: {
      videoPosition: 'center',
      textLayers: [
        {
          id: 1,
          enabled: true,
          template: 'Part {N}',
          fontFamily: 'Impact',
          fontSize: 90,
          fontColor: '#FF0000',
          borderWidth: 6,
          borderColor: '#FFFFFF',
          shadowEnabled: true,
          position: 'top',
          xAlign: 'center',
          yOffset: 60,
          xOffset: 0,
        }
      ]
    }
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    icon: '✨',
    desc: 'Sade ve şık',
    settings: {
      videoPosition: 'center',
      textLayers: [
        {
          id: 1,
          enabled: true,
          template: '#{N}',
          fontFamily: 'Arial',
          fontSize: 50,
          fontColor: '#FFFFFF',
          borderWidth: 2,
          borderColor: '#000000',
          shadowEnabled: false,
          position: 'bottom',
          xAlign: 'right',
          yOffset: 60,
          xOffset: -40,
        }
      ]
    }
  },
  {
    id: 'bold-impact',
    name: 'Cesur & Dikkat Çekici',
    icon: '💥',
    desc: 'Maksimum etki',
    settings: {
      videoPosition: 'center',
      textLayers: [
        {
          id: 1,
          enabled: true,
          template: 'PART {N}',
          fontFamily: 'Impact',
          fontSize: 120,
          fontColor: '#FFD700',
          borderWidth: 8,
          borderColor: '#000000',
          shadowEnabled: true,
          position: 'top',
          xAlign: 'center',
          yOffset: 100,
          xOffset: 0,
        },
        {
          id: 2,
          enabled: true,
          template: '▶ İzlemeye Devam Et',
          fontFamily: 'Arial Bold',
          fontSize: 40,
          fontColor: '#FFFFFF',
          borderWidth: 3,
          borderColor: '#000000',
          shadowEnabled: true,
          position: 'bottom',
          xAlign: 'center',
          yOffset: 80,
          xOffset: 0,
        }
      ]
    }
  },
  {
    id: 'gaming',
    name: 'Gaming Style',
    icon: '🎮',
    desc: 'Oyun videoları için',
    settings: {
      videoPosition: 'bottom',
      textLayers: [
        {
          id: 1,
          enabled: true,
          template: '🎮 Bölüm {N}',
          fontFamily: 'Impact',
          fontSize: 80,
          fontColor: '#00FF00',
          borderWidth: 5,
          borderColor: '#000000',
          shadowEnabled: true,
          position: 'top',
          xAlign: 'left',
          yOffset: 60,
          xOffset: 40,
        },
        {
          id: 2,
          enabled: true,
          template: 'GAMEPLAY',
          fontFamily: 'Impact',
          fontSize: 45,
          fontColor: '#FF0000',
          borderWidth: 3,
          borderColor: '#FFFFFF',
          shadowEnabled: true,
          position: 'top',
          xAlign: 'right',
          yOffset: 200,
          xOffset: -40,
        }
      ]
    }
  },
  {
    id: 'comedy',
    name: 'Komedi/Eğlence',
    icon: '😂',
    desc: 'Eğlenceli içerik',
    settings: {
      videoPosition: 'center',
      textLayers: [
        {
          id: 1,
          enabled: true,
          template: 'Part {N} 😂',
          fontFamily: 'Comic Sans MS Bold',
          fontSize: 75,
          fontColor: '#FF1493',
          borderWidth: 5,
          borderColor: '#FFFF00',
          shadowEnabled: true,
          position: 'top',
          xAlign: 'center',
          yOffset: 70,
          xOffset: 0,
        }
      ]
    }
  },
  {
    id: 'educational',
    name: 'Eğitim/Ders',
    icon: '📚',
    desc: 'Eğitim içeriği',
    settings: {
      videoPosition: 'top',
      textLayers: [
        {
          id: 1,
          enabled: true,
          template: 'Ders {N}',
          fontFamily: 'Times New Roman Bold',
          fontSize: 65,
          fontColor: '#FFFFFF',
          borderWidth: 3,
          borderColor: '#003366',
          shadowEnabled: true,
          position: 'bottom',
          xAlign: 'center',
          yOffset: 100,
          xOffset: 0,
        },
        {
          id: 2,
          enabled: true,
          template: '📚 Devamını İzle',
          fontFamily: 'Arial Bold',
          fontSize: 38,
          fontColor: '#FFD700',
          borderWidth: 2,
          borderColor: '#000000',
          shadowEnabled: true,
          position: 'bottom',
          xAlign: 'center',
          yOffset: 50,
          xOffset: 0,
        }
      ]
    }
  },
  {
    id: 'news',
    name: 'Haber/Bilgi',
    icon: '📰',
    desc: 'Haber tarzı',
    settings: {
      videoPosition: 'center',
      textLayers: [
        {
          id: 1,
          enabled: true,
          template: 'BÖLÜM {N}',
          fontFamily: 'Arial Bold',
          fontSize: 55,
          fontColor: '#FFFFFF',
          borderWidth: 0,
          borderColor: '#000000',
          shadowEnabled: false,
          position: 'bottom',
          xAlign: 'left',
          yOffset: 80,
          xOffset: 40,
        }
      ]
    }
  },
];

function PresetSettings({ setSettings }) {
  const applyPreset = (preset) => {
    let counter = 0;
    setSettings(prev => ({
      ...prev,
      ...preset.settings,
      // ID'leri yenile (unique ve predictable)
      textLayers: preset.settings.textLayers.map(l => ({
        ...l,
        id: Date.now() + (counter++)
      }))
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles size={24} className="text-primary-500" />
          Hazır Şablonlar
        </h3>
        <p className="text-sm text-gray-400">Popüler platformlara özel optimize edilmiş ayarlar</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className="p-4 bg-gray-900 border-2 border-gray-700 rounded-xl hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/20 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="text-4xl">{preset.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white group-hover:text-primary-400 transition-colors mb-1">
                  {preset.name}
                </h4>
                <p className="text-xs text-gray-500 mb-2">{preset.desc}</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>{preset.settings.textLayers.length} katman</span>
                  <span>•</span>
                  <span>{preset.settings.videoPosition === 'center' ? 'Orta' : preset.settings.videoPosition === 'top' ? 'Üst' : 'Alt'}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-6 bg-blue-900/20 border border-blue-700/50 rounded-xl">
        <div className="flex items-start gap-3">
          <Sparkles size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <strong className="block mb-2">💡 Preset Kullanım İpuçları:</strong>
            <ul className="space-y-1 text-xs">
              <li>• Bir preset seçtikten sonra istediğiniz gibi özelleştirebilirsiniz</li>
              <li>• Her preset farklı platform için optimize edilmiştir</li>
              <li>• Yazı katmanlarını ekleyip çıkarabilirsiniz</li>
              <li>• "Yazılar" tab'ından detaylı düzenleyebilirsiniz</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PresetSettings;

