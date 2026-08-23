import app from './app.js';
import { env } from './config/env.js';
import { verifyPrismaDatabaseConnection } from './config/db.js';

const PORT = env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Meeting Summarizer Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${env.NODE_ENV}`);
  console.log(`🤖 AI Mode: ${env.MOCK_AI ? 'MOCK MODE' : 'LIVE GROQ AI'}`);
  console.log(`====================================================`);

  try {
    await verifyPrismaDatabaseConnection();
  } catch (err: any) {
    console.error(`[Server Startup] Database connection error: ${err?.message || err}`);
    if (env.NODE_ENV === 'production') {
      console.error('❌ Fatal: Production database connection failed. Terminating process.');
      process.exit(1);
    }
  }
});
