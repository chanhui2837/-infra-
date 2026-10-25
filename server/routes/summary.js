import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Trip from '../models/Trip.js';
import Revision from '../models/Revision.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REGIONS = ['춘천', '양구', '홍천', '인제', '철원', '화천'];

function readNotes() {
  try {
    const p = path.join(__dirname, '..', 'data', 'notes.json');
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return [];
  }
}

function isDone(value) {
  return /완료/.test(String(value || ''));
}

/** 지역별 대상/완료/미완료/조치율 집계 */
function summarize(items, doneField) {
  const byRegion = {};
  for (const r of REGIONS) byRegion[r] = { region: r, total: 0, done: 0, pending: 0 };

  let total = 0;
  let done = 0;

  for (const it of items) {
    const region = it.region || '기타';
    if (!byRegion[region]) byRegion[region] = { region, total: 0, done: 0, pending: 0 };
    const ok = isDone(it[doneField]);
    byRegion[region].total += 1;
    if (ok) byRegion[region].done += 1;
    else byRegion[region].pending += 1;
    total += 1;
    if (ok) done += 1;
  }

  const regions = Object.values(byRegion).map((r) => ({
    ...r,
    rate: r.total ? r.done / r.total : 0,
  }));

  return {
    total,
    done,
    pending: total - done,
    rate: total ? done / total : 0,
    regions,
  };
}

router.get('/', async (_req, res) => {
  const [trips, revisions] = await Promise.all([Trip.find().lean(), Revision.find().lean()]);

  res.json({
    updatedAt: new Date().toISOString(),
    trips: summarize(trips, 'actionResult'),
    revisions: summarize(revisions, 'done'),
    notes: readNotes(),
  });
});

export default router;
