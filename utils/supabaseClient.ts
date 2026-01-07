import { createClient } from '@supabase/supabase-js';

// Hardcoding credentials as requested to avoid environment variable warnings
const SUPABASE_URL = 'https://jibgfzwszgfgiyiubrpr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYmdmendzemdmZ2l5aXVicnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MzU5NTAsImV4cCI6MjA4MjExMTk1MH0.O_iUqvQIZXF4mgSNx4ZGg75rvYVhJxBEN35WOvsSbZ4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);