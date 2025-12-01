# PageSage v2 Requirements - Multi-User Collaboration

**Version**: 2.0 (Multi-User)
**Status**: Planning
**Depends On**: v1.0 complete
**Target**: 6-12 months after v1.0 launch

**GitHub Tracking**: See [Milestone: v2.0](https://github.com/your-repo/pagesageapp/milestone/2) and [Project Board](https://github.com/orgs/your-org/projects/1)

---

## Version Theme

**v2.0: Enable Collaborative Book Digitization**

Transform PageSage from a solo tool into a collaborative platform where multiple editors can work together on digitizing ancient texts.

---

## Target Audience

- **1 Admin**: System owner, manages users and budgets
- **5 Editors/Reviewers**: Collaborate on annotation and OCR correction
- **Multiple projects**: Admin can delegate different books to different teams

---

## Core Value Additions

What v2 adds beyond v1:

1. **Multi-User Authentication**: GitHub OAuth for all users
2. **Role-Based Permissions**: Admin, Editor, Reviewer, Viewer roles
3. **Concurrent Editing**: Multiple users work simultaneously (with conflict detection)
4. **Per-User Cost Tracking**: Attribute API costs to individual users
5. **Admin Oversight**: Monitor activity, manage users, track costs
6. **Collaboration Workflows**: User provisioning, permissions, suspensions

---

## Out of Scope for v2

Deferred to v3 or later:
- ❌ Advanced analytics and reporting
- ❌ Automated OCR quality improvements
- ❌ Cross-book search and concordance
- ❌ Public website integration (Component 2)
- ❌ Bulk import from external OCR tools
- ❌ Custom OCR model training

---

## Feature Dependencies

**Critical**: Each v2 feature has dependencies that MUST be tracked

### Dependency Map

```
v1.0 Features (Prerequisites):
├── Version Tracking (#5)
│   └── Required by: User auth (attribution), Concurrent editing
├── Cost Tracking Global (#6)
│   └── Required by: Per-user budgets, Per-project budgets
├── Annotation Editor (#3)
│   └── Required by: Permissions (edit checks)
└── Repository Structure
    └── Required by: Multi-user workflows, audit logging

v2.0 Features (Build Order):
├── User Authentication (#10)
│   ├── Depends on: v1.0 complete
│   └── Blocks: #11, #12, #13, #14, #15, #16, #17, #18
│
├── Role-Based Permissions (#11)
│   ├── Depends on: #10
│   ├── Impacts: Annotation Editor, Text Correction, API Access
│   └── Blocks: #12, #13
│
├── Per-User Budget Caps (#12)
│   ├── Depends on: #10 (user IDs), #6 (cost tracking)
│   └── Impacts: Cost dashboard, OCR processing
│
├── Per-Project Budget Caps (#13)
│   ├── Depends on: #6 (cost tracking)
│   └── Already partially in v1 (can add to v1)
│
└── Concurrent Edit Conflicts (#15)
    ├── Depends on: #5 (version tracking), #10 (user IDs)
    └── Impacts: Annotation editor, Text correction
```

---

## Administrative Workflows

### 9.1 User Lifecycle Management

#### 9.1.1 Admin Self-Setup & First-Time Configuration

**Actors:** Admin (system owner)

**Trigger:** First-time system setup

**Dependencies**:
- Requires: v1.0 deployment complete
- Impacts: All v2 features (creates first admin account)

**Preconditions:**
- Admin has GitHub account
- Admin has created GitHub organization for PageSage
- Admin has registered GitHub OAuth application

**Main Flow:**
1. Admin deploys PageSage application
2. Admin configures environment variables:
   - GitHub OAuth client ID/secret
   - GitHub organization name
   - GitHub service account token
   - Cloud API credentials for OCR
3. Admin navigates to application URL
4. System detects no users exist → shows "Initial Setup" wizard
5. Admin clicks "Sign in with GitHub"
6. GitHub OAuth flow completes
7. System creates admin user profile:
   - Sets role: Admin
   - Grants all permissions
   - Creates default settings
8. Admin lands on empty dashboard with "Create Your First Project" prompt

**Postconditions:**
- Admin account created with full permissions
- System ready for project creation

**Requirements:**
- First authenticated user automatically becomes Admin
- Setup wizard only appears when no users exist
- Clear documentation for OAuth app registration

---

#### 9.1.2 User Provisioning - Hybrid Approach

**Dependencies**:
- Requires: Admin self-setup (#10) complete
- Impacts: All v2 features (provides users to system)

PageSage supports two methods for adding users: manual creation and invitation-based.

##### **Method A: Manual User Creation**

**Actors:** Admin

**Trigger:** Admin wants to add a known GitHub user

**Main Flow:**
1. Admin navigates to Users → "Add User"
2. Admin enters:
   - GitHub username (required)
   - Initial role: Editor, Reviewer, or Viewer (required)
   - Optional: Assign to specific projects immediately
3. System validates GitHub username exists
4. Admin clicks "Create User"
5. System creates user profile with specified role
6. System assigns user to selected projects (if any)
7. User appears in user list with status "Pending First Login"
8. Next time user signs in via GitHub OAuth:
   - System matches GitHub username to profile
   - User gains access to assigned projects
   - Status changes to "Active"

**Alternative Paths:**
- If GitHub username doesn't exist: Show error, don't create profile
- If username already exists in system: Show error with link to existing profile

**Requirements:**
- Admin can bulk-assign user to multiple projects during creation
- User receives no notification (admin communicates externally)
- User must use exact GitHub username

---

##### **Method B: Invitation-Based Provisioning**

**Actors:** Admin (inviter), Invited User

**Trigger:** Admin wants to invite someone via email

**Main Flow:**
1. Admin navigates to Users → "Invite User"
2. Admin enters:
   - Email address (required)
   - GitHub username (required - for verification)
   - Initial role (required)
   - Optional: Projects to assign
   - Optional: Custom invitation message
3. System generates unique invitation token (expires in 7 days)
4. System creates invitation record with status "Pending"
5. Admin can:
   - **Option A:** Copy invitation link and send manually
   - **Option B:** Have system send email (if email configured)
6. Invited user receives link (via email or external communication)
7. User clicks invitation link
8. System validates:
   - Token not expired
   - Token not already redeemed
9. User redirected to GitHub OAuth (if not already signed in)
10. After OAuth, user lands on "Accept Invitation" page showing:
    - Inviter name
    - Role being granted
    - Projects they'll have access to
    - Terms of Service acceptance checkbox
11. User clicks "Accept Invitation"
12. System:
    - Creates user profile
    - Assigns specified role
    - Assigns to projects
    - Marks invitation as "Accepted"
    - Logs acceptance in audit trail
13. User redirected to project dashboard

**Alternative Paths:**
- If invitation expired: Show error, provide "Request New Invitation" button
- If GitHub username doesn't match invitation: Show error
- If user rejects invitation: Mark as "Rejected", notify admin

**Error Handling:**
- Token expired: Admin can resend invitation from Users → Invitations
- Email delivery fails: Admin sees warning, can copy link manually
- User already exists: Show error, don't create duplicate

**Postconditions:**
- User profile created and active
- User has access to assigned projects
- Invitation marked complete

**Requirements:**
- Invitation links are single-use only
- Expired invitations can be resent (generates new token)
- Admin can revoke pending invitations
- Admin can see list of pending/expired/accepted invitations
- System logs all invitation events (sent, accepted, rejected, expired)

---

#### 9.1.3 Role Assignment & Changes

**Actors:** Admin

**Trigger:** Admin needs to change user's role or project assignments

**Dependencies**:
- Requires: User authentication (#10)
- Impacts: All features with permission checks (annotation editor, text correction, OCR, export)

**Main Flow:**
1. Admin navigates to Users → [User Profile]
2. Admin clicks "Edit Permissions"
3. System shows current permissions:
   - Current role
   - Projects assigned
   - Permissions granted by role
4. Admin modifies:
   - Change role via dropdown
   - Add/remove project assignments
5. System displays permission diff:
   - "Will gain: OCR initiation, Direct text editing"
   - "Will lose: Project deletion"
6. Admin clicks "Save Changes"
7. System confirms: "This will apply immediately. Continue?"
8. Admin confirms
9. System:
   - Updates user role/assignments
   - Logs change in audit trail (before/after, who made change)
   - Notifies user (in-app notification + optional email)
10. If user has active sessions:
    - Changes apply immediately (permissions checked per-request)
    - User sees notification: "Your permissions have changed"

**Alternative Paths:**
- If user currently editing: Allow change, show warning "User has active sessions"
- If last admin: Prevent change, require at least one admin exists

**Requirements:**
- Permission changes take effect immediately (no delay)
- User notified of permission changes
- Cannot remove last admin
- Audit trail captures old and new permissions
- Admin can see permission diff before confirming

---

#### 9.1.4 User Removal from Project

**Actors:** Admin

**Trigger:** User should no longer have access to specific project

**Dependencies**:
- Requires: User authentication (#10), Permissions (#11)
- Impacts: Project collaborators list, activity monitoring

**Main Flow:**
1. Admin navigates to Project → Settings → Collaborators
2. Admin sees list of users with access and their roles
3. Admin clicks "Remove" next to user
4. System shows confirmation dialog:
   - "Remove [User Name] from [Project Name]?"
   - "Their edit history will remain visible and attributed to them."
   - "They will immediately lose access to this project."
5. Admin clicks "Confirm Removal"
6. System:
   - Removes user's project assignment
   - Terminates any active editing sessions for this project
   - Preserves user's edit attribution in history
   - Creates notification for user
   - Logs removal in audit trail
7. User (if online) sees notification: "You've been removed from [Project]"
8. User can no longer access project (redirected if they try)

**Alternative Paths:**
- If user is project owner: Require owner transfer first (block removal)
- If user has unsaved changes: System discards (warn in confirmation)

**Error Handling:**
- If last contributor: Allow removal (project becomes admin-only)
- If removal fails: Show error, user retains access

**Postconditions:**
- User has no access to project
- User's edits remain visible with attribution
- Audit trail records removal

**Requirements:**
- Removal is immediate (< 1 second)
- Edit history preserved permanently
- Cannot remove project owner without transferring ownership first
- Admin can bulk-remove user from multiple projects

---

#### 9.1.5 User Suspension & Deactivation

**Actors:** Admin

**Trigger:** User violates policies or needs temporary access removal

**Dependencies**:
- Requires: User authentication (#10)
- Impacts: All user sessions, API access

**Main Flow:**
1. Admin navigates to Users → [User Profile]
2. Admin clicks "Suspend User"
3. System shows suspension dialog:
   - Reason for suspension (optional but recommended)
   - Duration: Temporary (X days) or Indefinite
   - Notify user? (checkbox)
4. Admin fills in details and confirms
5. System:
   - Sets user status to "Suspended"
   - Immediately terminates all active sessions
   - Prevents future logins (OAuth succeeds but app blocks)
   - Preserves user's edit history (remains visible)
   - Logs suspension with reason in audit trail
   - Sends notification to user (if selected)
6. When suspended user tries to log in:
   - Sees message: "Your account has been suspended. Contact admin."
7. Admin can reactivate later:
   - Navigate to user profile
   - Click "Reactivate User"
   - User can immediately log in again

**Alternative Paths:**
- Temporary suspension: System auto-reactivates after duration
- If user is project owner: Suspension doesn't transfer ownership (owner remains)

**Difference vs Deletion:**
- **Suspension**: Temporary, reversible, edit history visible, user profile intact
- **Deletion**: Permanent, anonymizes user, removes personal data (GDPR)

**Requirements:**
- Suspension takes effect immediately (all sessions terminated)
- Suspended users cannot log in
- Edit history remains visible during suspension
- Admin can see suspension reason and duration
- Auto-reactivation for temporary suspensions
- Audit log records suspension and reactivation events

---

#### 9.1.6 User Account Deletion (GDPR Right to be Forgotten)

**Actors:** Admin

**Trigger:** User requests account deletion or Admin needs to remove user permanently

**Dependencies**:
- Requires: User authentication (#10)
- Impacts: All projects user contributed to, edit history, version tracking

**Preconditions:**
- User no longer needs access
- Admin has confirmed deletion request is legitimate

**Main Flow:**
1. Admin navigates to Users → [User Profile] → Danger Zone
2. Admin clicks "Delete User Account"
3. System shows deletion preview:
   - "This will permanently delete user account and personal data"
   - "Edit history will be preserved but attributed to '[Deleted User]'"
   - Shows count: "Will anonymize X edits across Y projects"
   - Lists projects user contributed to
4. Admin types "DELETE" to confirm
5. Admin clicks "Permanently Delete User"
6. System executes deletion:
   - Replaces user's name with "[Deleted User #ID]" in all edit attributions
   - Removes personal data: email, GitHub profile link, avatar
   - Preserves edit timestamps and content
   - Removes user from all project assignments
   - Invalidates all active sessions and OAuth tokens
   - Logs deletion in audit trail (records reason, who performed it)
7. System sends final notification to user's email (if email on file):
   - "Your account has been deleted per your request"
   - "Edit contributions remain visible but anonymized"
8. Admin sees confirmation: "User account deleted. Edit history preserved."

**Alternative Paths:**
- If user is sole project owner: Require owner transfer first (block deletion)
- If user has in-progress edits: Warn admin, continue with deletion

**Error Handling:**
- If service account cannot commit anonymization: Queue for retry
- If deletion fails mid-process: Rollback, keep user intact

**Postconditions:**
- User cannot log in (OAuth blocked)
- Personal data removed from system
- Edit history preserved with anonymous attribution
- GDPR compliance achieved

**Requirements:**
- Deletion is irreversible (warn prominently)
- Edit history MUST be preserved for data integrity
- Personal data must be purged within 30 days
- Audit trail records deletion with reason
- Deleted users receive final notification email
- Admin can export user's data before deletion (for handoff)
- Cannot delete last admin (require admin transfer first)

---

### 9.2 Project Lifecycle Management

#### 9.2.1 Project Creation & Setup (Multi-User)

**Actors:** Admin or Editor (with project creation permission)

**Trigger:** User wants to digitize a new book

**Dependencies**:
- Requires: User authentication (#10), Permissions (#11)
- Extends: v1.0 project creation (adds permission checks)

**Main Flow:**
1. User navigates to Dashboard → "Create New Project"
2. **Permission check**: System verifies user has project creation permission
3. User enters project metadata (same as v1)
4. System creates project (same as v1)
5. **NEW in v2**: User can invite collaborators during creation
6. User redirected to Project Dashboard

**Differences from v1**:
- ✅ Permission check before creation
- ✅ Can assign collaborators immediately
- ✅ Project owner designation matters (wasn't relevant in v1)

---

#### 9.2.2 Project Ownership Transfer

**Actors:** Admin

**Trigger:** Current project owner leaving organization or transferring responsibility

**Dependencies**:
- Requires: User authentication (#10), Permissions (#11)
- Impacts: Project access, permission inheritance

**Preconditions:**
- Project has an active owner
- New owner candidate exists (must be project contributor)

**Main Flow:**
1. System detects owner removal (or admin initiates transfer)
2. System creates notification for admin: "Project [Name] has no owner"
3. Admin navigates to Project → Settings → Transfer Ownership
4. System shows:
   - Current owner (if exists) or "No Owner"
   - List of project contributors (editors/reviewers)
   - Option to make admin the owner (if no contributors)
5. Admin selects new owner from dropdown
6. Admin clicks "Transfer Ownership"
7. System confirms: "Transfer ownership to [New Owner]? They will gain full project control."
8. Admin confirms
9. System:
   - Updates project owner field
   - Grants new owner full project permissions (if not already)
   - Creates notifications
   - Logs transfer in audit trail
10. New owner sees project with owner badge in dashboard

**Requirements:**
- Ownership transfer is immediate
- Only one owner per project
- Project must always have an owner
- Audit trail records transfer

---

#### 9.2.3 Project Archival vs Deletion

**Actors:** Admin

**Trigger:** Project is complete, inactive, or needs removal

**Dependencies**:
- Requires: Admin role (#11)
- Impacts: All project collaborators

(Same flows as documented in Section 9.2.3 of original requirements - Archive vs Delete)

---

### 9.3 Cost Management Workflows

#### 9.3.1 Per-Project Budget Caps

**Actors:** Admin

**Trigger:** Admin wants to limit spending for specific project

**Dependencies**:
- Extends: v1.0 global budget cap (#6)
- Impacts: OCR processing, layout detection, all API operations

**NOTE**: This can potentially be added to v1.0 as it doesn't require multi-user features.

(Flow details same as Section 9.3.1)

---

#### 9.3.2 Per-User Budget Caps

**Actors:** Admin

**Trigger:** Admin wants to limit spending per individual user

**Dependencies**:
- Requires: User authentication (#10) - to attribute costs
- Extends: v1.0 cost tracking (#6) - to track per-user
- Impacts: All users initiating OCR/processing operations

**Preconditions:**
- User exists in system
- Global budget cap configured

(Flow details same as Section 9.3.2)

---

#### 9.3.3 Real-Time Cost Spike Detection & Alerts

**Actors:** System → Admin

**Trigger:** Unusual cost spike detected

**Dependencies**:
- Extends: v1.0 cost tracking (#6)
- Can work with or without multi-user (nice-to-have for v1)

**NOTE**: This could potentially be added to v1.0 as it's valuable even for solo user.

(Flow details same as Section 9.3.3)

---

### 9.4 Admin Oversight & Monitoring

#### 9.4.1 Real-Time User Activity Monitor

**Actors:** Admin

**Trigger:** Admin wants to see who's actively working

**Dependencies**:
- Requires: User authentication (#10) - to track users
- Requires: Activity logging infrastructure
- Impacts: None (read-only dashboard)

(Flow details same as Section 9.4.1)

---

#### 9.4.2 Project Health Dashboard

**Actors:** Admin

**Trigger:** Admin wants overview of all projects

**Dependencies**:
- Extends: v1.0 project dashboard
- Benefits from: User activity (#14) for contributor counts

(Flow details same as Section 9.4.2)

---

#### 9.4.3 Audit Log Search & Export

**Actors:** Admin

**Trigger:** Need to review user actions or generate compliance reports

**Dependencies**:
- Requires: User authentication (#10) - to log user actions
- Requires: Audit logging infrastructure (can start in v1)
- Impacts: GDPR compliance, security audits

(Flow details same as Section 9.4.3)

---

### 9.5 Edge Case Scenarios

#### 9.5.1 Project Owner Departure

**Dependencies**:
- Requires: Project ownership concept (#11)
- Requires: User removal (#13)

(Flow details same as Section 9.5.1)

---

#### 9.5.2 GitHub Account Loss or Service Account Permission Failure

**Dependencies**:
- Requires: OAuth integration (#10)
- Impacts: All users (if service account fails)

(Flow details same as Section 9.5.2)

---

#### 9.5.3 Processing Jobs Stuck or Hanging

**Dependencies**:
- Extends: v1.0 job queue
- Benefits from: Admin monitoring dashboard (#14)

(Flow details same as Section 9.5.3)

---

#### 9.5.4 Concurrent Edit Conflicts

**Actors:** System → Users

**Scenario:** Two users edit same page simultaneously

**Dependencies**:
- Requires: v1.0 version tracking (#5) - for version detection
- Requires: User authentication (#10) - to identify conflicting users
- Impacts: Annotation editor, text correction workflows

(Flow details same as Section 9.5.4)

---

#### 9.5.5 User Session Expiration & Re-authentication

**Dependencies**:
- Requires: OAuth integration (#10)
- Impacts: All authenticated users

(Flow details same as Section 9.5.5)

---

## Implementation Priority

### Phase 1: Foundation (Build First)
Must complete before other v2 features:

1. **User Authentication** (#10) - Blocks everything else
2. **Role-Based Permissions** (#11) - Blocks most features
3. **Audit Logging Infrastructure** - Supports compliance

### Phase 2: Core Collaboration (Next)

4. **User Provisioning** (Manual + Invite) (#12)
5. **Concurrent Edit Conflicts** (#15) - Critical for multi-user
6. **User Activity Monitor** (#14) - Admin needs visibility

### Phase 3: Enhanced Controls

7. **Per-User Budget Caps** (#13)
8. **User Removal/Suspension** (#16)
9. **Project Ownership Transfer** (#17)

### Phase 4: Polish

10. **Account Deletion (GDPR)** (#18)
11. **Audit Log Search** (extend logging from Phase 1)

---

## Success Metrics (v2)

**Collaboration**:
- Support 5 concurrent users without conflicts
- < 1 second conflict detection
- Zero data loss from concurrent edits

**Cost Control**:
- Per-user budgets enforced 100%
- Zero budget overages (without explicit override)
- Real-time cost attribution accurate

**Administration**:
- Admin can provision user in < 30 seconds
- Admin can see all user activity in real-time
- Audit log searchable in < 2 seconds

---

## v3 Preview (Future Considerations)

What might come in v3:
- Advanced search across all books
- OCR quality dashboards
- Automated cleanup recommendations
- Cost optimization suggestions
- Bulk operations (import multiple books)
- Integration with external tools

---

## Notes

- v2 builds on v1's version tracking foundation
- Dependencies are critical - don't skip tracking them
- Many v2 features can be incrementally added (not big-bang release)
- Some features (cost spike alerts, per-project budgets) could move to v1.1
