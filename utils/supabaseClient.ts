import { createClient } from '@supabase/supabase-js';

// Configuration for Supabase
// Prioritize Environment Variables (Vite), fallback to hardcoded (Cloud) for ease of use if .env is missing

// Safely retrieve environment variables. 
// In some environments, import.meta.env might be undefined, causing a crash if accessed directly.
const getEnv = (key: string) => {
  // Use a try-catch block or safe check for import.meta.env
  try {
    const env = (import.meta as any).env;
    return env ? env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || 'https://jibgfzwszgfgiyiubrpr.supabase.co';
const SUPABASE_KEY = getEnv('VITE_SUPABASE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYmdmendzemdmZ2l5aXVicnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MzU5NTAsImV4cCI6MjA4MjExMTk1MH0.O_iUqvQIZXF4mgSNx4ZGg75rvYVhJxBEN35WOvsSbZ4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);