# PageSage

**Ancient Text OCR & Annotation Platform**

A collaborative platform for digitizing Sanskrit, Hindi, and English multi-language historical texts with AI-assisted layout detection and human-in-the-loop correction.

## 🎯 Overview

PageSage enables scholars, researchers, and volunteers to:
- Upload PDF scans of ancient texts
- Process with Google Document AI / Gemini for OCR and layout detection
- Manually review and correct AI-generated annotations
- Collaborate via GitHub-based storage with full version control
- Export to various formats (HOCR, Plain Text, Markdown, JSON)

**Key Features:**
- Multi-language support (Sanskrit, Hindi, English)
- Cost-aware API usage with transparency
- Git-friendly plain-text storage
- Human-in-the-loop annotation editor
- Full attribution and collaboration tracking

## 🚀 Quick Start

### Prerequisites
- macOS (primary dev platform)
- Node.js 18+
- Homebrew

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/pagesageapp.git
cd pagesageapp

# Run automated setup
./scripts/setup-dev-env.sh

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your tokens

# Add to ~/.zshrc
export GITHUB_MCP_TOKEN="your_token"
export CODACY_API_TOKEN="your_token"

# Reload shell
source ~/.zshrc

# Verify everything is set up
npm run verify-setup

# Start development server
npm run dev
```

Visit http://localhost:5173

For detailed setup instructions, see [Development Setup Guide](docs/development-setup.md).

## 📚 Documentation

### Requirements & Planning
- **[REQUIREMENTS-v1.md](REQUIREMENTS-v1.md)** - v1.0 Single User Tool (current focus)
- **[REQUIREMENTS-v2.md](REQUIREMENTS-v2.md)** - v2.0 Multi-User Collaboration (future)
- **[System Modules](docs/system-modules.md)** - Functional module breakdown

### Development
- **[Development Setup](docs/development-setup.md)** - Environment setup guide
- **[Quick Reference](docs/quick-reference.md)** - Commands and shortcuts
- **[Coding Conventions](CLAUDE.md)** - Code style, testing, Git workflow

## 🛠️ Tech Stack

- **Frontend & Backend**: SvelteKit + TypeScript
- **Storage**: GitHub (plain text, version controlled)
- **Authentication**: GitHub OAuth
- **OCR/AI**: Google Document AI + Gemini
- **Testing**: Vitest (80%+ coverage required)
- **Deployment**: TBD (Vercel, Netlify, or self-hosted)

## 📦 Project Structure

```
pagesageapp/
├── docs/              # Documentation
├── scripts/           # Setup & utility scripts
├── src/               # Source code (TBD)
│   ├── lib/          # Reusable components & utilities
│   └── routes/       # SvelteKit routes
├── tests/            # Test files
├── .env.example      # Environment variable template
├── Brewfile          # Homebrew dependencies
├── package.json      # npm dependencies
└── README.md         # This file
```

## 🧪 Development

```bash
# Development server
npm run dev

# Run tests
npm test                 # Once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# Code quality
npm run lint             # Lint check
npm run format           # Auto-format
npm run check            # Type check
npm run validate         # All checks + build
```

## 🤝 Contributing

1. Read [CLAUDE.md](CLAUDE.md) for conventions
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Write tests alongside code (80%+ coverage)
4. Run `npm run validate` before committing
5. Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
6. Create PR and request review

## 🗺️ Version Roadmap

PageSage development follows a version-as-theme approach:

### **v1.0 - Solo User MVP** (Current)
**Theme**: Personal OCR tool for single user
**Status**: In Development

**Core Features**:
- Project management (create, organize books)
- PDF upload & processing
- AI-powered layout detection
- Interactive annotation editor
- **Wikipedia-style version tracking** (every edit tracked)
- OCR text extraction & correction
- Export to Quarto markdown
- Cost tracking (global budget)

**Focus**: Get core workflow perfect before adding collaboration

See [REQUIREMENTS-v1.md](REQUIREMENTS-v1.md) for complete specifications.

---

### **v2.0 - Multi-User Collaboration** (Future)
**Theme**: Enable team-based digitization
**Depends On**: v1.0 complete

**Additions**:
- User authentication (GitHub OAuth)
- Role-based permissions (Admin, Editor, Reviewer, Viewer)
- User provisioning (manual + invitation)
- Per-user budget caps
- Concurrent editing with conflict detection
- Admin oversight dashboard
- User activity monitoring

See [REQUIREMENTS-v2.md](REQUIREMENTS-v2.md) for complete specifications.

---

### **v3.0 - Advanced Features** (Conceptual)
**Theme**: Analytics, optimization, integrations
**Depends On**: v2.0 complete

**Potential Features**:
- Cross-book search
- OCR quality dashboards
- Cost optimization recommendations
- Bulk import tools
- External integrations

---

## 📋 Current Status

**Active Version**: v1.0 - Solo User MVP

- [x] Project setup and documentation
- [x] Requirements defined (v1 + v2)
- [x] Module architecture planned
- [ ] Application scaffold
- [ ] PDF upload & processing
- [ ] AI layout detection
- [ ] Annotation editor UI
- [ ] Version tracking system
- [ ] OCR processing
- [ ] Text correction interface
- [ ] Export functionality
- [ ] Cost tracking dashboard

## 🔒 Security

- All API keys and tokens in environment variables (never committed)
- GitHub OAuth for authentication only
- User permissions checked on every request
- Input validation at all boundaries
- Regular dependency security audits

See [CLAUDE.md](CLAUDE.md) for detailed security practices.

## 📄 License

MIT License - See LICENSE file for details.

All digitized book content is public domain.

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Powered by [Google Document AI](https://cloud.google.com/document-ai)
- Version control via [GitHub](https://github.com)
- Developed with [Claude Code](https://claude.com/claude-code)

---

For questions, see [docs/](docs/) or report issues at https://github.com/your-username/pagesageapp/issues
