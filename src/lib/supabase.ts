
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://rdozjfmyoorrqlpddjdl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkb3pqZm15b29ycnFscGRkamRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzkzMjAsImV4cCI6MjA2MDIxNTMyMH0.VQ3f_ejygApI6F_ptA6TXQN4JcgLu8c5kxUWvtlAwkc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
