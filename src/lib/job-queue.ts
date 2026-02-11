type JobPayload = any;

interface JobRecord {
  id: string;
  type: string;
  payload: JobPayload;
  status: 'queued' | 'working' | 'done' | 'failed';
  result?: any;
  createdAt: string;
}

const jobs: Map<string, JobRecord> = new Map();

export function enqueue(type: string, payload: JobPayload) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const rec: JobRecord = { id, type, payload, status: 'queued', createdAt: new Date().toISOString() };
  jobs.set(id, rec);
  // kick worker
  process.nextTick(() => processQueue());
  return id;
}

export function getJob(id: string) {
  return jobs.get(id) || null;
}

let workerRunning = false;
async function processQueue() {
  if (workerRunning) return;
  workerRunning = true;

  try {
    for (const [id, job] of Array.from(jobs.entries())) {
      if (job.status !== 'queued') continue;
      job.status = 'working';
      try {
        // simple handler: export-csv
        if (job.type === 'export-csv') {
          const { startDate, endDate, pharmacyId, type } = job.payload;
          // call internal API to fetch summary (simulate heavy work)
          const res = await fetch(`http://localhost:3000/api/analytics/dispensing/summary?startDate=${startDate}&endDate=${endDate}${pharmacyId?`&pharmacyId=${pharmacyId}`:''}`);
          const data = await res.json();
          // generate CSV string from topMedicines if available
          const rows: string[] = [];
          if (data?.data?.topMedicines) {
            const headers = ['drugId','drugCode','genericName','count','prescriptions','otc','riskCategory'];
            rows.push(headers.join(','));
            for (const m of data.data.topMedicines) {
              rows.push([m.drugId, m.drugCode, m.drugGenericName, m.count, m.prescriptionCount, m.otcCount, m.riskCategory].map(x => `"${String(x).replace(/"/g,'""')}"`).join(','));
            }
          }

          const content = rows.join('\n');
          job.result = { filename: `export_${startDate}_${endDate}.csv`, content };
          job.status = 'done';
          // Persist CSV to disk for reliable download
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const fs = require('fs');
            const path = require('path');
            const storageDir = path.resolve(process.cwd(), 'storage', 'exports');
            if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
            const filePath = path.join(storageDir, `${id}.csv`);
            fs.writeFileSync(filePath, content, 'utf8');

            // attempt to store result URL in DB if prisma available
            try {
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const prisma = require('@/lib/prisma').default;
              await prisma.exportJob.update({ where: { id }, data: { status: 'done', resultUrl: `file://${filePath}` } });
            } catch (e) {
              // ignore
            }
          } catch (e) {
            // ignore file write errors
          }
        } else {
          job.status = 'failed';
          job.result = { error: 'unknown job type' };
        }
      } catch (err) {
        job.status = 'failed';
        job.result = { error: String(err) };
        try {
          const prisma = require('@/lib/prisma').default;
          await prisma.exportJob.update({ where: { id }, data: { status: 'failed' } });
        } catch (e) {}
      }
    }
  } finally {
    workerRunning = false;
  }
}

export default { enqueue, getJob };
