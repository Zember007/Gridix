import imageCompression from 'browser-image-compression';

async function compressToWebP(file: File): Promise<Blob> {
  // Сжимаем до нужного размера
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

  // Конвертируем в WebP через canvas
  const img = await createImageBitmap(compressed);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to convert image to WebP"))),
      "image/webp",
      0.8, // качество 0.8 (0–1)
    );
  });

  return blob;
}

export {compressToWebP}