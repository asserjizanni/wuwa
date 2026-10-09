'use client'

import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0f1932',
          color: '#f0f6ff',
          border: '1px solid #1e3050',
          borderRadius: '10px',
          fontSize: '0.875rem',
        },
        success: {
          iconTheme: { primary: '#00d4ff', secondary: '#060810' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#060810' },
        },
      }}
    />
  )
}
