# Copilot Instructions for Note Club Modern

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is Note Club Modern - a music album sharing club where members take turns posting albums based on themes, in alphabetical order. Built with Next.js 15, TypeScript, and modern web technologies.

## Core Concept

Note Club is a community-driven music discovery platform where:

- Members take turns posting albums based on weekly/monthly themes
- Turn rotation follows alphabetical order by username
- Each post includes album art, streaming links, and discussion
- Integration with YouTube Music, Spotify, and other platforms
- Wikipedia integration for album information

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with multiple providers (Google, Discord, Email/Password)
- **UI Components**: Radix UI with shadcn/ui components
- **Music APIs**: YouTube Music API, Spotify API, Wikipedia API
- **Deployment**: Vercel (configurable for other platforms)

## Key Features

- **Album Posting System**: Submit albums with metadata (artist, title, theme)
- **Music Platform Integration**: YouTube Music playlists, Spotify links, Tidal links
- **Turn Management**: Alphabetical rotation system for fair participation
- **Theme System**: Weekly/monthly themes for album selection
- **Community Features**: Comments, discussions, and album reviews
- **Search Functionality**: Find albums by artist, title, or theme
- **Responsive Design**: Modern, mobile-friendly interface

## Code Style Guidelines

- Use TypeScript for all new code
- Follow Next.js App Router patterns
- Use Tailwind CSS for styling
- Implement proper error handling and loading states
- Use React Server Components where appropriate
- Follow music industry naming conventions
- Implement proper API rate limiting for music services

## File Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions, database connections, auth configuration
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks
- `src/models/` - Database schemas (Album, User, Theme, Turn)

## Database Schema

- **Users**: Authentication data, turn order, posting history
- **Albums**: Music metadata, streaming links, themes, posting user
- **Themes**: Current and historical themes with dates
- **Turns**: Turn rotation management and tracking
- **Comments**: User discussions on album posts

## Music Integration

- **YouTube Music API**: For embedded playlists and album search
- **Spotify API**: For album links and metadata
- **Wikipedia API**: For album information and descriptions
- **Last.fm API**: For additional music data (optional)

## Turn Management System

- Alphabetical rotation by username
- Automatic turn advancement after posting
- Theme-based posting requirements
- Grace period handling for missed turns

## Deployment Considerations

- Environment variables for music API keys
- Rate limiting for external API calls
- Caching strategies for music metadata
- CDN setup for album artwork
