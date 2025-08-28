"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { addDays, format, startOfWeek, addWeeks, subWeeks } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AppointmentsAPI } from "@/lib/api"

interface Appointment {
  _id: string
  clientId: {
    _id: string
    name: string
    phone: string
    email?: string
  }
  serviceId: {
    _id: string
    name: string
    price: number
    duration: number
  }
  staffId: {
    _id: string
    name: string
    role?: string
  }
  date: string
  time: string
  duration: number
  status: "scheduled" | "confirmed" | "completed" | "cancelled"
  notes?: string
  price: number
  createdAt: string
}

export function AppointmentsCalendar() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1))
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await AppointmentsAPI.getAll({
        limit: 100, // Get more appointments to cover the week
        status: undefined // Get all statuses
      })
      
      if (response.success) {
        setAppointments(response.data || [])
      } else {
        console.error('Failed to fetch appointments:', response.error)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch appointments when component mounts or date changes
  useEffect(() => {
    fetchAppointments()
  }, [currentDate])

  const getAppointmentsForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd")
    return appointments.filter((appointment) => {
      if (!appointment?.date) return false
      const normalized = appointment.date.length >= 10 ? appointment.date.slice(0, 10) : appointment.date
      return normalized === dateString
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500"
      case "scheduled":
        return "bg-blue-500"
      case "completed":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed"
      case "scheduled":
        return "Scheduled"
      case "completed":
        return "Completed"
      case "cancelled":
        return "Cancelled"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-lg font-semibold">
          {format(startDate, "MMMM yyyy")}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => (
          <Card key={day.toISOString()} className="min-h-[200px]">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">
                <div className="text-center">
                  <div className="font-medium">{format(day, "EEE")}</div>
                  <div className="text-2xl font-bold">{format(day, "d")}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center text-xs text-muted-foreground py-4">
                    Loading...
                  </div>
                ) : getAppointmentsForDate(day).length > 0 ? (
                  getAppointmentsForDate(day).map((appointment) => (
                    <div
                      key={appointment._id}
                      className="rounded-md border p-2 text-xs cursor-pointer hover:bg-muted/40 transition"
                      role="button"
                      onClick={() => {
                        setSelectedAppointment(appointment)
                        setShowDetails(true)
                      }}
                    >
                      {(() => {
                        const anyAppt: any = appointment as any
                        const serviceName = anyAppt?.serviceId?.name || 'Service'
                        const clientName = anyAppt?.clientId?.name || 'Client'
                        const clientInitial = clientName?.charAt?.(0) || '?'
                        const staffName = anyAppt?.staffId?.name || 'Unassigned Staff'
                        const staffRole = anyAppt?.staffId?.role
                        const price = anyAppt?.price ?? 0
                        const duration = anyAppt?.duration ?? 0
                        return (
                          <>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{appointment.time}</Badge>
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(appointment.status)}`} />
                      </div>
                          <div className="mt-2 font-medium">{serviceName}</div>
                      <div className="mt-2 flex items-center">
                        <Avatar className="h-5 w-5 mr-1">
                          <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback>{clientInitial}</AvatarFallback>
                        </Avatar>
                            <span>{clientName}</span>
                      </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {staffName} {staffRole ? `(${staffRole})` : ''}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            ₹{price} • {duration}min
                          </div>
                          </>
                        )
                      })()}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-xs text-muted-foreground py-4">No appointments</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              {selectedAppointment ? `${getStatusText(selectedAppointment.status)} • ${selectedAppointment.time} • ${selectedAppointment.date}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-3 text-sm">
              {(() => {
                const a: any = selectedAppointment as any
                const serviceName = a?.serviceId?.name || 'Service'
                const clientName = a?.clientId?.name || 'Client'
                const staffName = a?.staffId?.name || 'Unassigned Staff'
                const staffRole = a?.staffId?.role
                const duration = a?.duration ?? 0
                const price = a?.price ?? 0
                return (
                  <>
                    <div className="font-medium">{serviceName}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-muted-foreground">Client</div>
                        <div>{clientName}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Staff</div>
                        <div>
                          {staffName}
                          {staffRole ? ` (${staffRole})` : ''}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div>{duration} min</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Price</div>
                        <div>₹{price}</div>
                      </div>
                    </div>
                    {a?.notes && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-muted-foreground mb-1">Notes</div>
                          <div>{a.notes}</div>
                        </div>
                      </>
                    )}
                  </>
                )
              })()}
              <Separator />
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!selectedAppointment) return
                    const anySel: any = selectedAppointment as any
                    const payload = {
                      source: 'appointment',
                      appointmentId: anySel._id,
                      client: anySel.clientId,
                      items: [
                        {
                          serviceId: anySel?.serviceId?._id || anySel?.serviceId,
                          staffId: anySel?.staffId?._id || anySel?.staffId,
                        },
                      ],
                    }
                    try {
                      localStorage.setItem('salon-quick-sale-prefill', JSON.stringify(payload))
                    } catch {}
                    setShowDetails(false)
                    router.push('/quick-sale')
                  }}
                >
                  Raise Sale
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
