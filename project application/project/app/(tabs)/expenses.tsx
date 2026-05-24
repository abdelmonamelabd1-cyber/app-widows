import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors, ExpenseCategories } from '@/lib/colors';
import { DollarSign, Plus, X, Trash2, TrendingUp } from 'lucide-react-native';
import type { Expense } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const EXP_CATS = ['housing', 'children', 'health', 'transport', 'other'] as const;

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'housing', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.amount) {
      setError('يرجى إدخال العنوان والمبلغ');
      return;
    }
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('expenses').insert({
      user_id: user.id,
      title: form.title.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      notes: form.notes.trim(),
      expense_date: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    setModalVisible(false);
    setForm({ title: '', amount: '', category: 'housing', notes: '' });
    loadExpenses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const catTotals = EXP_CATS.reduce((acc, c) => {
    acc[c] = expenses.filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount), 0);
    return acc;
  }, {} as Record<string, number>);

  const filtered = activeCategory === 'all' ? expenses : expenses.filter((e) => e.category === activeCategory);

  const formatAmount = (n: number) => n.toLocaleString('ar-EG') + ' جم';

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0891B2', '#0E7490']} style={styles.header}>
        <Text style={styles.headerTitle}>المصاريف</Text>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>إجمالي المصروفات لهذا الشهر</Text>
          <View style={styles.totalRow}>
            <DollarSign color={Colors.white} size={24} />
            <Text style={styles.totalAmount}>{formatAmount(totalAmount)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChips} style={styles.catScroll}>
        <TouchableOpacity
          style={[styles.catChip, activeCategory === 'all' && styles.catChipActive]}
          onPress={() => setActiveCategory('all')}
        >
          <Text style={[styles.catChipText, activeCategory === 'all' && styles.catChipTextActive]}>الكل</Text>
        </TouchableOpacity>
        {EXP_CATS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.catChip, activeCategory === c && styles.catChipActive, { borderColor: ExpenseCategories[c].color }]}
            onPress={() => setActiveCategory(c)}
          >
            <Text style={[styles.catChipText, activeCategory === c && styles.catChipTextActive, { color: activeCategory === c ? Colors.white : ExpenseCategories[c].color }]}>
              {ExpenseCategories[c].label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category breakdown */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breakdownRow} style={{ maxHeight: 90 }}>
        {EXP_CATS.map((c) => (
          <View key={c} style={[styles.breakdownCard, { backgroundColor: ExpenseCategories[c].bg }]}>
            <Text style={[styles.breakdownAmount, { color: ExpenseCategories[c].color }]}>{formatAmount(catTotals[c])}</Text>
            <Text style={[styles.breakdownLabel, { color: ExpenseCategories[c].color }]}>{ExpenseCategories[c].label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Expenses list */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <TrendingUp color={Colors.textMuted} size={48} />
              <Text style={styles.emptyText}>لا توجد مصاريف مسجلة</Text>
            </View>
          ) : (
            filtered.map((exp) => (
              <View key={exp.id} style={styles.expCard}>
                <View style={[styles.catDot, { backgroundColor: ExpenseCategories[exp.category]?.bg || '#F3F4F6' }]}>
                  <Text style={{ fontSize: 18 }}>
                    {exp.category === 'housing' ? '🏠' : exp.category === 'children' ? '👶' : exp.category === 'health' ? '💊' : exp.category === 'transport' ? '🚌' : '💼'}
                  </Text>
                </View>
                <View style={styles.expInfo}>
                  <Text style={styles.expTitle}>{exp.title}</Text>
                  <Text style={styles.expDate}>{formatDate(exp.expense_date)} · {ExpenseCategories[exp.category]?.label}</Text>
                </View>
                <View style={styles.expRight}>
                  <Text style={styles.expAmount}>{formatAmount(Number(exp.amount))}</Text>
                  <TouchableOpacity onPress={() => handleDelete(exp.id)}>
                    <Trash2 color={Colors.error} size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Add button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Plus color={Colors.white} size={22} />
        <Text style={styles.addBtnText}>إضافة مصروف</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Colors.textPrimary} size={24} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة مصروف جديد</Text>
            </View>

            {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

            <Text style={styles.fieldLabel}>البيان *</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
              placeholder="مثال: إيجار المنزل"
              textAlign="right"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fieldLabel}>المبلغ *</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.amount}
              onChangeText={(v) => setForm({ ...form, amount: v })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fieldLabel}>التصنيف</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catSelectRow}>
              {EXP_CATS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catSelectChip, form.category === c && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  onPress={() => setForm({ ...form, category: c })}
                >
                  <Text style={[styles.catSelectText, form.category === c && { color: Colors.white }]}>
                    {ExpenseCategories[c].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>حفظ</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.white, textAlign: 'right', marginBottom: 16 },
  totalCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 16 },
  totalLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'right', marginBottom: 8 },
  totalRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  totalAmount: { fontSize: 28, fontWeight: '700', color: Colors.white },
  catScroll: { maxHeight: 52 },
  catChips: { paddingHorizontal: 16, gap: 8, alignItems: 'center', paddingVertical: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  catChipTextActive: { color: Colors.white },
  breakdownRow: { paddingHorizontal: 16, gap: 10, paddingVertical: 8 },
  breakdownCard: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, alignItems: 'center', minWidth: 90 },
  breakdownAmount: { fontSize: 14, fontWeight: '700' },
  breakdownLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textSecondary, marginTop: 16 },
  expCard: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  catDot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  expInfo: { flex: 1, alignItems: 'flex-end' },
  expTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  expDate: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  expRight: { alignItems: 'flex-end', gap: 6 },
  expAmount: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  addBtn: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
  },
  addBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  errorBox: { backgroundColor: Colors.errorLight, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: Colors.error, textAlign: 'right', fontSize: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', marginBottom: 8 },
  fieldInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    padding: 14, fontSize: 15, color: Colors.textPrimary,
    backgroundColor: Colors.neutral50, marginBottom: 16,
  },
  catSelectRow: { gap: 8, paddingBottom: 16 },
  catSelectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.neutral50 },
  catSelectText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
