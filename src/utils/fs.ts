import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { PackageJson } from '../types';

/**
 * Find the project root by looking for package.json
 */
export function findProjectRoot(startDir: string = process.cwd()): string | null {
  let currentDir = startDir;
  
  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Get all TypeScript/JavaScript files in a directory recursively
 */
export async function getAllFiles(
  dir: string,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']
): Promise<string[]> {
  const patterns = extensions.map(ext => `**/*${ext}`);
  const files: string[] = [];
  
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: dir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
    });
    files.push(...matches);
  }
  
  return [...new Set(files)]; // Remove duplicates
}

/**
 * Read and parse package.json
 */
export function readPackageJson(projectRoot: string): PackageJson | null {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading package.json:', error);
    return null;
  }
}

/**
 * Get file statistics (size and line count)
 */
export function getFileStats(filePath: string): { size: number; lines: number } {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      lines: content.split('\n').length,
    };
  } catch (error) {
    return { size: 0, lines: 0 };
  }
}

/**
 * Calculate the total size of a directory (used for node_modules)
 */
export function getDirectorySize(dirPath: string): number {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Permission errors or other issues
    return 0;
  }
  
  return totalSize;
}

/**
 * Check if a file has a devghost-ignore comment
 */
export function hasIgnoreComment(fileContent: string, line: number): boolean {
  const lines = fileContent.split('\n');
  
  // Check the line before
  if (line > 0) {
    const previousLine = lines[line - 1];
    if (previousLine && previousLine.includes('devghost-ignore-next-line')) {
      return true;
    }
  }
  
  // Check if entire file is ignored
  if (lines[0] && lines[0].includes('devghost-ignore-file')) {
    return true;
  }
  
  return false;
}

/**
 * Check if entire file should be ignored
 */
export function isFileIgnored(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const firstLine = content.split('\n')[0];
    return firstLine.includes('devghost-ignore-file');
  } catch (error) {
    return false;
  }
}

/**
 * Remove a specific line from a file (for auto-fix)
 */
export function removeLineFromFile(filePath: string, lineNumber: number): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    if (lineNumber < 0 || lineNumber >= lines.length) {
      return false;
    }
    
    lines.splice(lineNumber, 1);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error removing line from ${filePath}:`, error);
    return false;
  }
}

/**
 * Check if a file matches ignore patterns
 */
export function matchesIgnorePattern(filePath: string, patterns: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  for (const pattern of patterns) {
    const normalizedPattern = pattern.replace(/\\/g, '/');
    
    // Handle '**/dir/**' pattern – match any path containing '/dir/'
    if (normalizedPattern.startsWith('**/') && normalizedPattern.endsWith('/**')) {
      const segment = normalizedPattern.slice(3, -3); // remove leading '**/' and trailing '/**'
      if (normalizedPath.includes(`/${segment}/`)) {
        return true;
      }
      continue;
    }
    
    // Handle '**/dir' pattern – match any path ending with '/dir'
    if (normalizedPattern.startsWith('**/')) {
      const segment = normalizedPattern.slice(3);
      if (normalizedPath.endsWith(`/${segment}`) || normalizedPath.includes(`/${segment}/`)) {
        return true;
      }
      continue;
    }
    
    // Simple substring or exact match
    if (normalizedPath.includes(normalizedPattern.replace('**/', '')) || normalizedPath.endsWith(normalizedPattern)) {
      return true;
    }
  }
  
  return false;
}
