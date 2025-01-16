# Team Calendar - Software Requirements Specification

## 1. Introduction

### 1.1 Purpose

This document provides a detailed specification of requirements for the Team Calendar application, a web-based system designed to manage team member availability and scheduling.

### 1.2 Scope

The Team Calendar application is a comprehensive solution for managing team member availability, scheduling, and calendar coordination across multiple sites and teams.

### 1.3 Definitions and Acronyms

- **RLS**: Row Level Security
- **AM/PM**: Morning/Afternoon time slots
- **SPA**: Single Page Application

## 2. System Overview

### 2.1 System Architecture

- Frontend: React-based SPA with TypeScript
- Backend: Express.js server with TypeScript
- Authentication: JWT-based authentication system
- Data Storage: JSON-based file system (current implementation)

### 2.2 System Features

1. User Management
2. Calendar Management
3. Availability Management
4. Site Management
5. Holiday Management
6. Settings Management

## 3. Functional Requirements

### 3.1 Authentication System

1. User Registration

    - Email-based registration
    - Required fields: First name, Last name, email, mobile, password, site
    - Password requirements: Minimum 8 characters, uppercase, number, special character

2. User Login
    - Email and password authentication
    - Site-specific login
    - JWT token generation and management

### 3.2 Calendar Management

1. Calendar View

    - 5-week rolling view (2 weeks before, current week, 2 weeks after)
    - Configurable week start (Monday/Sunday/Saturday)
    - Optional weekend display
    - Week number display (left/right/none)

2. Event Management

    - Event types:
        - Requested Holiday
        - Requested Holiday Mandatory
        - Requested Period
    - Event properties:
        - Title
        - Description
        - Date range
        - Type
        - User association

3. Event Interactions
    - Create/Edit/Delete events
    - Drag-and-drop event moving
    - Event resizing
    - Multi-day event support

### 3.3 Availability Management

1. Schedule Configuration

    - Weekly schedule definition
    - AM/PM time slot management
    - Alternate week scheduling
    - Date range specification
    - Schedule exceptions

2. Schedule Types

    - Regular weekly schedule
    - Alternate week schedule
    - Exception handling

3. Schedule Operations
    - Add new schedule
    - Split existing schedule
    - Delete schedule
    - Merge schedules

### 3.4 User Management

1. User Roles

    - Admin
    - Regular User

2. User Status

    - Active
    - Inactive

3. User Operations
    - Create new users
    - Edit user details
    - Delete users
    - Manage user roles and status

### 3.5 Site Management

1. Multi-site Support

    - Site-specific configurations
    - Site-specific user management
    - Site-specific holiday calendars

2. Site Settings
    - Default work week configuration
    - Location-based holiday calendar
    - Site-specific event types

### 3.6 Holiday Management

1. Holiday Calendar

    - Country-specific holidays
    - Multiple year support (2024-2028)
    - Public holiday designation

2. Holiday Types
    - Public holidays
    - Site-specific holidays

### 3.7 Settings Management

1. User Settings

    - Week start preference
    - Week number display preference
    - Color scheme customization
    - Colleague display preferences

2. Colleague Settings
    - Visibility controls
    - Color coding
    - Custom abbreviations
    - Display order

## 4. Non-functional Requirements

### 4.1 Performance

1. Response Time

    - Page load: < 2 seconds
    - User interactions: < 200ms
    - Data updates: < 500ms

2. Scalability
    - Support for multiple concurrent users
    - Efficient data handling for large teams

### 4.2 Security

1. Authentication

    - JWT-based authentication
    - Secure password storage (bcrypt)
    - Token expiration and renewal

2. Authorization
    - Role-based access control
    - Site-specific data isolation
    - User data privacy

### 4.3 Usability

1. User Interface

    - Responsive design
    - Intuitive navigation
    - Consistent styling
    - Accessibility compliance

2. Error Handling
    - Clear error messages
    - Graceful error recovery
    - User-friendly notifications

### 4.4 Reliability

1. Data Integrity

    - Consistent data storage
    - Backup and recovery
    - Validation checks

2. Availability
    - High uptime
    - Graceful degradation
    - Error recovery

## 5. Technical Specifications

### 5.1 Frontend Technologies

- React 18.3.1
- TypeScript
- Tailwind CSS
- Lucide React for icons
- React Router for navigation
- React Hook Form for form management
- Zod for validation

### 5.2 Backend Technologies

- Express.js
- TypeScript
- JSON file-based storage
- JWT for authentication
- CORS support

### 5.3 Development Tools

- Vite for development server
- ESLint for code quality
- Prettier for code formatting
- Concurrent development server support

## 6. Data Models

### 6.1 User Model

```typescript
interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	mobile: string;
	role: "admin" | "user";
	status: "active" | "inactive";
	site: string;
	settings?: UserSettings;
	app?: AppSettings;
}
```

### 6.2 Event Model

```typescript
interface Event {
	id: string;
	userId: string;
	type: string;
	title: string;
	description: string;
	date: string;
	endDate?: string;
	createdAt: string;
	updatedAt: string;
}
```

### 6.3 Availability Model

```typescript
interface Availability {
	weeklySchedule: WeeklySchedule;
	oddWeeklySchedule?: WeeklySchedule;
	startDate: string;
	endDate: string;
	repeatPattern: "all" | "evenodd";
}
```

## 7. Future Enhancements

### 7.1 Planned Features

1. Database Migration

    - Move from JSON files to a proper database system
    - Support for data migrations
    - Improved data querying

2. Enhanced Reporting

    - Availability reports
    - Usage statistics
    - Team analytics

3. Integration Capabilities
    - Calendar export/import
    - Third-party calendar integration
    - API access for external systems

### 7.2 Scalability Improvements

1. Performance Optimization

    - Caching implementation
    - Data pagination
    - Lazy loading

2. Architecture Enhancements
    - Microservices architecture
    - Real-time updates
    - Offline support

## 8. Appendix

### 8.1 API Endpoints

1. Authentication

    - POST /api/auth/login
    - POST /api/auth/register

2. Events

    - GET /api/events
    - POST /api/events
    - PUT /api/events/:id
    - DELETE /api/events/:id

3. Users

    - GET /api/users
    - POST /api/users
    - PUT /api/users/:id
    - DELETE /api/users/:id

4. Availability

    - GET /api/availability/:userId
    - POST /api/availability/:userId/:index
    - PUT /api/availability/:userId/:index
    - DELETE /api/availability/:userId/:index

5. Holidays

    - GET /api/holidays/:year

6. Sites
    - GET /api/sites/:site

### 8.2 Error Codes

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### 8.3 Development Setup

1. Prerequisites

    - Node.js
    - npm/yarn
    - Git

2. Installation

    ```bash
    npm install
    ```

3. Development

    ```bash
    npm run dev
    ```

4. Building
    ```bash
    npm run build
    ```
