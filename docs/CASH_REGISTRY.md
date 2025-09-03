# Cash Registry Feature

## Overview

The Cash Registry system is a comprehensive cash management solution that allows salon staff to track opening and closing cash balances, manage currency denominations, monitor cash flow, and maintain accurate financial records. It provides detailed cash tracking, verification systems, and comprehensive reporting for financial transparency and accountability.

## Features

### 💰 **Cash Balance Management**
- **Opening Balance**: Record starting cash amount for each shift
- **Closing Balance**: Track ending cash amount with detailed breakdown
- **Currency Denominations**: Manage individual currency notes and coins
- **Real-time Calculations**: Automatic calculation of total cash amounts

### 📊 **Shift Management**
- **Opening Shifts**: Record opening cash balance and denominations
- **Closing Shifts**: Record closing cash balance with verification
- **Shift Tracking**: Monitor cash flow throughout the day
- **User Attribution**: Track which staff member created each entry

### 🔍 **Cash Flow Monitoring**
- **Cash Sales Tracking**: Monitor cash received from sales
- **Expense Tracking**: Track cash expenses and disbursements
- **Balance Verification**: Compare expected vs actual cash amounts
- **Difference Analysis**: Identify and resolve cash discrepancies

### 📈 **Comprehensive Reporting**
- **Daily Summaries**: Complete daily cash flow reports
- **Period Reports**: Weekly, monthly, and custom period reports
- **Cash Analysis**: Detailed cash flow analysis and trends
- **Verification Reports**: Audit trail and verification status

### 🛡️ **Security & Verification**
- **Multi-level Verification**: Staff and manager verification system
- **Audit Trail**: Complete history of all cash registry entries
- **Access Control**: Role-based access to cash registry functions
- **Data Integrity**: Validation and error checking for all entries

## How It Works

### 1. **Cash Registry Flow**
```
1. Select Shift Type (Opening/Closing)
2. Enter Cash Denominations
3. Calculate Total Balance
4. Add Additional Information (Online Cash, POS Cash)
5. Save Entry
6. Verification Process
7. Generate Reports
```

### 2. **Data Structure**
```typescript
interface CashRegistryEntry {
  id: string
  date: string
  shiftType: "opening" | "closing"
  createdBy: string
  openingBalance: number
  closingBalance: number
  totalBalance: number
  denominations: Array<{
    value: number
    count: number
    total: number
  }>
  onlineCash: number
  posCash: number
  balanceDifference: number
  onlinePosDifference: number
  status: "active" | "closed" | "verified"
  isVerified: boolean
  createdAt: string
}

interface CurrencyDenomination {
  value: number
  count: number
  total: number
}
```

### 3. **Calculation Logic**
```typescript
// Calculate total balance from denominations
const calculateTotalBalance = (denominations: CurrencyDenomination[]) => {
  return denominations.reduce((sum, denomination) => {
    return sum + (denomination.value * denomination.count)
  }, 0)
}

// Calculate cash difference
const cashDifference = closingBalance - (openingBalance + cashCollected - expenses)

// Calculate online/POS difference
const onlinePosDifference = posCash - onlineSales
```

## Technical Implementation

### **Main Components**

#### `CashRegistryModal` Component
- **Location**: `components/cash-registry/cash-registry-modal.tsx`
- **Purpose**: Create and manage cash registry entries
- **Features**:
  - Shift type selection (opening/closing)
  - Currency denomination management
  - Real-time balance calculation
  - Form validation and submission

#### `CashRegistryReport` Component
- **Location**: `components/cash-registry/cash-registry-report.tsx`
- **Purpose**: Display comprehensive cash registry reports
- **Features**:
  - Daily summaries and period reports
  - Cash flow analysis
  - Verification status tracking
  - Export and printing capabilities

#### `VerificationModal` Component
- **Location**: `components/cash-registry/verification-modal.tsx`
- **Purpose**: Verify and approve cash registry entries
- **Features**:
  - Multi-level verification
  - Audit trail management
  - Status updates
  - Security controls

### **Key Features**

#### 1. **Currency Denomination Management**
```typescript
// Currency denominations configuration
const currencyDenominations = [
  { value: 2000, label: "₹2000" },
  { value: 500, label: "₹500" },
  { value: 200, label: "₹200" },
  { value: 100, label: "₹100" },
  { value: 50, label: "₹50" },
  { value: 20, label: "₹20" },
  { value: 10, label: "₹10" },
  { value: 5, label: "₹5" },
  { value: 2, label: "₹2" },
  { value: 1, label: "₹1" }
]

// Handle denomination changes
const handleDenominationChange = (value: number, count: number) => {
  setDenominations(prev => prev.map(d => 
    d.value === value ? { ...d, count, total: value * count } : d
  ))
}
```

#### 2. **Real-time Balance Calculation**
```typescript
// Calculate total balance
const totalBalance = denominations.reduce((sum, d) => sum + d.total, 0)

// Calculate cash flow
const cashFlow = {
  openingBalance: shift === "opening" ? totalBalance : 0,
  closingBalance: shift === "closing" ? totalBalance : 0,
  cashCollected: getRealTimeCashSales(),
  expenses: getRealTimeExpenses(),
  onlineSales: getRealTimeOnlineSales()
}
```

#### 3. **Form Validation**
```typescript
const validateForm = () => {
  if (!date) {
    toast({ title: "Error", description: "Please select a date", variant: "destructive" })
    return false
  }
  
  if (!shift) {
    toast({ title: "Error", description: "Please select shift type", variant: "destructive" })
    return false
  }
  
  const hasDenominations = denominations.some(d => d.count > 0)
  if (!hasDenominations) {
    toast({ title: "Error", description: "Please enter at least one denomination", variant: "destructive" })
    return false
  }
  
  return true
}
```

### **Backend Integration**

#### Cash Registry API
```typescript
// Create cash registry entry
const cashRegistryData = {
  date: date,
  shiftType: shift,
  createdBy: user?.name || user?.email || "Unknown User",
  denominations: cleanDenominations,
  openingBalance: shift === "opening" ? calculatedTotalBalance : 0,
  closingBalance: shift === "closing" ? calculatedTotalBalance : 0,
  onlineCash: shift === "closing" ? cashCollectedOnline : 0,
  posCash: shift === "closing" ? cashInPosMachine : 0,
  notes: `Cash registry entry for ${shift} shift`
}

const response = await CashRegistryAPI.create(cashRegistryData)
```

#### Data Processing
```typescript
// Clean and validate denominations data
const cleanDenominations = denominations
  .filter(d => d.count > 0 && d.value > 0 && d.total > 0)
  .map(d => ({
    value: Number(d.value),
    count: Number(d.count),
    total: Number(d.total)
  }))

// Recalculate total balance from cleaned denominations
const calculatedTotalBalance = cleanDenominations.reduce((sum, d) => sum + d.total, 0)
```

## User Interface

### **Cash Registry Modal Layout**

#### 1. **Header Section**
- **Modal Title**: "Cash Registry Entry"
- **Close Button**: Close modal without saving
- **Date Selection**: Select date for the entry

#### 2. **Shift Type Selection**
- **Radio Buttons**: Opening or Closing shift selection
- **Shift Description**: Clear explanation of each shift type
- **Visual Indicators**: Color-coded shift types

#### 3. **Currency Denominations**
- **Denomination Grid**: Input fields for each currency value
- **Count Input**: Number of notes/coins for each denomination
- **Total Calculation**: Automatic total calculation per denomination
- **Grand Total**: Overall cash balance display

#### 4. **Additional Information**
- **Online Cash**: Cash collected through online payments
- **POS Cash**: Cash in POS machine
- **Notes Field**: Optional notes for the entry

#### 5. **Action Buttons**
- **Save Button**: Save the cash registry entry
- **Cancel Button**: Discard changes and close
- **Loading States**: Show processing status

### **Cash Registry Report Layout**

#### 1. **Report Header**
- **Page Title**: "Cash Registry Report"
- **Period Selection**: Today, Yesterday, Last 7 Days, etc.
- **Export Options**: Print and export functionality

#### 2. **Summary Cards**
- **Total Entries**: Number of cash registry entries
- **Opening Balance**: Total opening balance
- **Closing Balance**: Total closing balance
- **Cash Difference**: Difference between expected and actual

#### 3. **Daily Summaries**
- **Date Grouping**: Entries grouped by date
- **Opening/Closing Pairs**: Matching opening and closing entries
- **Balance Analysis**: Detailed balance calculations
- **Status Indicators**: Verification status for each entry

#### 4. **Detailed Breakdown**
- **Denomination Details**: Breakdown of currency denominations
- **Cash Flow Analysis**: Income, expenses, and net cash flow
- **Difference Analysis**: Identification of discrepancies
- **Verification Status**: Audit trail and verification history

### **Visual Design**

#### **Color Coding**
- **Opening Shifts**: Blue indicators for opening entries
- **Closing Shifts**: Green indicators for closing entries
- **Verified Entries**: Gold badges for verified entries
- **Discrepancies**: Red highlighting for cash differences

#### **Layout Structure**
- **Responsive Grid**: Adapts to different screen sizes
- **Card-Based Design**: Clean, organized card layout
- **Consistent Spacing**: Uniform spacing and alignment
- **Interactive Elements**: Hover effects and transitions

## Advanced Features

### **Cash Flow Analysis**
- **Real-time Tracking**: Live cash flow monitoring
- **Sales Integration**: Automatic cash sales calculation
- **Expense Tracking**: Cash expense monitoring
- **Balance Verification**: Expected vs actual balance comparison

### **Verification System**
- **Multi-level Verification**: Staff and manager approval
- **Audit Trail**: Complete history of all changes
- **Status Tracking**: Track verification status
- **Security Controls**: Role-based access management

### **Reporting & Analytics**
- **Daily Reports**: Comprehensive daily cash summaries
- **Period Analysis**: Weekly, monthly, and custom reports
- **Trend Analysis**: Cash flow trends over time
- **Export Capabilities**: PDF and Excel export options

### **Integration Features**
- **Sales Integration**: Automatic cash sales calculation
- **Expense Integration**: Cash expense tracking
- **User Management**: Staff attribution and tracking
- **Notification System**: Alerts for discrepancies

## Configuration

### **Currency Configuration**
```typescript
const currencyConfig = {
  denominations: [
    { value: 2000, label: "₹2000" },
    { value: 500, label: "₹500" },
    { value: 200, label: "₹200" },
    { value: 100, label: "₹100" },
    { value: 50, label: "₹50" },
    { value: 20, label: "₹20" },
    { value: 10, label: "₹10" },
    { value: 5, label: "₹5" },
    { value: 2, label: "₹2" },
    { value: 1, label: "₹1" }
  ],
  currency: "INR",
  symbol: "₹"
}
```

### **Validation Rules**
```typescript
const validationRules = {
  date: "Required - Must be a valid date",
  shiftType: "Required - Must select opening or closing",
  denominations: "Required - Must enter at least one denomination",
  count: "Must be a positive number",
  total: "Must be calculated correctly"
}
```

### **Access Control**
```typescript
const accessControl = {
  create: ["manager", "admin"],
  view: ["staff", "manager", "admin"],
  verify: ["manager", "admin"],
  delete: ["admin"]
}
```

## Benefits

### **For Staff**
- **Easy Cash Management**: Simple interface for cash tracking
- **Accurate Records**: Detailed denomination tracking
- **Quick Verification**: Fast verification process
- **Clear Instructions**: Step-by-step guidance

### **For Management**
- **Financial Transparency**: Complete cash flow visibility
- **Audit Trail**: Detailed audit trail for compliance
- **Discrepancy Detection**: Early identification of cash issues
- **Performance Monitoring**: Track cash handling performance

### **For Business**
- **Financial Control**: Better cash flow management
- **Compliance**: Meet financial reporting requirements
- **Security**: Reduce cash handling risks
- **Efficiency**: Streamline cash management processes

## Integration Points

### **Sales System**
- Automatic cash sales calculation
- Real-time cash flow updates
- Payment method tracking

### **Expense Management**
- Cash expense tracking
- Expense categorization
- Cash disbursement monitoring

### **User Management**
- Staff attribution
- Role-based access
- Activity tracking

### **Reporting System**
- Financial reporting integration
- Cash flow analytics
- Compliance reporting

## Future Enhancements

### **Planned Features**
- **Mobile App**: Mobile cash registry management
- **Barcode Scanning**: Currency counting automation
- **Integration APIs**: Third-party accounting integration
- **Advanced Analytics**: Predictive cash flow analysis

### **Security Enhancements**
- **Biometric Verification**: Fingerprint/face recognition
- **Encryption**: Enhanced data encryption
- **Backup Systems**: Automated backup and recovery
- **Compliance Tools**: Enhanced compliance reporting

This comprehensive cash registry system provides complete cash management capabilities while maintaining financial transparency and ensuring accurate record-keeping for salon operations.
