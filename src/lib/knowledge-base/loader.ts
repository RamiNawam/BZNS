import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// In-memory cache for loaded knowledge base files
const _cache = new Map<string, unknown>();

/**
 * Load a single JSON file from the data/ directory.
 * Results are cached in memory after the first load.
 */
export function loadDataFile<T = unknown>(relativePath: string): T {
  if (_cache.has(relativePath)) {
    return _cache.get(relativePath) as T;
  }

  const fullPath = path.join(DATA_DIR, relativePath);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const parsed = JSON.parse(raw) as T;
  _cache.set(relativePath, parsed);
  return parsed;
}

/**
 * Load all JSON files in a subdirectory of data/.
 * Returns a record of filename (without extension) -> parsed data.
 */
export function loadDirectory<T = unknown>(subDir: string): Record<string, T> {
  const dirPath = path.join(DATA_DIR, subDir);
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  const result: Record<string, T> = {};
  for (const file of files) {
    const key = file.replace('.json', '');
    result[key] = loadDataFile<T>(path.join(subDir, file));
  }
  return result;
}

/**
 * Clear the in-memory cache (useful after data updates).
 */
export function clearCache(): void {
  _cache.clear();
}

/**
 * Load all knowledge base sections needed for the AI assistant.
 */
export function loadAllKnowledgeBase(): Record<string, unknown> {
  return {
    businessStructures: loadDataFile('business_structures.json'),
    financialConstants: loadDataFile('financial_constants.json'),
    registration: loadDirectory('registration'),
    permits: loadDirectory('permits'),
    tax: loadDirectory('tax'),
    funding: loadDirectory('funding'),
    compliance: loadDirectory('compliance'),
  };
}
