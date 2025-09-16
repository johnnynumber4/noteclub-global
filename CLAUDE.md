# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server with Turbopack (preferred)
- `npm run dev-legacy` - Start development server without Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Database Setup
- MongoDB connection required (see .env.example)
- `node scripts/create-demo-user.js` - Create demo user for testing
- `./scripts/mongodb.sh` - MongoDB setup script

### Demo User for Testing
- **Email**: demo@noteclub.com
- **Password**: demo123
- Run `node scripts/create-demo-user.js` to create
- Visit `/auth-test` page for guided authentication testing

### Required Environment Variables
- `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET` - For Spotify link parsing
- `NEXTAUTH_SECRET` - For session management
- `MONGODB_URI` - Database connection

## Project Architecture

### Core Framework
- **Next.js 15** with App Router pattern
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **NextAuth.js** for authentication (Google, Discord, email/password)
- **Tailwind CSS** + **Material-UI** for styling
- **Radix UI** components via shadcn/ui

### Authentication System
- Dual UI system: Material-UI navbar (`NavbarMui`) and Tailwind components
- JWT strategy for sessions
- Custom credentials provider alongside OAuth
- Session management in `src/lib/auth.ts`
- Password hashing with bcryptjs (12 salt rounds)

### Database Models
Located in `src/models/`:
- **User** - Comprehensive user profiles with music preferences, turn ordering, statistics
- **Album** - Music album posts with streaming links, metadata, engagement tracking
- **Theme** - Turn-based themes for album sharing
- **Comment** - User comments on albums
- **Turn** - Turn management system
- **Group** - User groups/communities

### Core Business Logic
This is a **group-based music album sharing platform** where:
- Users create or join private groups with friends
- Members take turns posting albums in alphabetical order by username
- **Paste music links for instant metadata extraction** (Spotify, YouTube Music, Apple Music)
- Real YouTube Music API integration for album search
- Turn management with clear "whose turn is it" display
- PWA support with offline capability and notifications
- Multi-tenancy: each group operates independently

### Key Architectural Patterns
- Mongoose models with pre-save hooks and virtuals
- Database connection caching in `src/lib/mongodb.ts`
- Type-safe API routes in `src/app/api/`
- Component composition with providers pattern
- Form validation using React Hook Form + Zod

### Environment Configuration
Required environment variables (see `.env.example`):
- `MONGODB_URI` - MongoDB connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- OAuth provider credentials (Google, Discord)
- Email server configuration for notifications

### Import Patterns
- Use `@/` alias for src directory imports
- Dynamic imports for models to avoid circular dependencies
- Selective password field inclusion with `.select("+password")`

### File Structure Notes
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (dual UI system)
- `src/lib/` - Utility libraries and configurations
- `src/models/` - Mongoose schemas and models
- `src/types/` - TypeScript type definitions
- `scripts/` - Database and utility scripts