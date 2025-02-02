import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const { priceId, walletAddress } = await request.json()
    
    console.log('Creating checkout session with:', {
      priceId,
      walletAddress,
      env: {
        stripeKey: process.env.STRIPE_SECRET_KEY?.slice(0, 8) + '...',
        weeklyPriceId: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID,
        monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
      }
    })

    if (!priceId) {
      throw new Error('Price ID is required')
    }

    try {
      const price = await stripe.prices.retrieve(priceId)
      console.log('Price details:', price)
    } catch (stripeError) {
      console.error('Stripe price retrieval error:', stripeError)
      return NextResponse.json(
        { 
          error: 'Invalid price ID',
          details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
        }, 
        { status: 400 }
      )
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${request.headers.get('origin')}/membership?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${request.headers.get('origin')}/membership?canceled=true`,
        metadata: {
          membershipType: priceId === process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID ? 'weekly' : 'monthly',
          walletAddress: walletAddress
        }
      })

      console.log('Created session:', {
        sessionId: session.id,
        metadata: session.metadata
      })

      return NextResponse.json({ id: session.id })
    } catch (sessionError) {
      console.error('Stripe session creation error:', sessionError)
      return NextResponse.json(
        { 
          error: 'Failed to create checkout session',
          details: sessionError instanceof Error ? sessionError.message : 'Unknown error'
        }, 
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('Detailed error:', {
      error: err,
      errorName: err instanceof Error ? err.name : 'Unknown',
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      errorStack: err instanceof Error ? err.stack : undefined,
      stripeKey: process.env.STRIPE_SECRET_KEY?.slice(0, 8) + '...',
      priceIds: {
        weekly: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID,
        monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
      }
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        message: err instanceof Error ? err.message : 'Unknown error',
        details: err instanceof Error ? err.stack : undefined
      }, 
      { status: 500 }
    )
  }
}

