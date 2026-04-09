import fs from 'fs/promises';
import path from 'path';
import { FinanceData, defaultData } from '@/types/finance';
import { Redis } from '@upstash/redis';

const DB_PATH = path.join(process.cwd(), 'finanzas_db.json');

// Inicializador Condicional (Nube vs Local)
const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    return new Redis({
      url,
      token,
    });
  }
  return null;
};

export async function getFinanceData(): Promise<FinanceData> {
  const redis = getRedisClient();
  
  if (redis) {
     try {
       const data = await redis.get<FinanceData>('finanzas_db');
       if (!data) return defaultData;
       return data;
     } catch (e) {
       console.error("Redis read error", e);
       return defaultData;
     }
  }

  // Fallback a entorno Local si no hay conexión a la nube
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data) as FinanceData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Archivo no existe, se entrega por defecto para que se cree al primer guardado
      return defaultData;
    }
    throw error;
  }
}

export async function saveFinanceData(data: FinanceData): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
     await redis.set('finanzas_db', data);
     return;
  }

  // Fallback a entorno Local
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
