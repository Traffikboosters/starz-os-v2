import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const NEW_URL = 'https://spb-t4nl2t9m7hhk921t.supabase.opentrust.net';
const NEW_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5sMnQ5bTdoaGs5MjF0IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzc5MjAyMjEsImV4cCI6MjA5MzQ5NjIyMX0.Mq8q-iquvE1ART8HykA94WUmCdGG-JWT2oACCJZa1AA';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'starz-os.html');
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

  // Replace old Supabase URL on line 92 (index 91)
  lines[91] = lines[91].replace(/https:\/\/[^']+\.supabase\.co/, NEW_URL);

  // Replace old JWT key on line 22 (index 21)
  lines[21] = lines[21].replace(/eyJ[A-Za-z0-9_\-\.]+/, NEW_KEY);

  return new NextResponse(lines.join('\n'), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
