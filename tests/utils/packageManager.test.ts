import { detectPackageManager, getUninstallCommand } from '../../src/utils/packageManager';
import { cleanupTempProject, createTempProject } from '../utils';

describe('packageManager', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      cleanupTempProject(tempDir);
    }
  });

  describe('detectPackageManager', () => {
    it('should detect npm when package-lock.json exists', () => {
      tempDir = createTempProject({
        'package-lock.json': '{}',
      });

      const detected = detectPackageManager(tempDir);
      expect(detected).toBe('npm');
    });

    it('should detect yarn when yarn.lock exists', () => {
      tempDir = createTempProject({
        'yarn.lock': '',
      });

      const detected = detectPackageManager(tempDir);
      expect(detected).toBe('yarn');
    });

    it('should detect pnpm when pnpm-lock.yaml exists', () => {
      tempDir = createTempProject({
        'pnpm-lock.yaml': '',
      });

      const detected = detectPackageManager(tempDir);
      expect(detected).toBe('pnpm');
    });

    it('should prefer yarn over npm when both lock files exist', () => {
      tempDir = createTempProject({
        'yarn.lock': '',
        'package-lock.json': '{}',
      });

      const detected = detectPackageManager(tempDir);
      expect(detected).toBe('yarn');
    });

    it('should prefer pnpm over yarn when both lock files exist', () => {
      tempDir = createTempProject({
        'pnpm-lock.yaml': '',
        'yarn.lock': '',
      });

      const detected = detectPackageManager(tempDir);
      expect(detected).toBe('pnpm');
    });

    it('should default to npm when no lock files exist', () => {
      tempDir = createTempProject({
        'package.json': '{}',
      });

      const detected = detectPackageManager(tempDir);
      expect(detected).toBe('npm');
    });
  });

  describe('getUninstallCommand', () => {
    it('should generate npm uninstall command', () => {
      const command = getUninstallCommand('npm', 'lodash', false);
      expect(command).toBe('npm uninstall lodash');
    });

    it('should generate yarn remove command', () => {
      const command = getUninstallCommand('yarn', 'lodash', false);
      expect(command).toBe('yarn remove lodash');
    });

    it('should generate pnpm remove command', () => {
      const command = getUninstallCommand('pnpm', 'lodash', false);
      expect(command).toBe('pnpm remove lodash');
    });

    it('should handle scoped packages', () => {
      const npmCommand = getUninstallCommand('npm', '@types/node', false);
      const yarnCommand = getUninstallCommand('yarn', '@types/node', false);
      const pnpmCommand = getUninstallCommand('pnpm', '@types/node', false);

      expect(npmCommand).toBe('npm uninstall @types/node');
      expect(yarnCommand).toBe('yarn remove @types/node');
      expect(pnpmCommand).toBe('pnpm remove @types/node');
    });

    it('should handle dev dependency flag (currently ignored)', () => {
      // The current implementation ignores the isDev flag
      // Testing that it doesn't cause errors
      const command = getUninstallCommand('npm', 'jest', true);
      expect(command).toBe('npm uninstall jest');
    });

    it('should handle packages with special characters', () => {
      const command = getUninstallCommand('npm', '@biomejs/biome', false);
      expect(command).toBe('npm uninstall @biomejs/biome');
    });
  });

  describe('integration', () => {
    it('should detect package manager and generate appropriate command', () => {
      tempDir = createTempProject({
        'yarn.lock': '',
        'package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            lodash: '^4.17.21',
          },
        }),
      });

      const detected = detectPackageManager(tempDir);
      const command = getUninstallCommand(detected, 'lodash', false);

      expect(command).toBe('yarn remove lodash');
    });
  });
});
