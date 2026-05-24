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
import { Plus, Calendar, MapPin, X, Trash2, Scale, FileText, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

interface LocalAppointment {
  id: string;
  title: string;
  appointment_date: string;
  location: string;
  notes: string;
  type: 'court' | 'general';
}

interface LocalCase {
  id: string;
  title: string;
  case_number: string;
  court: string;
  next_date: string | null;
  status: string;
  notes: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const MONTH_NAMES = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

const isUpcoming = (dateStr: string | null) => {
  if (!dateStr) return false;
  return new Date(dateStr) >= new Date();
};

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<LocalAppointment[]>([]);
  const [cases, setCases] = useState<LocalCase[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'cases'>('appointments');
  const [showApptModal, setShowApptModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Appointment form state
  const [apptTitle, setApptTitle] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptLocation, setApptLocation] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  // Case form state
  const [caseTitle, setCaseTitle] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [caseCourt, setCaseCourt] = useState('');
  const [caseNextDate, setCaseNextDate] = useState('');
  const [caseNotes, setCaseNotes] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
        setIsOnline(true);
        loadData(data.session.user.id);
      }
    });
  }, []);

  const loadData = async (uid: string) => {
    const [appts, casesData] = await Promise.all([
      supabase.from('appointments').select('*').eq('user_id', uid).order('appointment_date'),
      supabase.from('cases').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ]);
    if (appts.data) {
      setAppointments(appts.data.map((a) => ({
        id: a.id,
        title: a.title,
        appointment_date: a.appointment_date,
        location: a.location,
        notes: a.notes,
        type: 'general',
      })));
    }
    if (casesData.data) {
      setCases(casesData.data.map((c) => ({
        id: c.id,
        title: c.title,
        case_number: c.case_number,
        court: c.court,
        next_date: c.next_date,
        status: c.status,
        notes: c.notes,
      })));
    }
  };

  const addAppointment = async () => {
    if (!apptTitle.trim() || !apptDate.trim()) {
      Alert.alert('خطأ', 'من فضلك أدخلي العنوان والتاريخ');
      return;
    }
    const newAppt: LocalAppointment = {
      id: generateId(),
      title: apptTitle,
      appointment_date: apptDate,
      location: apptLocation,
      notes: apptNotes,
      type: 'general',
    };
    if (isOnline && userId) {
      const { data } = await supabase.from('appointments').insert({
        user_id: userId,
        title: apptTitle,
        appointment_date: apptDate,
        location: apptLocation,
        notes: apptNotes,
      }).select().maybeSingle();
      if (data) newAppt.id = data.id;
    }
    setAppointments((prev) => [...prev, newAppt].sort((a, b) => a.appointment_date.localeCompare(b.appointment_date)));
    setApptTitle(''); setApptDate(''); setApptLocation(''); setApptNotes('');
    setShowApptModal(false);
  };

  const addCase = async () => {
    if (!caseTitle.trim()) {
      Alert.alert('خطأ', 'من فضلك أدخلي عنوان القضية');
      return;
    }
    const newCase: LocalCase = {
      id: generateId(),
      title: caseTitle,
      case_number: caseNumber,
      court: caseCourt,
      next_date: caseNextDate || null,
      status: 'active',
      notes: caseNotes,
    };
    if (isOnline && userId) {
      const { data } = await supabase.from('cases').insert({
        user_id: userId,
        title: caseTitle,
        case_number: caseNumber,
        court: caseCourt,
        next_date: caseNextDate || null,
        notes: caseNotes,
      }).select().maybeSingle();
      if (data) newCase.id = data.id;
    }
    setCases((prev) => [newCase, ...prev]);
    setCaseTitle(''); setCaseNumber(''); setCaseCourt(''); setCaseNextDate(''); setCaseNotes('');
    setShowCaseModal(false);
  };

  const deleteAppointment = async (id: string) => {
    if (isOnline) await supabase.from('appointments').delete().eq('id', id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteCase = async (id: string) => {
    if (isOnline) await supabase.from('cases').delete().eq('id', id);
    setCases((prev) => prev.filter((c) => c.id !== id));
  };

  const upcomingAppts = appointments.filter((a) => isUpcoming(a.appointment_date));
  const pastAppts = appointments.filter((a) => !isUpcoming(a.appointment_date));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2A7B7B', '#1A5555']} style={styles.header}>
        <Text style={styles.headerTitle}>المواعيد والقضايا</Text>
        <Text style={styles.headerSubtitle}>
          {upcomingAppts.length} موعد قادم · {cases.filter((c) => c.status === 'active').length} قضية نشطة
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cases' && styles.tabActive]}
          onPress={() => setActiveTab('cases')}
        >
          <Text style={[styles.tabText, activeTab === 'cases' && styles.tabTextActive]}>القضايا</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => setActiveTab('appointments')}
        >
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.tabTextActive]}>المواعيد</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {activeTab === 'appointments' ? (
          <>
            {upcomingAppts.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>المواعيد القادمة</Text>
                {upcomingAppts.map((a) => (
                  <AppointmentCard key={a.id} appt={a} onDelete={deleteAppointment} />
                ))}
              </>
            )}
            {pastAppts.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>المواعيد السابقة</Text>
                {pastAppts.map((a) => (
                  <AppointmentCard key={a.id} appt={a} onDelete={deleteAppointment} past />
                ))}
              </>
            )}
            {appointments.length === 0 && (
              <View style={styles.empty}>
                <Calendar color="#CCCCCC" size={52} strokeWidth={1.5} />
                <Text style={styles.emptyText}>لا توجد مواعيد بعد</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {cases.length === 0 ? (
              <View style={styles.empty}>
                <Scale color="#CCCCCC" size={52} strokeWidth={1.5} />
                <Text style={styles.emptyText}>لا توجد قضايا مسجلة بعد</Text>
              </View>
            ) : (
              cases.map((c) => <CaseCard key={c.id} caseItem={c} onDelete={deleteCase} />)
            )}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => activeTab === 'appointments' ? setShowApptModal(true) : setShowCaseModal(true)}
      >
        <Plus color="#FFFFFF" size={26} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Appointment Modal */}
      <Modal visible={showApptModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowApptModal(false)}>
                <X color="#666666" size={22} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>موعد جديد</Text>
            </View>
            <Text style={styles.fieldLabel}>العنوان</Text>
            <TextInput style={styles.input} value={apptTitle} onChangeText={setApptTitle} placeholder="مثال: تجديد بطاقة الهوية" textAlign="right" placeholderTextColor="#AAAAAA" />
            <Text style={styles.fieldLabel}>التاريخ (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={apptDate} onChangeText={setApptDate} placeholder="2025-11-20" textAlign="right" placeholderTextColor="#AAAAAA" />
            <Text style={styles.fieldLabel}>المكان</Text>
            <TextInput style={styles.input} value={apptLocation} onChangeText={setApptLocation} placeholder="مثال: مكتب الأحوال المدنية" textAlign="right" placeholderTextColor="#AAAAAA" />
            <Text style={styles.fieldLabel}>ملاحظات</Text>
            <TextInput style={[styles.input, styles.inputMulti]} value={apptNotes} onChangeText={setApptNotes} placeholder="أي ملاحظات إضافية" multiline textAlign="right" placeholderTextColor="#AAAAAA" />
            <TouchableOpacity style={styles.saveBtn} onPress={addAppointment}>
              <Text style={styles.saveBtnText}>حفظ الموعد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Case Modal */}
      <Modal visible={showCaseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCaseModal(false)}>
                <X color="#666666" size={22} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>قضية جديدة</Text>
            </View>
            <Text style={styles.fieldLabel}>عنوان القضية</Text>
            <TextInput style={styles.input} value={caseTitle} onChangeText={setCaseTitle} placeholder="مثال: قضية نفقة أطفال" textAlign="right" placeholderTextColor="#AAAAAA" />
            <Text style={styles.fieldLabel}>رقم القضية</Text>
            <TextInput style={styles.input} value={caseNumber} onChangeText={setCaseNumber} placeholder="مثال: 1234/2025" textAlign="right" placeholderTextColor="#AAAAAA" />
            <Text style={styles.fieldLabel}>المحكمة</Text>
            <TextInput style={styles.input} value={caseCourt} onChangeText={setCaseCourt} placeholder="مثال: محكمة الأسرة" textAlign="right" placeholderTextColor="#AAAAAA" />
            <Text style={styles.fieldLabel}>موعد الجلسة القادمة</Text>
            <TextInput style={styles.input} value={caseNextDate} onChangeText={setCaseNextDate} placeholder="2025-11-20" textAlign="right" placeholderTextColor="#AAAAAA" />
            <Text style={styles.fieldLabel}>ملاحظات</Text>
            <TextInput style={[styles.input, styles.inputMulti]} value={caseNotes} onChangeText={setCaseNotes} placeholder="تفاصيل القضية" multiline textAlign="right" placeholderTextColor="#AAAAAA" />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#2A7B7B' }]} onPress={addCase}>
              <Text style={styles.saveBtnText}>حفظ القضية</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AppointmentCard({ appt, onDelete, past }: { appt: LocalAppointment; onDelete: (id: string) => void; past?: boolean }) {
  return (
    <View style={[styles.apptCard, past && styles.apptCardPast]}>
      <TouchableOpacity onPress={() => onDelete(appt.id)} style={styles.deleteBtn}>
        <Trash2 color="#CC5555" size={16} strokeWidth={2} />
      </TouchableOpacity>
      <View style={styles.cardBody2}>
        <Text style={[styles.apptTitle, past && styles.pastText]}>{appt.title}</Text>
        <View style={styles.apptMeta}>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatDate(appt.appointment_date)}</Text>
            <Clock color="#8A8A8A" size={13} strokeWidth={2} />
          </View>
          {appt.location ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{appt.location}</Text>
              <MapPin color="#8A8A8A" size={13} strokeWidth={2} />
            </View>
          ) : null}
        </View>
        {appt.notes ? <Text style={styles.apptNotes}>{appt.notes}</Text> : null}
      </View>
      <View style={[styles.apptAccent, { backgroundColor: past ? '#CCCCCC' : '#2A7B7B' }]} />
    </View>
  );
}

function CaseCard({ caseItem, onDelete }: { caseItem: LocalCase; onDelete: (id: string) => void }) {
  const isActive = caseItem.status === 'active';
  return (
    <View style={[styles.caseCard, !isActive && styles.caseCardClosed]}>
      <TouchableOpacity onPress={() => onDelete(caseItem.id)} style={styles.deleteBtn}>
        <Trash2 color="#CC5555" size={16} strokeWidth={2} />
      </TouchableOpacity>
      <View style={styles.cardBody2}>
        <View style={styles.caseTitleRow}>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#EFF9F4' : '#F0F0F0' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#2D6A4F' : '#7A7A7A' }]}>
              {isActive ? 'نشطة' : 'مغلقة'}
            </Text>
          </View>
          <Text style={styles.caseTitle}>{caseItem.title}</Text>
        </View>
        {caseItem.case_number ? (
          <Text style={styles.caseNumber}>رقم القضية: {caseItem.case_number}</Text>
        ) : null}
        {caseItem.court ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{caseItem.court}</Text>
            <Scale color="#8A8A8A" size={13} strokeWidth={2} />
          </View>
        ) : null}
        {caseItem.next_date ? (
          <View style={[styles.nextDateRow]}>
            <Text style={styles.nextDateLabel}>الجلسة القادمة: </Text>
            <Text style={styles.nextDateValue}>{formatDate(caseItem.next_date)}</Text>
          </View>
        ) : null}
        {caseItem.notes ? <Text style={styles.apptNotes}>{caseItem.notes}</Text> : null}
      </View>
      <View style={[styles.apptAccent, { backgroundColor: isActive ? '#2A7B7B' : '#CCCCCC' }]} />
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'right' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginTop: 4 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D8',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#2A7B7B' },
  tabText: { fontSize: 15, color: '#8A8A8A', fontWeight: '500' },
  tabTextActive: { color: '#2A7B7B', fontWeight: '700' },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#8A8A8A', textAlign: 'right', marginBottom: 8, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#AAAAAA' },
  apptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  apptCardPast: { opacity: 0.6 },
  apptAccent: { width: 5 },
  cardBody2: { flex: 1, padding: 14 },
  apptTitle: { fontSize: 15, fontWeight: '700', color: '#2C2C2C', textAlign: 'right', marginBottom: 6 },
  pastText: { color: '#8A8A8A' },
  apptMeta: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  metaText: { fontSize: 12, color: '#7A7A7A' },
  apptNotes: { fontSize: 12, color: '#AAAAAA', textAlign: 'right', marginTop: 6 },
  deleteBtn: { padding: 10, justifyContent: 'center' },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  caseCardClosed: { opacity: 0.65 },
  caseTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 6 },
  caseTitle: { fontSize: 15, fontWeight: '700', color: '#2C2C2C', textAlign: 'right', flex: 1 },
  caseNumber: { fontSize: 12, color: '#7A7A7A', textAlign: 'right', marginBottom: 4 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '600' },
  nextDateRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 6 },
  nextDateLabel: { fontSize: 12, color: '#8A8A8A' },
  nextDateValue: { fontSize: 12, fontWeight: '700', color: '#2A7B7B' },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A7B7B',
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
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C2C2C' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#4A4A4A', textAlign: 'right', marginBottom: 8 },
  input: {
    backgroundColor: '#F5F0EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#2C2C2C',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  inputMulti: { height: 70, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
