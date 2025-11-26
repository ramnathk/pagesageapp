#!/bin/bash

# PageSage Development Environment Setup Script
# This script automates the setup process for new machines

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

command_exists() {
    command -v "$1" &> /dev/null
}

# Script start
echo "================================================"
echo "PageSage Development Environment Setup"
echo "================================================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    log_error "This script is designed for macOS. Please set up manually."
    exit 1
fi

# 1. Check/Install Homebrew
log_info "Checking for Homebrew..."
if ! command_exists brew; then
    log_warn "Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    log_info "Homebrew already installed ✓"
fi

# 2. Install Homebrew dependencies
log_info "Installing Homebrew dependencies from Brewfile..."
if [[ -f "Brewfile" ]]; then
    brew bundle install
    log_info "Homebrew dependencies installed ✓"
else
    log_error "Brewfile not found. Are you in the project root?"
    exit 1
fi

# 3. Check Node.js version
log_info "Checking Node.js version..."
if command_exists node; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$NODE_VERSION" -ge 18 ]]; then
        log_info "Node.js $(node -v) installed ✓"
    else
        log_warn "Node.js version is too old. Please upgrade to Node 18+"
    fi
else
    log_error "Node.js not found. Please install via Homebrew."
    exit 1
fi

# 4. Install npm dependencies
log_info "Installing npm dependencies..."
if [[ -f "package.json" ]]; then
    npm install
    log_info "npm dependencies installed ✓"
else
    log_warn "package.json not found. Skipping npm install."
fi

# 5. Set up environment variables
log_info "Setting up environment variables..."
if [[ ! -f ".env.local" ]]; then
    if [[ -f ".env.example" ]]; then
        cp .env.example .env.local
        log_warn "Created .env.local from template. Please edit with your actual values:"
        log_warn "  - GITHUB_MCP_TOKEN"
        log_warn "  - CODACY_API_TOKEN"
        log_warn "  - And other required secrets"
    else
        log_error ".env.example not found. Cannot create .env.local"
    fi
else
    log_info ".env.local already exists ✓"
fi

# 6. Check for environment variables in zshrc
log_info "Checking ~/.zshrc for environment variables..."
if ! grep -q "GITHUB_MCP_TOKEN" ~/.zshrc; then
    log_warn "GITHUB_MCP_TOKEN not found in ~/.zshrc"
    log_warn "Add the following to your ~/.zshrc:"
    echo ""
    echo "  # PageSage Environment Variables"
    echo "  export GITHUB_MCP_TOKEN=\"ghp_your_token_here\""
    echo "  export CODACY_API_TOKEN=\"your_token_here\""
    echo ""
else
    log_info "Environment variables found in ~/.zshrc ✓"
fi

# 7. GitHub CLI authentication
log_info "Checking GitHub CLI authentication..."
if command_exists gh; then
    if gh auth status &> /dev/null; then
        log_info "GitHub CLI authenticated ✓"
    else
        log_warn "GitHub CLI not authenticated. Run: gh auth login"
    fi
else
    log_error "GitHub CLI (gh) not found. Install via Homebrew."
fi

# 8. Verify MCP dependencies
log_info "Verifying MCP server dependencies..."
if command_exists npx; then
    log_info "npx (for npm-based MCP servers) ✓"
else
    log_error "npx not found. Install Node.js via Homebrew."
fi

if command_exists uvx; then
    log_info "uvx (for Python-based MCP servers) ✓"
else
    log_warn "uvx not found. Install uv via Homebrew: brew install uv"
fi

# Summary
echo ""
echo "================================================"
echo "Setup Summary"
echo "================================================"
log_info "Core dependencies installed"
log_warn "Next steps:"
echo "  1. Edit .env.local with your actual tokens"
echo "  2. Add environment variables to ~/.zshrc (see above)"
echo "  3. Run: source ~/.zshrc"
echo "  4. Authenticate GitHub CLI: gh auth login"
echo "  5. Configure Claude Code MCP servers (see docs/mcp-configuration.md)"
echo "  6. Run: npm run verify-setup (once package.json scripts are ready)"
echo ""
log_info "Setup complete! See docs/development-setup.md for more details."
