# NoteClub Modern

A modern music album sharing community where members take turns posting albums based on themes, in alphabetical order. Built with Next.js 15, TypeScript, and MongoDB.

## ✨ Features

- **🎵 Album Sharing**: Members take turns posting albums with cover art, streaming links, and discussions
- **🔄 Turn-Based System**: Fair alphabetical rotation ensures everyone gets to share music
- **🎯 Theme-Based Selection**: Weekly/monthly themes guide album choices
- **🎨 Music Platform Integration**: Support for YouTube Music, Spotify, Apple Music, and more
- **👥 Group Management**: Create public or private music communities with custom settings
- **� Multiple Authentication**: Google OAuth, Discord OAuth, and email/password
- **📱 Progressive Web App**: Install as a mobile app with offline support
- **⚡ Fast & Scalable**: Built on Next.js 15 with App Router and modern web technologies
- **🛡️ Type Safe**: Fully written in TypeScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd note-club-modern
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/noteclub-modern

   # NextAuth.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here

   # Music APIs (optional - for enhanced metadata)
   YOUTUBE_MUSIC_API_KEY=your-youtube-music-api-key
   SPOTIFY_CLIENT_ID=your-spotify-client-id
   SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_CLIENT_SECRET=your-discord-client-secret
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Material-UI](https://mui.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) with [shadcn/ui](https://ui.shadcn.com/) + Material-UI
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Music APIs**: YouTube Music API, Spotify API, Apple Music API, Wikipedia API
- **PWA**: [next-pwa](https://github.com/shadowwalker/next-pwa) for offline support
- **Icons**: [Lucide React](https://lucide.dev/) + [Material-UI Icons](https://mui.com/material-ui/material-icons/)

## 🗂️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── albums/        # Album CRUD operations
│   │   ├── groups/        # Group management
│   │   ├── music/         # Music platform integrations
│   │   ├── themes/        # Theme management
│   │   └── turn-status/   # Turn rotation system
│   ├── albums/            # Album browsing and details
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── groups/            # Group management pages
│   ├── post-album/        # Album submission
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── navbar.tsx        # Navigation component
│   └── providers.tsx     # Context providers
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── mongodb.ts        # Database connection
│   └── utils.ts          # Helper functions
├── models/               # MongoDB schemas
│   ├── User.ts           # User profiles and preferences
│   ├── Album.ts          # Album posts with metadata
│   ├── Group.ts          # Music sharing groups
│   ├── Theme.ts          # Album themes
│   └── Turn.ts           # Turn rotation tracking
└── types/                # TypeScript definitions
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Setting up Music APIs (Optional)

#### Spotify API

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Get your Client ID and Client Secret
4. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`

#### YouTube Music API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create API credentials
4. Add your API key to environment variables

### Setting up OAuth Providers

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

#### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Docker

1. **Build the image**

   ```bash
   docker build -t noteclub-modern .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file .env.local noteclub-modern
   ```

### Self-Hosting

NoteClub Modern is designed to be easily self-hosted. Perfect for private music communities or organizations.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎵 Core Concept

NoteClub is a community-driven music discovery platform where:

- **Members take turns** posting albums based on weekly/monthly themes
- **Turn rotation follows alphabetical order** by username for fairness
- **Each post includes** album art, streaming links, and discussion
- **Integration with major music platforms** for easy listening
- **Wikipedia integration** provides rich album information and context

Perfect for music enthusiasts, book clubs that want to explore music, friend groups, or any community that loves discovering new albums together!

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Material-UI](https://mui.com/) for the comprehensive component library
- [Vercel](https://vercel.com/) for hosting and deployment
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- Music platform APIs for enabling seamless music discovery
- All the open source contributors who made this possible

## 📞 Support

- [Issue Tracker](https://github.com/johnnynumber4/noteclub-global/issues)
- 💬 [Discussions](https://github.com/johnnynumber4/noteclub-global/discussions)
- 🎵 Join our community to discover amazing music together!

---

Made with ❤️ and 🎵 by the NoteClub community
