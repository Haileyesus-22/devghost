import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Test utilities for DevGhost tests
 */

/**
 * Create a temporary test project
 */
export function createTempProject(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devghost-test-'));

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tempDir, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  return tempDir;
}

/**
 * Clean up temporary project
 */
export function cleanupTempProject(tempDir: string): void {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Create a mock package.json
 */
export function createMockPackageJson(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    name: 'test-project',
    version: '1.0.0',
    dependencies: {},
    devDependencies: {},
    ...overrides,
  };
}

/**
 * Common test fixtures
 */
export const FIXTURES = {
  unusedImport: `
import { usedFunction, unusedFunction } from './other';
import { anotherUnused } from './helper';

export function main() {
  usedFunction();
}
`,

  unusedExport: `
export function usedExport() {
  return 'used';
}

export function unusedExport() {
  return 'unused';
}
`,

  unusedFunction: `
function usedFunction() {
  return 'used';
}

function unusedFunction() {
  return 'unused';
}

export function main() {
  usedFunction();
}
`,

  unusedType: `
interface UsedInterface {
  name: string;
}

interface UnusedInterface {
  value: number;
}

type UnusedType = string | number;

export function test(param: UsedInterface): void {
  console.log(param.name);
}
`,

  unusedVariable: `
export function test() {
  const usedVar = 'hello';
  const unusedVar = 'world';
  let anotherUnused = 42;
  
  console.log(usedVar);
}
`,
};
