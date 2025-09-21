const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  productName: { 
    type: String, 
    required: true 
  },
  transactionType: { 
    type: String, 
    enum: ['sale', 'return', 'adjustment', 'restock', 'damage', 'expiry'],
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true 
  }, // Positive for increases, negative for decreases
  previousStock: { 
    type: Number, 
    required: true 
  },
  newStock: { 
    type: Number, 
    required: true 
  },
  unitCost: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  totalValue: { 
    type: Number, 
    required: true 
  }, // quantity * unitCost
  
  // Reference to related documents
  referenceType: { 
    type: String, 
    enum: ['sale', 'return', 'adjustment', 'purchase', 'other'],
    required: true 
  },
  referenceId: { 
    type: String, 
    required: true 
  }, // Sale ID, Return ID, etc.
  referenceNumber: { 
    type: String, 
    required: true 
  }, // Bill No, Return No, etc.
  
  // Staff and location
  processedBy: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    default: 'main' 
  }, // For multi-location businesses
  
  // Additional details
  reason: { 
    type: String, 
    default: '' 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  
  // Timestamps
  transactionDate: { 
    type: Date, 
    required: true, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
inventoryTransactionSchema.index({ productId: 1, transactionDate: -1 });
inventoryTransactionSchema.index({ referenceType: 1, referenceId: 1 });
inventoryTransactionSchema.index({ transactionType: 1 });
inventoryTransactionSchema.index({ transactionDate: -1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
