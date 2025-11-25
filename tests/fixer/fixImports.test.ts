import * as fs from 'node:fs';
import * as path from 'node:path';
import { fixUnusedImports } from '../../src/fixer/index';
import type { UnusedImport } from '../../src/types';
import { cleanupTempProject, createTempProject } from '../utils';

describe('fixUnusedImports', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      cleanupTempProject(tempDir);
    }
  });

  it('should remove the correct line (off-by-one regression test)', async () => {
    // This test specifically checks for the bug where we deleted line N-1 instead of line N
    tempDir = createTempProject({
      'index.ts': `import {} from "dotenv/config";
import process from "process";
import { } from "tslib";
import {} from "path";
import {} from "fs";
import {} from "url";
import {} from "util";
import OS from "os";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();
console.log(client);
`,
    });

    const filePath = path.join(tempDir, 'index.ts');

    // Mock unused import: line 8 should be "import OS from 'os';"
    const unusedImports: UnusedImport[] = [
      {
        file: filePath,
        line: 8, // 1-indexed: line 8 is "import OS from 'os';"
        column: 0,
        importName: 'OS',
        source: 'os',
        entireLine: 'import OS from "os";',
      },
    ];

    await fixUnusedImports(unusedImports);

    const result = fs.readFileSync(filePath, 'utf-8');
    const lines = result.split('\n');

    // Verify line 7 (util) is still there
    expect(lines[6]).toContain('util');

    // Verify line 8 (OS) is gone
    expect(lines[7]).not.toContain('OS');
    expect(lines[7]).toContain('PrismaClient'); // This should now be line 8
  });

  it('should handle multiple unused imports correctly', async () => {
    tempDir = createTempProject({
      'test.ts': `import React from 'react';
import { useState } from 'react';
import lodash from 'lodash';

export function Component() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
`,
    });

    const filePath = path.join(tempDir, 'test.ts');

    const unusedImports: UnusedImport[] = [
      {
        file: filePath,
        line: 1,
        column: 0,
        importName: 'React',
        source: 'react',
        entireLine: "import React from 'react';",
      },
      {
        file: filePath,
        line: 3,
        column: 0,
        importName: 'lodash',
        source: 'lodash',
        entireLine: "import lodash from 'lodash';",
      },
    ];

    await fixUnusedImports(unusedImports);

    const result = fs.readFileSync(filePath, 'utf-8');

    // Should no longer contain React or lodash imports
    expect(result).not.toContain("import React from 'react'");
    expect(result).not.toContain("import lodash from 'lodash'");

    // Should still have useState
    expect(result).toContain('useState');
  });

  it('should not remove non-import lines', async () => {
    tempDir = createTempProject({
      'test.ts': `const foo = 1;
import { bar } from './bar';
`,
    });

    const filePath = path.join(tempDir, 'test.ts');

    const unusedImports: UnusedImport[] = [
      {
        file: filePath,
        line: 2,
        column: 0,
        importName: 'bar',
        source: './bar',
        entireLine: "import { bar } from './bar';",
      },
    ];

    await fixUnusedImports(unusedImports);

    const result = fs.readFileSync(filePath, 'utf-8');

    // foo should still exist
    expect(result).toContain('const foo = 1');
  });
});
