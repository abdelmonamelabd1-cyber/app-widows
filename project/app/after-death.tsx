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
import { ArrowRight, CheckCircle, Circle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Step {
  id: string;
  title: string;
  description: string;
  details: string[];
  urgency: 'urgent' | 'normal' | 'later';
  completed: boolean;
}

const INITIAL_STEPS: Step[] = [
  {
    id: '1',
    title: 'الحصول على شهادة الوفاة',
    description: 'أول خطوة وأهم خطوة',
    details: [
      'اطلبي شهادة الوفاة من المستشفى أو الطبيب الذي أكد الوفاة',
      'احتفظي بعدة نسخ موثقة منها (على الأقل 10 نسخ)',
      'ستحتاجين إليها في كل الإجراءات القادمة',
    ],
    urgency: 'urgent',
    completed: false,
  },
  {
    id: '2',
    title: 'إشعار الجهات الرسمية',
    description: 'خلال 3 أيام من الوفاة',
    details: [
      'التوجه إلى مكتب الأحوال المدنية لإثبات الوفاة',
      'إشعار مكتب الضمان الاجتماعي إن كان زوجك مشتركًا',
      'إشعار جهة عمله بالوفاة',
      'إشعار البنك لتجميد الحسابات المشتركة مؤقتًا',
    ],
    urgency: 'urgent',
    completed: false,
  },
  {
    id: '3',
    title: 'رفع دعوى حصر الإرث',
    description: 'لتحديد الورثة الشرعيين',
    details: [
      'التوجه إلى محكمة الأحوال الشخصية',
      'تقديم شهادة الوفاة وبطاقات هوية الورثة',
      'دفع رسوم المحكمة والانتظار للجلسة',
      'الحصول على حكم حصر الإرث وتوثيقه',
    ],
    urgency: 'urgent',
    completed: false,
  },
  {
    id: '4',
    title: 'التعامل مع الحسابات البنكية',
    description: 'حقوقك المالية',
    details: [
      'تقديم حكم حصر الإرث إلى البنك',
      'طلب تحويل الأموال المشتركة باسمك',
      'إغلاق حسابات زوجك المنفردة وتقسيم رصيدها',
      'إلغاء البطاقات الائتمانية التي كانت باسمه',
    ],
    urgency: 'normal',
    completed: false,
  },
  {
    id: '5',
    title: 'تسوية العقارات والممتلكات',
    description: 'نقل الملكية',
    details: [
      'جمع جميع عقود الملكية وسندات التسجيل',
      'التوجه إلى الشهر العقاري بحكم الإرث',
      'تسجيل حصتك في العقارات باسمك',
      'مراجعة محامي للعقارات تحت الإيجار أو المرهونة',
    ],
    urgency: 'normal',
    completed: false,
  },
  {
    id: '6',
    title: 'التأمين على الحياة والمعاش',
    description: 'حقوقك المستحقة',
    details: [
      'التواصل مع شركة التأمين للمطالبة بوثيقة التأمين',
      'تقديم طلب صرف معاش الوفاة من التأمينات الاجتماعية',
      'طلب الحصول على معاش الأرملة من جهة عمله',
      'الاستفسار عن أي مزايا مستحقة أخرى',
    ],
    urgency: 'normal',
    completed: false,
  },
  {
    id: '7',
    title: 'الأوراق الرسمية والبطاقات',
    description: 'تحديث وثائقك',
    details: [
      'تجديد بطاقة هويتك إن كان فيها اسمه',
      'تحديث شهادات ميلاد الأطفال إن لزم',
      'تغيير حالتك المدنية في السجلات الرسمية',
      'تحديث عنوانك في كل الوثائق الرسمية',
    ],
    urgency: 'later',
    completed: false,
  },
  {
    id: '8',
    title: 'حضانة الأطفال ونفقتهم',
    description: 'حماية مستقبل أطفالك',
    details: [
      'التوجه إلى محكمة الأسرة لإثبات الحضانة',
      'طلب النفقة من تركة الزوج لصالح الأطفال',
      'تسجيل الأطفال في المدرسة بوليك أمر جديد',
      'فتح حسابات بنكية باسم الأطفال لحفظ نصيبهم',
    ],
    urgency: 'normal',
    completed: false,
  },
];

const URGENCY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'عاجل', color: '#C05050', bg: '#FFF0F0' },
  normal: { label: 'مهم', color: '#C9A84C', bg: '#FFF8E8' },
  later: { label: 'لاحقًا', color: '#3A6EA5', bg: '#E8F4FF' },
};

export default function AfterDeathScreen() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const toggleComplete = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = completedCount / steps.length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2D6A4F', '#1B4332']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowRight color="#FFFFFF" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>بعد الوفاة</Text>
        <Text style={styles.headerSubtitle}>دليلك خطوة بخطوة</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount} من {steps.length} خطوات مكتملة
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <AlertCircle color="#C9A84C" size={18} strokeWidth={2} />
          <Text style={styles.infoText}>
            خذي وقتك، لستِ مضطرة لإنجاز كل شيء دفعة واحدة. الخطوات مرتبة حسب الأولوية.
          </Text>
        </View>

        {steps.map((step, idx) => {
          const isExpanded = expandedId === step.id;
          const urgency = URGENCY_LABELS[step.urgency];

          return (
            <View key={step.id} style={[styles.stepCard, step.completed && styles.stepCompleted]}>
              <TouchableOpacity
                style={styles.stepHeader}
                onPress={() => setExpandedId(isExpanded ? null : step.id)}
                activeOpacity={0.7}
              >
                <View style={styles.stepLeft}>
                  <TouchableOpacity onPress={() => toggleComplete(step.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    {step.completed ? (
                      <CheckCircle color="#2D6A4F" size={24} fill="#2D6A4F" />
                    ) : (
                      <Circle color="#AAAAAA" size={24} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.stepContent}>
                  <View style={styles.stepTitleRow}>
                    <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                      <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
                    </View>
                    <Text style={styles.stepNumber}>الخطوة {idx + 1}</Text>
                  </View>
                  <Text style={[styles.stepTitle, step.completed && styles.stepTitleDone]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>

                <View style={styles.chevron}>
                  {isExpanded ? (
                    <ChevronUp color="#8A8A8A" size={18} />
                  ) : (
                    <ChevronDown color="#8A8A8A" size={18} />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.stepDetails}>
                  {step.details.map((detail, dIdx) => (
                    <View key={dIdx} style={styles.detailRow}>
                      <View style={styles.detailBullet} />
                      <Text style={styles.detailText}>{detail}</Text>
                    </View>
                  ))}
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
  container: {
    flex: 1,
    backgroundColor: '#F5F0EB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backBtn: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    textAlign: 'right',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#C9A84C',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#5A4A2A',
    textAlign: 'right',
    lineHeight: 20,
  },
  stepCard: {
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
  stepCompleted: {
    opacity: 0.7,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  stepLeft: {
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  stepNumber: {
    fontSize: 11,
    color: '#AAAAAA',
  },
  urgencyBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C2C2C',
    textAlign: 'right',
  },
  stepTitleDone: {
    textDecorationLine: 'line-through',
    color: '#9A9A9A',
  },
  stepDescription: {
    fontSize: 12,
    color: '#7A7A7A',
    textAlign: 'right',
    marginTop: 2,
  },
  chevron: {
    justifyContent: 'center',
  },
  stepDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 8,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE5',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2D6A4F',
    marginTop: 7,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#4A4A4A',
    textAlign: 'right',
    lineHeight: 20,
  },
});
