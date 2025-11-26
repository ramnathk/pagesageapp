# PageSage Quick Reference

## Setting Up on a New Machine

```bash
# 1. Clone the repository
git clone https://github.com/your-username/pagesageapp.git
cd pagesageapp

# 2. Run automated setup
./scripts/setup-dev-env.sh

# 3. Edit environment variables
cp .env.example .env.local
# Edit .env.local with your actual tokens

# 4. Add to ~/.zshrc
export GITHUB_MCP_TOKEN="ghp_your_token_here"
export CODACY_API_TOKEN="your_token_here"

# 5. Reload shell
source ~/.zshrc

# 6. Verify setup
npm run verify-setup

# 7. Start development
npm run dev
```

## Essential Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Run tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (85%+ required)

# Code Quality
npm run lint             # Check linting
npm run format           # Auto-format code
npm run check            # Type checking
npm run validate         # Run all checks + build

# Setup
npm run verify-setup     # Verify environment setup
brew bundle install      # Install Homebrew dependencies
```

## Environment Variables Checklist

Required in `~/.zshrc` and `.env.local`:
- [ ] `GITHUB_MCP_TOKEN` - GitHub personal access token (repo, read:user scopes)
- [ ] `CODACY_API_TOKEN` - Codacy API token (optional)

To generate tokens:
- GitHub: https://github.com/settings/tokens/new
- Codacy: https://app.codacy.com/account/apiTokens

## File Structure Quick Guide

```
pagesageapp/
├── docs/                          # Documentation
│   ├── development-setup.md       # Full setup guide
│   ├── mcp-configuration.md       # MCP server details
│   └── quick-reference.md         # This file
├── scripts/                       # Setup & utility scripts
│   ├── setup-dev-env.sh           # Automated setup
│   └── verify-setup.js            # Environment verification
├── src/                           # Source code (TBD)
├── .env.example                   # Environment template
├── .env.local                     # Your secrets (gitignored)
├── .gitignore                     # Git exclusions
├── Brewfile                       # Homebrew dependencies
├── CLAUDE.md                      # Coding conventions
├── package.json                   # npm dependencies
└── README.md                      # Project overview
```

## MCP Servers Quick Reference

| Server | Purpose | Install |
|--------|---------|---------|
| **github** | GitHub API access | `npx -y @modelcontextprotocol/server-github` |
| **vitest-runner** | Run tests | `npm install -D vitest` |
| **svelte** | Svelte docs & validation | `uvx mcp-server-svelte` |

Requires:
- `npx` (comes with Node.js)
- `uvx` (install via: `brew install uv`)
- `GITHUB_MCP_TOKEN` environment variable

## Common Issues & Fixes

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### MCP servers not working
```bash
# Check env vars
echo $GITHUB_MCP_TOKEN

# Add to ~/.zshrc if missing
export GITHUB_MCP_TOKEN="ghp_your_token"

# Reload shell
source ~/.zshrc

# Restart Claude Code
```

### Port 5173 in use
```bash
lsof -ti:5173 | xargs kill -9
# Or use different port: npm run dev -- --port 3000
```

### GitHub CLI not authenticated
```bash
gh auth login
```

## Code Conventions Quick Ref

- **Line length**: 100 characters max
- **Indentation**: 2 spaces (tabs in .svelte files)
- **Quotes**: Single quotes for JS, double for templates
- **Test coverage**: 80% minimum (85%+ preferred)
- **Commit format**: `type: subject` (see CLAUDE.md)
- **Branch naming**: `feat/description` or `fix/description`

## Testing Philosophy

- Write tests with features (same session)
- 80% coverage minimum
- Mock expensive APIs (Google, GitHub)
- Test edge cases for Sanskrit/Hindi text
- E2E tests for critical flows

## Git Workflow

1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes & commit: `git commit -m "feat: your change"`
3. Run checks: `npm run validate`
4. Push: `git push -u origin feat/your-feature`
5. Create PR and squash-merge to main

## Documentation Links

- [Full Setup Guide](./development-setup.md)
- [MCP Configuration](./mcp-configuration.md)
- [Coding Conventions](../CLAUDE.md)
- [Project Requirements](../REQUIREMENTS.md)

## Support

- **Issues**: Report at https://github.com/anthropics/claude-code/issues
- **Docs**: See `docs/` directory
- **Claude Code Help**: Run `/help` in Claude Code
