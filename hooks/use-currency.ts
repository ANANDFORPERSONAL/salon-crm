import { useState, useEffect } from 'react'
import { formatCurrency, formatAmountWithSymbol, getCurrencySymbol, getCurrencyDisplay, type CurrencySettings } from '@/lib/currency'
import { SettingsAPI } from '@/lib/api'

export function useCurrency() {
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>({
    currency: 'INR',
    enableCurrency: true
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCurrencySettings()
  }, [])

  const loadCurrencySettings = async () => {
    try {
      const response = await SettingsAPI.getPaymentSettings()
      if (response.success) {
        setCurrencySettings({
          currency: response.data.currency || 'INR',
          enableCurrency: response.data.enableCurrency !== false
        })
      }
    } catch (error) {
      console.error('Failed to load currency settings:', error)
      // Keep default values
    } finally {
      setIsLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currencySettings)
  }

  const formatAmountWithSymbolOnly = (amount: number) => {
    return formatAmountWithSymbol(amount, currencySettings)
  }

  const getSymbol = () => {
    return getCurrencySymbol(currencySettings.currency)
  }

  const getDisplay = () => {
    return getCurrencyDisplay(currencySettings.currency)
  }

  const refreshSettings = () => {
    loadCurrencySettings()
  }

  return {
    currencySettings,
    isLoading,
    formatAmount,
    formatAmountWithSymbolOnly,
    getSymbol,
    getDisplay,
    refreshSettings
  }
}
