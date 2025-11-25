# 👻 **DevGhost** – The Exorcist for Your Codebase

<div align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5/xT9IgG50Fb7Mi0prBC/giphy.gif" alt="Ghost Busters" width="200" />
</div>

> **Is your project haunted by dead code?**
> Unused imports rattling chains, zombie dependencies eating disk space, and phantom variables lurking in the shadows.

**Who you gonna call?** `devghost` – the ultimate ghost‑hunter for JavaScript/TypeScript projects! 🚫👻

---

## 🎉 What we’ve achieved (v0.3.2 → v0.3.3)
- **Unused Variables Detection** – now reports dead `const/let` and function parameters.
- **CLI Output Revamp** – colour‑coded tables, line numbers, and concise summaries.
- **Full Test Coverage** – 23 tests, all passing, linting clean.
- **GitHub Actions CI** – build, lint, test, and coverage run on every push.
- **Documentation Refresh** – updated README, CHANGELOG, and usage examples.
- **Version bump to `0.3.3`** – ready for the next release.

---

## ✨ Core Features
- 🔍 **Smart Detection** – deep static analysis via the TypeScript Compiler API.
- 🧹 **Auto‑Fix** – `--fix` removes unused imports, `--fix‑deps` removes dead dependencies.
- 🎯 **Interactive Mode** – review each issue one‑by‑one.
- 📦 **Dependency Cleanup** – safely uninstall unused npm packages.
- 📊 **Impact Analysis** – see how many KB/LOC you’ll save.
- 🚀 **CI/CD Ready** – `--ci` exits with code 1 on any issue.
- 🎨 **Beautiful Output** – colour‑coded, easy‑to‑read reports.
- 🧩 **Unused Variables** – newly added detection for dead variables and parameters.
- ⚡ **Fast** – analyses large projects in seconds.

---

## ⚡ Quick Start
```bash
# Try it without installing (recommended for a quick test)
npx devghost

# Or install globally for the full experience
npm install -g devghost
```

---

## 📖 Usage
```bash
# Basic scan (default)
devghost

# Auto‑fix unused imports
 devghost --fix

# Auto‑fix unused dependencies
 devghost --fix-deps

# Do both at once
 devghost --fix --deps

# Preview what would change
 devghost --fix --dry-run

# Interactive mode – approve each change
 devghost --interactive

# CI mode – minimal output, fail on any issue
 devghost --ci

# JSON output for tooling
 devghost --json
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

💾 Potential savings: 15 KB, 465 lines, 45 MB deps
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

## 🗺️ Roadmap
- ✅ **v0.1** – MVP (imports, files, CI)
- ✅ **v0.2** – Dependency management (auto‑uninstall)
- ✅ **v0.3** – Deep analysis (functions, exports, variables)
- 🚧 **v0.4** – Visual impact report (HTML/graphs)
- 🔮 **v0.5** – VSCode extension
- 🔮 **v0.6** – Git integration (who added the dead code?)
- 🎯 **v1.0** – Plugin system, pre‑commit hooks, framework presets

---

## 🤝 Contributing
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

*Don’t let dead code haunt you.*
</div>
