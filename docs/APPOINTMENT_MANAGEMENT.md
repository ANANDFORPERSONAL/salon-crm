# Appointment Management Feature

## Overview

The Appointment Management system is a comprehensive scheduling solution that allows salon staff to create, manage, and track appointments with clients. It includes calendar views, service scheduling, staff assignment, and appointment status tracking to ensure efficient salon operations.

## Features

### 📅 **Comprehensive Scheduling**
- **Calendar View**: Visual calendar interface for easy appointment management
- **Time Slot Management**: Predefined time slots (9:00 AM - 5:30 PM) with 30-minute intervals
- **Date Selection**: Easy date picker for appointment scheduling
- **Duration Calculation**: Automatic calculation of total appointment duration

### 👥 **Client & Service Management**
- **Client Search**: Quick search and selection of existing clients
- **New Client Creation**: Add new clients during appointment scheduling
- **Service Selection**: Multiple service selection with individual staff assignment
- **Service Details**: Display service duration, price, and description

### 👨‍💼 **Staff Assignment**
- **Individual Staff Assignment**: Assign specific staff to each service
- **Staff Availability**: Track staff schedules and availability
- **Role-Based Assignment**: Assign staff based on their roles and specialties
- **Multi-Service Support**: Different staff for different services in one appointment

### 📊 **Appointment Tracking**
- **Status Management**: Track appointment status (scheduled, confirmed, completed, cancelled)
- **Notes & Comments**: Add detailed notes for each appointment
- **Appointment History**: Complete history of all appointments
- **Status Updates**: Easy status updates and modifications

### 🎯 **Calendar Interface**
- **Week View**: Navigate through weeks with easy controls
- **Appointment Display**: Visual representation of appointments on calendar
- **Quick Actions**: Easy access to appointment details and modifications
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

### 1. **Appointment Creation Flow**
```
1. Select Date & Time
2. Choose Client (Search/Create New)
3. Add Services
4. Assign Staff to Each Service
5. Add Notes (Optional)
6. Create Appointment
7. View in Calendar
```

### 2. **Data Structure**
```typescript
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

interface SelectedService {
  id: string
  serviceId: string
  name: string
  duration: number
  price: number
  staffId: string
  staffName: string
}
```

### 3. **Time Slot Management**
```typescript
const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM"
]
```

## Technical Implementation

### **Main Components**

#### `AppointmentForm` Component
- **Location**: `components/appointments/appointment-form.tsx`
- **Purpose**: Create new appointments with comprehensive form
- **Features**:
  - Date and time selection
  - Client search and creation
  - Service selection with staff assignment
  - Notes and additional information
  - Form validation and submission

#### `AppointmentsCalendar` Component
- **Location**: `components/appointments/appointments-calendar.tsx`
- **Purpose**: Visual calendar interface for appointment management
- **Features**:
  - Week view navigation
  - Appointment display
  - Status indicators
  - Quick actions and details

### **Key Features**

#### 1. **Client Management Integration**
```typescript
// Client search and selection
const [customerSearch, setCustomerSearch] = useState("")
const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null)

// New client creation
const [newClient, setNewClient] = useState({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
})
```

#### 2. **Service Selection**
```typescript
// Service management
const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
const [services, setServices] = useState<any[]>([])

// Add service with staff assignment
const addService = (service: any, staffId: string, staffName: string) => {
  const newService: SelectedService = {
    id: `${service._id}-${Date.now()}`,
    serviceId: service._id,
    name: service.name,
    duration: service.duration,
    price: service.price,
    staffId: staffId,
    staffName: staffName
  }
  setSelectedServices(prev => [...prev, newService])
}
```

#### 3. **Duration Calculation**
```typescript
// Calculate total appointment duration
const calculateTotalDuration = () => {
  return selectedServices.reduce((total, service) => total + service.duration, 0)
}

// Calculate total appointment amount
const calculateTotalAmount = () => {
  return selectedServices.reduce((total, service) => total + service.price, 0)
}
```

### **Backend Integration**

#### Appointments API
```typescript
// Create appointment
const appointmentData = {
  clientId: selectedCustomer._id || selectedCustomer.id,
  clientName: selectedCustomer.name,
  date: format(values.date, "yyyy-MM-dd"),
  time: values.time,
  services: selectedServices.map(service => ({
    serviceId: service.serviceId,
    staffId: service.staffId,
    name: service.name,
    duration: service.duration,
    price: service.price,
  })),
  totalDuration: calculateTotalDuration(),
  totalAmount: calculateTotalAmount(),
  notes: values.notes,
  status: "scheduled",
}

const response = await AppointmentsAPI.create(appointmentData)
```

#### Data Validation
```typescript
const formSchema = z.object({
  date: z.date({
    required_error: "Please select a date.",
  }),
  time: z.string({
    required_error: "Please select a time.",
  }),
  notes: z.string().optional(),
})
```

## User Interface

### **Appointment Form Layout**

#### 1. **Header Section**
- Form title and description
- Navigation breadcrumbs
- Action buttons

#### 2. **Date & Time Selection**
- **Date Picker**: Calendar widget for date selection
- **Time Slots**: Dropdown with predefined time slots
- **Duration Display**: Shows total appointment duration

#### 3. **Client Selection**
- **Client Search**: Search existing clients
- **Client Dropdown**: Select from search results
- **New Client Button**: Create new client on-the-fly
- **Client Information**: Display selected client details

#### 4. **Service Management**
- **Service Selection**: Choose from available services
- **Staff Assignment**: Assign staff to each service
- **Service List**: Display selected services with details
- **Add/Remove Services**: Dynamic service management

#### 5. **Additional Information**
- **Notes Field**: Optional appointment notes
- **Total Calculation**: Display total duration and amount
- **Submit Button**: Create appointment

### **Calendar Interface**

#### 1. **Navigation Controls**
- **Week Navigation**: Previous/Next week buttons
- **Current Week**: Highlight current week
- **Date Display**: Show current week range

#### 2. **Appointment Display**
- **Time Slots**: Visual time slots for each day
- **Appointment Cards**: Display appointment details
- **Status Indicators**: Color-coded status badges
- **Client Information**: Show client name and contact

#### 3. **Appointment Details**
- **Modal Dialog**: Detailed appointment information
- **Client Details**: Name, phone, email
- **Service Information**: Services and staff assigned
- **Status Management**: Update appointment status
- **Notes Display**: Show appointment notes

### **Visual Design**

#### **Color Coding**
- **Scheduled**: Blue badges for scheduled appointments
- **Confirmed**: Green badges for confirmed appointments
- **Completed**: Gray badges for completed appointments
- **Cancelled**: Red badges for cancelled appointments

#### **Layout Structure**
- **Responsive Grid**: Adapts to different screen sizes
- **Card-Based Design**: Clean, modern card layout
- **Consistent Spacing**: Uniform spacing and alignment
- **Interactive Elements**: Hover effects and transitions

## Advanced Features

### **Multi-Service Appointments**
- **Multiple Services**: Add multiple services to one appointment
- **Individual Staff Assignment**: Different staff for different services
- **Duration Aggregation**: Automatic total duration calculation
- **Price Calculation**: Total appointment cost calculation

### **Client Integration**
- **Client History**: View client's appointment history
- **Contact Information**: Access client contact details
- **Service Preferences**: Track client service preferences
- **Visit Tracking**: Monitor client visit frequency

### **Staff Management**
- **Staff Availability**: Track staff schedules
- **Role-Based Assignment**: Assign based on staff roles
- **Workload Distribution**: Balance staff workload
- **Performance Tracking**: Monitor staff appointment completion

### **Status Management**
- **Status Workflow**: Scheduled → Confirmed → Completed
- **Status Updates**: Easy status modification
- **Cancellation Handling**: Proper cancellation process
- **No-Show Tracking**: Track missed appointments

## Configuration

### **Time Slot Configuration**
```typescript
// Customizable time slots
const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM"
]
```

### **Status Configuration**
```typescript
// Appointment status options
const appointmentStatuses = [
  "scheduled",
  "confirmed", 
  "completed",
  "cancelled"
]
```

### **Validation Rules**
```typescript
// Form validation
const validationRules = {
  date: "Required - Must be a valid date",
  time: "Required - Must be a valid time slot",
  client: "Required - Must select or create a client",
  services: "Required - Must add at least one service",
  staff: "Required - Must assign staff to each service"
}
```

## Benefits

### **For Staff**
- **Efficient Scheduling**: Quick and easy appointment creation
- **Clear Schedule**: Visual calendar for better time management
- **Client Information**: Easy access to client details
- **Service Tracking**: Clear view of assigned services

### **For Management**
- **Complete Overview**: Calendar view of all appointments
- **Staff Utilization**: Track staff schedules and workload
- **Client Management**: Monitor client appointments and history
- **Performance Metrics**: Track appointment completion rates

### **For Clients**
- **Professional Service**: Well-organized appointment system
- **Service History**: Access to appointment history
- **Clear Communication**: Detailed appointment information
- **Flexible Scheduling**: Multiple time slot options

## Integration Points

### **Client Management**
- Seamless integration with client database
- Automatic client information updates
- Client history and preference tracking

### **Service Management**
- Integration with service catalog
- Service pricing and duration tracking
- Service performance analytics

### **Staff Management**
- Staff schedule integration
- Workload distribution tracking
- Performance monitoring

### **Sales Integration**
- Appointment to sale conversion
- Revenue tracking from appointments
- Service performance analytics

## Future Enhancements

### **Planned Features**
- **Online Booking**: Client self-booking portal
- **Automated Reminders**: SMS/Email appointment reminders
- **Recurring Appointments**: Schedule recurring services
- **Waitlist Management**: Handle appointment waitlists

### **Advanced Features**
- **Resource Management**: Room/equipment scheduling
- **Conflict Detection**: Automatic scheduling conflict detection
- **Mobile App**: Mobile appointment management
- **Integration APIs**: Third-party calendar integration

This comprehensive appointment management system provides efficient scheduling capabilities while maintaining detailed records and providing excellent service to both staff and clients.
