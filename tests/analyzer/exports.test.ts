import * as path from 'node:path';
import { analyzeUnusedExports } from '../../src/analyzer/unusedExports';
import { cleanupTempProject, createTempProject } from '../utils';

describe('analyzeUnusedExports', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      cleanupTempProject(tempDir);
    }
  });

  it('should detect unused named exports', async () => {
    tempDir = createTempProject({
      'module.ts': `
export const usedExport = 'used';
export const unusedExport = 'unused';
`,
      'index.ts': `
import { usedExport } from './module';

console.log(usedExport);
`,
    });

    const files = [path.join(tempDir, 'module.ts'), path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedExports(files);

    expect(results.some((r) => r.exportName === 'unusedExport')).toBe(true);
    expect(results.some((r) => r.exportName === 'usedExport')).toBe(false);
  });

  it('should handle default exports', async () => {
    tempDir = createTempProject({
      'module.ts': `
export default function() {
  return 'default';
}

export const named = 'named';
`,
      'index.ts': `
import defaultExport from './module';

console.log(defaultExport);
`,
    });

    const files = [path.join(tempDir, 'module.ts'), path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedExports(files);

    expect(results.some((r) => r.exportName === 'named')).toBe(true);
    expect(results.some((r) => r.exportType === 'default')).toBe(false);
  });

  it('should handle re-exports', async () => {
    tempDir = createTempProject({
      'original.ts': `
export const value = 'original';
`,
      'reexport.ts': `
export { value } from './original';
export { value as renamedValue } from './original';
`,
      'index.ts': `
import { value } from './reexport';

console.log(value);
`,
    });

    const files = [
      path.join(tempDir, 'original.ts'),
      path.join(tempDir, 'reexport.ts'),
      path.join(tempDir, 'index.ts'),
    ];
    const results = await analyzeUnusedExports(files);

    expect(results.some((r) => r.exportName === 'renamedValue')).toBe(true);
  });
});
