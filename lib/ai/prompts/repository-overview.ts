import type { RepositoryData } from '../../../types/electron.d';

// Default prompt template for repository overview generation
export const DEFAULT_REPOSITORY_OVERVIEW_PROMPT = `
Analyze this codebase and create a comprehensive project overview file following this exact structure:

## 1. Project Overview
Write 2-3 sentences describing what this project is and its primary purpose.

## 2. Purpose
Create 4-5 bullet points explaining the main goals and use cases of the application. Each bullet should have a bold title followed by a description.

## 3. Tech Stack
Organize the technology stack into logical categories. For each category, list the specific packages/tools with their versions when relevant. Categories should include:
- Core Framework
- Database & Backend
- Authentication & User Management (if applicable)
- UI Components & Styling
- State Management & Data Fetching
- Testing & Development Tools
- Monitoring & Error Tracking (if applicable)

## 4. Key Features
List 10-15 key features as bullet points.

## 5. Folder Structure
Document the main directories with:
- Directory path in bold
- Brief description of what it contains
- Subdirectories with their purposes (indented)

## 6. Architecture
Describe 6-8 key architectural patterns and decisions used in the project as bullet points.

## 7. Development Commands
List the essential npm/yarn scripts with descriptions:
- dev, build, test, lint, format, typecheck
- Any project-specific commands (migrations, code generation, etc.)

---

Important guidelines:
- Be specific, not generic. Reference actual file paths and package names from the codebase.
- Use consistent markdown formatting with headers, bold text, and bullet points.
- Keep descriptions concise but informative.
- Focus on what makes this project unique, not boilerplate explanations.

Here is the repository data to analyze:

Repository: {{repositoryName}}
Path: {{repositoryPath}}

### File Tree
\`\`\`
{{fileTree}}
\`\`\`

### package.json
\`\`\`json
{{packageJson}}
\`\`\`

### TypeScript Config
\`\`\`json
{{tsConfig}}
\`\`\`

### README
{{readme}}

### Other Configuration Files
{{otherConfigs}}
`;

/**
 * Build the repository overview prompt by replacing template variables with actual data.
 *
 * @param data - The repository data collected from the file system
 * @param customPrompt - Optional custom prompt template to use instead of the default
 * @returns The prompt with all template variables replaced
 */
export function buildRepositoryOverviewPrompt(data: RepositoryData, customPrompt?: string): string {
  const template = customPrompt ?? DEFAULT_REPOSITORY_OVERVIEW_PROMPT;

  // Build other configs section from available data
  const otherConfigs = buildOtherConfigsSection(data);

  // Replace template variables with actual data
  // Use empty strings or placeholder text for missing optional fields
  return template
    .replace('{{repositoryName}}', data.name)
    .replace('{{repositoryPath}}', data.path)
    .replace('{{fileTree}}', data.fileTree)
    .replace('{{packageJson}}', data.packageJson ?? 'No package.json found')
    .replace('{{tsConfig}}', data.tsConfig ?? 'No TypeScript config found')
    .replace('{{readme}}', data.readmeFile ?? 'No README found')
    .replace('{{otherConfigs}}', otherConfigs);
}

/**
 * Build the "Other Configuration Files" section from available data.
 */
function buildOtherConfigsSection(data: RepositoryData): string {
  const sections: Array<string> = [];

  // Add detected framework info
  if (data.framework !== 'unknown') {
    sections.push(`**Detected Framework**: ${formatFrameworkName(data.framework)}`);
  }

  // Add primary languages
  if (data.primaryLanguages.length > 0) {
    sections.push(`**Primary Languages**: ${data.primaryLanguages.join(', ')}`);
  }

  // Add feature flags
  const features: Array<string> = [];
  if (data.hasTypeScript) {
    features.push('TypeScript');
  }
  if (data.hasTailwind) {
    features.push('Tailwind CSS');
  }
  if (features.length > 0) {
    sections.push(`**Key Technologies**: ${features.join(', ')}`);
  }

  // Add file stats
  sections.push(`**Repository Stats**: ${data.totalFiles} files, ${data.totalDirectories} directories`);

  // Add .env.example if present
  if (data.envExample) {
    sections.push(`\n**Environment Variables (.env.example)**:\n\`\`\`\n${data.envExample}\n\`\`\``);
  }

  return sections.length > 0 ? sections.join('\n') : 'No additional configuration files found';
}

/**
 * Format framework identifier to display name.
 */
function formatFrameworkName(framework: RepositoryData['framework']): string {
  const names: Record<RepositoryData['framework'], string> = {
    angular: 'Angular',
    next: 'Next.js',
    node: 'Node.js',
    react: 'React',
    unknown: 'Unknown',
    vue: 'Vue.js',
  };
  return names[framework];
}
