import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solana Token Creator',
  description: 'Create and mint your own SPL Token without coding on Solana blockchain.'
}

export default async function Home() {
  redirect('/token-creator')
} 