import { redirect } from 'next/navigation'

// الأعداء والزعماء تُدار من لوحة التحكم الإدارية فقط
export default function EnemiesRedirectPage() {
  redirect('/control-center/enemies')
}
