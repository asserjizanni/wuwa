import type { Metadata } from 'next'
import CharactersAdminClient from './CharactersAdminClient'

export const metadata: Metadata = {
  title: 'إدارة الشخصيات | Character Management',
}

export default function CharactersAdminPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <CharactersAdminClient />
    </div>
  )
}
