const express = require('express')
const request = require('supertest')
const bcrypt = require('bcryptjs')
const { MongoMemoryServer } = require('mongodb-memory-server')

async function main() {
  const mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()

  const parsedUri = new URL(mongoUri)
  parsedUri.pathname = ''
  parsedUri.search = ''
  parsedUri.hash = ''
  const baseUri = parsedUri.toString().replace(/\/$/, '')

  process.env.MONGODB_URI = baseUri
  process.env.JWT_SECRET = 'test-secret'

  const databaseManager = require('../config/database-manager')
  const adminRouter = require('../routes/admin')

  const app = express()
  app.use(express.json())
  app.use('/api/admin', adminRouter)

  const mainConnection = await databaseManager.getMainConnection()
  const Admin = mainConnection.model('Admin', require('../models/Admin').schema)
  const User = mainConnection.model('User', require('../models/User').schema)
  const Business = mainConnection.model('Business', require('../models/Business').schema)

  const adminPassword = await bcrypt.hash('SuperAdmin@123', 10)
  const admin = await Admin.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'super@admin.com',
    password: adminPassword,
    role: 'super_admin',
    permissions: [
      { module: 'businesses', actions: ['create', 'read', 'update'] },
      { module: 'users', actions: ['create', 'read', 'update'] }
    ]
  })

  const owner = await User.create({
    firstName: 'Business',
    lastName: 'Owner',
    email: 'owner@example.com',
    password: await bcrypt.hash('OldPassword@123', 10),
    mobile: '9999999999',
    role: 'admin',
    hasLoginAccess: true,
    allowAppointmentScheduling: true
  })

  const business = await Business.create({
    code: 'BIZ1001',
    name: 'Test Salon',
    businessType: 'salon',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zipCode: '123456',
      country: 'India'
    },
    contact: {
      phone: '9999999999',
      email: 'contact@testsalon.com'
    },
    owner: owner._id,
    status: 'active'
  })

  await User.findByIdAndUpdate(owner._id, { branchId: business._id })

  const jwt = require('jsonwebtoken')
  const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' })

  const updateResponse = await request(app)
    .put(`/api/admin/businesses/${business._id.toString()}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      ownerInfo: {
        password: 'NewPassword@123'
      }
    })

  if (!updateResponse.body.success) {
    throw new Error(`Update request failed: ${JSON.stringify(updateResponse.body)}`)
  }

  const updatedOwner = await User.findById(owner._id)

  const newPasswordMatches = await bcrypt.compare('NewPassword@123', updatedOwner.password)
  const oldPasswordMatches = await bcrypt.compare('OldPassword@123', updatedOwner.password)

  console.log('\n=== Super Admin Password Update Test ===')
  console.log('Update API success:', updateResponse.body.success)
  console.log('New password works:', newPasswordMatches)
  console.log('Old password rejected:', !oldPasswordMatches)
  console.log('Has login access:', updatedOwner.hasLoginAccess)

  if (!newPasswordMatches) {
    throw new Error('New password does not match hashed password')
  }

  if (oldPasswordMatches) {
    throw new Error('Old password still matches – password not updated')
  }

  console.log('✅ Password update flow works as expected')

  await databaseManager.closeAllConnections()
  await mongoServer.stop()
}

main().catch(async (error) => {
  console.error('❌ Test script failed:', error)
  const databaseManager = require('../config/database-manager')
  await databaseManager.closeAllConnections()
  process.exit(1)
})


