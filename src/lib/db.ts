import fs from 'fs/promises';
import path from 'path';
import { FinanceData, defaultData } from '@/types/finance';

const DB_PATH = path.join(process.cwd(), 'finanzas_db.json');

export async function getFinanceData(): Promise<FinanceData> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data) as FinanceData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return default and create it later
      return defaultData;
    }
    throw error;
  }
}

export async function saveFinanceData(data: FinanceData): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
