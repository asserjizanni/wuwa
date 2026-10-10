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
    // Scale 1.5 gives crisp ~1200-1500px resolution while keeping size around 200-300KB
    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({ canvasContext: ctx, viewport }).promise
    // Convert to webp with 0.82 quality
    const dataUrl = canvas.toDataURL('image/webp', 0.82)
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
