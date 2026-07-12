// Redimensiona/comprime a imagem do comprovante antes de enviar, para não
// gastar armazenamento à toa. PDFs e outros formatos passam intactos.

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

export async function processReceiptFile(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    return file // PDF etc — envia como está
  }
  try {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
    width = Math.round(width * scale)
    height = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    return blob ?? file
  } catch {
    return file
  }
}
