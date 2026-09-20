import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Папки и файлы, которые не включаем в бандл
const SKIP_DIRS = new Set(['node_modules', '.git', 'reports', 'dist', 'build', 'coverage']);
const SKIP_FILES = new Set(['package-lock.json', '.env', 'bundle.txt', 'bundle.mjs']);
// Расширения, которые считаем текстовыми
const TEXT_EXTS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.json', '.md', '.txt', '.yml', '.yaml',
  '.html', '.css', '.env', '.example',
]);
// Файлы без расширения, которые тоже хотим включить
const TEXT_NAMES = new Set(['README', 'LICENSE', '.gitignore', '.env.example']);

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'bundle.txt');

function isTextFile(name) {
  if (TEXT_NAMES.has(name)) return true;
  return TEXT_EXTS.has(path.extname(name).toLowerCase());
}

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(full, files);
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      if (!isTextFile(entry.name)) continue;
      files.push(full);
    }
  }
  return files;
}

function makeTree(files) {
  // Простое дерево по относительным путям
  const tree = {};
  for (const f of files) {
    const rel = path.relative(ROOT, f).split(path.sep);
    let node = tree;
    for (const part of rel) {
      node[part] ??= {};
      node = node[part];
    }
  }

  const lines = [];
  const render = (node, prefix = '') => {
    const keys = Object.keys(node).sort();
    keys.forEach((key, i) => {
      const last = i === keys.length - 1;
      lines.push(prefix + (last ? '└── ' : '├── ') + key);
      if (Object.keys(node[key]).length) {
        render(node[key], prefix + (last ? '    ' : '│   '));
      }
    });
  };
  render(tree);
  return lines.join('\n');
}

async function main() {
  const files = await walk(ROOT);
  files.sort();

  const parts = [];
  parts.push('='.repeat(80));
  parts.push('PROJECT STRUCTURE');
  parts.push('='.repeat(80));
  parts.push(makeTree(files));
  parts.push('');

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const content = await readFile(file, 'utf8');
    parts.push('='.repeat(80));
    parts.push(`FILE: ${rel}`);
    parts.push('='.repeat(80));
    parts.push(content.trimEnd());
    parts.push('');
  }

  await writeFile(OUT, parts.join('\n'), 'utf8');
  console.log(`✓ Собрано ${files.length} файлов → ${path.relative(ROOT, OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});