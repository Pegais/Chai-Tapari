/**
 * Database Configuration Module
 * 
 * Why: Centralized MongoDB connection management
 * How: Uses Mongoose to establish and manage database connection
 * Impact: Ensures reliable database connectivity across the application
 * 
 * Common Errors:
 * 1. Connection timeout - MongoDB server not running or unreachable
 * 2. Authentication failed - Invalid credentials in MONGODB_URI
 * 3. Network error - Firewall blocking connection or wrong host/port
 */

const mongoose = require('mongoose')

/**
 * Connect to MongoDB database
 * Why: Establish persistent connection for all database operations
 * How: Uses Mongoose connect method with connection options
 * Impact: All models can interact with database after successful connection
 */
const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chai-tapri'
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    await mongoose.connect(mongoURI, options)
    
    console.log('MongoDB connected successfully')
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected')
    })
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('MongoDB connection closed through app termination')
      process.exit(0)
    })
    
  } catch (error) {
    console.error('Database connection failed:', error.message)
    process.exit(1)
  }
}

module.exports = connectDatabase

