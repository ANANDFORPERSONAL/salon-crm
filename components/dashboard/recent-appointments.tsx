"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppointmentsAPI } from "@/lib/api"
import { Calendar } from "lucide-react"

interface RecentItem {
  id: string
  name: string
  avatar?: string
  service: string
  time: string
  price: number
}

export function RecentAppointments() {
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch latest 5 appointments regardless of date
        const res = await AppointmentsAPI.getAll({ limit: 5 })
        if (res.success && Array.isArray(res.data)) {
          const mapped: RecentItem[] = res.data.map((a: any) => ({
            id: a._id,
            name: a?.clientId?.name || "Client",
            avatar: "/placeholder.svg",
            service: a?.serviceId?.name || "Service",
            time: a?.time || "",
            price: Number(a?.price || 0),
          }))
          setItems(mapped)
        } else {
          setItems([])
        }
      } catch {
        setItems([])
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      {items.map((appointment, index) => (
        <div 
          key={appointment.id} 
          className="group flex items-center p-3 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-blue-200"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm group-hover:ring-blue-200 transition-all duration-300">
              <AvatarImage src={appointment.avatar || "/placeholder.svg"} alt="Avatar" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                {appointment.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="ml-4 space-y-1 flex-1">
            <p className="text-sm font-semibold leading-none text-gray-800 group-hover:text-blue-800 transition-colors duration-300">
              {appointment.name}
            </p>
            <p className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
              {appointment.service} - {appointment.time}
            </p>
          </div>
          <div className="ml-auto font-bold text-lg text-green-600 group-hover:text-green-700 transition-colors duration-300 bg-green-50 px-3 py-1 rounded-full group-hover:bg-green-100">
            ₹{appointment.price}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No recent appointments</p>
          <p className="text-sm text-gray-400">Appointments will appear here once scheduled</p>
        </div>
      )}
    </div>
  )
}
