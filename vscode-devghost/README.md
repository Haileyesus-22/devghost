# 👻 DevGhost for VSCode

**Hunt down dead code in real-time!** 🚫👻

DevGhost helps you keep your codebase clean by automatically detecting and removing unused imports and dead code directly within VSCode.

## ✨ Features

- **🔍 Real-time Diagnostics**: See unused imports and variables highlighted as you type.
- **⚡ Fix Entire Workspace**: Automatically remove unused imports across your **entire project** in one click!
- **🚀 Blazing Fast**: Analyzes thousands of files in seconds using parallel processing.
- **🧹 Quick Fixes**: Auto-remove unused imports from the current file instantly.
- **🛡️ Safe & Reliable**: Smart filtering ensures `node_modules` and build folders are ignored.

## 🎮 Commands

Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and type `DevGhost`:

- `DevGhost: Analyze Current File` - Scan the active file for dead code.
- `DevGhost: Analyze Workspace` - Scan your entire project (10x faster in v0.1.5!).
- `DevGhost: Fix Current File` - Remove unused imports from the active file.
- `DevGhost: Fix Entire Workspace` - **(NEW)** Automatically remove unused imports from ALL files in your project.

## ⚙️ Configuration

Customize DevGhost in your VSCode settings (`settings.json`):

```json
{
  "devghost.enable": true,
  "devghost.severity": "Warning", // Options: "Error", "Warning", "Information"
  "devghost.autoFixOnSave": false
}
```

## 📦 Requirements

- VSCode 1.85.0 or higher
- A TypeScript or JavaScript project

## 🔧 Troubleshooting

If analysis seems to ignore some files, ensure they are not in your `.gitignore` or standard build folders (`dist`, `out`, `build`).

## 📄 License

MIT © Haileyesus
