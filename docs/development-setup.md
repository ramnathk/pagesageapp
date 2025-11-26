# PageSage Development Environment Setup

This guide walks you through setting up the PageSage development environment on a new machine.

## Prerequisites

- macOS (primary development platform)
- Terminal with zsh shell
- Internet connection

## Quick Setup

For a fully automated setup, run:

```bash
./scripts/setup-dev-env.sh
```

Otherwise, follow the manual steps below.

---

## Manual Setup

### 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Add Homebrew to your PATH (add to `~/.zshrc`):

```bash
export PATH="/opt/homebrew/bin:$PATH"
export PATH="/opt/homebrew/sbin:$PATH"
```

### 2. Install System Dependencies

We use a `Brewfile` to manage system dependencies:

```bash
brew bundle install
```

This installs:
- **node** - JavaScript runtime for SvelteKit and tooling
- **uv** - Fast Python package installer (for MCP servers)
- **gh** - GitHub CLI (for authentication and repo operations)
- **eza** - Modern ls replacement (optional, for better terminal UX)
- **zoxide** - Smart directory navigation (optional)
- **autojump** - Directory jumping (optional)
- **deno** - Alternative JS runtime (some MCP servers use this)

### 3. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your tokens:

```bash
# GitHub token for MCP server (needs repo and read:user scopes)
GITHUB_MCP_TOKEN=ghp_your_token_here

# Codacy API token (if using code quality tools)
CODACY_API_TOKEN=your_codacy_token_here
```

**⚠️ IMPORTANT**: Never commit `.env.local` - it's in `.gitignore`

Add these to your `~/.zshrc`:

```bash
# PageSage Environment Variables
export GITHUB_MCP_TOKEN="your_token_here"
export CODACY_API_TOKEN="your_codacy_token_here"
```

Reload your shell:

```bash
source ~/.zshrc
```

### 4. Install Node Dependencies

```bash
npm install
```

### 5. Configure MCP Servers

See [MCP Configuration Guide](./mcp-configuration.md) for detailed setup instructions.

**Quick version**: MCP servers are configured in Claude Code's settings and will use the environment variables you set above.

### 6. Verify Setup

Run the verification script:

```bash
npm run verify-setup
```

This checks:
- ✓ Node.js version (18+)
- ✓ Required environment variables set
- ✓ All npm dependencies installed
- ✓ Homebrew packages installed
- ✓ MCP servers configured

---

## Development Tools Configuration

### GitHub CLI Authentication

Authenticate with GitHub:

```bash
gh auth login
```

Choose:
- GitHub.com
- HTTPS
- Authenticate with your browser

### Optional: Terminal Enhancements

Add these to `~/.zshrc` for improved terminal experience:

```bash
# Modern ls with icons
alias ls='eza --color=always --group-directories-first --icons'
alias ll='eza -la --icons --octal-permissions --group-directories-first'
alias la='eza --long --all --group --group-directories-first'

# Smart directory navigation
eval "$(zoxide init zsh)"

# Autojump
[ -f /opt/homebrew/etc/profile.d/autojump.sh ] && . /opt/homebrew/etc/profile.d/autojump.sh
```

---

## Project-Specific Setup

### Running the Dev Server

```bash
npm run dev
```

Access at: http://localhost:5173

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Linting & Type Checking

```bash
# Lint
npm run lint

# Type check
npm run check

# Both + build test
npm run validate
```

---

## Troubleshooting

### "Cannot find module" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### MCP servers not working

1. Check environment variables are set: `echo $GITHUB_MCP_TOKEN`
2. Restart Claude Code
3. See [MCP Configuration](./mcp-configuration.md) for detailed troubleshooting

### GitHub CLI not authenticated

```bash
gh auth status
gh auth login  # if not authenticated
```

### Port 5173 already in use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

---

## Syncing Setup Across Machines

When setting up on a new machine:

1. Clone the repository
2. Run `./scripts/setup-dev-env.sh`
3. Add environment variables to `~/.zshrc`
4. Configure Claude Code MCP servers (see [MCP docs](./mcp-configuration.md))
5. Run `npm run verify-setup`

**What gets synced via git:**
- ✅ Brewfile (Homebrew dependencies)
- ✅ package.json (npm dependencies)
- ✅ Setup scripts
- ✅ Documentation

**What you need to configure manually:**
- ❌ Environment variables (`.env.local`, `~/.zshrc`)
- ❌ Claude Code MCP settings
- ❌ GitHub CLI authentication

---

## Next Steps

- Read [REQUIREMENTS.md](../REQUIREMENTS.md) for project scope
- Read [CLAUDE.md](../CLAUDE.md) for coding conventions
- Check [MCP Configuration](./mcp-configuration.md) for MCP setup details
- Start coding! 🚀
