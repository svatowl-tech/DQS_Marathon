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

        // Multi-pass compression to guarantee small payload (target < ~180KB base64)
        let currentWidth = width;
        let currentHeight = height;
        let currentQuality = Math.min(quality, 0.65);
        let compressedDataUrl = '';
        const TARGET_MAX_CHARS = 250_000; // ~180 KB base64 limit
        const MAX_ATTEMPTS = 3;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const canvas = document.createElement('canvas');
          canvas.width = currentWidth;
          canvas.height = currentHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            logger.warn('Image', 'Canvas 2D context unavailable, returning raw image input');
            resolve(typeof input === 'string' ? input : img.src);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fill white background in case of transparent PNG/HEIC
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, currentWidth, currentHeight);
          
          ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

          // Optional watermark overlay (TimeMark style)
          if (watermark && (watermark.timeStr || watermark.dateStr)) {
            const overlayHeight = Math.max(44, Math.round(currentHeight * 0.1));
            const fontSize = Math.max(16, Math.floor(currentHeight * 0.04));

            const grad = ctx.createLinearGradient(0, currentHeight - overlayHeight, 0, currentHeight);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, currentHeight - overlayHeight, currentWidth, overlayHeight);

            if (watermark.timeStr) {
              ctx.fillStyle = '#ffffff';
              ctx.font = `bold ${fontSize * 1.3}px sans-serif`;
              ctx.fillText(watermark.timeStr, 14, currentHeight - Math.round(overlayHeight * 0.35));
            }

            const subText = [watermark.dateStr, watermark.label || 'TimeMark DQS'].filter(Boolean).join(' | ');
            if (subText) {
              ctx.fillStyle = '#10b981';
              ctx.font = `500 ${fontSize * 0.75}px sans-serif`;
              ctx.fillText(subText, watermark.timeStr ? 14 + (fontSize * 3.5) : 14, currentHeight - Math.round(overlayHeight * 0.35));
            }
          }

          compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);

          // If size is under target or it's the last attempt, stop compressing
          if (compressedDataUrl.length <= TARGET_MAX_CHARS || attempt === MAX_ATTEMPTS - 1) {
            break;
          }

          // Otherwise reduce quality and scale for next attempt
          currentQuality = Math.max(0.35, currentQuality - 0.12);
          currentWidth = Math.round(currentWidth * 0.85);
          currentHeight = Math.round(currentHeight * 0.85);
        }

        logger.info('Image', 'Photo successfully compressed & watermarked', {
          originalDims,
          newDims: `${currentWidth}x${currentHeight}`,
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
