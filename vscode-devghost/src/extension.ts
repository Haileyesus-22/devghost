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

  const fixWorkspaceCommand = vscode.commands.registerCommand(
    'devghost.fixWorkspace',
    () => fixWorkspace()
  );

  context.subscriptions.push(
    analyzeFileCommand,
    analyzeWorkspaceCommand,
    fixFileCommand,
    fixWorkspaceCommand,
    diagnosticCollection
  );

  // Auto-analyze on file open and save
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(analyzeDocument),
    vscode.workspace.onDidSaveTextDocument(analyzeDocument)
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
  if (document.isUntitled || (document.isDirty && !document.fileName)) {
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

    /* 
    // Disabled for now to focus on unused imports
    
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
    */

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
  // Exclude common build/generated directories
  const excludePattern = '{**/node_modules/**,**/.next/**,**/dist/**,**/build/**,**/out/**,**/.nuxt/**,**/.output/**,**/coverage/**}';
  const files = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx}', excludePattern);
  
  // Additional filter to exclude files in ignored paths
  // We rely mainly on the glob pattern above, but do a quick check for node_modules just in case
  const filteredFiles = files.filter(file => {
    const path = file.fsPath;
    return !path.includes('node_modules');
  });

  if (filteredFiles.length === 0) {
    vscode.window.showWarningMessage('No TypeScript/JavaScript files found to analyze');
    return;
  }

  // Show progress
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '👻 DevGhost',
    cancellable: false
  }, async (progress) => {
    progress.report({ message: `Analyzing ${filteredFiles.length} files...` });

    // Process files in batches of 20 for optimal performance
    const batchSize = 20;
    for (let i = 0; i < filteredFiles.length; i += batchSize) {
      const batch = filteredFiles.slice(i, i + batchSize);
      
      // Process batch in parallel
      await Promise.all(
        batch.map(async (file) => {
          try {
            const document = await vscode.workspace.openTextDocument(file);
            await analyzeDocument(document);
          } catch (error) {
            console.error(`Error analyzing ${file.fsPath}:`, error);
          }
        })
      );

      // Update progress
      const percentComplete = Math.round(((i + batch.length) / filteredFiles.length) * 100);
      progress.report({ 
        message: `Analyzed ${i + batch.length}/${filteredFiles.length} files (${percentComplete}%)` 
      });
    }

    progress.report({ message: 'Complete!' });
  });

  vscode.window.showInformationMessage(`👻 Analysis complete! Scanned ${filteredFiles.length} files.`);
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

async function fixWorkspace() {
  // Exclude common build/generated directories
  const excludePattern = '{**/node_modules/**,**/.next/**,**/dist/**,**/build/**,**/out/**,**/.nuxt/**,**/.output/**,**/coverage/**}';
  const files = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx}', excludePattern);
  
  // Filter files
  // We rely mainly on the glob pattern above, but do a quick check for node_modules just in case
  const filteredFiles = files.filter(file => {
    const path = file.fsPath;
    return !path.includes('node_modules');
  });

  if (filteredFiles.length === 0) {
    vscode.window.showWarningMessage('No TypeScript/JavaScript files found');
    return;
  }

  let totalFixed = 0;
  let filesFixed = 0;

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '👻 DevGhost Auto-Fix',
    cancellable: true
  }, async (progress, token) => {
    progress.report({ message: `Scanning ${filteredFiles.length} files...` });

    // Process files sequentially to ensure reliability with VSCode API
    // Concurrent applyEdit calls can fail or conflict
    for (let i = 0; i < filteredFiles.length; i++) {
      if (token.isCancellationRequested) break;

      const file = filteredFiles[i];
      try {
        // 1. Open document to ensure we handle dirty state
        const document = await vscode.workspace.openTextDocument(file);
        
        // 2. If dirty, save first so analyzeImports (which reads from disk) sees correct content
        if (document.isDirty) {
          await document.save();
        }

        // 3. Analyze imports
        const unusedImports = await analyzeImports([file.fsPath]);
        
        if (unusedImports.length > 0) {
          const edit = new vscode.WorkspaceEdit();
          
          // Sort by line number in reverse
          unusedImports.sort((a, b) => b.line - a.line);
          
          for (const unusedImport of unusedImports) {
            const range = new vscode.Range(
              unusedImport.line - 1,
              0,
              unusedImport.line,
              0
            );
            edit.delete(document.uri, range);
          }
          
          // 4. Apply edits
          const success = await vscode.workspace.applyEdit(edit);
          
          if (success) {
            // 5. Save again to persist changes
            await document.save();
            totalFixed += unusedImports.length;
            filesFixed++;
          }
        }
      } catch (error) {
        console.error(`Error fixing ${file.fsPath}:`, error);
      }

      // Update progress every 5 files or so to avoid UI thrashing
      if (i % 5 === 0 || i === filteredFiles.length - 1) {
        const percentComplete = Math.round(((i + 1) / filteredFiles.length) * 100);
        progress.report({ 
          message: `Fixed ${filesFixed} files (${totalFixed} imports removed) - ${percentComplete}%` 
        });
      }
    }

    progress.report({ message: 'Complete!' });
  });

  vscode.window.showInformationMessage(
    `👻 Auto-fix complete! Fixed ${filesFixed} files, removed ${totalFixed} unused imports.`
  );
}

export function deactivate() {
  diagnosticCollection.clear();
  diagnosticCollection.dispose();
}
