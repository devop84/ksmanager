/**
 * Calculate tier-based pricing for a service
 * @param {number} quantity - Total quantity in the service's unit
 * @param {Array} tiers - Array of tier objects with from_duration, to_duration, price_per_unit
 * @returns {Object} - { unit_price, total_price }
 */
/**
 * Calculate tier-based pricing for a service
 * The entire quantity uses the price from the tier it falls into
 * @param {number} quantity - Total quantity in the service's unit
 * @param {Array} tiers - Array of tier objects with from_duration, to_duration, price_per_unit
 * @returns {Object} - { unit_price, total_price }
 */
export function calculateTierPrice(quantity, tiers) {
  if (!tiers || tiers.length === 0) {
    return { unit_price: 0, total_price: 0 }
  }

  const qty = parseFloat(quantity || 0)
  if (qty <= 0 || isNaN(qty)) {
    return { unit_price: 0, total_price: 0 }
  }

  // Sort tiers by from_duration
  const sortedTiers = [...tiers].sort((a, b) => 
    parseFloat(a.from_duration || 0) - parseFloat(b.from_duration || 0)
  )

  // Find which tier the quantity falls into
  // Tiers are: [from_duration, to_duration) - inclusive start, exclusive end
  // Example: tier 0-2 means 0 <= qty < 2, tier 2-4 means 2 <= qty < 4
  let matchingTier = null

  for (const tier of sortedTiers) {
    const fromDuration = parseFloat(tier.from_duration || 0)
    const toDuration = tier.to_duration !== null && tier.to_duration !== undefined && tier.to_duration !== ''
      ? parseFloat(tier.to_duration) 
      : Infinity
    const pricePerUnit = parseFloat(tier.price_per_unit || 0)

    if (pricePerUnit <= 0 || isNaN(pricePerUnit)) continue

    // Check if quantity falls in this tier
    // Tier is [from_duration, to_duration) - inclusive start, exclusive end
    if (qty >= fromDuration && qty < toDuration) {
      matchingTier = tier
      break
    }
  }

  // If no tier matches, use the last tier (for quantities beyond all tiers)
  if (!matchingTier && sortedTiers.length > 0) {
    const lastTier = sortedTiers[sortedTiers.length - 1]
    const lastToDuration = lastTier.to_duration !== null && lastTier.to_duration !== undefined && lastTier.to_duration !== ''
      ? parseFloat(lastTier.to_duration)
      : Infinity
    
    // If last tier has no to_duration (infinity), use it
    if (lastToDuration === Infinity) {
      matchingTier = lastTier
    }
  }

  if (!matchingTier) {
    return { unit_price: 0, total_price: 0 }
  }

  // Calculate price: entire quantity uses the matching tier's price per unit
  const pricePerUnit = parseFloat(matchingTier.price_per_unit || 0)
  const totalPrice = qty * pricePerUnit

  return {
    unit_price: pricePerUnit,
    total_price: totalPrice
  }
}

