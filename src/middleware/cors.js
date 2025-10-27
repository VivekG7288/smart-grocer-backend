// cors.js
export default function corsMiddleware(req, res, next) {
  // Log incoming request details
  console.log(`[CORS] ${req.method} Request to ${req.path}`);
  console.log('[CORS] Origin:', req.headers.origin);

  // Allowed frontend origin
  const allowedOrigin = 'https://smart-grocer-frontend.pages.dev';

  // Set CORS headers
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight response for 24 hours

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS preflight request');
    return res.status(204).end(); // 204 No Content for preflight
  }

  next();
};
