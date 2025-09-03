# Client Management Feature

## Overview

The Client Management system is a comprehensive customer relationship management (CRM) solution that allows salon staff to create, manage, and track client information, preferences, and history. It provides detailed client profiles, visit tracking, spending analytics, and seamless integration with appointments and sales.

## Features

### 👥 **Comprehensive Client Profiles**
- **Personal Information**: Name, phone, email, address, gender, birthdate
- **Contact Management**: Multiple contact methods and preferences
- **Client Status**: Active/inactive status tracking
- **Notes & Preferences**: Detailed notes and service preferences

### 📊 **Visit & Spending Analytics**
- **Visit Tracking**: Total number of visits and visit history
- **Spending Analytics**: Total amount spent and spending patterns
- **Last Visit Tracking**: Most recent visit date and details
- **Real-time Updates**: Live calculation of visit and spending data

### 🔍 **Advanced Search & Filtering**
- **Quick Search**: Search by name, phone, or email
- **Advanced Filters**: Filter by status, visit frequency, spending range
- **Real-time Results**: Instant search results as you type
- **Sort Options**: Sort by name, last visit, total spent, etc.

### 📋 **Client Data Management**
- **Create New Clients**: Add new clients with comprehensive information
- **Edit Client Information**: Update existing client details
- **Delete Clients**: Remove clients with confirmation
- **Data Validation**: Phone number uniqueness and email validation

### 📈 **Client Analytics Dashboard**
- **Client Overview**: Summary statistics and key metrics
- **Visit Trends**: Track client visit patterns over time
- **Spending Analysis**: Analyze client spending behavior
- **Service Preferences**: Track popular services per client

## How It Works

### 1. **Client Creation Flow**
```
1. Fill Client Form (Name, Phone, Email, etc.)
2. Validate Information (Unique phone, valid email)
3. Save to Database
4. Update Client Store
5. Redirect to Client List
```

### 2. **Data Structure**
```typescript
interface Client {
  id?: string
  _id?: string
  name: string
  email?: string
  phone: string
  address?: string
  notes?: string
  gender: "male" | "female" | "other"
  birthdate?: string
  status: "active" | "inactive"
  totalVisits: number
  totalSpent: number
  lastVisit?: string
  createdAt: string
  // Real-time calculated fields
  realTotalVisits?: number
  realTotalSpent?: number
  realLastVisit?: string
}
```

### 3. **Form Validation**
```typescript
const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address.").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits.")
    .refine((phone) => {
      // Check for unique phone number
      const existingClient = allClients.find(c => 
        c.phone === phone && c.id !== client?.id
      )
      return !existingClient
    }, "Phone number already exists."),
  address: z.string().optional(),
  notes: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  birthdate: z.string().optional(),
})
```

## Technical Implementation

### **Main Components**

#### `ClientForm` Component
- **Location**: `components/clients/client-form.tsx`
- **Purpose**: Create and edit client information
- **Features**:
  - Comprehensive form with validation
  - Phone number uniqueness checking
  - Email validation
  - Name parsing (first/last name)
  - Real-time form validation

#### `ClientsList` Component
- **Location**: `components/clients/clients-list.tsx`
- **Purpose**: Display and manage client list
- **Features**:
  - Search functionality
  - Client statistics
  - Quick actions
  - Responsive design

#### `ClientDetails` Component
- **Location**: `components/clients/client-details.tsx`
- **Purpose**: View detailed client information
- **Features**:
  - Complete client profile
  - Edit/delete functionality
  - Visit history
  - Spending analytics

#### `ClientsTable` Component
- **Location**: `components/clients/clients-table.tsx`
- **Purpose**: Tabular display of clients
- **Features**:
  - Sortable columns
  - Action dropdowns
  - Real-time data updates
  - Pagination support

### **Key Features**

#### 1. **Client Store Integration**
```typescript
// Client store for state management
import { clientStore } from "@/lib/client-store"

// Add new client
const success = await clientStore.addClient(clientData)

// Update existing client
const success = await clientStore.updateClient(clientId, clientData)

// Delete client
const success = await clientStore.deleteClient(clientId)

// Get all clients
const clients = clientStore.getClients()

// Get client by ID
const client = clientStore.getClientById(clientId)
```

#### 2. **Real-time Data Updates**
```typescript
// Subscribe to client store changes
useEffect(() => {
  const unsubscribe = clientStore.subscribe(() => {
    const updatedClients = clientStore.getClients()
    setClients(updatedClients || [])
  })
  return unsubscribe
}, [])

// Update client statistics from sales data
const updateClientStats = async () => {
  const salesData = await SalesAPI.getAll()
  // Calculate real-time visit and spending data
  const updatedClients = clients.map(client => ({
    ...client,
    realTotalVisits: calculateTotalVisits(client.id, salesData),
    realTotalSpent: calculateTotalSpent(client.id, salesData),
    realLastVisit: getLastVisit(client.id, salesData)
  }))
  setClients(updatedClients)
}
```

#### 3. **Search Functionality**
```typescript
// Real-time search
const searchClients = async (query: string) => {
  if (!query.trim()) {
    setFilteredClients(clients)
    return
  }

  try {
    const response = await ClientsAPI.search({ q: query })
    if (response.success) {
      setFilteredClients(response.data)
    }
  } catch (error) {
    console.error('Search error:', error)
    // Fallback to local search
    const localResults = clients.filter(client =>
      client.name.toLowerCase().includes(query.toLowerCase()) ||
      client.phone.includes(query) ||
      client.email?.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredClients(localResults)
  }
}
```

### **Backend Integration**

#### Clients API
```typescript
// Create client
const response = await ClientsAPI.create({
  name: `${values.firstName} ${values.lastName}`,
  email: values.email,
  phone: values.phone,
  address: values.address,
  notes: values.notes,
  gender: values.gender,
  birthdate: values.birthdate,
  status: "active"
})

// Update client
const response = await ClientsAPI.update(clientId, clientData)

// Delete client
const response = await ClientsAPI.delete(clientId)

// Search clients
const response = await ClientsAPI.search({ q: searchQuery })
```

#### Data Validation
```typescript
// Phone number uniqueness validation
const validatePhoneUniqueness = (phone: string, excludeId?: string) => {
  const allClients = clientStore.getClients()
  const existingClient = allClients.find(c => 
    c.phone === phone && c.id !== excludeId
  )
  return !existingClient
}

// Email format validation
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

## User Interface

### **Client List Layout**

#### 1. **Header Section**
- **Page Title**: "Client Management" with description
- **New Client Button**: Quick access to create new clients
- **Search Bar**: Real-time search functionality
- **Statistics Cards**: Total clients, active clients, etc.

#### 2. **Client Table**
- **Columns**: Name, Phone, Email, Last Visit, Total Visits, Total Spent, Status, Actions
- **Sortable Headers**: Click to sort by any column
- **Action Dropdown**: View, Edit, Delete options
- **Status Badges**: Color-coded active/inactive status

#### 3. **Search & Filter**
- **Search Input**: Search by name, phone, or email
- **Filter Options**: Filter by status, visit frequency
- **Real-time Results**: Instant search results
- **Clear Filters**: Reset search and filters

### **Client Form Layout**

#### 1. **Personal Information**
- **Name Fields**: First name and last name
- **Contact Information**: Phone and email
- **Address**: Optional address field
- **Demographics**: Gender and birthdate

#### 2. **Additional Information**
- **Notes**: Free-text notes field
- **Status**: Active/inactive selection
- **Validation Messages**: Real-time validation feedback

#### 3. **Form Actions**
- **Save Button**: Create or update client
- **Cancel Button**: Discard changes
- **Loading States**: Show processing status

### **Client Details Layout**

#### 1. **Client Profile**
- **Personal Information**: Complete client details
- **Contact Information**: Phone, email, address
- **Status & Preferences**: Client status and notes

#### 2. **Statistics Section**
- **Visit Statistics**: Total visits and last visit
- **Spending Analytics**: Total spent and average per visit
- **Service History**: Recent services and preferences

#### 3. **Action Buttons**
- **Edit Button**: Modify client information
- **Delete Button**: Remove client with confirmation
- **Back Button**: Return to client list

### **Visual Design**

#### **Color Coding**
- **Active Clients**: Green badges for active status
- **Inactive Clients**: Gray badges for inactive status
- **High Spenders**: Special highlighting for VIP clients
- **New Clients**: Blue highlighting for recently added clients

#### **Layout Structure**
- **Responsive Grid**: Adapts to different screen sizes
- **Card-Based Design**: Clean, modern card layout
- **Consistent Spacing**: Uniform spacing and alignment
- **Interactive Elements**: Hover effects and transitions

## Advanced Features

### **Client Analytics**
- **Visit Patterns**: Track client visit frequency and timing
- **Spending Analysis**: Analyze client spending behavior
- **Service Preferences**: Track popular services per client
- **Loyalty Tracking**: Identify and reward loyal clients

### **Integration Features**
- **Appointment Integration**: Seamless appointment scheduling
- **Sales Integration**: Automatic visit and spending updates
- **Service History**: Track all services received by client
- **Payment History**: Complete payment and transaction history

### **Data Management**
- **Bulk Operations**: Import/export client data
- **Data Validation**: Comprehensive validation rules
- **Duplicate Detection**: Prevent duplicate client entries
- **Data Backup**: Automatic data backup and recovery

### **Communication Features**
- **Contact Management**: Multiple contact methods
- **Communication History**: Track all client communications
- **Reminder System**: Automated appointment reminders
- **Marketing Integration**: Client segmentation for marketing

## Configuration

### **Form Validation Rules**
```typescript
const validationRules = {
  firstName: "Required - Minimum 2 characters",
  lastName: "Required - Minimum 2 characters", 
  phone: "Required - Minimum 10 digits, must be unique",
  email: "Optional - Must be valid email format",
  gender: "Required - Must select gender",
  address: "Optional - Free text",
  notes: "Optional - Free text",
  birthdate: "Optional - Date format"
}
```

### **Search Configuration**
```typescript
const searchConfig = {
  searchFields: ["name", "phone", "email"],
  minSearchLength: 2,
  debounceDelay: 300,
  maxResults: 50
}
```

### **Display Settings**
```typescript
const displayConfig = {
  itemsPerPage: 25,
  sortOptions: ["name", "lastVisit", "totalSpent", "createdAt"],
  defaultSort: "name",
  showColumns: ["name", "phone", "email", "lastVisit", "totalSpent", "status"]
}
```

## Benefits

### **For Staff**
- **Quick Access**: Fast client lookup and information access
- **Complete Profiles**: All client information in one place
- **Visit History**: Easy access to client service history
- **Contact Management**: Multiple ways to reach clients

### **For Management**
- **Client Analytics**: Detailed insights into client behavior
- **Revenue Tracking**: Monitor client spending and value
- **Service Optimization**: Understand popular services
- **Customer Retention**: Track and improve client retention

### **For Clients**
- **Personalized Service**: Staff have complete client information
- **Consistent Experience**: Same service quality every visit
- **Preference Tracking**: Services tailored to client preferences
- **Communication**: Multiple contact methods available

## Integration Points

### **Appointment System**
- Seamless client selection during appointment creation
- Automatic visit tracking from appointments
- Client preference integration

### **Sales System**
- Automatic spending calculation from sales
- Visit tracking from completed services
- Payment history integration

### **Service Management**
- Service preference tracking
- Popular service analytics
- Service recommendation system

### **Reporting System**
- Client analytics and insights
- Revenue per client tracking
- Customer retention metrics

## Future Enhancements

### **Planned Features**
- **Client Segmentation**: Group clients by behavior and preferences
- **Loyalty Program**: Points and rewards system
- **Communication Tools**: SMS and email integration
- **Client Portal**: Self-service client portal

### **Advanced Analytics**
- **Predictive Analytics**: Predict client behavior and preferences
- **Churn Analysis**: Identify clients at risk of leaving
- **Revenue Forecasting**: Predict future revenue from clients
- **Service Optimization**: Optimize service offerings based on client data

This comprehensive client management system provides a complete CRM solution that enhances customer relationships while providing valuable business insights and operational efficiency.
