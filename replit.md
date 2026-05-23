# Tours d'Eau Mayotte

## Overview

Tours d'Eau Mayotte is a public service website that displays water distribution schedules for the Mayotte region. The application shows weekly water availability by sector, village breakdowns, and important alerts. The content is fully administrator-editable since water schedules change frequently.

Key features:
- Weekly water schedule grid (days × sectors with various states like OPEN, CLOSED, specific opening/closing times)
- Village breakdown by sector
- Alert banner system for urgent notifications
- Admin panel for content management
- Source verification links to official Mayotte water authorities

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite

The frontend follows a page-based architecture with reusable components. Pages include Home (main schedule display), Sources (verification links), and Admin (content management).

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with tsx for development
- **Session Management**: express-session for admin authentication
- **API Pattern**: RESTful endpoints under `/api/`

Protected routes require admin authentication via session cookies. Public endpoints serve schedule and configuration data.

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Current Storage**: In-memory storage implementation (can be upgraded to PostgreSQL)

The schema defines users for admin auth and TypeScript interfaces for schedule entries, villages, and alerts. Data structures are designed for the specific water schedule use case with predefined states.

### Key Design Decisions

1. **Shared Schema**: TypeScript types and Zod schemas in `shared/` are used by both client and server, ensuring type safety across the stack.

2. **Mobile-First Design**: Following accessibility guidelines in `design_guidelines.md`, the UI prioritizes mobile viewports and WCAG compliance for this public service application.

3. **In-Memory Storage with Database Ready**: The storage layer uses an interface pattern allowing easy migration from in-memory to PostgreSQL.

4. **French Localization**: All user-facing text is in French for the Mayotte audience.

## Admin Features

### Tabs in Admin Panel
1. **Planning** — 31-day schedule grid + PDF import
2. **Alerte** — Alert banner management
3. **Villages** — Village/sector assignment
4. **Textes du site** — Edit all public text (title, notices, footer, WhatsApp message, QR prompt)

### PDF Import
- Admin uploads a PDF (SMAE, Prefecture, etc.)
- Server extracts text using `pdf-parse`
- Smart regex parser detects dates + sector states
- Shows extracted entries for review before applying
- Falls back to showing raw extracted text if parsing fails

## External Dependencies

### Database
- PostgreSQL (configured via `DATABASE_URL` environment variable)
- Drizzle Kit for migrations

### UI Libraries
- Radix UI primitives (dialogs, selects, tabs, etc.)
- Lucide React for icons
- date-fns for date formatting
- Embla Carousel for carousel functionality

### Development
- Vite with React plugin
- Replit-specific plugins for development (cartographer, dev-banner, error overlay)

### Session Storage
- connect-pg-simple (available for PostgreSQL session storage)
- Default: in-memory sessions with express-session