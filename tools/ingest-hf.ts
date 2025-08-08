#!/usr/bin/env node
import process from 'node:process';

async function main() {
  const datasetId = process.argv[2];
  if (!datasetId) {
    console.error('usage: ingest-hf <namespace/dataset>');
    process.exit(1);
  }
  // This stub refuses to ingest unless license is explicitly commercial-safe
  // In a full implementation, call the Hugging Face Hub API to fetch the dataset card and inspect license.
  console.error(`Refusing to ingest ${datasetId}: license check not implemented. Treating as non-commercial.`);
  process.exit(2);
}

main();
