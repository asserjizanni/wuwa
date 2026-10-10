import type { Metadata } from 'next'
import BuilderClient from './BuilderClient'

export const metadata: Metadata = {
  title: 'WuwaFlex — محاكي البناء المدمج | Wuthering Waves Builds',
  description: 'استخدم محاكي وباني الشخصيات WuwaFlex المدمج مباشرة داخل الموقع لمحاكاة بنيات Resonators في Wuthering Waves وتحسين الإحصائيات.',
}

export default function BuilderPage() {
  return <BuilderClient />
}
