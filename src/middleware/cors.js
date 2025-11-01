// src/middleware/cors.js
export default function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  console.log(`[CORS] ${req.method} ${req.originalUrl}`);
  console.log('[CORS] Origin:', origin || 'NO ORIGIN HEADER');

  const allowedOrigins = [
    'https://smart-grocer-frontend.pages.dev',
    'http://localhost:5173',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    console.log('[CORS] Skipping origin header — likely PWA/service worker request');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    console.log('[CORS] Preflight request handled');
    return res.status(204).end();
  }

  next();
}
