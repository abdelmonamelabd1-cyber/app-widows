import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  DollarSign,
  FileText,
  Home,
  MessageCircle,
  Scale,
  Star,
  Heart,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

const COLORS = {
  bg: '#F5F0EB',
  card: '#FFFFFF',
  primary: '#2D6A4F',
  primaryLight: '#52B788',
  gold: '#C9A84C',
  warmRed: '#C05050',
  teal: '#2A7B7B',
  blue: '#3A6EA5',
  darkGreen: '#1B4332',
  rose: '#B55A7A',
  text: '#2C2C2C',
  textLight: '#6B6B6B',
  border: '#E8E0D8',
};

interface Section {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  gradient: [string, string];
  route: string;
}

const SECTIONS: Section[] = [
  {
    id: 'after_death',
    title: 'بعد الوفاة',
    subtitle: 'دليل خطوة بخطوة',
    icon: BookOpen,
    gradient: ['#2D6A4F', '#1B4332'],
    route: '/after-death',
  },
  {
    id: 'expenses',
    title: 'المصاريف',
    subtitle: 'تتبع المصروفات',
    icon: DollarSign,
    gradient: ['#C9A84C', '#A07830'],
    route: '/expenses',
  },
  {
    id: 'documents',
    title: 'المستندات',
    subtitle: 'حفظ الأوراق',
    icon: FileText,
    gradient: ['#3A6EA5', '#1E4D7B'],
    route: '/documents',
  },
  {
    id: 'rights',
    title: 'الحقوق والملكية',
    subtitle: 'حقوقك القانونية',
    icon: Scale,
    gradient: ['#2A7B7B', '#1A5555'],
    route: '/rights',
  },
  {
    id: 'legal',
    title: 'استشارات قانونية',
    subtitle: 'تحدثي مع نور',
    icon: MessageCircle,
    gradient: ['#B55A7A', '#8B3A5A'],
    route: '/(tabs)/chat',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(SECTIONS);
  const [isEditing, setIsEditing] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const longPressTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({});

  sections.forEach((s) => {
    if (!scaleAnims.current[s.id]) {
      scaleAnims.current[s.id] = new Animated.Value(1);
    }
  });

  const handleLongPress = useCallback((index: number) => {
    setIsEditing(true);
    setDragIndex(index);
  }, []);

  const handleMove = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const newSections = [...sections];
      const [moved] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, moved);
      setSections(newSections);
      setDragIndex(toIndex);
    },
    [sections]
  );

  const handlePress = useCallback(
    (section: Section) => {
      if (isEditing) {
        setIsEditing(false);
        setDragIndex(null);
        return;
      }
      router.push(section.route as any);
    },
    [isEditing, router]
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء النور';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#2D6A4F', '#1B4332']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.starContainer}>
              <Star color="#C9A84C" size={18} fill="#C9A84C" />
            </View>
            <Text style={styles.appName}>محاسبة القرار</Text>
          </View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <View style={styles.motivationCard}>
            <Heart color="#C9A84C" size={16} fill="#C9A84C" />
            <Text style={styles.motivationText}>أنتِ قوية وقادرة على تجاوز كل شيء</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Edit hint */}
      {isEditing ? (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerText}>اضغطي على أي مكان لإنهاء إعادة الترتيب</Text>
        </View>
      ) : (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>اضغطي مطولاً على المربع لإعادة الترتيب</Text>
        </View>
      )}

      {/* Sections horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionsScroll}
        style={styles.sectionsContainer}
      >
        {sections.map((section, index) => {
          const IconComponent = section.icon;
          const isDragging = dragIndex === index;

          return (
            <Animated.View
              key={section.id}
              style={[
                styles.sectionWrapper,
                isDragging && isEditing && styles.sectionDragging,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handlePress(section)}
                onLongPress={() => handleLongPress(index)}
                delayLongPress={500}
                style={styles.sectionTouchable}
              >
                <LinearGradient
                  colors={section.gradient}
                  style={styles.sectionCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isEditing && (
                    <View style={styles.reorderDots}>
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                    </View>
                  )}
                  <View style={styles.iconCircle}>
                    <IconComponent color="#FFFFFF" size={28} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>

                  {/* Reorder arrows when editing */}
                  {isEditing && (
                    <View style={styles.reorderButtons}>
                      {index > 0 && (
                        <TouchableOpacity
                          style={styles.arrowBtn}
                          onPress={() => handleMove(index, index - 1)}
                        >
                          <Text style={styles.arrowText}>→</Text>
                        </TouchableOpacity>
                      )}
                      {index < sections.length - 1 && (
                        <TouchableOpacity
                          style={styles.arrowBtn}
                          onPress={() => handleMove(index, index + 1)}
                        >
                          <Text style={styles.arrowText}>←</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>وصول سريع</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => router.push('/expenses' as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#FFF8E8' }]}>
              <DollarSign color="#C9A84C" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.quickLabel}>إضافة مصروف</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => router.push('/(tabs)/appointments' as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#E8F4FF' }]}>
              <Home color="#3A6EA5" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.quickLabel}>موعد جديد</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => router.push('/documents' as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#EFF9F4' }]}>
              <FileText color="#2D6A4F" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.quickLabel}>حفظ مستند</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => router.push('/(tabs)/chat' as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#FFF0F5' }]}>
              <MessageCircle color="#B55A7A" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.quickLabel}>تحدثي مع نور</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CARD_WIDTH = SCREEN_WIDTH * 0.52;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0EB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerContent: {},
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starContainer: {
    marginLeft: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  greeting: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
    marginBottom: 14,
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-end',
  },
  motivationText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginRight: 8,
    textAlign: 'right',
  },
  hintBar: {
    backgroundColor: '#EDE8E2',
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  hintText: {
    color: '#8A7A7A',
    fontSize: 11,
    textAlign: 'center',
  },
  editBanner: {
    backgroundColor: '#2D6A4F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  editBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  sectionsContainer: {
    marginTop: 16,
  },
  sectionsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  sectionWrapper: {
    width: CARD_WIDTH,
  },
  sectionDragging: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  sectionTouchable: {
    flex: 1,
  },
  sectionCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    padding: 18,
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  reorderDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 20,
    gap: 3,
    alignSelf: 'flex-end',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
    marginTop: 4,
  },
  reorderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  arrowBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  quickActions: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2C2C',
    textAlign: 'right',
    marginBottom: 14,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  quickItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: (SCREEN_WIDTH - 52) / 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 10,
    color: '#4A4A4A',
    textAlign: 'center',
    fontWeight: '500',
  },
});
