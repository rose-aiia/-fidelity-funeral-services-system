const ACCEPTED = /^image\/(jpeg|png|webp)$/

export const isAcceptedImage = (file: File) => ACCEPTED.test(file.type)

/**
 * Shrinks a photo in the browser (longest edge `maxEdge`, JPEG) so it is small enough to store and quick to
 * load on a mobile connection. Honours the camera's rotation.
 */
export async function photoToDataUrl(file: File, maxEdge = 1280, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is not available')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    bitmap.close()
  }
}
