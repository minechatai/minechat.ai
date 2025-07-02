import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for serverless environments  
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool with optimized settings for Replit
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 3,
  maxUses: 1000,
  allowExitOnIdle: true
});

// Add comprehensive error handling
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

pool.on('connect', () => {
  console.log('Database connection established');
});

export const db = drizzle({ client: pool, schema });

// Test database connection on startup
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}