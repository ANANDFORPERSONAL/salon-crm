"use client"

import { useState, useEffect } from 'react'
import { useSessionTimeout } from '@/hooks/use-session-timeout'
import { useAuth } from '@/lib/auth-context'
import { Clock, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SESSION_CONFIG, formatTimeRemaining, getSessionStatusColor } from '@/lib/session-config'

interface SessionStatusProps {
  showAlways?: boolean // Show even when not near timeout
  className?: string
}

export function SessionStatus({ showAlways = false, className = "" }: SessionStatusProps) {
  const { user } = useAuth()
  const { getTimeUntilTimeout, isWarningShown } = useSessionTimeout()
  const [timeUntilTimeout, setTimeUntilTimeout] = useState(0)
  const [showWarning, setShowWarning] = useState(false)

  // Update time remaining every minute
  useEffect(() => {
    if (!user) return

    const updateTime = () => {
      const timeLeft = getTimeUntilTimeout()
      setTimeUntilTimeout(timeLeft)
      setShowWarning(isWarningShown())
    }

    // Update immediately
    updateTime()

    // Update every minute
    const interval = setInterval(updateTime, SESSION_CONFIG.UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [user, getTimeUntilTimeout, isWarningShown])

  // Don't show if user is not logged in
  if (!user) return null

  // Don't show if not near timeout and showAlways is false
  const minutesLeft = Math.floor(timeUntilTimeout / (1000 * 60))
  if (!showAlways && minutesLeft > SESSION_CONFIG.SHOW_STATUS_WHEN_MINUTES_LEFT) return null

  const getStatusIcon = () => {
    if (minutesLeft <= 5) return <AlertTriangle className="h-3 w-3" />
    return <Clock className="h-3 w-3" />
  }

  return (
    <Badge 
      variant="outline" 
      className={`${getSessionStatusColor(minutesLeft)} ${className}`}
      title={`Session expires in ${formatTimeRemaining(minutesLeft)}`}
    >
      {getStatusIcon()}
      <span className="ml-1 text-xs">
        {formatTimeRemaining(minutesLeft)}
      </span>
    </Badge>
  )
}
