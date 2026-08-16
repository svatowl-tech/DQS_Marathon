/**
 * Utility for downloading or sharing generated canvas images (PNG/JPEG)
 * with special support for iOS Safari / Mobile devices.
 */

export async function downloadOrShareImage(dataUrl: string, fileName: string): Promise<{ success: boolean; method: 'share' | 'download' | 'preview' }> {
  // 1. Try native Web Share API (iOS Safari & Mobile Chrome support sharing File objects)
  try {
    if (navigator.canShare && typeof fetch === 'function') {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type || 'image/png' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
        });
        return { success: true, method: 'share' };
      }
    }
  } catch (err) {
    // Share sheet dismissed or not supported
    console.warn('Web Share failed or dismissed:', err);
  }

  // 2. Fallback: Anchor download element
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, method: 'download' };
  } catch (err) {
    console.error('Anchor download failed:', err);
  }

  // 3. Fallback: Open image in new window/tab for touch & hold to save
  try {
    const w = window.open('');
    if (w) {
      w.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${fileName}</title>
            <style>
              body { margin: 0; background: #0a0a0c; color: #fff; font-family: system-ui, sans-serif; display: flex; flex-direction: column; items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 20px; box-sizing: border-box; }
              img { max-width: 100%; height: auto; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
              p { margin-top: 16px; color: #a1a1aa; font-size: 14px; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="${fileName}" />
            <p>💡 Нажмите и удерживайте изображение, чтобы сохранить его в «Фото» на iPhone</p>
          </body>
        </html>
      `);
      return { success: true, method: 'preview' };
    }
  } catch (err) {
    console.error('Window open fallback failed:', err);
  }

  return { success: false, method: 'download' };
}
