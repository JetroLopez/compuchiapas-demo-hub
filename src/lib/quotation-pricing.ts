/**
 * Pricing utilities for quotations with IVA breakdown
 */

export interface QuotationPricingItem {
  id: string;
  name: string;
  clave?: string;
  categoryId?: string | null;
  quantity: number;
  costo: number; // Original cost from inventory
  precioEditado: number; // Editable final price per unit (includes margin + IVA)
}

export interface PricingBreakdown {
  subtotal: number; // Before IVA (sum of: costo * margin * quantity)
  iva: number; // IVA amount
  total: number; // Final total with IVA
}

/**
 * Calculate the suggested price from cost:
 * 1. Apply margin: costo * 1.20 = subtotal per unit
 * 2. Apply IVA: subtotal * (1.08 or 1.16 for SOFTW) = final price
 * 3. Round up to nearest 5
 */
export const calculateSuggestedPrice = (
  costo: number,
  categoryId: string | null | undefined
): number => {
  if (!costo || costo <= 0) return 0;
  
  const isSoftware = categoryId?.toUpperCase() === 'SOFTW';
  const margin = 1.20;
  const ivaFactor = isSoftware ? 1.16 : 1.08;
  
  const rawPrice = costo * margin * ivaFactor;
  return roundToNearest5(rawPrice);
};

/**
 * Calculate subtotal (before IVA) from final price
 * Reverse calculation: finalPrice / ivaFactor = subtotal
 */
export const calculateSubtotalFromPrice = (
  precioFinal: number,
  categoryId: string | null | undefined
): number => {
  if (!precioFinal || precioFinal <= 0) return 0;
  
  const isSoftware = categoryId?.toUpperCase() === 'SOFTW';
  const ivaFactor = isSoftware ? 1.16 : 1.08;
  
  return precioFinal / ivaFactor;
};

/**
 * Calculate IVA amount from final price
 */
export const calculateIvaFromPrice = (
  precioFinal: number,
  categoryId: string | null | undefined
): number => {
  if (!precioFinal || precioFinal <= 0) return 0;
  
  const subtotal = calculateSubtotalFromPrice(precioFinal, categoryId);
  return precioFinal - subtotal;
};

/**
 * Get IVA rate for a category
 */
export const getIvaRate = (categoryId: string | null | undefined): number => {
  const isSoftware = categoryId?.toUpperCase() === 'SOFTW';
  return isSoftware ? 0.16 : 0.08;
};

/**
 * Calculate full breakdown for a list of items
 */
export const calculatePricingBreakdown = (
  items: QuotationPricingItem[]
): PricingBreakdown => {
  let subtotal = 0;
  let iva = 0;
  let total = 0;
  
  items.forEach(item => {
    const itemTotal = item.precioEditado * item.quantity;
    const itemSubtotal = calculateSubtotalFromPrice(item.precioEditado, item.categoryId) * item.quantity;
    const itemIva = itemTotal - itemSubtotal;
    
    subtotal += itemSubtotal;
    iva += itemIva;
    total += itemTotal;
  });
  
  return { subtotal, iva, total };
};

/**
 * Prorate prices proportionally when total is manually edited
 * @param items Current items with their prices
 * @param newTotal The new total to achieve
 * @returns Items with adjusted prices
 */
export const prorateItemPrices = (
  items: QuotationPricingItem[],
  newTotal: number
): QuotationPricingItem[] => {
  const currentTotal = items.reduce(
    (sum, item) => sum + item.precioEditado * item.quantity,
    0
  );
  
  if (currentTotal === 0) {
    // If all prices are 0, distribute evenly
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity === 0) return items;
    
    const pricePerUnit = newTotal / totalQuantity;
    return items.map(item => ({
      ...item,
      precioEditado: roundToNearest5(pricePerUnit),
    }));
  }
  
  const ratio = newTotal / currentTotal;
  
  // Apply ratio to each item's price
  const adjustedItems = items.map(item => ({
    ...item,
    precioEditado: roundToNearest5(item.precioEditado * ratio),
  }));
  
  // Adjust for rounding errors - add difference to largest item
  const adjustedTotal = adjustedItems.reduce(
    (sum, item) => sum + item.precioEditado * item.quantity,
    0
  );
  const difference = newTotal - adjustedTotal;
  
  if (Math.abs(difference) > 0.01 && adjustedItems.length > 0) {
    // Find item with highest total and adjust it
    let maxIdx = 0;
    let maxValue = 0;
    adjustedItems.forEach((item, idx) => {
      const itemTotal = item.precioEditado * item.quantity;
      if (itemTotal > maxValue) {
        maxValue = itemTotal;
        maxIdx = idx;
      }
    });
    
    // Adjust the largest item to absorb the rounding difference
    const item = adjustedItems[maxIdx];
    const adjustment = difference / item.quantity;
    adjustedItems[maxIdx] = {
      ...item,
      precioEditado: roundToNearest5(item.precioEditado + adjustment),
    };
  }
  
  return adjustedItems;
};

/**
 * Round up to nearest 5
 */
export const roundToNearest5 = (value: number): number => {
  if (value <= 0) return 0;
  return Math.ceil(value / 5) * 5;
};

/**
 * Format currency in MXN
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
