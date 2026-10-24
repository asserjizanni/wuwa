import ImportClient from './ImportClient'

export const dynamic = 'force-dynamic'

export default function AdminImportPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white">مركز استيراد ومزامنة البيانات (Bulk Data Import)</h1>
        <p className="text-sm text-slate-400 mt-1">
          أداة متقدمة تتيح لك رفع وتحديث قواعد البيانات (الشخصيات، الأسلحة، الإيكو، الأعداء) بصيغة JSON مع المعاينة والتحقق واكتشاف التكرارات قبل التطبيق.
        </p>
      </div>

      <ImportClient />
    </div>
  )
}
