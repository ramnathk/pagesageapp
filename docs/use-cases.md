# PageSage - Use Case Driven Development Plan

**Purpose:** Incremental development with discrete, testable value delivery
**Approach:** Test-Driven Development (TDD) - Write tests first, then implementation
**Status Tracking:** Each UC has clear Done/Not Done criteria

---

## Use Case Index

| UC#   | Title                                                                      | Value Delivered                         | Status         | Dependencies |
| ----- | -------------------------------------------------------------------------- | --------------------------------------- | -------------- | ------------ |
| UC-1  | [Environment Setup & Validation](#uc-1-environment-setup--validation)      | Verify all APIs configured correctly    | 🔴 Not Started | None         |
| UC-2  | [GitHub Authentication](#uc-2-github-authentication)                       | User can log in with GitHub             | 🔴 Not Started | UC-1         |
| UC-3  | [Create Project (No PDF)](#uc-3-create-project-no-pdf)                     | User can create a book project          | 🔴 Not Started | UC-2         |
| UC-4  | [Upload PDF to Google Drive](#uc-4-upload-pdf-to-google-drive)             | User can upload PDF and see it in Drive | 🔴 Not Started | UC-1, UC-3   |
| UC-5  | [View Project Dashboard](#uc-5-view-project-dashboard)                     | User sees project metadata and status   | 🔴 Not Started | UC-3, UC-4   |
| UC-6  | [Split PDF into Pages](#uc-6-split-pdf-into-pages)                         | PDF becomes individual page images      | 🔴 Not Started | UC-4         |
| UC-7  | [Quality Check Sample Pages](#uc-7-quality-check-sample-pages)             | User decides if preprocessing needed    | 🔴 Not Started | UC-6         |
| UC-8  | [AI Layout Detection (Single Page)](#uc-8-ai-layout-detection-single-page) | Get bounding boxes for one page         | 🔴 Not Started | UC-1, UC-6   |
| UC-9  | [View Page with AI Annotations](#uc-9-view-page-with-ai-annotations)       | User sees boxes overlaid on page image  | 🔴 Not Started | UC-8         |
| UC-10 | [Manual Box Creation](#uc-10-manual-box-creation)                          | User can draw new bounding box          | 🔴 Not Started | UC-9         |
| UC-11 | [Edit Box Properties](#uc-11-edit-box-properties)                          | User can move/resize/relabel boxes      | 🔴 Not Started | UC-10        |
| UC-12 | [Save Annotations to GitHub](#uc-12-save-annotations-to-github)            | Changes saved with version history      | 🔴 Not Started | UC-11        |
| UC-13 | [Batch Process All Pages](#uc-13-batch-process-all-pages)                  | AI processes entire book (700 pages)    | 🔴 Not Started | UC-8, UC-12  |
| UC-14 | [Cost Tracking Display](#uc-14-cost-tracking-display)                      | User sees real-time API costs           | 🔴 Not Started | UC-8         |
| UC-15 | [Export to Markdown](#uc-15-export-to-markdown)                            | User gets Quarto markdown file          | 🔴 Not Started | UC-13        |

---

## UC-1: Environment Setup & Validation

**Status:** 🔴 Not Started

### Value Delivered

All external API integrations (Google Drive, Gemini, GitHub) are configured and verified working BEFORE writing any application code.

### Prerequisites (Manual Setup Required)

#### 1.1 Google Cloud Project Setup

```bash
# Steps:
1. Go to https://console.cloud.google.com/
2. Create new project: "PageSage Development"
3. Enable APIs:
   - Google Drive API
   - Gemini API (generativelanguage.googleapis.com)
4. Note your PROJECT_ID
```

#### 1.2 Google Drive API Credentials

```bash
# Steps:
1. Go to APIs & Services → Credentials
2. Create Credentials → Service Account
   - Name: "pagesage-worker"
   - Role: Editor
3. Create Key → JSON
4. Download JSON file to project root as: google-service-account.json
5. Create a Google Drive folder: "PageSage Projects"
6. Share folder with service account email (found in JSON file)
7. Copy folder ID from URL: https://drive.google.com/drive/folders/{FOLDER_ID}
```

#### 1.3 Gemini API Key

```bash
# Steps:
1. Go to https://aistudio.google.com/app/apikey
2. Create API key
3. Copy key (starts with "AIza...")
```

#### 1.4 GitHub Personal Access Token

```bash
# Steps:
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Scopes needed:
   - repo (all)
   - user:email
4. Copy token
```

#### 1.5 Create .env File

```bash
# Create file: .env.local
# Add these variables:

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
GOOGLE_AI_API_KEY=AIza...your_key_here

# GitHub
GITHUB_TOKEN=ghp_...your_token_here
GITHUB_ORG=pagesage-books

# Session
JWT_SECRET=generate_random_32_character_string_here
```

**Generate JWT_SECRET:**

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Acceptance Criteria

#### Positive Tests (Must Pass)

✅ **AC-1.1:** Google Drive folder exists and service account has write access

- Test: Upload a test file to folder
- Expected: File appears in Drive folder
- Verify: Can list files in folder via API

✅ **AC-1.2:** Gemini API key is valid and has quota

- Test: Call Gemini API with test image
- Expected: Get valid response with bounding boxes
- Verify: No authentication errors

✅ **AC-1.3:** GitHub token has repo creation permissions

- Test: Create test repository via API
- Expected: Repository created successfully
- Verify: Can commit files to repository

✅ **AC-1.4:** Service account JSON file is valid

- Test: Authenticate with service account
- Expected: No credential errors
- Verify: Can access Drive API

✅ **AC-1.5:** All environment variables are loaded correctly

- Test: Read process.env values
- Expected: No undefined variables
- Verify: All required keys present

#### Negative Tests (Must Fail Gracefully)

❌ **AC-1.6:** Invalid Google Drive folder ID

- Test: Use non-existent folder ID
- Expected: Clear error message
- Verify: "Folder not found or no access" error

❌ **AC-1.7:** Invalid Gemini API key

- Test: Use wrong API key format
- Expected: Authentication error caught
- Verify: "Invalid API key" error message

❌ **AC-1.8:** GitHub token with insufficient permissions

- Test: Use token without repo scope
- Expected: Permission denied error
- Verify: "Token lacks required permissions" error

❌ **AC-1.9:** Missing .env file

- Test: Run without .env.local
- Expected: Clear error message
- Verify: "Environment not configured" error

❌ **AC-1.10:** Service account JSON file missing

- Test: Delete service account file
- Expected: Clear error message
- Verify: "Service account file not found" error

### Test Scenarios

```typescript
// tests/uc-1-setup.test.ts

describe("UC-1: Environment Setup & Validation", () => {
  describe("AC-1.1: Google Drive Access", () => {
    test("should upload test file to Drive folder", async () => {
      // Test implementation
    });

    test("should list files in Drive folder", async () => {
      // Test implementation
    });
  });

  describe("AC-1.2: Gemini API Access", () => {
    test("should call Gemini API successfully", async () => {
      // Test implementation
    });

    test("should detect layout on test image", async () => {
      // Test implementation
    });
  });

  describe("AC-1.3: GitHub Repository Access", () => {
    test("should create test repository", async () => {
      // Test implementation
    });

    test("should commit file to repository", async () => {
      // Test implementation
    });

    test("should delete test repository", async () => {
      // Test implementation
    });
  });

  describe("AC-1.6-1.10: Error Handling", () => {
    test("should fail with invalid Drive folder ID", async () => {
      // Test implementation
    });

    test("should fail with invalid Gemini key", async () => {
      // Test implementation
    });

    // ... more negative tests
  });
});
```

### Definition of Done

- [ ] All environment variables documented
- [ ] Service account JSON file configured
- [ ] Google Drive folder created and shared
- [ ] Gemini API key working
- [ ] GitHub token created with correct scopes
- [ ] All positive tests passing (AC-1.1 through AC-1.5)
- [ ] All negative tests passing (AC-1.6 through AC-1.10)
- [ ] Validation script passes: `npm run verify-setup`
- [ ] Documentation updated in README with setup instructions

### Files Created/Modified

- ✅ `.env.local` (git-ignored)
- ✅ `google-service-account.json` (git-ignored)
- ✅ `scripts/verify-setup.ts` (validation script)
- ✅ `tests/uc-1-setup.test.ts` (test file)
- ✅ `README.md` (setup instructions)

---

## UC-2: GitHub Authentication

**Status:** 🔴 Not Started
**Dependencies:** UC-1 (Environment setup)

### Value Delivered

User can log in to PageSage using their GitHub account (OAuth flow), establishing identity for project ownership and attribution.

### Prerequisites (Manual Setup Required)

#### 2.1 GitHub OAuth App Registration

```bash
# Steps:
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: "PageSage (Development)"
   - Homepage URL: http://localhost:5173
   - Authorization callback URL: http://localhost:5173/auth/callback
4. Click "Register application"
5. Copy Client ID
6. Generate new client secret → Copy
```

#### 2.2 Update .env File

```bash
# Add to .env.local:
GITHUB_CLIENT_ID=Ov23...your_client_id
GITHUB_CLIENT_SECRET=your_secret_here
GITHUB_CALLBACK_URL=http://localhost:5173/auth/callback

# Add JWT configuration (if not already present):
JWT_SECRET=your_32_char_secret_from_UC1
JWT_EXPIRY=604800  # 7 days in seconds
```

### Acceptance Criteria

#### Positive Tests (Must Pass)

✅ **AC-2.1:** User can initiate GitHub OAuth flow

- Test: Click "Login with GitHub" button
- Expected: Redirected to github.com/login/oauth/authorize
- Verify: URL contains client_id and redirect_uri

✅ **AC-2.2:** User can authorize application on GitHub

- Test: Accept authorization on GitHub
- Expected: Redirected back to /auth/callback with code
- Verify: Authorization code present in URL

✅ **AC-2.3:** Application exchanges code for access token

- Test: Callback handler receives code
- Expected: POST to GitHub returns access_token
- Verify: Token stored in session

✅ **AC-2.4:** JWT session token is created

- Test: After OAuth success
- Expected: JWT cookie set with user info
- Verify: Cookie contains userId, githubId, role

✅ **AC-2.5:** User profile is fetched from GitHub

- Test: Use access token to get user data
- Expected: GET /user returns profile
- Verify: Username, email, avatar retrieved

✅ **AC-2.6:** Session persists across page refreshes

- Test: Refresh page after login
- Expected: User still logged in
- Verify: JWT cookie still valid

✅ **AC-2.7:** User sees their profile in UI

- Test: After successful login
- Expected: Avatar, name, username displayed
- Verify: Correct GitHub data shown

✅ **AC-2.8:** User can log out

- Test: Click logout button
- Expected: JWT cookie deleted
- Verify: Redirected to login page

#### Negative Tests (Must Fail Gracefully)

❌ **AC-2.9:** User denies GitHub authorization

- Test: Click "Cancel" on GitHub OAuth page
- Expected: Redirected back with error
- Verify: "Authorization denied" message shown

❌ **AC-2.10:** Invalid OAuth code

- Test: Manually visit callback with bad code
- Expected: Error caught and logged
- Verify: "Invalid authorization code" error

❌ **AC-2.11:** GitHub API timeout

- Test: Mock GitHub API timeout
- Expected: Error handled gracefully
- Verify: "GitHub unavailable, try again" message

❌ **AC-2.12:** Expired JWT token

- Test: Use expired JWT cookie
- Expected: User redirected to login
- Verify: Old cookie deleted

❌ **AC-2.13:** Tampered JWT token

- Test: Modify JWT signature
- Expected: Token rejected
- Verify: "Invalid session" error

❌ **AC-2.14:** Missing OAuth client credentials

- Test: Delete GITHUB_CLIENT_ID from env
- Expected: OAuth flow disabled
- Verify: "OAuth not configured" error

### Test Scenarios

```typescript
// tests/uc-2-auth.test.ts

describe("UC-2: GitHub Authentication", () => {
  describe("AC-2.1-2.8: OAuth Flow", () => {
    test("should redirect to GitHub OAuth", async () => {
      const response = await fetch("/auth/login");
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toContain(
        "github.com/login/oauth",
      );
    });

    test("should exchange code for token", async () => {
      const code = "test_code_123";
      const response = await fetch(`/auth/callback?code=${code}`);
      // Mock GitHub token exchange
      expect(response.status).toBe(302);
      expect(response.headers.get("set-cookie")).toContain("session=");
    });

    test("should create valid JWT", async () => {
      // Login flow
      const jwt = await loginUser();
      const decoded = verifyJWT(jwt);
      expect(decoded).toHaveProperty("userId");
      expect(decoded).toHaveProperty("githubId");
    });

    test("should fetch user profile from GitHub", async () => {
      const token = "mock_github_token";
      const profile = await fetchGitHubProfile(token);
      expect(profile).toHaveProperty("login");
      expect(profile).toHaveProperty("email");
    });

    test("should logout and clear session", async () => {
      await loginUser();
      const response = await fetch("/auth/logout");
      expect(response.headers.get("set-cookie")).toContain(
        "session=; Max-Age=0",
      );
    });
  });

  describe("AC-2.9-2.14: Error Handling", () => {
    test("should handle denied authorization", async () => {
      const response = await fetch("/auth/callback?error=access_denied");
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toContain("error=denied");
    });

    test("should reject expired JWT", async () => {
      const expiredJWT = createJWT({ exp: Date.now() / 1000 - 1000 });
      const response = await fetch("/api/projects", {
        headers: { cookie: `session=${expiredJWT}` },
      });
      expect(response.status).toBe(401);
    });

    test("should reject tampered JWT", async () => {
      const validJWT = await loginUser();
      const tamperedJWT = validJWT + "tampered";
      const response = await fetch("/api/projects", {
        headers: { cookie: `session=${tamperedJWT}` },
      });
      expect(response.status).toBe(401);
    });
  });
});
```

### Definition of Done

- [ ] GitHub OAuth app registered
- [ ] Login page with "Login with GitHub" button
- [ ] OAuth flow implemented (/auth/login, /auth/callback)
- [ ] JWT session management implemented
- [ ] User profile fetched and stored
- [ ] Protected routes check JWT validity
- [ ] Logout functionality works
- [ ] All positive tests passing (AC-2.1 through AC-2.8)
- [ ] All negative tests passing (AC-2.9 through AC-2.14)
- [ ] Session cookie is httpOnly and secure
- [ ] User profile displayed in UI after login

### Files Created/Modified

- ✅ `src/routes/auth/login/+server.ts` (initiate OAuth)
- ✅ `src/routes/auth/callback/+server.ts` (handle OAuth callback)
- ✅ `src/routes/auth/logout/+server.ts` (logout handler)
- ✅ `src/lib/server/auth.ts` (JWT utilities)
- ✅ `src/hooks.server.ts` (JWT validation middleware)
- ✅ `src/routes/+page.svelte` (login page)
- ✅ `src/lib/components/UserProfile.svelte` (display user info)
- ✅ `tests/uc-2-auth.test.ts` (test file)

---

## UC-3: Create Project (No PDF)

**Status:** 🔴 Not Started
**Dependencies:** UC-2 (User must be logged in)

### Value Delivered

Authenticated user can create a book project with metadata (title, authors, languages) WITHOUT uploading PDF yet. Project gets a GitHub repository and metadata.json file.

### Prerequisites (Manual Setup Required)

#### 3.1 GitHub Organization (Recommended)

```bash
# Steps (Optional but Recommended):
1. Go to https://github.com/new-organization
2. Create organization: "pagesage-books"
3. Free tier is sufficient
4. Add your GitHub user as owner
5. Update .env.local:
   GITHUB_ORG=pagesage-books
```

**Note:** If you skip this, projects will be created in your personal account.

### Acceptance Criteria

#### Positive Tests (Must Pass)

✅ **AC-3.1:** User can access create project form

- Test: Navigate to /projects/new while logged in
- Expected: Form displayed with all fields
- Verify: Title, authors, languages fields present

✅ **AC-3.2:** User can fill out project metadata

- Test: Fill form with valid data
- Expected: All fields accept input
- Verify: No validation errors

✅ **AC-3.3:** Project ID is generated uniquely

- Test: Submit form
- Expected: ID generated as "proj\_{random}"
- Verify: ID is unique (collision check)

✅ **AC-3.4:** GitHub repository is created

- Test: Submit form
- Expected: Repo created: "book-{id}-{slug}"
- Verify: Repo exists on GitHub

✅ **AC-3.5:** metadata.json is committed to repository

- Test: After repo creation
- Expected: File committed to main branch
- Verify: Contains all project metadata

✅ **AC-3.6:** Repository URL is stored in metadata

- Test: Check metadata.json
- Expected: Contains repositoryUrl field
- Verify: URL is valid GitHub repo URL

✅ **AC-3.7:** User is attributed as project creator

- Test: Check metadata.json createdBy field
- Expected: Contains user's GitHub info
- Verify: Correct name, username, githubId

✅ **AC-3.8:** Project appears in user's project list

- Test: Navigate to /projects
- Expected: New project listed
- Verify: Shows correct title and status

✅ **AC-3.9:** User can view project details

- Test: Click on project in list
- Expected: Redirected to /projects/{id}
- Verify: All metadata displayed

#### Negative Tests (Must Fail Gracefully)

❌ **AC-3.10:** Anonymous user cannot create project

- Test: Access /projects/new while logged out
- Expected: Redirected to login page
- Verify: "Authentication required" message

❌ **AC-3.11:** Empty title is rejected

- Test: Submit form with empty title
- Expected: Form validation error
- Verify: "Title is required" message

❌ **AC-3.12:** Invalid languages selection

- Test: Submit form with no languages selected
- Expected: Validation error
- Verify: "At least one language required" message

❌ **AC-3.13:** GitHub API failure is handled

- Test: Mock GitHub API failure
- Expected: Error caught and displayed
- Verify: "Failed to create repository" message

❌ **AC-3.14:** Duplicate project ID is regenerated

- Test: Force ID collision
- Expected: New ID generated automatically
- Verify: No duplicate IDs in system

❌ **AC-3.15:** Long title is truncated for slug

- Test: Submit 200-character title
- Expected: Slug limited to 50 chars
- Verify: Repository name stays within limits

### Test Scenarios

```typescript
// tests/uc-3-create-project.test.ts

describe("UC-3: Create Project (No PDF)", () => {
  beforeEach(async () => {
    // Login before each test
    await loginUser();
  });

  describe("AC-3.1-3.9: Project Creation Flow", () => {
    test("should display create project form", async () => {
      const response = await fetch("/projects/new");
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("Create New Project");
      expect(html).toContain('name="title"');
    });

    test("should generate unique project ID", () => {
      const id1 = generateProjectId();
      const id2 = generateProjectId();
      expect(id1).toMatch(/^proj_[a-z0-9]{12}$/);
      expect(id1).not.toBe(id2);
    });

    test("should create GitHub repository", async () => {
      const projectData = {
        title: "Test Book",
        authors: ["Author 1"],
        languages: ["sanskrit", "english"],
      };

      const repo = await createProjectRepository(projectData);
      expect(repo).toHaveProperty("url");
      expect(repo.name).toMatch(/^book-proj_/);

      // Cleanup
      await deleteRepository(repo.name);
    });

    test("should commit metadata.json to repository", async () => {
      const projectId = "proj_test123";
      const projectData = {
        projectId,
        title: "Test Book",
        authors: ["Author 1"],
        languages: ["sanskrit"],
      };

      await createProjectRepository(projectData);
      const content = await getFileFromGitHub(projectId, "metadata.json");

      expect(content).toBeDefined();
      const metadata = JSON.parse(content);
      expect(metadata.projectId).toBe(projectId);
      expect(metadata.title).toBe("Test Book");
    });

    test("should include user attribution", async () => {
      const project = await createProject({
        title: "Test Book",
        authors: ["Author 1"],
        languages: ["sanskrit"],
      });

      expect(project.createdBy).toHaveProperty("githubUsername");
      expect(project.createdBy.githubUsername).toBe("testuser");
    });
  });

  describe("AC-3.10-3.15: Error Handling", () => {
    test("should reject unauthenticated user", async () => {
      await logoutUser();
      const response = await fetch("/projects/new");
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toContain("/auth/login");
    });

    test("should reject empty title", async () => {
      const result = await createProject({
        title: "",
        authors: [],
        languages: [],
      });
      expect(result.error).toBe("Title is required");
    });

    test("should require at least one language", async () => {
      const result = await createProject({
        title: "Test",
        authors: ["Author"],
        languages: [],
      });
      expect(result.error).toContain("language");
    });

    test("should handle GitHub API failure gracefully", async () => {
      mockGitHubApiFailure();
      const result = await createProject({
        title: "Test",
        authors: ["Author"],
        languages: ["sanskrit"],
      });
      expect(result.error).toContain("Failed to create repository");
    });

    test("should truncate long slug", () => {
      const longTitle = "A".repeat(200);
      const slug = generateSlug(longTitle);
      expect(slug.length).toBeLessThanOrEqual(50);
    });
  });
});
```

### Definition of Done

- [ ] Create project form page built (/projects/new)
- [ ] Form validation implemented (client + server side)
- [ ] Project ID generation function implemented
- [ ] GitHub repository creation API integrated
- [ ] metadata.json schema implemented
- [ ] Project list page shows all user's projects
- [ ] Project detail page displays metadata
- [ ] All positive tests passing (AC-3.1 through AC-3.9)
- [ ] All negative tests passing (AC-3.10 through AC-3.15)
- [ ] Authentication guard on all project routes
- [ ] Created project appears immediately in UI

### Files Created/Modified

- ✅ `src/routes/projects/new/+page.svelte` (create form)
- ✅ `src/routes/projects/new/+page.server.ts` (form handler)
- ✅ `src/routes/projects/+page.svelte` (project list)
- ✅ `src/routes/projects/+page.server.ts` (load projects)
- ✅ `src/routes/projects/[id]/+page.svelte` (project detail)
- ✅ `src/routes/projects/[id]/+page.server.ts` (load project)
- ✅ `src/lib/server/github.ts` (GitHub API utilities)
- ✅ `src/lib/server/projects.ts` (project logic)
- ✅ `src/lib/schemas/project-metadata.ts` (TypeScript types)
- ✅ `tests/uc-3-create-project.test.ts` (test file)

---

## UC-4: Upload PDF to Google Drive

**Status:** 🔴 Not Started
**Dependencies:** UC-1 (Drive setup), UC-3 (Project exists)

### Value Delivered

User can upload a PDF file to an existing project. PDF is stored in Google Drive with checksum validation. Project status updates to "uploading" → "uploaded".

### Prerequisites (Manual Setup Required)

**None** - All setup completed in UC-1 (Google Drive folder)

### Acceptance Criteria

#### Positive Tests (Must Pass)

✅ **AC-4.1:** User can select PDF file from filesystem

- Test: Click "Upload PDF" button on project page
- Expected: File picker dialog opens
- Verify: Only PDF files selectable (.pdf extension)

✅ **AC-4.2:** File size validation (500MB max)

- Test: Select PDF under 500MB
- Expected: File accepted
- Verify: No size validation error

✅ **AC-4.3:** Upload progress is displayed

- Test: Upload 50MB PDF
- Expected: Progress bar shows 0-100%
- Verify: Percentage updates during upload

✅ **AC-4.4:** PDF is uploaded to Google Drive

- Test: Complete upload
- Expected: File appears in Drive folder
- Verify: Drive fileId returned

✅ **AC-4.5:** SHA-256 checksum is calculated

- Test: After upload completes
- Expected: Checksum computed on server
- Verify: SHA-256 hash stored in metadata

✅ **AC-4.6:** Project metadata is updated with PDF info

- Test: Check metadata.json after upload
- Expected: sourceDocument field populated
- Verify: Contains driveFileId, fileName, sha256

✅ **AC-4.7:** Project status changes to "uploaded"

- Test: After successful upload
- Expected: Status field updated
- Verify: metadata.json shows status="uploaded"

✅ **AC-4.8:** File integrity is verified

- Test: Download file from Drive and rehash
- Expected: Checksums match
- Verify: No corruption during upload

✅ **AC-4.9:** Metadata commit is attributed to user

- Test: Check git commit after upload
- Expected: Commit author is current user
- Verify: Correct GitHub attribution

#### Negative Tests (Must Fail Gracefully)

❌ **AC-4.10:** File too large (>500MB) is rejected

- Test: Select 600MB PDF
- Expected: Upload blocked before sending
- Verify: "File exceeds 500MB limit" error

❌ **AC-4.11:** Non-PDF file is rejected

- Test: Try to upload .docx file
- Expected: File picker blocks or validation fails
- Verify: "Only PDF files allowed" error

❌ **AC-4.12:** Corrupted PDF is detected

- Test: Upload invalid/corrupted PDF
- Expected: Validation fails
- Verify: "Invalid PDF file" error

❌ **AC-4.13:** Network failure during upload

- Test: Disconnect network mid-upload
- Expected: Upload paused/failed gracefully
- Verify: "Upload failed, please retry" message

❌ **AC-4.14:** Google Drive quota exceeded

- Test: Mock Drive quota error
- Expected: Error caught and displayed
- Verify: "Storage quota exceeded" message

❌ **AC-4.15:** Duplicate upload to same project

- Test: Upload PDF to project that already has PDF
- Expected: Warning shown
- Verify: "Project already has PDF. Replace?" confirmation

❌ **AC-4.16:** Unauthenticated user tries to upload

- Test: Logout and try to access upload
- Expected: Redirected to login
- Verify: Upload route protected

### Test Scenarios

```typescript
// tests/uc-4-upload-pdf.test.ts

describe("UC-4: Upload PDF to Google Drive", () => {
  let projectId: string;

  beforeEach(async () => {
    await loginUser();
    const project = await createProject({
      title: "Test Book",
      authors: ["Author 1"],
      languages: ["sanskrit"],
    });
    projectId = project.projectId;
  });

  describe("AC-4.1-4.9: PDF Upload Flow", () => {
    test("should accept valid PDF file", async () => {
      const pdf = readFileSync("test-samples/sample.pdf");
      const formData = new FormData();
      formData.append("pdf", new Blob([pdf]), "sample.pdf");

      const response = await fetch(`/api/projects/${projectId}/upload`, {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty("driveFileId");
    });

    test("should calculate SHA-256 checksum", async () => {
      const pdf = readFileSync("test-samples/sample.pdf");
      const expectedHash = crypto
        .createHash("sha256")
        .update(pdf)
        .digest("hex");

      const result = await uploadPdf(projectId, pdf);
      expect(result.sha256).toBe(expectedHash);
    });

    test("should update project metadata", async () => {
      const pdf = readFileSync("test-samples/sample.pdf");
      await uploadPdf(projectId, pdf);

      const metadata = await getProjectMetadata(projectId);
      expect(metadata.sourceDocument).toBeDefined();
      expect(metadata.sourceDocument.driveFileId).toBeDefined();
      expect(metadata.status).toBe("uploaded");
    });

    test("should track upload progress", async () => {
      const pdf = readFileSync("test-samples/large-sample.pdf"); // 50MB
      const progressUpdates: number[] = [];

      await uploadPdf(projectId, pdf, (progress) => {
        progressUpdates.push(progress);
      });

      expect(progressUpdates.length).toBeGreaterThan(1);
      expect(progressUpdates[0]).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    test("should verify file integrity", async () => {
      const pdf = readFileSync("test-samples/sample.pdf");
      const uploadResult = await uploadPdf(projectId, pdf);

      // Download from Drive and verify
      const downloaded = await downloadFromDrive(uploadResult.driveFileId);
      const downloadedHash = crypto
        .createHash("sha256")
        .update(downloaded)
        .digest("hex");

      expect(downloadedHash).toBe(uploadResult.sha256);
    });
  });

  describe("AC-4.10-4.16: Error Handling", () => {
    test("should reject file larger than 500MB", async () => {
      const largeFile = Buffer.alloc(501 * 1024 * 1024); // 501MB
      const result = await uploadPdf(projectId, largeFile);
      expect(result.error).toContain("exceeds 500MB");
    });

    test("should reject non-PDF file", async () => {
      const docx = readFileSync("test-samples/sample.docx");
      const result = await uploadPdf(projectId, docx);
      expect(result.error).toContain("Only PDF files allowed");
    });

    test("should detect corrupted PDF", async () => {
      const corrupted = Buffer.from("Not a valid PDF");
      const result = await uploadPdf(projectId, corrupted);
      expect(result.error).toContain("Invalid PDF");
    });

    test("should handle Drive quota exceeded", async () => {
      mockDriveQuotaError();
      const pdf = readFileSync("test-samples/sample.pdf");
      const result = await uploadPdf(projectId, pdf);
      expect(result.error).toContain("Storage quota exceeded");
    });

    test("should warn on duplicate upload", async () => {
      const pdf = readFileSync("test-samples/sample.pdf");

      // First upload
      await uploadPdf(projectId, pdf);

      // Second upload attempt
      const result = await uploadPdf(projectId, pdf);
      expect(result.warning).toContain("already has PDF");
    });

    test("should reject unauthenticated upload", async () => {
      await logoutUser();
      const pdf = readFileSync("test-samples/sample.pdf");
      const response = await fetch(`/api/projects/${projectId}/upload`, {
        method: "POST",
        body: pdf,
      });
      expect(response.status).toBe(401);
    });
  });

  afterEach(async () => {
    // Cleanup: delete test project and files
    await deleteProject(projectId);
  });
});
```

### Definition of Done

- [ ] Upload button added to project detail page
- [ ] File picker accepts only PDF files
- [ ] Client-side file size validation (500MB max)
- [ ] Upload progress tracking implemented
- [ ] Server-side PDF validation (format check)
- [ ] Google Drive upload API integrated
- [ ] SHA-256 checksum calculation implemented
- [ ] Project metadata updated after upload
- [ ] GitHub commit created for metadata update
- [ ] All positive tests passing (AC-4.1 through AC-4.9)
- [ ] All negative tests passing (AC-4.10 through AC-4.16)
- [ ] Error messages are user-friendly
- [ ] Upload can be retried on failure

### Files Created/Modified

- ✅ `src/routes/projects/[id]/+page.svelte` (add upload button)
- ✅ `src/routes/api/projects/[id]/upload/+server.ts` (upload handler)
- ✅ `src/lib/server/drive.ts` (Google Drive utilities)
- ✅ `src/lib/server/pdf-validator.ts` (PDF validation)
- ✅ `src/lib/utils/checksum.ts` (SHA-256 calculation)
- ✅ `src/lib/components/UploadProgress.svelte` (progress UI)
- ✅ `tests/uc-4-upload-pdf.test.ts` (test file)

---

## UC-5: View Project Dashboard

**Status:** 🔴 Not Started
**Dependencies:** UC-3 (Project exists), UC-4 (PDF uploaded)

### Value Delivered

User sees comprehensive project dashboard showing: metadata, PDF info, processing status, cost tracking, page statistics, and action buttons for next steps.

### Prerequisites (Manual Setup Required)

**None** - Uses existing project data

### Acceptance Criteria

#### Positive Tests (Must Pass)

✅ **AC-5.1:** Dashboard displays project metadata

- Test: Navigate to /projects/{id}
- Expected: Title, authors, languages shown
- Verify: Matches metadata.json

✅ **AC-5.2:** Dashboard shows PDF information

- Test: View project with uploaded PDF
- Expected: Filename, size, upload date shown
- Verify: Drive link works

✅ **AC-5.3:** Processing status is clearly indicated

- Test: Check status section
- Expected: Current status displayed (uploaded, processing, etc.)
- Verify: Status badge with appropriate color

✅ **AC-5.4:** Page statistics are displayed

- Test: View project metrics
- Expected: Total pages, processed, annotated counts
- Verify: Numbers match metadata

✅ **AC-5.5:** Cost tracking is visible

- Test: Check costs section
- Expected: Total spent, budget, percentage shown
- Verify: Breakdown by operation type

✅ **AC-5.6:** Action buttons reflect current state

- Test: Check available actions
- Expected: Appropriate next steps shown
- Verify: "Upload PDF" if no PDF, "Start Processing" if uploaded

✅ **AC-5.7:** Repository link is accessible

- Test: Click GitHub repository link
- Expected: Opens repo in new tab
- Verify: Correct repository URL

✅ **AC-5.8:** User attribution is shown

- Test: Check "Created by" section
- Expected: Creator's name and avatar
- Verify: Correct GitHub user info

✅ **AC-5.9:** Dashboard auto-refreshes during processing

- Test: Start processing job
- Expected: Dashboard updates without refresh
- Verify: Progress updates via SSE

#### Negative Tests (Must Fail Gracefully)

❌ **AC-5.10:** Non-existent project shows 404

- Test: Visit /projects/invalid-id
- Expected: 404 page displayed
- Verify: "Project not found" message

❌ **AC-5.11:** Unauthorized access is blocked

- Test: Access someone else's project
- Expected: 403 Forbidden
- Verify: "Access denied" message

❌ **AC-5.12:** Missing metadata fields handled gracefully

- Test: Project with incomplete metadata
- Expected: Missing fields show "N/A"
- Verify: No errors, defaults shown

❌ **AC-5.13:** Corrupted metadata.json is detected

- Test: Corrupt metadata file in GitHub
- Expected: Error page with recovery options
- Verify: "Metadata corrupted" error

❌ **AC-5.14:** GitHub API failure is handled

- Test: Mock GitHub unavailable
- Expected: Cached data shown if available
- Verify: "Using cached data" message

### Test Scenarios

```typescript
// tests/uc-5-dashboard.test.ts

describe("UC-5: View Project Dashboard", () => {
  let projectId: string;

  beforeEach(async () => {
    await loginUser();
    const project = await createProject({
      title: "Bhagavad Gita",
      authors: ["Vyasa"],
      languages: ["sanskrit", "english"],
    });
    projectId = project.projectId;

    const pdf = readFileSync("test-samples/sample.pdf");
    await uploadPdf(projectId, pdf);
  });

  describe("AC-5.1-5.9: Dashboard Display", () => {
    test("should display project metadata", async () => {
      const response = await fetch(`/projects/${projectId}`);
      const html = await response.text();

      expect(html).toContain("Bhagavad Gita");
      expect(html).toContain("Vyasa");
      expect(html).toContain("sanskrit");
    });

    test("should show PDF information", async () => {
      const page = await loadProjectPage(projectId);
      expect(page.pdfInfo).toHaveProperty("fileName");
      expect(page.pdfInfo).toHaveProperty("fileSizeBytes");
      expect(page.pdfInfo).toHaveProperty("uploadedAt");
    });

    test("should display processing status", async () => {
      const metadata = await getProjectMetadata(projectId);
      expect(metadata.status).toBe("uploaded");

      const page = await loadProjectPage(projectId);
      expect(page.statusBadge).toContain("Uploaded");
    });

    test("should show page statistics", async () => {
      // Update metadata with page counts
      await updateProjectMetadata(projectId, {
        pages: { total: 700, processed: 0, annotated: 0 },
      });

      const page = await loadProjectPage(projectId);
      expect(page.stats.totalPages).toBe(700);
      expect(page.stats.processed).toBe(0);
    });

    test("should display cost tracking", async () => {
      await logCost(projectId, {
        operation: "layout-detection",
        totalCost: 1.5,
      });

      const page = await loadProjectPage(projectId);
      expect(page.costs.totalSpent).toBe(1.5);
    });

    test("should show appropriate action buttons", async () => {
      const page = await loadProjectPage(projectId);

      // After upload, should show "Start Processing"
      expect(page.actions).toContain("Start Processing");
      expect(page.actions).not.toContain("Upload PDF");
    });

    test("should link to GitHub repository", async () => {
      const metadata = await getProjectMetadata(projectId);
      expect(metadata.repositoryUrl).toMatch(/github\.com/);

      const page = await loadProjectPage(projectId);
      expect(page.repoLink).toBe(metadata.repositoryUrl);
    });

    test("should show creator attribution", async () => {
      const metadata = await getProjectMetadata(projectId);
      expect(metadata.createdBy.githubUsername).toBe("testuser");

      const page = await loadProjectPage(projectId);
      expect(page.creator).toContain("testuser");
    });
  });

  describe("AC-5.10-5.14: Error Handling", () => {
    test("should return 404 for non-existent project", async () => {
      const response = await fetch("/projects/invalid-id-9999");
      expect(response.status).toBe(404);
      const html = await response.text();
      expect(html).toContain("Project not found");
    });

    test("should block unauthorized access", async () => {
      // Create project as user1
      const user1ProjectId = projectId;

      // Login as different user
      await logoutUser();
      await loginAs("user2");

      const response = await fetch(`/projects/${user1ProjectId}`);
      expect(response.status).toBe(403);
    });

    test("should handle missing metadata fields", async () => {
      // Create project with minimal metadata
      const minimalProject = await createProject({
        title: "Test",
        authors: [],
        languages: ["english"],
      });

      const page = await loadProjectPage(minimalProject.projectId);
      expect(page.authors).toBe("N/A");
    });

    test("should detect corrupted metadata", async () => {
      // Corrupt metadata in GitHub
      await corruptMetadataFile(projectId);

      const response = await fetch(`/projects/${projectId}`);
      expect(response.status).toBe(500);
      const html = await response.text();
      expect(html).toContain("Metadata corrupted");
    });
  });

  afterEach(async () => {
    await deleteProject(projectId);
  });
});
```

### Definition of Done

- [ ] Dashboard page displays all project metadata
- [ ] PDF information section implemented
- [ ] Status badges with color coding
- [ ] Page statistics panel
- [ ] Cost tracking display
- [ ] Action buttons context-aware (change based on status)
- [ ] GitHub repository link functional
- [ ] User attribution displayed
- [ ] SSE for real-time updates (when processing)
- [ ] All positive tests passing (AC-5.1 through AC-5.9)
- [ ] All negative tests passing (AC-5.10 through AC-5.14)
- [ ] Responsive design (works on different screen sizes)
- [ ] Loading states for async data

### Files Created/Modified

- ✅ `src/routes/projects/[id]/+page.svelte` (dashboard UI - enhanced)
- ✅ `src/routes/projects/[id]/+page.server.ts` (load data - enhanced)
- ✅ `src/lib/components/ProjectDashboard.svelte` (dashboard component)
- ✅ `src/lib/components/StatusBadge.svelte` (status indicator)
- ✅ `src/lib/components/PageStats.svelte` (statistics panel)
- ✅ `src/lib/components/CostTracker.svelte` (cost display)
- ✅ `src/lib/utils/formatting.ts` (format dates, sizes, etc.)
- ✅ `tests/uc-5-dashboard.test.ts` (test file)

---

## UC-6: Split PDF into Pages

**Status:** 🔴 Not Started
**Dependencies:** UC-4 (PDF uploaded)

### Value Delivered

User can trigger PDF splitting job. PDF is downloaded from Drive, split into individual page images (PNG files), and uploaded back to Drive. Progress is tracked in real-time.

### Prerequisites (Manual Setup Required)

#### 6.1 Install Poppler Utils (PDF Processing)

```bash
# macOS:
brew install poppler

# Ubuntu/Linux:
sudo apt-get install poppler-utils

# Verify installation:
pdftoppm -v
# Expected output: pdftoppm version X.XX.X
```

#### 6.2 Install Sharp (Image Processing)

```bash
npm install sharp
# Already included in package.json, but verify:
npm list sharp
```

### Acceptance Criteria

#### Positive Tests (Must Pass)

✅ **AC-6.1:** User can start PDF splitting job

- Test: Click "Start Processing" button
- Expected: Job created and queued
- Verify: Job ID returned

✅ **AC-6.2:** PDF is downloaded from Google Drive

- Test: Job starts execution
- Expected: PDF downloaded to worker temp directory
- Verify: File exists locally before splitting

✅ **AC-6.3:** PDF is split into individual page images

- Test: Run pdftoppm command
- Expected: One PNG file per page created
- Verify: Page count matches PDF page count

✅ **AC-6.4:** Images are 300 DPI resolution

- Test: Check image metadata
- Expected: DPI = 300
- Verify: Sharp.metadata() shows correct DPI

✅ **AC-6.5:** Page images are uploaded to Google Drive

- Test: After splitting completes
- Expected: All pages in Drive folder
- Verify: Drive folder contains page-001.png, page-002.png, etc.

✅ **AC-6.6:** Image metadata is stored for each page

- Test: Check page-NNN.json files
- Expected: driveFileId, width, height, sha256 stored
- Verify: Metadata matches actual image

✅ **AC-6.7:** Project metadata is updated with page count

- Test: After splitting completes
- Expected: metadata.json updated
- Verify: pages.total = actual page count

✅ **AC-6.8:** Progress updates are sent via SSE

- Test: Connect to progress stream
- Expected: Events every page processed
- Verify: "Processing page N/700" messages

✅ **AC-6.9:** Job status changes to "preprocessing-complete"

- Test: After all pages processed
- Expected: Status updated in metadata
- Verify: metadata.json shows correct status

#### Negative Tests (Must Fail Gracefully)

❌ **AC-6.10:** Corrupted PDF is detected early

- Test: Start job with corrupted PDF
- Expected: Job fails with clear error
- Verify: "Invalid PDF file" error

❌ **AC-6.11:** PDF with 0 pages is rejected

- Test: Upload empty PDF
- Expected: Validation fails
- Verify: "PDF has no pages" error

❌ **AC-6.12:** PDF with >2000 pages is rejected

- Test: Upload 3000-page PDF
- Expected: Job rejected
- Verify: "Too many pages (max 2000)" error

❌ **AC-6.13:** Insufficient disk space is handled

- Test: Mock disk full error
- Expected: Job fails gracefully
- Verify: "Insufficient disk space" error

❌ **AC-6.14:** Google Drive upload failure is retried

- Test: Mock Drive upload failure
- Expected: 3 retry attempts made
- Verify: Eventually fails with retry count

❌ **AC-6.15:** Partial failure cleans up temp files

- Test: Force failure mid-processing
- Expected: Temp files deleted
- Verify: /tmp directory cleaned up

❌ **AC-6.16:** Concurrent jobs don't conflict

- Test: Start 2 jobs simultaneously
- Expected: Each uses separate temp directory
- Verify: No file conflicts

### Test Scenarios

```typescript
// tests/uc-6-split-pdf.test.ts

describe("UC-6: Split PDF into Pages", () => {
  let projectId: string;

  beforeEach(async () => {
    await loginUser();
    const project = await createProject({
      title: "Test Book",
      authors: ["Author"],
      languages: ["english"],
    });
    projectId = project.projectId;

    const pdf = readFileSync("test-samples/sample-10-pages.pdf");
    await uploadPdf(projectId, pdf);
  });

  describe("AC-6.1-6.9: PDF Splitting Flow", () => {
    test("should create job when user starts processing", async () => {
      const response = await fetch(`/api/projects/${projectId}/process`, {
        method: "POST",
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty("jobId");
      expect(result.jobId).toMatch(/^job_/);
    });

    test("should download PDF from Google Drive", async () => {
      const metadata = await getProjectMetadata(projectId);
      const driveFileId = metadata.sourceDocument.driveFileId;

      const pdfPath = await downloadFromDrive(driveFileId, "/tmp/test.pdf");
      expect(fs.existsSync(pdfPath)).toBe(true);

      const stats = fs.statSync(pdfPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    test("should split PDF into page images", async () => {
      const pdfPath = "test-samples/sample-10-pages.pdf";
      const outputDir = "/tmp/test-split";

      const pageImages = await splitPdfToImages({
        pdfPath,
        outputDir,
        dpi: 300,
        format: "png",
      });

      expect(pageImages).toHaveLength(10);
      expect(pageImages[0]).toMatch(/page-001\.png$/);
      expect(fs.existsSync(pageImages[0])).toBe(true);

      // Cleanup
      fs.rmSync(outputDir, { recursive: true });
    });

    test("should create 300 DPI images", async () => {
      const pdfPath = "test-samples/sample-10-pages.pdf";
      const outputDir = "/tmp/test-split";
      await splitPdfToImages({ pdfPath, outputDir, dpi: 300, format: "png" });

      const image = sharp(path.join(outputDir, "page-001.png"));
      const metadata = await image.metadata();

      expect(metadata.density).toBe(300);

      fs.rmSync(outputDir, { recursive: true });
    });

    test("should upload page images to Google Drive", async () => {
      const imagePath = "test-samples/kalika-page-8-08.png";
      const result = await uploadPageImage(imagePath, projectId, 1);

      expect(result).toHaveProperty("driveFileId");
      expect(result.fileName).toBe("page-001.png");

      // Verify file exists in Drive
      const fileExists = await checkDriveFileExists(result.driveFileId);
      expect(fileExists).toBe(true);
    });

    test("should update project metadata with page count", async () => {
      const jobId = await startProcessingJob(projectId);
      await waitForJobCompletion(jobId);

      const metadata = await getProjectMetadata(projectId);
      expect(metadata.pages.total).toBe(10);
      expect(metadata.status).toBe("preprocessing-complete");
    });

    test("should send progress updates via SSE", async (done) => {
      const jobId = await startProcessingJob(projectId);
      const updates: any[] = [];

      const eventSource = new EventSource(`/api/jobs/${jobId}/stream`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updates.push(data);

        if (data.step === "complete") {
          eventSource.close();
          expect(updates.length).toBeGreaterThan(1);
          expect(updates[0].step).toBe("splitting");
          done();
        }
      };
    });

    test("should store image metadata for each page", async () => {
      await processProject(projectId);

      const page1 = await getPageMetadata(projectId, 1);
      expect(page1.image).toHaveProperty("driveFileId");
      expect(page1.image).toHaveProperty("width");
      expect(page1.image).toHaveProperty("height");
      expect(page1.image).toHaveProperty("sha256");
      expect(page1.image.dpi).toBe(300);
    });
  });

  describe("AC-6.10-6.16: Error Handling", () => {
    test("should detect corrupted PDF", async () => {
      const corruptedPdf = Buffer.from("Not a PDF");
      await uploadPdf(projectId, corruptedPdf);

      const result = await startProcessingJob(projectId);
      await waitForJobCompletion(result.jobId);

      const job = await getJobStatus(result.jobId);
      expect(job.status).toBe("failed");
      expect(job.error).toContain("Invalid PDF");
    });

    test("should reject PDF with 0 pages", async () => {
      const emptyPdf = createEmptyPdf();
      await uploadPdf(projectId, emptyPdf);

      const result = await startProcessingJob(projectId);
      expect(result.error).toContain("no pages");
    });

    test("should reject PDF with too many pages", async () => {
      // Mock PDF with 3000 pages
      mockPdfPageCount(projectId, 3000);

      const result = await startProcessingJob(projectId);
      expect(result.error).toContain("Too many pages");
    });

    test("should retry Drive upload on failure", async () => {
      let attempts = 0;
      mockDriveUploadFailure(() => {
        attempts++;
        return attempts < 3; // Fail twice, succeed on 3rd
      });

      const imagePath = "test-samples/kalika-page-8-08.png";
      const result = await uploadPageImageWithRetry(imagePath, projectId, 1);

      expect(result).toHaveProperty("driveFileId");
      expect(attempts).toBe(3);
    });

    test("should clean up temp files on failure", async () => {
      const tempDir = "/tmp/pagesage-test-cleanup";
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        await splitPdfToImages({
          pdfPath: "nonexistent.pdf",
          outputDir: tempDir,
          dpi: 300,
          format: "png",
        });
      } catch (error) {
        // Expected to fail
      }

      expect(fs.existsSync(tempDir)).toBe(false);
    });

    test("should handle concurrent jobs without conflicts", async () => {
      const project2Id = (
        await createProject({
          title: "Second Book",
          authors: ["Author 2"],
          languages: ["sanskrit"],
        })
      ).projectId;

      await uploadPdf(
        project2Id,
        readFileSync("test-samples/sample-10-pages.pdf"),
      );

      // Start both jobs
      const job1 = await startProcessingJob(projectId);
      const job2 = await startProcessingJob(project2Id);

      await Promise.all([
        waitForJobCompletion(job1.jobId),
        waitForJobCompletion(job2.jobId),
      ]);

      const metadata1 = await getProjectMetadata(projectId);
      const metadata2 = await getProjectMetadata(project2Id);

      expect(metadata1.pages.total).toBe(10);
      expect(metadata2.pages.total).toBe(10);
    });
  });

  afterEach(async () => {
    await deleteProject(projectId);
  });
});
```

### Definition of Done

- [ ] "Start Processing" button triggers job creation
- [ ] GitHub Actions workflow configured for PDF processing
- [ ] Poppler `pdftoppm` integration working
- [ ] Sharp image metadata extraction working
- [ ] Cloudflare R2 batch upload implemented
- [ ] Page metadata JSON files created
- [ ] Project metadata updated with page count
- [ ] SSE progress stream implemented
- [ ] All positive tests passing (AC-6.1 through AC-6.9)
- [ ] All negative tests passing (AC-6.10 through AC-6.16)
- [ ] Temp file cleanup robust
- [ ] Error handling and retries working

### Files Created/Modified

- ✅ `src/routes/api/projects/[id]/process/+server.ts` (start job)
- ✅ `src/routes/api/jobs/[id]/stream/+server.ts` (SSE endpoint)
- ✅ `src/lib/server/job-queue.ts` (job queue implementation)
- ✅ `worker/process-pdf.ts` (background worker)
- ✅ `worker/split-pdf.ts` (pdftoppm wrapper)
- ✅ `worker/upload-pages.ts` (batch Drive upload)
- ✅ `src/lib/schemas/page-metadata.ts` (page schema)
- ✅ `tests/uc-6-split-pdf.test.ts` (test file)

---

## UC-7: Quality Check Sample Pages

**Status:** 🔴 Not Started
**Dependencies:** UC-6 (Pages extracted)

### Value Delivered

User sees quality analysis of 5 sample pages (from middle of book) showing: skew, contrast, brightness, noise levels. System recommends whether preprocessing is needed. User decides to enable/skip preprocessing before AI layout detection.

### Prerequisites (Manual Setup Required)

#### 7.1 Install ImageMagick (for Quality Analysis)

```bash
# macOS:
brew install imagemagick

# Ubuntu/Linux:
sudo apt-get install imagemagick

# Verify installation:
convert -version
# Expected: ImageMagick 7.x.x
```

**Note:** ImageMagick optional - can use Sharp-only analysis if preferred.

### Acceptance Criteria

#### Positive Tests (Must Pass)

✅ **AC-7.1:** 5 sample pages are selected from middle of book

- Test: Trigger quality check
- Expected: Pages at 25%, 40%, 50%, 60%, 75% selected
- Verify: NOT first/last 5 pages (which may be different quality)

✅ **AC-7.2:** Skew angle is detected for each sample

- Test: Analyze tilted scan
- Expected: Angle in degrees reported (-45 to +45)
- Verify: Accuracy within ±2 degrees

✅ **AC-7.3:** Contrast level is measured

- Test: Analyze low/high contrast images
- Expected: Score 0-1 (higher = better)
- Verify: Low contrast image scores <0.3

✅ **AC-7.4:** Brightness is measured

- Test: Analyze dark/bright images
- Expected: Score 0-1 (0.4-0.8 = ideal)
- Verify: Dark image scores <0.3

✅ **AC-7.5:** Noise level is measured

- Test: Analyze noisy scans
- Expected: Score 0-1 (lower = better)
- Verify: Clean image scores <0.2

✅ **AC-7.6:** Overall quality rating is computed

- Test: Aggregate individual metrics
- Expected: Rating: excellent/good/fair/poor
- Verify: Correct rating based on thresholds

✅ **AC-7.7:** Preprocessing recommendation is made

- Test: Check recommendation logic
- Expected: Skip (0-1 poor), Optional (2 poor), Recommended (3+ poor)
- Verify: Correct recommendation based on sample results

✅ **AC-7.8:** User sees visual quality report

- Test: View quality check results page
- Expected: Table showing all 5 samples with metrics
- Verify: Easy to understand, color-coded

✅ **AC-7.9:** User can enable/skip preprocessing

- Test: Click "Enable Preprocessing" or "Skip"
- Expected: Choice saved, job continues
- Verify: metadata.json updated with decision

✅ **AC-7.10:** Sample page images are annotated

- Test: Download sample analysis
- Expected: Visual overlay showing detected issues
- Verify: Skew lines, contrast areas highlighted

#### Negative Tests (Must Fail Gracefully)

❌ **AC-7.11:** Book with <5 pages handled

- Test: Analyze 3-page PDF
- Expected: All 3 pages analyzed
- Verify: No error, uses available pages

❌ **AC-7.12:** Unreadable image is detected

- Test: Completely black/white image
- Expected: Marked as "unreadable"
- Verify: Warning shown to user

❌ **AC-7.13:** Quality analysis timeout

- Test: Mock slow analysis (>30 seconds)
- Expected: Timeout after 30s
- Verify: "Analysis timeout" message

❌ **AC-7.14:** ImageMagick not installed

- Test: Run without ImageMagick
- Expected: Falls back to Sharp-only analysis
- Verify: Warning logged, analysis completes

### Test Scenarios

```typescript
// tests/uc-7-quality-check.test.ts

describe("UC-7: Quality Check Sample Pages", () => {
  let projectId: string;

  beforeEach(async () => {
    await loginUser();
    const project = await createProject({
      title: "Test Book",
      authors: ["Author"],
      languages: ["sanskrit"],
    });
    projectId = project.projectId;

    const pdf = readFileSync("test-samples/sample-100-pages.pdf");
    await uploadPdf(projectId, pdf);
    await splitPdf(projectId);
  });

  describe("AC-7.1-7.10: Quality Analysis Flow", () => {
    test("should select 5 sample pages from middle", async () => {
      const totalPages = 100;
      const samples = selectSamplePages(totalPages, 5);

      expect(samples).toHaveLength(5);
      expect(samples).toEqual([25, 40, 50, 60, 75]);
      expect(samples[0]).toBeGreaterThan(10); // Not from start
      expect(samples[4]).toBeLessThan(90); // Not from end
    });

    test("should detect skew angle", async () => {
      const imagePath = "test-samples/skewed-page.png";
      const metrics = await analyzeImageQuality(imagePath);

      expect(metrics.skewAngle).toBeGreaterThan(0);
      expect(metrics.skewAngle).toBeLessThan(10);
    });

    test("should measure contrast level", async () => {
      const lowContrastImage = "test-samples/low-contrast.png";
      const highContrastImage = "test-samples/high-contrast.png";

      const low = await analyzeImageQuality(lowContrastImage);
      const high = await analyzeImageQuality(highContrastImage);

      expect(low.contrast).toBeLessThan(0.3);
      expect(high.contrast).toBeGreaterThan(0.7);
    });

    test("should measure brightness", async () => {
      const darkImage = "test-samples/dark-page.png";
      const brightImage = "test-samples/bright-page.png";

      const dark = await analyzeImageQuality(darkImage);
      const bright = await analyzeImageQuality(brightImage);

      expect(dark.brightness).toBeLessThan(0.3);
      expect(bright.brightness).toBeGreaterThan(0.7);
    });

    test("should measure noise level", async () => {
      const noisyImage = "test-samples/noisy-scan.png";
      const cleanImage = "test-samples/clean-scan.png";

      const noisy = await analyzeImageQuality(noisyImage);
      const clean = await analyzeImageQuality(cleanImage);

      expect(noisy.noiseLevel).toBeGreaterThan(0.3);
      expect(clean.noiseLevel).toBeLessThan(0.2);
    });

    test("should compute overall quality rating", () => {
      const excellent = {
        skewAngle: 0.5,
        contrast: 0.8,
        brightness: 0.6,
        noiseLevel: 0.1,
      };

      const poor = {
        skewAngle: 8.0,
        contrast: 0.2,
        brightness: 0.3,
        noiseLevel: 0.5,
      };

      expect(computeQualityRating(excellent)).toBe("excellent");
      expect(computeQualityRating(poor)).toBe("poor");
    });

    test("should make preprocessing recommendation", () => {
      const samples = [
        { quality: "excellent" },
        { quality: "excellent" },
        { quality: "good" },
        { quality: "good" },
        { quality: "good" },
      ];

      const recommendation = makePreprocessingRecommendation(samples);
      expect(recommendation).toBe("skip"); // 0 poor quality pages
    });

    test("should display quality report to user", async () => {
      await runQualityCheck(projectId);

      const response = await fetch(`/projects/${projectId}/quality-check`);
      const html = await response.text();

      expect(html).toContain("Quality Check Results");
      expect(html).toContain("skew");
      expect(html).toContain("contrast");
      expect(html).toContain("Recommendation:");
    });

    test("should save user preprocessing decision", async () => {
      await runQualityCheck(projectId);

      const response = await fetch(`/api/projects/${projectId}/preprocessing`, {
        method: "POST",
        body: JSON.stringify({ enabled: true }),
      });

      expect(response.status).toBe(200);

      const metadata = await getProjectMetadata(projectId);
      expect(metadata.preprocessingEnabled).toBe(true);
    });

    test("should generate annotated sample images", async () => {
      const imagePath = "test-samples/kalika-page-8-08.png";
      const annotated = await annotateQualityIssues(imagePath);

      expect(fs.existsSync(annotated)).toBe(true);

      // Should show skew lines, contrast zones
      const metadata = await sharp(annotated).metadata();
      expect(metadata.width).toBeGreaterThan(0);
    });
  });

  describe("AC-7.11-7.14: Error Handling", () => {
    test("should handle book with fewer than 5 pages", async () => {
      const samples = selectSamplePages(3, 5);
      expect(samples).toHaveLength(3);
      expect(samples).toEqual([1, 2, 3]);
    });

    test("should detect unreadable images", async () => {
      const blackImage = createBlackImage(2480, 3508);
      const metrics = await analyzeImageQuality(blackImage);

      expect(metrics.quality).toBe("unreadable");
      expect(metrics.warning).toContain("unreadable");
    });

    test("should timeout long-running analysis", async () => {
      jest.setTimeout(35000);

      mockSlowImageAnalysis(40000); // 40 seconds

      const result = await runQualityCheck(projectId);
      expect(result.error).toContain("timeout");
    }, 35000);

    test("should fallback if ImageMagick not available", async () => {
      mockImageMagickNotInstalled();

      const metrics = await analyzeImageQuality("test-samples/sample.png");

      // Should still work with Sharp only
      expect(metrics).toHaveProperty("contrast");
      expect(metrics).toHaveProperty("brightness");
      // Skew detection may be unavailable
    });
  });

  afterEach(async () => {
    await deleteProject(projectId);
  });
});
```

### Definition of Done

- [ ] Sample page selection algorithm implemented (25%, 40%, 50%, 60%, 75%)
- [ ] Skew detection working (ImageMagick or Python script)
- [ ] Contrast measurement implemented (Sharp)
- [ ] Brightness measurement implemented (Sharp)
- [ ] Noise level measurement implemented (Sharp)
- [ ] Overall quality rating logic implemented
- [ ] Preprocessing recommendation algorithm implemented
- [ ] Quality check results page built
- [ ] User decision UI (Enable/Skip buttons)
- [ ] Annotated sample images generated
- [ ] All positive tests passing (AC-7.1 through AC-7.10)
- [ ] All negative tests passing (AC-7.11 through AC-7.14)
- [ ] Quality check completes in <20 seconds

### Files Created/Modified

- ✅ `worker/quality-check.ts` (quality analysis logic)
- ✅ `worker/image-analysis.ts` (metric calculations)
- ✅ `worker/annotate-samples.ts` (visual annotations)
- ✅ `src/routes/projects/[id]/quality-check/+page.svelte` (results UI)
- ✅ `src/routes/projects/[id]/quality-check/+page.server.ts` (load results)
- ✅ `src/routes/api/projects/[id]/preprocessing/+server.ts` (save decision)
- ✅ `src/lib/utils/quality-analysis.ts` (helper functions)
- ✅ `tests/uc-7-quality-check.test.ts` (test file)

---

## UC-8: AI Layout Detection (Single Page)

**Status:** 🔴 Not Started
**Dependencies:** UC-1 (Gemini API), UC-6 (Pages extracted)

### Value Delivered

User can test AI layout detection on a single page before committing to batch processing entire book. Gemini API detects bounding boxes for verses, commentary, footnotes, etc. Results are saved as page-001.json.

### Prerequisites (Manual Setup Required)

**None** - Gemini API key configured in UC-1

### Acceptance Criteria

#### Positive Tests (Must Pass)

✅ **AC-8.1:** User can trigger layout detection for single page

- Test: Click "Test AI on Page 1" button
- Expected: API call initiated
- Verify: Loading indicator shown

✅ **AC-8.2:** Page image is sent to Gemini API

- Test: Monitor API request
- Expected: Image data in request payload
- Verify: Correct image format (base64 or URL)

✅ **AC-8.3:** Gemini returns bounding boxes

- Test: Parse API response
- Expected: Array of bounding boxes
- Verify: Each box has coordinates, text, type

✅ **AC-8.4:** Boxes have correct content types

- Test: Check detected types
- Expected: verse, commentary, footnote, heading, etc.
- Verify: Types match actual page content

✅ **AC-8.5:** Boxes have language detection

- Test: Check language field
- Expected: sanskrit, hindi, english correctly identified
- Verify: Multi-language pages handled

✅ **AC-8.6:** OCR text is extracted

- Test: Check text field in boxes
- Expected: Text content present
- Verify: Devanagari characters preserved

✅ **AC-8.7:** Confidence scores are provided

- Test: Check confidence field
- Expected: Score 0-1 for each box
- Verify: Lower scores for ambiguous regions

✅ **AC-8.8:** Reading order is determined

- Test: Check readingOrder field
- Expected: Sequential numbering (1, 2, 3...)
- Verify: Top-to-bottom, left-to-right (adjustable)

✅ **AC-8.9:** page-001.json is saved to GitHub

- Test: After detection completes
- Expected: File committed to pages/page-001.json
- Verify: Valid JSON, matches schema

✅ **AC-8.10:** API cost is logged

- Test: Check costs.jsonl
- Expected: New entry with operation=layout-detection
- Verify: Cost calculated correctly (~$0.00038/page)

✅ **AC-8.11:** Version history entry is created

- Test: Check page-001.json versionHistory
- Expected: Version 1 with changeType=ai_generated
- Verify: Correct attribution (pagesage-ai)

#### Negative Tests (Must Fail Gracefully)

❌ **AC-8.12:** Invalid Gemini API key is detected

- Test: Use wrong API key
- Expected: Authentication error caught
- Verify: "Invalid API key" error message

❌ **AC-8.13:** Gemini API rate limit is handled

- Test: Mock rate limit error
- Expected: Exponential backoff retry
- Verify: Success after retry or clear error

❌ **AC-8.14:** Gemini API timeout is handled

- Test: Mock API timeout (>60s)
- Expected: Timeout error caught
- Verify: "API timeout, please retry" message

❌ **AC-8.15:** Empty/blank page is detected

- Test: Process blank white page
- Expected: No boxes detected or warning
- Verify: "Page appears blank" warning

❌ **AC-8.16:** API returns malformed response

- Test: Mock invalid JSON response
- Expected: Parsing error caught
- Verify: "Invalid API response" error

❌ **AC-8.17:** Page with no text is handled

- Test: Process image-only page
- Expected: Image boxes detected, no text boxes
- Verify: No OCR errors

### Test Scenarios

```typescript
// tests/uc-8-ai-layout-detection.test.ts

describe('UC-8: AI Layout Detection (Single Page)', () => {
  let projectId: string;

  beforeEach(async () => {
    await loginUser();
    const project = await createProject({
      title: 'Bhagavad Gita',
      authors: ['Vyasa'],
      languages: ['sanskrit', 'english']
    });
    projectId = project.projectId;

    const pdf = readFileSync('test-samples/sample-10-pages.pdf');
    await uploadPdf(projectId, pdf);
    await splitPdf(projectId);
  });

  describe('AC-8.1-8.11: Layout Detection Flow', () => {
    test('should trigger layout detection for page', async () => {
      const response = await fetch(`/api/projects/${projectId}/pages/1/detect-layout`, {
        method: 'POST'
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('jobId');
    });

    test('should send image to Gemini API', async () => {
      const imagePath = 'test-samples/kalika-page-8-08.png';
      const imageBase64 = fs.readFileSync(imagePath).toString('base64');

      const geminiRequest = await callGeminiLayoutDetection(imageBase64);

      expect(geminiRequest).toHaveProperty('image');
      expect(geminiRequest.image.data).toBe(imageBase64);
    });

    test('should parse Gemini response', async () => {
      const mockResponse = {
        boundingBoxes: [
          {
            vertices: [
              { x: 100, y: 200 },
              { x: 900, y: 200 },
              { x: 900, y: 320 },
              { x: 100, y: 320 }
            ],
            text: 'धर्मक्षेत्रे कुरुक्षेत्रे',
            type: 'verse',
            language: 'sanskrit',
            confidence: 0.95
          }
        ]
      };

      const boxes = parseGeminiResponse(mockResponse);

      expect(boxes).toHaveLength(1);
      expect(boxes[0]).toHaveProperty('boxId');
      expect(boxes[0].coordinates).toHaveProperty('x');
      expect(boxes[0].contentType).toBe('verse');
    });

    test('should detect content types correctly', async () => {
      const response = await detectLayout(projectId, 1);

      const boxes = response.boundingBoxes;
      const types = boxes.map(b => b.contentType);

      expect(types).toContain('verse');
      expect(types).toContain('commentary');
    });

    test('should detect languages correctly', async () => {
      const response = await detectLayout(projectId, 1);

      const sanskritBoxes = response.boundingBoxes.filter(
        b => b.language === 'sanskrit'
      );
      const englishBoxes = response.boundingBoxes.filter(
        b => b.language === 'english'
      );

      expect(sanskritBoxes.length).toBeGreaterThan(0);
      expect(englishBoxes.length).toBeGreaterThan(0);
    });

    test('should extract OCR text', async () => {
      const response = await detectLayout(projectId, 1);

      const firstBox = response.boundingBoxes[0];
      expect(firstBox.text.ocr).toBeDefined();
      expect(firstBox.text.ocr.length).toBeGreaterThan(0);
    });

    test('should provide confidence scores', async () => {
      const response = await detectLayout(projectId, 1);

      response.boundingBoxes.forEach(box => {
        expect(box.confidence).toBeGreaterThanOrEqual(0);
        expect(box.confidence).toBeLessThanOrEqual(1);
      });
    });

    test('should determine reading order', async () => {
      const response = await detectLayout(projectId, 1);

      const orders = response.boundingBoxes.map(b => b.readingOrder);
      expect(orders).toEqual([1, 2, 3, 4, 5, ...]);
    });

    test('should save page-001.json to GitHub', async () => {
      await detectLayout(projectId, 1);

      const pageData = await getPageDataFromGitHub(projectId, 1);

      expect(pageData).toHaveProperty('pageId');
      expect(pageData.pageNumber).toBe(1);
      expect(pageData.currentState.boundingBoxes).toBeDefined();
    });

    test('should log API cost', async () => {
      await detectLayout(projectId, 1);

      const costs = await getCostLog(projectId);
      const layoutCosts = costs.filter(c => c.operation === 'layout-detection');

      expect(layoutCosts.length).toBeGreaterThan(0);
      expect(layoutCosts[0].totalCost).toBeCloseTo(0.00038, 5);
    });

    test('should create version history entry', async () => {
      await detectLayout(projectId, 1);

      const pageData = await getPageDataFromGitHub(projectId, 1);
      const history = pageData.versionHistory;

      expect(history).toHaveLength(1);
      expect(history[0].version).toBe(1);
      expect(history[0].changeType).toBe('ai_generated');
      expect(history[0].editedBy.githubUsername).toBe('pagesage-ai');
    });
  });

  describe('AC-8.12-8.17: Error Handling', () => {
    test('should detect invalid API key', async () => {
      mockInvalidGeminiKey();

      const result = await detectLayout(projectId, 1);
      expect(result.error).toContain('Invalid API key');
    });

    test('should handle rate limit with retry', async () => {
      let attempts = 0;
      mockGeminiRateLimit(() => {
        attempts++;
        return attempts < 3; // Fail twice, succeed on 3rd
      });

      const result = await detectLayout(projectId, 1);
      expect(result).toHaveProperty('boundingBoxes');
      expect(attempts).toBe(3);
    });

    test('should handle API timeout', async () => {
      mockGeminiTimeout(65000); // 65 seconds

      const result = await detectLayout(projectId, 1);
      expect(result.error).toContain('timeout');
    });

    test('should detect blank pages', async () => {
      const blankImage = createBlankImage(2480, 3508);
      await uploadPageImage(blankImage, projectId, 1);

      const result = await detectLayout(projectId, 1);
      expect(result.warning).toContain('blank');
      expect(result.boundingBoxes).toHaveLength(0);
    });

    test('should handle malformed API response', async () => {
      mockGeminiMalformedResponse();

      const result = await detectLayout(projectId, 1);
      expect(result.error).toContain('Invalid API response');
    });

    test('should handle image-only pages', async () => {
      const imagePage = loadImageOnlyPage();
      await uploadPageImage(imagePage, projectId, 1);

      const result = await detectLayout(projectId, 1);
      expect(result.boundingBoxes.every(b => b.contentType === 'image')).toBe(true);
    });
  });

  afterEach(async () => {
    await deleteProject(projectId);
  });
});
```

### Definition of Done

- [ ] "Test AI on Page 1" button in UI
- [ ] Gemini API integration implemented
- [ ] Prompt engineering for layout detection optimized
- [ ] Response parsing for bounding boxes
- [ ] Content type classification working
- [ ] Language detection working
- [ ] Reading order algorithm implemented
- [ ] page-NNN.json schema implemented
- [ ] GitHub commit for page data
- [ ] Cost logging implemented
- [ ] Version history tracking
- [ ] All positive tests passing (AC-8.1 through AC-8.11)
- [ ] All negative tests passing (AC-8.12 through AC-8.17)
- [ ] Processing time <10 seconds per page

### Files Created/Modified

- ✅ `src/routes/api/projects/[id]/pages/[page]/detect-layout/+server.ts` (API route)
- ✅ `worker/gemini-layout-detection.ts` (Gemini integration)
- ✅ `worker/parse-gemini-response.ts` (response parser)
- ✅ `src/lib/server/gemini.ts` (API client)
- ✅ `src/lib/utils/reading-order.ts` (reading order logic)
- ✅ `src/lib/utils/cost-calculator.ts` (cost calculations)
- ✅ `src/lib/schemas/page-annotations.ts` (page schema implementation)
- ✅ `tests/uc-8-ai-layout-detection.test.ts` (test file)
- ✅ `tests/fixtures/gemini-responses.json` (mock API responses)

---

**⚠️ Document continues with UC-9 through UC-15...**
**Total Length: ~15,000 lines**

Would you like me to:

1. ✅ Continue with remaining use cases (UC-9 through UC-15)?
2. ✅ Create a summary table of all use cases?
3. ✅ Export this as a standalone document?

This structure gives you:

- Clear incremental value per UC
- Comprehensive test scenarios (TDD-ready)
- Explicit prerequisites
- Acceptance criteria (positive + negative)
- Definition of done checklist

Ready to implement UC-1 when you are! 🚀
