# 👻 DevGhost for VSCode

Real-time dead code detection directly in your editor!

## Features

- **🔍 Real-time Diagnostics** - See unused imports and variables as you type
- **⚡ Quick Fixes** - Auto-remove unused imports with one click  
- **🎨 Configurable Severity** - Error, Warning, or Information levels
- **🚀 Workspace Analysis** - Scan entire projects instantly
- **💾 Auto-fix on Save** - Optional automatic cleanup

## Commands

- `DevGhost: Analyze Current File` - Scan the active file
- `DevGhost: Analyze Workspace` - Scan all TS/JS files
- `DevGhost: Fix Current File` - Remove all unused imports

## Configuration

```json
{
  "devghost.enable": true,
  "devghost.severity": "Warning", // "Error" | "Warning" | "Information"
  "devghost.autoFixOnSave": false
}
```

## Installation (Local Testing)

1. Clone the repo
2. `cd vscode-devghost`
3. `npm install`
4. `npm run compile`
5. Press `F5` to launch Extension Development Host

## Publishing

```bash
npm install -g @vscode/vsce
vsce package
vsce publish
```

## Requirements

- VSCode 1.85.0 or higher
- DevGhost NPM package

## Known Limitations

- Some dynamic imports may not be detected
- Index file re-exports need manual review

## License

MIT © Haileyesus
