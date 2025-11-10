import React, { memo, useMemo } from 'react';
import { Eye, Video as VideoIcon } from 'lucide-react';
import { PREVIEW, VIDEO_POSITION } from '../constants';

const LivePreview = memo(({ videoPosition, textLayers }) => {
  // Aktif katmanları filtrele (memoized)
  const activeLayers = useMemo(() => 
    textLayers.filter(l => l.enabled), 
    [textLayers]
  );

  // Video pozisyonuna göre Y koordinatı hesapla
  const getVideoY = useMemo(() => {
    switch (videoPosition) {
      case VIDEO_POSITION.TOP:
        return '0%';
      case VIDEO_POSITION.BOTTOM:
        return '50%';
      case VIDEO_POSITION.CENTER:
      default:
        return '25%';
    }
  }, [videoPosition]);

  // Text layer pozisyonu hesapla
  const getTextStyle = (layer, index) => {
    const scale = PREVIEW.SCALE;
    const style = {
      position: 'absolute',
      fontSize: `${layer.fontSize / scale}px`,
      fontFamily: layer.fontFamily.includes('Impact') ? 'Impact, sans-serif' : 
                   layer.fontFamily.includes('Comic') ? '"Comic Sans MS", cursive' :
                   layer.fontFamily.includes('Times') ? '"Times New Roman", serif' :
                   layer.fontFamily.includes('Verdana') ? 'Verdana, sans-serif' : 'Arial, sans-serif',
      fontWeight: layer.fontFamily.includes('Bold') ? 'bold' : 'normal',
      color: layer.fontColor,
      WebkitTextStroke: `${Math.max(0.5, layer.borderWidth / scale)}px ${layer.borderColor}`,
      textShadow: layer.shadowEnabled ? '2px 2px 3px rgba(0,0,0,0.7)' : 'none',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 10 + index, // Her katman farklı z-index
    };

    // Y pozisyon
    if (layer.position === 'top') {
      style.top = `${layer.yOffset / scale}px`;
    } else {
      style.bottom = `${layer.yOffset / scale}px`;
    }

    // X pozisyon ve hizalama
    switch (layer.xAlign) {
      case 'left':
        style.left = `${Math.max(5, layer.xOffset / scale)}px`;
        break;
      case 'right':
        style.right = `${Math.max(5, Math.abs(layer.xOffset) / scale)}px`;
        break;
      case 'center':
      default:
        style.left = '50%';
        style.transform = `translateX(calc(-50% + ${layer.xOffset / scale}px))`;
        break;
    }

    return style;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-primary-600/30 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-600/20 rounded-lg">
            <Eye size={18} className="text-primary-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Canlı Önizleme</h4>
            <p className="text-xs text-gray-500">Gerçek zamanlı</p>
          </div>
        </div>
        <div className="px-2 py-1 bg-primary-600/20 rounded-md border border-primary-600/40">
          <div className="text-xs font-bold text-primary-400">9:16</div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex justify-center">
        <div 
          className="relative bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-primary-600/50"
          style={{ width: '225px', height: '400px' }} // 1080x1920 scaled to 225x400
        >
          {/* Video Area */}
          <div
            className="absolute left-0 right-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900"
            style={{
              top: getVideoY,
              height: '50%',
              zIndex: 1,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <VideoIcon size={32} className="text-white/50 mx-auto mb-2" />
                <div className="text-white/70 text-xs font-bold">16:9 VIDEO</div>
              </div>
            </div>
          </div>

          {/* Text Layers */}
          {activeLayers.map((layer, index) => (
            <div
              key={layer.id}
              style={getTextStyle(layer, index)}
              className="pointer-events-none"
            >
              {layer.template.replace('{N}', '1')}
            </div>
          ))}

          {/* Grid Overlay (optional) */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            <div className="absolute top-0 left-0 right-0 h-px bg-primary-500/20" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-primary-500/20" />
            <div className="absolute top-0 bottom-0 left-0 w-px bg-primary-500/20" />
            <div className="absolute top-0 bottom-0 right-0 w-px bg-primary-500/20" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-primary-500/10" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-primary-500/10" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-400">{activeLayers.length} Katman</span>
          </div>
          <div className="text-gray-500">
            {videoPosition === 'top' ? '⬆️ Üstte' : videoPosition === 'bottom' ? '⬇️ Altta' : '⏺️ Ortada'}
          </div>
        </div>
      </div>
    </div>
  );
});

LivePreview.displayName = 'LivePreview';

export default LivePreview;

