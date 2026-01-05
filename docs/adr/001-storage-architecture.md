# ADR 001: Storage Architecture - Hybrid GitHub + Google Drive

**Status:** Accepted
**Date:** 2025-12-02
**Decision Makers:** kramnat
**Context:** PageSage v1 - Single user OCR & annotation platform

---

## Context and Problem Statement

PageSage needs to store two types of data:

1. **Version-controlled data**: Annotations, metadata, version history (needs git diffs, collaboration, attribution)
2. **Immutable assets**: PDFs (up to 500MB), page images (1000+ images @ 1-5MB each)

**Constraints:**

- GitHub has 100MB per-file limit and ~5GB practical repo size limit
- Large books can total 2-5GB (PDF + images)
- Cost sensitivity (admin pays all costs)
- v1 is single-user, personal use

**Key Question:** Where should we store large immutable assets (PDFs, images)?

---

## Decision Drivers

1. **Cost**: Minimize storage costs, maximize free tier usage
2. **Version control**: Need git-friendly diffs for annotations
3. **Performance**: Reasonable upload/download speeds for 1000+ images
4. **Simplicity**: Easy setup and maintenance for v1
5. **Integration**: Work well with existing tech stack (GitHub, Google AI APIs)

---

## Considered Options

### Option 1: GitHub LFS (Large File Storage)

**Pros:**

- Everything in one place (GitHub)
- True version control for images
- Integrated with git workflow

**Cons:**

- ❌ **Expensive**: $5/month for 50GB (after 1GB free)
- ❌ **Complex**: Requires LFS client setup
- ❌ **Overkill**: Don't need version history for immutable images

**Cost:** $5/month for 50GB = **$0.10/GB/month**

### Option 2: AWS S3

**Pros:**

- Industry standard
- Reliable, scalable
- Good performance

**Cons:**

- ❌ **No free tier** (beyond 12-month trial)
- ❌ **More expensive**: $0.023/GB/month
- ❌ **Requires AWS account** (separate from Google AI setup)

**Cost:** $0.023/GB/month, no permanent free tier

### Option 3: Google Cloud Storage (GCS)

**Pros:**

- Designed for app storage
- Fast, CDN-backed
- Same GCP project as Google AI APIs
- Simple REST API
- 5GB always-free tier

**Cons:**

- ❌ **Smaller free tier**: 5GB vs 15GB (Google Drive)
- Requires GCP setup

**Cost:** 5GB free, then $0.02/GB/month = **$2/100GB**

### Option 4: Google Drive ✅ **SELECTED**

**Pros:**

- ✅ **Largest free tier**: 15GB (3x more than GCS)
- ✅ **Cost-effective**: $1.99/100GB after free tier (~same as GCS)
- ✅ **Simple setup**: OAuth, familiar interface
- ✅ **Manual browsing**: Easy to inspect files
- ✅ **v1-appropriate**: Perfect for personal use, single user

**Cons:**

- ⚠️ **Rate limits**: 1000 requests/100sec (acceptable for single-user v1)
- ⚠️ **Not designed for apps**: But fine for personal/low-volume use
- ⚠️ **API complexity**: Folder hierarchy vs flat storage

**Cost:** 15GB free (~6 large books), then $1.99/month for 100GB

### Option 5: Local Filesystem

**Cons:**

- ❌ Not portable
- ❌ No sharing/collaboration
- ❌ Rejected immediately

---

## Decision Outcome

**Chosen Option: Hybrid Architecture with GitHub + Google Drive**

### Architecture

**GitHub repositories (free, unlimited):**

```
github.com/{org}/pagesage-project-{id}/
├── metadata.json           # Project metadata
├── costs.jsonl             # Cost tracking log
├── history.jsonl           # Version history
├── pages/
│   ├── page001-annotations.json  # Version-controlled annotations
│   ├── page002-annotations.json
│   └── ...
└── exports/
    └── markdown/           # Generated exports (.gitignored)
```

**Google Drive folder (15GB free):**

```
Google Drive/PageSage/
├── project-{id}/
│   ├── original.pdf        # Immutable source PDF
│   └── pages/
│       ├── page001.png     # Immutable page images
│       ├── page002.png
│       └── ...
```

### Asset References in JSON

Annotation files reference Drive assets:

```json
{
  "projectId": "abc123",
  "page": 1,
  "imageUrl": "https://drive.google.com/file/d/{fileId}/view",
  "imageDriveId": "1a2b3c4d5e6f...",
  "imageSha256": "d4f3b2a1...",
  "width": 2480,
  "height": 3508,
  "annotations": [...]
}
```

### Storage Limits (15GB Free Tier)

Given 15GB free tier on Google Drive:

- **Max PDF size**: 500MB (as specified in requirements)
- **Max pages per book**: 2000 pages
- **Max image size**: 5MB per page (typical: 2MB)
- **Typical large book**: 2.5GB (1000 pages @ 2MB + 500MB PDF)
- **Realistic capacity**: ~6 large books within free tier
- **Recommended max**: Stay under 12GB to leave buffer

### Cost Projection

**Scenario 1: Light use (1-5 books)**

- Storage: <15GB
- **Cost: $0/month** ✨

**Scenario 2: Moderate use (6-20 books)**

- Storage: 15-50GB
- **Cost: $1.99/month** (100GB tier)

**Scenario 3: Heavy use (50+ books)**

- Storage: 100GB+
- **Cost: $1.99/month** (still 100GB tier)
- Consider migrating to GCS if exceeding 100GB

---

## Consequences

### Positive

- ✅ **Maximum free tier**: 3x more free storage than GCS
- ✅ **Cost-optimized**: $0/month for realistic v1 usage
- ✅ **Simple setup**: OAuth similar to GitHub
- ✅ **Manual inspection**: Easy to browse files in Drive UI
- ✅ **Git-friendly**: Annotations get full version control
- ✅ **Collaboration-ready**: Git handles merge conflicts naturally

### Negative

- ⚠️ **Two systems to manage**: GitHub + Google Drive
- ⚠️ **Referential integrity**: Need to validate Drive file references
- ⚠️ **Rate limits**: Must respect 1000 req/100sec (not an issue for v1)
- ⚠️ **Migration path**: If outgrow Drive, need to migrate to GCS

### Neutral

- Setup requires Google account (likely already have one)
- Drive API is more complex than GCS (but manageable)

---

## Migration Strategy (Future)

If Google Drive becomes limiting:

1. **Trigger conditions**:
   - Exceeding 100GB consistently
   - Need for better performance
   - Multiple concurrent users (v4)

2. **Migration path**:
   - Set up GCS bucket
   - Copy files from Drive to GCS
   - Update JSON references (Drive IDs → GCS URLs)
   - Atomic cutover with downtime window

3. **Estimated effort**: 1-2 days for migration script + testing

---

## Implementation Notes

### Required Environment Variables

```bash
# Google Drive OAuth (for service account)
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=        # Root PageSage folder

# Or use service account (simpler for automated uploads)
GOOGLE_SERVICE_ACCOUNT_JSON=   # Service account credentials
```

### API Quota Management

- **Upload strategy**: Batch uploads with delays if needed
- **Rate limit handling**: Exponential backoff on 429 errors
- **Monitoring**: Log all API calls to detect quota issues early

### Data Integrity

- **SHA-256 checksums**: Store in JSON, verify on download
- **Orphan cleanup**: Periodic job to find Drive files without GitHub refs
- **Broken link detection**: Validate Drive IDs on project load

---

## References

- Google Drive API: https://developers.google.com/drive
- Google Drive Pricing: https://one.google.com/about/plans
- GitHub repo size limits: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- REQUIREMENTS-v1.md: Project requirements document
- TODO.md: Gap analysis and implementation planning

---

## Alternatives for Future Consideration

If requirements change:

- **Cloudflare R2**: S3-compatible, no egress fees, $0.015/GB
- **Backblaze B2**: Cheapest ($0.005/GB), but slower
- **Self-hosted MinIO**: Free, full control, requires infrastructure

---

**Decision Status:** ✅ Accepted
**Review Date:** After v1 launch (reassess based on actual usage)
