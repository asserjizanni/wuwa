'use client'


export async function readImagesAsDataUrls(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const pages: string[] = []
  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(i + 1, files.length)
    const file = files[i]
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    pages.push(dataUrl)
  }
  return pages
}

export async function optimizeImageForUpload(
  file: File,
  maxDimension: number = 1920,
  quality: number = 0.85
): Promise<File> {
  if (typeof window === 'undefined') return file
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img

        if (width <= maxDimension && height <= maxDimension && file.size < 800 * 1024 && file.type === 'image/webp') {
          resolve(file)
          return
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, width)
        canvas.height = Math.max(1, height)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            const cleanName = file.name.replace(/\.[^.]+$/, '') + '.webp'
            const optimizedFile = new File([blob], cleanName, { type: 'image/webp' })
            resolve(optimizedFile)
          },
          'image/webp',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

