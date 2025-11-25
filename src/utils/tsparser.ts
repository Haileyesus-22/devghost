import * as fs from 'node:fs';
import * as ts from 'typescript';

/**
 * Parse a TypeScript/JavaScript file using the TS Compiler API
 */
export function parseFile(filePath: string): ts.SourceFile | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Extract all import declarations from a source file
 */
export function extractImports(sourceFile: ts.SourceFile): ts.ImportDeclaration[] {
  const imports: ts.ImportDeclaration[] = [];

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      imports.push(node);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports;
}

/**
 * Extract all export declarations from a source file
 */
export function extractExports(sourceFile: ts.SourceFile): ts.ExportDeclaration[] {
  const exports: ts.ExportDeclaration[] = [];

  function visit(node: ts.Node) {
    if (ts.isExportDeclaration(node)) {
      exports.push(node);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return exports;
}

/**
 * Check if an identifier is used in the source file
 */
export function isIdentifierUsed(sourceFile: ts.SourceFile, identifierName: string): boolean {
  let isUsed = false;

  function visit(node: ts.Node) {
    // Skip import declarations themselves
    if (ts.isImportDeclaration(node)) {
      return;
    }

    // Check if this is an identifier with the name we're looking for
    if (ts.isIdentifier(node) && node.text === identifierName) {
      isUsed = true;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return isUsed;
}

/**
 * Extract package names from all imports in a source file
 */
export function getImportedPackages(sourceFile: ts.SourceFile): Set<string> {
  const packages = new Set<string>();
  const imports = extractImports(sourceFile);

  for (const importDecl of imports) {
    if (ts.isStringLiteral(importDecl.moduleSpecifier)) {
      const moduleName = importDecl.moduleSpecifier.text;

      // Extract package name (handle scoped packages)
      if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
        // Relative import, skip
        continue;
      }

      // Extract the package name
      let packageName: string;
      if (moduleName.startsWith('@')) {
        // Scoped package: @scope/package
        const parts = moduleName.split('/');
        packageName = parts.slice(0, 2).join('/');
      } else {
        // Regular package: package or package/subpath
        packageName = moduleName.split('/')[0];
      }

      packages.add(packageName);
    }
  }

  return packages;
}

/**
 * Get the text of a specific line in the source file
 */
export function getLineText(sourceFile: ts.SourceFile, lineNumber: number): string {
  const lines = sourceFile.text.split('\n');
  return lines[lineNumber] || '';
}

/**
 * Get line and column from a position in the source file
 * Returns 1-indexed line numbers (line 1 = first line) for consistency
 */
export function getLineAndColumn(
  sourceFile: ts.SourceFile,
  pos: number
): { line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
  // TypeScript returns 0-indexed line numbers, convert to 1-indexed
  return { line: line + 1, column: character };
}

/**
 * Get all identifiers imported from an import declaration
 */
export function getImportedIdentifiers(importDecl: ts.ImportDeclaration): string[] {
  const identifiers: string[] = [];

  if (!importDecl.importClause) {
    // Side-effect import: import './file'
    return [];
  }

  const { importClause } = importDecl;

  // Default import: import Foo from 'bar'
  if (importClause.name) {
    identifiers.push(importClause.name.text);
  }

  // Named imports: import { a, b } from 'bar'
  if (importClause.namedBindings) {
    if (ts.isNamedImports(importClause.namedBindings)) {
      for (const element of importClause.namedBindings.elements) {
        identifiers.push(element.name.text);
      }
    } else if (ts.isNamespaceImport(importClause.namedBindings)) {
      // Namespace import: import * as foo from 'bar'
      identifiers.push(importClause.namedBindings.name.text);
    }
  }

  return identifiers;
}

/**
 * Check if an import is a type-only import
 */
export function isTypeOnlyImport(importDecl: ts.ImportDeclaration): boolean {
  return importDecl.importClause?.isTypeOnly || false;
}

/**
 * Check if an import is a side-effect import (no imported identifiers)
 */
export function isSideEffectImport(importDecl: ts.ImportDeclaration): boolean {
  return !importDecl.importClause;
}

/**
 * Create a source file from file path and content
 */
export function createSourceFile(filePath: string, content?: string): ts.SourceFile {
  const fileContent = content || fs.readFileSync(filePath, 'utf-8');
  return ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
}

/**
 * Check if a file should be ignored based on devghost-ignore-file comment
 */
export function shouldIgnoreFile(content: string): boolean {
  const firstLines = content.split('\n').slice(0, 10).join('\n');
  return firstLines.includes('devghost-ignore-file');
}

/**
 * Check if a line should be ignored based on devghost-ignore-next-line comment
 */
export function shouldIgnoreLine(content: string, lineNumber: number): boolean {
  const lines = content.split('\n');
  if (lineNumber > 0 && lineNumber <= lines.length) {
    const previousLine = lines[lineNumber - 1];
    return previousLine.includes('devghost-ignore-next-line');
  }
  return false;
}
