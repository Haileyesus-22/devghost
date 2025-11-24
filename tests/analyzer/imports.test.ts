import * as path from 'node:path';
import { analyzeImports } from '../../src/analyzer/imports';
import { cleanupTempProject, createTempProject } from '../utils';

describe('analyzeImports', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      cleanupTempProject(tempDir);
    }
  });

  it('should detect unused named imports', async () => {
    tempDir = createTempProject({
      'index.ts': `
import { used, unused } from './other';

export function main() {
  console.log(used);
}
`,
      'other.ts': `
export const used = 'used';
export const unused = 'unused';
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeImports(files);

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.importName === 'unused')).toBe(true);
  });

  it('should not flag used imports', async () => {
    tempDir = createTempProject({
      'index.ts': `
import { onlyUsed } from './other';

export function main() {
  console.log(onlyUsed);
}
`,
      'other.ts': `
export const onlyUsed = 'value';
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeImports(files);

    expect(results.length).toBe(0);
  });

  it('should handle type-only imports correctly', async () => {
    tempDir = createTempProject({
      'index.ts': `
import type { MyType } from './types';

export function test(): MyType {
  return { value: 42 };
}
`,
      'types.ts': `
export interface MyType {
  value: number;
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeImports(files);

    expect(results.length).toBe(0);
  });

  it('should detect unused namespace imports', async () => {
    tempDir = createTempProject({
      'index.ts': `
import * as Utils from './utils';

export function test() {
  // Utils is imported but never used
  return 'test';
}
`,
      'utils.ts': `
export function helper() {
  return 'help';
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeImports(files);

    expect(results.some((r) => r.importName === 'Utils')).toBe(true);
  });

  it('should handle default imports', async () => {
    tempDir = createTempProject({
      'index.ts': `
import React from 'react';
import unused from './other';

export function Component() {
  return React.createElement('div', null, 'Hello');
}
`,
      'other.ts': `
export default function() {
  return 'unused';
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeImports(files);

    expect(results.some((r) => r.importName === 'unused')).toBe(true);
    expect(results.some((r) => r.importName === 'React')).toBe(false);
  });

  it('should respect devghost-ignore comments', async () => {
    tempDir = createTempProject({
      'index.ts': `
// devghost-ignore-next-line
import { unused } from './other';

export function main() {
  return 'test';
}
`,
      'other.ts': `
export const unused = 'value';
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeImports(files);

    expect(results.length).toBe(0);
  });
});
