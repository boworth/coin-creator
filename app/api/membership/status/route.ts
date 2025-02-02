import { NextResponse } from 'next/server'
import { getMembershipStatus } from '@/lib/membership-storage'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get('wallet')

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Get membership status from your storage
    const membershipData = await getMembershipStatus(wallet)

    return NextResponse.json(membershipData)
  } catch (error) {
    console.error('Error checking membership status:', error)
    return NextResponse.json(
      { error: 'Failed to check membership status' },
      { status: 500 }
    )
  }
} 