import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { updateMembershipStatus, getMembershipStatus } from '@/lib/membership-storage'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')!

    console.log('🔔 Received webhook event')

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    console.log('🎯 Webhook event type:', event.type)

    // Handle successful payments
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      console.log('💳 Session data:', {
        paymentStatus: session.payment_status,
        metadata: session.metadata,
        sessionId: session.id
      })
      
      if (session.payment_status === 'paid') {
        const walletAddress = session.metadata?.walletAddress
        if (!walletAddress) {
          throw new Error('No wallet address found in session metadata')
        }

        const membershipType = session.metadata?.membershipType
        const duration = membershipType === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000

        console.log('🔄 Activating membership:', {
          walletAddress,
          membershipType,
          duration
        })

        // Update membership directly using the storage function
        await updateMembershipStatus(walletAddress, duration)
        console.log("✅ Membership activated successfully")

        // Verify the membership was actually updated
        const membershipStatus = await getMembershipStatus(walletAddress)
        console.log("📊 Current membership status:", membershipStatus)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('❌ Webhook error:', err)
    return NextResponse.json(
      { error: 'Webhook error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    )
  }
} 