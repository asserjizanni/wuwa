'use client'

export async function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') return null
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(pdfjs)
      } else {
        reject(new Error('PDF.js failed to initialize'))
      }
    }
    script.onerror = () =>
      reject(new Error('Failed to load PDF library. Please check your internet connection.'))
    document.head.appendChild(script)
  })
}

export async function convertPdfToWebpPages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const pdfjs = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const totalPages = pdf.numPages
  const pages: string[] = []

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) onProgress(i, totalPages)
    const page = await pdf.getPage(i)
    // Scale 1.2 gives ~1000-1200px width — good quality while keeping each page ~100-200KB
    const viewport = page.getViewport({ scale: 1.2 })

    // Cap max width at 900px to limit payload size on Netlify
    const maxWidth = 900
    const scale = viewport.width > maxWidth ? maxWidth / viewport.width : 1
    const finalViewport = page.getViewport({ scale: 1.2 * scale })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    canvas.width = finalViewport.width
    canvas.height = finalViewport.height

    await page.render({ canvasContext: ctx, viewport: finalViewport }).promise
    // 0.72 quality gives good readability at ~100-200KB per page
    const dataUrl = canvas.toDataURL('image/webp', 0.72)
    pages.push(dataUrl)
  }

  return pages
}

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

