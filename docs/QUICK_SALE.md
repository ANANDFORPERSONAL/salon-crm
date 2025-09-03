# Quick Sale Feature

## Overview

The Quick Sale feature is a comprehensive point-of-sale (POS) system that allows salon staff to quickly process sales transactions, manage customer information, handle multiple payment methods, and generate receipts. It's designed for fast, efficient checkout processes while maintaining detailed transaction records.

## Features

### 🛒 **Comprehensive POS System**
- **Service & Product Sales**: Add multiple services and products to a single transaction
- **Multi-Staff Assignment**: Assign multiple staff members to services with automatic contribution tracking
- **Real-time Calculations**: Automatic subtotal, tax, discount, and total calculations
- **Split Payments**: Accept multiple payment methods (Cash, Card, Online) in a single transaction

### 👥 **Customer Management**
- **Customer Search**: Quick search and selection of existing customers
- **New Customer Creation**: Add new customers on-the-fly during checkout
- **Customer History**: View previous bills and transaction history
- **Customer Information**: Access contact details and visit history

### 💰 **Payment Processing**
- **Multiple Payment Methods**: Cash, Card, and Online payments
- **Split Payments**: Combine different payment methods for a single transaction
- **Payment Validation**: Ensure total payments match transaction amount
- **Payment Status Tracking**: Track paid, partial, and unpaid transactions

### 🧾 **Receipt Generation**
- **Professional Receipts**: Generate detailed, printable receipts
- **Receipt Preview**: Preview receipts before printing
- **Receipt Storage**: Automatic storage of all transaction receipts
- **Receipt Numbering**: Automatic receipt number generation

### 📊 **Transaction Management**
- **Bill Status Tracking**: Completed, partial, and unpaid bill tracking
- **Payment Collection**: Handle partial payments and payment collection
- **Transaction History**: Complete audit trail of all transactions
- **Sales Integration**: Automatic integration with sales reporting

## How It Works

### 1. **Transaction Flow**
```
1. Select/Create Customer
2. Add Services & Products
3. Assign Staff (Multi-staff support)
4. Apply Discounts & Tips
5. Process Payments
6. Generate Receipt
7. Complete Transaction
```

### 2. **Data Structure**
```typescript
interface ServiceItem {
  id: string
  name: string
  type: 'service'
  quantity: number
  price: number
  discount: number
  total: number
  staffContributions?: StaffContribution[]  // Multi-staff support
  staffId?: string                          // Legacy support
  staffName?: string                        // Legacy support
}

interface ProductItem {
  id: string
  name: string
  type: 'product'
  quantity: number
  price: number
  discount: number
  total: number
}

interface Payment {
  type: 'cash' | 'card' | 'online'
  amount: number
}
```

### 3. **Calculation Logic**
```typescript
// Subtotal calculation
const subtotal = serviceItems.reduce((sum, item) => sum + item.total, 0) +
                 productItems.reduce((sum, item) => sum + item.total, 0)

// Tax calculation
const taxAmount = subtotal * (taxRate / 100)

// Grand total
const grandTotal = subtotal + taxAmount + tip - discountValue
```

## Technical Implementation

### **Main Component**

#### `QuickSale` Component
- **Location**: `components/appointments/quick-sale.tsx`
- **Size**: ~3000 lines of comprehensive POS functionality
- **State Management**: Complex state management for transaction data
- **API Integration**: Full integration with backend APIs

### **Key Features**

#### 1. **Customer Management**
```typescript
// Customer search and selection
const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null)
const [customerSearch, setCustomerSearch] = useState("")
const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

// New customer creation
const [newCustomer, setNewCustomer] = useState({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
})
```

#### 2. **Item Management**
```typescript
// Service and product items
const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
const [productItems, setProductItems] = useState<ProductItem[]>([])

// Multi-staff assignment integration
import { MultiStaffSelector, type StaffContribution } from "@/components/ui/multi-staff-selector"
```

#### 3. **Payment Processing**
```typescript
// Multiple payment methods
const [cashAmount, setCashAmount] = useState(0)
const [cardAmount, setCardAmount] = useState(0)
const [onlineAmount, setOnlineAmount] = useState(0)

// Payment validation
const totalPaid = cashAmount + cardAmount + onlineAmount
const billStatus = totalPaid < grandTotal ? 'partial' : 'completed'
```

### **Backend Integration**

#### Sales API Integration
```typescript
const saleData = {
  billNo: receipt.receiptNumber,
  customerName: receipt.clientName,
  customerPhone: receipt.clientPhone,
  date: new Date().toISOString(),
  paymentMode: salePayments.map(p => p.mode).join(', '),
  payments: salePayments,
  netTotal: receipt.subtotal,
  taxAmount: receipt.tax,
  grossTotal: receipt.total,
  status: billStatus,
  items: receipt.items.map(item => ({
    // ... item data with staff contributions
    staffContributions: item.staffContributions || [{
      staffId: item.staffId,
      staffName: item.staffName || '',
      percentage: 100,
      amount: item.total
    }]
  }))
}
```

#### Receipt Generation
```typescript
// Receipt creation with detailed item breakdown
const receiptData = {
  receiptNumber: generateReceiptNumber(),
  clientName: selectedCustomer?.name || 'Walk-in Customer',
  clientPhone: selectedCustomer?.phone || '',
  date: selectedDate.toISOString(),
  items: [...serviceItems, ...productItems],
  subtotal: calculateSubtotal(),
  tax: calculateTax(),
  tip: tip,
  discount: discountValue,
  total: calculateGrandTotal(),
  payments: payments,
  staffName: getStaffName(),
  status: billStatus
}
```

## User Interface

### **Layout Structure**

#### 1. **Header Section**
- Customer search and selection
- New customer creation button
- Date selection
- Customer information display

#### 2. **Items Section**
- **Services Tab**: Add services with multi-staff assignment
- **Products Tab**: Add products with quantity management
- **Grid Layout**: Organized display of items with columns for:
  - Service/Product name
  - Staff assignment (with MultiStaffSelector)
  - Quantity
  - Price
  - Discount
  - Total
  - Delete action

#### 3. **Payment Section**
- **Discount Management**: Percentage or fixed amount discounts
- **Tip Addition**: Optional tip amount
- **Payment Methods**: Cash, Card, Online payment inputs
- **Payment Validation**: Real-time payment total validation

#### 4. **Summary Section**
- **Subtotal**: Sum of all items
- **Tax**: Calculated tax amount
- **Discount**: Applied discount
- **Tip**: Added tip amount
- **Grand Total**: Final transaction amount
- **Payment Status**: Paid/Partial/Unpaid status

### **Visual Design**

#### **Grid Layout**
```typescript
// Responsive grid layout for items
grid-cols-[2fr_3fr_120px_100px_100px_100px_40px]
// Service | Staff | Qty | Price | Discount | Total | Delete
```

#### **Color Coding**
- **Green**: Success states, completed payments
- **Blue**: Information, customer data
- **Red**: Errors, delete actions
- **Yellow**: Warnings, partial payments

#### **Interactive Elements**
- **Dropdowns**: Customer search, service/product selection
- **Buttons**: Add items, process payment, generate receipt
- **Inputs**: Quantities, prices, payment amounts
- **Modals**: Customer creation, receipt preview

## Advanced Features

### **Multi-Staff Assignment Integration**
- **Seamless Integration**: MultiStaffSelector component integrated into service items
- **Automatic Calculation**: Staff contributions automatically calculated
- **Visual Feedback**: Clear display of assigned staff members
- **Data Persistence**: Staff assignment data saved with transaction

### **Payment Collection System**
- **Partial Payments**: Handle customers who can't pay full amount
- **Payment Tracking**: Track remaining balance for partial payments
- **Payment History**: View all payments for a transaction
- **Collection Reminders**: System for following up on unpaid amounts

### **Receipt Management**
- **Professional Formatting**: Clean, professional receipt layout
- **Print Support**: Direct printing capability
- **Digital Storage**: All receipts stored digitally
- **Receipt Search**: Find receipts by number, customer, or date

### **Customer Experience**
- **Quick Checkout**: Streamlined process for fast transactions
- **Customer History**: Access to previous transactions
- **Loyalty Tracking**: Track customer visits and spending
- **Contact Management**: Store and access customer contact information

## Configuration

### **Tax Settings**
```typescript
// Tax rate configuration
const taxRate = 8.25 // Configurable tax rate
const taxAmount = subtotal * (taxRate / 100)
```

### **Receipt Numbering**
```typescript
// Automatic receipt number generation
const generateReceiptNumber = () => {
  const prefix = "INV"
  const timestamp = Date.now().toString().slice(-6)
  return `${prefix}-${timestamp}`
}
```

### **Payment Validation**
```typescript
// Payment amount validation
const validatePayments = () => {
  const totalPaid = cashAmount + cardAmount + onlineAmount
  return totalPaid <= grandTotal
}
```

## Benefits

### **For Staff**
- **Fast Checkout**: Quick and efficient transaction processing
- **Easy to Use**: Intuitive interface requiring minimal training
- **Error Reduction**: Automatic calculations reduce human error
- **Multi-Payment Support**: Handle various payment scenarios

### **For Management**
- **Complete Records**: Detailed transaction history and reporting
- **Payment Tracking**: Monitor payment collection and outstanding amounts
- **Staff Performance**: Track staff contributions and performance
- **Customer Insights**: Understand customer behavior and preferences

### **For Customers**
- **Quick Service**: Fast checkout process
- **Multiple Payment Options**: Flexible payment methods
- **Professional Receipts**: Clear, detailed transaction records
- **Service History**: Access to previous transaction history

## Integration Points

### **Sales Reporting**
- All transactions automatically integrated into sales reports
- Staff performance tracking through multi-staff assignments
- Customer analytics and behavior insights

### **Inventory Management**
- Product sales automatically update inventory levels
- Stock tracking and low-stock alerts
- Product performance analytics

### **Customer Management**
- Customer data automatically updated with transaction history
- Visit tracking and customer lifetime value calculation
- Customer communication and marketing insights

### **Financial Management**
- Complete audit trail of all transactions
- Payment collection tracking and management
- Tax reporting and compliance support

## Future Enhancements

### **Planned Features**
- **Barcode Scanning**: Product scanning for faster checkout
- **Loyalty Program Integration**: Points and rewards system
- **Inventory Alerts**: Real-time stock level notifications
- **Advanced Reporting**: Detailed analytics and insights

### **Mobile Support**
- **Mobile POS**: Tablet and mobile device support
- **Offline Mode**: Continue operations without internet
- **Cloud Sync**: Automatic synchronization when online

This comprehensive Quick Sale system provides a complete POS solution that streamlines salon operations while maintaining detailed records and providing excellent customer service.
