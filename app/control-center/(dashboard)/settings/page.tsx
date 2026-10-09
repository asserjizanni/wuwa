import type { Metadata } from 'next'
import SettingsAdminClient from './SettingsAdminClient'

export const metadata: Metadata = {
  title: 'إعدادات الموقع | Site Settings',
}

export default function SettingsAdminPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <SettingsAdminClient />
    </div>
  )
}
