import * as fs from 'node:fs';
import * as ts from 'typescript';
import type { UnusedType } from '../types';
import { createSourceFile, shouldIgnoreFile } from '../utils/tsparser';

/**
 * Analyze TypeScript files for unused types, interfaces, type aliases, and enums
 */
export function analyzeUnusedTypes(files: string[]): UnusedType[] {
  const unusedTypes: UnusedType[] = [];
  const allTypeDeclarations = new Map<string, TypeDeclaration>();
  const typeReferences = new Set<string>();

  // First pass: collect all type declarations
  for (const file of files) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, 'utf-8');
    if (shouldIgnoreFile(content)) continue;

    const sourceFile = createSourceFile(file, content);
    collectTypeDeclarations(sourceFile, file, allTypeDeclarations);
  }

  // Second pass: find type references
  for (const file of files) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, 'utf-8');
    const sourceFile = createSourceFile(file, content);
    collectTypeReferences(sourceFile, typeReferences);
  }

  // Find unused types
  for (const [_typeId, typeDecl] of allTypeDeclarations) {
    if (!typeReferences.has(typeDecl.name)) {
      unusedTypes.push({
        file: typeDecl.file,
        line: typeDecl.line,
        column: typeDecl.column,
        typeName: typeDecl.name,
        typeKind: typeDecl.kind,
        isExported: typeDecl.isExported,
        entireLine: typeDecl.entireLine,
      });
    }
  }

  return unusedTypes;
}

interface TypeDeclaration {
  file: string;
  name: string;
  kind: 'interface' | 'type' | 'enum' | 'class';
  line: number;
  column: number;
  isExported: boolean;
  entireLine: string;
}

function collectTypeDeclarations(
  sourceFile: ts.SourceFile,
  filePath: string,
  declarations: Map<string, TypeDeclaration>
): void {
  function visit(node: ts.Node) {
    // Interface declarations
    if (ts.isInterfaceDeclaration(node) && node.name) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const text = node.getText(sourceFile);
      const firstLine = text.split('\n')[0];

      declarations.set(`${filePath}:${node.name.text}`, {
        file: filePath,
        name: node.name.text,
        kind: 'interface',
        line: line + 1,
        column: character,
        isExported: hasExportModifier(node),
        entireLine: firstLine,
      });
    }

    // Type alias declarations
    if (ts.isTypeAliasDeclaration(node) && node.name) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const text = node.getText(sourceFile);
      const firstLine = text.split('\n')[0];

      declarations.set(`${filePath}:${node.name.text}`, {
        file: filePath,
        name: node.name.text,
        kind: 'type',
        line: line + 1,
        column: character,
        isExported: hasExportModifier(node),
        entireLine: firstLine,
      });
    }

    // Enum declarations
    if (ts.isEnumDeclaration(node) && node.name) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const text = node.getText(sourceFile);
      const firstLine = text.split('\n')[0];

      declarations.set(`${filePath}:${node.name.text}`, {
        file: filePath,
        name: node.name.text,
        kind: 'enum',
        line: line + 1,
        column: character,
        isExported: hasExportModifier(node),
        entireLine: firstLine,
      });
    }

    // Class declarations (as types)
    if (ts.isClassDeclaration(node) && node.name) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const text = node.getText(sourceFile);
      const firstLine = text.split('\n')[0];

      declarations.set(`${filePath}:${node.name.text}`, {
        file: filePath,
        name: node.name.text,
        kind: 'class',
        line: line + 1,
        column: character,
        isExported: hasExportModifier(node),
        entireLine: firstLine,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function collectTypeReferences(sourceFile: ts.SourceFile, references: Set<string>): void {
  function visit(node: ts.Node) {
    // Type references
    if (ts.isTypeReferenceNode(node)) {
      const typeName = node.typeName.getText(sourceFile);
      references.add(typeName);
    }

    // Heritage clauses (extends, implements)
    if (ts.isHeritageClause(node)) {
      for (const type of node.types) {
        const typeName = type.expression.getText(sourceFile);
        references.add(typeName);
      }
    }

    // Variable declarations with type annotations
    if (ts.isVariableDeclaration(node) && node.type) {
      extractTypeNamesFromTypeNode(node.type, sourceFile, references);
    }

    // Function parameters and return types
    if (ts.isFunctionLike(node)) {
      // Parameters
      for (const param of node.parameters) {
        if (param.type) {
          extractTypeNamesFromTypeNode(param.type, sourceFile, references);
        }
      }
      // Return type
      if (node.type) {
        extractTypeNamesFromTypeNode(node.type, sourceFile, references);
      }
    }

    // Type assertions (as expressions)
    if (ts.isAsExpression(node)) {
      extractTypeNamesFromTypeNode(node.type, sourceFile, references);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function extractTypeNamesFromTypeNode(
  typeNode: ts.TypeNode,
  sourceFile: ts.SourceFile,
  references: Set<string>
): void {
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName.getText(sourceFile);
    references.add(typeName);
  }

  if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) {
    for (const type of typeNode.types) {
      extractTypeNamesFromTypeNode(type, sourceFile, references);
    }
  }

  if (ts.isArrayTypeNode(typeNode)) {
    extractTypeNamesFromTypeNode(typeNode.elementType, sourceFile, references);
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    for (const member of typeNode.members) {
      if (ts.isPropertySignature(member) && member.type) {
        extractTypeNamesFromTypeNode(member.type, sourceFile, references);
      }
    }
  }
}

function hasExportModifier(node: ts.Node): boolean {
  const modifiersNode = node as unknown as { modifiers?: ts.Modifier[] };
  if (!modifiersNode.modifiers) return false;
  return modifiersNode.modifiers.some(
    (mod: ts.Modifier) => mod.kind === ts.SyntaxKind.ExportKeyword
  );
}
