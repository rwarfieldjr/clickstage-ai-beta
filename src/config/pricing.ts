/**
 * CENTRALIZED PRICING CONFIGURATION
 * Single source of truth for all pricing tiers
 * DO NOT modify individual price IDs - update here only
 * Last verified: 2025-11-01
 */

export interface PricingTier {
  id: string;
  name: string;
  displayName: string;
  price: string;
  priceAmount: number;
  priceId: string;
  credits: number;
  perPhoto: string;
  perPhotoAmount: number;
  savings?: string;
  competitive?: string;
  description: string;
  popular?: boolean;
  expiration: string;
  checkoutUrl: string;
}

/**
 * PRODUCTION PRICING TIERS
 * These are live Stripe price IDs - verified working
 */
export const PRICING_TIERS: readonly PricingTier[] = [
  {
    id: "single",
    name: "1 Photo",
    displayName: "Single Photo",
    price: "$10",
    priceAmount: 10,
    priceId: "price_1SD8lsIG3TLqP9yabBsx4jyZ",
    credits: 1,
    perPhoto: "$10 per photo",
    perPhotoAmount: 10,
    competitive: "Save 70% vs. our competition ($30 to $40 per photo)",
    description: "Perfect for testing our service",
    expiration: "Credits expire 6 months after purchase.",
    checkoutUrl: "https://buy.stripe.com/7sY9AU3eU0tn4DkcHCdZ601",
  },
  {
    id: "5-photos",
    name: "5 Photos",
    displayName: "5 Photos",
    price: "$45",
    priceAmount: 45,
    priceId: "price_1SD8nJIG3TLqP9yaGAjd2WdP",
    credits: 5,
    perPhoto: "$9 per photo",
    perPhotoAmount: 9,
    savings: "Bundle and Save $5",
    description: "Perfect for a single listing",
    expiration: "Credits expire 6 months after purchase.",
    checkoutUrl: "https://buy.stripe.com/fZu4gA6r68ZT6Ls7nidZ602",
  },
  {
    id: "10-photos",
    name: "10 Photos",
    displayName: "10 Photos",
    price: "$85",
    priceAmount: 85,
    priceId: "price_1SD8nNIG3TLqP9yazPngAINO",
    credits: 10,
    perPhoto: "$8.5 per photo",
    perPhotoAmount: 8.5,
    savings: "Bundle and Save $15",
    description: "Great for 2-3 listings",
    expiration: "Credits expire 6 months after purchase.",
    checkoutUrl: "https://buy.stripe.com/eVqaEYeXC4JDd9Q6jedZ603",
  },
  {
    id: "20-photos",
    name: "20 Photos",
    displayName: "20 Photos",
    price: "$160",
    priceAmount: 160,
    priceId: "price_1SD8nQIG3TLqP9yaBVVV1coG",
    credits: 20,
    perPhoto: "$8 per photo",
    perPhotoAmount: 8,
    savings: "Bundle and Save $40",
    description: "Ideal for multiple projects",
    popular: true,
    expiration: "Credits expire 12 months after purchase.",
    checkoutUrl: "https://buy.stripe.com/3cI9AUdTyekd8TA8rmdZ604",
  },
  {
    id: "50-photos",
    name: "50 Photos",
    displayName: "50 Photos",
    price: "$375",
    priceAmount: 375,
    priceId: "price_1SD8nTIG3TLqP9yaT0hRMNFq",
    credits: 50,
    perPhoto: "$7.5 per photo",
    perPhotoAmount: 7.5,
    savings: "Bundle and Save $125",
    description: "Perfect for agencies",
    expiration: "Credits expire 12 months after purchase.",
    checkoutUrl: "https://buy.stripe.com/aFa14o3eUgsl8TAfTOdZ605",
  },
  {
    id: "100-photos",
    name: "100 Photos",
    displayName: "100 Photos",
    price: "$700",
    priceAmount: 700,
    priceId: "price_1SD8nWIG3TLqP9yaH0D0oIpW",
    credits: 100,
    perPhoto: "$7 per photo",
    perPhotoAmount: 7,
    savings: "Bundle and Save $300",
    description: "Maximum value for teams",
    expiration: "Credits expire 12 months after purchase.",
    checkoutUrl: "https://buy.stripe.com/7sYeVe6r64JD4Dk22YdZ606",
  },
] as const;

/**
 * Get pricing tier by ID
 */
export function getPricingTierById(id: string): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.id === id);
}

/**
 * Get pricing tier by Stripe price ID
 */
export function getPricingTierByPriceId(priceId: string): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.priceId === priceId);
}

/**
 * Get pricing tier by credit count
 */
export function getPricingTierByCredits(credits: number): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.credits === credits);
}

/**
 * Validate that a price ID is recognized
 */
export function isValidPriceId(priceId: string): boolean {
  return PRICING_TIERS.some(tier => tier.priceId === priceId);
}

/**
 * Get all tiers suitable for dashboard display (5+ photos)
 */
export function getDashboardTiers(): PricingTier[] {
  return PRICING_TIERS.filter(tier => tier.credits >= 5).slice(0, 4);
}
