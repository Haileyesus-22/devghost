import * as vscode from 'vscode';
import { analyzeImports } from 'devghost/dist/analyzer/imports';
import { analyzeUnusedVariables } from 'devghost/dist/analyzer/unusedVariables';
import { analyzeUnusedFunctions } from 'devghost/dist/analyzer/unusedFunctions';
import { analyzeUnusedTypes } from 'devghost/dist/analyzer/unusedTypes';

const diagnosticCollection = vscode.languages.createDiagnosticCollection('devghost');

export function activate(context: vscode.ExtensionContext) {
  console.log('DevGhost extension activated! 👻');

  // Register commands
  const analyzeFileCommand = vscode.commands.registerCommand(
    'devghost.analyzeFile',
    () => analyzeCurrentFile()
  );

  const analyzeWorkspaceCommand = vscode.commands.registerCommand(
    'devghost.analyzeWorkspace',
    () => analyzeWorkspace()
  );

  const fixFileCommand = vscode.commands.registerCommand(
    'devghost.fixFile',
    () => fixCurrentFile()
  );

  context.subscriptions.push(
    analyzeFileCommand,
    analyzeWorkspaceCommand,
    fixFileCommand,
    diagnosticCollection
  );

  // Auto-analyze on file open and save
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(analyzeDocument),
    vscode.workspace.onDidSaveTextDocument(analyzeDocument)
    // Removed onDidChangeTextDocument to prevent line number mismatches
    // between the saved file (what DevGhost analyzes) and editor buffer
  );

  // Analyze all currently open files
  vscode.workspace.textDocuments.forEach(analyzeDocument);
}

async function analyzeDocument(document: vscode.TextDocument) {
  const config = vscode.workspace.getConfiguration('devghost');
  if (!config.get('enable', true)) return;

  // Only analyze TypeScript/JavaScript files
  const validLanguages = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'];
  if (!validLanguages.includes(document.languageId)) return;

  // Skip unsaved files (they don't exist on disk yet)
  if (document.isUntitled || document.isDirty && !document.fileName) {
    return;
  }

  const diagnostics: vscode.Diagnostic[] = [];

  try {
    // Analyze unused imports
    const unusedImports = await analyzeImports([document.fileName]);
    
    for (const unusedImport of unusedImports) {
      const line = document.lineAt(unusedImport.line - 1);
      const range = new vscode.Range(
        unusedImport.line - 1,
        unusedImport.column,
        unusedImport.line - 1,
        line.text.length
      );

      const diagnostic = new vscode.Diagnostic(
        range,
        `Unused import: '${unusedImport.importName}'`,
        getSeverity(config.get('severity', 'Warning'))
      );
      diagnostic.source = 'DevGhost';
      diagnostic.code = 'unused-import';
      diagnostics.push(diagnostic);
    }

    // Analyze unused variables
    const unusedVars = analyzeUnusedVariables([document.fileName]);
    
    for (const unusedVar of unusedVars) {
      const line = document.lineAt(unusedVar.line - 1);
      const range = new vscode.Range(
        unusedVar.line - 1,
        unusedVar.column,
        unusedVar.line - 1,
        line.text.length
      );

      const diagnostic = new vscode.Diagnostic(
        range,
        `Unused ${unusedVar.variableType}: '${unusedVar.variableName}'`,
        getSeverity(config.get('severity', 'Warning'))
      );
      diagnostic.source = 'DevGhost';
      diagnostic.code = 'unused-variable';
      diagnostics.push(diagnostic);
    }

    // Analyze unused functions
    const unusedFuncs = await analyzeUnusedFunctions([document.fileName]);
    
    for (const unusedFunc of unusedFuncs) {
      // Skip if line number is invalid
      if (unusedFunc.line < 1 || unusedFunc.line > document.lineCount) {
        continue;
      }
      
      const line = document.lineAt(unusedFunc.line - 1);
      const range = new vscode.Range(
        unusedFunc.line - 1,
        unusedFunc.column,
        unusedFunc.line - 1,
        line.text.length
      );

      const diagnostic = new vscode.Diagnostic(
        range,
        `Unused ${unusedFunc.functionType}: '${unusedFunc.functionName}'`,
        getSeverity(config.get('severity', 'Warning'))
      );
      diagnostic.source = 'DevGhost';
      diagnostic.code = 'unused-function';
      diagnostics.push(diagnostic);
    }

    // Analyze unused types
    const unusedTypes = analyzeUnusedTypes([document.fileName]);
    
    for (const unusedType of unusedTypes) {
      const line = document.lineAt(unusedType.line - 1);
      const range = new vscode.Range(
        unusedType.line - 1,
        unusedType.column,
        unusedType.line - 1,
        line.text.length
      );

      const diagnostic = new vscode.Diagnostic(
        range,
        `Unused ${unusedType.typeKind}: '${unusedType.typeName}'`,
        getSeverity(config.get('severity', 'Warning'))
      );
      diagnostic.source = 'DevGhost';
      diagnostic.code = 'unused-type';
      diagnostics.push(diagnostic);
    }

    diagnosticCollection.set(document.uri, diagnostics);
  } catch (error) {
    console.error('DevGhost analysis error:', error);
  }
}

function getSeverity(severity: string): vscode.DiagnosticSeverity {
  switch (severity) {
    case 'Error':
      return vscode.DiagnosticSeverity.Error;
    case 'Information':
      return vscode.DiagnosticSeverity.Information;
    default:
      return vscode.DiagnosticSeverity.Warning;
  }
}

async function analyzeCurrentFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active file to analyze');
    return;
  }

  await analyzeDocument(editor.document);
  vscode.window.showInformationMessage('👻 DevGhost analysis complete!');
}

async function analyzeWorkspace() {
  vscode.window.showInformationMessage('👻 Analyzing workspace...');
  
  const files = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx}', '**/node_modules/**');
  
  for (const file of files) {
    const document = await vscode.workspace.openTextDocument(file);
    await analyzeDocument(document);
  }

  vscode.window.showInformationMessage(`👻 Analyzed ${files.length} files!`);
}

async function fixCurrentFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active file to fix');
    return;
  }

  const document = editor.document;
  const unusedImports = await analyzeImports([document.fileName]);
  
  if (unusedImports.length === 0) {
    vscode.window.showInformationMessage('👻 No unused imports found!');
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  
  // Sort by line number in reverse to avoid offset issues
  unusedImports.sort((a, b) => b.line - a.line);
  
  for (const unusedImport of unusedImports) {
    const line = document.lineAt(unusedImport.line - 1);
    // Remove the entire import line
    const range = new vscode.Range(
      unusedImport.line - 1,
      0,
      unusedImport.line,
      0
    );
    edit.delete(document.uri, range);
  }

  await vscode.workspace.applyEdit(edit);
  await document.save();
  
  vscode.window.showInformationMessage(`👻 Fixed ${unusedImports.length} unused imports!`);
}

export function deactivate() {
  diagnosticCollection.clear();
  diagnosticCollection.dispose();
}
