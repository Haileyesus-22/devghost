import * as fs from 'node:fs';
import * as ts from 'typescript';
import type { UnusedVariable } from '../types';
import { createSourceFile, shouldIgnoreFile } from '../utils/tsparser';

/**
 * Analyze TypeScript files for unused variables
 */
export function analyzeUnusedVariables(files: string[]): UnusedVariable[] {
  const unusedVariables: UnusedVariable[] = [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, 'utf-8');
    if (shouldIgnoreFile(content)) continue;

    const sourceFile = createSourceFile(file, content);
    const fileVariables = findUnusedVariablesInFile(sourceFile, file);
    unusedVariables.push(...fileVariables);
  }

  return unusedVariables;
}

interface VariableInfo {
  name: string;
  line: number;
  column: number;
  variableType: 'const' | 'let' | 'var' | 'parameter';
  scopeType: 'function' | 'block' | 'module';
  entireLine: string;
  node: ts.Node;
}

function findUnusedVariablesInFile(sourceFile: ts.SourceFile, filePath: string): UnusedVariable[] {
  const unusedVariables: UnusedVariable[] = [];
  const declaredVariables: VariableInfo[] = [];

  // First pass: collect all variable declarations
  function collectVariables(node: ts.Node, scopeType: 'function' | 'block' | 'module') {
    // Variable declarations: const, let, var
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const _parent = node.parent?.parent;
      let variableType: 'const' | 'let' | 'var' = 'const';

      if (ts.isVariableDeclarationList(node.parent)) {
        const flags = node.parent.flags;
        if (flags & ts.NodeFlags.Let) variableType = 'let';
        else if (flags & ts.NodeFlags.Const) variableType = 'const';
        else variableType = 'var';
      }

      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart());
      const text = sourceFile.text.split('\n')[line] || '';

      declaredVariables.push({
        name: node.name.text,
        line: line + 1,
        column: character,
        variableType,
        scopeType,
        entireLine: text.trim(),
        node: node.name,
      });
    }

    // Function parameters
    if (ts.isFunctionLike(node)) {
      for (const param of node.parameters) {
        if (ts.isIdentifier(param.name)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(
            param.name.getStart()
          );
          const text = sourceFile.text.split('\n')[line] || '';

          declaredVariables.push({
            name: param.name.text,
            line: line + 1,
            column: character,
            variableType: 'parameter',
            scopeType: 'function',
            entireLine: text.trim(),
            node: param.name,
          });
        }
      }

      // Visit function body with function scope
      ts.forEachChild(node, (child) => collectVariables(child, 'function'));
      return; // Don't traverse again
    }

    // Block scope
    if (ts.isBlock(node)) {
      ts.forEachChild(node, (child) => collectVariables(child, 'block'));
      return;
    }

    ts.forEachChild(node, (child) => collectVariables(child, scopeType));
  }

  // Start collection at module level
  collectVariables(sourceFile, 'module');

  // Second pass: check which variables are actually used
  for (const variable of declaredVariables) {
    if (!isVariableUsed(sourceFile, variable)) {
      unusedVariables.push({
        file: filePath,
        line: variable.line,
        column: variable.column,
        variableName: variable.name,
        variableType: variable.variableType,
        scopeType: variable.scopeType,
        entireLine: variable.entireLine,
      });
    }
  }

  return unusedVariables;
}

function isVariableUsed(_sourceFile: ts.SourceFile, variable: VariableInfo): boolean {
  let isUsed = false;
  const targetName = variable.name;

  // Find the scope of this variable (function, block, or module)
  const scope = findScope(variable.node);

  function visit(node: ts.Node) {
    // Skip the declaration itself
    if (node === variable.node) {
      return;
    }

    // Check if this is an identifier with the same name
    if (ts.isIdentifier(node) && node.text === targetName) {
      // Make sure we're in the same scope
      if (isInScope(node, scope)) {
        isUsed = true;
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(scope);
  return isUsed;
}

function findScope(node: ts.Node): ts.Node {
  let current = node.parent;

  while (current) {
    // Function scope
    if (ts.isFunctionLike(current)) {
      return current;
    }

    // Block scope
    if (ts.isBlock(current)) {
      return current;
    }

    // Module scope
    if (ts.isSourceFile(current)) {
      return current;
    }

    current = current.parent;
  }

  // Fallback to source file
  return node.getSourceFile();
}

function isInScope(node: ts.Node, scope: ts.Node): boolean {
  let current: ts.Node | undefined = node;

  while (current) {
    if (current === scope) {
      return true;
    }
    current = current.parent;
  }

  return false;
}
