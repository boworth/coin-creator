export interface MembershipPlan {
  stripePriceId: string;
  description: string;
  duration: number; // in months (or as needed)
}

export const membershipPlans = [
  { stripePriceId: "price_monthly", description: "Monthly Membership", duration: 1 },
  { stripePriceId: "price_annual", description: "Annual Membership", duration: 12 }
];

export const membershipOptions = {
  weekly: {
    stripePriceId: "price_weekly_123", // Replace with your actual Stripe price ID
    description: "Weekly Membership",
    duration: 7, // e.g., membership valid for 7 days
    solPrice: 1,  // Weekly membership SOL price
    originalSolPrice: 1.2, // Weekly membership original SOL price (example)
    usdPrice: 299, // Weekly membership USD price
    originalUsdPrice: 399, // Weekly membership original USD price (example)
  },
  monthly: {
    stripePriceId: "price_monthly_123", // Replace with your actual Stripe price ID
    description: "Monthly Membership",
    duration: 30, // e.g., membership valid for 30 days
    solPrice: 3,  // Monthly membership SOL price
    originalSolPrice: 3.5, // Monthly membership original SOL price (example)
    usdPrice: 849, // Monthly membership USD price
    originalUsdPrice: 999, // Monthly membership original USD price (example)
  },
} 