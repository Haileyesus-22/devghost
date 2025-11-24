import * as fs from 'node:fs';
import type * as ts from 'typescript';
import type { UnusedImport } from '../types';
import { hasIgnoreComment } from '../utils/fs';
import {
  getImportedIdentifiers,
  getLineAndColumn,
  getLineText,
  isIdentifierUsed,
  isSideEffectImport,
  parseFile,
} from '../utils/tsparser';

/**
 * Analyze a single file for unused imports
 */
export async function analyzeFileImports(filePath: string): Promise<UnusedImport[]> {
  const unusedImports: UnusedImport[] = [];

  const sourceFile = parseFile(filePath);
  if (!sourceFile) {
    return unusedImports;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Get all imports
  sourceFile.forEachChild((node) => {
    if (!require('typescript').isImportDeclaration(node)) {
      return;
    }

    const importDecl = node as import('typescript').ImportDeclaration;

    // Skip side-effect imports (they're intentional)
    if (isSideEffectImport(importDecl)) {
      return;
    }

    const identifiers = getImportedIdentifiers(importDecl);
    const moduleSpecifier = (importDecl.moduleSpecifier as ts.StringLiteral).text;

    for (const identifier of identifiers) {
      // Get line number
      const { line, column } = getLineAndColumn(sourceFile, importDecl.getStart());

      // Check for ignore comment
      if (hasIgnoreComment(fileContent, line)) {
        continue;
      }

      // Check if the identifier is used anywhere in the file
      if (!isIdentifierUsed(sourceFile, identifier)) {
        unusedImports.push({
          file: filePath,
          line,
          column,
          importName: identifier,
          source: moduleSpecifier,
          entireLine: getLineText(sourceFile, line),
        });
      }
    }
  });

  return unusedImports;
}

/**
 * Analyze multiple files for unused imports
 */
export async function analyzeImports(files: string[]): Promise<UnusedImport[]> {
  const allUnusedImports: UnusedImport[] = [];

  for (const file of files) {
    const unused = await analyzeFileImports(file);
    allUnusedImports.push(...unused);
  }

  return allUnusedImports;
}
