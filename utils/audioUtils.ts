// minganinet/utils/audioUtils.ts

/**
 * Base64-encoded PCM audio data to a WAV data URI.
 * This allows playback in expo-av and web audio.
 * @param base64PcmData - The base64 encoded PCM data.
 * @param sampleRate - The sample rate of the audio (e.g., 24000).
 * @returns A data URI string representing the WAV file.
 */
export function pcmToWavDataUri(base64PcmData: string, sampleRate: number): string {
  const pcmData = atob(base64PcmData);
  const pcmLength = pcmData.length;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmLength;
  const wavSize = 36 + dataSize;

  const buffer = new ArrayBuffer(wavSize + 8);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, wavSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  for (let i = 0; i < pcmLength; i++) {
    view.setUint8(44 + i, pcmData.charCodeAt(i));
  }
  
  const blob = new Blob([view], { type: 'audio/wav' });
  
  // To convert blob to base64 for the data URI
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  }).then(dataUrl => dataUrl);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * A simple polyfill for atob on platforms where it might not be available (like React Native).
 */
if (typeof atob === 'undefined') {
  global.atob = (str: string) => {
    const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let e=0, r="", f=0, c, t, n;
    for (str = str.replace(/[^A-Za-z0-9\+\/\=]/g, ""); f < str.length;) {
        c = a.indexOf(str.charAt(f++));
        t = a.indexOf(str.charAt(f++));
        n = a.indexOf(str.charAt(f++));
        e = a.indexOf(str.charAt(f++));
        c = c << 2 | t >> 4;
        t = (t & 15) << 4 | n >> 2;
        n = (n & 3) << 6 | e;
        r += String.fromCharCode(c);
        64 != n && (r += String.fromCharCode(t));
        64 != e && (r += String.fromCharCode(n));
    }
    return r;
  };
}

/**
 * Creates a Blob URL from base64 data.
 * Useful for web-based audio playback.
 * @param base64Data The base64 encoded data.
 * @param mimeType The MIME type of the data.
 * @returns A URL representing the blob object.
 */
export const createAudioBlobFromBase64 = (base64Data: string, mimeType = 'audio/wav'): string => {
  if (Platform.OS !== 'web') {
    // On native, we'll write to a file, but for now, we just return a data URI
    return `data:${mimeType};base64,${base64Data}`;
  }

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
};
