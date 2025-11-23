# 🚀 DevGhost v0.2 - Implementation Guide

> **Learning Mode**: Step-by-step guide to implement v0.2 features yourself

## 📋 What We're Building

**v0.2.0 - Complete the Auto-Fix Story**
1. Auto-fix unused dependencies (`--fix-deps`)
2. Combined fix mode (`--fix --deps` to fix both imports and deps)
3. Enhanced interactive mode for dependencies
4. Dry-run support for dependency removal

---

## 🏗️ Architecture Overview

### Current Structure (v0.1)
```
src/
├── analyzer/
│   ├── imports.ts      # Detects unused imports
│   ├── files.ts        # Detects unused files
│   └── dependencies.ts # Detects unused deps (detection only)
├── fixer/
│   └── importFixer.ts  # Removes unused imports
├── cli/
│   └── index.ts        # CLI entry point
└── core.ts             # Main orchestrator
```

### What We Need to Add
```
src/
├── fixer/
│   └── dependencyFixer.ts  # NEW - Remove unused dependencies
└── utils/
    └── packageManager.ts   # NEW - Detect npm/yarn/pnpm
```

---

## 📝 Step-by-Step Implementation

### **PHASE 1: Package Manager Detection** 

You need to detect which package manager the user is using (npm, yarn, pnpm).

#### 1.1 Create `src/utils/packageManager.ts`

**What to write:**
```typescript
// This file detects which package manager the project uses
// and provides the correct uninstall command

import * as fs from 'fs';
import * as path from 'path';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export function detectPackageManager(projectRoot: string): PackageManager {
  // Check for lock files in order of preference
  // 1. Check for pnpm-lock.yaml -> return 'pnpm'
  // 2. Check for yarn.lock -> return 'yarn'
  // 3. Default to 'npm'
  
  // HINT: Use fs.existsSync(path.join(projectRoot, 'lockfile-name'))
}

export function getUninstallCommand(
  packageManager: PackageManager,
  packageName: string,
  isDev: boolean
): string {
  // Return the correct command based on package manager
  // npm: 'npm uninstall <package>' or 'npm uninstall --save-dev <package>'
  // yarn: 'yarn remove <package>'
  // pnpm: 'pnpm remove <package>'
  
  // HINT: Use a switch statement on packageManager
}
```

**Your Task:**
- Implement the logic to detect package manager by checking for lock files
- Implement the command builder for each package manager
- Remember: yarn and pnpm don't need separate flags for dev dependencies

**Test it:** Run `npm run build` to check for TypeScript errors

---

### **PHASE 2: Dependency Fixer**

Now create the actual fixer that removes dependencies.

#### 2.1 Create `src/fixer/dependencyFixer.ts`

**What to write:**
```typescript
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { detectPackageManager, getUninstallCommand } from '../utils/packageManager';

export interface DependencyFixResult {
  success: boolean;
  package: string;
  error?: string;
}

export async function removeDependency(
  packageName: string,
  projectRoot: string,
  isDev: boolean,
  dryRun: boolean = false
): Promise<DependencyFixResult> {
  // 1. Detect package manager
  // 2. Build the uninstall command
  // 3. If dryRun, just return success and log what would happen
  // 4. Otherwise, execute the command using execSync
  // 5. Handle errors and return result
  
  // HINT: Use try-catch for execSync
  // HINT: execSync options: { cwd: projectRoot, stdio: 'inherit' }
}

export async function removeDependencies(
  packages: string[],
  projectRoot: string,
  includeDevDeps: boolean,
  dryRun: boolean = false
): Promise<DependencyFixResult[]> {
  // Loop through packages and call removeDependency for each
  // You need to determine if each package is a dev dependency
  
  // HINT: Read package.json to check if it's in dependencies or devDependencies
}
```

**Your Task:**
- Implement `removeDependency` function
- Handle dry-run mode (just log, don't execute)
- Implement `removeDependencies` to handle multiple packages
- Add proper error handling

**Test it:** Build again with `npm run build`

---

### **PHASE 3: Update CLI Options**

Add the new CLI flags.

#### 3.1 Modify `src/cli/index.ts`

**Find this section** (around line 10-20 where options are defined):
```typescript
program
  .option('--json', 'Output results as JSON')
  .option('--fix', 'Automatically fix unused imports')
  // ... existing options
```

**Add these new options:**
```typescript
  .option('--fix-deps', 'Automatically remove unused dependencies')
  .option('--deps', 'Include dependencies when using --fix (same as --fix --fix-deps)')
  .option('--dry-run', 'Preview changes without applying them (use with --fix or --fix-deps)')
```

**Your Task:**
- Add the three new options to the CLI
- Re-build and test: `npm run build && node bin/devghost.js --help`
- You should see the new options in the help text

---

### **PHASE 4: Update Core Logic**

Now connect everything together in the main orchestrator.

#### 4.1 Modify `src/core.ts`

**Find the main analysis function** and update it to handle the new options.

**What to add:**

1. Import the new dependency fixer at the top:
```typescript
import { removeDependencies } from './fixer/dependencyFixer';
```

2. Update the options interface to include new flags:
```typescript
export interface AnalyzeOptions {
  json?: boolean;
  fix?: boolean;
  fixDeps?: boolean;  // NEW
  deps?: boolean;     // NEW
  dryRun?: boolean;   // NEW
  interactive?: boolean;
  ci?: boolean;
  config?: string;
  includeDev?: boolean;
}
```

3. In the main analyze function, after fixing imports, add dependency fixing:
```typescript
// After import fixing section...

// Handle dependency fixing
const shouldFixDeps = options.fixDeps || (options.fix && options.deps);
if (shouldFixDeps && results.unusedDependencies.length > 0) {
  if (!options.interactive) {
    console.log(chalk.blue('\n🔧 Removing unused dependencies...\n'));
    
    const depResults = await removeDependencies(
      results.unusedDependencies,
      path.dirname(options.config || process.cwd()),
      options.includeDev || false,
      options.dryRun || false
    );
    
    // Log results
    const successful = depResults.filter(r => r.success).length;
    if (options.dryRun) {
      console.log(chalk.yellow(`Would remove ${successful} dependencies`));
    } else {
      console.log(chalk.green(`✓ Removed ${successful} dependencies`));
    }
  }
}
```

**Your Task:**
- Add the import statement
- Update the `AnalyzeOptions` interface
- Add the dependency fixing logic after import fixing
- Maintain consistency with the existing code style

---

### **PHASE 5: Enhanced Interactive Mode**

Update interactive mode to handle dependencies.

#### 5.1 Modify `src/cli/index.ts` (interactive section)

**Find the interactive mode code** (search for "interactive" in the file).

**What to add:**

After handling unused imports interactively, add a section for dependencies:

```typescript
// After import interactive section...

if (results.unusedDependencies.length > 0 && options.fixDeps) {
  console.log(chalk.blue('\n📦 Unused Dependencies:\n'));
  
  for (const dep of results.unusedDependencies) {
    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: `Remove '${dep}' from package.json?`,
      choices: [
        { name: '✓ Remove this dependency', value: 'fix' },
        { name: '⊗ Skip this one', value: 'skip' },
        { name: '⊗ Skip all remaining', value: 'skip-all' },
        { name: '✕ Cancel', value: 'cancel' }
      ]
    }]);
    
    if (answer.action === 'cancel') break;
    if (answer.action === 'skip-all') break;
    if (answer.action === 'skip') continue;
    
    if (answer.action === 'fix') {
      // Call removeDependency here
    }
  }
}
```

**Your Task:**
- Add dependency interactive prompts
- Import and use `removeDependency` from the fixer
- Handle all user choices appropriately

---

## 🧪 Testing Your Implementation

### Manual Testing Steps

1. **Test package manager detection:**
```bash
npm run build
node dist/utils/packageManager.js  # If you add a test main()
```

2. **Test dry-run mode:**
```bash
npm run build
node bin/devghost.js --fix-deps --dry-run
```

3. **Test actual removal:**
```bash
# First, install a package you don't use
npm install lodash

# Then run DevGhost
node bin/devghost.js --fix-deps

# Check if lodash was removed
```

4. **Test combined mode:**
```bash
node bin/devghost.js --fix --deps
```

5. **Test interactive mode:**
```bash
node bin/devghost.js --interactive --fix-deps
```

---

## 📊 Progress Checklist

- [ ] Create `src/utils/packageManager.ts`
  - [ ] Implement `detectPackageManager()`
  - [ ] Implement `getUninstallCommand()`
  - [ ] Test with `npm run build`

- [ ] Create `src/fixer/dependencyFixer.ts`
  - [ ] Implement `removeDependency()`
  - [ ] Implement `removeDependencies()`
  - [ ] Handle dry-run mode
  - [ ] Add error handling

- [ ] Update `src/cli/index.ts`
  - [ ] Add new CLI options (`--fix-deps`, `--deps`, `--dry-run`)
  - [ ] Test with `--help` flag

- [ ] Update `src/core.ts`
  - [ ] Import dependency fixer
  - [ ] Update options interface
  - [ ] Add dependency fixing logic
  - [ ] Test basic flow

- [ ] Enhanced Interactive Mode
  - [ ] Add dependency prompts
  - [ ] Implement user choice handling
  - [ ] Test interactive flow

- [ ] Testing
  - [ ] Manual test: dry-run mode
  - [ ] Manual test: actual removal
  - [ ] Manual test: combined mode
  - [ ] Manual test: interactive mode

- [ ] Documentation
  - [ ] Update README.md with new features
  - [ ] Update version to 0.2.0 in package.json
  - [ ] Add examples of new flags

---

## 💡 Pro Tips

1. **Start Small**: Implement and test each phase before moving to the next
2. **Use console.log**: Add debug logs to understand the flow
3. **Read Existing Code**: Look at how `importFixer.ts` works - use the same patterns
4. **Test with Real Project**: Test on a real project with unused dependencies
5. **Git Commits**: Commit after each phase so you can rollback if needed

---

## 🆘 Common Pitfalls

1. **Path Issues**: Make sure to use `path.join()` for all file paths
2. **Async/Await**: Remember to use `await` when calling async functions
3. **Error Handling**: Always wrap `execSync` in try-catch
4. **Dry Run**: Make sure dry-run doesn't actually execute commands
5. **Package.json Location**: Find it relative to project root, not cwd

---

## 📚 Reference Code Patterns

### Pattern: Reading package.json
```typescript
const pkgPath = path.join(projectRoot, 'package.json');
const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const deps = pkgContent.dependencies || {};
const devDeps = pkgContent.devDependencies || {};
```

### Pattern: Executing shell commands safely
```typescript
try {
  execSync(command, { cwd: projectRoot, stdio: 'inherit' });
  return { success: true };
} catch (error) {
  return { success: false, error: error.message };
}
```

### Pattern: Checking file existence
```typescript
const exists = fs.existsSync(path.join(root, 'file.lock'));
if (exists) {
  // do something
}
```

---

## 🎯 When You're Done

Run this final checklist:

```bash
# 1. Build
npm run build

# 2. Test help
node bin/devghost.js --help

# 3. Test on your own project
node bin/devghost.js --fix-deps --dry-run

# 4. Test actual removal
node bin/devghost.js --fix-deps

# 5. Update version
# Edit package.json: "version": "0.2.0"

# 6. Commit
git add .
git commit -m "feat: implement auto-fix for unused dependencies (v0.2.0)"

# 7. Publish (when ready)
npm publish
```

---

**Ready to start? Begin with PHASE 1 - Package Manager Detection!** 🚀

Let me know if you hit any roadblocks or need clarification on any step!
