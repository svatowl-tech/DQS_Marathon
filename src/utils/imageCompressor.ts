/**
 * Image Compression & Watermarking Engine for DQS Nutrition Tracker
 * Downscales camera images to maximum dimensions (~1000px) and compresses to JPEG (quality ~0.75).
 * Reduces photo payload from 5MB+ down to ~80-120KB while maintaining clear visual detail.
 */

import { logger } from './logger';

export interface WatermarkOptions {
  timeStr?: string;
  dateStr?: string;
  label?: string;
}

export async function compressImage(
  input: File | string,
  maxDimension: number = 1000,
  quality: number = 0.75,
  watermark?: WatermarkOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const processImage = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width <= 0 || height <= 0) {
          width = 800;
          height = 600;
        }

        const originalDims = `${width}x${height}`;

        // Calculate downscaled aspect-ratio preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          logger.warn('Image', 'Canvas 2D context unavailable, returning raw image input');
          resolve(typeof input === 'string' ? input : img.src);
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw downscaled photo
        ctx.drawImage(img, 0, 0, width, height);

        // Optional watermark overlay (TimeMark style)
        if (watermark && (watermark.timeStr || watermark.dateStr)) {
          const overlayHeight = Math.max(44, Math.round(height * 0.1));
          const fontSize = Math.max(16, Math.floor(height * 0.04));

          // Draw gradient dark overlay at bottom
          const grad = ctx.createLinearGradient(0, height - overlayHeight, 0, height);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, height - overlayHeight, width, overlayHeight);

          // Time text
          if (watermark.timeStr) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${fontSize * 1.3}px sans-serif`;
            ctx.fillText(watermark.timeStr, 14, height - Math.round(overlayHeight * 0.35));
          }

          // Date & brand label
          const subText = [watermark.dateStr, watermark.label || 'TimeMark DQS'].filter(Boolean).join(' | ');
          if (subText) {
            ctx.fillStyle = '#10b981'; // emerald-500
            ctx.font = `500 ${fontSize * 0.75}px sans-serif`;
            ctx.fillText(subText, watermark.timeStr ? 14 + (fontSize * 3.5) : 14, height - Math.round(overlayHeight * 0.35));
          }
        }

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        logger.info('Image', 'Photo successfully compressed & watermarked', {
          originalDims,
          newDims: `${width}x${height}`,
          compressedSizeKB: Math.round(compressedDataUrl.length / 1024),
        });
        resolve(compressedDataUrl);
      } catch (err) {
        logger.error('Image', 'Image compression fallback triggered due to canvas exception', err);
        resolve(typeof input === 'string' ? input : img.src);
      }
    };

    img.onerror = (err) => {
      logger.error('Image', 'Image load error during compression', err);
      reject(err);
    };

    if (typeof input === 'string') {
      img.src = input;
      if (img.complete) {
        processImage();
      } else {
        img.onload = processImage;
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
        img.onload = processImage;
      };
      reader.onerror = (err) => {
        logger.error('Image', 'FileReader error loading uploaded photo', err);
        reject(err);
      };
      reader.readAsDataURL(input);
    }
  });
}
