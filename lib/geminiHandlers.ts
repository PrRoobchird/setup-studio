import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';
const VERCEL_FALLBACK_MODEL = 'gemini-2.5-flash';

export interface HandlerResult {
  status: number;
  payload: Record<string, unknown>;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  const options: {
    apiKey: string;
    httpOptions?: { headers: Record<string, string> };
  } = { apiKey };

  if (!process.env.VERCEL) {
    options.httpOptions = {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    };
  }

  return new GoogleGenAI(options);
}

export function extractErrorDetails(error: unknown): { status?: number; message: string } {
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

function isModelNotFoundError(error: unknown): boolean {
  const { status, message } = extractErrorDetails(error);
  return status === 404 || /NOT_FOUND|is not found for API version/i.test(message);
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

async function generateWithModelFallback(
  ai: GoogleGenAI,
  buildParams: (model: string, includeThinking: boolean) => Parameters<GoogleGenAI['models']['generateContent']>[0]
) {
  try {
    return await withRetry(() =>
      ai.models.generateContent(buildParams(PRIMARY_MODEL, PRIMARY_MODEL.startsWith('gemini-4')))
    );
  } catch (err) {
    if (!process.env.GEMINI_MODEL && isModelNotFoundError(err) && PRIMARY_MODEL !== VERCEL_FALLBACK_MODEL) {
      return await withRetry(() =>
        ai.models.generateContent(buildParams(VERCEL_FALLBACK_MODEL, false))
      );
    }
    throw err;
  }
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

function mapGeminiErrorResponse(error: unknown, fallbackMessage: string): HandlerResult {
  const { status, message } = extractErrorDetails(error);

  if (message.includes('GEMINI_API_KEY_MISSING')) {
    return {
      status: 503,
      payload: {
        error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ (Environment Variables / Secrets) กรุณาตรวจสอบก่อนนะ',
      },
    };
  }
  if (
    status === 403 ||
    status === 400 ||
    /PERMISSION_DENIED|API_KEY_INVALID|API key not valid/i.test(message)
  ) {
    return {
      status: 400,
      payload: {
        error: 'API Key ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง กรุณาตรวจสอบค่า GEMINI_API_KEY',
      },
    };
  }
  if (status === 404 || /NOT_FOUND/i.test(message)) {
    return {
      status: 404,
      payload: {
        error: 'ไม่พบโมเดล AI ที่เรียกใช้งาน กรุณาตรวจสอบ GEMINI_MODEL หรือการตั้งค่า API Key',
      },
    };
  }
  if (status === 429 || /RESOURCE_EXHAUSTED/i.test(message)) {
    return {
      status: 429,
      payload: {
        error: 'โควตาการใช้งาน Gemini API เต็มชั่วคราว ลองใหม่อีกครั้งในสักครู่',
      },
    };
  }
  return {
    status: 500,
    payload: { error: fallbackMessage },
  };
}

export async function handleCritiqueRequest(body: Record<string, unknown>): Promise<HandlerResult> {
  try {
    const { imageBase64, mimeType, category, assignmentBrief, note, studentTrack } = body ?? {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return {
        status: 400,
        payload: { error: 'กรุณาอัปโหลดรูปภาพผลงานก่อนส่งตรวจนะ' },
      };
    }

    const briefText =
      typeof assignmentBrief === 'string' && assignmentBrief.trim().length > 0
        ? assignmentBrief.trim()
        : typeof note === 'string' && note.trim().length > 0
        ? note.trim()
        : '';

    if (!briefText) {
      return {
        status: 400,
        payload: {
          error:
            'กรุณากรอก "โจทย์งานอย่างละเอียด" ก่อนส่งตรวจ เพื่อให้พี่ติวประเมินคะแนน 0–10 ดาวตามโจทย์ได้ถูกต้อง',
        },
      };
    }

    const ai = getGeminiClient();
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const safeMimeType =
      typeof mimeType === 'string' && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

    const promptText = [
      `หมวดหมู่ผลงาน: ${category || 'ทั่วไป'}`,
      studentTrack ? `สายการเรียนเป้าหมายของนักเรียน: ${studentTrack}` : '',
      `โจทย์งานอย่างละเอียด (เกณฑ์หลักในการตรวจให้คะแนน):\n"""\n${briefText}\n"""`,
      'จงตรวจผลงานในภาพนี้เทียบกับ "โจทย์งานอย่างละเอียด" และมาตรฐานพอร์ตโฟลิโอ ม.ปลาย เพื่อสอบเข้าคณะศิลปะและการออกแบบในปัจจุบันอย่างตรงไปตรงมา ไม่อวย พร้อมระบุทั้งข้อดี ข้อด้อย และให้คะแนน 0-10 ดาวตามเกณฑ์ที่เข้มงวด',
    ]
      .filter(Boolean)
      .join('\n\n');

    const response = await generateWithModelFallback(ai, (model, includeThinking) => ({
      model,
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
        ...(includeThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
        systemInstruction:
          'คุณคือ "พี่ติวเตอร์สายตรง" แห่ง Born to be Art ผู้เชี่ยวชาญการตรวจพอร์ตโฟลิโอและติวสอบเข้าคณะสถาปัตยกรรมศาสตร์ มัณฑนศิลป์ นิเทศศิลป์ วิจิตรศิลป์ และแฟชั่นดีไซน์ ระดับมหาวิทยาลัยชั้นนำในไทยยุคปัจจุบัน\n\n' +
          'หลักการตรวจงาน (สำคัญมาก):\n' +
          '1. **ห้ามอวย ห้ามชมเกินจริง**: พูดความจริงอย่างตรงไปตรงมา เป็นกันเองแต่จริงจังแบบมืออาชีพ ชี้ให้เห็นทั้ง "ข้อดี" ที่ทำได้จริงในภาพ และ "ข้อด้อย/ข้อผิดพลาด" ที่เห็นชัดเจน (เช่น Perspective เบี้ยว เส้นแข็ง ขาดน้ำหนักแสงเงา สัดส่วนเพี้ยน การจัดองค์ประกอบอึดอัด สีตุ่น หรือไม่ตรงโจทย์)\n' +
          '2. **อ้างอิงโจทย์งานเป็นหลัก**: ตรวจสอบว่าภาพที่ส่งมาตอบโจทย์ที่ระบุไว้ใน "โจทย์งานอย่างละเอียด" ครบถ้วนแค่ไหน หากไม่ตรงโจทย์หรือทำไม่ครบองค์ประกอบ ให้หักคะแนนอย่างชัดเจน\n' +
          '3. **เกณฑ์มาตรฐาน ม.ปลาย เข้ามหาวิทยาลัยปัจจุบัน & ระบบคะแนน 0-10 ดาว**:\n' +
          '   - 0 ดาว: ภาพไม่เกี่ยวกับโจทย์ งานไม่เสร็จเลย หรือไม่มีคุณภาพพื้นฐานที่ตรวจได้\n' +
          '   - 1-3 ดาว: ผิดโจทย์หลายจุด โครงสร้าง/Perspective/สัดส่วนผิดพลาดรุนแรง ขาดการคุมค่าน้ำหนักและงานฝีมือ\n' +
          '   - 4-5 ดาว: พอเห็นความตั้งใจและแนวคิดพื้นฐาน แต่ยังไม่ผ่านเกณฑ์ยื่นพอร์ต มีจุดบกพร่องด้านเทคนิคหรือองค์ประกอบหลายจุด\n' +
          '   - 6-7 ดาว: ระดับมาตรฐานนักเรียน ม.ปลาย ทั่วไปที่ฝึกมาดี ตอบโจทย์พอใช้ได้ แต่ยังมีจุดด้อยที่ต้องเกลาให้คมขึ้นเพื่อแข่งขัน\n' +
          '   - 8 ดาว: ดีมาก เห็นทักษะและสไตล์ชัด ตรงโจทย์เกือบสมบูรณ์ เหมาะใช้เป็นชิ้นเด่นในพอร์ตได้หลังแก้จุดเล็กน้อย\n' +
          '   - 9 ดาว: ยอดเยี่ยมระดับหัวกะทิ เทคนิค แนวคิด และการนำเสนอโดดเด่นมาก มีจุดติเพียงเล็กน้อยมาก\n' +
          '   - 10 ดาว: **ได้ยากมากที่สุด** ต้องสมบูรณ์แบบไร้ที่ติในทุกมิติ ทั้งความตรงโจทย์ 100%, ความคิดสร้างสรรค์ระดับสูง, โครงสร้าง/Perspective/Anatomy แม่นยำ, ค่าน้ำหนักแสงเงา-สี-พื้นผิวไร้ข้อกังขา และความประณีตระดับท็อปพอร์ตโฟลิโอ\n' +
          '4. ระบุฟิลด์ JSON ดังนี้:\n' +
          '   - starRating: จำนวนเต็ม 0 ถึง 10 ตามเกณฑ์เข้มงวดด้านบน\n' +
          '   - compliment (ข้อดี): จุดแข็งที่ทำได้ดีจริงในภาพและการตอบโจทย์ (2-3 ประโยค ตรงไปตรงมา)\n' +
          '   - weaknesses (ข้อด้อย): จุดอ่อน ข้อผิดพลาดทางเทคนิค หรือส่วนที่หลุดจากโจทย์อย่างชัดเจน (2-3 ประโยค ตรงไปตรงมา ไม่อ้อมค้อม)\n' +
          '   - advice (แนวทางแก้ไข): ขั้นตอนปฏิบัติที่ชัดเจน 1-2 ข้อ ว่าชิ้นต่อไปหรือการแก้งานนี้ต้องแก้อะไรก่อน-หลัง\n' +
          '   - designTip (มาตรฐานสอบเข้า/เกร็ดเทคนิค): มุมมองกรรมการพอร์ตเข้ามหาลัยในปัจจุบัน หรือหลักวิชาการที่เกี่ยวข้องกับงานชิ้นนี้',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            starRating: {
              type: Type.INTEGER,
              description:
                'Strict integer score from 0 to 10 against the assignment brief and current Thai university art portfolio standards. 10 is extraordinarily rare and requires zero flaws.',
            },
            compliment: {
              type: Type.STRING,
              description:
                'Honest, grounded strengths observed in the artwork and brief fulfillment in Thai (no flattery).',
            },
            weaknesses: {
              type: Type.STRING,
              description:
                'Direct, constructive weaknesses, technical flaws, or missing brief requirements observed in the artwork in Thai.',
            },
            advice: {
              type: Type.STRING,
              description: 'Actionable step-by-step improvement advice in Thai.',
            },
            designTip: {
              type: Type.STRING,
              description: 'University admission portfolio standard insight or technical principle in Thai.',
            },
          },
          required: ['starRating', 'compliment', 'weaknesses', 'advice', 'designTip'],
        },
      },
    }));

    const parsed = parseModelJson(response.text);

    const rawStars = Number(parsed.starRating);
    const starRating = Number.isFinite(rawStars)
      ? Math.min(10, Math.max(0, Math.round(rawStars)))
      : 5;

    const coinsEarned = Math.min(300, Math.max(20, 20 + starRating * 28));
    const fameEarned = Math.min(50, Math.max(0, starRating * 5));

    return {
      status: 200,
      payload: {
        starRating,
        coinsEarned,
        fameEarned,
        compliment: String(
          parsed.compliment || 'เห็นความพยายามในการวางโครงสร้างเบื้องต้นและถ่ายทอดไอเดียตามโจทย์'
        ),
        weaknesses: String(
          parsed.weaknesses || 'ค่าน้ำหนักแสงเงาและสัดส่วนยังขาดความแม่นยำ ควรเก็บรายละเอียดให้คมขึ้น'
        ),
        advice: String(
          parsed.advice ||
            'ให้เช็กโครงสร้างเส้นแกนและแบ่งน้ำหนักเข้ม-กลาง-อ่อน 3 ระดับให้ชัดเจนก่อนเก็บรายละเอียด'
        ),
        designTip: String(
          parsed.designTip ||
            'พอร์ตเข้าคณะศิลปะและการออกแบบยุคปัจจุบันเน้นทั้งความแม่นยำพื้นฐานและการตีความโจทย์ที่ชัดเจน'
        ),
      },
    };
  } catch (error: unknown) {
    const { status, message } = extractErrorDetails(error);
    console.error('Critique API error:', status ?? 'no-status', message);
    return mapGeminiErrorResponse(
      error,
      'ไม่สามารถเชื่อมต่อระบบตรวจงานได้ชั่วคราว ลองกดส่งใหม่อีกครั้งนะ'
    );
  }
}

export async function handleQuizRequest(body: Record<string, unknown>): Promise<HandlerResult> {
  try {
    const { examTrack, eraPreference, previousQuestions } = body ?? {};
    const ai = getGeminiClient();

    const chosenExam: 'TPAT4' | 'TPAT21' =
      examTrack === 'TPAT4' || examTrack === 'TPAT21'
        ? examTrack
        : Math.random() < 0.5
        ? 'TPAT4'
        : 'TPAT21';

    const chosenEra: 'past_5y' | 'forecast_5y' =
      eraPreference === 'past_5y' || eraPreference === 'forecast_5y'
        ? eraPreference
        : Math.random() < 0.45
        ? 'past_5y'
        : 'forecast_5y';

    const tpat4Topics = [
      'การออกแบบสถาปัตยกรรมเขตร้อน การบังแดด และระบายอากาศธรรมชาติ',
      'โครงสร้าง Truss, Cantilever, Space Frame และวัสดุศาสตร์ก่อสร้าง',
      'มิติสัมพันธ์ ภาพฉาย Plan-Elevation-Section และ Isometric',
      'Universal Design สังคมสูงวัย ความลาดชันทางลาด และมาตรฐานบันได',
      'Net-Zero Building, Embodied Carbon, CLT Mass Timber และ BIPV',
      'Urban Wind Corridor, Sponge City, 15-Minute City และ TOD',
      'AI Parametric Design, Digital Twin และ 3D Printing ก่อสร้าง',
    ];
    const tpat21Topics = [
      'ทัศนธาตุ หลักการจัดองค์ประกอบศิลป์ Gestalt และ Rule of Thirds',
      'ทฤษฎีสี Munsell, RGB vs CMYK, จิตวิทยาสี และ Wide Color Gamut',
      'ประวัติศาสตร์ศิลปะไทย (สุโขทัย ขรัวอินโข่ง ศิลปะร่วมสมัยไทย) และสากล',
      'เทคนิควาดเส้น Drawing แสงเงา Sfumato, Cross-Hatching และภาพพิมพ์',
      'จริยธรรม AI ในศิลปะ ลิขสิทธิ์ภาพดิจิทัล และ Interactive Immersive Art',
      'Sustainable Fashion (Zero-Waste Pattern), Bio-Pigments และ Eco-Packaging',
      'Visual Metaphor, Dynamic Branding, Spatial Typography และ Inclusive UI',
    ];

    const pool = chosenExam === 'TPAT4' ? tpat4Topics : tpat21Topics;
    const selectedTopic = pool[Math.floor(Math.random() * pool.length)];

    const eraPrompt =
      chosenEra === 'past_5y'
        ? `อ้างอิงแนวข้อสอบจริง ${chosenExam} ย้อนหลัง 5 ปี (2565–2569)`
        : `คาดการณ์แนวโน้มข้อสอบ ${chosenExam} ล่วงหน้า 5 ปีข้างหน้า (2570–2574) ตามบริบทเทคโนโลยี สิ่งแวดล้อม และสังคมยุคใหม่`;

    const prevList = Array.isArray(previousQuestions) ? previousQuestions.slice(-10) : [];
    const avoidPrompt =
      prevList.length > 0
        ? `\nห้ามออกคำถามซ้ำหรือใกล้เคียงกับคำถามเหล่านี้:\n- ${prevList.join('\n- ')}`
        : '';

    const response = await generateWithModelFallback(ai, (model, includeThinking) => ({
      model,
      contents: `สร้างข้อสอบปรนัย 4 ตัวเลือกชุด ${chosenExam} จำนวน 1 ข้อ\nแนวข้อสอบ: ${eraPrompt}\nหัวข้อย่อย: ${selectedTopic}${avoidPrompt}`,
      config: {
        ...(includeThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
        systemInstruction:
          'คุณคืออาจารย์ผู้เชี่ยวชาญการออกข้อสอบ TPAT4 (ความถนัดทางสถาปัตยกรรมศาสตร์) และ TPAT21 (ความถนัดศิลปกรรมศาสตร์ ทัศนศิลป์) แห่ง Born to be Art ออกข้อสอบปรนัย 4 ตัวเลือกเป็นภาษาไทยที่มีคุณภาพเทียบเท่าข้อสอบ TCAS จริง กระชับ อ่านไว ไม่กำกวม และให้คำอธิบายเฉลยสั้นๆ ที่ได้ความรู้ทันที',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'Short Thai sub-topic name (2-4 words).',
            },
            question: {
              type: Type.STRING,
              description: 'Clear multiple choice question in Thai.',
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactly 4 distinct options in Thai.',
            },
            correctIndex: {
              type: Type.INTEGER,
              description: 'Zero-based index (0 to 3) of the correct option.',
            },
            explanation: {
              type: Type.STRING,
              description: 'Short friendly tutor explanation in Thai.',
            },
          },
          required: ['category', 'question', 'options', 'correctIndex', 'explanation'],
        },
      },
    }));

    const parsed = parseModelJson(response.text);

    const rawOptions = Array.isArray(parsed.options)
      ? parsed.options.slice(0, 4).map((o: unknown) => String(o))
      : [];
    if (rawOptions.length < 4 || !parsed.question) {
      throw new Error('Invalid quiz options generated');
    }
    const rawCorrectIdx = Math.min(3, Math.max(0, Math.round(Number(parsed.correctIndex) || 0)));

    const paired = rawOptions.map((text, idx) => ({
      text,
      isCorrect: idx === rawCorrectIdx,
    }));
    for (let i = paired.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [paired[i], paired[j]] = [paired[j], paired[i]];
    }

    return {
      status: 200,
      payload: {
        id: `ai-${chosenExam.toLowerCase()}-${Date.now()}`,
        examCode: chosenExam,
        era: chosenEra,
        yearLabel:
          chosenEra === 'past_5y'
            ? `AI สังเคราะห์แนว ${chosenExam} (65–69)`
            : `AI คาดการณ์ ${chosenExam} (2570–2574)`,
        category: String(parsed.category || selectedTopic),
        question: String(parsed.question),
        options: paired.map((p) => p.text),
        correctIndex: Math.max(0, paired.findIndex((p) => p.isCorrect)),
        explanation: String(parsed.explanation || 'จำหลักการนี้ไว้ใช้สอบ TPAT จริงได้เลย!'),
      },
    };
  } catch (error: unknown) {
    const { status, message } = extractErrorDetails(error);
    console.error('Quiz API error:', status ?? 'no-status', message);
    return mapGeminiErrorResponse(
      error,
      'ไม่สามารถสร้างโจทย์ควิซจาก AI ได้ในขณะนี้ ลองใช้โหมดคลังข้อสอบ TPAT4/TPAT21 ได้เลยนะ'
    );
  }
}
