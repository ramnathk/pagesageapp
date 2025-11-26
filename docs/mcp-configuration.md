# MCP Server Configuration for PageSage

Model Context Protocol (MCP) servers provide Claude Code with extended capabilities for interacting with external services and APIs.

## What are MCP Servers?

MCP servers are long-running processes that Claude Code communicates with to:
- Access external APIs (GitHub, etc.)
- Run specialized tools (testing frameworks, documentation)
- Interact with local services

## PageSage MCP Servers

We use the following MCP servers:

### 1. GitHub MCP Server (`@modelcontextprotocol/server-github`)

**Purpose**: Interact with GitHub API for repository operations, issues, PRs, and code search.

**Capabilities**:
- Create/update/read repositories
- Manage issues and pull requests
- Search code across GitHub
- Manage branches and commits

**Installation**:
```bash
# Installed automatically via npx when Claude Code starts
# No manual installation needed
```

**Configuration**:
Claude Code automatically uses the `GITHUB_MCP_TOKEN` environment variable.

**Required Token Scopes**:
- `repo` (full repository access)
- `read:user` (user profile access)

**Generate Token**:
1. Go to https://github.com/settings/tokens/new
2. Create a "Personal Access Token (classic)"
3. Select scopes: `repo`, `read:user`
4. Copy token and add to `~/.zshrc`:
   ```bash
   export GITHUB_MCP_TOKEN="ghp_your_token_here"
   ```

---

### 2. Vitest Runner MCP Server

**Purpose**: Run Vitest tests and generate coverage reports directly from Claude Code.

**Capabilities**:
- Run test suites
- Generate coverage reports
- Watch mode integration

**Installation**:
Typically installed via npm in the project or globally:
```bash
npm install -D vitest
```

**Configuration**:
No environment variables required. Uses project's `vitest.config.ts`.

---

### 3. Svelte MCP Server

**Purpose**: Official Svelte documentation, code examples, and component validation.

**Capabilities**:
- Fetch Svelte 5 and SvelteKit documentation
- Validate Svelte components
- Generate Svelte REPL/playground links
- Auto-fix common Svelte issues

**Installation**:
```bash
# Installed automatically via uvx when Claude Code starts
# Requires `uv` package manager (installed via Homebrew)
```

**Configuration**:
No environment variables required.

---

## Setting Up MCP Servers in Claude Code

### Method 1: Automatic (Recommended)

Claude Code automatically discovers and configures MCP servers when you have the required tools installed:

1. Install dependencies:
   ```bash
   brew install node uv
   npm install
   ```

2. Set environment variables in `~/.zshrc`:
   ```bash
   export GITHUB_MCP_TOKEN="ghp_your_token_here"
   ```

3. Restart Claude Code

4. Verify MCP servers are running:
   ```bash
   # In Claude Code, they will appear in the available tools
   ```

### Method 2: Manual Configuration

If you need to manually configure MCP servers, create/edit Claude Code's configuration file.

The location varies:
- `~/.claude-code/config.json`
- `~/Library/Application Support/Claude/claude_code_config.json`

Example configuration:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_MCP_TOKEN}"
      }
    },
    "svelte": {
      "command": "uvx",
      "args": ["mcp-server-svelte"]
    },
    "vitest-runner": {
      "command": "npx",
      "args": ["-y", "vitest-mcp-server"]
    }
  }
}
```

---

## Environment Variables Reference

Add these to your `~/.zshrc`:

```bash
# ============================================
# PageSage MCP Environment Variables
# ============================================

# GitHub MCP Server
# Generate at: https://github.com/settings/tokens/new
# Required scopes: repo, read:user
export GITHUB_MCP_TOKEN="ghp_your_token_here"

# Codacy API (optional - for code quality metrics)
# Generate at: https://app.codacy.com/account/apiTokens
export CODACY_API_TOKEN="your_codacy_token_here"

# ============================================
# End PageSage Variables
# ============================================
```

**Security Note**: These tokens have powerful permissions. Keep them secret:
- ✅ Add to `~/.zshrc` (local only)
- ✅ Add to project `.env.local` (gitignored)
- ❌ Never commit to git
- ❌ Never share publicly

---

## Verification

### Check Environment Variables

```bash
echo $GITHUB_MCP_TOKEN
# Should output: ghp_xxxxxxxxxxxx

echo $CODACY_API_TOKEN
# Should output: your token
```

### Check MCP Servers in Claude Code

In Claude Code, you should see tools like:
- `mcp__github__*` (GitHub operations)
- `mcp__vitest-runner__*` (Test running)
- `mcp__svelte__*` (Svelte docs and validation)

If these don't appear:
1. Check environment variables are set
2. Restart Claude Code
3. Check tool installation: `which npx uvx`

---

## Troubleshooting

### GitHub MCP: "Authentication failed"

**Problem**: `GITHUB_MCP_TOKEN` not set or invalid.

**Solution**:
```bash
# Check token is set
echo $GITHUB_MCP_TOKEN

# If not set, add to ~/.zshrc
export GITHUB_MCP_TOKEN="ghp_your_token_here"

# Reload shell
source ~/.zshrc

# Restart Claude Code
```

### Svelte MCP: "Command not found: uvx"

**Problem**: `uv` package manager not installed.

**Solution**:
```bash
brew install uv
```

### Vitest MCP: Tests not running

**Problem**: Vitest not installed or misconfigured.

**Solution**:
```bash
# Install Vitest
npm install -D vitest

# Verify vitest.config.ts exists
ls vitest.config.ts

# Run manually to test
npm test
```

### MCP Servers not appearing in Claude Code

**Problem**: Claude Code can't find MCP configuration or tools.

**Solution**:
1. Verify tools installed: `which npx uvx`
2. Restart Claude Code completely
3. Check Claude Code logs for errors
4. Try manual configuration (see Method 2 above)

---

## Adding New MCP Servers

When adding a new MCP server to the project:

1. **Install dependencies** (if needed):
   ```bash
   # For npm-based servers
   npm install -g @some/mcp-server

   # For Python-based servers
   uv pip install mcp-server-name

   # For Homebrew
   brew install tool-name
   ```

2. **Document in this file**:
   - Purpose and capabilities
   - Installation instructions
   - Required environment variables
   - Configuration example

3. **Update Brewfile** (if Homebrew deps):
   ```ruby
   brew "tool-name"
   ```

4. **Update .env.example** (if env vars needed):
   ```bash
   # New MCP Server
   NEW_MCP_TOKEN=your_token_here
   ```

5. **Update setup script**: Add installation steps to `scripts/setup-dev-env.sh`

---

## MCP Server Best Practices

1. **Use environment variables** for tokens and secrets
2. **Document all capabilities** that the project uses
3. **Version pin** when possible (for reproducibility)
4. **Test on fresh machine** before considering setup complete
5. **Keep this doc updated** when adding/removing MCP servers

---

## Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Code MCP Documentation](https://claude.com/docs/mcp)
- [Available MCP Servers](https://github.com/modelcontextprotocol/servers)
