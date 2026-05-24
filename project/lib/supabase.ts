import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ExpenseCategory = 'money' | 'allowance' | 'other';
export type CaseStatus = 'active' | 'closed' | 'pending';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  expense_date: string;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  doc_type: string;
  file_url: string;
  notes: string;
  created_at: string;
}

export interface Case {
  id: string;
  user_id: string;
  title: string;
  case_number: string;
  court: string;
  next_date: string | null;
  status: CaseStatus;
  notes: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  appointment_date: string;
  location: string;
  notes: string;
  reminder_sent: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
