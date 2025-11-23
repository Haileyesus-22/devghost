import { UnusedFile } from '../types';
import { getFileStats, isFileIgnored } from '../utils/fs';
import { parseFile } from '../utils/tsparser';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Build a dependency graph of which files import which
 */
function buildDependencyGraph(files: string[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  
  for (const file of files) {
    const dependencies = new Set<string>();
    const sourceFile = parseFile(file);
    
    if (!sourceFile) {
      continue;
    }
    
    // Extract all import paths
    sourceFile.forEachChild((node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        
        // Only track relative imports (actual project files)
        if (moduleSpecifier.startsWith('.')) {
          const importedFilePath = resolveImportPath(file, moduleSpecifier, files);
          if (importedFilePath) {
            dependencies.add(importedFilePath);
          }
        }
      }
      
      // Also check dynamic imports
      if (ts.isCallExpression(node)) {
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
          const arg = node.arguments[0];
          if (ts.isStringLiteral(arg)) {
            const moduleSpecifier = arg.text;
            if (moduleSpecifier.startsWith('.')) {
              const importedFilePath = resolveImportPath(file, moduleSpecifier, files);
              if (importedFilePath) {
                dependencies.add(importedFilePath);
              }
            }
          }
        }
      }
    });
    
    graph.set(file, dependencies);
  }
  
  return graph;
}

/**
 * Resolve an import path to an absolute file path
 */
function resolveImportPath(fromFile: string, importPath: string, allFiles: string[]): string | null {
  const fromDir = path.dirname(fromFile);
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  
  // Try with original extension (if any)
  let resolved = path.resolve(fromDir, importPath);
  let normalized = path.normalize(resolved);
  
  if (allFiles.includes(normalized)) {
    return normalized;
  }
  
  // Try with different extensions
  for (const ext of extensions) {
    resolved = path.resolve(fromDir, importPath + ext);
    normalized = path.normalize(resolved);
    
    if (allFiles.includes(normalized)) {
      return normalized;
    }
  }
  
  return null;
}

/**
 * Find all files that are imported (directly or transitively) from entry points
 */
function findReachableFiles(entryPoints: string[], graph: Map<string, Set<string>>): Set<string> {
  const reachable = new Set<string>();
  const queue = [...entryPoints];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (reachable.has(current)) {
      continue;
    }
    
    reachable.add(current);
    
    const dependencies = graph.get(current) || new Set();
    for (const dep of dependencies) {
      if (!reachable.has(dep)) {
        queue.push(dep);
      }
    }
  }
  
  return reachable;
}

/**
 * Identify entry point files
 */
function identifyEntryPoints(files: string[], configuredEntryPoints?: string[], projectRoot?: string): string[] {
  if (configuredEntryPoints && configuredEntryPoints.length > 0) {
    const entryPoints: string[] = [];
    
    for (const ep of configuredEntryPoints) {
      // If entry point is relative, try to find matching absolute path
      for (const file of files) {
        if (file.endsWith(ep) || file.endsWith(path.normalize(ep))) {
          entryPoints.push(file);
          break;
        }
      }
    }
    
    return entryPoints;
  }
  
  // Default entry points
  const defaultEntryPoints = [
    'src/index.ts',
    'src/index.tsx',
    'src/index.js',
    'src/index.jsx',
    'src/main.ts',
    'src/main.tsx',
    'src/app.ts',
    'src/app.tsx',
    'index.ts',
    'index.js',
  ];
  
  const entryPoints: string[] = [];
  
  for (const file of files) {
    for (const entryPoint of defaultEntryPoints) {
      if (file.endsWith(entryPoint) || file.endsWith(entryPoint.replace('src/', ''))) {
        entryPoints.push(file);
      }
    }
  }
  
  // If no entry points found, consider all files as potential entry points
  // This is safer than marking everything as unused
  if (entryPoints.length === 0) {
    return files;
  }
  
  return entryPoints;
}

/**
 * Analyze files to find unused/orphaned files
 */
export async function analyzeFiles(
  files: string[],
  configuredEntryPoints?: string[]
): Promise<UnusedFile[]> {
  const unusedFiles: UnusedFile[] = [];
  
  // Filter out ignored files
  const validFiles = files.filter(f => !isFileIgnored(f));
  
  // Build dependency graph
  const graph = buildDependencyGraph(validFiles);
  
  // Identify entry points
  const entryPoints = identifyEntryPoints(validFiles, configuredEntryPoints);
  
  // Find all reachable files from entry points
  const reachable = findReachableFiles(entryPoints, graph);
  
  // Any file not reachable is unused
  for (const file of validFiles) {
    if (!reachable.has(file) && !entryPoints.includes(file)) {
      const stats = getFileStats(file);
      unusedFiles.push({
        path: file,
        reason: 'Not imported by any other file',
        size: stats.size,
        lines: stats.lines,
      });
    }
  }
  
  return unusedFiles;
}
