import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleCritiqueRequest, handleQuizRequest } from './lib/geminiHandlers.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.post('/api/critique', async (req, res) => {
    const result = await handleCritiqueRequest((req.body ?? {}) as Record<string, unknown>);
    return res.status(result.status).json(result.payload);
  });

  app.post('/api/quiz', async (req, res) => {
    const result = await handleQuizRequest((req.body ?? {}) as Record<string, unknown>);
    return res.status(result.status).json(result.payload);
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
