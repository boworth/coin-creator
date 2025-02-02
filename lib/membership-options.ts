export const membershipOptions = {
  weekly: { 
    duration: 7, 
    solPrice: 1, 
    usdPrice: 299, 
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID 
  },
  monthly: {
    duration: 30,
    solPrice: 3,
    usdPrice: 849,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
    originalSolPrice: 4,
    originalUsdPrice: 1200,
  },
}; 