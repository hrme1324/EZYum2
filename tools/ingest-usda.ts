#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pRetry from 'p-retry';
import { z } from 'zod';

const Row = z.object({
  title: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  total_time_min: z.number().optional(),
  image_url: z.string().url().optional(),
  source_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  license: z.literal('Public Domain'),
});

type Row = z.infer<typeof Row>;

type Difficulty = 'easy' | 'medium' | 'hard';

function difficulty(r: Row): Difficulty {
  const t = r.total_time_min ?? 0;
  const steps = r.instructions.length;
  const ings = r.ingredients.length;
  if (t <= 25 && steps <= 6 && ings <= 8) return 'easy';
  if ((t > 25 && t <= 60) || steps <= 12) return 'medium';
  return 'hard';
}

function normalize(row: Row) {
  return {
    title: row.title.trim(),
    ingredients: row.ingredients.map((s) => s.trim()).filter(Boolean),
    instructions: row.instructions.map((s) => s.trim()).filter(Boolean),
    cook_time_min: row.total_time_min ?? null,
    difficulty: difficulty(row),
    image_url: row.image_url ?? null,
    source_url: row.source_url ?? null,
    video_url: row.video_url ?? null,
    license: row.license,
  };
}

async function parseInput(srcPath: string): Promise<Row[]> {
  const content = await fs.readFile(srcPath, 'utf8');
  const lower = srcPath.toLowerCase();
  if (lower.endsWith('.json')) {
    const data = JSON.parse(content);
    const arr: any[] = Array.isArray(data) ? data : data.items || data.recipes || [];
    return arr.map((item, idx) => {
      const parsed = Row.safeParse(item);
      if (!parsed.success) {
        throw new Error(`Row ${idx} invalid: ${parsed.error.message}`);
      }
      return parsed.data;
    });
  }
  if (lower.endsWith('.csv')) {
    // Simple CSV expectation with JSON arrays in ingredients/instructions columns
    const lines = content.split(/\r?\n/).filter(Boolean);
    const header = lines.shift();
    if (!header) return [];
    const cols = header.split(',').map((h) => h.trim());
    const idx = (name: string) => cols.indexOf(name);
    const iTitle = idx('title');
    const iIngs = idx('ingredients');
    const iSteps = idx('instructions');
    const iTime = idx('total_time_min');
    const iImg = idx('image_url');
    const iSrc = idx('source_url');
    const iVid = idx('video_url');
    const iLic = idx('license');
    return lines.map((line, li) => {
      const parts = line.split(',');
      const row = {
        title: parts[iTitle]?.trim() || '',
        ingredients: JSON.parse(parts[iIngs] || '[]'),
        instructions: JSON.parse(parts[iSteps] || '[]'),
        total_time_min: parts[iTime] ? Number(parts[iTime]) : undefined,
        image_url: parts[iImg] || undefined,
        source_url: parts[iSrc] || undefined,
        video_url: parts[iVid] || undefined,
        license: (parts[iLic] || '').trim(),
      } as any;
      const parsed = Row.safeParse(row);
      if (!parsed.success) {
        throw new Error(`CSV row ${li} invalid: ${parsed.error.message}`);
      }
      return parsed.data;
    });
  }
  throw new Error('Unsupported input format. Provide a .json or .csv file');
}

async function main() {
  const src = process.argv[2];
  if (!src) throw new Error('usage: ingest-usda <json|csv path>');
  const rows = await pRetry(() => parseInput(src), { retries: 2 });

  // License enforcement (fail closed)
  for (const r of rows) {
    if (r.license !== 'Public Domain') {
      throw new Error(`Blocked by license policy: ${r.title} (${r.license})`);
    }
  }

  const out = path.resolve('tools/out/usda.ndjson');
  await fs.mkdir(path.dirname(out), { recursive: true });
  const normalized = rows.map(normalize);
  const ndjson = normalized.map((r) => JSON.stringify(r)).join('\n') + '\n';
  await fs.writeFile(out, ndjson, 'utf8');
  console.log(`wrote ${out} (${normalized.length} recipes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
