/**
 * Utility functions for calculating product prices from cost
 */

/**
 * Calculate the final price from cost based on the formula:
 * 1. Apply IVA: 1.08 for most products, 1.16 for SOFTW
 * 2. Apply profit margin: 1.20
 * 3. Round up to nearest 5 or 0 (e.g., 121.3 → 125)
 * 
 * @param costo - The base cost of the product
 * @param categoryId - The category ID (used to check if it's SOFTW)
 * @returns The calculated price rounded to nearest 5
 */
export const calculatePrice = (costo: number | null | undefined, categoryId: string | null | undefined): number => {
  if (!costo || costo <= 0) {
    return 0;
  }

  // Determine IVA factor based on category
  const isSoftware = categoryId?.toUpperCase() === 'SOFTW';
  const ivaFactor = isSoftware ? 1.16 : 1.08;

  // Apply IVA and profit margin
  const profitMargin = 1.20;
  const rawPrice = costo * ivaFactor * profitMargin;

  // Round up to nearest 5
  return roundToNearest5(rawPrice);
};

/**
 * Round a number up to the nearest 5
 * Examples: 121.3 → 125, 130 → 130, 127 → 130, 123 → 125
 * 
 * @param value - The value to round
 * @returns The value rounded up to nearest 5
 */
export const roundToNearest5 = (value: number): number => {
  if (value <= 0) return 0;
  return Math.ceil(value / 5) * 5;
};

/**
 * Format a price as Mexican Pesos
 * 
 * @param price - The price to format
 * @returns Formatted price string (e.g., "$1,250.00 MXN")
 */
export const formatPrice = (price: number): string => {
  if (price <= 0) {
    return '$0.00 MXN';
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};
