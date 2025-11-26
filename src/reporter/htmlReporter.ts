import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AnalysisResult } from '../types';
import { generateReportTemplate } from './templates/reportTemplate';

/**
 * Generate an HTML report from analysis results
 */
export async function generateHtmlReport(
  results: AnalysisResult,
  outputPath?: string
): Promise<string> {
  // Determine output path
  const defaultOutputPath = path.join(process.cwd(), 'devghost-report', 'index.html');
  const finalOutputPath = outputPath || defaultOutputPath;

  // Ensure output directory exists
  const outputDir = path.dirname(finalOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate report content
  const generatedAt = new Date().toLocaleString();
  const htmlContent = generateReportTemplate(results, generatedAt);

  // Write to file
  fs.writeFileSync(finalOutputPath, htmlContent, 'utf-8');

  return finalOutputPath;
}

/**
 * Open the report in default browser
 */
export function openInBrowser(filePath: string): void {
  const absolutePath = path.resolve(filePath);
  const fileUrl = `file:///${absolutePath.replace(/\\/g, '/')}`;
  
  // Platform-specific open command
  const platform = process.platform;
  let command: string;

  if (platform === 'win32') {
    command = `start "" "${fileUrl}"`;
  } else if (platform === 'darwin') {
    command = `open "${fileUrl}"`;
  } else {
    command = `xdg-open "${fileUrl}"`;
  }

  // Execute command
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('child_process').exec(command);
}
