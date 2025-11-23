import { UnusedDependency, PackageJson } from '../types';
import { parseFile, getImportedPackages } from '../utils/tsparser';
import { getDirectorySize } from '../utils/fs';
import * as path from 'path';

/**
 * Get all packages imported across all project files
 */
function getAllImportedPackages(files: string[]): Set<string> {
  const allPackages = new Set<string>();
  
  for (const file of files) {
    const sourceFile = parseFile(file);
    if (!sourceFile) {
      continue;
    }
    
    const packages = getImportedPackages(sourceFile);
    for (const pkg of packages) {
      allPackages.add(pkg);
    }
  }
  
  return allPackages;
}

/**
 * Node.js built-in modules (should not be considered as dependencies)
 */
const BUILTIN_MODULES = new Set([
  'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console',
  'constants', 'crypto', 'dgram', 'diagnostics_channel', 'dns', 'domain',
  'events', 'fs', 'http', 'http2', 'https', 'inspector', 'module', 'net',
  'os', 'path', 'perf_hooks', 'process', 'punycode', 'querystring', 'readline',
  'repl', 'stream', 'string_decoder', 'sys', 'timers', 'tls', 'trace_events',
  'tty', 'url', 'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib',
]);

/**
 * Analyze dependencies to find unused packages
 */
export async function analyzeDependencies(
  files: string[],
  packageJson: PackageJson,
  projectRoot: string,
  includeDev: boolean = false
): Promise<UnusedDependency[]> {
  const unusedDependencies: UnusedDependency[] = [];
  
  // Get all imported packages from the codebase
  const importedPackages = getAllImportedPackages(files);
  
  // Get dependencies from package.json
  const dependencies = packageJson.dependencies || {};
  const devDependencies = includeDev ? (packageJson.devDependencies || {}) : {};
  
  // Check each dependency
  for (const [depName, version] of Object.entries(dependencies)) {
    if (BUILTIN_MODULES.has(depName)) {
      continue;
    }
    
    // Check if this dependency is imported anywhere
    if (!importedPackages.has(depName)) {
      // Calculate size in node_modules
      const depPath = path.join(projectRoot, 'node_modules', depName);
      const size = getDirectorySize(depPath);
      
      unusedDependencies.push({
        name: depName,
        type: 'dependency',
        size,
      });
    }
  }
  
  // Check devDependencies if requested
  if (includeDev) {
    for (const [depName, version] of Object.entries(devDependencies)) {
      if (BUILTIN_MODULES.has(depName)) {
        continue;
      }
      
      // Skip type packages - they're often not directly imported
      if (depName.startsWith('@types/')) {
        // Check if the base package is imported
        const basePackage = depName.replace('@types/', '');
        if (importedPackages.has(basePackage)) {
          continue;
        }
      }
      
      if (!importedPackages.has(depName)) {
        const depPath = path.join(projectRoot, 'node_modules', depName);
        const size = getDirectorySize(depPath);
        
        unusedDependencies.push({
          name: depName,
          type: 'devDependency',
          size,
        });
      }
    }
  }
  
  return unusedDependencies;
}
