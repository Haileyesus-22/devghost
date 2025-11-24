import * as fs from 'node:fs';
import * as path from 'node:path';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export function detectPackageManager(projectRoot: string): PackageManager {
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
    return 'yarn';
  } else if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  } else {
    return 'npm';
  }
}

export function getUninstallCommand(
  packageManager: PackageManager,
  packageName: string,
  _isDev: boolean
): string {
  switch (packageManager) {
    case 'yarn':
      return `yarn remove ${packageName}`;
    case 'pnpm':
      return `pnpm remove ${packageName}`;
    default:
      return `npm uninstall ${packageName}`;
  }
}
