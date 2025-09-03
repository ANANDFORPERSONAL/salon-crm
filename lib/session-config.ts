// Session timeout configuration
export const SESSION_CONFIG = {
  // Timeout settings (in minutes)
  TIMEOUT_MINUTES: 180, // 3 hours
  WARNING_MINUTES: 5,   // 5 minutes before logout
  
  // Activity tracking events
  ACTIVITY_EVENTS: [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ],
  
  // Update intervals (in milliseconds)
  UPDATE_INTERVAL: 60000, // 1 minute
  
  // Toast notification settings
  TOAST_DURATION: 10000, // 10 seconds
  
  // Session status display
  SHOW_STATUS_WHEN_MINUTES_LEFT: 10, // Show status when less than 10 minutes left
} as const

// Helper functions
export const formatTimeRemaining = (minutes: number): string => {
  if (minutes < 1) return '< 1 min'
  if (minutes < 60) return `${minutes}m`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export const getSessionStatusColor = (minutesLeft: number) => {
  if (minutesLeft <= 5) return 'bg-red-100 text-red-800 border-red-200'
  if (minutesLeft <= 15) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-green-100 text-green-800 border-green-200'
}
