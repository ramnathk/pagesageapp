#!/usr/bin/env node

/**
 * PageSage Development Environment Verification Script
 * Checks that all required dependencies and configurations are in place
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

let hasErrors = false;
let hasWarnings = false;

console.log("\n================================================");
console.log("PageSage Development Environment Verification");
console.log("================================================\n");

// 1. Check Node.js version
log.info("Checking Node.js version...");
try {
  const nodeVersion = process.versions.node;
  const majorVersion = parseInt(nodeVersion.split(".")[0]);
  if (majorVersion >= 18) {
    log.success(`Node.js v${nodeVersion}`);
  } else {
    log.error(`Node.js v${nodeVersion} (requires v18+)`);
    hasErrors = true;
  }
} catch (error) {
  log.error("Cannot determine Node.js version");
  hasErrors = true;
}

// 2. Check npm
log.info("Checking npm...");
try {
  const npmVersion = execSync("npm --version", { encoding: "utf8" }).trim();
  log.success(`npm v${npmVersion}`);
} catch (error) {
  log.error("npm not found");
  hasErrors = true;
}

// 3. Check Homebrew
log.info("Checking Homebrew...");
try {
  const brewVersion = execSync("brew --version", { encoding: "utf8" }).split(
    "\n",
  )[0];
  log.success(brewVersion);
} catch (error) {
  log.warn("Homebrew not found (optional on non-macOS systems)");
  hasWarnings = true;
}

// 4. Check key Homebrew packages
log.info("Checking Homebrew packages...");
const brewPackages = ["node", "gh", "uv"];
for (const pkg of brewPackages) {
  try {
    execSync(`brew list ${pkg}`, { encoding: "utf8", stdio: "pipe" });
    log.success(`${pkg} installed`);
  } catch (error) {
    if (pkg === "uv") {
      log.warn(`${pkg} not installed (needed for Python MCP servers)`);
      hasWarnings = true;
    } else {
      log.error(`${pkg} not installed`);
      hasErrors = true;
    }
  }
}

// 5. Check environment variables
log.info("Checking environment variables...");
const requiredEnvVars = ["GITHUB_MCP_TOKEN"];
const optionalEnvVars = ["CODACY_API_TOKEN"];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    log.success(`${envVar} is set`);
  } else {
    log.error(`${envVar} not set`);
    hasErrors = true;
  }
}

for (const envVar of optionalEnvVars) {
  if (process.env[envVar]) {
    log.success(`${envVar} is set`);
  } else {
    log.warn(`${envVar} not set (optional)`);
    hasWarnings = true;
  }
}

// 6. Check node_modules
log.info("Checking npm dependencies...");
if (existsSync(join(projectRoot, "node_modules"))) {
  log.success("node_modules directory exists");
} else {
  log.error("node_modules not found (run: npm install)");
  hasErrors = true;
}

// 7. Check key files
log.info("Checking project files...");
const requiredFiles = [
  ".env.example",
  "Brewfile",
  "package.json",
  "docs/development-setup.md",
  "docs/mcp-configuration.md",
];

for (const file of requiredFiles) {
  if (existsSync(join(projectRoot, file))) {
    log.success(file);
  } else {
    log.error(`${file} not found`);
    hasErrors = true;
  }
}

// 8. Check .env.local
log.info("Checking .env.local...");
if (existsSync(join(projectRoot, ".env.local"))) {
  log.success(".env.local exists");
} else {
  log.warn(".env.local not found (copy from .env.example)");
  hasWarnings = true;
}

// 9. Check GitHub CLI authentication
log.info("Checking GitHub CLI authentication...");
try {
  execSync("gh auth status", { encoding: "utf8", stdio: "pipe" });
  log.success("GitHub CLI authenticated");
} catch (error) {
  log.warn("GitHub CLI not authenticated (run: gh auth login)");
  hasWarnings = true;
}

// 10. Check MCP tools
log.info("Checking MCP tools...");
const mcpTools = [
  { name: "npx", cmd: "npx --version", required: true },
  { name: "uvx", cmd: "uvx --version", required: false },
];

for (const tool of mcpTools) {
  try {
    execSync(tool.cmd, { encoding: "utf8", stdio: "pipe" });
    log.success(`${tool.name} available`);
  } catch (error) {
    if (tool.required) {
      log.error(`${tool.name} not found`);
      hasErrors = true;
    } else {
      log.warn(`${tool.name} not found (needed for some MCP servers)`);
      hasWarnings = true;
    }
  }
}

// Summary
console.log("\n================================================");
console.log("Verification Summary");
console.log("================================================\n");

if (hasErrors) {
  log.error("Setup verification failed. Please fix the errors above.");
  console.log("\nFor help, see: docs/development-setup.md\n");
  process.exit(1);
} else if (hasWarnings) {
  log.warn("Setup verification passed with warnings.");
  console.log("\nSome optional components are missing.");
  console.log("The project will work, but you may want to install them.");
  console.log("See: docs/development-setup.md\n");
  process.exit(0);
} else {
  log.success("All checks passed! Your environment is ready.");
  console.log("\nNext steps:");
  console.log("  - npm run dev          # Start development server");
  console.log("  - npm test             # Run tests");
  console.log("  - npm run check        # Type check");
  console.log("\n");
  process.exit(0);
}
