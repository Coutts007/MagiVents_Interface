/**
 * Image processing and file upload utilities for MagiVents.
 * Safely compresses and converts image files to optimized Base64 Data URLs
 * for persistent storage in browser state and localStorage.
 */

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function validateImageFile(file: File, maxSizeBytes: number = 10 * 1024 * 1024): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please select a valid image file (PNG, JPG, WebP, or GIF).';
  }
  if (file.size > maxSizeBytes) {
    const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return `Image file size must be smaller than ${sizeMb}MB.`;
  }
  return null;
}

/**
 * Reads a File and resizes it via an HTML5 canvas to produce an optimized Data URL.
 */
export function processImageFile(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<{ dataUrl: string; width: number; height: number; fileName: string }> {
  const { maxWidth = 1600, maxHeight = 1200, quality = 0.88 } = options;

  return new Promise((resolve, reject) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      reject(new Error(validationError));
      return;
    }

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const result = readerEvent.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read image file data.'));
        return;
      }

      // If it's a GIF or SVG, do not compress via canvas to preserve animation/vector
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        resolve({
          dataUrl: result,
          width: 0,
          height: 0,
          fileName: file.name
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio constrained dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data URL if 2D context fails
          resolve({
            dataUrl: result,
            width,
            height,
            fileName: file.name
          });
          return;
        }

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        // Determine output MIME type (prefer WebP or original JPEG/PNG)
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);

        resolve({
          dataUrl: compressedDataUrl,
          width,
          height,
          fileName: file.name
        });
      };

      img.onerror = () => {
        reject(new Error('Could not load and process image data.'));
      };

      img.src = result;
    };

    reader.onerror = () => {
      reject(new Error('Error reading the selected image file.'));
    };

    reader.readAsDataURL(file);
  });
}
