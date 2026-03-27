/**
 * Compresses an image file by resizing it to a maximum dimension and reducing quality.
 * @param file The original File object
 * @param maxWidth The maximum width/height (default 1200px)
 * @param quality The JPEG quality (0 to 1, default 0.8)
 * @returns A Promise resolving to the compressed base64 string (without prefix)
 */
export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    // Safety timeout: if img or reader never fires, reject instead of hanging forever
    const timeoutId = setTimeout(() => {
      reject(new Error('compressImage timeout: la imagen tardó demasiado en procesarse'));
    }, 15000);

    const done = (result: string | Error) => {
      clearTimeout(timeoutId);
      if (result instanceof Error) reject(result);
      else resolve(result);
    };

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = (err) => done(new Error('Error cargando imagen: ' + String(err)));

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width *= maxWidth / height;
              height = maxWidth;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            done(new Error('Could not get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Compress
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          // Remove prefix to get raw base64
          done(dataUrl.split(',')[1]);
        } catch (e: any) {
          done(new Error('Error en canvas: ' + (e?.message || String(e))));
        }
      };

      // Assign src AFTER registering handlers
      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => done(new Error('FileReader error: ' + String(err)));
  });
}
