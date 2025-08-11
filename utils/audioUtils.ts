// minganinet/utils/audioUtils.ts

/**
 * Safely converts a Uint8Array to a binary string in chunks to avoid stack overflow.
 * @param uint8Array The array to convert.
 * @returns A binary string.
 */
function binaryStringFromUint8Array(uint8Array: Uint8Array): string {
  let binaryString = '';
  const chunkSize = 8192; // Process in chunks
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    binaryString += String.fromCharCode.apply(null, uint8Array.subarray(i, i + chunkSize) as unknown as number[]);
  }
  return binaryString;
}

/**
 * Converts Base64-encoded PCM audio data to a WAV data URI.
 * This function is optimized to handle large audio buffers.
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
  const wavHeaderSize = 44;
  const buffer = new ArrayBuffer(wavHeaderSize + pcmLength);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < pcmLength; i++) {
    view.setUint8(wavHeaderSize + i, pcmData.charCodeAt(i));
  }

  const wavBinaryString = binaryStringFromUint8Array(new Uint8Array(buffer));
  const wavBase64 = btoa(wavBinaryString);

  return `data:audio/wav;base64,${wavBase64}`;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Polyfills for atob and btoa
if (typeof atob === 'undefined') {
  global.atob = (str: string) => {
    const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let e=0, r="", f=0, c, t, n;
    for (str = str.replace(/[^A-Za-z0-9\+\/\=]/g, ""); f < str.length;) {
        c = a.indexOf(str.charAt(f++)); t = a.indexOf(str.charAt(f++)); n = a.indexOf(str.charAt(f++)); e = a.indexOf(str.charAt(f++));
        c = c << 2 | t >> 4; t = (t & 15) << 4 | n >> 2; n = (n & 3) << 6 | e;
        r += String.fromCharCode(c); 64 != n && (r += String.fromCharCode(t)); 64 != e && (r += String.fromCharCode(n));
    }
    return r;
  };
}
if (typeof btoa === 'undefined') {
  global.btoa = (str: string) => {
    const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let e="", r=0, f, c, t=0;
    for (str = String(str); t < str.length;) {
        f = str.charCodeAt(t++); c = str.charCodeAt(t++); r = str.charCodeAt(t++);
        f = f >> 2; c = (f & 3) << 4 | c >> 4; r = (c & 15) << 2 | r >> 6; e = (r & 63);
        isNaN(c) ? r = e = 64 : isNaN(r) && (e = 64);
        e = a.charAt(f) + a.charAt(c) + a.charAt(r) + a.charAt(e);
    }
    return e;
  };
}
