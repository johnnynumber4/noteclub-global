#!/bin/bash

# MongoDB Development Helper Script
# Usage: ./scripts/mongodb.sh [start|stop|status|reset|logs]

MONGODB_DATA_DIR="$HOME/mongodb-data"
MONGODB_LOG_FILE="$MONGODB_DATA_DIR/mongod.log"
MONGODB_PID_FILE="$MONGODB_DATA_DIR/mongod.pid"

case "$1" in
    start)
        echo "🚀 Starting MongoDB..."
        mkdir -p "$MONGODB_DATA_DIR"
        
        if pgrep mongod > /dev/null; then
            echo "❌ MongoDB is already running"
            exit 1
        fi
        
        mongod --dbpath "$MONGODB_DATA_DIR" \
               --port 27017 \
               --bind_ip 127.0.0.1 \
               --fork \
               --logpath "$MONGODB_LOG_FILE" \
               --pidfilepath "$MONGODB_PID_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ MongoDB started successfully"
            echo "📊 Database: note-club-modern"
            echo "🌐 Connection: mongodb://localhost:27017/note-club-modern"
        else
            echo "❌ Failed to start MongoDB"
            exit 1
        fi
        ;;
        
    stop)
        echo "🛑 Stopping MongoDB..."
        if pgrep mongod > /dev/null; then
            pkill mongod
            echo "✅ MongoDB stopped"
        else
            echo "❌ MongoDB is not running"
        fi
        ;;
        
    status)
        if pgrep mongod > /dev/null; then
            echo "✅ MongoDB is running (PID: $(pgrep mongod))"
            echo "📊 Database stats:"
            mongosh note-club-modern --quiet --eval "db.stats()" 2>/dev/null || echo "❌ Could not connect to database"
        else
            echo "❌ MongoDB is not running"
        fi
        ;;
        
    logs)
        if [ -f "$MONGODB_LOG_FILE" ]; then
            echo "📋 MongoDB logs (last 20 lines):"
            tail -20 "$MONGODB_LOG_FILE"
        else
            echo "❌ Log file not found: $MONGODB_LOG_FILE"
        fi
        ;;
        
    reset)
        echo "🗑️  Resetting MongoDB data..."
        read -p "This will delete all data. Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $0 stop
            rm -rf "$MONGODB_DATA_DIR"
            echo "✅ MongoDB data reset"
            echo "💡 Run '$0 start' to start with clean database"
        else
            echo "❌ Reset cancelled"
        fi
        ;;
        
    seed)
        echo "🌱 Seeding database with sample data..."
        mongosh note-club-modern --quiet --eval "
        // Clear existing data
        db.users.deleteMany({});
        db.themes.deleteMany({});
        db.albums.deleteMany({});
        db.turns.deleteMany({});
        
        // Create sample users
        db.users.insertMany([
            {
                name: 'Alex Miller',
                email: 'alex@noteclub.com',
                username: 'alex_m',
                joinedAt: new Date(),
                albumsShared: 3
            },
            {
                name: 'Sarah Johnson',
                email: 'sarah@noteclub.com',
                username: 'sarah_j',
                joinedAt: new Date(),
                albumsShared: 2
            },
            {
                name: 'Mike Chen',
                email: 'mike@noteclub.com',
                username: 'mike_c',
                joinedAt: new Date(),
                albumsShared: 1
            }
        ]);
        
        // Create sample themes
        db.themes.insertMany([
            {
                title: '90s Nostalgia',
                description: 'Albums that defined the 1990s - from grunge to hip-hop, alternative to electronic',
                startDate: new Date('2025-07-01'),
                endDate: new Date('2025-07-31'),
                isActive: true,
                albumCount: 12
            },
            {
                title: 'Hidden Gems',
                description: 'Underrated albums that deserve more recognition',
                startDate: new Date('2025-08-01'),
                endDate: new Date('2025-08-31'),
                isActive: false,
                albumCount: 0
            }
        ]);
        
        // Create sample albums
        db.albums.insertMany([
            {
                title: 'Nevermind',
                artist: 'Nirvana',
                year: 1991,
                genre: 'Grunge',
                theme: '90s Nostalgia',
                submittedBy: 'alex_m',
                submittedAt: new Date('2025-07-15'),
                spotifyUrl: 'https://open.spotify.com/album/2UJcKiJxNryhL050VVdtWl',
                youtubeUrl: 'https://music.youtube.com/playlist?list=OLAK5uy_n1n1GvYe0JJ7cP5LT9Nf8mJ8L3G4R5V'
            },
            {
                title: 'The Chronic',
                artist: 'Dr. Dre',
                year: 1992,
                genre: 'Hip-Hop',
                theme: '90s Nostalgia',
                submittedBy: 'sarah_j',
                submittedAt: new Date('2025-07-18'),
                spotifyUrl: 'https://open.spotify.com/album/6vV5UrXcfyQD1wu4Qo2PiP',
                youtubeUrl: 'https://music.youtube.com/playlist?list=OLAK5uy_k6WqVQjPCT5ykN_w8mB2M1L0'
            },
            {
                title: 'OK Computer',
                artist: 'Radiohead',
                year: 1997,
                genre: 'Alternative Rock',
                theme: '90s Nostalgia',
                submittedBy: 'mike_c',
                submittedAt: new Date('2025-07-20'),
                spotifyUrl: 'https://open.spotify.com/album/6dVIqQ8qmQ5GBnJ9shOYGE',
                youtubeUrl: 'https://music.youtube.com/playlist?list=OLAK5uy_lYT8z9B5Y0L_3Nq8P'
            }
        ]);
        
        console.log('✅ Sample data created successfully!');
        console.log('📊 Collections populated:');
        console.log('  - Users: ' + db.users.countDocuments());
        console.log('  - Themes: ' + db.themes.countDocuments());
        console.log('  - Albums: ' + db.albums.countDocuments());
        " 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ Database seeded successfully!"
        else
            echo "❌ Failed to seed database"
        fi
        ;;
        
    *)
        echo "📚 MongoDB Development Helper"
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start   - Start MongoDB server"
        echo "  stop    - Stop MongoDB server"  
        echo "  status  - Check MongoDB status"
        echo "  logs    - Show recent MongoDB logs"
        echo "  reset   - Reset all MongoDB data"
        echo "  seed    - Populate database with sample data"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 status"
        echo "  $0 seed"
        ;;
esac
