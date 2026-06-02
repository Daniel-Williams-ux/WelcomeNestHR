# WelcomeNestHR User Guide

This guide explains how to operate WelcomeNestHR as an HR user or employee.

## 1. Accessing The System And Logging In

WelcomeNestHR is accessed through a secure web browser. Each user must have an account before they can enter the system. Access is based on the role assigned to the user: HR users enter the HR workspace, while employees enter the employee dashboard.

### 1.1 Before You Log In

Make sure you have:

- A valid WelcomeNestHR account.
- The email address used for your invitation or account setup.
- Your password, or access to your email inbox if you need to reset it.
- A supported web browser such as Chrome, Edge, Safari, or Firefox.

If you are an employee, your HR team must first create or invite your employee profile. If you are an HR user, a Superadmin or authorized platform administrator must create or invite your HR account.

### 1.2 Opening WelcomeNestHR

1. Open your web browser.
2. Go to the WelcomeNestHR web address provided by your company or administrator.
3. Select the login or sign-in option.

In local testing or development, the app may be opened at `http://localhost:3000`. In production, users should use the official company-provided URL.

### 1.3 Logging In

1. Enter your registered email address.
2. Enter your password.
3. Select **Log in** or **Sign in**.
4. Wait for the system to verify your account.

After successful login, WelcomeNestHR automatically sends you to the correct workspace for your role:

- **HR users** are taken to the HR Dashboard.
- **Employees** are taken to the Employee Dashboard.
- **Superadmins** are taken to the Superadmin workspace.

If you are sent to the wrong area, contact your administrator so they can confirm your role and company assignment.

### 1.4 First-Time Access For Employees

Employees usually receive access after HR creates their employee record or sends an invitation.

When accessing the system for the first time:

1. Use the email address connected to your employee profile.
2. Follow the invitation or account setup instructions provided by HR.
3. Create or confirm your password if prompted.
4. Log in with your email and password.
5. Confirm that you land on the Employee Dashboard.

If your dashboard is empty or you cannot see onboarding tasks, contact HR. Your employee profile may still need to be linked to an onboarding flow.

### 1.5 First-Time Access For HR Users

HR users need an HR role and company assignment before they can manage employees or company workflows.

When accessing the system for the first time:

1. Use the email address assigned to your HR account.
2. Follow the invitation or setup instructions from the Superadmin or platform administrator.
3. Log in with your email and password.
4. Confirm that you land on the HR Dashboard.
5. Check that your company name or workspace appears in the dashboard header.

If you cannot access HR tools, your account may not yet have the HR role or may not be linked to the correct company.

### 1.6 Resetting A Forgotten Password

If you forget your password:

1. Open the login page.
2. Select the forgot password or reset password option.
3. Enter your registered email address.
4. Check your email inbox for the reset link.
5. Follow the link and create a new password.
6. Return to WelcomeNestHR and log in again.

Use the same email address connected to your WelcomeNestHR account. If you do not receive a reset email, check your spam or junk folder, then contact your administrator.

### 1.7 Common Login Issues

**Invalid email or password**

Confirm that the email address is spelled correctly and that you are using the right password. If needed, reset your password.

**No account found**

Your account may not have been created yet, or you may be using a different email address from the one HR invited.

**Wrong dashboard after login**

Your role may be incorrect. Contact your administrator to confirm whether your account should be HR, Employee, or Superadmin.

**Dashboard loads but shows no company data**

Your user account may not be linked to the correct company. HR users should contact a Superadmin or platform administrator. Employees should contact HR.

**Invitation link expired or not working**

Ask HR or your administrator to resend the invitation or confirm your account setup.

### 1.8 Logging Out

Always log out when using a shared or public computer.

1. Open the account or profile menu in the dashboard.
2. Select **Log out**.
3. Confirm that you are returned to the login page.

Closing the browser tab is not the same as logging out. For security, use the logout button when you are finished.

## 2. HR Dashboard Overview

The HR Dashboard is the main workspace for HR users. It gives HR teams a central place to manage employees, onboarding, payroll readiness, compliance, communication, wellbeing insights, and employee progress.

After logging in as an HR user, WelcomeNestHR should take you directly to the HR Dashboard.

### 2.1 Confirming You Are In The Right Workspace

At the top of the HR workspace, check the dashboard header or workspace label. This should show the company or workspace you are managing.

Before making changes, confirm that:

- You are logged in with your HR account.
- The dashboard says **HR Dashboard** or shows the HR workspace.
- The company or workspace name matches the company you intend to manage.

If the company name is wrong or missing, do not create employees or workflows yet. Contact a Superadmin or platform administrator to confirm your account assignment.

### 2.2 HR Dashboard Home

The HR Dashboard home page gives a quick summary of the company workspace.

You may see cards such as:

- **Employees:** The number of employee records in the company.
- **Onboarding Flows:** The number of reusable onboarding journeys created by HR.
- **Payroll:** Payroll readiness or payroll access status.
- **Messages:** A quick reminder that employee communication is available.

These cards help HR understand the current state of the workspace without opening each module individually.

### 2.3 Using The HR Sidebar

The sidebar is the main navigation area for HR users. Use it to move between HR modules.

Common HR sidebar options include:

- **Overview:** Returns to the HR Dashboard home page.
- **Employees:** Manage employee records, create employees, and access employee profiles.
- **Onboarding:** Create and manage onboarding flows for employees.
- **Primer:** Track employee 30-60-90 day goals and progress.
- **Payroll:** Create, review, approve, and manage payroll runs.
- **Billing:** Manage company subscription and billing settings.
- **Compliance:** Track compliance modules, assignments, and onboarding-related progress.
- **Collaborate:** Publish announcements, manage buddy support, and view collaboration tools.
- **Messages:** Continue HR-to-employee conversations.
- **LifeSync:** Review wellbeing trends, support requests, and people-risk signals.
- **NestGuide AI:** Open the role-aware AI assistant for HR guidance.

When you select a sidebar item, the selected item should highlight. If a page takes a moment to load, wait for the dashboard to finish loading before selecting another module.

### 2.4 HR Topbar Actions

The HR workspace includes a topbar with quick actions.

Depending on screen size and device, the topbar may include:

- **Back:** Returns to the previous page or back to the HR Dashboard if there is no previous page.
- **Notifications:** Opens quick HR alerts or shortcuts.
- **Theme toggle:** Switches between light mode and dark mode.
- **Account menu:** Shows account-related options such as settings, billing, or logout.
- **Log out:** Ends your session and returns you to the login page.

Use **Log out** when you are finished, especially on shared devices.

### 2.5 What To Do If A Page Looks Empty

Some HR pages may appear empty when no data has been created yet.

For example:

- Employees may be empty until HR creates or invites employees.
- Onboarding may be empty until HR creates onboarding flows.
- Messages may be empty until HR or employees start conversations.
- LifeSync may be empty until employees submit shared check-ins or wellness entries.
- Payroll may need employee payroll settings before a payroll run can be created.

If a page is unexpectedly empty, check:

1. You are in the correct company workspace.
2. The employee or module has actually been created.
3. The employee has accepted their invitation or completed setup if required.
4. The data was saved under the same company workspace.
5. You have refreshed the page after recent setup changes.

If the issue continues, contact a Superadmin or technical administrator.

### 2.6 Recommended HR Starting Workflow

For a new company workspace, HR should usually start in this order:

1. Confirm the company workspace is correct.
2. Open **Employees** and create or invite employees.
3. Open **Onboarding** and create onboarding flows.
4. Assign onboarding flows to employees.
5. Open **Compliance** to review employee progress.
6. Use **Collaborate** and **Messages** to communicate with employees.
7. Use **LifeSync** to monitor shared wellbeing signals.
8. Set up **Payroll** only after employee payroll information is ready.

This order helps prevent empty dashboards and keeps employee setup organized.
