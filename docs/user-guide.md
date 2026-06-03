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

## 3. HR Employees Module

The **Employees** module is where HR manages employee records. Most other HR workflows depend on employees being created first, so this is usually the first operational module HR should use after confirming the company workspace.

### 3.1 What The Employees Module Contains

The Employees module may include:

- A list of company employees.
- Employee names, email addresses, roles, departments, status, and job titles.
- Search, filter, sort, or pagination controls.
- A button or form to add a new employee.
- Links to individual employee profiles.
- Employee-specific setup areas such as payroll settings, onboarding status, or offboarding actions.

### 3.2 How HR Uses Employees

To create or invite an employee:

1. Open **HR Dashboard**.
2. Select **Employees** from the sidebar.
3. Select the option to add or create an employee.
4. Enter the employee's required details, such as name and email address.
5. Save the employee record.
6. Share or send the invitation link if the app provides one.

After the employee accepts or completes setup, they should be able to log in and access their Employee Dashboard.

### 3.3 Opening An Employee Profile

To view or manage an employee:

1. Open **Employees**.
2. Find the employee in the list.
3. Select the employee record.
4. Review or update the employee details available in the profile.

Use employee profiles carefully. Changes made here may affect onboarding, payroll, compliance, or dashboard access.

### 3.4 Employee Module Prerequisites

Before other workflows can work correctly, make sure:

- The employee exists in the correct company workspace.
- The employee email address is correct.
- The employee has a linked user account after accepting an invitation.
- The employee has the correct status, such as active or exited.
- Any required payroll or onboarding setup has been completed.

### 3.5 Common Employee Issues

**Employee does not appear**

Confirm that the employee was created under the correct company workspace and that filters or search terms are not hiding the record.

**Employee cannot log in**

Confirm that the employee is using the same email address used for the invitation or account setup.

**Employee dashboard is empty**

The employee may not have an assigned onboarding flow, compliance module, payslip, Primer goal, or message yet.

**Invitation link does not work**

Ask an administrator to confirm that the invitation is still valid or generate a new invitation.

## 4. HR Onboarding Module

The **Onboarding** module lets HR create structured onboarding journeys for employees. It is used to define what new hires should complete during their first days, weeks, or months.

### 4.1 What The Onboarding Module Contains

The Onboarding module may include:

- Reusable onboarding flows.
- Flow names and descriptions.
- Milestones, tasks, or checklist items.
- Options to create, edit, or assign flows.
- Employee progress views.

An onboarding flow is a template. HR can reuse it for multiple employees.

### 4.2 How HR Creates An Onboarding Flow

1. Open **HR Dashboard**.
2. Select **Onboarding** from the sidebar.
3. Choose the option to create a new onboarding flow.
4. Add the flow name and description.
5. Add milestones, checklist items, or tasks.
6. Save the flow.

Keep onboarding flows clear and practical. A good flow should tell the employee exactly what to do next.

### 4.3 How HR Assigns Onboarding

1. Open **Onboarding**.
2. Choose the assign option if available.
3. Select an employee.
4. Select the onboarding flow.
5. Confirm the assignment.

After assignment, the employee should see the onboarding tasks in their Employee Dashboard.

### 4.4 Editing Onboarding Flows

When editing an onboarding flow, remember that you are usually editing a reusable template. If only one employee needs a unique journey, create a separate flow or confirm how the app handles assigned flow snapshots before making broad changes.

### 4.5 Common Onboarding Issues

**Employee does not see onboarding tasks**

Confirm that the employee has been assigned a flow and that the employee record is linked to their user account.

**Wrong employee progress appears**

Confirm that each employee has a separate onboarding assignment and that the flow was not reused incorrectly as an employee-specific checklist.

**Onboarding page is empty**

Create at least one onboarding flow before assigning onboarding to employees.

## 5. HR Primer Module

The **Primer** module helps HR track employee 30-60-90 day progress. It supports goal tracking, completion status, progress percentages, and gamification signals such as XP, levels, and badges.

### 5.1 What The Primer Module Contains

The HR Primer module may show:

- A list of employees.
- Each employee's Primer progress.
- Completed and total goals.
- Level, XP, and badge summary.
- Links to individual employee Primer details.

### 5.2 How HR Uses Primer

1. Open **HR Dashboard**.
2. Select **Primer**.
3. Review the employee list.
4. Select an employee to view their detailed progress.
5. Look for incomplete goals, low progress, or stalled activity.

Primer is useful for checking whether employees are moving through their early success plan.

### 5.3 What HR Should Look For

HR should watch for:

- Employees with no goals.
- Employees with many incomplete goals.
- Employees who are stuck at an early phase.
- Employees who may need manager support or clarification.

### 5.4 Common Primer Issues

**Employee progress does not appear**

Confirm that the employee has Primer goals and that the goals are linked to the correct employee account.

**Progress looks lower than expected**

Check whether the employee has marked goals complete and whether goals were created under the correct employee identity.

## 6. HR Payroll Module

The **Payroll** module helps HR create and manage payroll runs. It is designed to support payroll preparation, approval, paid status tracking, and employee payslip access.

### 6.1 What The Payroll Module Contains

The Payroll module may include:

- Current active payroll run.
- Recent paid payroll runs.
- Payroll readiness messages.
- Buttons to create, approve, or mark payroll as paid.
- Links to payroll run details.

### 6.2 Payroll Prerequisites

Before creating payroll, make sure:

- Employees exist in the company workspace.
- Employees who should be paid are active.
- Payroll settings are complete on employee records.
- Salary or pay information is entered where required.

If payroll readiness warnings appear, open the relevant employee records and complete payroll settings first.

### 6.3 Creating A Payroll Run

1. Open **Payroll**.
2. Review payroll readiness warnings.
3. Select **Create Payroll** if the button is available.
4. Review the payroll run details.
5. Confirm that employee pay data is correct.

Do not create payroll until employee payroll information has been reviewed.

### 6.4 Approving And Marking Payroll Paid

After a payroll run is created:

1. Review the payroll run.
2. Approve it only when the details are correct.
3. Mark it as paid after payment is complete.

Once payroll is marked paid, employees may be able to access their payslips.

### 6.5 Common Payroll Issues

**Create Payroll is disabled**

There may already be an active payroll run, or employees may not have complete payroll settings.

**No active monthly employees found**

Confirm employee status and pay frequency settings.

**Employees cannot see payslips**

Confirm that payroll was marked paid and payslips were issued.

## 7. HR Billing Module

The **Billing** module is where HR manages company subscription access. Billing is company-level, not employee-level.

### 7.1 What The Billing Module Contains

Billing may show:

- Current plan.
- Trial or subscription status.
- Available plan options.
- Checkout or upgrade buttons.
- Billing portal access.

### 7.2 How HR Uses Billing

1. Open **Billing**.
2. Review the current company plan.
3. Select the desired plan if upgrading or starting a subscription.
4. Complete checkout in Stripe if prompted.
5. Return to WelcomeNestHR after payment or billing setup.

### 7.3 Billing Notes

Only authorized HR or company administrators should manage billing. Plan access may affect which modules or features are available to the company.

### 7.4 Common Billing Issues

**Checkout does not open**

Confirm that Stripe configuration is complete and that the HR user has permission to manage billing.

**Wrong plan appears**

Wait for billing webhooks to update the company subscription, then refresh the page. If the issue remains, contact the platform administrator.

## 8. HR Compliance Module

The **Compliance** module is HR's control center for required employee obligations such as policy acknowledgments, mandatory training, certifications/licenses, and other compliance tasks. It is designed to stay simple for HR while still giving the company useful audit evidence and risk visibility.

### 8.1 What The Compliance Module Contains

Compliance may include:

- Top summary cards for risk score, completed records, overdue records, and due/expiring soon records.
- Compliance requirements that HR can create and assign.
- Bulk assignment to one employee, one department, or everyone.
- A searchable Assignment Register with status and type filters.
- Employee evidence submissions for certifications/licenses.
- HR approve/reject actions for submitted certifications/licenses.
- Inline assignment history from audit events.
- CSV export for compliance reporting.
- A Risk Queue for daily follow-up.

### 8.2 Top Summary Cards

The top cards give HR a quick view of compliance readiness:

- **Risk score:** Overall compliance readiness. Higher is better. It drops when assignments are overdue, due soon, or expiring soon.
- **Completed:** How many assignment records have been completed.
- **Overdue:** How many assignments are past their due date or expiry date.
- **Due or expiring soon:** How many assignments are close to a deadline or certification/license expiry.

For example, if one employee has completed a requirement and another employee has the same requirement due soon, HR may see a lower risk score even though nothing is overdue yet.

### 8.3 Compliance Requirements

A compliance requirement is the item HR creates before assigning it to employees. It is the template or rule, not an individual employee's completion record.

Examples:

- Employee Handbook Acknowledgment
- Code of Conduct acknowledgment
- Data protection training
- First aid certification
- Professional license renewal
- Workplace safety training

Each requirement may include:

- **Title:** What the requirement is.
- **Description:** What the employee needs to do.
- **Type:** Policy acknowledgment, certification/license, training, or task.
- **Version:** The version of the policy or requirement, such as `1.0`.
- **Due date:** The default deadline when assigned.
- **Expiration date:** Mainly used for certifications/licenses.
- **Document URL:** Optional link to a policy, handbook, training, or external document.
- **Issuing authority:** Optional, mainly useful for certifications/licenses.

To create a requirement:

1. Open **HR Dashboard → Compliance**.
2. Select **Create Requirement**.
3. Enter the title, description, type, version, and any dates or links.
4. Save the requirement.

### 8.4 Assigning Compliance

Under **Compliance Requirements**, find the requirement and select **Assign**.

HR can assign in three simple ways:

- **One employee:** Assign to a single person.
- **Department:** Assign to everyone in a selected department.
- **Everyone:** Assign to all employees in the company.

After choosing the target, the page shows a preview such as:

`2 will be assigned, 1 already assigned and skipped.`

This protects HR from duplicate assignments. If an employee already has that requirement, the system skips that employee automatically.

Select **Confirm assign** to create the assignments.

### 8.5 Assignment Register

The Assignment Register tracks actual employee assignments.

A requirement becomes an assignment when it is given to an employee. For example:

- Beauty + Employee Handbook = one assignment.
- James + Employee Handbook = another assignment.

Each assignment card may show:

- Requirement name.
- Employee name and department.
- Assigned date and who assigned it, if available.
- Type and version.
- Due date.
- Expiration date, if relevant.
- Status badge.
- Evidence link, if the employee uploaded proof.
- Completion note, if the employee added one.
- Rejection note, if HR rejected a submission.
- History, when audit events exist for that assignment.

### 8.6 Compliance Statuses

Statuses help HR understand what needs attention:

- **Pending:** Assigned, but not urgent yet.
- **Due soon:** The deadline is close, currently within 14 days.
- **Expiring soon:** A certification/license expiry date is within 60 days.
- **Overdue:** The due date or expiry date has passed.
- **Submitted:** An employee submitted a certification/license for HR review.
- **Needs changes:** HR rejected a submitted item and left a note for the employee.
- **Completed:** The employee finished the requirement, or HR approved the submitted certification/license.

### 8.7 Search, Filters, And Paging

The search box searches all assignments globally, not just the visible page. HR can search by employee, department, role/title, requirement name, or type.

Examples:

- `beauty`
- `sales`
- `handbook`

Filters include:

- **All statuses:** Shows everything.
- **Risk only:** Shows due-soon, expiring-soon, and overdue records.
- **Pending:** Assigned but not urgent.
- **Submitted:** Waiting for HR review.
- **Needs changes:** Rejected and needs employee correction.
- **Due soon:** Deadline close.
- **Overdue:** Late.
- **Expiring soon:** License/certification close to expiry.
- **Completed:** Finished records.

The type filter lets HR filter by policy, certification/license, training, or task.

The register loads records in pages so it remains usable for large companies.

### 8.8 Evidence And HR Review

For certifications/licenses, employees can submit:

- License or certification number.
- Evidence file.
- Optional completion note.

When an employee submits certification evidence, the assignment becomes **Submitted**.

HR can then review it in the Assignment Register:

1. Open **Compliance**.
2. Use the **Submitted** filter if needed.
3. Review the license/certification number, evidence, and note.
4. Select **Approve** if the evidence is acceptable.
5. Select **Reject** if it needs changes.
6. Add a rejection note so the employee knows what to fix.

If HR approves it, the assignment becomes **Completed**. If HR rejects it, the employee sees the note and can resubmit.

### 8.9 Export CSV

The **Export CSV** button downloads a compliance report based on the current search and filter view.

The export may include:

- Requirement.
- Version.
- Employee.
- Department.
- Status.
- Due date.
- Expiry date.
- Evidence URL.
- Notes.

Use CSV export for quick internal reviews, compliance checks, or audit preparation.

### 8.10 Compliance Coverage Summary

The Compliance Coverage Summary shows completion coverage across assignment records.

For example:

`Assignment completion rate: 50% across 2 active records.`

This means there are 2 total assignments, and 1 of them is complete.

### 8.11 Compliance Risk Queue

The Risk Queue is HR's follow-up list.

It only shows employees with real deadline risk:

- Overdue.
- Due soon.
- Expiring soon.

Use this section daily to know who HR needs to chase. The **Send reminder** link opens a prefilled email reminder so HR can follow up quickly without a complicated notification workflow.

### 8.12 Audit Trail

HR does not need to manage the audit trail manually.

The system records events in the background when:

- HR assigns a requirement.
- An employee acknowledges a policy.
- An employee submits certification/license evidence.
- HR approves a submission.
- HR rejects a submission.
- An employee completes a training or task.

Examples:

- Daniel assigned Employee Handbook to James on Jun 3, 2026.
- Beauty acknowledged Employee Handbook on Jun 3, 2026.
- James submitted First Aid Certificate for review.
- Daniel approved James's First Aid Certificate.
- Daniel rejected a license submission with a note.

The page keeps this simple by showing useful history inside assignment cards, without requiring HR to manage a separate audit system.

### 8.13 Recommended HR Compliance Workflow

1. Create a requirement.
2. Add a clear version, such as `1.0`.
3. Assign it to one employee, a department, or everyone.
4. Watch the top cards for completed, overdue, and due/expiring soon records.
5. Use the Risk Queue to follow up with employees who need attention.
6. Use the Submitted and Needs changes filters to manage certification reviews.
7. Use search/filter to find specific employees or requirements.
8. Export CSV when you need a quick report.

### 8.14 Common Compliance Issues

**Compliance shows no employees**

Confirm that employees exist in the company workspace.

**Completion rate looks wrong**

Check whether the page is showing employees with assigned modules only or all employees.

**Employee is not assigned**

Assign the compliance module to the employee from the Compliance page.

**Employee cannot upload evidence**

Firebase Storage must be enabled for the project. If uploads fail, ask a technical administrator to confirm that Firebase Storage is set up and storage rules are deployed.

**Submitted item is not complete**

Submitted certifications/licenses still need HR review. Approve the submission to mark it complete, or reject it with a note if changes are needed.

## 9. HR Collaborate Module

The **Collaborate** module supports company communication and connection. HR can use it to publish announcements and support employee relationships.

### 9.1 What The Collaborate Module Contains

Collaborate may include:

- Announcements.
- Employee directory or org visibility.
- Buddy assignment tools.
- Collaboration updates.

### 9.2 Publishing Announcements

1. Open **Collaborate**.
2. Create a new announcement.
3. Add a clear title and message.
4. Publish the announcement.

Employees in the same company workspace should be able to view company-wide announcements from their Collaborate page.

### 9.3 Buddy Support

If buddy assignment is available:

1. Open **Collaborate**.
2. Choose the employee who needs a buddy.
3. Choose the buddy employee.
4. Save the assignment.

Buddy assignment works best when at least two active employees exist in the company.

### 9.4 Common Collaborate Issues

**Employees do not see announcements**

Confirm that the announcement was published under the correct company workspace.

**Cannot assign a buddy**

Confirm that there are at least two active employees and that the selected employees are valid.

## 10. HR Messages Module

The **Messages** module lets HR communicate directly with employees.

### 10.1 What The Messages Module Contains

Messages may include:

- Existing HR-employee conversations.
- Conversation previews.
- A list of employees to start conversations with.
- Individual chat pages.

### 10.2 Starting A Conversation

1. Open **Messages**.
2. Select an employee from the start conversation list.
3. Type your message.
4. Send the message.

After the first message is sent, the conversation should appear in the conversation list.

### 10.3 Continuing A Conversation

1. Open **Messages**.
2. Select an existing conversation.
3. Read previous messages.
4. Send a reply if needed.

### 10.4 Common Message Issues

**No conversations appear**

No conversations may have started yet. Select an employee to begin one.

**Employee name is missing**

The employee profile may not be linked correctly or may not have a name saved.

**Message does not show immediately**

Refresh the page if needed. If the issue continues, confirm network access and Firestore permissions.

## 11. HR LifeSync Module

The **LifeSync** module gives HR visibility into shared employee wellbeing signals. It is designed for emotional intelligence, early support, and trend awareness.

### 11.1 What LifeSync Contains

LifeSync may show:

- Average sentiment.
- Recent emotional check-ins.
- Recent wellness logs.
- Support requests.
- At-risk signals.
- People insight summaries.

### 11.2 How HR Uses LifeSync

1. Open **LifeSync**.
2. Review average sentiment and support request counts.
3. Check recent emotional check-ins.
4. Review wellness logs.
5. Follow up with employees who request support or show risk signals.

LifeSync should be used to support employees, not to punish them.

### 11.3 Privacy Notes

Employees may share LifeSync entries in different ways depending on available privacy options:

- Private entries should stay employee-only.
- Anonymous or trend-only entries may show without the employee name.
- HR-visible entries may show the employee name and details.

Respect the privacy level selected by the employee.

### 11.4 Common LifeSync Issues

**LifeSync is empty**

Employees may not have submitted shared entries yet, or entries may be private.

**Employee name does not appear**

The employee may have shared anonymously or as trend-only.

**Support request appears**

Follow up respectfully and privately. Do not discuss sensitive wellbeing entries publicly.

## 12. HR NestGuide AI

**NestGuide AI** is the role-aware assistant available inside the HR workspace. It helps HR users understand workflows, find next steps, and get guidance.

### 12.1 How HR Uses NestGuide AI

1. Select **NestGuide AI** from the sidebar.
2. Ask a question about HR workflows or the current task.
3. Review the answer.
4. Use the guidance as support, not as a replacement for HR judgment.

### 12.2 Good Questions For HR

Examples:

- "How do I onboard a new employee?"
- "What should I check before running payroll?"
- "How do I follow up on a LifeSync support request?"
- "Why might an employee dashboard be empty?"

### 12.3 AI Usage Notes

NestGuide AI may provide general guidance. HR should still follow company policy, employment law, and internal approval processes.

## 13. Employee Dashboard Overview

The Employee Dashboard is the workspace employees use to complete onboarding, view company updates, track goals, communicate with HR, use LifeSync, and access payslips.

Employees should only see information connected to their own employee account and company workspace.

### 13.1 Employee Sidebar Modules

Employee sidebar options may include:

- **Smart Onboarding:** Complete onboarding tasks.
- **LifeSync:** Submit wellbeing check-ins and wellness reflections.
- **Collaborate:** View announcements, buddy information, and company collaboration tools.
- **Compliance:** View assigned compliance or required tasks.
- **Primer:** Track 30-60-90 day goals and progress.
- **Payslips:** View issued payslips.
- **Messages:** Communicate with HR.
- **NestGuide AI:** Ask for role-aware guidance.

### 13.2 Recommended Employee Starting Workflow

After first login, employees should usually:

1. Confirm they are in the Employee Dashboard.
2. Open **Smart Onboarding** and review assigned tasks.
3. Complete any required onboarding steps.
4. Open **Collaborate** to read company announcements.
5. Open **Primer** to review early goals.
6. Use **Messages** if they need help from HR.
7. Use **LifeSync** for wellbeing check-ins when appropriate.

## 14. Employee Smart Onboarding Module

The **Smart Onboarding** module shows the employee's assigned onboarding journey.

### 14.1 What Employees See

Employees may see:

- Assigned onboarding flow.
- Milestones.
- Checklist tasks.
- Completion status.
- Current progress.

### 14.2 How Employees Use Smart Onboarding

1. Open **Smart Onboarding**.
2. Review the current milestone or checklist.
3. Complete each task as instructed.
4. Mark tasks complete when finished.
5. Continue until all onboarding tasks are complete.

### 14.3 Common Onboarding Issues For Employees

**No onboarding tasks appear**

Contact HR. An onboarding flow may not have been assigned yet.

**Task looks incorrect**

Contact HR before marking it complete.

**Progress does not update**

Refresh the page. If it still does not update, contact HR.

## 15. Employee LifeSync Module

The **LifeSync** module lets employees share wellbeing check-ins and reflections.

### 15.1 What Employees Can Do In LifeSync

Employees may be able to:

- Submit mood or emotional check-ins.
- Add notes about how they are feeling.
- Log wellness reflections.
- Request HR follow-up.
- Choose a visibility level when available.

### 15.2 How Employees Submit A Check-In

1. Open **LifeSync**.
2. Choose the mood, sentiment, or wellbeing option that best fits.
3. Add a note if needed.
4. Choose the visibility option if available.
5. Request follow-up if support is needed.
6. Submit the check-in.

### 15.3 LifeSync Privacy For Employees

Depending on the option selected:

- Private entries are intended for the employee only.
- Anonymous or trend-only entries may help HR see patterns without identifying the employee.
- HR-visible entries may be shown to HR with employee details.

Employees should choose the option that matches their comfort level.

### 15.4 Common LifeSync Issues For Employees

**Entry does not appear in history**

Refresh the page and confirm the entry was submitted.

**HR cannot see an entry**

The entry may have been saved as private.

**Need urgent help**

Use company-approved urgent support channels. LifeSync is not a replacement for emergency support.

## 16. Employee Collaborate Module

The **Collaborate** module helps employees stay connected to the company and team.

### 16.1 What Employees See In Collaborate

Employees may see:

- Company announcements.
- Buddy information.
- Org or team visibility.
- Collaboration updates.

### 16.2 How Employees Use Collaborate

1. Open **Collaborate**.
2. Read recent announcements.
3. Review assigned buddy information if available.
4. Use any collaboration tools provided by the company.

### 16.3 Common Collaborate Issues For Employees

**No announcements appear**

HR may not have published announcements yet.

**No buddy appears**

HR may not have assigned a buddy yet.

**Company information looks wrong**

Contact HR to confirm your employee record and company assignment.

## 17. Employee Compliance Module

The **Compliance** module helps employees view and complete required policies, training, certifications/licenses, and compliance tasks assigned by HR.

### 17.1 What Employees See

Employees may see:

- Assigned compliance requirements.
- Requirement type, such as policy, certification/license, training, or task.
- Due date.
- Expiration date, if relevant.
- Status badge.
- Document or training link, if HR provided one.
- License/certification number field when needed.
- Evidence upload field for certifications/licenses.
- Optional completion note.
- HR feedback if a submission needs changes.

### 17.2 How Employees Use Compliance

1. Open **Employee Dashboard → Compliance**.
2. Review each assigned requirement.
3. Open any document or training link provided by HR.
4. Complete the required action.
5. Add any requested information, such as a license number or completion note.
6. Submit, acknowledge, or mark the item complete.
7. Confirm that the status updates.

### 17.3 Policy Acknowledgments

For a policy acknowledgment, employees should:

1. Read the policy or linked document carefully.
2. Add an optional note if needed.
3. Select **Acknowledge**.

After acknowledgment, the status becomes **Completed**.

### 17.4 Certifications And Licenses

For certifications/licenses, employees may need to submit:

- License or certification number.
- Evidence file, such as a certificate or proof document.
- Optional completion note.

After submitting, the status becomes **Submitted**. This means HR still needs to review the evidence.

If HR approves the submission, the status becomes **Completed**.

If HR rejects the submission, the status becomes **Needs changes** and the employee should read HR's note, correct the issue, and submit again.

### 17.5 Training And Tasks

For training or general compliance tasks:

1. Complete the training or task as instructed.
2. Add an optional completion note if useful.
3. Select **Mark complete**.

After completion, the status becomes **Completed**.

### 17.6 Employee Compliance Statuses

Employees may see these statuses:

- **Pending:** Assigned, but not urgent yet.
- **Due soon:** The deadline is close.
- **Overdue:** The deadline has passed.
- **Expiring soon:** A certification/license is close to expiry.
- **Submitted:** Sent to HR for review.
- **Needs changes:** HR rejected the submission and left feedback.
- **Completed:** Finished or approved.

### 17.7 Common Compliance Issues For Employees

**No compliance modules appear**

HR may not have assigned any modules yet.

**A required item is unclear**

Contact HR for clarification before marking it complete.

**Certification is submitted but not completed**

HR still needs to review and approve it.

**Submission says Needs changes**

Read HR's note, correct the issue, and resubmit the certification/license evidence.

**Evidence upload does not work**

Contact HR. The company may need a technical administrator to confirm Firebase Storage setup.

## 18. Employee Primer Module

The **Primer** module helps employees follow their 30-60-90 day goals.

### 18.1 What Employees See In Primer

Employees may see:

- Goals grouped by phase.
- Progress percentage.
- XP, levels, or badges.
- Completed and incomplete goals.

### 18.2 How Employees Use Primer

1. Open **Primer**.
2. Review current goals.
3. Work through the goals in order.
4. Mark goals complete when finished.
5. Check progress and upcoming goals regularly.

### 18.3 Common Primer Issues For Employees

**No goals appear**

HR may not have created or assigned Primer goals yet.

**Progress is not updating**

Refresh the page and confirm the goal was marked complete.

## 19. Employee Payslips Module

The **Payslips** module lets employees view payslips that HR has issued.

### 19.1 What Employees See

Employees may see:

- A list of issued payslips.
- Pay period information.
- Gross pay, deductions, and net pay where available.
- Payslip detail pages.

### 19.2 How Employees Use Payslips

1. Open **Payslips**.
2. Select a payslip.
3. Review the details.
4. Contact HR if any pay information looks incorrect.

### 19.3 Common Payslip Issues

**No payslips appear**

HR may not have marked payroll as paid or issued payslips yet.

**Payslip details look wrong**

Contact HR or payroll support. Do not edit payroll records yourself.

## 20. Employee Messages Module

The **Messages** module lets employees communicate with HR.

### 20.1 What Employees See

Employees may see:

- Existing conversations with HR.
- Conversation previews.
- Individual chat pages.

### 20.2 How Employees Use Messages

1. Open **Messages**.
2. Select an existing conversation or start a conversation if available.
3. Type your message.
4. Send the message.
5. Wait for HR to respond.

### 20.3 Good Uses For Messages

Employees can use Messages to ask about:

- Onboarding tasks.
- Missing documents or assignments.
- Payslip questions.
- Compliance tasks.
- Primer goals.
- General HR support.

### 20.4 Common Message Issues

**No conversation appears**

HR may not have started a conversation yet, or no message has been sent.

**Message does not send**

Check your network connection and try again. If the problem continues, contact HR through another approved channel.

## 21. Employee NestGuide AI

**NestGuide AI** is the role-aware assistant available to employees.

### 21.1 How Employees Use NestGuide AI

1. Select **NestGuide AI** from the sidebar.
2. Ask a question about using WelcomeNestHR.
3. Review the response.
4. Follow up with HR for company-specific decisions or sensitive issues.

### 21.2 Good Questions For Employees

Examples:

- "Where do I find my onboarding tasks?"
- "How do I complete a Primer goal?"
- "Where can I see my payslip?"
- "How do I message HR?"
- "What is LifeSync for?"

### 21.3 AI Usage Notes For Employees

NestGuide AI is a guidance tool. Employees should contact HR for official decisions, policy questions, payroll issues, or urgent support.

## 22. General Best Practices

### 22.1 For HR

- Create employee records before assigning workflows.
- Confirm employees are linked to the correct company.
- Keep onboarding flows clear and reusable.
- Review LifeSync support requests privately and respectfully.
- Confirm payroll details before approving payroll.
- Use Messages for direct employee support.
- Log out after using shared devices.

### 22.2 For Employees

- Start with Smart Onboarding after first login.
- Complete required tasks carefully.
- Use Messages when you need help from HR.
- Use LifeSync honestly and choose the right privacy level.
- Check Primer goals regularly.
- Review payslips and report concerns quickly.
- Log out after using shared devices.

### 22.3 When To Contact Support Or An Administrator

Contact HR, a Superadmin, or a technical administrator if:

- You cannot log in.
- You are routed to the wrong dashboard.
- Your company workspace is missing or incorrect.
- Required modules are empty when they should contain data.
- Payroll or payslip information looks wrong.
- Sensitive wellbeing or employee data appears in the wrong place.

## 23. Documentation Coverage

This guide covers the main HR and employee operating workflows in WelcomeNestHR. Superadmin setup, technical deployment, billing provider configuration, Firestore rules, and developer maintenance are handled separately from this user guide.
