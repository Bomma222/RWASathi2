# RWA Sathi - Resident Welfare Association Management System

## Overview

RWA Sathi is a full-stack web application designed for managing residential apartment complexes. It provides a comprehensive platform for both administrators and residents to handle various community management tasks including bill payments, complaint management, notices, and resident communication.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool for fast development and optimized production builds
- **Tailwind CSS** with shadcn/ui components for modern, responsive design
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Mobile-first design** with PWA capabilities through service workers

### Backend Architecture
- **Express.js** server with TypeScript for API endpoints
- **RESTful API** design with clear separation of concerns
- **Session-based authentication** with PostgreSQL session storage
- **Modular storage interface** with in-memory fallback for development

### Database Design
- **PostgreSQL** with Drizzle ORM for type-safe database operations
- **Neon Database** serverless PostgreSQL for cloud deployment
- **Schema-first approach** with Zod validation integration

## Key Components

### Authentication System
- **Firebase Authentication** for phone number-based OTP verification
- **Automatic user registration** for new residents
- **Role-based access control** (admin vs resident)
- **Session persistence** across browser sessions

### Data Models
- **Users**: Resident information with flat details and roles
- **Bills**: Monthly billing system with status tracking
- **Complaints**: Issue tracking with priority and status management
- **Notices**: Community announcements with importance flags
- **Activities**: System activity logging for audit trails

### User Interface Components
- **Responsive mobile design** optimized for apartment residents
- **Bottom navigation** for easy mobile access
- **Real-time updates** through React Query
- **Internationalization** support (English and Telugu)
- **Loading states and error handling** throughout the application

## Data Flow

### Authentication Flow
1. User enters phone number
2. Firebase sends OTP via SMS
3. User verifies OTP
4. System checks for existing user or creates new account
5. Session established with role-based permissions

### Data Management Flow
1. React components trigger API calls through TanStack Query
2. Express routes handle business logic and validation
3. Storage layer abstracts database operations
4. Drizzle ORM manages PostgreSQL interactions
5. Real-time updates via query invalidation

### Deployment Flow
1. Development builds run with Vite dev server
2. Production builds create optimized static assets
3. Server bundle includes Express app with static file serving
4. PostgreSQL migrations managed through Drizzle Kit

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Query)
- Express.js with TypeScript support
- Drizzle ORM with PostgreSQL driver
- Firebase SDK for authentication

### UI and Styling
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible components
- Lucide React for consistent icons
- shadcn/ui component library

### Development Tools
- Vite with React plugin for fast development
- TypeScript for type safety
- ESBuild for server bundling
- PostCSS with Autoprefixer

### Database and Storage
- @neondatabase/serverless for PostgreSQL connection
- connect-pg-simple for session storage
- Drizzle Kit for database migrations

## Deployment Strategy

### Development Environment
- **Replit integration** with live reload capabilities
- **Hot module replacement** for instant feedback
- **PostgreSQL 16** with automatic provisioning
- **Environment variable management** for sensitive configuration

### Production Deployment
- **Autoscale deployment** on Replit's infrastructure
- **Static asset optimization** through Vite build process
- **Server-side rendering** for initial page loads
- **CDN integration** for fast global content delivery

### Database Management
- **Schema migrations** through Drizzle Kit push commands
- **Connection pooling** for efficient database usage
- **Backup and recovery** through cloud provider tools
- **Environment-specific configurations** for dev/staging/prod

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **June 24, 2025**: Complete RWA Sathi platform implementation
  - Full-stack React + Firebase authentication system
  - Mobile-first responsive design with Telugu/English localization
  - Admin dashboard with resident management and analytics
  - Enhanced billing system with customizable fields and detailed breakdown
  - Water meter reading tracking with automatic charge calculation
  - Complex billing structure matching real maintenance sheets
  - Admin billing field configuration system for customizable charges
  - Complaint management with photo uploads and priority levels
  - Notice posting system with importance flags
  - Demo data and authentication for testing

## Demo Credentials

For testing the platform while Firebase is being configured:
- **Admin Login**: +919876543210 (OTP: 123456)
- **Resident Login**: +919876543211 (OTP: 123456)
- Additional test residents: +919876543212, +919876543213

## Deployment Status

The application is fully functional with:
- Express.js backend serving REST API
- React frontend with Vite development server
- In-memory storage with comprehensive demo data
- Mobile-optimized UI with bottom navigation
- Bilingual support (English/Telugu)