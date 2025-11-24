import chalk from 'chalk';
import type { AnalysisResult, AnalysisStats } from '../types';

/**
 * Log a success message
 */
export function success(message: string): void {
  console.log(`${chalk.green('✓')} ${message}`);
}

/**
 * Log an error message
 */
export function error(message: string): void {
  console.log(`${chalk.red('✗')} ${message}`);
}

/**
 * Log a warning message
 */
export function warning(message: string): void {
  console.log(`${chalk.yellow('⚠')} ${message}`);
}

/**
 * Log an info message
 */
export function info(message: string): void {
  console.log(`${chalk.blue('ℹ')} ${message}`);
}

/**
 * Format bytes to human-readable size
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

/**
 * Format analysis statistics
 */
export function formatStats(stats: AnalysisStats): string {
  const { potentialSavings } = stats;

  let output = chalk.bold('\n💾 Potential Savings:\n');

  if (potentialSavings.bytes > 0) {
    output += `   - ${formatSize(potentialSavings.bytes)} of code\n`;
  }

  if (potentialSavings.lines > 0) {
    output += `   - ${potentialSavings.lines.toLocaleString()} lines\n`;
  }

  if (potentialSavings.dependencies > 0) {
    output += `   - ${potentialSavings.dependencies} npm ${potentialSavings.dependencies === 1 ? 'package' : 'packages'}`;
    if (potentialSavings.dependenciesSize > 0) {
      output += ` (${formatSize(potentialSavings.dependenciesSize)} in node_modules)`;
    }
    output += '\n';
  }

  return output;
}

/**
 * Format analysis results for pretty printing
 */
export function formatResults(results: AnalysisResult, showStats: boolean = true): string {
  let output = '';

  output += chalk.bold.cyan('\n👻 DevGhost - Dead Code Detective\n');
  output += `${chalk.cyan('='.repeat(40))}\n\n`;

  const totalIssues =
    results.unusedImports.length +
    results.unusedFiles.length +
    results.unusedDependencies.length +
    results.unusedExports.length +
    results.unusedFunctions.length;

  if (totalIssues === 0) {
    output += chalk.green('✓ No dead code found! Your project is clean. 🎉\n');
    return output;
  }

  // Unused imports
  if (results.unusedImports.length > 0) {
    output += chalk.red(
      `❌ Found ${results.unusedImports.length} unused import${results.unusedImports.length === 1 ? '' : 's'}:\n`
    );
    for (const imp of results.unusedImports.slice(0, 10)) {
      output +=
        chalk.gray(`  - ${imp.file}:${imp.line + 1} - `) +
        chalk.yellow(`'${imp.importName}'`) +
        chalk.gray(` from '${imp.source}'\n`);
    }

    if (results.unusedImports.length > 10) {
      output += chalk.gray(`  ... and ${results.unusedImports.length - 10} more\n`);
    }
    output += '\n';
  }

  // Unused exports
  if (results.unusedExports.length > 0) {
    output += chalk.red(
      `❌ Found ${results.unusedExports.length} unused export${results.unusedExports.length === 1 ? '' : 's'}:\n`
    );
    for (const exp of results.unusedExports.slice(0, 10)) {
      output +=
        chalk.gray(`  - ${exp.file}:${exp.line + 1} - `) +
        chalk.yellow(`'${exp.exportName}'`) +
        chalk.gray(` (${exp.exportType})\n`);
    }

    if (results.unusedExports.length > 10) {
      output += chalk.gray(`  ... and ${results.unusedExports.length - 10} more\n`);
    }
    output += '\n';
  }

  // Unused functions
  if (results.unusedFunctions.length > 0) {
    output += chalk.red(
      `❌ Found ${results.unusedFunctions.length} unused function${results.unusedFunctions.length === 1 ? '' : 's'}:\n`
    );
    for (const func of results.unusedFunctions.slice(0, 10)) {
      output +=
        chalk.gray(`  - ${func.file}:${func.line + 1} - `) +
        chalk.yellow(`'${func.functionName}'`) +
        chalk.gray(` (${func.functionType})\n`);
    }

    if (results.unusedFunctions.length > 10) {
      output += chalk.gray(`  ... and ${results.unusedFunctions.length - 10} more\n`);
    }
    output += '\n';
  }

  // Unused variables
  if (results.unusedVariables.length > 0) {
    output += chalk.red(
      `❌ Found ${results.unusedVariables.length} unused variable${results.unusedVariables.length === 1 ? '' : 's'}:\n`
    );
    for (const variable of results.unusedVariables.slice(0, 10)) {
      output +=
        chalk.gray(`  - ${variable.file}:${variable.line + 1} - `) +
        chalk.yellow(`'${variable.variableName}'`) +
        chalk.gray(` (${variable.variableType})\n`);
    }

    if (results.unusedVariables.length > 10) {
      output += chalk.gray(`  ... and ${results.unusedVariables.length - 10} more\n`);
    }
    output += '\n';
  }

  // Unused files
  if (results.unusedFiles.length > 0) {
    output += chalk.red(
      `❌ Found ${results.unusedFiles.length} unused file${results.unusedFiles.length === 1 ? '' : 's'}:\n`
    );
    for (const file of results.unusedFiles.slice(0, 10)) {
      output +=
        chalk.gray(`  - ${file.path} `) +
        chalk.dim(`(${formatSize(file.size)}, ${file.lines} lines)\n`);
    }

    if (results.unusedFiles.length > 10) {
      output += chalk.gray(`  ... and ${results.unusedFiles.length - 10} more\n`);
    }
    output += '\n';
  }

  // Unused dependencies
  if (results.unusedDependencies.length > 0) {
    output += chalk.red(
      `❌ Found ${results.unusedDependencies.length} unused dependenc${results.unusedDependencies.length === 1 ? 'y' : 'ies'}:\n`
    );
    for (const dep of results.unusedDependencies.slice(0, 10)) {
      output += chalk.gray(`  - ${dep.name} `);
      if (dep.size > 0) {
        output += chalk.dim(`(${formatSize(dep.size)} in node_modules)`);
      }
      output += '\n';
    }

    if (results.unusedDependencies.length > 10) {
      output += chalk.gray(`  ... and ${results.unusedDependencies.length - 10} more\n`);
    }
    output += '\n';
  }

  // Statistics
  if (showStats && results.stats.potentialSavings.bytes > 0) {
    output += formatStats(results.stats);
  }

  // Summary
  output += chalk.bold(`\nSummary: ${totalIssues} issue${totalIssues === 1 ? '' : 's'} found\n`);

  // Helpful hints
  if (results.unusedImports.length > 0) {
    output += chalk.dim(`\n💡 Run 'devghost --fix' to automatically remove unused imports\n`);
    output += chalk.dim(`💡 Run 'devghost --interactive' to review each issue\n`);
  }

  return output;
}

/**
 * Create a simple progress indicator
 */
export function createProgressBar(total: number): {
  update: (current: number) => void;
  finish: () => void;
} {
  let lastProgress = 0;

  return {
    update: (current: number) => {
      const progress = Math.floor((current / total) * 100);
      if (progress > lastProgress) {
        process.stdout.write(`\rScanning... ${progress}%`);
        lastProgress = progress;
      }
    },
    finish: () => {
      process.stdout.write(`\r${' '.repeat(50)}\r`); // Clear the line
      success(`Scanned ${total} files`);
    },
  };
}
