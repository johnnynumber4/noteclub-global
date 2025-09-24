#!/usr/bin/env node

/**
 * Rollback Script: Restore Original Posts
 * Creates a backup and provides rollback functionality for the migration
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

async function createBackup() {
  try {
    console.log('💾 Creating backup of original posts...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern');
    console.log('✅ Connected to MongoDB');
    
    // Define original post schema
    const originalPostSchema = new mongoose.Schema({
      albumTitle: String,
      albumArtist: String,
      wikiDesc: String,
      yt: String,
      spotify: String,
      albumArt: String,
      theme: String,
      author: mongoose.Schema.Types.ObjectId,
      createdAt: Date
    });
    
    const Post = mongoose.model('Post', originalPostSchema);
    
    // Get all posts
    const posts = await Post.find({}).lean();
    console.log(`📊 Found ${posts.length} posts to backup`);
    
    // Create backup file
    const backupDir = path.join(__dirname, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `posts-backup-${timestamp}.json`);
    
    await fs.writeFile(backupFile, JSON.stringify(posts, null, 2));
    console.log(`✅ Backup created: ${backupFile}`);
    
    return backupFile;
    
  } catch (error) {
    console.error('💥 Backup failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

async function rollbackMigration(backupFile) {
  try {
    console.log('⏮️ Rolling back migration...');
    
    if (!backupFile) {
      throw new Error('No backup file specified');
    }
    
    // Read backup file
    const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));
    console.log(`📋 Loading ${backupData.length} posts from backup`);
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern');
    console.log('✅ Connected to MongoDB');
    
    // Clear current albums (be careful!)
    const Album = require('../src/models/Album.ts').default;
    const albumCount = await Album.countDocuments({});
    
    if (albumCount > 0) {
      console.log(`⚠️ About to delete ${albumCount} albums and restore ${backupData.length} original posts`);
      console.log('⏳ Waiting 5 seconds... (Ctrl+C to cancel)');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await Album.deleteMany({});
      console.log('🗑️ Cleared albums collection');
    }
    
    // Restore original posts
    const originalPostSchema = new mongoose.Schema({
      albumTitle: String,
      albumArtist: String,
      wikiDesc: String,
      yt: String,
      spotify: String,
      albumArt: String,
      theme: String,
      author: mongoose.Schema.Types.ObjectId,
      createdAt: Date
    });
    
    const Post = mongoose.model('Post', originalPostSchema);
    
    // Convert backup data back to proper format
    const postsToRestore = backupData.map(post => ({
      ...post,
      _id: new mongoose.Types.ObjectId(post._id),
      author: post.author ? new mongoose.Types.ObjectId(post.author) : null,
      createdAt: new Date(post.createdAt)
    }));
    
    await Post.insertMany(postsToRestore);
    console.log(`✅ Restored ${postsToRestore.length} original posts`);
    
    console.log('\n🎉 Rollback completed!');
    console.log('   ℹ️ Your original posts have been restored');
    console.log('   ⚠️ Any albums created after migration have been lost');
    
  } catch (error) {
    console.error('💥 Rollback failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function listBackups() {
  try {
    const backupDir = path.join(__dirname, 'backups');
    const files = await fs.readdir(backupDir);
    const backups = files.filter(file => file.startsWith('posts-backup-') && file.endsWith('.json'));
    
    console.log('📋 Available backups:');
    backups.forEach((backup, index) => {
      console.log(`   ${index + 1}. ${backup}`);
    });
    
    return backups.map(backup => path.join(backupDir, backup));
    
  } catch (error) {
    console.log('ℹ️ No backups found');
    return [];
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      createBackup();
      break;
      
    case 'rollback':
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.error('❌ Please specify backup file: node rollback-migration.js rollback <backup-file>');
        process.exit(1);
      }
      rollbackMigration(backupFile);
      break;
      
    case 'list':
      listBackups();
      break;
      
    default:
      console.log('Usage:');
      console.log('  node rollback-migration.js backup          - Create backup of current posts');
      console.log('  node rollback-migration.js list            - List available backups');
      console.log('  node rollback-migration.js rollback <file> - Rollback to specific backup');
      break;
  }
}

module.exports = { createBackup, rollbackMigration, listBackups };