export interface AnalysisResult {
  unusedImports: UnusedImport[];
  unusedFiles: UnusedFile[];
  unusedDependencies: UnusedDependency[];
  unusedExports: UnusedExport[];
  unusedFunctions: UnusedFunction[];
  unusedTypes: UnusedType[];
  unusedVariables: UnusedVariable[];
  stats: AnalysisStats;
}

export interface UnusedImport {
  file: string;
  line: number;
  column: number;
  importName: string;
  source: string;
  entireLine: string; // For auto-fix
}

export interface UnusedExport {
  file: string;
  line: number;
  column: number;
  exportName: string;
  exportType: 'named' | 'default' | 'namespace';
  entireLine: string; // For auto-fix
}

export interface UnusedFunction {
  file: string;
  line: number;
  column: number;
  functionName: string;
  functionType: 'function' | 'arrow' | 'method';
  isExported: boolean;
  entireLine: string;
}

export interface UnusedType {
  file: string;
  line: number;
  column: number;
  typeName: string;
  typeKind: 'interface' | 'type' | 'enum' | 'class';
  isExported: boolean;
  entireLine: string;
}

export interface UnusedVariable {
  file: string;
  line: number;
  column: number;
  variableName: string;
  variableType: 'const' | 'let' | 'var' | 'parameter';
  scopeType: 'function' | 'block' | 'module';
  entireLine: string;
}

export interface UnusedFile {
  path: string;
  reason: string;
  size: number; // bytes
  lines: number;
}

export interface UnusedDependency {
  name: string;
  type: 'dependency' | 'devDependency';
  size: number; // bytes in node_modules
}

export interface AnalysisStats {
  totalFiles: number;
  filesScanned: number;
  totalDependencies: number;
  potentialSavings: {
    lines: number;
    bytes: number;
    dependencies: number;
    dependenciesSize: number;
  };
}

export interface DevGhostConfig {
  ignore?: string[];
  entry?: string[];
  includeDev?: boolean;
  fix?: boolean;
  fixDeps?: boolean;
  fixFunctions?: boolean;
  deps?: boolean;
  yes?: boolean;
  quiet?: boolean;
  interactive?: boolean;
  ci?: boolean;
  dryRun?: boolean;
  report?: 'html' | 'json';
  output?: string;
}

export interface FixResult {
  file: string;
  linesRemoved: number;
  success: boolean;
  error?: string;
}

export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}
