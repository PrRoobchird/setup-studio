import type { IncomingMessage, ServerResponse } from 'http';
import { handleQuizRequest } from '../lib/geminiHandlers.ts';

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
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
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
    const result = await handleQuizRequest(body);
    sendJson(res, result.status, result.payload);
  } catch {
    sendJson(res, 400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' });
  }
}
