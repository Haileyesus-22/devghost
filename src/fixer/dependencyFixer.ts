import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { detectPackageManager, getUninstallCommand } from "../utils/packageManager";

export interface DependencyFixResult {
    success: boolean;
    packageName:string;
    error?:string;
}

export async function removeDependency(
    packageName:string,
    projectRoot:string,
    isDev:boolean,
    dryRun:boolean = false  
): Promise<DependencyFixResult>{

    const packageManager = detectPackageManager(projectRoot);
    const uninstallCommand = getUninstallCommand(packageManager,packageName,isDev);
    try {
        if(dryRun){
            console.log(chalk.blue(`[Dry Run] Would execute: ${uninstallCommand} in ${projectRoot}`));
            return {
                success:true,
                packageName
            };
        }else{
            execSync(uninstallCommand,{cwd:projectRoot, stdio:'inherit'});
            return {
                success:true,
                packageName
            };
        }
        
    } catch (error) {
        const errorMessage = (error as Error).message;
        
        // Check for common error patterns and provide friendly messages
        let friendlyMessage = errorMessage;
        if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ETIMEDOUT')) {
            friendlyMessage = 'Network error - check your internet connection';
        } else if (errorMessage.includes('ENOENT')) {
            friendlyMessage = 'Package manager not found - ensure npm/yarn/pnpm is installed';
        } else if (errorMessage.toLowerCase().includes('permission')) {
            friendlyMessage = 'Permission denied - try running with elevated privileges';
        }
        
        return {
            success: false,
            packageName,
            error: friendlyMessage
        };
    }
}

export async function removeDependencies(
    packages: string[],
    projectRoot: string,
    includeDevDeps: boolean,
    dryRun: boolean = false
): Promise<DependencyFixResult[]> {
    const pkgJsonPath = path.join(projectRoot, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    
    const results: DependencyFixResult[] = [];
    
    for (const packageName of packages) {
        const isDev = pkgJson.devDependencies && packageName in pkgJson.devDependencies;
        
        const result = await removeDependency(packageName, projectRoot, isDev, dryRun);
        results.push(result);
    }
    
    return results;
}