import type { Metadata } from 'next'
import BuilderClient from './BuilderClient'

export const metadata: Metadata = {
  title: 'محاكي البناء WuwaFlex — محاكي إحصائيات Wuthering Waves',
  description: 'استخدم محاكي وباني الشخصيات WuwaFlex المدمج مباشرة. حاكِ بنيات شخصيات Wuthering Waves، وحسّن الإحصائيات، وخطط لفريقك المتكامل.',
}

export default function BuilderPage() {
  return <BuilderClient />
}
