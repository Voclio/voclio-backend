/**
 * Migration script: move existing local voice files to cloud storage
 * Usage: node scripts/migrate-to-cloud.js [--dry-run]
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { syncDatabase } from '../src/models/orm/index.js';
import { VoiceRecording } from '../src/models/orm/index.js';
import storageService from '../src/services/storage.service.js';
import logger from '../src/utils/logger.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function migrate() {
  logger.info(`🚀 Starting cloud migration${DRY_RUN ? ' (DRY RUN)' : ''}...`);

  await syncDatabase(false);

  // Find all recordings that still have a local path (no storage_key yet)
  const recordings = await VoiceRecording.findAll({
    where: { storage_key: null }
  });

  logger.info(`Found ${recordings.length} recordings to migrate`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const recording of recordings) {
    const localPath = recording.file_path;

    // Skip if already a URL (already migrated or cloud URL)
    if (!localPath || localPath.startsWith('http')) {
      skipped++;
      continue;
    }

    // Resolve absolute path
    const absPath = path.isAbsolute(localPath)
      ? localPath
      : path.join(process.cwd(), localPath);

    if (!fs.existsSync(absPath)) {
      logger.warn(`⚠️  File not found, skipping recording ${recording.recording_id}: ${absPath}`);
      skipped++;
      continue;
    }

    try {
      if (!DRY_RUN) {
        const result = await storageService.uploadFromPath(absPath, recording.user_id, {
          folder: 'voice',
          contentType: recording.format || 'audio/mpeg'
        });

        await recording.update({
          file_path: result.url,
          storage_key: result.key
        });

        logger.info(`✅ Migrated recording ${recording.recording_id} → ${result.key}`);
      } else {
        logger.info(`[DRY RUN] Would migrate recording ${recording.recording_id}: ${absPath}`);
      }

      success++;
    } catch (err) {
      logger.error(`❌ Failed recording ${recording.recording_id}:`, err.message);
      failed++;
    }
  }

  logger.info('─'.repeat(50));
  logger.info(`Migration complete:`);
  logger.info(`  ✅ Migrated : ${success}`);
  logger.info(`  ⏭️  Skipped  : ${skipped}`);
  logger.info(`  ❌ Failed   : ${failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

migrate().catch(err => {
  logger.error('Migration crashed:', err);
  process.exit(1);
});
