/**
 * QR decoding for the door check-in screen. Uses the browser's own BarcodeDetector when it supports
 * QR codes (Chrome on Android, for example), and otherwise a WebAssembly polyfill that is loaded only
 * when the camera is opened. The .wasm file is bundled with the app, so scanning works without a CDN.
 */

export interface QrDetector {
  detect: (source: CanvasImageSource) => Promise<string[]>;
}

interface NativeDetector {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

interface NativeDetectorClass {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats: () => Promise<string[]>;
}

let detectorPromise: Promise<QrDetector> | null = null;

async function createDetector(): Promise<QrDetector> {
  const Native = (globalThis as unknown as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
  const nativeFormats: string[] = Native ? await Native.getSupportedFormats().catch(() => []) : [];
  if (Native && nativeFormats.includes('qr_code')) {
    const native = new Native({ formats: ['qr_code'] });
    return { detect: async (source) => (await native.detect(source)).map((code) => code.rawValue) };
  }

  const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
    import('barcode-detector/ponyfill'),
    import('zxing-wasm/reader/zxing_reader.wasm?url')
  ]);
  prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path)
    }
  });
  const polyfill = new BarcodeDetector({ formats: ['qr_code'] });
  return { detect: async (source) => (await polyfill.detect(source)).map((code) => code.rawValue) };
}

/** A shared QR detector, created on first use. */
export function getQrDetector(): Promise<QrDetector> {
  detectorPromise =
    detectorPromise ||
    createDetector().catch((err) => {
      detectorPromise = null;
      throw err;
    });
  return detectorPromise;
}
