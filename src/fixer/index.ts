import { UnusedImport, UnusedFunction, FixResult } from '../types';
import * as fs from 'fs';
import * as ts from 'typescript';

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
/**
 * Remove unused functions from a single file
 */
function fixFileFunctions(filePath: string, unusedFunctions: UnusedFunction[]): FixResult {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Find nodes to remove
    const nodesToRemove: { start: number, end: number }[] = [];
    
    function visit(node: ts.Node) {
      // Check if this node corresponds to one of our unused functions
      for (const func of unusedFunctions) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        
        // Match by line number (approximate) and name
        if (line === func.line) {
          if (
            (ts.isFunctionDeclaration(node) && node.name?.text === func.functionName) ||
            (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === func.functionName)) ||
            (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === func.functionName)
          ) {
            nodesToRemove.push({ start: node.getFullStart(), end: node.getEnd() });
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    
    // Sort by start position descending to remove from bottom up
    nodesToRemove.sort((a, b) => b.start - a.start);
    
    let newContent = content;
    for (const range of nodesToRemove) {
      newContent = newContent.substring(0, range.start) + newContent.substring(range.end);
    }
    
    fs.writeFileSync(filePath, newContent, 'utf-8');
    
    return {
      file: filePath,
      linesRemoved: nodesToRemove.length, // Approximation
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
 * Auto-fix unused functions in all files
 */
export async function fixUnusedFunctions(
  unusedFunctions: UnusedFunction[],
  options: {
    dryRun?: boolean;
    createBackup?: boolean;
  } = {}
): Promise<FixResult[]> {
  const { dryRun = false, createBackup: shouldBackup = false } = options;
  const results: FixResult[] = [];
  
  // Group by file
  const grouped = new Map<string, UnusedFunction[]>();
  for (const func of unusedFunctions) {
    if (!grouped.has(func.file)) {
      grouped.set(func.file, []);
    }
    grouped.get(func.file)!.push(func);
  }
  
  for (const [file, functions] of grouped.entries()) {
    if (dryRun) {
      results.push({
        file,
        linesRemoved: functions.length,
        success: true,
      });
    } else {
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
      
      const result = fixFileFunctions(file, functions);
      results.push(result);
    }
  }
  
  return results;
}
