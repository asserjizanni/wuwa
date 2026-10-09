import type { Metadata } from 'next'
import GuidesAdminClient from './GuidesAdminClient'

export const metadata: Metadata = {
  title: 'أدلة البناء | Build Guides Management',
}

export default function GuidesAdminPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <GuidesAdminClient />
    </div>
  )
}
