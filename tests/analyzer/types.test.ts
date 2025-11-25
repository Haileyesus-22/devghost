import * as path from 'node:path';
import { analyzeUnusedTypes } from '../../src/analyzer/unusedTypes';
import { cleanupTempProject, createTempProject } from '../utils';

describe('analyzeUnusedTypes', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      cleanupTempProject(tempDir);
    }
  });

  it('should detect unused interfaces', () => {
    tempDir = createTempProject({
      'index.ts': `
interface UsedInterface {
  name: string;
}

interface UnusedInterface {
  value: number;
}

export function test(param: UsedInterface): void {
  console.log(param.name);
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedInterface');
    expect(results[0].typeKind).toBe('interface');
  });

  it('should detect unused type aliases', () => {
    tempDir = createTempProject({
      'index.ts': `
type UsedType = string | number;
type UnusedType = boolean;

export function test(param: UsedType): void {
  console.log(param);
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedType');
    expect(results[0].typeKind).toBe('type');
  });

  it('should detect unused enums', () => {
    tempDir = createTempProject({
      'index.ts': `
enum UsedEnum {
  A = 'a',
  B = 'b'
}

enum UnusedEnum {
  C = 'c',
  D = 'd'
}

export function test(value: UsedEnum): void {
  console.log(value);
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedEnum');
    expect(results[0].typeKind).toBe('enum');
  });

  it('should detect unused classes when used as types', () => {
    tempDir = createTempProject({
      'index.ts': `
class UsedClass {
  name: string;
}

class UnusedClass {
  value: number;
}

export function test(param: UsedClass): void {
  console.log(param.name);
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedClass');
    expect(results[0].typeKind).toBe('class');
  });

  it('should track type references in function parameters', () => {
    tempDir = createTempProject({
      'index.ts': `
interface Person {
  name: string;
}

interface UnusedPerson {
  age: number;
}

export function greet(person: Person): void {
  console.log('Hello', person.name);
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedPerson');
  });

  it('should track type references in return types', () => {
    tempDir = createTempProject({
      'index.ts': `
interface Response {
  data: string;
}

interface UnusedResponse {
  error: string;
}

export function getData(): Response {
  return { data: 'test' };
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedResponse');
  });

  it('should track type references in heritage clauses', () => {
    tempDir = createTempProject({
      'index.ts': `
interface BaseInterface {
  id: string;
}

interface UnusedBase {
  name: string;
}

export interface ExtendedInterface extends BaseInterface {
  data: string;
}

export function test(param: ExtendedInterface): void {
  console.log(param.id);
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedBase');
  });

  it('should track type references in union types', () => {
    tempDir = createTempProject({
      'index.ts': `
type A = string;
type B = number;
type UnusedType = boolean;

export type Combined = A | B;

export function test(param: Combined): void {
  console.log(param);
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedType');
  });

  it('should track type references in intersection types', () => {
    tempDir = createTempProject({
      'index.ts': `
interface HasName {
  name: string;
}

interface HasAge {
  age: number;
}

interface UnusedInterface {
  value: string;
}

export type Person = HasName & HasAge;

export function test(param: Person): void {
  console.log(param.name);
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedInterface');
  });

  it('should handle exported types', () => {
    tempDir = createTempProject({
      'index.ts': `
export interface ExportedUnused {
  value: string;
}

interface LocalUnused {
  data: number;
}

export function test(): void {
  console.log('test');
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(2);
    const exported = results.find((r) => r.typeName === 'ExportedUnused');
    const local = results.find((r) => r.typeName === 'LocalUnused');

    expect(exported?.isExported).toBe(true);
    expect(local?.isExported).toBe(false);
  });

  it('should provide line and column information', () => {
    tempDir = createTempProject({
      'index.ts': `
interface UnusedInterface {
  value: string;
}

export function test(): void {
  console.log('test');
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].line).toBeGreaterThan(0);
    expect(results[0].column).toBeGreaterThanOrEqual(0);
    expect(results[0].entireLine).toContain('interface UnusedInterface');
  });

  it('should handle generic types', () => {
    tempDir = createTempProject({
      'index.ts': `
interface Container<T> {
  value: T;
}

interface UnusedContainer<T> {
  data: T;
}

export function test(param: Container<string>): void {
  console.log(param.value);
}
`,
    });

    const files = [path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedContainer');
  });

  it('should handle type references across multiple files', () => {
    tempDir = createTempProject({
      'types.ts': `
export interface UsedType {
  name: string;
}

export interface UnusedType {
  value: number;
}
`,
      'index.ts': `
import { UsedType } from './types';

export function test(param: UsedType): void {
  console.log(param.name);
}
`,
    });

    const files = [path.join(tempDir, 'types.ts'), path.join(tempDir, 'index.ts')];
    const results = analyzeUnusedTypes(files);

    expect(results.length).toBe(1);
    expect(results[0].typeName).toBe('UnusedType');
  });
});
