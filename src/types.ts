export interface AnalysisResult {
  unusedImports: UnusedImport[];
  unusedFiles: UnusedFile[];
  unusedDependencies: UnusedDependency[];
  unusedExports: UnusedExport[];
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
    exportType: 'named' | 'default' |'namespace';
    entireLine: string; // For auto-fix
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
  deps?: boolean;
  yes?: boolean;
  quiet?: boolean;
  interactive?: boolean;
  ci?: boolean;
  dryRun?: boolean;
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
