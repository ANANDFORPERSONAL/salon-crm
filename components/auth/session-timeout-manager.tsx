"use client"

import { useSessionTimeout } from '@/hooks/use-session-timeout'

export function SessionTimeoutManager() {
  // Session timeout management (3 hours = 180 minutes)
  useSessionTimeout({
    timeoutMinutes: 180, // 3 hours
    warningMinutes: 5, // 5 minutes warning
    onTimeout: () => {
      console.log('🕐 Session timeout reached, logging out user')
    },
    onWarning: () => {
      console.log('⚠️ Session timeout warning shown')
    }
  })

  // This component doesn't render anything, it just manages the session timeout
  return null
}
