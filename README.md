# WelcomeNestHR

WelcomeNestHR is a modern HR onboarding and employee experience platform built for companies that want new hires to feel clear, supported, connected, and ready to contribute from day one.

The platform combines operational HR workflows with emotional intelligence: structured onboarding, compliance, payroll readiness, employee messaging, 30-60-90 day success planning, and LifeSync wellbeing insights.

## Product Vision

Most onboarding tools stop at checklists. WelcomeNestHR is designed to go further by helping HR teams understand whether employees are progressing, supported, connected, and at risk of disengagement.

The goal is to give companies a more human operating system for onboarding and early employee success.

## Core Roles

- **Superadmin:** Creates companies, manages platform-level access, invites HR users, and oversees company setup.
- **HR:** Manages employees, onboarding flows, compliance, payroll settings, announcements, messaging, LifeSync insights, and Primer progress.
- **Employee:** Completes onboarding, views payslips, uses LifeSync, follows Primer goals, receives announcements, and communicates with HR.

## User Documentation

- [WelcomeNestHR User Guide](docs/user-guide.md)

## Key Modules

- **Smart Onboarding:** Company-specific onboarding flows, checklists, milestones, and employee task tracking.
- **Compliance:** HR visibility into onboarding and required employee progress.
- **LifeSync:** Emotional intelligence check-ins, privacy-aware employee wellbeing logs, and a scalable company-level HR insight feed.
- **Primer:** 30-60-90 day employee success plans with gamification, XP, levels, badges, and HR progress visibility.
- **Collaborate:** Announcements, buddy assignment, org visibility, and employee connection tools.
- **Payroll and Payslips:** HR payroll setup, payroll run snapshots, approval flow, paid status tracking, and employee payslip access.
- **Messages:** HR-to-employee and employee-to-HR messaging with conversation previews and participant names.
- **NestGuide AI:** Role-aware support assistant for HR and employees, with local fallback guidance when external AI is unavailable.
- **Billing:** Company-level SaaS billing foundation with Stripe, trial support, plan metadata, and HR-only billing controls.
- **Demo Requests:** Public demo request page that stores validated inbound leads in Firestore.

## Architecture

WelcomeNestHR is built as a multi-tenant SaaS application.

Core tenant structure:

```text
users/{userId}

companies/{companyId}
  employees/{employeeId}
  invitations/{inviteId}
  onboardingFlows/{flowId}
  payrollRuns/{runId}
    items/{itemId}
  lifesyncEntries/{entryId}

payslips/{payslipId}
demoRequests/{requestId}
```

Important architecture decisions:

- Company data is scoped under `companies/{companyId}` for tenant isolation.
- HR invitations use company subcollections and secure token validation.
- Employee user records are linked back to company employee records through `employeeId`.
- LifeSync shared entries are mirrored into a company-level feed so HR can monitor hundreds of employees without opening one listener per employee.
- Payroll runs snapshot employee salary data at run creation time to preserve historical accuracy.
- Billing is managed at the company level rather than employee level.

## Tech Stack

- **Framework:** Next.js App Router
- **Language:** TypeScript
- **UI:** React, Tailwind CSS, Framer Motion, Lucide Icons
- **Authentication:** Firebase Authentication
- **Database:** Cloud Firestore
- **Backend:** Next.js API routes and Firebase Functions
- **Payments:** Stripe Billing
- **AI:** OpenAI API with role-aware local fallback guidance
- **Hosting target:** Firebase Hosting / modern server-capable deployment setup

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The app typically runs at:

```text
http://localhost:3000
```

Build the app:

```bash
npm run build
```

Build Firebase Functions:

```bash
npm --prefix functions run build
```

## Environment Variables

The app requires Firebase, Stripe, and optional OpenAI configuration.

Key examples:

```text
NEXT_PUBLIC_BASE_URL=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_GROWTH_PRICE_ID=
STRIPE_PRO_PRICE_ID=
OPENAI_API_KEY=
```

Do not commit real secrets to the repository. Configure production secrets through the hosting provider, Firebase, Stripe, and CI/CD environment settings.

## Production Readiness Notes

Before production launch:

- Deploy and verify Firestore security rules.
- Configure Firebase Authentication providers and allowed domains.
- Configure Stripe products, prices, webhooks, and billing portal.
- Add production environment variables.
- Enable App Check where appropriate.
- Run a focused role/access-control test across Superadmin, HR, and Employee flows.
- Run full onboarding, compliance, LifeSync, Primer, payroll, messages, billing, and demo request checks.

## Leadership

- **Gregory Apfel Miles Duval:** Visionary, CEO, and Founder
- **Daniel Chinonso Williams:** Co-founder and Chief Product Architect

## Philosophy

WelcomeNestHR is built around a simple belief: onboarding should not feel like a cold checklist.

It should create clarity, belonging, structure, emotional safety, and measurable progress for every new hire.
