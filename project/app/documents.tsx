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
import { ArrowRight, Plus, FileText, X, Trash2, Search, File, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

const DOC_TYPES = [
  { key: 'id', label: 'بطاقة هوية' },
  { key: 'birth_cert', label: 'شهادة ميلاد' },
  { key: 'death_cert', label: 'شهادة وفاة' },
  { key: 'inheritance', label: 'حصر إرث' },
  { key: 'court', label: 'أوراق محكمة' },
  { key: 'property', label: 'عقار/ملكية' },
  { key: 'insurance', label: 'تأمين' },
  { key: 'other', label: 'أخرى' },
];

interface LocalDoc {
  id: string;
  title: string;
  doc_type: string;
  notes: string;
  created_at: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function DocumentsScreen() {
  const router = useRouter();
  const [docs, setDocs] = useState<LocalDoc[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('id');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
        setIsOnline(true);
        loadDocs(data.session.user.id);
      }
    });
  }, []);

  const loadDocs = async (uid: string) => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (data) {
      setDocs(data.map((d) => ({
        id: d.id,
        title: d.title,
        doc_type: d.doc_type,
        notes: d.notes,
        created_at: d.created_at,
      })));
    }
  };

  const saveDoc = async () => {
    if (!title.trim()) {
      Alert.alert('خطأ', 'من فضلك أدخلي اسم المستند');
      return;
    }

    const newDoc: LocalDoc = {
      id: generateId(),
      title,
      doc_type: docType,
      notes,
      created_at: new Date().toISOString(),
    };

    if (isOnline && userId) {
      const { data } = await supabase.from('documents').insert({
        user_id: userId,
        title,
        doc_type: docType,
        notes,
      }).select().maybeSingle();
      if (data) newDoc.id = data.id;
    }

    setDocs((prev) => [newDoc, ...prev]);
    setTitle('');
    setNotes('');
    setDocType('id');
    setShowModal(false);
  };

  const deleteDoc = async (id: string) => {
    if (isOnline) {
      await supabase.from('documents').delete().eq('id', id);
    }
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const filtered = search
    ? docs.filter((d) => d.title.includes(search) || d.notes.includes(search))
    : docs;

  const getTypeLabel = (key: string) => DOC_TYPES.find((t) => t.key === key)?.label || key;

  const getTypeColor = (key: string) => {
    const colors: Record<string, string> = {
      id: '#3A6EA5',
      birth_cert: '#2D6A4F',
      death_cert: '#C05050',
      inheritance: '#C9A84C',
      court: '#8B3A5A',
      property: '#2A7B7B',
      insurance: '#6B5A9A',
      other: '#7A7A7A',
    };
    return colors[key] || '#7A7A7A';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#3A6EA5', '#1E4D7B']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowRight color="#FFFFFF" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المستندات</Text>
        <Text style={styles.headerSubtitle}>{docs.length} مستند محفوظ</Text>

        <View style={styles.searchContainer}>
          <Search color="rgba(255,255,255,0.7)" size={18} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحثي في المستندات..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <FileText color="#CCCCCC" size={56} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>لا توجد مستندات بعد</Text>
            <Text style={styles.emptySubtext}>احفظي أوراقك القانونية هنا لتجديها بسهولة</Text>
          </View>
        ) : (
          filtered.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <TouchableOpacity onPress={() => deleteDoc(doc.id)} style={styles.deleteBtn}>
                <Trash2 color="#CC5555" size={17} strokeWidth={2} />
              </TouchableOpacity>
              <View style={styles.docContent}>
                <View style={styles.docTop}>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(doc.doc_type) + '22' }]}>
                    <Text style={[styles.typeText, { color: getTypeColor(doc.doc_type) }]}>
                      {getTypeLabel(doc.doc_type)}
                    </Text>
                  </View>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                </View>
                {doc.notes ? <Text style={styles.docNotes}>{doc.notes}</Text> : null}
                <Text style={styles.docDate}>
                  {new Date(doc.created_at).toLocaleDateString('ar-EG')}
                </Text>
              </View>
              <View style={[styles.docIcon, { backgroundColor: getTypeColor(doc.doc_type) + '15' }]}>
                <File color={getTypeColor(doc.doc_type)} size={22} strokeWidth={1.8} />
              </View>
            </View>
          ))
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
              <Text style={styles.modalTitle}>إضافة مستند</Text>
            </View>

            <Text style={styles.fieldLabel}>اسم المستند</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="مثال: شهادة وفاة زوجي"
              textAlign="right"
              placeholderTextColor="#AAAAAA"
            />

            <Text style={styles.fieldLabel}>نوع المستند</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {DOC_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeBtn,
                    docType === t.key && styles.typeBtnActive,
                  ]}
                  onPress={() => setDocType(t.key)}
                >
                  <Text style={[styles.typeBtnText, docType === t.key && styles.typeBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>ملاحظات (اختياري)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={notes}
              onChangeText={setNotes}
              placeholder="أي معلومات إضافية عن المستند"
              multiline
              textAlign="right"
              placeholderTextColor="#AAAAAA"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveDoc}>
              <Text style={styles.saveBtnText}>حفظ المستند</Text>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: { alignSelf: 'flex-end', marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'right' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'right', marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#AAAAAA' },
  emptySubtext: { fontSize: 13, color: '#CCCCCC', textAlign: 'center', paddingHorizontal: 32 },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    gap: 10,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docContent: { flex: 1 },
  docTop: { marginBottom: 4 },
  docTitle: { fontSize: 15, fontWeight: '700', color: '#2C2C2C', textAlign: 'right' },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-end', marginBottom: 4 },
  typeText: { fontSize: 11, fontWeight: '600' },
  docNotes: { fontSize: 12, color: '#7A7A7A', textAlign: 'right', marginBottom: 4 },
  docDate: { fontSize: 11, color: '#AAAAAA', textAlign: 'right' },
  deleteBtn: { padding: 6 },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3A6EA5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C2C2C' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#4A4A4A', textAlign: 'right', marginBottom: 8 },
  typeScroll: { marginBottom: 16 },
  typeBtn: {
    borderWidth: 1.5,
    borderColor: '#E0D8D0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: '#FAFAFA',
  },
  typeBtnActive: { backgroundColor: '#3A6EA5', borderColor: '#3A6EA5' },
  typeBtnText: { fontSize: 13, color: '#6A6A6A', fontWeight: '500' },
  typeBtnTextActive: { color: '#FFFFFF', fontWeight: '600' },
  input: {
    backgroundColor: '#F5F0EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#2C2C2C',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#3A6EA5',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
