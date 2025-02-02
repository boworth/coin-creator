import { NextResponse } from 'next/server'
import { updateMembershipStatus } from '@/lib/membership-storage'

export async function POST(request: Request) {
  try {
    const { planId, walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    const duration = planId === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000

    await updateMembershipStatus(walletAddress, duration)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating membership:', error)
    return NextResponse.json(
      { error: 'Failed to update membership' },
      { status: 500 }
    )
  }
} 