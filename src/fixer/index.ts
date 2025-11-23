import { UnusedImport, FixResult } from '../types';
import * as fs from 'fs';

/**
 * Group unused imports by file for efficient processing
 */
function groupByFile(unusedImports: UnusedImport[]): Map<string, UnusedImport[]> {
  const grouped = new Map<string, UnusedImport[]>();
  
  for (const imp of unusedImports) {
    if (!grouped.has(imp.file)) {
      grouped.set(imp.file, []);
    }
    grouped.get(imp.file)!.push(imp);
  }
  
  return grouped;
}

/**
 * Remove unused imports from a single file
 */
function fixFileImports(filePath: string, unusedImports: UnusedImport[]): FixResult {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Sort by line number descending so we can remove from bottom to top
    // This prevents line number shifts
    const sortedImports = [...unusedImports].sort((a, b) => b.line - a.line);
    
    let linesRemoved = 0;
    
    for (const imp of sortedImports) {
      if (imp.line >= 0 && imp.line < lines.length) {
        // Check if this is the entire import statement
        const line = lines[imp.line];
        
        // Simple heuristic: if the line is an import statement, remove it
        if (line.trim().startsWith('import ')) {
          lines.splice(imp.line, 1);
          linesRemoved++;
        }
      }
    }
    
    // Write the fixed content back
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    
    return {
      file: filePath,
      linesRemoved,
      success: true,
    };
  } catch (error) {
    return {
      file: filePath,
      linesRemoved: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a backup of a file
 */
function createBackup(filePath: string): string {
  const backupPath = `${filePath}.devghost-backup`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

/**
 * Auto-fix unused imports in all files
 */
export async function fixUnusedImports(
  unusedImports: UnusedImport[],
  options: {
    dryRun?: boolean;
    createBackup?: boolean;
  } = {}
): Promise<FixResult[]> {
  const { dryRun = false, createBackup: shouldBackup = false } = options;
  const results: FixResult[] = [];
  
  // Group by file
  const grouped = groupByFile(unusedImports);
  
  for (const [file, imports] of grouped.entries()) {
    if (dryRun) {
      // In dry-run mode, just report what would be done
      results.push({
        file,
        linesRemoved: imports.length,
        success: true,
      });
    } else {
      // Create backup if requested
      if (shouldBackup) {
        try {
          createBackup(file);
        } catch (error) {
          results.push({
            file,
            linesRemoved: 0,
            success: false,
            error: 'Failed to create backup',
          });
          continue;
        }
      }
      
      // Fix the file
      const result = fixFileImports(file, imports);
      results.push(result);
    }
  }
  
  return results;
}

/**
 * Get a preview of what will be fixed
 */
export function getFixPreview(unusedImports: UnusedImport[]): string {
  const grouped = groupByFile(unusedImports);
  let preview = '';
  
  for (const [file, imports] of grouped.entries()) {
    preview += `\n${file}:\n`;
    for (const imp of imports) {
      preview += `  - Line ${imp.line + 1}: ${imp.entireLine.trim()}\n`;
    }
  }
  
  return preview;
}
