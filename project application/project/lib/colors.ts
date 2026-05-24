export const Colors = {
  primary: '#0891B2',
  primaryLight: '#CFFAFE',
  primaryDark: '#0E7490',
  secondary: '#EC4899',
  secondaryLight: '#FCE7F3',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  neutral50: '#F9FAFB',
  neutral100: '#F3F4F6',
  neutral200: '#E5E7EB',
  neutral300: '#D1D5DB',
  neutral400: '#9CA3AF',
  neutral500: '#6B7280',
  neutral600: '#4B5563',
  neutral700: '#374151',
  neutral800: '#1F2937',
  neutral900: '#111827',
  white: '#FFFFFF',
  background: '#F0FDFA',
  cardBackground: '#FFFFFF',
  tabBar: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
};

export const DocCategories: Record<string, { label: string; color: string; bg: string }> = {
  certificates: { label: 'شهادات', color: '#F59E0B', bg: '#FEF3C7' },
  contracts: { label: 'عقود', color: '#3B82F6', bg: '#DBEAFE' },
  id_cards: { label: 'بطاقات شخصية', color: '#EF4444', bg: '#FEE2E2' },
  cases: { label: 'قضايا', color: '#8B5CF6', bg: '#EDE9FE' },
  transactions: { label: 'بنك ومعاملات', color: '#10B981', bg: '#D1FAE5' },
  other: { label: 'أخرى', color: '#6B7280', bg: '#F3F4F6' },
};

export const ExpenseCategories: Record<string, { label: string; color: string; bg: string }> = {
  housing: { label: 'المنزل', color: '#3B82F6', bg: '#DBEAFE' },
  children: { label: 'أولاد', color: '#10B981', bg: '#D1FAE5' },
  health: { label: 'الصحة', color: '#EF4444', bg: '#FEE2E2' },
  transport: { label: 'المواصلات', color: '#F59E0B', bg: '#FEF3C7' },
  other: { label: 'أخرى', color: '#6B7280', bg: '#F3F4F6' },
};

export const CaseTypes: Record<string, { label: string }> = {
  alimony: { label: 'نفقة' },
  custody: { label: 'حضانة' },
  inheritance: { label: 'ميراث' },
  property: { label: 'ملكية' },
  other: { label: 'أخرى' },
};
