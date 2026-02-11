/**
 * clean-pharmacy-ids.ts
 *
 * Usage:
 *  npx ts-node src/scripts/clean-pharmacy-ids.ts --map ./pharmacy-mapping.json --dry-run
 *  npx ts-node src/scripts/clean-pharmacy-ids.ts --mapInline '{"PHA002":"PHA001"}'
 *
 * The script supports a dry-run mode which prints counts and the SQL operations
 * it would perform. When run without `--dry-run` it applies updates inside a
 * transaction per mapping entry.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Initialize Prisma client similar to application wrapper
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in the environment. Aborting.');
  process.exit(1);
}

let prisma: PrismaClient;
try {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prismaOptions: Prisma.PrismaClientOptions = { adapter };
  prisma = new PrismaClient(prismaOptions);
} catch (e) {
  console.error('Failed to initialize Prisma client for script:', e);
  process.exit(1);
}

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function parseArgs() {
  const args = process.argv.slice(2);
  const out: any = { dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') out.dryRun = true;
    if (a === '--map' && args[i + 1]) { out.mapFile = args[i + 1]; i++; }
    if (a === '--mapInline' && args[i + 1]) { out.mapInline = args[i + 1]; i++; }
  }
  return out;
}

async function loadMapping(opts: any): Promise<Record<string,string>> {
  if (opts.mapInline) {
    try { return JSON.parse(opts.mapInline); } catch (e) { throw new Error('Invalid JSON in --mapInline'); }
  }
  if (opts.mapFile) {
    const p = path.resolve(opts.mapFile);
    if (!fs.existsSync(p)) throw new Error(`Mapping file not found: ${p}`);
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  }
  throw new Error('No mapping provided. Use --map <file> or --mapInline <json>');
}

async function preview(mapping: Record<string,string>) {
  console.log('Preview mode: counts for each mapping (old -> new)');
  for (const oldId of Object.keys(mapping)) {
    const newId = mapping[oldId];
    const countDisp = await prisma.dispensingEvent.count({ where: { pharmacyId: oldId } });
    const countAlerts = await prisma.highRiskAlert.count({ where: { pharmacyId: oldId } });
    console.log(`  ${oldId} -> ${newId}: dispensingEvent=${countDisp}, highRiskAlert=${countAlerts}`);
  }
}

async function applyMapping(mapping: Record<string,string>) {
  console.log('Applying mappings...');
  for (const oldId of Object.keys(mapping)) {
    const newId = mapping[oldId];
    console.log(`
  Mapping ${oldId} -> ${newId}`);
    // Use transaction to update both tables atomically for this mapping
    const [beforeDisp, beforeAlert] = await Promise.all([
      prisma.dispensingEvent.count({ where: { pharmacyId: oldId } }),
      prisma.highRiskAlert.count({ where: { pharmacyId: oldId } }),
    ]);

    console.log(`    Before: dispensingEvent=${beforeDisp}, highRiskAlert=${beforeAlert}`);

    const tx = await prisma.$transaction([
      prisma.dispensingEvent.updateMany({ where: { pharmacyId: oldId }, data: { pharmacyId: newId } }),
      prisma.highRiskAlert.updateMany({ where: { pharmacyId: oldId }, data: { pharmacyId: newId } }),
    ]);

    const [updatedDisp, updatedAlert] = tx.map((r: any) => r.count ?? (r as any).count ?? r);
    console.log(`    Updated: dispensingEvent=${(tx[0] as any).count || updatedDisp}, highRiskAlert=${(tx[1] as any).count || updatedAlert}`);
  }
}

async function main() {
  const opts = parseArgs();
  let mapping: Record<string,string>;
  try {
    mapping = await loadMapping(opts);
  } catch (e: any) {
    console.error('Error loading mapping:', e.message);
    process.exit(1);
    return;
  }

  try {
    if (opts.dryRun) {
      await preview(mapping);
      console.log('\nDry-run complete. To apply changes, run without --dry-run.');
      process.exit(0);
    }

    await applyMapping(mapping);
    console.log('\nMapping applied successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Error applying mapping:', e);
    process.exit(2);
  }
}

// ESM-compatible entry detection for ts-node/Node
const invokedFile = process.argv[1] || '';
if (invokedFile.includes('clean-pharmacy-ids.ts') || invokedFile.endsWith('clean-pharmacy-ids.js')) {
  main();
}
