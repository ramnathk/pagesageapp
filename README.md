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

- **[Development Setup](docs/development-setup.md)** - Complete environment setup guide
- **[MCP Configuration](docs/mcp-configuration.md)** - MCP server setup and troubleshooting
- **[Quick Reference](docs/quick-reference.md)** - Commands, shortcuts, and common tasks
- **[Coding Conventions](CLAUDE.md)** - Code style, testing, and Git workflow
- **[Requirements](REQUIREMENTS.md)** - Project scope and technical decisions

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

## 📋 Project Status

**Current Phase**: Component 1 - OCR & Annotation Tool

- [x] Project setup and documentation
- [ ] SvelteKit application scaffold
- [ ] GitHub OAuth integration
- [ ] PDF upload and storage
- [ ] Google Document AI integration
- [ ] Annotation editor UI
- [ ] Export functionality
- [ ] Cost tracking dashboard

Future components:
- Component 2: Public website for browsing digitized texts
- Component 3: Cross-reference and citation engine

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
