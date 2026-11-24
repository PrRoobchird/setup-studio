import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractErrorDetails(error: unknown): { status?: number; message: string } {
  if (error && typeof error === 'object') {
    const errObj = error as { status?: number; code?: number; message?: string };
    const status = typeof errObj.status === 'number' ? errObj.status : errObj.code;
    const message = typeof errObj.message === 'string' ? errObj.message : String(error);
    return { status, message };
  }
  return { message: String(error) };
}

function isRetryableError(error: unknown): boolean {
  const { status, message } = extractErrorDetails(error);
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  return /RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED|ECONNRESET|ETIMEDOUT|fetch failed/i.test(
    message
  );
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries || !isRetryableError(err)) {
        throw err;
      }
      const delayMs = 600 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function parseModelJson(raw: string | undefined): Record<string, unknown> {
  const trimmed = (raw ?? '{}')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error('INVALID_MODEL_JSON');
  }
}

function mapGeminiErrorResponse(error: unknown, fallbackMessage: string): { status: number; error: string } {
  const { status, message } = extractErrorDetails(error);

  if (message.includes('GEMINI_API_KEY_MISSING')) {
    return {
      status: 503,
      error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Settings > Secrets กรุณาตรวจสอบก่อนนะ',
    };
  }
  if (
    status === 403 ||
    status === 400 ||
    /PERMISSION_DENIED|API_KEY_INVALID|API key not valid/i.test(message)
  ) {
    return {
      status: 400,
      error: 'API Key ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง กรุณาตรวจสอบคีย์ใน Settings > Secrets',
    };
  }
  if (status === 404 || /NOT_FOUND/i.test(message)) {
    return {
      status: 404,
      error: 'ไม่พบโมเดล AI ที่เรียกใช้งาน กรุณาลองอัปเดตหรือรีสตาร์ทเซิร์ฟเวอร์อีกครั้ง',
    };
  }
  if (status === 429 || /RESOURCE_EXHAUSTED/i.test(message)) {
    return {
      status: 429,
      error: 'โควตาการใช้งาน Gemini API เต็มชั่วคราว ลองใหม่อีกครั้งในสักครู่ หรือเช็ก API Key ใน Settings > Secrets นะ',
    };
  }
  return {
    status: 500,
    error: fallbackMessage,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.post('/api/critique', async (req, res) => {
    try {
      const { imageBase64, mimeType, category, note, studentTrack } = req.body ?? {};

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'กรุณาอัปโหลดรูปภาพผลงานก่อนส่งตรวจนะ' });
      }

      const ai = getGeminiClient();
      const cleanBase64 = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;
      const safeMimeType = typeof mimeType === 'string' && mimeType.startsWith('image/')
        ? mimeType
        : 'image/jpeg';

      const promptText = [
        `หมวดหมู่ผลงาน: ${category || 'ทั่วไป'}`,
        studentTrack ? `สายการเรียนของน้อง: ${studentTrack}` : '',
        note ? `โน้ตจากน้อง: "${note}"` : '',
        'ช่วยวิเคราะห์ผลงานในภาพนี้อย่างละเอียดและอบอุ่น แล้วตอบกลับเป็น JSON ตามโครงสร้างที่กำหนด',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: safeMimeType,
                  data: cleanBase64,
                },
              },
              { text: promptText },
            ],
          },
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'คุณคือ "พี่ติวเตอร์ใจดีแห่ง Born to be Art" ติวเตอร์สอนศิลปะและการออกแบบที่เชี่ยวชาญการติวเข้ามหาวิทยาลัย (TCAS สายสถาปัตยกรรม นิเทศศิลป์ มัณฑนศิลป์ แฟชั่น วิจิตรศิลป์) พูดจากับน้องๆ นักเรียนมัธยมด้วยภาษาไทยที่เป็นกันเอง อบอุ่น สนุกสนาน ให้กำลังใจ แต่มีความแม่นยำทางวิชาการศิลปะ วิเคราะห์ภาพจริงที่น้องส่งมาอย่างเจาะจง:\n' +
              '- coinsEarned: คะแนนเหรียญ Idea Coins ระหว่าง 100 ถึง 300 ตามความสมบูรณ์ ความตั้งใจ และเทคนิคในภาพ\n' +
              '- fameEarned: คะแนนชื่อเสียง Studio Fame ระหว่าง 10 ถึง 50\n' +
              '- compliment: คำชมจุดเด่นของงานชิ้นนี้อย่างเจาะจงกับสิ่งที่เห็นในภาพจริง (2-3 ประโยค)\n' +
              '- advice: คำแนะนำเชิงเทคนิคสั้นๆ 1 ข้อที่ทำตามได้จริงเพื่อพัฒนาชิ้นต่อไป\n' +
              '- designTip: เกร็ดความรู้ด้านศิลปะ หรือชื่อศิลปิน/สถาปนิก/นักออกแบบที่เกี่ยวข้องกับสไตล์งานนี้ 1 ข้อ',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                coinsEarned: {
                  type: Type.INTEGER,
                  description: 'Number between 100 and 300 based on artwork completeness.',
                },
                fameEarned: {
                  type: Type.INTEGER,
                  description: 'Number between 10 and 50 based on artistic merit.',
                },
                compliment: {
                  type: Type.STRING,
                  description: 'Specific friendly praise in Thai about the submitted artwork.',
                },
                advice: {
                  type: Type.STRING,
                  description: 'One concise technical advice in Thai to improve next time.',
                },
                designTip: {
                  type: Type.STRING,
                  description: 'One art/design trivia or related artist/architect reference in Thai.',
                },
              },
              required: ['coinsEarned', 'fameEarned', 'compliment', 'advice', 'designTip'],
            },
          },
        })
      );

      const parsed = parseModelJson(response.text);

      const coinsEarned = Math.min(300, Math.max(100, Math.round(Number(parsed.coinsEarned) || 150)));
      const fameEarned = Math.min(50, Math.max(10, Math.round(Number(parsed.fameEarned) || 20)));

      return res.json({
        coinsEarned,
        fameEarned,
        compliment: String(parsed.compliment || 'งานชิ้นนี้ตั้งใจมากเลยนะ เส้นสายมีพลังดีมาก!'),
        advice: String(parsed.advice || 'ลองเพิ่มน้ำหนักเข้ม-อ่อนในจุดโฟกัสเพื่อให้งานมีมิติชัดขึ้นอีกนิดนะ'),
        designTip: String(parsed.designTip || 'ลองศึกษาการใช้แสงเงาแบบ Chiaroscuro เพื่อเพิ่มอารมณ์ให้งานดูมีชีวิตชีวาขึ้น'),
      });
    } catch (error: unknown) {
      const { status, message } = extractErrorDetails(error);
      console.error('Critique API error:', status ?? 'no-status', message);
      const mapped = mapGeminiErrorResponse(
        error,
        'ไม่สามารถเชื่อมต่อระบบตรวจงานได้ชั่วคราว ลองกดส่งใหม่อีกครั้งนะ'
      );
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  app.post('/api/quiz', async (req, res) => {
    try {
      const { topic, previousQuestions } = req.body ?? {};
      const ai = getGeminiClient();

      const topicPool = [
        'ทฤษฎีสี (Color Theory) เช่น สีคู่ตรงข้าม วรรณะสี ค่าความอิ่มตัว',
        'องค์ประกอบศิลป์ (Composition) เช่น จุดนำสายตา สมดุล สัดส่วนทองคำ',
        'ประวัติศาสตร์ศิลปะไทยและสากล เช่น บาวเฮาส์ อิมเพรสชันนิสม์ ศิลปะไทยร่วมสมัย',
        'หลักการออกแบบสถาปัตยกรรมและนิเทศศิลป์ เช่น Typography, Space, Perspective',
      ];
      const selectedTopic =
        typeof topic === 'string' && topic.trim().length > 0
          ? topic
          : topicPool[Math.floor(Math.random() * topicPool.length)];

      const prevList = Array.isArray(previousQuestions) ? previousQuestions.slice(-6) : [];
      const avoidPrompt =
        prevList.length > 0
          ? `\nห้ามออกคำถามซ้ำกับหัวข้อเหล่านี้:\n- ${prevList.join('\n- ')}`
          : '';

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `ช่วยสร้างคำถามควิซเตรียมสอบ TCAS ศิลปะและการออกแบบ 1 ข้อ ในหัวข้อ: ${selectedTopic}${avoidPrompt}`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'คุณคือพี่ติวเตอร์แห่ง Born to be Art กำลังทำ Mini-Quiz สนุกๆ ให้น้อง ม.ปลาย ฝึกเตรียมสอบเข้าคณะสายศิลปะและการออกแบบ (TCAS) ออกข้อสอบปรนัย 4 ตัวเลือกเป็นภาษาไทยที่ถูกต้องตามหลักวิชาการ ชัดเจน ไม่อำพราง และให้คำอธิบายเฉลยสั้นๆ ที่อ่านเข้าใจง่ายเป็นกันเอง',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description: 'Short Thai category name like ทฤษฎีสี, องค์ประกอบศิลป์, ประวัติศาสตร์ศิลปะ, หลักการออกแบบ',
                },
                question: {
                  type: Type.STRING,
                  description: 'The quiz question in Thai.',
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Exactly 4 distinct multiple choice options in Thai.',
                },
                correctIndex: {
                  type: Type.INTEGER,
                  description: 'Zero-based index (0 to 3) of the correct option.',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Short friendly tutor explanation in Thai why the answer is correct.',
                },
              },
              required: ['category', 'question', 'options', 'correctIndex', 'explanation'],
            },
          },
        })
      );

      const parsed = parseModelJson(response.text);

      const options = Array.isArray(parsed.options)
        ? parsed.options.slice(0, 4).map((o: unknown) => String(o))
        : [];
      if (options.length < 4) {
        throw new Error('Invalid quiz options generated');
      }
      const correctIndex = Math.min(3, Math.max(0, Math.round(Number(parsed.correctIndex) || 0)));

      return res.json({
        category: String(parsed.category || 'ความรู้ศิลปะและการออกแบบ'),
        question: String(parsed.question),
        options,
        correctIndex,
        explanation: String(parsed.explanation || 'เก่งมาก! จำหลักข้อนี้ไว้ใช้ทำข้อสอบและจัดพอร์ตได้เลย'),
      });
    } catch (error: unknown) {
      const { status, message } = extractErrorDetails(error);
      console.error('Quiz API error:', status ?? 'no-status', message);
      const mapped = mapGeminiErrorResponse(
        error,
        'ไม่สามารถสร้างโจทย์ควิซได้ในขณะนี้ ลองกดใหม่อีกครั้งนะ'
      );
      return res.status(mapped.status).json({ error: mapped.error });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Born to be Art: Dream Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
