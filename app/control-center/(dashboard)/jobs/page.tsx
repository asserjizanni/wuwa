import type { Metadata } from 'next'
import JobsAdminClient from './JobsAdminClient'

export const metadata: Metadata = {
  title: 'مهام المعالجة | Processing Jobs',
}

export default function JobsAdminPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <JobsAdminClient />
    </div>
  )
}
