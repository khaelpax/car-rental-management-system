import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }
  if (env.GEMINI_MODEL && !process.env.GEMINI_MODEL) {
    process.env.GEMINI_MODEL = env.GEMINI_MODEL;
  }

  return {
    plugins: [
      react(),
      {
        name: 'vercel-api-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
            if (req.url === '/api/recommend') {
              try {
                const { default: handler } = await import('./api/recommend');
                let bodyData = '';
                req.on('data', (chunk) => {
                  bodyData += chunk;
                });
                req.on('end', async () => {
                  let parsedBody = {};
                  try {
                    if (bodyData) {
                      parsedBody = JSON.parse(bodyData);
                    }
                  } catch {
                    parsedBody = {};
                  }

                  const vercelReq = Object.assign(req, {
                    body: parsedBody,
                    query: {},
                    cookies: {},
                  });

                  const vercelRes = Object.assign(res, {
                    status: (code: number) => {
                      res.statusCode = code;
                      return vercelRes;
                    },
                    json: (data: unknown) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                      return vercelRes;
                    },
                    send: (data: unknown) => {
                      res.end(data);
                      return vercelRes;
                    },
                  });

                  await handler(vercelReq as never, vercelRes as never);
                });
              } catch (err) {
                console.error('Local dev API middleware error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error: err instanceof Error ? err.message : 'Local API execution error',
                  })
                );
              }
              return;
            }
            next();
          });
        },
      },
    ],
  };
});
