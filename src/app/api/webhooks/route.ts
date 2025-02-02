import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('Stripe-Signature') || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new NextResponse('Webhook error', { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (event.type === 'checkout.session.completed') {
    if (!session.subscription || !session.customer) {
      return new NextResponse('Invalid session data', { status: 400 })
    }

    try {
      await prisma.user.update({
        where: { stripeCustomerId: session.customer as string },
        data: {
          isMember: true,
          membershipStart: new Date(),
          stripeSubscriptionId: session.subscription as string
        }
      })
    } catch (error) {
      console.error('Membership update error:', error)
      return new NextResponse('Database update failed', { status: 500 })
    }
  }

  return new NextResponse(null, { status: 200 })
} 