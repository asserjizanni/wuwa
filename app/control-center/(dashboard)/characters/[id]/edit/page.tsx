import type { Metadata } from 'next'
import EditCharacterClient from './EditCharacterClient'

export const metadata: Metadata = {
  title: 'تعديل الشخصية | Edit Resonator',
}

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <EditCharacterClient characterId={resolvedParams.id} />
    </div>
  )
}
