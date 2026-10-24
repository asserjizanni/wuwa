import { redirect } from 'next/navigation'

// صفحة الإيكو والسوناتا تُدار من لوحة التحكم الإدارية
export default function EchoesRedirectPage() {
  redirect('/control-center/echoes')
}
