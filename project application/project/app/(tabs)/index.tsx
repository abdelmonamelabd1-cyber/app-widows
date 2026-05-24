import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText,
  DollarSign,
  Shield,
  Calendar,
  Flower2,
  Scale,
  Bell,
  MessageCircle,
  TrendingUp,
  GripVertical,
} from 'lucide-react-native';
import type { Profile, Appointment } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SectionItem {
  id: string;
  title: string;
  icon: any;
  color: string;
  bg: string;
  route: string;
}

const DEFAULT_SECTIONS: SectionItem[] = [
  { id: 'expenses', title: 'المصاريف', icon: DollarSign, color: '#0891B2', bg: '#CFFAFE', route: '/(tabs)/expenses' },
  { id: 'documents', title: 'المستندات', icon: FileText, color: '#F59E0B', bg: '#FEF3C7', route: '/(tabs)/documents' },
  { id: 'rights', title: 'الحقوق والملكية', icon: Shield, color: '#10B981', bg: '#D1FAE5', route: '/(tabs)/more' },
  { id: 'cases', title: 'القضايا والمواعيد', icon: Calendar, color: '#3B82F6', bg: '#DBEAFE', route: '/(tabs)/cases' },
  { id: 'afterdeath', title: 'بعد الوفاة', icon: Flower2, color: '#EC4899', bg: '#FCE7F3', route: '/(tabs)/more' },
  { id: 'legal', title: 'استشارات قانونية', icon: Scale, color: '#0E7490', bg: '#E0F2FE', route: '/(tabs)/more' },
];

const SECTION_ORDER_KEY = '@section_order';

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [sections, setSections] = useState<SectionItem[]>(DEFAULT_SECTIONS);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    loadSectionOrder();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (profileData) setProfile(profileData);

    const { data: appts } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .gte('appointment_date', new Date().toISOString())
      .order('appointment_date', { ascending: true })
      .limit(3);
    if (appts) setUpcomingAppointments(appts);
  };

  const loadSectionOrder = async () => {
    try {
      const saved = await AsyncStorage.getItem(SECTION_ORDER_KEY);
      if (saved) {
        const order: string[] = JSON.parse(saved);
        const ordered = order
          .map((id) => DEFAULT_SECTIONS.find((s) => s.id === id))
          .filter(Boolean) as SectionItem[];
        // Add any new sections not in saved order
        const savedIds = new Set(order);
        const newSections = DEFAULT_SECTIONS.filter((s) => !savedIds.has(s.id));
        setSections([...ordered, ...newSections]);
      }
    } catch {
      // Use default order
    }
  };

  const saveSectionOrder = async (items: SectionItem[]) => {
    try {
      const order = items.map((s) => s.id);
      await AsyncStorage.setItem(SECTION_ORDER_KEY, JSON.stringify(order));
    } catch {
      // Ignore save errors
    }
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newSections = [...sections];
    const [moved] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, moved);
    setSections(newSections);
    saveSectionOrder(newSections);
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'عزيزتي';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][d.getMonth()]}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <LinearGradient colors={['#0891B2', '#0E7490']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/more')}>
              <Bell color={Colors.white} size={22} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/more')}>
              <View style={styles.menuIcon}>
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.greeting}>مرحباً {firstName}</Text>
          <Text style={styles.subGreeting}>نحن هنا لمساعدتكِ في تنظيم حياتكِ وحقوقكِ</Text>
        </LinearGradient>

        {/* Motivational card - no image */}
        <View style={styles.motivCard}>
          <LinearGradient colors={['#CFFAFE', '#E0F2FE']} style={styles.motivGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.motivText}>
              <Text style={styles.motivTitle}>أنتِ قوية</Text>
              <Text style={styles.motivBody}>كل خطوة صغيرة اليوم{'\n'}تصنع فرقاً كبيراً غداً</Text>
            </View>
            <View style={styles.motivIconCircle}>
              <Flower2 color={Colors.primary} size={32} />
            </View>
          </LinearGradient>
        </View>

        {/* Main sections - draggable */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>الأقسام الرئيسية</Text>
          <Text style={styles.dragHint}>اضغطي مطولاً لإعادة الترتيب</Text>
        </View>
        <View style={styles.sectionsGrid}>
          {sections.map((s, index) => {
            const IconComp = s.icon;
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.sectionCard,
                  { backgroundColor: s.bg },
                  dragIndex === index && styles.sectionCardDragging,
                ]}
                onPress={() => router.push(s.route as any)}
                onLongPress={() => {
                  setDragIndex(index);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.sectionIconBox, { backgroundColor: s.color + '20' }]}>
                  <IconComp color={s.color} size={26} />
                </View>
                <Text style={[styles.sectionLabel, { color: s.color }]}>{s.title}</Text>
                {dragIndex !== null && (
                  <View style={styles.gripContainer}>
                    <GripVertical color={Colors.textMuted} size={16} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Drag mode controls */}
        {dragIndex !== null && (
          <View style={styles.dragControls}>
            <TouchableOpacity
              style={styles.dragBtn}
              onPress={() => {
                if (dragIndex > 0) moveSection(dragIndex, dragIndex - 1);
              }}
              disabled={dragIndex === 0}
            >
              <Text style={[styles.dragBtnText, dragIndex === 0 && styles.dragBtnDisabled]}>↑ حركي لفوق</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dragBtn}
              onPress={() => {
                if (dragIndex < sections.length - 1) moveSection(dragIndex, dragIndex + 1);
              }}
              disabled={dragIndex === sections.length - 1}
            >
              <Text style={[styles.dragBtnText, dragIndex === sections.length - 1 && styles.dragBtnDisabled]}>↓ حركي لتحت</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dragBtn, styles.dragBtnDone]}
              onPress={() => setDragIndex(null)}
            >
              <Text style={styles.dragBtnDoneText}>تم</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's notifications */}
        {upcomingAppointments.length > 0 && (
          <View style={styles.notifSection}>
            <View style={styles.notifHeader}>
              <Bell color={Colors.primary} size={18} />
              <Text style={styles.notifTitle}>تنبيهات اليوم</Text>
            </View>
            {upcomingAppointments.map((apt) => (
              <TouchableOpacity
                key={apt.id}
                style={styles.notifItem}
                onPress={() => router.push('/(tabs)/cases')}
              >
                <Text style={styles.notifText}>{apt.title}</Text>
                <Text style={styles.notifDate}>{formatDate(apt.appointment_date)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/expenses')}>
            <TrendingUp color={Colors.primary} size={20} />
            <Text style={styles.statLabel}>متابعة المصاريف</Text>
            <Text style={styles.statSub}>راجعي إنفاقكِ الشهري</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#FFF7ED' }]} onPress={() => router.push('/(tabs)/cases')}>
            <Calendar color="#F59E0B" size={20} />
            <Text style={[styles.statLabel, { color: '#92400E' }]}>مواعيدي</Text>
            <Text style={styles.statSub}>الجلسات القادمة</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* AI Chat FAB */}
      <TouchableOpacity
        style={styles.chatFab}
        onPress={() => router.push('/chat' as any)}
        activeOpacity={0.8}
      >
        <LinearGradient colors={['#0891B2', '#0E7490']} style={styles.chatFabGradient}>
          <MessageCircle color={Colors.white} size={26} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 16 },
  header: {
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  menuIcon: { gap: 5 },
  menuLine: { width: 22, height: 2.5, backgroundColor: Colors.white, borderRadius: 2 },
  greeting: { fontSize: 24, fontWeight: '700', color: Colors.white, textAlign: 'right', marginBottom: 6 },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'right', lineHeight: 22 },
  motivCard: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  motivGradient: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  motivText: { flex: 1, alignItems: 'flex-end' },
  motivTitle: { fontSize: 20, fontWeight: '700', color: Colors.primaryDark, marginBottom: 6 },
  motivBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'right', lineHeight: 22 },
  motivIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right' },
  dragHint: { fontSize: 11, color: Colors.textMuted },
  sectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  sectionCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-end',
    marginHorizontal: '1.5%',
    marginBottom: 4,
  },
  sectionCardDragging: {
    borderWidth: 2,
    borderColor: Colors.primary,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sectionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  gripContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  dragControls: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 14,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dragBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.neutral100,
  },
  dragBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  dragBtnDisabled: { opacity: 0.4 },
  dragBtnDone: { backgroundColor: Colors.primary },
  dragBtnDoneText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  notifSection: {
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  notifHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 12 },
  notifTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  notifItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral100,
  },
  notifText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', flex: 1, textAlign: 'right' },
  notifDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-end',
  },
  statLabel: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark, marginTop: 8 },
  statSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, textAlign: 'right' },
  chatFab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    elevation: 6,
    shadowColor: '#0891B2',
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  chatFabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
