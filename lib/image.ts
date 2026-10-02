/**
 * Centre-crops a photo to a square and shrinks it to [size]px JPEG before upload,
 * so a 5MB phone photo becomes ~80KB. Respects EXIF orientation where the browser does.
 */
export async function squarePhoto(file: File, size = 640): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions).catch(() =>
    createImageBitmap(file),
  );
  const side = Math.min(bitmap.width, bitmap.height);
  // Bias the crop slightly upward: headshots usually have the face in the top half.
  const sx = (bitmap.width - side) / 2;
  const sy = Math.max(0, (bitmap.height - side) / 2 - (bitmap.height - side) * 0.15);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read photo"))), "image/jpeg", 0.85),
  );
}
