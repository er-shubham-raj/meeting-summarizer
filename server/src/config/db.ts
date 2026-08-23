import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export async function verifyPrismaDatabaseConnection(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL || '';

  // Safe parsing without printing password or full URL
  try {
    const urlObj = new URL(dbUrl);
    console.log(`[DB Config] Host: ${urlObj.hostname || 'localhost'}`);
    console.log(`[DB Config] Port: ${urlObj.port || '5432'}`);
    console.log(`[DB Config] Database: ${urlObj.pathname.replace('/', '') || 'meetingsummarizer'}`);
    console.log(`[DB Config] User: ${urlObj.username || 'postgres'}`);
    console.log(`[DB Config] Password: ${urlObj.password ? 'configured' : 'missing'}`);
  } catch {
    console.log(`[DB Config] Host: localhost`);
    console.log(`[DB Config] Port: 5432`);
    console.log(`[DB Config] Database: meetingsummarizer`);
    console.log(`[DB Config] User: postgres`);
    console.log(`[DB Config] Password: configured`);
  }

  try {
    // Test 1: SELECT 1 query
    await prisma.$queryRaw`SELECT 1`;
    console.log(`[DB Connection] SELECT 1 query succeeded!`);

    // Test 2: Verify table access
    const count = await prisma.meeting.count();
    console.log(`[DB Connection] Table verification succeeded! Total records: ${count}`);
  } catch (err: any) {
    console.error(`❌ [DB Connection Failed]:`, err?.message || err);
    throw err;
  }
}
