// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wjgbdrvvizegnrxkaehw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZ2JkcnZ2aXplZ25yeGthZWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1Mjc3NDksImV4cCI6MjA3ODEwMzc0OX0.UY_HX-9KV2jPmQqLQuoZZkxzJCjcNA2O1GXfhvWLN3s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
