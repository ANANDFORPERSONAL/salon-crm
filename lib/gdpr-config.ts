// GDPR Configuration and Data Retention Policies

export const GDPR_CONFIG = {
  // Data Retention Periods (in days)
  RETENTION_PERIODS: {
    ACTIVE_ACCOUNT: null, // Keep while account is active
    INACTIVE_ACCOUNT: 2555, // 7 years for legal/accounting purposes
    DELETED_ACCOUNT: 30, // 30 days grace period before permanent deletion
    AUDIT_LOGS: 2555, // 7 years for compliance
    TRANSACTION_RECORDS: 2555, // 7 years for tax/accounting
    CLIENT_DATA: 2555, // 7 years after last interaction
  },

  // Data Processing Legal Bases
  LEGAL_BASES: {
    CONTRACTUAL: "Contractual necessity - required to fulfill service agreement",
    LEGITIMATE_INTEREST: "Legitimate interests - service improvement and fraud prevention",
    LEGAL_OBLIGATION: "Legal obligation - tax, accounting, and regulatory compliance",
    CONSENT: "Consent - marketing and non-essential features",
  },

  // Data Categories
  DATA_CATEGORIES: {
    PERSONAL: ["name", "email", "phone", "address", "dateOfBirth"],
    FINANCIAL: ["paymentMethods", "transactionHistory", "billingInformation"],
    BEHAVIORAL: ["loginHistory", "featureUsage", "preferences"],
    TECHNICAL: ["ipAddress", "deviceInfo", "browserType", "sessionData"],
  },

  // Data Sharing
  DATA_SHARING: {
    SERVICE_PROVIDERS: [
      "Cloud hosting providers (for data storage)",
      "Payment processors (for transaction processing)",
      "Email service providers (for communications)",
    ],
    LEGAL_REQUIREMENTS: [
      "Tax authorities (when required by law)",
      "Law enforcement (with valid legal request)",
      "Regulatory bodies (for compliance audits)",
    ],
  },

  // Security Measures
  SECURITY_MEASURES: [
    "Encryption in transit (HTTPS/TLS)",
    "Secure authentication and authorization",
    "Regular security audits",
    "Access controls and role-based permissions",
    "Automatic session timeouts",
    "Regular data backups",
    "Data anonymization for deleted accounts",
  ],

  // User Rights
  USER_RIGHTS: [
    "Right to Access",
    "Right to Rectification",
    "Right to Erasure (Right to be Forgotten)",
    "Right to Restrict Processing",
    "Right to Data Portability",
    "Right to Object",
    "Right to Withdraw Consent",
  ],

  // Contact Information
  CONTACT: {
    DATA_PROTECTION_OFFICER: "privacy@easemysalon.in",
    GRIEVANCE_OFFICER: "grievance@easemysalon.in", // DPDP Act requirement
    RESPONSE_TIME_DAYS: 30, // GDPR and DPDP Act require response within 30 days
  },

  // DPDP Act (India) Specific Requirements
  DPDP: {
    // Grievance Redressal (Section 12 of DPDP Act)
    GRIEVANCE_RESPONSE_DAYS: 30,
    
    // Children's Data (Section 9 of DPDP Act)
    MINIMUM_AGE: 18,
    PARENTAL_CONSENT_REQUIRED: true,
    
    // Data Fiduciary Obligations
    OBLIGATIONS: [
      "Process personal data only for lawful purposes",
      "Collect only necessary personal data",
      "Ensure data accuracy and completeness",
      "Implement reasonable security safeguards",
      "Notify data breaches to Data Protection Board and affected individuals",
      "Maintain grievance redressal mechanism",
    ],
    
    // Data Principal Rights (Section 11 of DPDP Act)
    DATA_PRINCIPAL_RIGHTS: [
      "Right to access personal data",
      "Right to correction and erasure",
      "Right to grievance redressal",
      "Right to nominate a representative",
    ],
  },
} as const

// Helper function to calculate deletion date
export function calculateDeletionDate(accountDeletedAt: Date): Date {
  const deletionDate = new Date(accountDeletedAt)
  deletionDate.setDate(deletionDate.getDate() + GDPR_CONFIG.RETENTION_PERIODS.DELETED_ACCOUNT)
  return deletionDate
}

// Helper function to check if data should be retained
export function shouldRetainData(
  dataType: keyof typeof GDPR_CONFIG.RETENTION_PERIODS,
  lastActivityDate: Date | null,
  accountStatus: "active" | "inactive" | "deleted"
): boolean {
  const retentionPeriod = GDPR_CONFIG.RETENTION_PERIODS[dataType]

  if (retentionPeriod === null) {
    // Keep while account is active
    return accountStatus === "active"
  }

  if (!lastActivityDate) {
    return false
  }

  const retentionDate = new Date(lastActivityDate)
  retentionDate.setDate(retentionDate.getDate() + retentionPeriod)
  return new Date() < retentionDate
}

