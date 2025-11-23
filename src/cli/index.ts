#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { analyze } from '../core';
import { fixUnusedImports, getFixPreview } from '../fixer';
import { removeDependencies } from '../fixer/dependencyFixer';
import { formatResults, error, success, info, warning } from '../utils/logger';
import { DevGhostConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

const packageJson = require('../../package.json');

program
  .name('devghost')
  .description('👻 Find dead code, dead imports, and dead dependencies')
  .version(packageJson.version)
  .argument('[path]', 'Path to analyze', process.cwd())
  .option('--json', 'Output results as JSON')
  .option('--fix', 'Automatically remove unused imports')
  .option('--dry-run', 'Preview fixes without applying (use with --fix)')
  .option('--interactive', 'Review each issue interactively')
  .option('--ci', 'CI mode (minimal output, exit code 1 if issues found)')
  .option('--config <path>', 'Path to config file')
  .option('--include-dev', 'Include devDependencies in analysis')
  .option('--fix-deps', 'Automatically remove unused dependencies')
  .option('--deps','Include dependencies when using --fix')
  .option('--dry-run','Preview fixes without applying (use with --fix-deps)')
  .option('-y, --yes', 'skip confirmation prompts (auto-confirm)')
  .action(async (targetPath: string, options) => {
    try {
      // Change to target directory
      process.chdir(targetPath);
      
      // Load config
      let config: DevGhostConfig = {
        includeDev: options.includeDev || false,
        fix: options.fix || false,
        fixDeps: options.fixDeps || false,
        deps: options.deps || false,
        interactive: options.interactive || false,
        ci: options.ci || false,
        dryRun: options.dryRun || false,
        yes: options.yes || false,
      };
      
      // Load config file if specified
      if (options.config) {
        const configPath = path.resolve(options.config);
        if (fs.existsSync(configPath)) {
          const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          config = { ...config, ...fileConfig };
        }
      } else {
        // Try to load devghost.config.json from current directory
        const defaultConfigPath = path.join(process.cwd(), 'devghost.config.json');
        if (fs.existsSync(defaultConfigPath)) {
          const fileConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf-8'));
          config = { ...config, ...fileConfig };
        }
      }
      
      // Run analysis
      if (!config.ci) {
        info('Scanning project...');
      }
      
      const results = await analyze(config);
      
      // Handle CI mode
      if (config.ci) {
        const totalIssues = 
          results.unusedImports.length + 
          results.unusedFiles.length + 
          results.unusedDependencies.length;
        
        if (totalIssues > 0) {
          console.log(`Found ${totalIssues} issues`);
          process.exit(1);
        } else {
          console.log('No issues found');
          process.exit(0);
        }
      }
      
      // Handle JSON output
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }
      
      // Handle interactive mode
      if (config.interactive && (results.unusedImports.length > 0 || results.unusedDependencies.length > 0)) {
        await handleInteractiveMode(results);
        return;
      }
      
      // Handle auto-fix
      if (config.fix && results.unusedImports.length > 0) {
        if (config.dryRun) {
          info('DRY RUN MODE - No files will be modified');
          console.log(getFixPreview(results.unusedImports));
        } else {
          warning(`About to remove ${results.unusedImports.length} unused imports`);
          
          const fixResults = await fixUnusedImports(results.unusedImports, {
            dryRun: false,
            createBackup: false,
          });
          
          const successful = fixResults.filter(r => r.success).length;
          const failed = fixResults.filter(r => !r.success).length;
          
          success(`Fixed ${successful} files`);
          if (failed > 0) {
            error(`Failed to fix ${failed} files`);
          }
          
        }
        return;
      }
      
      // Handle dependency fixing
      const shouldFixDeps = config.fixDeps || (config.fix && config.deps);
      
      if (shouldFixDeps && results.unusedDependencies.length > 0) {
        if (config.dryRun) {
          info('DRY RUN MODE - No dependencies will be removed');
          warning(`Would remove ${results.unusedDependencies.length} unused dependencies:`);
          results.unusedDependencies.forEach(dep => {
            console.log(`  - ${dep.name}`);
          });
        } else {
          warning(`About to remove ${results.unusedDependencies.length} unused dependencies:`);
          
          // Show the list of dependencies to be removed
          console.log('');
          results.unusedDependencies.forEach(dep => {
            console.log(`  📦 ${dep.name} (${dep.type}) - ${(dep.size / 1024).toFixed(2)} KB`);
          });
          console.log('');
          
         if(!config.yes){
          const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to remove these ${results.unusedDependencies.length} dependencies?`,
                default: false,
            }
        ]);
        if(!confirm){
          info('Cancelled');
          return;
        }
         }
          const projectRoot = process.cwd();
          const depResults = await removeDependencies(
            results.unusedDependencies.map(d => d.name),
            projectRoot,
            config.includeDev || false,
            false
          );
          
          const successful = depResults.filter(r => r.success).length;
          const failed = depResults.filter(r => !r.success);
          
          success(`Removed ${successful} dependencies`);
          if (failed.length > 0) {
            error(`Failed to remove ${failed.length} dependencies:`);
            failed.forEach(f => console.log(`  - ${f.packageName}: ${f.error}`));
          }
        }
        return;
      }
      
      // Display results
      console.log(formatResults(results, true));
      
      // Exit with error code if issues found (for CI integration)
      const totalIssues = 
        results.unusedImports.length + 
        results.unusedFiles.length + 
        results.unusedDependencies.length;
      
      if (totalIssues > 0) {
        process.exit(0); // Don't exit with error in normal mode, only in CI mode
      }
      
    } catch (err) {
      error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

/**
 * Handle interactive mode
 */
async function handleInteractiveMode(results: any) {
  const unusedImports = results.unusedImports || [];
  const unusedDependencies = results.unusedDependencies || [];
  
  // Handle unused imports
  if (unusedImports.length > 0) {
    info(`Found ${unusedImports.length} unused imports. Let's review them...`);
    
    const toFix: any[] = [];
    let skipAll = false;
    
    for (const imp of unusedImports) {
      if (skipAll) {
        break;
      }
      
      console.log(`\n${imp.file}:${imp.line + 1}`);
      console.log(`  ${imp.entireLine.trim()}`);
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What do you want to do?',
          choices: [
            { name: 'Fix (remove this import)', value: 'fix' },
            { name: 'Skip this one', value: 'skip' },
            { name: 'Skip all remaining', value: 'skip-all' },
            { name: 'Cancel', value: 'cancel' },
          ],
        },
      ]);
      
      if (action === 'fix') {
        toFix.push(imp);
      } else if (action === 'skip-all') {
        skipAll = true;
      } else if (action === 'cancel') {
        info('Cancelled');
        return;
      }
    }
    
    if (toFix.length > 0) {
      info(`Fixing ${toFix.length} imports...`);
      const fixResults = await fixUnusedImports(toFix);
      const successful = fixResults.filter(r => r.success).length;
      success(`Fixed ${successful} imports`);
    } else {
      info('No import changes made');
    }
  }
  
  // Handle unused dependencies
  if (unusedDependencies.length > 0) {
    info(`\nFound ${unusedDependencies.length} unused dependencies. Let's review them...`);
    
    const depsToFix: string[] = [];
    let skipAllDeps = false;
    
    for (const dep of unusedDependencies) {
      if (skipAllDeps) {
        break;
      }
      
      console.log(`\n📦 ${dep.name}`);
      console.log(`   Type: ${dep.type}`);
      console.log(`   Size: ${(dep.size / 1024).toFixed(2)} KB`);
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What do you want to do?',
          choices: [
            { name: '✓ Remove this dependency', value: 'fix' },
            { name: '⊗ Skip this one', value: 'skip' },
            { name: '⊗ Skip all remaining', value: 'skip-all' },
            { name: '✕ Cancel', value: 'cancel' },
          ],
        },
      ]);
      
      if (action === 'fix') {
        depsToFix.push(dep.name);
      } else if (action === 'skip-all') {
        skipAllDeps = true;
      } else if (action === 'cancel') {
        info('Cancelled');
        return;
      }
    }
    
    if (depsToFix.length > 0) {
      info(`\nRemoving ${depsToFix.length} dependencies...`);
      const depResults = await removeDependencies(
        depsToFix,
        process.cwd(),
        false,
        false
      );
      const successful = depResults.filter(r => r.success).length;
      success(`Removed ${successful} dependencies`);
    } else {
      info('No dependency changes made');
    }
  }
}

program.parse();
