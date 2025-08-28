// Currency formatting utility
export interface CurrencySettings {
  currency: string
  enableCurrency: boolean
}

// Get currency symbol based on currency code
export function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$'
  }
  return symbols[currency] || currency
}

// Format amount with proper currency symbol and formatting
export function formatCurrency(amount: number, currencySettings?: CurrencySettings): string {
  if (!currencySettings?.enableCurrency) {
    return amount.toFixed(2)
  }

  const currency = currencySettings.currency || 'INR'
  
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    // Fallback to simple formatting with symbol
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${amount.toFixed(2)}`
  }
}

// Format amount with just the symbol (no number formatting)
export function formatAmountWithSymbol(amount: number, currencySettings?: CurrencySettings): string {
  if (!currencySettings?.enableCurrency) {
    return amount.toFixed(2)
  }

  const currency = currencySettings.currency || 'INR'
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${amount.toFixed(2)}`
}

// Get currency display text (e.g., "INR (₹)")
export function getCurrencyDisplay(currency: string): string {
  const symbol = getCurrencySymbol(currency)
  return `${currency} (${symbol})`
}
