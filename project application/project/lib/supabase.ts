import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  death_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  user_id: string;
  title: string;
  document_type: string;
  file_url: string | null;
  notes: string | null;
  expiry_date: string | null;
  ai_analysis: string | null;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  notes: string | null;
  created_at: string;
};

export type Case = {
  id: string;
  user_id: string;
  title: string;
  case_type: string;
  status: string;
  court: string | null;
  case_number: string | null;
  notes: string | null;
  next_session: string | null;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  title: string;
  appointment_type: string;
  appointment_date: string;
  location: string | null;
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
};

export type MoodLog = {
  id: string;
  user_id: string;
  mood_score: number;
  notes: string | null;
  logged_at: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type AiConsultation = {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  consultation_type: string | null;
  created_at: string;
};
