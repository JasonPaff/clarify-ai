import type { BundledLanguage } from 'shiki';

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

/** Map of file extensions to Shiki language identifiers */
const EXTENSION_TO_LANGUAGE: Record<string, BundledLanguage> = {
  '.bash': 'bash',
  '.c': 'c',
  '.cpp': 'cpp',
  '.cs': 'csharp',
  '.css': 'css',
  '.go': 'go',
  '.h': 'c',
  '.hpp': 'cpp',
  '.html': 'html',
  '.java': 'java',
  '.js': 'javascript',
  '.json': 'json',
  '.jsx': 'jsx',
  '.kt': 'kotlin',
  '.less': 'less',
  '.lua': 'lua',
  '.md': 'markdown',
  '.php': 'php',
  '.py': 'python',
  '.rb': 'ruby',
  '.rs': 'rust',
  '.sass': 'sass',
  '.scss': 'scss',
  '.sh': 'bash',
  '.sql': 'sql',
  '.swift': 'swift',
  '.toml': 'toml',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.vue': 'vue',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.zsh': 'bash',
};

/**
 * Detects the Shiki language from a file path based on its extension.
 * Returns null if the extension is not recognized.
 */
export function getLanguageFromPath(filePath: string): BundledLanguage | null {
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1) return null;

  const extension = filePath.substring(lastDot).toLowerCase();
  return EXTENSION_TO_LANGUAGE[extension] ?? null;
}
