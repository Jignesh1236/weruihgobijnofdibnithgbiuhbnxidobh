# santmegh - Student Inquiry & Enrollment System

## Overview
This project is a modern web application designed for santmegh educational institution to manage student inquiries and enrollments. It provides a comprehensive workflow from initial student contact to course enrollment and fee management. Key capabilities include a detailed course catalog with flexible payment plans, and robust student record management. The business vision is to streamline administrative processes, improve efficiency, and enhance the overall student management experience for educational institutions.

## User Preferences
- Preferred communication style: Simple, everyday language (Hindi/English mix)
- Site name: santmegh
- Design preference: Modern, professional interface with enhanced animations and visual appeal
- Recent requests: Enhanced home page design and improved admin login page

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, featuring a modern, professional aesthetic with a consistent card-based layout, professional color scheme (green, blue, purple, amber, red), and clean, solid designs. All transparent effects and border styles have been replaced for improved readability and clarity.
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Supabase serverless)
- **Validation**: Zod schemas shared between frontend and backend
- **Session Management**: Express sessions with PostgreSQL store

### Key Components
- **Database Schema**: Consists of Users (admin authentication), Courses (with fees and duration), Inquiries (initial student interest), Enrollments (confirmed student details), and Payments (fee tracking).
- **API Structure**: RESTful API endpoints for `courses`, `inquiries`, `enrollments`, `payments`, and `stats`.
- **User Interface Components**: Includes a Home Dashboard, Inquiry Form, Enrollment Form, Fees Management, and Inquiries List.
- **Inquiry to Enrollment Workflow**: Students submit inquiries, which can be marked as "pending" or "confirm" by an admin. Confirmed inquiries proceed to a detailed enrollment form, leading to fee management.
- **Form Validation**: Implemented with shared Zod schemas for both frontend (React Hook Form) and backend validation, providing real-time feedback.
- **Student Management**: Full CRUD operations for student records, including advanced filtering, search, CSV export (basic, detailed, summary, selected), and individual/bulk deletion. Detailed student view modals and payment status tracking are integrated.
- **Admin Dashboard**: Organized into 6 tabs (Overview, Courses, Batches, Reports, Settings, Analytics) with functional navigation, report generation, and quick action cards.
- **SMS Reminders**: Functionality for individual and bulk SMS payment reminders with professional templates and multiple provider integration options (MSG91, Fast2SMS, TextLocal, Twilio).
- **Receipt System**: Professional fee receipt generation with institutional branding and enhanced design.
- **Course Catalog**: Comprehensive course offerings with detailed fee structures and installment options.
- **Batch Selection**: Implemented 7 predefined time slots for student scheduling.
- **Enhanced Home Page**: Modern design with improved quick actions grid, floating background elements, enhanced animations using Framer Motion, professional gradient themes, quick stats display, and comprehensive search/filter functionality for student inquiries.
- **Enhanced Admin Login**: Professional two-column layout with welcome section, glassmorphism design, animated logo interactions, feature highlights, security indicators, and smooth entrance animations.

## External Dependencies

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant management

### Database and Backend
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **Drizzle ORM**: Type-safe database toolkit
- **connect-pg-simple**: PostgreSQL session store
- **Supabase**: Primary PostgreSQL database hosting with SSL connection and transaction pooler.

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler
- **Vite**: Build tool and dev server

### SMS Providers
- **MSG91**
- **Fast2SMS**
- **TextLocal**
- **Twilio**
### https://replit.com/join/ymfovctish-herik58657
