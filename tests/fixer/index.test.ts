import * as fs from 'node:fs';
import * as path from 'node:path';
import { fixUnusedImports } from '../../src/fixer';
import { cleanupTempProject, createTempProject } from '../utils';

describe('fixUnusedImports', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      cleanupTempProject(tempDir);
    }
  });

  it('should remove unused imports from file', async () => {
    tempDir = createTempProject({
      'index.ts': `import { used, unused } from './other';

export function main() {
  console.log(used);
}
`,
    });

    const filePath = path.join(tempDir, 'index.ts');
    const unusedImports = [
      {
        file: filePath,
        line: 1,
        column: 16,
        importName: 'unused',
        source: './other',
        entireLine: `import { used, unused } from './other';`,
      },
    ];

    const results = await fixUnusedImports(unusedImports, { dryRun: false });

    expect(results.length).toBe(1);
    expect(results[0].success).toBe(true);
    expect(results[0].linesRemoved).toBeGreaterThan(0);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('unused');
    expect(content).toContain('used');
  });

  it('should not modify files in dry run mode', async () => {
    tempDir = createTempProject({
      'index.ts': `import { used, unused } from './other';

export function main() {
  console.log(used);
}
`,
    });

    const filePath = path.join(tempDir, 'index.ts');
    const originalContent = fs.readFileSync(filePath, 'utf-8');

    const unusedImports = [
      {
        file: filePath,
        line: 1,
        column: 16,
        importName: 'unused',
        source: './other',
        entireLine: `import { used, unused } from './other';`,
      },
    ];

    await fixUnusedImports(unusedImports, { dryRun: true });

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toBe(originalContent);
  });

  it('should handle multiple unused imports in same file', async () => {
    tempDir = createTempProject({
      'index.ts': `import { unused1 } from './a';
import { unused2 } from './b';
import { used } from './c';

export function main() {
  console.log(used);
}
`,
    });

    const filePath = path.join(tempDir, 'index.ts');

    const unusedImports = [
      {
        file: filePath,
        line: 1,
        column: 9,
        importName: 'unused1',
        source: './a',
        entireLine: `import { unused1 } from './a';`,
      },
      {
        file: filePath,
        line: 2,
        column: 9,
        importName: 'unused2',
        source: './b',
        entireLine: `import { unused2 } from './b';`,
      },
    ];

    const results = await fixUnusedImports(unusedImports, { dryRun: false });

    expect(results.filter((r) => r.success).length).toBe(1);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('unused1');
    expect(content).not.toContain('unused2');
    expect(content).toContain('used');
  });
});
