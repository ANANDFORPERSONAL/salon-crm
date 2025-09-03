# Settings & Configuration Feature

## Overview

The Settings & Configuration system is a comprehensive administration panel that allows salon owners and managers to customize the CRM system according to their business needs. It provides centralized control over all system settings, business configurations, user permissions, and operational preferences.

## Features

### ⚙️ **System Configuration**
- **General Settings**: Language, timezone, date/time formats, currency
- **User Preferences**: Dark mode, notifications, auto-save settings
- **Application Settings**: Default values, system behavior, UI preferences
- **Localization**: Multi-language support and regional settings

### 🏢 **Business Management**
- **Business Information**: Company details, contact information, branding
- **Business Settings**: Business type, operating hours, service categories
- **Branding Configuration**: Logo, colors, themes, custom styling
- **Business Rules**: Policies, terms, and business-specific configurations

### 📅 **Appointment Configuration**
- **Booking Rules**: Booking window, slot duration, buffer time
- **Time Management**: Operating hours, break times, availability
- **Booking Policies**: Advance booking limits, cancellation policies
- **Reminder Settings**: Automated reminders, notification timing

### 💳 **Payment & Billing**
- **Payment Methods**: Configure accepted payment methods
- **Tax Settings**: Tax rates, tax categories, tax calculations
- **Billing Configuration**: Invoice templates, payment terms
- **Processing Fees**: Payment processing fees and calculations

### 🧾 **POS & Receipt Management**
- **Invoice Settings**: Invoice numbering, prefixes, sequences
- **Receipt Configuration**: Receipt templates, formatting options
- **Print Settings**: Printer configuration, receipt layout
- **Numbering System**: Automatic numbering, custom sequences

### 🔔 **Notification System**
- **Email Notifications**: Email alerts, templates, delivery settings
- **SMS Notifications**: SMS alerts, provider configuration
- **Appointment Reminders**: Automated reminder system
- **System Alerts**: Low stock, payment alerts, system notifications

### 👥 **Staff & User Management**
- **Staff Directory**: Staff information, roles, permissions
- **User Access Control**: Role-based access, permission management
- **Staff Scheduling**: Work schedules, availability management
- **Performance Settings**: Commission rates, performance tracking

## How It Works

### 1. **Settings Navigation Flow**
```
1. Access Settings Page
2. Select Settings Category
3. Configure Settings
4. Save Changes
5. Apply Configuration
6. Verify Changes
```

### 2. **Data Structure**
```typescript
interface SettingsCategory {
  id: string
  title: string
  description: string
  icon: React.ComponentType
  requiredRole: "admin" | "manager" | "staff" | null
}

interface GeneralSettings {
  language: string
  timezone: string
  dateFormat: string
  timeFormat: "12h" | "24h"
  currency: string
  darkMode: boolean
  notifications: boolean
  autoSave: boolean
}

interface BusinessSettings {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  website?: string
  description?: string
  socialMedia?: string
}

interface AppointmentSettings {
  bookingWindow: string
  slotDuration: string
  bufferTime: string
  maxAdvanceBooking: string
  allowOnlineBooking: boolean
  requireDeposit: boolean
  sendReminders: boolean
  reminderTime: string
  allowCancellation: boolean
  cancellationWindow: string
}
```

### 3. **Role-Based Access Control**
```typescript
const settingsCategories = [
  {
    id: "general",
    title: "General Settings",
    requiredRole: null, // All users can access
  },
  {
    id: "business",
    title: "Business Settings", 
    requiredRole: "admin", // Only admin
  },
  {
    id: "appointments",
    title: "Appointment Settings",
    requiredRole: "manager", // Manager and above
  },
  {
    id: "payments",
    title: "Payment Settings",
    requiredRole: "admin", // Only admin
  },
  {
    id: "staff",
    title: "Staff Directory",
    requiredRole: "manager", // Manager and above
  }
]
```

## Technical Implementation

### **Main Components**

#### `SettingsPage` Component
- **Location**: `components/settings/settings-page.tsx`
- **Purpose**: Main settings navigation and layout
- **Features**:
  - Category navigation
  - Role-based access control
  - Settings component rendering
  - Responsive layout

#### `GeneralSettings` Component
- **Location**: `components/settings/general-settings.tsx`
- **Purpose**: General application settings
- **Features**:
  - Language and timezone selection
  - Date/time format configuration
  - Currency settings
  - UI preferences

#### `BusinessSettings` Component
- **Location**: `components/settings/business-settings.tsx`
- **Purpose**: Business information and branding
- **Features**:
  - Company information
  - Contact details
  - Business address
  - Social media links

#### `AppointmentSettings` Component
- **Location**: `components/settings/appointment-settings.tsx`
- **Purpose**: Appointment and booking configuration
- **Features**:
  - Booking rules and policies
  - Time slot configuration
  - Reminder settings
  - Cancellation policies

#### `PaymentSettings` Component
- **Location**: `components/settings/payment-settings.tsx`
- **Purpose**: Payment and billing configuration
- **Features**:
  - Payment method settings
  - Tax configuration
  - Billing preferences
  - Processing fee settings

#### `NotificationSettings` Component
- **Location**: `components/settings/notification-settings.tsx`
- **Purpose**: Notification and alert configuration
- **Features**:
  - Email notification settings
  - SMS configuration
  - Reminder preferences
  - Alert management

#### `POSSettings` Component
- **Location**: `components/settings/pos-settings.tsx`
- **Purpose**: POS and receipt configuration
- **Features**:
  - Invoice numbering
  - Receipt templates
  - Print settings
  - Sequence management

#### `StaffDirectory` Component
- **Location**: `components/settings/staff-directory.tsx`
- **Purpose**: Staff and user management
- **Features**:
  - Staff information management
  - Role and permission assignment
  - Access control
  - Performance settings

### **Key Features**

#### 1. **Role-Based Access Control**
```typescript
const hasAccess = (requiredRole: string | null) => {
  if (!requiredRole) return true // No role required
  
  const userRole = user?.role
  if (!userRole) return false
  
  const roleHierarchy = { admin: 3, manager: 2, staff: 1 }
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy]
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy]
  
  return userLevel >= requiredLevel
}

// Filter settings categories based on user role
const accessibleCategories = settingsCategories.filter(category => 
  hasAccess(category.requiredRole)
)
```

#### 2. **Settings State Management**
```typescript
const [settings, setSettings] = useState({
  language: "en",
  timezone: "America/New_York",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  currency: "USD",
  darkMode: false,
  notifications: true,
  autoSave: true,
})

// Handle setting changes
const handleSettingChange = (key: string, value: any) => {
  setSettings(prev => ({
    ...prev,
    [key]: value
  }))
}
```

#### 3. **Settings Persistence**
```typescript
const handleSave = async () => {
  setIsLoading(true)
  try {
    // Save settings to backend
    const response = await SettingsAPI.update(settings)
    
    if (response.success) {
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })
    } else {
      throw new Error("Failed to save settings")
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to save settings. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsLoading(false)
  }
}
```

### **Backend Integration**

#### Settings API
```typescript
// Get settings
const getSettings = async (category: string) => {
  const response = await SettingsAPI.get(category)
  return response.data
}

// Update settings
const updateSettings = async (category: string, settings: any) => {
  const response = await SettingsAPI.update(category, settings)
  return response.success
}

// Get business settings
const getBusinessSettings = async () => {
  const response = await SettingsAPI.getBusiness()
  return response.data
}
```

#### Data Validation
```typescript
const validateBusinessSettings = (settings: BusinessSettings) => {
  const errors = []
  
  if (!settings.name?.trim()) {
    errors.push("Business name is required")
  }
  
  if (!settings.email?.trim()) {
    errors.push("Email is required")
  } else if (!isValidEmail(settings.email)) {
    errors.push("Please enter a valid email address")
  }
  
  if (!settings.phone?.trim()) {
    errors.push("Phone number is required")
  }
  
  if (!settings.address?.trim()) {
    errors.push("Address is required")
  }
  
  return errors
}
```

## User Interface

### **Settings Page Layout**

#### 1. **Header Section**
- **Page Title**: "Settings & Configuration" with description
- **Feature Highlights**: Key configuration areas
- **Navigation Breadcrumbs**: Current location in settings

#### 2. **Settings Navigation**
- **Category List**: All available settings categories
- **Role Indicators**: Show which categories are accessible
- **Active Category**: Highlight currently selected category
- **Quick Access**: Direct links to frequently used settings

#### 3. **Settings Content**
- **Category Header**: Title and description of current category
- **Settings Form**: Configuration options and controls
- **Save Actions**: Save, cancel, and reset options
- **Status Indicators**: Show unsaved changes and validation errors

#### 4. **Settings Categories**

##### **General Settings**
- **Language Selection**: Dropdown for language selection
- **Timezone Configuration**: Timezone picker
- **Date/Time Formats**: Format selection options
- **Currency Settings**: Currency selection and formatting
- **UI Preferences**: Dark mode, notifications, auto-save

##### **Business Settings**
- **Company Information**: Name, email, phone, address
- **Business Details**: Description, website, social media
- **Location Information**: City, state, zip code
- **Branding Options**: Logo upload, color themes

##### **Appointment Settings**
- **Booking Configuration**: Booking window, slot duration
- **Time Management**: Buffer time, advance booking limits
- **Policies**: Online booking, deposits, cancellations
- **Reminders**: Automated reminders and timing

##### **Payment Settings**
- **Payment Methods**: Enable/disable payment options
- **Tax Configuration**: Tax rates and categories
- **Billing Settings**: Invoice templates, payment terms
- **Processing Fees**: Fee configuration and calculations

##### **Notification Settings**
- **Email Notifications**: Email alerts and templates
- **SMS Notifications**: SMS provider and settings
- **Appointment Reminders**: Reminder timing and content
- **System Alerts**: Low stock, payment alerts

##### **POS Settings**
- **Invoice Numbering**: Prefix, sequence, auto-increment
- **Receipt Configuration**: Templates and formatting
- **Print Settings**: Printer configuration and layout
- **Numbering System**: Custom sequences and rules

##### **Staff Directory**
- **Staff Management**: Add, edit, delete staff members
- **Role Assignment**: Assign roles and permissions
- **Access Control**: Manage user access levels
- **Performance Settings**: Commission rates and tracking

### **Visual Design**

#### **Layout Structure**
- **Sidebar Navigation**: Left sidebar with settings categories
- **Main Content**: Right side with settings forms
- **Responsive Design**: Adapts to different screen sizes
- **Card-Based Layout**: Clean, organized card design

#### **Color Coding**
- **Active Category**: Blue highlighting for selected category
- **Required Fields**: Red indicators for required fields
- **Success States**: Green for successful saves
- **Error States**: Red for validation errors

#### **Interactive Elements**
- **Form Controls**: Inputs, selects, switches, toggles
- **Save Buttons**: Primary action buttons for saving
- **Cancel Buttons**: Secondary buttons for canceling
- **Reset Buttons**: Reset to default values

## Advanced Features

### **Settings Validation**
- **Real-time Validation**: Validate settings as user types
- **Required Field Checking**: Ensure all required fields are filled
- **Format Validation**: Validate email, phone, date formats
- **Business Rule Validation**: Validate business-specific rules

### **Settings Backup & Restore**
- **Settings Export**: Export settings to file
- **Settings Import**: Import settings from file
- **Default Settings**: Reset to default configuration
- **Settings History**: Track settings changes over time

### **Multi-User Settings**
- **User-Specific Settings**: Personal preferences per user
- **Global Settings**: System-wide configuration
- **Role-Based Defaults**: Default settings based on user role
- **Settings Inheritance**: Inherit settings from higher roles

### **Settings Migration**
- **Version Migration**: Migrate settings between versions
- **Data Migration**: Migrate settings data during updates
- **Backup Migration**: Migrate settings backups
- **Rollback Support**: Rollback to previous settings

## Configuration

### **Settings Categories**
```typescript
const settingsConfig = {
  categories: [
    {
      id: "general",
      title: "General Settings",
      description: "Basic application preferences",
      requiredRole: null,
      icon: "Settings"
    },
    {
      id: "business", 
      title: "Business Settings",
      description: "Company information and branding",
      requiredRole: "admin",
      icon: "Building2"
    }
    // ... more categories
  ],
  defaultCategory: "general",
  saveTimeout: 5000 // Auto-save after 5 seconds of inactivity
}
```

### **Validation Rules**
```typescript
const validationRules = {
  business: {
    name: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, type: "email" },
    phone: { required: true, pattern: /^[\+]?[1-9][\d]{0,15}$/ },
    address: { required: true, minLength: 10 }
  },
  appointments: {
    bookingWindow: { required: true, min: 1, max: 365 },
    slotDuration: { required: true, min: 15, max: 120 },
    bufferTime: { required: true, min: 0, max: 60 }
  }
}
```

### **Access Control**
```typescript
const accessControl = {
  general: ["admin", "manager", "staff"],
  business: ["admin"],
  appointments: ["admin", "manager"],
  payments: ["admin"],
  notifications: ["admin", "manager"],
  staff: ["admin", "manager"]
}
```

## Benefits

### **For Administrators**
- **Complete Control**: Full control over system configuration
- **Business Customization**: Customize system for business needs
- **User Management**: Manage staff and user permissions
- **System Optimization**: Optimize system performance and behavior

### **For Managers**
- **Operational Control**: Control operational settings and policies
- **Staff Management**: Manage staff settings and permissions
- **Business Rules**: Configure business rules and policies
- **Reporting Configuration**: Configure reporting and analytics

### **For Staff**
- **Personal Preferences**: Customize personal settings and preferences
- **User Experience**: Optimize user experience and workflow
- **Notification Control**: Control notification preferences
- **Interface Customization**: Customize interface and display options

## Integration Points

### **User Management**
- Role-based access control
- Permission management
- User preference storage
- Authentication integration

### **Business Logic**
- Business rule configuration
- Operational policy settings
- Workflow customization
- Process optimization

### **System Configuration**
- Application settings
- Database configuration
- API configuration
- External service integration

### **Notification System**
- Email configuration
- SMS provider setup
- Alert management
- Reminder configuration

## Future Enhancements

### **Planned Features**
- **Settings Templates**: Pre-configured settings templates
- **Bulk Settings**: Bulk configuration and updates
- **Settings API**: External settings management API
- **Advanced Validation**: Complex validation rules and dependencies

### **Advanced Configuration**
- **Conditional Settings**: Settings that depend on other settings
- **Settings Groups**: Group related settings together
- **Settings Inheritance**: Hierarchical settings inheritance
- **Dynamic Settings**: Settings that change based on context

This comprehensive settings and configuration system provides complete control over the salon CRM system, enabling customization and optimization for specific business needs while maintaining security and usability.
