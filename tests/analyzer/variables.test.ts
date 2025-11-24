import * as path from 'node:path';
import { analyzeUnusedVariables } from '../../src/analyzer/unusedVariables';
import { cleanupTempProject, createTempProject } from '../utils';

describe('analyzeUnusedVariables', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      cleanupTempProject(tempDir);
    }
  });

  it('should detect unused const variables', async () => {
    tempDir = createTempProject({
      'index.ts': `
const usedVar = 'used';
const unusedVar = 'unused';

console.log(usedVar);
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedVariables(files);

    expect(results.some((r) => r.variableName === 'unusedVar')).toBe(true);
    expect(results.some((r) => r.variableName === 'usedVar')).toBe(false);
  });

  it('should detect unused let variables', async () => {
    tempDir = createTempProject({
      'index.ts': `
let usedVar = 'used';
let unusedVar = 'unused';

usedVar = 'modified';
console.log(usedVar);
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedVariables(files);

    expect(results.some((r) => r.variableName === 'unusedVar')).toBe(true);
    expect(results.some((r) => r.variableName === 'usedVar')).toBe(false);
  });

  it('should detect unused function parameters', async () => {
    tempDir = createTempProject({
      'index.ts': `
function myFunction(usedParam: string, unusedParam: number) {
  console.log(usedParam);
}

myFunction('test', 123);
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedVariables(files);

    expect(
      results.some((r) => r.variableName === 'unusedParam' && r.variableType === 'parameter')
    ).toBe(true);
    expect(results.some((r) => r.variableName === 'usedParam')).toBe(false);
  });

  it('should handle block scope correctly', async () => {
    tempDir = createTempProject({
      'index.ts': `
function test() {
  const blockVar = 'block';
  
  if (true) {
    const innerVar = 'inner';
    console.log(blockVar);
  }
}

test();
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedVariables(files);

    expect(results.some((r) => r.variableName === 'innerVar')).toBe(true);
    expect(results.some((r) => r.variableName === 'blockVar')).toBe(false);
  });

  it('should handle arrow function parameters', async () => {
    tempDir = createTempProject({
      'index.ts': `
const myArrow = (usedParam: string, unusedParam: number) => {
  return usedParam.toUpperCase();
};

myArrow('test', 123);
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedVariables(files);

    expect(
      results.some((r) => r.variableName === 'unusedParam' && r.variableType === 'parameter')
    ).toBe(true);
    expect(results.some((r) => r.variableName === 'usedParam')).toBe(false);
  });

  it('should not flag variables used in nested scopes', async () => {
    tempDir = createTempProject({
      'index.ts': `
const outerVar = 'outer';

function nested() {
  const innerVar = outerVar;
  console.log(innerVar);
}

nested();
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = await analyzeUnusedVariables(files);

    expect(results.some((r) => r.variableName === 'outerVar')).toBe(false);
    expect(results.some((r) => r.variableName === 'innerVar')).toBe(false);
  });
});
