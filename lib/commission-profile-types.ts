export interface CommissionProfile {
  id: string
  name: string
  type: "target_based" | "item_based"
  description?: string
  
  // Common fields
  calculationInterval: "daily" | "monthly"
  qualifyingItems: string[] // Service, Product, Package, Membership, Prepaid
  includeTax: boolean
  
  // Target-Based Profile
  cascadingCommission?: boolean
  targetTiers?: Array<{
    from: number
    to: number
    calculateBy: "percent" | "fixed"
    value: number
  }>
  
  // Item-Based Profile (for future)
  itemRates?: Array<{
    itemType: string
    rate: number
    calculateBy: "percent" | "fixed"
  }>
  
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CommissionProfileFormData {
  name: string
  type: "target_based" | "item_based"
  description?: string
  calculationInterval: "daily" | "monthly"
  qualifyingItems: string[]
  includeTax: boolean
  cascadingCommission?: boolean
  targetTiers?: Array<{
    from: number
    to: number
    calculateBy: "percent" | "fixed"
    value: number
  }>
}

export const COMMISSION_PROFILE_TYPES = {
  target_based: "Commission by Target",
  item_based: "Commission by Item"
} as const

export const CALCULATION_INTERVALS = {
  daily: "Daily",
  monthly: "Monthly"
} as const

export const QUALIFYING_ITEMS = [
  "Service",
  "Product", 
  "Package",
  "Membership",
  "Prepaid"
] as const

export const DEFAULT_COMMISSION_PROFILES: CommissionProfile[] = [
  {
    id: "1",
    name: "Product Incentive",
    type: "target_based",
    description: "Commission based on product sales targets",
    calculationInterval: "monthly",
    qualifyingItems: ["Product"],
    includeTax: false,
    cascadingCommission: true,
    targetTiers: [
      {
        from: 0,
        to: 5000,
        calculateBy: "percent",
        value: 5
      },
      {
        from: 5000,
        to: 10000,
        calculateBy: "percent", 
        value: 8
      }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system"
  },
  {
    id: "2",
    name: "Service Incentive",
    type: "target_based",
    description: "Commission based on service sales targets",
    calculationInterval: "monthly",
    qualifyingItems: ["Service"],
    includeTax: true,
    cascadingCommission: false,
    targetTiers: [
      {
        from: 0,
        to: 8000,
        calculateBy: "percent",
        value: 7
      }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system"
  }
]
