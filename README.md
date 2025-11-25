# 👻 **DevGhost** – The Exorcist for Your Codebase

<div align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5/xT9IgG50Fb7Mi0prBC/giphy.gif" alt="Ghost Busters" width="200" />
  
  <p>
    <a href="https://www.npmjs.com/package/devghost"><img src="https://img.shields.io/npm/v/devghost?color=blue&logo=npm" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/devghost"><img src="https://img.shields.io/npm/dm/devghost?color=green&logo=npm" alt="npm downloads" /></a>
    <a href="https://github.com/Haileyesus-22/devghost/actions"><img src="https://img.shields.io/github/actions/workflow/status/Haileyesus-22/devghost/ci.yml?branch=main&logo=github" alt="CI status" /></a>
    <a href="https://github.com/Haileyesus-22/devghost"><img src="https://img.shields.io/github/stars/Haileyesus-22/devghost?style=social" alt="GitHub stars" /></a>
    <a href="https://github.com/Haileyesus-22/devghost/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/devghost" alt="license" /></a>
  </p>
</div>

> **Is your project haunted by dead code?**  
> Unused imports rattling  chains, zombie dependencies eating disk space, and phantom variables lurking in the shadows.

**Who you gonna call?** `devghost` – the ultimate ghost‑hunter for JavaScript/TypeScript projects! 🚫👻

---

## 🎉 Latest Release (v0.3.5)
- ✅ **74% Test Coverage** – 65 tests, all passing
- ✅ **Unused Types Detection** – interfaces, type aliases, enums
- ✅ **Unused Variables** – dead `const/let` and function parameters
- ✅ **Enhanced Analyzers** – deps, files, exports, functions
- ✅ **Bug Fixes** – package manager detection improvements

---

## ✨ Core Features
- 🔍 **Smart Detection** – deep static analysis via the TypeScript Compiler API
- 🧹 **Auto‑Fix** – `--fix` removes unused imports, `--fix‑deps` removes dead dependencies  
- 🎯 **Interactive Mode** – review each issue one‑by‑one
- 📦 **Dependency Cleanup** – safely uninstall unused npm packages
- 📊 **Impact Analysis** – see how many KB/LOC you'll save
- 🚀 **CI/CD Ready** – `--ci` exits with code 1 on any issue
- 🎨 **Beautiful Output** – colour‑coded, easy‑to‑read reports
- 🧩 **Unused Types** – interfaces, type aliases, enums, classes
- 🔢 **Unused Variables** – dead `const/let` and function parameters
- ⚡ **Fast** – analyses large projects in seconds

---

## � Why DevGhost?

Most tools just **list** dead code. DevGhost **exorcises** it.

- **🛡️ Safety First**: The interactive mode lets you approve every single deletion.
- **🧹 True Cleanup**: We don't just find unused files; we remove unused *imports*, *variables*, and *types* inside your files.
- **🧠 Deep Analysis**: Uses the TypeScript Compiler API for precision, not just regex.
- **⚡ Zero Config**: Works out of the box for most projects.

---

## 📦 Installation

### Quick Run (Recommended)
Run it instantly without installing:
```bash
npx devghost
```

### Install Globally
```bash
npm install -g devghost
```

### Install as Dev Dependency
```bash
npm install -D devghost
```

---

## 📖 Usage

```bash
# 👻 Basic scan (default)
devghost

# 🛡️ Interactive mode (approve every change)
devghost --interactive

# 🧹 Auto-fix unused imports
devghost --fix

# 📦 Auto-fix unused dependencies
devghost --fix-deps

# 🚀 CI mode (exit with error if issues found)
devghost --ci
```

### Sample output
```
👻 DevGhost - Dead Code Detective
========================================
✓ Scanned 234 files

❌ 3 unused imports
❌ 2 unused exports  
❌ 2 orphaned files
❌ 1 dead dependency

💾 Potential savings: 15 KB, 465 lines, 45 MB deps
```

---

## 🛠️ Configuration
Create a `devghost.config.json` to tailor the hunt:
```json
{
  "ignore": ["**/*.test.ts", "**/legacy/**"],
  "entry": ["src/index.ts"],
  "includeDev": false
}
```

### Ignore comments
```typescript
// devghost-ignore-next-line
import { willUseLater } from './future';

// devghost-ignore-file
```

---

## 🔧 Troubleshooting

### "No entry points found"
**Solution**: Specify entry points in `devghost.config.json`:
```json
{ "entry": ["src/index.ts", "src/cli.ts"] }
```

### False positives with dynamic imports
**Solution**: Use ignore comments for intentional code:
```typescript
// devghost-ignore-next-line
import('./dynamic-feature');
```

### Slow on large projects
**Solution**: Add more specific ignore patterns:
```json
{ "ignore": ["**/node_modules/**", "**/dist/**", "**/*.test.ts"] }
```

We love community ghosts! To contribute:
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/awesome‑feature`)
3. Commit your changes (`git commit -m "Add awesome feature"`)
4. Push and open a Pull Request

---

## 📄 License
MIT © Haileyesus

---

<div align="center">
Made with ❤️ (and ☕) by [Haileyesus](https://github.com/Haileyesus-22)

*Don't let dead code haunt you.*
</div>
