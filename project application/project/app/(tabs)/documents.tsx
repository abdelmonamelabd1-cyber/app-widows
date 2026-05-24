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
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors, DocCategories } from '@/lib/colors';
import { FileText, Search, Plus, X, ChevronDown, Trash2, BookOpen } from 'lucide-react-native';
import type { Document } from '@/lib/supabase';

const DOC_TYPES = ['certificates', 'contracts', 'id_cards', 'cases', 'transactions', 'other'] as const;

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', document_type: 'certificates', notes: '', ai_analysis: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setDocuments(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.title.trim()) {
      setError('يرجى إدخال عنوان المستند');
      return;
    }
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: insertError } = await supabase.from('documents').insert({
      user_id: user.id,
      title: form.title.trim(),
      document_type: form.document_type,
      notes: form.notes.trim(),
    });
    setSaving(false);
    if (insertError) {
      setError('حدث خطأ أثناء الحفظ');
    } else {
      setModalVisible(false);
      setForm({ title: '', document_type: 'certificates', notes: '', ai_analysis: '' });
      loadDocuments();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('documents').delete().eq('id', id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const filtered = documents.filter((d) => {
    const matchType = activeType === 'all' || d.document_type === activeType;
    const matchSearch = !search || d.title.includes(search) || d.notes?.includes(search);
    return matchType && matchSearch;
  });

  const countsByType = DOC_TYPES.reduce((acc, t) => {
    acc[t] = documents.filter((d) => d.document_type === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المستندات</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus color={Colors.white} size={20} />
          <Text style={styles.addBtnText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحثي عن مستند..."
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          placeholderTextColor={Colors.textMuted}
        />
        <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
        <TouchableOpacity
          style={[styles.chip, activeType === 'all' && styles.chipActive]}
          onPress={() => setActiveType('all')}
        >
          <Text style={[styles.chipText, activeType === 'all' && styles.chipTextActive]}>الكل</Text>
        </TouchableOpacity>
        {DOC_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, activeType === t && styles.chipActive]}
            onPress={() => setActiveType(t)}
          >
            <Text style={[styles.chipText, activeType === t && styles.chipTextActive]}>
              {DocCategories[t].label}
            </Text>
            {countsByType[t] > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{countsByType[t]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category summary cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryCards} style={{ maxHeight: 100 }}>
        {DOC_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.summaryCard, { backgroundColor: DocCategories[t].bg }]}
            onPress={() => setActiveType(t)}
          >
            <FileText color={DocCategories[t].color} size={20} />
            <Text style={[styles.summaryCount, { color: DocCategories[t].color }]}>{countsByType[t]}</Text>
            <Text style={[styles.summaryLabel, { color: DocCategories[t].color }]}>{DocCategories[t].label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Documents List */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen color={Colors.textMuted} size={48} />
              <Text style={styles.emptyText}>لا توجد مستندات بعد</Text>
              <Text style={styles.emptySubText}>اضغطي على زر الإضافة لإضافة مستند جديد</Text>
            </View>
          ) : (
            filtered.map((doc) => (
              <View key={doc.id} style={styles.docCard}>
                <View style={[styles.docTypeTag, { backgroundColor: DocCategories[doc.document_type]?.bg || '#F3F4F6' }]}>
                  <FileText color={DocCategories[doc.document_type]?.color || '#6B7280'} size={18} />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docType}>{DocCategories[doc.document_type]?.label || 'أخرى'}</Text>
                  {doc.notes ? <Text style={styles.docNotes}>{doc.notes}</Text> : null}
                  {doc.expiry_date && (
                    <Text style={styles.docExpiry}>تنتهي: {new Date(doc.expiry_date).toLocaleDateString('ar-EG')}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleDelete(doc.id)} style={styles.deleteBtn}>
                  <Trash2 color={Colors.error} size={18} />
                </TouchableOpacity>
              </View>
            ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Upload button */}
      <TouchableOpacity style={styles.uploadBtn} onPress={() => setModalVisible(true)}>
        <Plus color={Colors.white} size={20} />
        <Text style={styles.uploadBtnText}>رفع مستند</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Colors.textPrimary} size={24} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة مستند جديد</Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>عنوان المستند *</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
              placeholder="مثال: شهادة الوفاة"
              textAlign="right"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fieldLabel}>نوع المستند</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChips}>
              {DOC_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, form.document_type === t && { backgroundColor: Colors.primary }]}
                  onPress={() => setForm({ ...form, document_type: t })}
                >
                  <Text style={[styles.typeChipText, form.document_type === t && { color: Colors.white }]}>
                    {DocCategories[t].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>ملاحظات</Text>
            <TextInput
              style={[styles.fieldInput, styles.textarea]}
              value={form.notes}
              onChangeText={(v) => setForm({ ...form, notes: v })}
              placeholder="أي ملاحظات إضافية..."
              textAlign="right"
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>حفظ المستند</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.white },
  addBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, padding: 12, fontSize: 15, color: Colors.textPrimary },
  searchIcon: { marginLeft: 8 },
  chipsScroll: { maxHeight: 48 },
  chips: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.white },
  badge: { backgroundColor: Colors.secondary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  summaryCards: { paddingHorizontal: 16, gap: 10, paddingVertical: 12 },
  summaryCard: { width: 90, borderRadius: 14, padding: 10, alignItems: 'center', gap: 4 },
  summaryCount: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textSecondary, marginTop: 16 },
  emptySubText: { fontSize: 14, color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  docCard: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    alignItems: 'flex-start',
  },
  docTypeTag: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  docInfo: { flex: 1, alignItems: 'flex-end' },
  docTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  docType: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  docNotes: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  docExpiry: { fontSize: 12, color: Colors.warning, marginTop: 4, fontWeight: '600' },
  deleteBtn: { padding: 8 },
  uploadBtn: {
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
  uploadBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  errorBox: { backgroundColor: Colors.errorLight, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: Colors.error, textAlign: 'right', fontSize: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', marginBottom: 8 },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.neutral50,
    marginBottom: 16,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  typeChips: { gap: 8, paddingBottom: 16 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.neutral100, borderWidth: 1, borderColor: Colors.border },
  typeChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
