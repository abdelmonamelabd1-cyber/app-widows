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
import { Colors, CaseTypes } from '@/lib/colors';
import { Calendar, Scale, Plus, X, MapPin, Trash2, Clock } from 'lucide-react-native';
import type { Case, Appointment } from '@/lib/supabase';

const CASE_TYPES = ['alimony', 'custody', 'inheritance', 'property', 'other'] as const;
const APT_TYPES = ['court', 'lawyer', 'government', 'bank', 'medical', 'other'] as const;

const AptTypeLabels: Record<string, string> = {
  court: 'محكمة',
  lawyer: 'محامي',
  government: 'حكومي',
  bank: 'بنك',
  medical: 'طبي',
  other: 'أخرى',
};

export default function CasesScreen() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'cases'>('appointments');
  const [cases, setCases] = useState<Case[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [caseModalVisible, setCaseModalVisible] = useState(false);
  const [aptModalVisible, setAptModalVisible] = useState(false);
  const [caseForm, setCaseForm] = useState({ title: '', case_type: 'alimony', court: '', case_number: '', notes: '', next_session: '' });
  const [aptForm, setAptForm] = useState({ title: '', appointment_type: 'court', appointment_date: '', location: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: casesData }, { data: aptsData }] = await Promise.all([
      supabase.from('cases').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('appointments').select('*').eq('user_id', user.id).order('appointment_date', { ascending: true }),
    ]);
    if (casesData) setCases(casesData);
    if (aptsData) setAppointments(aptsData);
    setLoading(false);
  };

  const handleAddCase = async () => {
    if (!caseForm.title.trim()) { setError('يرجى إدخال عنوان القضية'); return; }
    setSaving(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('cases').insert({
      user_id: user.id,
      title: caseForm.title.trim(),
      case_type: caseForm.case_type,
      court: caseForm.court.trim(),
      case_number: caseForm.case_number.trim(),
      notes: caseForm.notes.trim(),
      next_session: caseForm.next_session || null,
    });
    setSaving(false);
    setCaseModalVisible(false);
    setCaseForm({ title: '', case_type: 'alimony', court: '', case_number: '', notes: '', next_session: '' });
    loadData();
  };

  const handleAddApt = async () => {
    if (!aptForm.title.trim() || !aptForm.appointment_date) { setError('يرجى إدخال العنوان والتاريخ'); return; }
    setSaving(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('appointments').insert({
      user_id: user.id,
      title: aptForm.title.trim(),
      appointment_type: aptForm.appointment_type,
      appointment_date: new Date(aptForm.appointment_date).toISOString(),
      location: aptForm.location.trim(),
      notes: aptForm.notes.trim(),
    });
    setSaving(false);
    setAptModalVisible(false);
    setAptForm({ title: '', appointment_type: 'court', appointment_date: '', location: '', notes: '' });
    loadData();
  };

  const deleteCase = async (id: string) => {
    await supabase.from('cases').delete().eq('id', id);
    setCases((prev) => prev.filter((c) => c.id !== id));
  };

  const deleteApt = async (id: string) => {
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatDateTime = (d: string) => {
    const dt = new Date(d);
    return `${dt.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })} - ${dt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const upcoming = appointments.filter((a) => new Date(a.appointment_date) >= new Date());
  const past = appointments.filter((a) => new Date(a.appointment_date) < new Date());

  const nextApt = upcoming[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>القضايا والمواعيد</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => activeTab === 'appointments' ? setAptModalVisible(true) : setCaseModalVisible(true)}>
          <Plus color={Colors.white} size={20} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => setActiveTab('appointments')}
        >
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.tabTextActive]}>المواعيد</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cases' && styles.tabActive]}
          onPress={() => setActiveTab('cases')}
        >
          <Text style={[styles.tabText, activeTab === 'cases' && styles.tabTextActive]}>القضايا</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {activeTab === 'appointments' ? (
            <>
              {/* Next appointment highlight */}
              {nextApt && (
                <View style={styles.nextAptCard}>
                  <View style={styles.nextAptHeader}>
                    <Calendar color={Colors.white} size={20} />
                    <Text style={styles.nextAptHeaderText}>الجلسة القادمة</Text>
                  </View>
                  <Text style={styles.nextAptTitle}>{nextApt.title}</Text>
                  <Text style={styles.nextAptDate}>{formatDateTime(nextApt.appointment_date)}</Text>
                  {nextApt.location ? (
                    <View style={styles.nextAptLocation}>
                      <MapPin color="rgba(255,255,255,0.8)" size={14} />
                      <Text style={styles.nextAptLocationText}>{nextApt.location}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              <Text style={styles.sectionLabel}>المواعيد القادمة</Text>
              {upcoming.length === 0 && (
                <View style={styles.emptyState}>
                  <Calendar color={Colors.textMuted} size={40} />
                  <Text style={styles.emptyText}>لا توجد مواعيد قادمة</Text>
                </View>
              )}
              {upcoming.map((apt) => (
                <View key={apt.id} style={styles.aptCard}>
                  <View style={styles.aptLeft}>
                    <Text style={styles.aptTypeText}>{AptTypeLabels[apt.appointment_type] || 'موعد'}</Text>
                    <TouchableOpacity onPress={() => deleteApt(apt.id)}>
                      <Trash2 color={Colors.error} size={16} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.aptInfo}>
                    <Text style={styles.aptTitle}>{apt.title}</Text>
                    <View style={styles.aptRow}>
                      <Clock color={Colors.textMuted} size={13} />
                      <Text style={styles.aptDate}>{formatDateTime(apt.appointment_date)}</Text>
                    </View>
                    {apt.location ? (
                      <View style={styles.aptRow}>
                        <MapPin color={Colors.textMuted} size={13} />
                        <Text style={styles.aptDate}>{apt.location}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.aptIconBox}>
                    <Calendar color={Colors.primary} size={20} />
                  </View>
                </View>
              ))}

              {past.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>مواعيد سابقة</Text>
                  {past.map((apt) => (
                    <View key={apt.id} style={[styles.aptCard, styles.aptCardPast]}>
                      <View style={styles.aptLeft}>
                        <TouchableOpacity onPress={() => deleteApt(apt.id)}>
                          <Trash2 color={Colors.error} size={16} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.aptInfo}>
                        <Text style={[styles.aptTitle, { color: Colors.textSecondary }]}>{apt.title}</Text>
                        <Text style={styles.aptDate}>{formatDateTime(apt.appointment_date)}</Text>
                      </View>
                      <View style={[styles.aptIconBox, { backgroundColor: Colors.neutral100 }]}>
                        <Calendar color={Colors.textMuted} size={20} />
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {cases.length === 0 ? (
                <View style={styles.emptyState}>
                  <Scale color={Colors.textMuted} size={40} />
                  <Text style={styles.emptyText}>لا توجد قضايا مسجلة</Text>
                </View>
              ) : (
                cases.map((c) => (
                  <View key={c.id} style={styles.caseCard}>
                    <View style={styles.caseHeader}>
                      <TouchableOpacity onPress={() => deleteCase(c.id)}>
                        <Trash2 color={Colors.error} size={16} />
                      </TouchableOpacity>
                      <View style={[styles.caseStatusBadge, { backgroundColor: c.status === 'active' ? Colors.successLight : Colors.neutral100 }]}>
                        <Text style={[styles.caseStatusText, { color: c.status === 'active' ? Colors.success : Colors.textMuted }]}>
                          {c.status === 'active' ? 'نشطة' : 'منتهية'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.caseTitle}>{c.title}</Text>
                    <Text style={styles.caseType}>{CaseTypes[c.case_type]?.label || 'قضية'}</Text>
                    {c.court ? <Text style={styles.caseMeta}>المحكمة: {c.court}</Text> : null}
                    {c.case_number ? <Text style={styles.caseMeta}>رقم القضية: {c.case_number}</Text> : null}
                    {c.next_session ? (
                      <View style={styles.nextSessionRow}>
                        <Calendar color={Colors.primary} size={14} />
                        <Text style={styles.nextSessionText}>الجلسة القادمة: {new Date(c.next_session).toLocaleDateString('ar-EG')}</Text>
                      </View>
                    ) : null}
                    {c.notes ? <Text style={styles.caseNotes}>{c.notes}</Text> : null}
                  </View>
                ))
              )}
            </>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => activeTab === 'appointments' ? setAptModalVisible(true) : setCaseModalVisible(true)}
      >
        <Plus color={Colors.white} size={24} />
        <Text style={styles.fabText}>{activeTab === 'appointments' ? 'إضافة موعد' : 'إضافة قضية'}</Text>
      </TouchableOpacity>

      {/* Case Modal */}
      <Modal visible={caseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setCaseModalVisible(false)}><X color={Colors.textPrimary} size={24} /></TouchableOpacity>
                <Text style={styles.modalTitle}>إضافة قضية جديدة</Text>
              </View>
              {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
              <Text style={styles.fieldLabel}>عنوان القضية *</Text>
              <TextInput style={styles.fieldInput} value={caseForm.title} onChangeText={(v) => setCaseForm({ ...caseForm, title: v })} placeholder="مثال: قضية نفقة" textAlign="right" placeholderTextColor={Colors.textMuted} />
              <Text style={styles.fieldLabel}>نوع القضية</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                {CASE_TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeChip, caseForm.case_type === t && styles.typeChipActive]} onPress={() => setCaseForm({ ...caseForm, case_type: t })}>
                    <Text style={[styles.typeChipText, caseForm.case_type === t && { color: Colors.white }]}>{CaseTypes[t].label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.fieldLabel}>اسم المحكمة</Text>
              <TextInput style={styles.fieldInput} value={caseForm.court} onChangeText={(v) => setCaseForm({ ...caseForm, court: v })} placeholder="مثال: محكمة الأسرة" textAlign="right" placeholderTextColor={Colors.textMuted} />
              <Text style={styles.fieldLabel}>رقم القضية</Text>
              <TextInput style={styles.fieldInput} value={caseForm.case_number} onChangeText={(v) => setCaseForm({ ...caseForm, case_number: v })} placeholder="123/2024" textAlign="right" placeholderTextColor={Colors.textMuted} />
              <Text style={styles.fieldLabel}>تاريخ الجلسة القادمة</Text>
              <TextInput style={styles.fieldInput} value={caseForm.next_session} onChangeText={(v) => setCaseForm({ ...caseForm, next_session: v })} placeholder="2024-12-20" textAlign="right" placeholderTextColor={Colors.textMuted} />
              <Text style={styles.fieldLabel}>ملاحظات</Text>
              <TextInput style={[styles.fieldInput, styles.textarea]} value={caseForm.notes} onChangeText={(v) => setCaseForm({ ...caseForm, notes: v })} placeholder="أي تفاصيل إضافية..." textAlign="right" multiline numberOfLines={3} placeholderTextColor={Colors.textMuted} />
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddCase} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>حفظ القضية</Text>}
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Appointment Modal */}
      <Modal visible={aptModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setAptModalVisible(false)}><X color={Colors.textPrimary} size={24} /></TouchableOpacity>
                <Text style={styles.modalTitle}>إضافة موعد جديد</Text>
              </View>
              {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
              <Text style={styles.fieldLabel}>عنوان الموعد *</Text>
              <TextInput style={styles.fieldInput} value={aptForm.title} onChangeText={(v) => setAptForm({ ...aptForm, title: v })} placeholder="مثال: جلسة نفقة" textAlign="right" placeholderTextColor={Colors.textMuted} />
              <Text style={styles.fieldLabel}>نوع الموعد</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                {APT_TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeChip, aptForm.appointment_type === t && styles.typeChipActive]} onPress={() => setAptForm({ ...aptForm, appointment_type: t })}>
                    <Text style={[styles.typeChipText, aptForm.appointment_type === t && { color: Colors.white }]}>{AptTypeLabels[t]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.fieldLabel}>التاريخ والوقت *</Text>
              <TextInput style={styles.fieldInput} value={aptForm.appointment_date} onChangeText={(v) => setAptForm({ ...aptForm, appointment_date: v })} placeholder="2024-12-20T10:00" textAlign="right" placeholderTextColor={Colors.textMuted} />
              <Text style={styles.fieldLabel}>المكان</Text>
              <TextInput style={styles.fieldInput} value={aptForm.location} onChangeText={(v) => setAptForm({ ...aptForm, location: v })} placeholder="مثال: محكمة الأسرة" textAlign="right" placeholderTextColor={Colors.textMuted} />
              <Text style={styles.fieldLabel}>ملاحظات</Text>
              <TextInput style={[styles.fieldInput, styles.textarea]} value={aptForm.notes} onChangeText={(v) => setAptForm({ ...aptForm, notes: v })} placeholder="أي تفاصيل إضافية..." textAlign="right" multiline numberOfLines={3} placeholderTextColor={Colors.textMuted} />
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddApt} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>حفظ الموعد</Text>}
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.white },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row-reverse', backgroundColor: Colors.white, padding: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primaryLight },
  tabText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  list: { padding: 16 },
  nextAptCard: {
    backgroundColor: Colors.primary, borderRadius: 20, padding: 20, marginBottom: 20,
  },
  nextAptHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 },
  nextAptHeaderText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  nextAptTitle: { fontSize: 20, fontWeight: '700', color: Colors.white, textAlign: 'right', marginBottom: 6 },
  nextAptDate: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'right', marginBottom: 6 },
  nextAptLocation: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  nextAptLocationText: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right', marginBottom: 12, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginTop: 12 },
  aptCard: {
    flexDirection: 'row-reverse', backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 10,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, alignItems: 'flex-start',
  },
  aptCardPast: { opacity: 0.7 },
  aptIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  aptInfo: { flex: 1, alignItems: 'flex-end' },
  aptTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  aptRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginBottom: 4 },
  aptDate: { fontSize: 13, color: Colors.textSecondary },
  aptLeft: { alignItems: 'flex-end', gap: 6 },
  aptTypeText: { fontSize: 11, color: Colors.primary, fontWeight: '700', backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  caseCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  caseHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  caseStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  caseStatusText: { fontSize: 12, fontWeight: '700' },
  caseTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right', marginBottom: 6 },
  caseType: { fontSize: 13, color: Colors.primary, fontWeight: '600', textAlign: 'right', marginBottom: 8 },
  caseMeta: { fontSize: 13, color: Colors.textSecondary, textAlign: 'right', marginBottom: 4 },
  nextSessionRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 8 },
  nextSessionText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  caseNotes: { fontSize: 13, color: Colors.textMuted, textAlign: 'right', marginTop: 8, lineHeight: 20 },
  fab: {
    position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: Colors.primary,
    borderRadius: 14, padding: 16, flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'center', gap: 8, elevation: 4,
  },
  fabText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  errorBox: { backgroundColor: Colors.errorLight, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: Colors.error, textAlign: 'right', fontSize: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', marginBottom: 8 },
  fieldInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.neutral50, marginBottom: 16 },
  textarea: { height: 80, textAlignVertical: 'top' },
  typeRow: { gap: 8, paddingBottom: 16 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.neutral50 },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
