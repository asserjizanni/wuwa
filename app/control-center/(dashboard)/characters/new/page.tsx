import type { Metadata } from 'next'
import NewCharacterClient from './NewCharacterClient'

export const metadata: Metadata = {
  title: 'Add New Character',
}

export default function NewCharacterPage() {
  return <NewCharacterClient />
}
