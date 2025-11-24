import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { UnusedExport } from '../types';
import { parseFile, getLineAndColumn, getLineText } from '../utils/tsparser';
import { hasIgnoreComment } from '../utils/fs';

interface ExportInfo {
  file: string;
  name: string;
  line: number;
  column: number;
  exportType: 'named' | 'default' | 'namespace';
  entireLine: string;
}

/**
 * Resolve relative import path to absolute file path
 */
function resolveImportPath(importerFile: string, importPath: string): string | null {
  if (!importPath.startsWith('.')) {
    return null; // Not a relative import
  }

  const importerDir = path.dirname(importerFile);
  let resolvedPath = path.resolve(importerDir, importPath);

  // Normalize to consistent path separators
  resolvedPath = path.normalize(resolvedPath);

  // Try different extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  // First, try with direct extensions
  for (const ext of extensions) {
    const testPath = resolvedPath + ext;
    if (fs.existsSync(testPath)) {
      return path.normalize(testPath);
    }
  }

  // If the path already has an extension and exists AS A FILE (not directory)
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
    return path.normalize(resolvedPath);
  }

  // Try as a directory with index file
  for (const ext of extensions) {
    const testPath = path.join(resolvedPath, `index${ext}`);
    if (fs.existsSync(testPath)) {
      return path.normalize(testPath);
    }
  }

  return null;
}

/**
 * Extract all exports from a source file
 */
function extractExportsFromFile(filePath: string): ExportInfo[] {
  const exports: ExportInfo[] = [];
  const sourceFile = parseFile(filePath);

  if (!sourceFile) {
    return exports;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  function visit(node: ts.Node) {
    // Handle: export function foo() {}
    // Handle: export const bar = ...
    // Handle: export class Baz {}
    if (
      (ts.isFunctionDeclaration(node) || 
       ts.isClassDeclaration(node) || 
       ts.isVariableStatement(node) ||
       ts.isInterfaceDeclaration(node) ||
       ts.isTypeAliasDeclaration(node) ||
       ts.isEnumDeclaration(node)) &&
      node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      const hasDefault = node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
      let exportType: 'named' | 'default' | 'namespace' = hasDefault ? 'default' : 'named';
      let exportName = '';

      if (ts.isVariableStatement(node)) {
        // export const foo = ..., bar = ...
        node.declarationList.declarations.forEach(decl => {
          if (ts.isIdentifier(decl.name)) {
            const { line, column } = getLineAndColumn(sourceFile!, decl.name.getStart());
            
            if (!hasIgnoreComment(fileContent, line)) {
              exports.push({
                file: filePath,
                name: decl.name.text,
                line,
                column,
                exportType,
                entireLine: getLineText(sourceFile!, line),
              });
            }
          }
        });
        return; // Already processed
      } else if (node.name && ts.isIdentifier(node.name)) {
        exportName = node.name.text;
      } else if (hasDefault) {
        exportName = 'default';
      }

      if (exportName) {
        const { line, column } = getLineAndColumn(sourceFile!, node.getStart());
        
        if (!hasIgnoreComment(fileContent, line)) {
          exports.push({
            file: filePath,
            name: exportName,
            line,
            column,
            exportType,
            entireLine: getLineText(sourceFile!, line),
          });
        }
      }
    }

    // Handle: export { x, y, z }
    // Handle: export { x as y }
    if (ts.isExportDeclaration(node)) {
      // Skip re-exports: export { x } from './other'
      if (node.moduleSpecifier) {
        ts.forEachChild(node, visit);
        return;
      }

      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        node.exportClause.elements.forEach(element => {
          const exportName = element.name.text;
          const { line, column } = getLineAndColumn(sourceFile!, element.getStart());
          
          if (!hasIgnoreComment(fileContent, line)) {
            exports.push({
              file: filePath,
              name: exportName,
              line,
              column,
              exportType: 'named',
              entireLine: getLineText(sourceFile!, line),
            });
          }
        });
      }
    }

    // Handle: export default ...
    if (ts.isExportAssignment(node)) {
      const { line, column } = getLineAndColumn(sourceFile!, node.getStart());
      
      if (!hasIgnoreComment(fileContent, line)) {
        exports.push({
          file: filePath,
          name: 'default',
          line,
          column,
          exportType: 'default',
          entireLine: getLineText(sourceFile!, line),
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return exports;
}

/**
 * Extract all imports from a source file and resolve their target files
 */
function extractImportsFromFile(filePath: string): Map<string, Set<string>> {
  // Map: resolved file path -> set of imported names
  const imports = new Map<string, Set<string>>();
  const sourceFile = parseFile(filePath);

  if (!sourceFile) {
    return imports;
  }

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const importPath = node.moduleSpecifier.text;
      
      // Resolve the import path to actual file
      const resolvedPath = resolveImportPath(filePath, importPath);
      
      if (!resolvedPath) {
        return; // Skip external packages
      }

      if (!imports.has(resolvedPath)) {
        imports.set(resolvedPath, new Set());
      }

      const importedNames = imports.get(resolvedPath)!;

      if (node.importClause) {
        // Default import: import Foo from './bar'
        if (node.importClause.name) {
          importedNames.add('default');
        }

        // Named imports: import { x, y } from './bar'
        if (node.importClause.namedBindings) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            node.importClause.namedBindings.elements.forEach(element => {
              // Use the original name being imported (before 'as')
              const importedName = element.propertyName?.text || element.name.text;
              importedNames.add(importedName);
            });
          } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
            // import * as foo from './bar' - imports EVERYTHING
            importedNames.add('*');
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports;
}

/**
 * Analyze all files for unused exports
 */
export async function analyzeUnusedExports(files: string[]): Promise<UnusedExport[]> {
  // Step 1: Extract all exports from all files
  const allExports: ExportInfo[] = [];
  
  for (const file of files) {
    const fileExports = extractExportsFromFile(file);
    allExports.push(...fileExports);
  }

  // Step 2: Build a comprehensive map of all imports
  // Map: target file path -> set of imported names
  const importMap = new Map<string, Set<string>>();

  for (const file of files) {
    const fileImports = extractImportsFromFile(file);
    
    fileImports.forEach((importedNames, targetFile) => {
      if (!importMap.has(targetFile)) {
        importMap.set(targetFile, new Set());
      }
      
      // Merge imported names
      importedNames.forEach(name => {
        importMap.get(targetFile)!.add(name);
      });
    });
  }

  // Step 3: Find unused exports by cross-referencing
  const unusedExports: UnusedExport[] = [];

  for (const exportInfo of allExports) {
    const importedNames = importMap.get(exportInfo.file);
    
    // If no imports from this file at all, or this specific export isn't imported
    if (!importedNames) {
      // No one imports from this file at all
      unusedExports.push({
        file: exportInfo.file,
        line: exportInfo.line,
        column: exportInfo.column,
        exportName: exportInfo.name,
        exportType: exportInfo.exportType,
        entireLine: exportInfo.entireLine,
      });
    } else if (!importedNames.has('*') && !importedNames.has(exportInfo.name)) {
      // Someone imports from this file, but not this specific export
      // (and it's not a wildcard import)
      unusedExports.push({
        file: exportInfo.file,
        line: exportInfo.line,
        column: exportInfo.column,
        exportName: exportInfo.name,
        exportType: exportInfo.exportType,
        entireLine: exportInfo.entireLine,
      });
    }
  }

  return unusedExports;
}
