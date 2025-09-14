// Commission Calculation Service
export interface CommissionConfig {
  serviceCommissionRate: number; // Percentage (0-100)
  productCommissionRate: number; // Percentage (0-100)
  minimumCommission?: number; // Minimum commission amount
  maximumCommission?: number; // Maximum commission amount
}

export interface SaleItem {
  id: string;
  name: string;
  type: 'service' | 'product';
  quantity: number;
  price: number;
  total: number;
  staffId: string;
  staffName: string;
}

export interface Sale {
  id: string;
  billNo: string;
  customerName: string;
  date: string;
  items: SaleItem[];
  netTotal: number;
  taxAmount: number;
  grossTotal: number;
  staffName: string;
}

export interface CommissionCalculation {
  staffId: string;
  staffName: string;
  serviceCommission: number;
  productCommission: number;
  totalCommission: number;
  serviceRevenue: number;
  productRevenue: number;
  totalRevenue: number;
  serviceCount: number;
  productCount: number;
  totalItems: number;
}

export interface StaffCommissionSummary {
  staffId: string;
  staffName: string;
  totalCommission: number;
  totalRevenue: number;
  serviceCommission: number;
  productCommission: number;
  serviceRevenue: number;
  productRevenue: number;
  serviceCount: number;
  productCount: number;
  totalTransactions: number;
  averageCommissionPerTransaction: number;
  commissionRate: number; // Overall effective commission rate
}

export class CommissionCalculator {
  private static readonly DEFAULT_SERVICE_RATE = 5; // 5% default
  private static readonly DEFAULT_PRODUCT_RATE = 3; // 3% default

  /**
   * Calculate commission for a single sale
   */
  static calculateSaleCommission(
    sale: Sale,
    config: CommissionConfig
  ): CommissionCalculation {
    const serviceItems = sale.items.filter(item => item.type === 'service');
    const productItems = sale.items.filter(item => item.type === 'product');

    // Calculate service commission
    const serviceRevenue = serviceItems.reduce((sum, item) => sum + item.total, 0);
    const serviceCommission = (serviceRevenue * config.serviceCommissionRate) / 100;

    // Calculate product commission
    const productRevenue = productItems.reduce((sum, item) => sum + item.total, 0);
    const productCommission = (productRevenue * config.productCommissionRate) / 100;

    // Calculate total commission
    let totalCommission = serviceCommission + productCommission;

    // Apply minimum commission if set
    if (config.minimumCommission && totalCommission < config.minimumCommission) {
      totalCommission = config.minimumCommission;
    }

    // Apply maximum commission if set
    if (config.maximumCommission && totalCommission > config.maximumCommission) {
      totalCommission = config.maximumCommission;
    }

    return {
      staffId: sale.staffName, // Using staffName as ID for now
      staffName: sale.staffName,
      serviceCommission: Math.round(serviceCommission * 100) / 100,
      productCommission: Math.round(productCommission * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      serviceRevenue: Math.round(serviceRevenue * 100) / 100,
      productRevenue: Math.round(productRevenue * 100) / 100,
      totalRevenue: Math.round((serviceRevenue + productRevenue) * 100) / 100,
      serviceCount: serviceItems.reduce((sum, item) => sum + item.quantity, 0),
      productCount: productItems.reduce((sum, item) => sum + item.quantity, 0),
      totalItems: serviceItems.length + productItems.length
    };
  }

  /**
   * Calculate commission for multiple sales
   */
  static calculateMultipleSalesCommission(
    sales: Sale[],
    config: CommissionConfig
  ): CommissionCalculation[] {
    return sales.map(sale => this.calculateSaleCommission(sale, config));
  }

  /**
   * Calculate commission summary for a staff member
   */
  static calculateStaffCommissionSummary(
    sales: Sale[],
    staffId: string,
    config: CommissionConfig
  ): StaffCommissionSummary | null {
    // Filter sales for this staff member
    const staffSales = sales.filter(sale => 
      sale.staffName === staffId || 
      sale.items.some(item => item.staffId === staffId || item.staffName === staffId)
    );

    if (staffSales.length === 0) {
      return null;
    }

    // Calculate individual commissions
    const commissions = staffSales.map(sale => 
      this.calculateSaleCommission(sale, config)
    );

    // Aggregate data
    const totalCommission = commissions.reduce((sum, calc) => sum + calc.totalCommission, 0);
    const totalRevenue = commissions.reduce((sum, calc) => sum + calc.totalRevenue, 0);
    const serviceCommission = commissions.reduce((sum, calc) => sum + calc.serviceCommission, 0);
    const productCommission = commissions.reduce((sum, calc) => sum + calc.productCommission, 0);
    const serviceRevenue = commissions.reduce((sum, calc) => sum + calc.serviceRevenue, 0);
    const productRevenue = commissions.reduce((sum, calc) => sum + calc.productRevenue, 0);
    const serviceCount = commissions.reduce((sum, calc) => sum + calc.serviceCount, 0);
    const productCount = commissions.reduce((sum, calc) => sum + calc.productCount, 0);

    // Calculate effective commission rate
    const commissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;

    return {
      staffId,
      staffName: staffSales[0]?.staffName || staffId,
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      serviceCommission: Math.round(serviceCommission * 100) / 100,
      productCommission: Math.round(productCommission * 100) / 100,
      serviceRevenue: Math.round(serviceRevenue * 100) / 100,
      productRevenue: Math.round(productRevenue * 100) / 100,
      serviceCount,
      productCount,
      totalTransactions: staffSales.length,
      averageCommissionPerTransaction: staffSales.length > 0 
        ? Math.round((totalCommission / staffSales.length) * 100) / 100 
        : 0,
      commissionRate: Math.round(commissionRate * 100) / 100
    };
  }

  /**
   * Calculate commission summary for all staff members
   */
  static calculateAllStaffCommissionSummary(
    sales: Sale[],
    staffMembers: Array<{ _id: string; id?: string; name: string; serviceCommissionRate?: number; productCommissionRate?: number }>,
    defaultConfig?: Partial<CommissionConfig>
  ): StaffCommissionSummary[] {
    const summaries: StaffCommissionSummary[] = [];

    staffMembers.forEach(staff => {
      const staffId = staff._id || staff.id;
      if (!staffId) return;

      // Use staff-specific rates or defaults
      const config: CommissionConfig = {
        serviceCommissionRate: staff.serviceCommissionRate ?? defaultConfig?.serviceCommissionRate ?? this.DEFAULT_SERVICE_RATE,
        productCommissionRate: staff.productCommissionRate ?? defaultConfig?.productCommissionRate ?? this.DEFAULT_PRODUCT_RATE,
        minimumCommission: defaultConfig?.minimumCommission,
        maximumCommission: defaultConfig?.maximumCommission
      };

      const summary = this.calculateStaffCommissionSummary(sales, staffId, config);
      if (summary) {
        summaries.push(summary);
      }
    });

    return summaries.sort((a, b) => b.totalCommission - a.totalCommission);
  }

  /**
   * Get default commission configuration
   */
  static getDefaultConfig(): CommissionConfig {
    return {
      serviceCommissionRate: this.DEFAULT_SERVICE_RATE,
      productCommissionRate: this.DEFAULT_PRODUCT_RATE
    };
  }

  /**
   * Validate commission configuration
   */
  static validateConfig(config: CommissionConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.serviceCommissionRate < 0 || config.serviceCommissionRate > 100) {
      errors.push('Service commission rate must be between 0 and 100');
    }

    if (config.productCommissionRate < 0 || config.productCommissionRate > 100) {
      errors.push('Product commission rate must be between 0 and 100');
    }

    if (config.minimumCommission && config.minimumCommission < 0) {
      errors.push('Minimum commission must be positive');
    }

    if (config.maximumCommission && config.maximumCommission < 0) {
      errors.push('Maximum commission must be positive');
    }

    if (config.minimumCommission && config.maximumCommission && 
        config.minimumCommission > config.maximumCommission) {
      errors.push('Minimum commission cannot be greater than maximum commission');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate commission for a specific date range
   */
  static calculateCommissionForDateRange(
    sales: Sale[],
    startDate: Date,
    endDate: Date,
    config: CommissionConfig
  ): CommissionCalculation[] {
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    return this.calculateMultipleSalesCommission(filteredSales, config);
  }

  /**
   * Get commission breakdown by item type
   */
  static getCommissionBreakdown(calculation: CommissionCalculation) {
    return {
      service: {
        revenue: calculation.serviceRevenue,
        commission: calculation.serviceCommission,
        rate: calculation.serviceRevenue > 0 
          ? (calculation.serviceCommission / calculation.serviceRevenue) * 100 
          : 0,
        count: calculation.serviceCount
      },
      product: {
        revenue: calculation.productRevenue,
        commission: calculation.productCommission,
        rate: calculation.productRevenue > 0 
          ? (calculation.productCommission / calculation.productRevenue) * 100 
          : 0,
        count: calculation.productCount
      },
      total: {
        revenue: calculation.totalRevenue,
        commission: calculation.totalCommission,
        rate: calculation.totalRevenue > 0 
          ? (calculation.totalCommission / calculation.totalRevenue) * 100 
          : 0,
        count: calculation.serviceCount + calculation.productCount
      }
    };
  }
}
