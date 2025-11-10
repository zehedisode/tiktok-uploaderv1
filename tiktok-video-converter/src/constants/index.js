// Video Constants
export const VIDEO_ASPECT_RATIO = {
  SOURCE: '16:9',
  TARGET: '9:16',
  TARGET_WIDTH: 1080,
  TARGET_HEIGHT: 1920,
};

export const VIDEO_POSITION = {
  TOP: 'top',
  CENTER: 'center',
  BOTTOM: 'bottom',
};

// Text Layer Constants
export const TEXT_DEFAULTS = {
  FONT_SIZE: 70,
  FONT_FAMILY: 'Arial Bold',
  FONT_COLOR: '#FFFFFF',
  BORDER_WIDTH: 4,
  BORDER_COLOR: '#000000',
  SHADOW_ENABLED: true,
  Y_OFFSET: 80,
  X_OFFSET: 0,
  POSITION: 'top',
  X_ALIGN: 'center',
  TEMPLATE: 'Part {N}',
};

// Font Options
export const FONT_OPTIONS = [
  { value: 'Arial Bold', label: 'Arial Bold', file: 'arialbd.ttf' },
  { value: 'Arial', label: 'Arial', file: 'arial.ttf' },
  { value: 'Impact', label: 'Impact', file: 'impact.ttf' },
  { value: 'Comic Sans MS Bold', label: 'Comic Sans Bold', file: 'comicbd.ttf' },
  { value: 'Times New Roman Bold', label: 'Times Bold', file: 'timesbd.ttf' },
  { value: 'Verdana Bold', label: 'Verdana Bold', file: 'verdanab.ttf' },
];

// Processing Constants
export const PROCESSING = {
  MAX_CONCURRENT: 3,
  VIDEO_SPLIT_DURATION: 60, // seconds
  RETRY_ATTEMPTS: 3,
};

// LivePreview Constants
export const PREVIEW = {
  WIDTH: 225,
  HEIGHT: 400,
  SCALE: 4.8, // 1920 / 400
};

// Video Stages
export const VIDEO_STAGES = {
  PENDING: 'pending',
  INFO: 'info',
  DOWNLOADING: 'downloading',
  CONVERTING: 'converting',
  SPLITTING: 'splitting',
  ADDING_TEXT: 'adding-text',
  COMPLETED: 'completed',
  ERROR: 'error',
};

// Template Options
export const TEXT_TEMPLATES = [
  'Part {N}',
  'Bölüm {N}',
  '#{N}',
  'Episode {N}',
  '{N}. Bölüm',
  'EP {N}',
  '🎬 {N}',
  'Part {N} 📺',
];

// Color Presets
export const COLOR_PRESETS = {
  TEXT: ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700'],
  BORDER: ['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#FFD700'],
};

// System Constants
export const SYSTEM = {
  APP_NAME: 'YouTube to TikTok Converter',
  VERSION: '2.0.0-dev',
  NOTIFICATIONS_ENABLED: true,
};

