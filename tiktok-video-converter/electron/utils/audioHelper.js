const { getVideoMetadata } = require('./metadataCache');

/**
 * Video dosyasında audio stream olup olmadığını kontrol eder
 * @param {string} filePath - Video dosya yolu
 * @returns {Promise<{hasAudio: boolean, audioStream: object|null}>}
 */
async function checkAudioStream(filePath) {
  try {
    const metadata = await getVideoMetadata(filePath);
    const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
    return {
      hasAudio: !!audioStream,
      audioStream: audioStream || null,
      allStreams: metadata.streams,
    };
  } catch (error) {
    return {
      hasAudio: false,
      audioStream: null,
      error: error.message,
    };
  }
}

/**
 * Audio stream bilgisini formatlanmış string olarak döndürür
 */
function formatAudioInfo(audioStream) {
  if (!audioStream) {
    return 'YOK';
  }
  return `${audioStream.codec_name} (${audioStream.sample_rate || 'N/A'}Hz, ${audioStream.bit_rate || 'N/A'}bps)`;
}

module.exports = {
  checkAudioStream,
  formatAudioInfo,
};

