import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Plus, Trash2, Copy, Eye, Type, Video, Bell, Sparkles } from 'lucide-react';
import LivePreview from './LivePreview';
import PresetSettings from './PresetSettings';

const FONT_OPTIONS = [
  { value: 'Arial Bold', label: 'Arial Bold', file: 'arialbd.ttf' },
  { value: 'Arial', label: 'Arial', file: 'arial.ttf' },
  { value: 'Impact', label: 'Impact', file: 'impact.ttf' },
  { value: 'Comic Sans MS Bold', label: 'Comic Sans Bold', file: 'comicbd.ttf' },
  { value: 'Times New Roman Bold', label: 'Times Bold', file: 'timesbd.ttf' },
  { value: 'Verdana Bold', label: 'Verdana Bold', file: 'verdanab.ttf' },
];

function AdvancedSettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('video');
  const [settings, setSettings] = useState({
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
    ],
    maxConcurrent: 3,
    notifications: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const saved = await window.electronAPI.getSettings();
    if (saved.textLayers) {
      setSettings(prev => ({ ...prev, ...saved }));
    }
  };

  const handleSave = async () => {
    await window.electronAPI.saveSettings(settings);
    onClose();
  };

  // Text Layer Management
  const addTextLayer = () => {
    const newLayer = {
      id: Date.now(),
      enabled: true,
      template: 'New Text',
      fontFamily: 'Arial Bold',
      fontSize: 60,
      fontColor: '#FFFFFF',
      borderWidth: 3,
      borderColor: '#000000',
      shadowEnabled: true,
      position: 'bottom',
      xAlign: 'center',
      yOffset: 100,
      xOffset: 0,
    };
    setSettings(prev => ({
      ...prev,
      textLayers: [...prev.textLayers, newLayer]
    }));
  };

  const duplicateLayer = (layer) => {
    const newLayer = { ...layer, id: Date.now() };
    setSettings(prev => ({
      ...prev,
      textLayers: [...prev.textLayers, newLayer]
    }));
  };

  const deleteLayer = (id) => {
    if (settings.textLayers.length === 1) {
      window.alert('En az bir yazı katmanı olmalı!');
      return;
    }
    setSettings(prev => ({
      ...prev,
      textLayers: prev.textLayers.filter(l => l.id !== id)
    }));
  };

  const updateLayer = (id, key, value) => {
    setSettings(prev => ({
      ...prev,
      textLayers: prev.textLayers.map(l =>
        l.id === id ? { ...l, [key]: value } : l
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-600/20 rounded-xl">
              <SettingsIcon className="text-primary-500" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Gelişmiş Ayarlar</h2>
              <p className="text-sm text-gray-400">Video ve yazı özelleştirmeleri</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Tabs */}
          <div className="w-48 bg-gray-900 border-r border-gray-700 p-4 space-y-2 flex-shrink-0 overflow-y-auto">
            <TabButton
              icon={<Video size={20} />}
              label="Video"
              active={activeTab === 'video'}
              onClick={() => setActiveTab('video')}
            />
            <TabButton
              icon={<Type size={20} />}
              label="Yazılar"
              count={settings.textLayers.length}
              active={activeTab === 'text'}
              onClick={() => setActiveTab('text')}
            />
            <TabButton
              icon={<Sparkles size={20} />}
              label="Presets"
              active={activeTab === 'presets'}
              onClick={() => setActiveTab('presets')}
            />
            <TabButton
              icon={<Bell size={20} />}
              label="Sistem"
              active={activeTab === 'system'}
              onClick={() => setActiveTab('system')}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex gap-6 p-6 overflow-hidden">
            {/* Settings Panel */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              {activeTab === 'video' && <VideoSettings settings={settings} setSettings={setSettings} />}
              {activeTab === 'text' && (
                <TextSettings
                  settings={settings}
                  addLayer={addTextLayer}
                  deleteLayer={deleteLayer}
                  duplicateLayer={duplicateLayer}
                  updateLayer={updateLayer}
                />
              )}
              {activeTab === 'presets' && <PresetSettings settings={settings} setSettings={setSettings} />}
              {activeTab === 'system' && <SystemSettings settings={settings} setSettings={setSettings} />}
            </div>

            {/* Live Preview - Sticky */}
            {(activeTab === 'video' || activeTab === 'text' || activeTab === 'presets') && (
              <div className="w-72 flex-shrink-0 overflow-y-auto">
                <div className="sticky top-0">
                  <LivePreview 
                    videoPosition={settings.videoPosition}
                    textLayers={settings.textLayers}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary">İptal</button>
          <button onClick={handleSave} className="btn-primary px-8 shadow-lg hover:shadow-primary-600/50">
            Kaydet ve Uygula
          </button>
        </div>
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ icon, label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? 'bg-primary-600 text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs bg-gray-700 px-2 py-1 rounded-full">{count}</span>
      )}
    </button>
  );
}

// Video Settings Tab
function VideoSettings({ settings, setSettings }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Video size={24} className="text-primary-500" />
          Video Konumlandırma
        </h3>
        <p className="text-sm text-gray-400 mb-6">9:16 canvas içinde videonun yerini belirleyin</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { value: 'top', label: 'Üstte', desc: 'Video üstte, alt siyah' },
          { value: 'center', label: 'Ortada', desc: 'Üst/alt siyah (önerilen)' },
          { value: 'bottom', label: 'Altta', desc: 'Video altta, üst siyah' },
        ].map(pos => (
          <button
            key={pos.value}
            onClick={() => setSettings(prev => ({ ...prev, videoPosition: pos.value }))}
            className={`p-6 rounded-xl border-2 transition-all ${
              settings.videoPosition === pos.value
                ? 'border-primary-500 bg-primary-500/20 shadow-lg shadow-primary-500/50'
                : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
            }`}
          >
            <div className="text-4xl mb-3">{pos.value === 'top' ? '⬆️' : pos.value === 'center' ? '⏺️' : '⬇️'}</div>
            <div className="text-lg font-semibold text-white mb-1">{pos.label}</div>
            <div className="text-xs text-gray-400">{pos.desc}</div>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-6 bg-blue-600/10 border border-blue-600/30 rounded-xl">
        <div className="flex gap-3">
          <div className="text-blue-400 text-2xl">ℹ️</div>
          <div>
            <h4 className="text-blue-300 font-semibold mb-2">Nasıl Çalışır?</h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• <strong>16:9 videolar</strong> kırpılmaz, tam olarak korunur</li>
              <li>• Video seçtiğiniz konuma yerleştirilir</li>
              <li>• Boş alanlar <strong>siyah</strong> kalır (letterbox)</li>
              <li>• Canlı önizlemeyi <strong>sağda</strong> görebilirsiniz →</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Text Settings Tab
function TextSettings({ settings, addLayer, deleteLayer, duplicateLayer, updateLayer }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Type size={24} className="text-primary-500" />
            Yazı Katmanları
          </h3>
          <p className="text-sm text-gray-400 mt-1">Her video için birden fazla yazı ekleyin</p>
        </div>
        <button onClick={addLayer} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Yeni Katman
        </button>
      </div>

      <div className="space-y-4">
        {settings.textLayers.map((layer, index) => (
          <TextLayerCard
            key={layer.id}
            layer={layer}
            index={index}
            onUpdate={updateLayer}
            onDelete={deleteLayer}
            onDuplicate={duplicateLayer}
          />
        ))}
      </div>
    </div>
  );
}

// Text Layer Card Component
function TextLayerCard({ layer, index, onUpdate, onDelete, onDuplicate }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className={`bg-gray-900 rounded-xl border-2 overflow-hidden transition-all ${
      layer.enabled ? 'border-primary-600/50' : 'border-gray-700'
    }`}>
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/70 to-gray-900/70">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={layer.enabled}
              onChange={(e) => onUpdate(layer.id, 'enabled', e.target.checked)}
              className="w-5 h-5 rounded border-2 border-gray-600 bg-gray-700 checked:bg-primary-600 checked:border-primary-600 cursor-pointer"
            />
          </label>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white flex items-center gap-2">
              <Type size={14} className="text-primary-500" />
              Katman {index + 1}
              {!layer.enabled && <span className="text-xs text-gray-500">(Kapalı)</span>}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {layer.template} • {layer.fontFamily} • {layer.fontSize}pt
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(layer)}
            className="p-2 hover:bg-primary-600/20 rounded-lg transition-colors group"
            title="Kopyala"
          >
            <Copy size={16} className="text-gray-400 group-hover:text-primary-400" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-2 rounded-lg transition-colors ${
              expanded ? 'bg-primary-600/20 text-primary-400' : 'hover:bg-gray-700 text-gray-400'
            }`}
            title={expanded ? 'Gizle' : 'Düzenle'}
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onDelete(layer.id)}
            className="p-2 hover:bg-red-600/20 rounded-lg transition-colors group"
            title="Sil"
          >
            <Trash2 size={16} className="text-gray-400 group-hover:text-red-400" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Template */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Yazı Şablonu <span className="text-xs text-gray-500">({'{N}'} = Part numarası)</span>
            </label>
            <input
              type="text"
              value={layer.template}
              onChange={(e) => onUpdate(layer.id, 'template', e.target.value)}
              className="input w-full font-medium"
              placeholder="Part {N}"
            />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {['Part {N}', 'Bölüm {N}', '#{N}', 'Episode {N}', '{N}. Bölüm', 'EP {N}', '🎬 {N}', 'Part {N} 📺'].map(t => (
                <button
                  key={t}
                  onClick={() => onUpdate(layer.id, 'template', t)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    layer.template === t
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-2 p-2 bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-400">
                <strong className="text-primary-400">Önizleme:</strong> {layer.template.replace('{N}', '1')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Font Family */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Font</label>
              <select
                value={layer.fontFamily}
                onChange={(e) => onUpdate(layer.id, 'fontFamily', e.target.value)}
                className="input w-full"
              >
                {FONT_OPTIONS.map(font => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center justify-between">
                <span>Font Boyutu</span>
                <span className="text-primary-400 text-lg">{layer.fontSize}pt</span>
              </label>
              <input
                type="range"
                min="30"
                max="150"
                step="5"
                value={layer.fontSize}
                onChange={(e) => onUpdate(layer.id, 'fontSize', parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>30pt</span>
                <span>90pt</span>
                <span>150pt</span>
              </div>
            </div>

            {/* Font Color */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Yazı Rengi</label>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <input
                    type="color"
                    value={layer.fontColor}
                    onChange={(e) => onUpdate(layer.id, 'fontColor', e.target.value)}
                    className="w-14 h-10 rounded-lg cursor-pointer border-2 border-gray-600"
                  />
                  <div 
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{ 
                      background: layer.fontColor,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)'
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={layer.fontColor}
                  onChange={(e) => onUpdate(layer.id, 'fontColor', e.target.value.toUpperCase())}
                  className="input flex-1 font-mono"
                  placeholder="#FFFFFF"
                  maxLength={7}
                />
              </div>
              {/* Popüler renkler */}
              <div className="mt-2 flex flex-wrap gap-2">
                {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700'].map(color => (
                  <button
                    key={color}
                    onClick={() => onUpdate(layer.id, 'fontColor', color)}
                    className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                      layer.fontColor === color ? 'border-primary-500 scale-110 shadow-lg' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            {/* Border Color */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Kenar Rengi</label>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <input
                    type="color"
                    value={layer.borderColor}
                    onChange={(e) => onUpdate(layer.id, 'borderColor', e.target.value)}
                    className="w-14 h-10 rounded-lg cursor-pointer border-2 border-gray-600"
                  />
                </div>
                <input
                  type="text"
                  value={layer.borderColor}
                  onChange={(e) => onUpdate(layer.id, 'borderColor', e.target.value.toUpperCase())}
                  className="input flex-1 font-mono"
                  placeholder="#000000"
                  maxLength={7}
                />
              </div>
              {/* Popüler kenar renkleri */}
              <div className="mt-2 flex flex-wrap gap-2">
                {['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#FFD700'].map(color => (
                  <button
                    key={color}
                    onClick={() => onUpdate(layer.id, 'borderColor', color)}
                    className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                      layer.borderColor === color ? 'border-primary-500 scale-110 shadow-lg' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Border Width */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center justify-between">
                <span>Kenar Kalınlığı</span>
                <span className="text-primary-400">{layer.borderWidth}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={layer.borderWidth}
                onChange={(e) => onUpdate(layer.id, 'borderWidth', parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0</span>
                <span>10</span>
              </div>
            </div>
          </div>

          {/* Position */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Dikey Konum</label>
              <select
                value={layer.position}
                onChange={(e) => onUpdate(layer.id, 'position', e.target.value)}
                className="input w-full"
              >
                <option value="top">Üstte</option>
                <option value="bottom">Altta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Yatay Hiza</label>
              <select
                value={layer.xAlign}
                onChange={(e) => onUpdate(layer.id, 'xAlign', e.target.value)}
                className="input w-full"
              >
                <option value="left">Sol</option>
                <option value="center">Orta</option>
                <option value="right">Sağ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Shadow</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layer.shadowEnabled}
                  onChange={(e) => onUpdate(layer.id, 'shadowEnabled', e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm text-gray-400">Aktif</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center justify-between">
                <span>↕️ Dikey Mesafe</span>
                <span className="text-primary-400">{layer.yOffset}px</span>
              </label>
              <input
                type="range"
                min="10"
                max="400"
                step="10"
                value={layer.yOffset}
                onChange={(e) => onUpdate(layer.id, 'yOffset', parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="text-xs text-gray-600 mt-1 text-center">
                {layer.position === 'top' ? 'Yukarıdan' : 'Aşağıdan'} uzaklık
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center justify-between">
                <span>↔️ Yatay Kaydır</span>
                <span className="text-primary-400">{layer.xOffset}px</span>
              </label>
              <input
                type="range"
                min="-500"
                max="500"
                step="10"
                value={layer.xOffset}
                onChange={(e) => onUpdate(layer.id, 'xOffset', parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>← Sol</span>
                <span>Orta</span>
                <span>Sağ →</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// System Settings Tab
function SystemSettings({ settings, setSettings }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Bell size={24} className="text-primary-500" />
          Sistem Ayarları
        </h3>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-700">
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Eşzamanlı İşlem Sayısı: {settings.maxConcurrent}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={settings.maxConcurrent}
            onChange={(e) => setSettings(prev => ({ ...prev, maxConcurrent: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>1 (Yavaş, düşük CPU)</span>
            <span>5 (Hızlı, yüksek CPU)</span>
          </div>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-300">Bildirimler</div>
            <div className="text-xs text-gray-500 mt-1">İşlem tamamlandığında bildirim göster</div>
          </div>
          <label className="relative inline-block w-14 h-7">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all shadow-lg"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

export default AdvancedSettingsModal;

