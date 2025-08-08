#!/usr/bin/env node
import assert from 'node:assert';

type Difficulty = 'easy' | 'medium' | 'hard';

function difficulty(total_time_min: number | undefined, steps: number, ings: number): Difficulty {
  const t = total_time_min ?? 0;
  if (t <= 25 && steps <= 6 && ings <= 8) return 'easy';
  if ((t > 25 && t <= 60) || steps <= 12) return 'medium';
  return 'hard';
}

assert.strictEqual(difficulty(20, 4, 5), 'easy');
assert.strictEqual(difficulty(30, 5, 5), 'medium');
assert.strictEqual(difficulty(10, 12, 5), 'medium');
assert.strictEqual(difficulty(120, 20, 15), 'hard');

console.log('difficulty tests OK');
