import * as fs from 'node:fs';
import * as ts from 'typescript';
import type { UnusedFunction } from '../types';
import { hasIgnoreComment } from '../utils/fs';
import { getLineAndColumn, getLineText, parseFile } from '../utils/tsparser';

interface FunctionInfo {
  name: string;
  start: number;
  end: number;
  line: number;
  column: number;
  type: 'function' | 'arrow' | 'method';
  isExported: boolean;
  entireLine: string;
}

interface UsageInfo {
  name: string;
  pos: number;
}

/**
 * Analyze all files for unused functions
 */
export async function analyzeUnusedFunctions(files: string[]): Promise<UnusedFunction[]> {
  const unusedFunctions: UnusedFunction[] = [];

  for (const file of files) {
    const sourceFile = parseFile(file);
    if (!sourceFile) continue;

    const fileContent = fs.readFileSync(file, 'utf-8');
    const functions: FunctionInfo[] = [];
    const usages: UsageInfo[] = [];

    function visit(node: ts.Node) {
      // 1. Detect Function Declarations
      if (ts.isFunctionDeclaration(node) && node.name) {
        const isExported =
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) || false;
        if (!sourceFile) return;
        const { line, column } = getLineAndColumn(sourceFile, node.name.getStart());

        if (!hasIgnoreComment(fileContent, line)) {
          functions.push({
            name: node.name.text,
            start: node.getStart(),
            end: node.getEnd(),
            line,
            column,
            type: 'function',
            isExported,
            entireLine: getLineText(sourceFile, line),
          });
        }
      }

      // 2. Detect Arrow Functions / Function Expressions in Variables
      if (
        ts.isVariableDeclaration(node) &&
        node.name &&
        ts.isIdentifier(node.name) &&
        node.initializer
      ) {
        if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
          // Check if exported (need to check parent VariableStatement)
          let isExported = false;
          let current: ts.Node = node.parent;
          while (current) {
            if (ts.isVariableStatement(current)) {
              isExported =
                current.modifiers?.some(
                  (m: ts.ModifierLike) => m.kind === ts.SyntaxKind.ExportKeyword
                ) || false;
              break;
            }
            current = current.parent;
          }

          if (!sourceFile) return;
          const { line, column } = getLineAndColumn(sourceFile, node.name.getStart());
          if (!hasIgnoreComment(fileContent, line)) {
            functions.push({
              name: node.name.text,
              start: node.getStart(),
              end: node.getEnd(),
              line,
              column,
              type: 'arrow',
              isExported,
              entireLine: getLineText(sourceFile, line),
            });
          }
        }
      }

      // 3. Detect Usages (Identifiers)
      if (ts.isIdentifier(node)) {
        if (isUsage(node)) {
          usages.push({ name: node.text, pos: node.getStart() });
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    // Analyze
    for (const func of functions) {
      if (func.isExported) continue; // Skip exported functions (handled by unusedExports)

      // Check for usages outside the function itself (handles simple recursion)
      const isUsed = usages.some(
        (u) => u.name === func.name && (u.pos < func.start || u.pos > func.end)
      );

      if (!isUsed) {
        unusedFunctions.push({
          file,
          line: func.line,
          column: func.column,
          functionName: func.name,
          functionType: func.type,
          isExported: false,
          entireLine: func.entireLine,
        });
      }
    }
  }

  return unusedFunctions;
}

/**
 * Check if an identifier is a usage (reference) rather than a declaration
 */
function isUsage(node: ts.Identifier): boolean {
  const parent = node.parent;

  // Declarations
  if (ts.isFunctionDeclaration(parent) && parent.name === node) return false;
  if (ts.isVariableDeclaration(parent) && parent.name === node) return false;
  if (ts.isClassDeclaration(parent) && parent.name === node) return false;
  if (ts.isInterfaceDeclaration(parent) && parent.name === node) return false;
  if (ts.isTypeAliasDeclaration(parent) && parent.name === node) return false;
  if (ts.isEnumDeclaration(parent) && parent.name === node) return false;
  if (ts.isParameter(parent) && parent.name === node) return false;
  if (ts.isMethodDeclaration(parent) && parent.name === node) return false;

  // Property access: obj.prop -> prop is not a usage of variable 'prop'
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;

  // Property assignment: { prop: val } -> prop is not a usage
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;

  // Import/Export specifiers
  if (ts.isImportSpecifier(parent) && (parent.propertyName === node || parent.name === node))
    return false;
  if (ts.isExportSpecifier(parent) && (parent.propertyName === node || parent.name === node))
    return false;

  // Binding elements (destructuring): const { prop } = obj
  if (ts.isBindingElement(parent) && parent.propertyName === node) return false; // { prop: alias } -> prop is property name
  if (ts.isBindingElement(parent) && parent.name === node) return false; // { prop } -> prop is declaration

  return true;
}
