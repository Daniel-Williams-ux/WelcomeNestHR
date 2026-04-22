# WelcomeNestHR

WelcomeNestHR is a modern HR onboarding and workforce management platform designed to help organizations onboard employees with clarity, structure, and human-centered experience.

It combines operational workflows (onboarding, payroll, compliance) with emotional intelligence (belonging, connection, guided experiences).

---

## Overview

WelcomeNestHR is built as a multi-tenant SaaS platform where:

A Superadmin creates and manages companies
A Company (HR) manages employees and internal workflows
An Employee experiences structured onboarding and workplace tools

The system is designed for clarity, scalability, and real-world HR workflows, not demo-level features.

---

## Core Architecture
Roles
- Superadmin
Creates companies
Sends invitation links
Oversees system usage

- HR
Manages employees
Runs onboarding
Handles payroll and internal tools

- Employee
Completes onboarding
Uses company tools (primer, collaborate, etc.)

---

## Key Features
1. Invitation-Based Onboarding System
- HR users are invited via secure token links

- Tokens are stored in Firestore under:

 companies/{companyId}/invitations/{inviteId}
- Invite flow:
 1.Superadmin sends invite
 2. User clicks link
 3. Signup page validates token
 4. Account is created
 5. Invitation marked as accepted
 6. User document created in /users
  
2. Authentication & Access Control
- Firebase Authentication (Email + Google)
- Firestore-backed user roles
- Centralized auth via:
  AuthProvider → useAuthContext → useUserAccess
- Handles:
  - role
  - companyId
  - plan
  - trial
  - employeeId sync
    
3. Role-Based Routing System

After login/signup:

/route-router → redirects based on role
- superadmin → /superadmin
- hr → /hr
- employee → /dashboard
  
4. Company Management (Superadmin)
- Create companies
- Assign plan (Trial / Platinum)
- Track:
  - employee count
  - status
  - trial period
    
5. HR Dashboard

HR has a dedicated dashboard with isolated layout:

Modules include:

- Overview
- Employees
- Onboarding
- Primer
- Payroll
- Compliance
- Collaborate
- Messages
- LifeSync

6. Employee System

- Employees are stored under:

  companies/{companyId}/employees/{employeeId}

- User linkage:

  users/{userId} → employeeId

- System ensures:
  - No duplicate linkage
  - Auto-sync of employeeId into user doc
    
7. Primer Module
- Structured onboarding guidance
- Milestones and checklist system
- Seeded per employee
  
8. Payroll System (Production-Ready)
- Payroll runs
- Snapshot of employees
- Approval flow
- Payslip generation

Collections:
  payrollRuns
  payrollRuns/{runId}/items
  payslips
  
9. Firestore Structure (SSOT)
   users/{userId}

   companies/{companyId}
     ├── employees/{employeeId}
     ├── invitations/{inviteId}
     ├── payrollRuns/{runId}
     │     └── items/{itemId}

   payslips/{payslipId}

---


## Critical Engineering Decisions
1. Invite System Uses Subcollections

Instead of global invites:

  companies/{companyId}/invitations

This ensures:
  - Proper tenant isolation
  - Scalable queries via collectionGroup

2. Auth Race Condition Handling

### Problem:
Firebase Auth resolves before Firestore user doc exists

### Solution:
Retry logic in AuthProvider

  while (retries < 5) {
    snap = await getDoc(...)
    if (snap.exists()) break
  }

  
3. Employee Sync Strategy

System ensures:

- User → Employee linkage is always consistent
- Backfills missing employeeId automatically

4. Firestore Rules for Invitations

Supports collectionGroup queries:

match /{path=**}/invitations/{inviteId} {
  allow list: if true;
  allow get: if resource.data.status == "pending"
    && request.time < resource.data.expiresAt;
}

---

## Tech Stack
- Frontend: Next.js (App Router)
- Backend: Firebase (Auth + Firestore)
- State: React Context
- Styling: Tailwind CSS
- Payments: Stripe (planned integration complete)
  
---

## Current Status
### Stable
- Auth system
- Invite flow
- Role routing
- HR dashboard layout
- Payroll core logic
  
### In Progress
- Employee UI refinement
- Messages module
- Primer enhancements
  
### Planned
- Notifications system
- Advanced analytics
- Full audit logs UI
- Multi-company scaling improvements

---

## Running Locally
npm install
npm run dev

App runs on:

http://localhost:3000

---

## Deployment Notes

Before production:

Set Firebase rules (secured)
Enable App Check
Configure environment variables
Connect Stripe production keys
Add domain + HTTPS

---

## Philosophy

WelcomeNestHR is not just an HR tool.

It is designed around:

clarity over complexity
human onboarding over checklists
structured growth over chaos

Author
Built and designed by Daniel Williams

visionary
Gregory Miles
