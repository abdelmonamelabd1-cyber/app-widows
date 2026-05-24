import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Plus, DollarSign, TrendingDown, TrendingUp, X, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, type Expense, type ExpenseCategory } from '@/lib/supabase';

const CATEGORIES: { key: ExpenseCategory; label: string; color: string; bg: string }[] = [
  { key: 'money', label: 'أموال', color: '#2D6A4F', bg: '#EFF9F4' },
  { key: 'allowance', label: 'مخصصات', color: '#C9A84C', bg: '#FFF8E8' },
  { key: 'other', label: 'أخرى', color: '#3A6EA5', bg: '#E8F4FF' },
];

interface LocalExpense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  expense_date: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('money');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [isOnline, setIsOnline] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
        setIsOnline(true);
        loadFromDB(data.session.user.id);
      }
    });
  }, []);

  const loadFromDB = async (uid: string) => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', uid)
      .order('expense_date', { ascending: false });
    if (data) {
      setExpenses(data.map((e) => ({
        id: e.id,
        amount: e.amount,
        category: e.category as ExpenseCategory,
        description: e.description,
        expense_date: e.expense_date,
      })));
    }
  };

  const addExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('خطأ', 'من فضلك أدخلي مبلغًا صحيحًا');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newExpense: LocalExpense = {
      id: generateId(),
      amount: parseFloat(amount),
      category: selectedCategory,
      description,
      expense_date: today,
    };

    if (isOnline && userId) {
      const { data, error } = await supabase.from('expenses').insert({
        user_id: userId,
        amount: newExpense.amount,
        category: newExpense.category,
        description: newExpense.description,
        expense_date: today,
      }).select().maybeSingle();
      if (data) {
        newExpense.id = data.id;
      }
    }

    setExpenses((prev) => [newExpense, ...prev]);
    setAmount('');
    setDescription('');
    setShowModal(false);
  };

  const deleteExpense = async (id: string) => {
    if (isOnline) {
      await supabase.from('expenses').delete().eq('id', id);
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const filtered = filterCategory === 'all' ? expenses : expenses.filter((e) => e.category === filterCategory);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = expenses.filter((e) => e.category === cat.key).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#C9A84C', '#A07830']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowRight color="#FFFFFF" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المصاريف</Text>
        <Text style={styles.totalAmount}>{total.toLocaleString('ar-EG')} ج.م</Text>
        <Text style={styles.totalLabel}>إجمالي المصروفات</Text>

        <View style={styles.summaryRow}>
          {CATEGORIES.map((cat) => (
            <View key={cat.key} style={styles.summaryItem}>
              <Text style={styles.summaryAmount}>{totalByCategory[cat.key].toLocaleString('ar-EG')}</Text>
              <Text style={styles.summaryLabel}>{cat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filterCategory === 'all' && styles.filterTabActive]}
          onPress={() => setFilterCategory('all')}
        >
          <Text style={[styles.filterTabText, filterCategory === 'all' && styles.filterTabTextActive]}>الكل</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.filterTab, filterCategory === cat.key && styles.filterTabActive]}
            onPress={() => setFilterCategory(cat.key)}
          >
            <Text style={[styles.filterTabText, filterCategory === cat.key && styles.filterTabTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <DollarSign color="#CCCCCC" size={48} strokeWidth={1.5} />
            <Text style={styles.emptyText}>لا توجد مصاريف مسجلة بعد</Text>
          </View>
        ) : (
          filtered.map((expense) => {
            const cat = CATEGORIES.find((c) => c.key === expense.category)!;
            return (
              <View key={expense.id} style={styles.expenseItem}>
                <TouchableOpacity onPress={() => deleteExpense(expense.id)} style={styles.deleteBtn}>
                  <Trash2 color="#CC5555" size={18} strokeWidth={2} />
                </TouchableOpacity>
                <View style={styles.expenseContent}>
                  <View style={styles.expenseTop}>
                    <Text style={styles.expenseAmount}>{expense.amount.toLocaleString('ar-EG')} ج.م</Text>
                    <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                      <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.label}</Text>
                    </View>
                  </View>
                  {expense.description ? (
                    <Text style={styles.expenseDesc}>{expense.description}</Text>
                  ) : null}
                  <Text style={styles.expenseDate}>{expense.expense_date}</Text>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color="#FFFFFF" size={26} strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="#666666" size={22} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة مصروف</Text>
            </View>

            <Text style={styles.fieldLabel}>نوع المصروف</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catBtn,
                    { borderColor: cat.color },
                    selectedCategory === cat.key && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <Text style={[styles.catBtnText, { color: selectedCategory === cat.key ? '#FFF' : cat.color }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>المبلغ (ج.م)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              textAlign="right"
              placeholderTextColor="#AAAAAA"
            />

            <Text style={styles.fieldLabel}>الوصف (اختياري)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              placeholder="مثال: فاتورة الكهرباء"
              multiline
              textAlign="right"
              placeholderTextColor="#AAAAAA"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={addExpense}>
              <Text style={styles.saveBtnText}>حفظ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backBtn: { alignSelf: 'flex-end', marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'right' },
  totalAmount: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', textAlign: 'right', marginTop: 8 },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'right' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  summaryItem: { alignItems: 'center' },
  summaryAmount: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    justifyContent: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D8',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0EBE5',
  },
  filterTabActive: { backgroundColor: '#C9A84C' },
  filterTabText: { fontSize: 13, color: '#7A7A7A', fontWeight: '500' },
  filterTabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#AAAAAA', textAlign: 'center' },
  expenseItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  expenseContent: { flex: 1 },
  expenseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  expenseAmount: { fontSize: 18, fontWeight: '700', color: '#2C2C2C' },
  catBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  catBadgeText: { fontSize: 12, fontWeight: '600' },
  expenseDesc: { fontSize: 13, color: '#6A6A6A', textAlign: 'right', marginBottom: 4 },
  expenseDate: { fontSize: 11, color: '#AAAAAA', textAlign: 'right' },
  deleteBtn: { padding: 8, marginLeft: 8 },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C9A84C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C2C2C' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#4A4A4A', textAlign: 'right', marginBottom: 8 },
  categoryRow: { flexDirection: 'row', gap: 10, marginBottom: 16, justifyContent: 'flex-end' },
  catBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  catBtnText: { fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: '#F5F0EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#2C2C2C',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
