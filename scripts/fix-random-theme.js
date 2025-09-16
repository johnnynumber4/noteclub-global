const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/noteclub-modern');

// Define Theme schema
const ThemeSchema = new mongoose.Schema({
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guidelines: String,
  examples: [String],
  imageUrl: String,
  albumCount: { type: Number, default: 0 },
  participantCount: { type: Number, default: 0 },
  currentTurn: { type: Number, default: 1 },
  maxTurns: Number,
}, { timestamps: true });

const Theme = mongoose.model('Theme', ThemeSchema);

async function fixRandomTheme() {
  try {
    console.log('Connecting to database...');
    
    // Find and update the Random theme
    const result = await Theme.updateOne(
      { title: 'Random' },
      { $set: { isActive: true } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Random theme has been activated!');
      
      // Verify the change
      const randomTheme = await Theme.findOne({ title: 'Random' });
      console.log('Random theme status:', {
        title: randomTheme.title,
        isActive: randomTheme.isActive,
        startDate: randomTheme.startDate,
        endDate: randomTheme.endDate
      });
    } else {
      console.log('❌ Random theme not found');
    }
    
  } catch (error) {
    console.error('Error fixing Random theme:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixRandomTheme();