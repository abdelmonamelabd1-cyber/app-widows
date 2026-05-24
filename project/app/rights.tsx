import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ChevronDown, ChevronUp, Scale, Home, Heart, Coins, Users, FileCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface RightItem {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  summary: string;
  details: string[];
  articles: string[];
}

const RIGHTS: RightItem[] = [
  {
    id: 'inheritance',
    title: 'حق الإرث',
    icon: Coins,
    color: '#C9A84C',
    summary: 'حقك في ميراث زوجك المتوفى',
    details: [
      'تستحقين ربع التركة إن لم يكن للمتوفى أولاد',
      'تستحقين الثمن إن كان له أولاد',
      'يشمل الإرث: العقارات، الأموال، المنقولات، الديون',
      'لك حق المطالبة بإيقاف التصرف في التركة حتى يُحصر الإرث',
    ],
    articles: ['المادة 11 من قانون المواريث', 'المادة 15 من قانون الأحوال الشخصية'],
  },
  {
    id: 'alimony',
    title: 'نفقة العدة والسكن',
    icon: Home,
    color: '#2D6A4F',
    summary: 'حقك في النفقة والسكن خلال العدة',
    details: [
      'لك حق البقاء في مسكن الزوجية خلال فترة العدة (4 أشهر و10 أيام)',
      'يحق لك الحصول على نفقة من التركة طوال فترة العدة',
      'إن كنت حاملاً تستمر النفقة حتى الوضع',
      'يجوز لك طلب تثبيت المسكن باسمك إن كان باسمه',
    ],
    articles: ['المادة 189 من قانون الأسرة', 'المادة 201 من قانون الأسرة'],
  },
  {
    id: 'custody',
    title: 'حضانة الأطفال',
    icon: Users,
    color: '#3A6EA5',
    summary: 'حقك في حضانة أطفالك ونفقتهم',
    details: [
      'الأم تتولى الحضانة الفعلية للأطفال تلقائيًا',
      'تستمر الحضانة للبنت حتى الزواج وللولد حتى 15 عامًا في أغلب القوانين',
      'نفقة الأطفال واجبة من تركة الأب المتوفى',
      'يمكنك طلب تعيينك وصية قانونية على أموال الأطفال',
    ],
    articles: ['المادة 20 من قانون حضانة الأطفال', 'المادة 78 من قانون الأحوال الشخصية'],
  },
  {
    id: 'pension',
    title: 'المعاش والتأمين',
    icon: FileCheck,
    color: '#2A7B7B',
    summary: 'معاشك وحقوقك التأمينية',
    details: [
      'تستحقين معاش الأرملة من التأمينات الاجتماعية',
      'يتم صرف المعاش شهريًا بعد تقديم طلب',
      'في حال زواجك مرة أخرى يتوقف المعاش في بعض الأنظمة',
      'إن كان له تأمين خاص على الحياة فأنتِ المستفيدة الأولى',
    ],
    articles: ['قانون التأمينات الاجتماعية', 'اللائحة التنفيذية للمعاشات'],
  },
  {
    id: 'property',
    title: 'حقوق في الممتلكات',
    icon: Home,
    color: '#B55A7A',
    summary: 'حقوقك في العقارات والأصول',
    details: [
      'حصتك في الإرث تشمل العقارات والأراضي',
      'يمكن نقل ملكية حصتك بحكم قضائي أو اتفاق الورثة',
      'لك حق الانتفاع بالمسكن حتى لو لم تكن مالكة له كاملاً',
      'يحق لك رفع دعوى قسمة إن رفض باقي الورثة',
    ],
    articles: ['قانون الشهر العقاري', 'المادة 45 من قانون التوثيق'],
  },
  {
    id: 'legal_aid',
    title: 'الاستعانة بمحامٍ',
    icon: Scale,
    color: '#7A5AA0',
    summary: 'حقك في الحصول على مساعدة قانونية',
    details: [
      'يحق لك طلب تعيين محامٍ من نقابة المحامين بتكلفة رمزية',
      'الجمعيات الخيرية ومنظمات المرأة تقدم استشارات مجانية',
      'يمكن تقديم بلاغات للنيابة دون رسوم في القضايا العائلية',
      'لك الحق في حضور جميع جلسات قضاياك والاطلاع على الأوراق',
    ],
    articles: ['قانون المحاماة', 'قانون المساعدة القضائية'],
  },
];

export default function RightsScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>('inheritance');

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2A7B7B', '#1A5555']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowRight color="#FFFFFF" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الحقوق والملكية</Text>
        <Text style={styles.headerSubtitle}>تعرفي على حقوقك القانونية الكاملة</Text>
      </LinearGradient>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            هذه المعلومات للتوعية العامة. لكل حالة ظروفها الخاصة. استشيري محامية أو تواصلي مع نور للمساعدة في وضعك تحديدًا.
          </Text>
        </View>

        {RIGHTS.map((right) => {
          const IconComp = right.icon;
          const isExpanded = expandedId === right.id;

          return (
            <View key={right.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedId(isExpanded ? null : right.id)}
                activeOpacity={0.7}
              >
                <View style={styles.chevron}>
                  {isExpanded ? (
                    <ChevronUp color="#8A8A8A" size={18} />
                  ) : (
                    <ChevronDown color="#8A8A8A" size={18} />
                  )}
                </View>
                <View style={styles.cardTitleSection}>
                  <Text style={styles.cardTitle}>{right.title}</Text>
                  <Text style={styles.cardSummary}>{right.summary}</Text>
                </View>
                <View style={[styles.iconBox, { backgroundColor: right.color + '18' }]}>
                  <IconComp color={right.color} size={22} strokeWidth={1.8} />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.cardBody}>
                  {right.details.map((detail, idx) => (
                    <View key={idx} style={styles.detailRow}>
                      <View style={[styles.bullet, { backgroundColor: right.color }]} />
                      <Text style={styles.detailText}>{detail}</Text>
                    </View>
                  ))}

                  <View style={styles.articlesSection}>
                    <Text style={styles.articlesTitle}>المرجع القانوني:</Text>
                    {right.articles.map((a, idx) => (
                      <Text key={idx} style={styles.articleText}>• {a}</Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backBtn: { alignSelf: 'flex-end', marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', textAlign: 'right' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginTop: 4 },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  noteCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#C9A84C',
  },
  noteText: { fontSize: 13, color: '#5A4A2A', textAlign: 'right', lineHeight: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleSection: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C2C2C', textAlign: 'right' },
  cardSummary: { fontSize: 12, color: '#8A8A8A', textAlign: 'right', marginTop: 2 },
  chevron: { justifyContent: 'center' },
  cardBody: {
    padding: 16,
    paddingTop: 4,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE5',
    gap: 10,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  detailText: { flex: 1, fontSize: 13, color: '#4A4A4A', textAlign: 'right', lineHeight: 20 },
  articlesSection: {
    backgroundColor: '#F0EBF5',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  articlesTitle: { fontSize: 12, fontWeight: '700', color: '#6A5A8A', textAlign: 'right', marginBottom: 6 },
  articleText: { fontSize: 12, color: '#6A5A8A', textAlign: 'right', lineHeight: 20 },
});
