import { AnalysisResult, DevGhostConfig, AnalysisStats } from './types';
import { findProjectRoot, getAllFiles, readPackageJson, matchesIgnorePattern } from './utils/fs';
import { analyzeImports } from './analyzer/imports';
import { analyzeFiles } from './analyzer/files';
import { analyzeDependencies } from './analyzer/deps';

/**
 * Main analysis function that orchestrates all analyzers
 */
export async function analyze(config: DevGhostConfig = {}): Promise<AnalysisResult> {
  // Find project root
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    throw new Error('Could not find project root (no package.json found)');
  }
  
  // Read package.json
  const packageJson = readPackageJson(projectRoot);
  if (!packageJson) {
    throw new Error(
      'Could not read package.json. Make sure you are in a Node.js project directory.\n' +
      'Run this command from your project root (where package.json is located).'
    );
  }
  
  // Get all source files
  const allFiles = await getAllFiles(projectRoot);
  
  // Apply ignore patterns
  const ignorePatterns = config.ignore || [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/__tests__/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
  ];
  
  const files = allFiles.filter(f => !matchesIgnorePattern(f, ignorePatterns));
  
  // Show progress for large projects
  if (!config.quiet && !config.ci && files.length > 50) {
    console.log(`Analyzing ${files.length} files...`);
  }
  
  // Run analyzers in parallel
  const [unusedImports, unusedFiles, unusedDependencies] = await Promise.all([
    analyzeImports(files),
    analyzeFiles(files, config.entry),
    analyzeDependencies(files, packageJson, projectRoot, config.includeDev),
  ]);
  
  // Calculate statistics
  const stats: AnalysisStats = {
    totalFiles: allFiles.length,
    filesScanned: files.length,
    totalDependencies: Object.keys(packageJson.dependencies || {}).length +
                       Object.keys(packageJson.devDependencies || {}).length,
    potentialSavings: {
      lines: unusedFiles.reduce((sum, f) => sum + f.lines, 0) + unusedImports.length,
      bytes: unusedFiles.reduce((sum, f) => sum + f.size, 0),
      dependencies: unusedDependencies.length,
      dependenciesSize: unusedDependencies.reduce((sum, d) => sum + d.size, 0),
    },
  };
  
  return {
    unusedImports,
    unusedFiles,
    unusedDependencies,
    stats,
  };
}
