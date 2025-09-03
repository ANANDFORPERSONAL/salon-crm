# Reports & Analytics Feature

## Overview

The Reports & Analytics system is a comprehensive business intelligence solution that provides detailed insights into salon operations, financial performance, and business trends. It offers multiple report types, interactive dashboards, and data visualization tools to help salon owners and managers make informed business decisions.

## Features

### 📊 **Comprehensive Reporting**
- **Sales Reports**: Detailed sales performance analysis with filtering and export options
- **Expense Reports**: Complete expense tracking and categorization
- **Revenue Analytics**: Revenue trends, profit analysis, and financial insights
- **Service Analytics**: Service popularity, performance metrics, and trends

### 📈 **Interactive Dashboards**
- **Revenue Dashboard**: Visual revenue trends with multiple chart types
- **Service Popularity**: Service performance and client preference analysis
- **Client Retention**: Client behavior analysis and retention metrics
- **Financial Overview**: Complete financial health monitoring

### 🔍 **Advanced Analytics**
- **Time-based Analysis**: Daily, weekly, monthly, and custom period reports
- **Comparative Analysis**: Period-over-period comparisons and trends
- **Performance Metrics**: Key performance indicators (KPIs) tracking
- **Predictive Insights**: Trend analysis and forecasting capabilities

### 📋 **Data Export & Sharing**
- **Multiple Export Formats**: PDF, CSV, and Excel export options
- **Custom Report Generation**: Generate reports for specific periods or criteria
- **Print-friendly Layouts**: Optimized layouts for printing and sharing
- **Scheduled Reports**: Automated report generation and delivery

### 🎯 **Business Intelligence**
- **Real-time Data**: Live data updates and real-time analytics
- **Data Visualization**: Charts, graphs, and interactive visualizations
- **Insight Generation**: Automated insights and recommendations
- **Performance Benchmarking**: Compare performance against targets

## How It Works

### 1. **Report Generation Flow**
```
1. Select Report Type (Sales, Expense, Revenue, etc.)
2. Choose Time Period (Today, Week, Month, Custom)
3. Apply Filters (Staff, Service, Client, etc.)
4. Generate Report
5. View/Export Results
6. Analyze Insights
```

### 2. **Data Structure**
```typescript
interface SalesRecord {
  _id: string
  billNo: string
  customerName: string
  customerPhone: string
  date: string
  paymentMode: string
  payments: Array<{
    mode: string
    amount: number
  }>
  netTotal: number
  taxAmount: number
  grossTotal: number
  status: string
  staffName: string
  items: Array<{
    name: string
    type: string
    quantity: number
    price: number
    total: number
    staffContributions?: Array<{
      staffId: string
      staffName: string
      percentage: number
      amount: number
    }>
  }>
}

type DatePeriod = "today" | "yesterday" | "last7days" | "last30days" | "currentMonth" | "all"
```

### 3. **Analytics Calculation**
```typescript
// Calculate revenue metrics
const calculateRevenueMetrics = (salesData: SalesRecord[]) => {
  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.grossTotal, 0)
  const totalSales = salesData.length
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0
  
  return {
    totalRevenue,
    totalSales,
    averageSale,
    growthRate: calculateGrowthRate(salesData)
  }
}

// Calculate service popularity
const calculateServicePopularity = (salesData: SalesRecord[]) => {
  const serviceCounts = {}
  salesData.forEach(sale => {
    sale.items.forEach(item => {
      if (item.type === 'service') {
        serviceCounts[item.name] = (serviceCounts[item.name] || 0) + item.quantity
      }
    })
  })
  return Object.entries(serviceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}
```

## Technical Implementation

### **Main Components**

#### `SalesReport` Component
- **Location**: `components/reports/sales-report.tsx`
- **Purpose**: Comprehensive sales performance analysis
- **Features**:
  - Date period filtering
  - Payment method analysis
  - Staff performance tracking
  - Export capabilities

#### `ExpenseReport` Component
- **Location**: `components/reports/expense-report.tsx`
- **Purpose**: Expense tracking and analysis
- **Features**:
  - Expense categorization
  - Period comparisons
  - Budget tracking
  - Cost analysis

#### `RevenueReport` Component
- **Location**: `components/reports/revenue-report.tsx`
- **Purpose**: Revenue analytics and trends
- **Features**:
  - Interactive charts
  - Time period analysis
  - Profit calculations
  - Growth tracking

#### `ServicePopularity` Component
- **Location**: `components/reports/service-popularity.tsx`
- **Purpose**: Service performance analysis
- **Features**:
  - Service ranking
  - Popularity trends
  - Revenue per service
  - Client preferences

#### `ClientRetention` Component
- **Location**: `components/reports/client-retention.tsx`
- **Purpose**: Client behavior analysis
- **Features**:
  - Retention metrics
  - Client lifetime value
  - Visit frequency analysis
  - Churn prediction

### **Key Features**

#### 1. **Data Aggregation**
```typescript
// Aggregate sales data by period
const aggregateSalesByPeriod = (salesData: SalesRecord[], period: DatePeriod) => {
  const filteredData = filterSalesByPeriod(salesData, period)
  
  return {
    totalRevenue: filteredData.reduce((sum, sale) => sum + sale.grossTotal, 0),
    totalSales: filteredData.length,
    averageSale: calculateAverageSale(filteredData),
    topServices: getTopServices(filteredData),
    topStaff: getTopStaff(filteredData),
    paymentMethods: getPaymentMethodBreakdown(filteredData)
  }
}

// Filter sales by date period
const filterSalesByPeriod = (salesData: SalesRecord[], period: DatePeriod) => {
  const now = new Date()
  const startDate = getStartDate(now, period)
  
  return salesData.filter(sale => {
    const saleDate = new Date(sale.date)
    return saleDate >= startDate && saleDate <= now
  })
}
```

#### 2. **Chart Data Generation**
```typescript
// Generate chart data for revenue trends
const generateRevenueChartData = (salesData: SalesRecord[], timeframe: string) => {
  const groupedData = groupSalesByTimeframe(salesData, timeframe)
  
  return Object.entries(groupedData).map(([period, sales]) => ({
    name: period,
    revenue: sales.reduce((sum, sale) => sum + sale.grossTotal, 0),
    expenses: calculateExpensesForPeriod(period),
    profit: calculateProfitForPeriod(period, sales)
  }))
}

// Group sales by timeframe
const groupSalesByTimeframe = (salesData: SalesRecord[], timeframe: string) => {
  const groups = {}
  
  salesData.forEach(sale => {
    const date = new Date(sale.date)
    const key = getTimeframeKey(date, timeframe)
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(sale)
  })
  
  return groups
}
```

#### 3. **Export Functionality**
```typescript
// Export sales report to CSV
const exportSalesReport = (salesData: SalesRecord[], filename: string) => {
  const csvData = salesData.map(sale => ({
    'Bill No': sale.billNo,
    'Customer': sale.customerName,
    'Date': formatDate(sale.date),
    'Total': sale.grossTotal,
    'Payment Mode': sale.paymentMode,
    'Status': sale.status,
    'Staff': sale.staffName
  }))
  
  const csv = convertToCSV(csvData)
  downloadCSV(csv, filename)
}

// Export to PDF
const exportToPDF = (reportData: any, reportType: string) => {
  const doc = new jsPDF()
  // Generate PDF content
  generatePDFContent(doc, reportData, reportType)
  doc.save(`${reportType}_report_${formatDate(new Date())}.pdf`)
}
```

### **Backend Integration**

#### Reports API
```typescript
// Get sales data for reports
const getSalesReportData = async (period: DatePeriod, filters?: any) => {
  const response = await SalesAPI.getAll()
  if (response.success) {
    return filterAndAggregateData(response.data, period, filters)
  }
  return []
}

// Get expense data
const getExpenseReportData = async (period: DatePeriod) => {
  const response = await ExpensesAPI.getAll()
  if (response.success) {
    return filterExpensesByPeriod(response.data, period)
  }
  return []
}
```

#### Data Processing
```typescript
// Process sales data for analytics
const processSalesData = (rawSalesData: any[]) => {
  return rawSalesData.map(sale => ({
    ...sale,
    formattedDate: formatDate(sale.date),
    paymentBreakdown: parsePaymentMode(sale.paymentMode),
    staffContributions: calculateStaffContributions(sale.items),
    serviceBreakdown: categorizeItems(sale.items)
  }))
}
```

## User Interface

### **Reports Page Layout**

#### 1. **Header Section**
- **Page Title**: "Business Reports" with description
- **Navigation Tabs**: Sales, Expenses, Revenue, Analytics
- **Quick Actions**: Export, Print, Share options

#### 2. **Filter Controls**
- **Date Period Selector**: Today, Yesterday, Last 7 Days, etc.
- **Custom Date Range**: Start and end date selection
- **Additional Filters**: Staff, Service, Payment Method
- **Filter Summary**: Display active filters

#### 3. **Report Content**
- **Summary Cards**: Key metrics and KPIs
- **Data Tables**: Detailed data with sorting and pagination
- **Charts & Graphs**: Visual data representation
- **Insights Section**: Automated insights and recommendations

#### 4. **Export Options**
- **Export Buttons**: PDF, CSV, Excel export
- **Print Preview**: Print-friendly layout
- **Share Options**: Email, download, print

### **Analytics Dashboard Layout**

#### 1. **Dashboard Header**
- **Dashboard Title**: "Analytics" with description
- **Time Period Selector**: Quick period selection
- **View Options**: Chart types and display options

#### 2. **Analytics Tabs**
- **Revenue Tab**: Revenue trends and analysis
- **Services Tab**: Service popularity and performance
- **Clients Tab**: Client retention and behavior

#### 3. **Interactive Charts**
- **Revenue Charts**: Bar, line, and area charts
- **Service Charts**: Pie charts and bar graphs
- **Client Charts**: Retention curves and behavior patterns

#### 4. **Insights Panel**
- **Key Insights**: Automated insights and trends
- **Recommendations**: Actionable recommendations
- **Performance Alerts**: Important notifications

### **Visual Design**

#### **Chart Types**
- **Bar Charts**: Revenue comparisons and trends
- **Line Charts**: Time-series data and trends
- **Pie Charts**: Category breakdowns and distributions
- **Area Charts**: Cumulative data and growth

#### **Color Coding**
- **Revenue**: Green for positive, red for negative
- **Expenses**: Orange for expenses, blue for categories
- **Services**: Different colors for each service
- **Time Periods**: Gradient colors for time series

#### **Layout Structure**
- **Responsive Grid**: Adapts to different screen sizes
- **Card-Based Design**: Clean, organized card layout
- **Interactive Elements**: Hover effects and click interactions
- **Consistent Spacing**: Uniform spacing and alignment

## Advanced Features

### **Real-time Analytics**
- **Live Data Updates**: Real-time data refresh
- **Auto-refresh**: Automatic data updates
- **Live Notifications**: Important metric alerts
- **Performance Monitoring**: Real-time performance tracking

### **Predictive Analytics**
- **Trend Analysis**: Identify trends and patterns
- **Forecasting**: Predict future performance
- **Seasonal Analysis**: Understand seasonal patterns
- **Growth Projections**: Project future growth

### **Custom Reports**
- **Report Builder**: Create custom reports
- **Saved Reports**: Save frequently used reports
- **Scheduled Reports**: Automated report generation
- **Report Templates**: Pre-built report templates

### **Data Visualization**
- **Interactive Charts**: Click, zoom, and filter charts
- **Multiple Chart Types**: Various visualization options
- **Custom Dashboards**: Personalized dashboard layouts
- **Export Visualizations**: Export charts and graphs

## Configuration

### **Report Settings**
```typescript
const reportConfig = {
  defaultPeriod: "last30days",
  chartTypes: ["bar", "line", "pie", "area"],
  exportFormats: ["pdf", "csv", "excel"],
  refreshInterval: 300000, // 5 minutes
  maxDataPoints: 1000
}
```

### **Analytics Configuration**
```typescript
const analyticsConfig = {
  metrics: [
    "totalRevenue",
    "totalSales", 
    "averageSale",
    "growthRate",
    "topServices",
    "clientRetention"
  ],
  timeframes: [
    "today",
    "yesterday", 
    "last7days",
    "last30days",
    "currentMonth",
    "all"
  ],
  chartOptions: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { enabled: true }
    }
  }
}
```

### **Export Configuration**
```typescript
const exportConfig = {
  pdf: {
    pageSize: "A4",
    orientation: "landscape",
    margins: { top: 20, right: 20, bottom: 20, left: 20 }
  },
  csv: {
    delimiter: ",",
    encoding: "utf-8",
    includeHeaders: true
  },
  excel: {
    sheetName: "Report",
    includeCharts: false
  }
}
```

## Benefits

### **For Management**
- **Data-Driven Decisions**: Make informed decisions based on real data
- **Performance Monitoring**: Track key performance indicators
- **Trend Analysis**: Identify business trends and opportunities
- **Financial Control**: Monitor revenue, expenses, and profitability

### **For Staff**
- **Performance Insights**: Understand individual and team performance
- **Goal Tracking**: Monitor progress toward targets
- **Service Optimization**: Identify popular and profitable services
- **Client Insights**: Understand client behavior and preferences

### **For Business**
- **Growth Planning**: Plan for business growth and expansion
- **Cost Optimization**: Identify cost-saving opportunities
- **Revenue Optimization**: Maximize revenue through data insights
- **Competitive Advantage**: Stay ahead with data-driven strategies

## Integration Points

### **Sales System**
- Real-time sales data integration
- Payment method analysis
- Staff performance tracking
- Service revenue analysis

### **Client Management**
- Client behavior analysis
- Retention metrics
- Lifetime value calculations
- Visit pattern analysis

### **Financial Systems**
- Revenue and expense tracking
- Profit and loss analysis
- Cash flow monitoring
- Budget vs actual comparisons

### **Staff Management**
- Individual performance metrics
- Team performance analysis
- Commission calculations
- Productivity tracking

## Future Enhancements

### **Planned Features**
- **Advanced Analytics**: Machine learning and AI insights
- **Predictive Modeling**: Forecast future performance
- **Custom Dashboards**: Personalized dashboard creation
- **Mobile Analytics**: Mobile app for analytics

### **Advanced Reporting**
- **Automated Insights**: AI-generated insights and recommendations
- **Benchmarking**: Compare against industry standards
- **Scenario Planning**: What-if analysis and planning
- **Integration APIs**: Third-party analytics integration

This comprehensive reports and analytics system provides powerful business intelligence capabilities that enable data-driven decision making and business optimization for salon operations.
