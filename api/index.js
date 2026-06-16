const express = require('express');
const cookieParser = require('cookie-parser');

// Import tRPC
const { createExpressMiddleware } = require('@trpc/server/adapters/express');

// Lazy load server modules to avoid issues
let appRouter, createContext;

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// tRPC endpoint
app.all('/api/trpc/:path*', async (req, res) => {
  try {
    // Lazy load on first request
    if (!appRouter) {
      const serverModule = await import('../dist/index.js');
      appRouter = serverModule.appRouter;
      createContext = serverModule.createContext;
    }

    const middleware = createExpressMiddleware({
      router: appRouter,
      createContext,
    });

    await middleware(req, res);
  } catch (error) {
    console.error('tRPC error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(__dirname + '/../dist/public/index.html');
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

module.exports = app;
