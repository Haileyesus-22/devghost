# 👻 DevGhost

**Find dead code, dead imports, and dead dependencies before they haunt your project.**

DevGhost is a powerful CLI tool that analyzes your TypeScript/JavaScript projects to detect:
- 💀 Unused imports
- 💀 Unused exports
- 💀 Orphaned files
- 💀 Unused npm dependencies

## ✨ Features

- 🔍 **Smart Detection** - Uses TypeScript Compiler API for accurate analysis
- 🔧 **Auto-Fix** - Automatically remove unused imports AND dependencies
- 🎯 **Interactive Mode** - Review and fix issues one by one
- 📦 **Dependency Cleanup** - Safely remove unused npm packages
- 📊 **Impact Analysis** - See how much KB/LOC you can save
- 🚀 **CI/CD Ready** - Perfect for build pipelines with `--yes` flag
- 🎨 **Beautiful Output** - Color-coded, easy-to-read reports
- 🧩 **Unused Variables Detection** - Detect and report unused local variables and function parameters
- ⚡ **Fast** - Analyzes large projects in seconds

## 📦 Installation

```bash
npm install -g devghost
```

Or use with npx (no installation needed):

```bash
npx devghost
```

## 🚀 Quick Start

```bash
# Analyze current directory
devghost

# Analyze specific directory
devghost ./src

# Auto-fix unused imports
devghost --fix

# Auto-fix unused dependencies
devghost --fix-deps

# Fix both imports AND dependencies
devghost --fix --deps

# Preview fixes without applying
devghost --fix-deps --dry-run

# Interactive mode (review each issue)
devghost --interactive

# Skip confirmations (perfect for CI/CD)
devghost --fix-deps --yes

# Minimal output (perfect for CI/CD)
devghost --quiet

# CI mode (exits with code 1 if issues found)
devghost --ci

# JSON output
devghost --json
```

## 📖 Usage

### Basic Analysis

```bash
devghost
```

Output:
```
👻 DevGhost - Dead Code Detective
========================================

✓ Scanned 234 files

❌ Found 3 unused imports:
  - src/utils/helper.ts:5 - 'unusedFunction' from './other'
  - src/components/Button.tsx:2 - 'React' (type-only)

❌ Found 2 unused exports:
  - src/utils/helper.ts:12 - 'helperFunction' (named)
  - src/api/client.ts:8 - 'ApiClient' (named)

❌ Found 2 unused files:
  - src/legacy/oldParser.ts (15 KB, 450 lines)

❌ Found 1 unused dependency:
  - lodash (45 MB in node_modules)

💾 Potential Savings:
   - 15 KB of code
   - 465 lines
   - 45 MB in dependencies

Summary: 6 issues found

💡 Run 'devghost --fix' to automatically remove unused imports
💡 Run 'devghost --interactive' to review each issue
```

### Auto-Fix Mode

**Fix Unused Imports:**
```bash
# Remove all unused imports automatically
devghost --fix

# Preview what would be fixed
devghost --fix --dry-run
```

**Fix Unused Dependencies (v0.2+):**
```bash
# Remove unused dependencies
devghost --fix-deps

# Preview dependencies to be removed
devghost --fix-deps --dry-run

# Skip confirmation prompt (for automation)
devghost --fix-deps --yes
```

**Fix Everything:**
```bash
# Remove both unused imports AND dependencies
devghost --fix --deps

# With dry-run
devghost --fix --deps --dry-run

# Skip all confirmations
devghost --fix --deps --yes

# Fix unused functions (v0.3.1+)
devghost --fix-functions
```

### Interactive Mode

```bash
devghost --interactive
```

Review each unused import and dependency individually:

**Unused Imports:**
```
src/utils/helper.ts:15
  import { unusedFunction } from './other';

What do you want to do?
❯ Fix (remove this import)
  Skip this one
  Skip all remaining
  Cancel
```

**Unused Dependencies (v0.2+):**
```
📦 lodash
   Type: dependency
   Size: 1379.31 KB

What do you want to do?
❯ ✓ Remove this dependency
  ⊗ Skip this one
  ⊗ Skip all remaining
  ✕ Cancel
```

### CI/CD Integration

```bash
# Add to your CI pipeline
devghost --ci

# Exit code 0 = no issues
# Exit code 1 = issues found
```

**GitHub Actions Example:**
```yaml
- name: Check for dead code
  run: npx devghost --ci
```

### Configuration File

Create `devghost.config.json` in your project root:

```json
{
  "ignore": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/__tests__/**"
  ],
  "entry": [
    "src/index.ts",
    "src/server.ts"
  ],
  "includeDev": false
}
```

### Ignore Comments

```typescript
// devghost-ignore-next-line
import { willUseThisLater } from './future';

// At the top of a file
// devghost-ignore-file
```

## 🎯 Use Cases

### Clean Up Before Release
```bash
# Remove all unused code and dependencies
devghost --fix --deps --yes
```

### Code Review
```bash
# Review each issue interactively
devghost --interactive
```

### CI/CD Quality Gate
```bash
# Fail build if issues found
devghost --ci

# Auto-fix in CI pipeline (be careful!)
devghost --fix --deps --yes
```

### Dependency Audit
```bash
# Generate detailed JSON report
devghost --include-dev --json > dead-code-report.json

# Clean up unused dependencies safely
devghost --fix-deps --dry-run  # preview first
devghost --fix-deps            # then confirm
```

## 🛠️ CLI Options

| Option | Description |
|--------|-------------|
| `--json` | Output results as JSON |
| `--fix` | Automatically remove unused imports |
| `--fix-deps` | Automatically remove unused dependencies |
| `--deps` | Include dependencies when using `--fix` |
| `--dry-run` | Preview fixes without applying |
| `--interactive` | Review each issue interactively (imports + dependencies) |
| `-y, --yes` | Skip confirmation prompts (auto-confirm) |
| `-q, --quiet` | Minimal output (errors and summary only) |
| `--ci` | CI mode (minimal output, exit code 1 if issues found) |
| `--config <path>` | Path to config file |
| `--include-dev` | Include devDependencies in analysis |
| `--help` | Show help |
| `--version` | Show version |

## 🗺️ Roadmap

### v0.1 - MVP ✅
- ✅ Detect unused imports
- ✅ Detect unused files
- ✅ Detect unused dependencies
- ✅ Auto-fix mode for imports
- ✅ Interactive mode for imports
- ✅ CI/CD integration

### v0.2 - Dependency Management ✅ (Current)
- ✅ **Auto-fix unused dependencies** (safely run `npm uninstall`)
- ✅ **Interactive mode for dependencies**
- ✅ **Confirmation prompts with preview**
- ✅ **`--yes` flag for automation**
- ✅ **Combined mode** (`--fix --deps`)
- ✅ **Package manager detection** (npm/yarn/pnpm)

### v0.3 - Deep Code Analysis 🚧 (In Progress)
- ✅ **Detect unused functions**
- ✅ **Detect unused variables**
- ✅ **Detect unused exports**
- [ ] Detect dead code paths

### v0.4 - Package Health Check
- [ ] Check for outdated dependencies
- [ ] Check for deprecated packages
- [ ] Check for unmaintained packages
- [ ] Security vulnerability check

### v0.5 - Advanced UI
- [ ] HTML report generation
- [ ] VSCode extension
- [ ] Git integration (`--since`, `--uncommitted`)
- [ ] Dependency graph visualization

### v1.0 - Production Release
- [ ] Plugin system
- [ ] Pre-commit hook support
- [ ] Compare-before-after reports
- [ ] Framework-specific presets

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © Haileyesus

## 🙏 Acknowledgments

Built with:
- [TypeScript](https://www.typescriptlang.org/) - Amazing language and compiler API
- [Commander](https://github.com/tj/commander.js) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive prompts

---

**Made with ❤️ by developers, for developers**

If DevGhost helped clean up your codebase, give it a ⭐!
