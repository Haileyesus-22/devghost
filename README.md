# 👻 DevGhost

**Find dead code, dead imports, and dead dependencies before they haunt your project.**

DevGhost is a powerful CLI tool that analyzes your TypeScript/JavaScript projects to detect:
- 💀 Unused imports
- 💀 Orphaned files
- 💀 Unused npm dependencies

## ✨ Features

- 🔍 **Smart Detection** - Uses TypeScript Compiler API for accurate analysis
- 🔧 **Auto-Fix** - Automatically remove unused imports with `--fix`
- 🎯 **Interactive Mode** - Review and fix issues one by one
- 📊 **Impact Analysis** - See how much KB/LOC you can save
- 🚀 **CI/CD Ready** - Perfect for build pipelines
- 🎨 **Beautiful Output** - Color-coded, easy-to-read reports
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

# Preview fixes without applying
devghost --fix --dry-run

# Interactive mode
devghost --interactive

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

```bash
# Remove all unused imports automatically
devghost --fix

# Preview what would be fixed
devghost --fix --dry-run
```

### Interactive Mode

```bash
devghost --interactive
```

Review each unused import and decide what to do:
```
src/utils/helper.ts:15
  import { unusedFunction } from './other';

What do you want to do?
❯ Fix (remove this import)
  Skip this one
  Skip all remaining
  Cancel
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
devghost --fix
```

### Code Review
```bash
devghost --interactive
```

### CI/CD Quality Gate
```bash
devghost --ci
```

### Dependency Audit
```bash
devghost --include-dev --json > dead-code-report.json
```

## 🛠️ CLI Options

| Option | Description |
|--------|-------------|
| `--json` | Output results as JSON |
| `--fix` | Automatically remove unused imports |
| `--dry-run` | Preview fixes without applying (use with `--fix`) |
| `--interactive` | Review each issue interactively |
| `--ci` | CI mode (minimal output, exit code 1 if issues found) |
| `--config <path>` | Path to config file |
| `--include-dev` | Include devDependencies in analysis |
| `--help` | Show help |
| `--version` | Show version |

## 🗺️ Roadmap

### v0.1 - MVP ✅ (Current)
- ✅ Detect unused imports
- ✅ Detect unused files
- ✅ Detect unused dependencies
- ✅ Auto-fix mode
- ✅ Interactive mode
- ✅ CI/CD integration

### v0.2 - Deep Code Analysis
- [ ] **Auto-fix unused dependencies** (safely run `npm uninstall`)
- [ ] Detect unused functions
- [ ] Detect unused variables
- [ ] Detect unused exports
- [ ] Detect dead code paths

### v0.3 - Package Health Check
- [ ] Check for outdated dependencies
- [ ] Check for deprecated packages
- [ ] Check for unmaintained packages
- [ ] Security vulnerability check

### v0.4 - Advanced UI
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
