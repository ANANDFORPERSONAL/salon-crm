const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/salon_crm_main', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkStaff() {
  try {
    // Get all businesses
    const Business = mongoose.model('Business', new mongoose.Schema({
      name: String,
      code: String
    }));
    
    const businesses = await Business.find({}).lean();
    console.log('Available businesses:');
    businesses.forEach(biz => {
      console.log(`- ${biz.name}: ${biz.code}`);
    });
    
    // Check each business database for staff
    for (const business of businesses) {
      console.log(`\nChecking staff in ${business.name} (${business.code}):`);
      
      try {
        const businessDb = mongoose.connection.useDb(`salon_crm_${business.code}`);
        const Staff = businessDb.model('Staff', new mongoose.Schema({
          name: String,
          email: String,
          role: String,
          hasLoginAccess: Boolean,
          password: String
        }));
        
        const staff = await Staff.find({}).lean();
        console.log(`Found ${staff.length} staff members:`);
        staff.forEach(member => {
          console.log(`  - ${member.name} (${member.email}) - Role: ${member.role}, Login Access: ${member.hasLoginAccess}, Has Password: ${!!member.password}`);
        });
      } catch (error) {
        console.log(`  Error accessing database: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkStaff();
