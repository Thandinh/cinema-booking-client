import fs from 'fs';
import path from 'path';

const map = {
  "bg-slate-900": "bg-slate-50 dark:bg-slate-900",
  "bg-slate-800": "bg-white dark:bg-slate-800",
  "bg-slate-700": "bg-slate-100 dark:bg-slate-700",
  "text-white": "text-slate-900 dark:text-white",
  "text-slate-300": "text-slate-600 dark:text-slate-300",
  "text-slate-400": "text-slate-500 dark:text-slate-400",
  "border-slate-800": "border-slate-200 dark:border-slate-800",
  "border-slate-700": "border-slate-300 dark:border-slate-700",
  "border-slate-600": "border-slate-300 dark:border-slate-600"
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  Object.entries(map).forEach(([key, val]) => {
    // Replace whole word but avoid matching if already has 'dark:' prefix.
    // e.g., if content has "dark:bg-slate-900", we don't replace "bg-slate-900".
    const regex = new RegExp(`(?<!dark:)\\b${key}\\b`, 'g');
    content = content.replace(regex, val);
  });

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    changedCount++;
    console.log(`Updated: ${f}`);
  }
});

console.log(`Done! Updated ${changedCount} files.`);
