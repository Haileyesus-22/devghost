import * as fs from 'node:fs';
import * as path from 'node:path';
import { analyzeDependencies } from '../../src/analyzer/deps';
import type { PackageJson } from '../../src/types';
import { cleanupTempProject, createTempProject } from '../utils';

describe('analyzeDependencies', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      cleanupTempProject(tempDir);
    }
  });

  it('should detect unused dependencies', async () => {
    tempDir = createTempProject({
      'index.ts': `
import chalk from 'chalk';

export function test() {
  console.log(chalk.blue('Hello'));
}
`,
    });

    const packageJson: PackageJson = {
      name: 'test',
      version: '1.0.0',
      dependencies: {
        chalk: '^4.1.2',
        lodash: '^4.17.21', // unused
      },
    };

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeDependencies(files, packageJson, tempDir, false);

    expect(results.length).toBe(1);
    expect(results[0].name).toBe('lodash');
    expect(results[0].type).toBe('dependency');
  });

  it('should detect unused devDependencies when includeDev is true', async () => {
    tempDir = createTempProject({
      'index.ts': `
import { expect } from '@jest/globals';

export function test() {
  expect(true).toBe(true);
}
`,
    });

    const packageJson: PackageJson = {
      name: 'test',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {
        '@jest/globals': '^29.0.0',
        'ts-jest': '^29.0.0', // unused
      },
    };

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeDependencies(files, packageJson, tempDir, true);

    expect(results.length).toBe(1);
    expect(results[0].name).toBe('ts-jest');
    expect(results[0].type).toBe('devDependency');
  });

  it('should not flag devDependencies when includeDev is false', async () => {
    tempDir = createTempProject({
      'index.ts': `export const test = 'test';`,
    });

    const packageJson: PackageJson = {
      name: 'test',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {
        'unused-dev-dep': '^1.0.0',
      },
    };

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeDependencies(files, packageJson, tempDir, false);

    expect(results.length).toBe(0);
  });

  it('should ignore Node.js built-in modules', async () => {
    tempDir = createTempProject({
      'index.ts': `
import * as fs from 'fs';
import * as path from 'path';

export function test() {
  console.log(fs, path);
}
`,
    });

    const packageJson: PackageJson = {
      name: 'test',
      version: '1.0.0',
      dependencies: {
        fs: '^0.0.1', // Should be ignored even if listed
        path: '^0.12.7',
      },
    };

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeDependencies(files, packageJson, tempDir, false);

    // Built-in modules should not be flagged as unused
    expect(results.length).toBe(0);
  });

  it('should handle @types packages correctly', async () => {
    tempDir = createTempProject({
      'index.ts': `
import React from 'react';

export function Component() {
  return React.createElement('div', null, 'Hello');
}
`,
    });

    const packageJson: PackageJson = {
      name: 'test',
      version: '1.0.0',
      dependencies: {
        react: '^18.0.0',
      },
      devDependencies: {
        '@types/react': '^18.0.0', // Used indirectly
        '@types/unused': '^1.0.0', // Actually unused
      },
    };

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeDependencies(files, packageJson, tempDir, true);

    // Should detect @types/unused but not @types/react
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('@types/unused');
  });

  it('should handle scoped packages', async () => {
    tempDir = createTempProject({
      'index.ts': `
import { jest } from '@jest/globals';

export function test() {
  jest.fn();
}
`,
    });

    const packageJson: PackageJson = {
      name: 'test',
      version: '1.0.0',
      dependencies: {
        '@jest/globals': '^29.0.0',
        '@unused/package': '^1.0.0',
      },
    };

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeDependencies(files, packageJson, tempDir, false);

    expect(results.length).toBe(1);
    expect(results[0].name).toBe('@unused/package');
  });

  it('should return empty array when all dependencies are used', async () => {
    tempDir = createTempProject({
      'index.ts': `
import chalk from 'chalk';
import lodash from 'lodash';

export function test() {
  console.log(chalk.blue(lodash.VERSION));
}
`,
    });

    const packageJson: PackageJson = {
      name: 'test',
      version: '1.0.0',
      dependencies: {
        chalk: '^4.1.2',
        lodash: '^4.17.21',
      },
    };

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeDependencies(files, packageJson, tempDir, false);

    expect(results.length).toBe(0);
  });

  it('should handle missing dependencies object', async () => {
    tempDir = createTempProject({
      'index.ts': `export const test = 'test';`,
    });

    const packageJson: PackageJson = {
      name: 'test',
      version: '1.0.0',
      // No dependencies or devDependencies
    };

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeDependencies(files, packageJson, tempDir, false);

    expect(results.length).toBe(0);
  });
});
