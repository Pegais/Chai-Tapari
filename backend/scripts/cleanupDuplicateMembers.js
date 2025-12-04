/**
 * Cleanup Script: Remove Duplicate Member IDs from Channels
 * 
 * Why: Fix existing channels that have duplicate member IDs due to race conditions
 * How: Uses MongoDB aggregation to deduplicate members arrays
 * Impact: Clean up channels with duplicate members
 * 
 * Usage: node backend/scripts/cleanupDuplicateMembers.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const mongoose = require('mongoose')
const Channel = require('../src/models/Channel')

async function cleanupDuplicateMembers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chai-tapri'
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Find all channels
    const channels = await Channel.find({})
    console.log(`📋 Found ${channels.length} channels to process`)

    let totalDuplicatesRemoved = 0
    let channelsFixed = 0

    for (const channel of channels) {
      if (!channel.members || channel.members.length === 0) {
        continue
      }

      // Convert to strings for comparison
      const memberStrings = channel.members.map(m => m.toString())
      const uniqueMembers = [...new Set(memberStrings)]
      
      // Check if there are duplicates
      if (memberStrings.length !== uniqueMembers.length) {
        const duplicatesCount = memberStrings.length - uniqueMembers.length
        console.log(`🔍 Channel "${channel.name}" has ${duplicatesCount} duplicate member(s)`)

        // Convert back to ObjectIds
        const uniqueMemberIds = uniqueMembers.map(id => new mongoose.Types.ObjectId(id))

        // Update channel with unique members
        await Channel.findByIdAndUpdate(
          channel._id,
          { $set: { members: uniqueMemberIds } },
          { new: true }
        )

        totalDuplicatesRemoved += duplicatesCount
        channelsFixed++
        console.log(`  ✅ Fixed: Removed ${duplicatesCount} duplicate(s)`)
      }
    }

    console.log('\n📊 Cleanup Summary:')
    console.log(`  - Channels processed: ${channels.length}`)
    console.log(`  - Channels fixed: ${channelsFixed}`)
    console.log(`  - Total duplicates removed: ${totalDuplicatesRemoved}`)

    if (channelsFixed === 0) {
      console.log('\n✨ No duplicates found! All channels are clean.')
    } else {
      console.log(`\n✨ Successfully cleaned up ${channelsFixed} channel(s)!`)
    }

    await mongoose.connection.close()
    console.log('✅ Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

// Run cleanup
cleanupDuplicateMembers()
