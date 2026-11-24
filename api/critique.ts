import type { IncomingMessage, ServerResponse } from 'http';
import { handleCritiqueRequest } from '../lib/geminiHandlers.ts';

type VercelReq = IncomingMessage & { body?: unknown; method?: string };
type VercelRes = ServerResponse & {
  status?: (code: number) => VercelRes;
  json?: (data: unknown) => void;
};

async function readJsonBody(req: VercelReq): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body) as Record<string, unknown>;
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  const maxBytes = 12 * 1024 * 1024;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.length;
    if (totalBytes > maxBytes) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await handleCritiqueRequest(body);
    sendJson(res, result.status, result.payload);
  } catch (err) {
    if (err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(res, 413, { error: 'ไฟล์ภาพใหญ่เกินไป กรุณาลดขนาดภาพแล้วลองใหม่อีกครั้งนะ' });
      return;
    }
    sendJson(res, 400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' });
  }
}
