import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/session'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = {
  title: {
    default: 'لوحة التحكم | Control Center',
    template: '%s | Control Center',
  },
  robots: { index: false, follow: false },
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  if (!session.adminId) {
    redirect('/control-center/login')
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#03060d] text-white antialiased">
      <AdminSidebar
        adminEmail={session.email}
        adminName={session.name}
        adminRole={session.role}
      />
      <main className="flex-1 w-full min-w-0 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
