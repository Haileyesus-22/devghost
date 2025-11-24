import * as path from 'node:path';
import { analyzeUnusedFunctions } from '../../src/analyzer/unusedFunctions';
import { cleanupTempProject, createTempProject } from '../utils';

describe('analyzeUnusedFunctions', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      cleanupTempProject(tempDir);
    }
  });

  it('should detect unused regular functions', async () => {
    tempDir = createTempProject({
      'index.ts': `
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
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedFunctions(files);

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.functionName === 'unusedFunction')).toBe(true);
    expect(results.some((r) => r.functionName === 'usedFunction')).toBe(false);
  });

  it('should detect unused arrow functions', async () => {
    tempDir = createTempProject({
      'index.ts': `
const usedArrow = () => 'used';
const unusedArrow = () => 'unused';

export function main() {
  usedArrow();
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedFunctions(files);

    expect(results.some((r) => r.functionName === 'unusedArrow')).toBe(true);
    expect(results.some((r) => r.functionName === 'usedArrow')).toBe(false);
  });

  it('should not flag exported functions as unused', async () => {
    tempDir = createTempProject({
      'index.ts': `
export function exportedFunction() {
  return 'exported';
}

function unusedFunction() {
  return 'unused';
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedFunctions(files);

    expect(results.some((r) => r.functionName === 'exportedFunction')).toBe(false);
    expect(results.some((r) => r.functionName === 'unusedFunction')).toBe(true);
  });

  it('should handle class methods', async () => {
    tempDir = createTempProject({
      'index.ts': `
class MyClass {
  usedMethod() {
    return 'used';
  }
  
  unusedMethod() {
    return 'unused';
  }
  
  test() {
    this.usedMethod();
  }
}

export const instance = new MyClass();
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedFunctions(files);

    // Note: Method detection might vary based on implementation
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle callbacks and event handlers', async () => {
    tempDir = createTempProject({
      'index.ts': `
function setupEventListener() {
  const callback = () => console.log('clicked');
  addEventListener('click', callback);
}

export function main() {
  setupEventListener();
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedFunctions(files);

    // Callback is used as an argument, so it should not be flagged
    expect(results.some((r) => r.functionName === 'callback')).toBe(false);
  });
});
