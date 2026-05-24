import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';
import {
  Settings,
  MessageCircle,
  Heart,
  Flower2,
  User,
  BarChart2,
  Scale,
  ChevronLeft,
  Send,
  X,
  Star,
  BookOpen,
  Phone,
  Smile,
  Meh,
  Frown,
  LogOut,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { AiConsultation, Profile } from '@/lib/supabase';

type ScreenView = 'menu' | 'chat' | 'psychological' | 'afterdeath' | 'profile' | 'rights';

const AFTER_DEATH_STEPS = [
  { num: 1, title: 'استخراج شهادة الوفاة', desc: 'من السجل المدني خلال 30 يوم من تاريخ الوفاة' },
  { num: 2, title: 'إعلام الورثة', desc: 'إخطار جميع الورثة الشرعيين بالوفاة' },
  { num: 3, title: 'حصر الممتلكات والأصول', desc: 'توثيق كل الأصول والديون والحسابات البنكية' },
  { num: 4, title: 'الاستعلام عن المعاش', desc: 'التقدم للحصول على معاش الأرملة من التأمينات الاجتماعية' },
  { num: 5, title: 'البنوك والحسابات', desc: 'إخطار البنوك وتحديث الحسابات المشتركة' },
  { num: 6, title: 'قضايا ومطالبات', desc: 'استشر محامياً لأي مطالبات قانونية أو ميراث' },
];

const RIGHTS_INFO = [
  { title: 'حق النفقة', desc: 'للأرملة الحق في النفقة من تركة الزوج طوال فترة العدة (4 أشهر و10 أيام)', icon: '⚖️' },
  { title: 'حق الميراث', desc: 'تستحق الزوجة ربع التركة إن لم يكن للزوج أولاد، والثمن إن كان له أولاد', icon: '🏛️' },
  { title: 'حضانة الأطفال', desc: 'الأم أحق بحضانة أطفالها حتى بلوغهم السن القانونية المقررة', icon: '👶' },
  { title: 'حق السكن', desc: 'للأرملة الحق في السكن في بيت الزوجية طوال فترة العدة', icon: '🏠' },
  { title: 'الضمان الاجتماعي', desc: 'يحق للأرملة التقدم بطلب للحصول على المعاش من التأمينات الاجتماعية', icon: '💳' },
  { title: 'تجديد الأوراق الرسمية', desc: 'يجب تجديد البطاقة الشخصية وجواز السفر باسمها الرباعي', icon: '📄' },
];

const AI_QUICK_QUESTIONS = ['عقد', 'إقرار استلام', 'تنازل', 'مش عارفة'];

export default function MoreScreen() {
  const [view, setView] = useState<ScreenView>('menu');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [journalText, setJournalText] = useState('');
  const [journalSaving, setJournalSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadProfile();
    loadChatHistory();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) setProfile(data);
  };

  const loadChatHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('ai_consultations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20);
    if (data) {
      const msgs: typeof messages = [];
      data.forEach((c) => {
        msgs.push({ role: 'user', content: c.question });
        if (c.answer) msgs.push({ role: 'assistant', content: c.answer });
      });
      setMessages(msgs);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const msg = (text || inputText).trim();
    if (!msg) return;
    setInputText('');
    const newMessages = [...messages, { role: 'user' as const, content: msg }];
    setMessages(newMessages);
    setChatLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const legalResponses: Record<string, string> = {
      'عقد': 'العقد هو اتفاق قانوني ملزم بين طرفين. قبل التوقيع على أي عقد، تأكدي من قراءة جميع البنود بعناية، وخاصة شروط الإنهاء والحقوق والالتزامات. يُنصح دائماً بمراجعة محامٍ متخصص قبل التوقيع.',
      'إقرار استلام': 'إقرار الاستلام وثيقة قانونية تُثبت أنكِ استلمتِ شيئاً ما. تأكدي من أن المبلغ أو الشيء المُستلم مُدوَّن بوضوح، وأن التاريخ صحيح. لا توقعي على إقرار استلام إلا بعد التحقق الفعلي من الاستلام.',
      'تنازل': 'التنازل عن حق قانوني يعني التخلي عنه نهائياً. هذا قرار مهم جداً! قبل التوقيع على أي تنازل، استشيري محامياً للتأكد من حقوقكِ الكاملة وما ستفقدينه بهذا التنازل.',
      'نفقة': 'النفقة حق مشروع للأرملة وأطفالها. يمكنكِ رفع دعوى نفقة أمام محكمة الأسرة، وستُحدد المحكمة المبلغ المناسب بناءً على حالة الزوج المادية. يُنصح بتوثيق احتياجاتكِ ومصاريفكِ.',
      'ميراث': 'وفقاً للشريعة الإسلامية والقانون المصري، تستحق الزوجة ربع التركة إن لم يكن هناك أولاد، والثمن إن وُجد أولاد. للتحقق من حقوقكِ الكاملة، تواصلي مع محامٍ متخصص في قضايا الميراث.',
      'حضانة': 'الأم أحق بحضانة أطفالها الصغار. تستمر الحضانة للأم حتى يبلغ الولد 15 سنة والبنت حتى تتزوج وفقاً للقانون المصري. إذا كان هناك نزاع على الحضانة، تواصلي مع محامي أسرة.',
    };

    let answer = 'أنا مساعدتكِ القانونية. يمكنني مساعدتكِ في الإجابة على الأسئلة القانونية المتعلقة بحقوقكِ كأرملة. للمسائل القانونية المعقدة، أنصحكِ بالتواصل مع محامٍ متخصص. ما الذي تودين الاستفسار عنه؟';

    for (const [key, response] of Object.entries(legalResponses)) {
      if (msg.includes(key)) {
        answer = response;
        break;
      }
    }

    if (msg.includes('مش عارفة') || msg.includes('لا أعرف')) {
      answer = 'لا بأس! أنا هنا لمساعدتكِ. أخبريني بالموقف أو الوثيقة التي تواجهينها، وسأحاول شرحها لكِ بلغة بسيطة. يمكنكِ أيضاً طلب التواصل مع محامٍ متخصص لمراجعة الوثائق.';
    }

    await supabase.from('ai_consultations').insert({
      user_id: user.id,
      question: msg,
      answer,
      consultation_type: 'legal',
    });

    setMessages([...newMessages, { role: 'assistant', content: answer }]);
    setChatLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSaveMood = async () => {
    if (!moodScore) return;
    setJournalSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await Promise.all([
      supabase.from('mood_logs').insert({ user_id: user.id, mood_score: moodScore, notes: journalText }),
      journalText ? supabase.from('journal_entries').insert({ user_id: user.id, content: journalText }) : Promise.resolve(),
    ]);
    setJournalSaving(false);
    setMoodScore(null);
    setJournalText('');
    alert('تم الحفظ بنجاح 💜');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)');
  };

  const menuItems = [
    { id: 'chat', title: 'استشارات قانونية', subtitle: 'اسألي مساعدتكِ الذكية', icon: Scale, color: '#0891B2', bg: '#CFFAFE' },
    { id: 'psychological', title: 'دعم نفسي', subtitle: 'تتبعي مزاجكِ ومشاعركِ', icon: Heart, color: '#EC4899', bg: '#FCE7F3' },
    { id: 'afterdeath', title: 'بعد الوفاة', subtitle: 'دليل الخطوات اللازمة', icon: Flower2, color: '#F59E0B', bg: '#FEF3C7' },
    { id: 'rights', title: 'الحقوق والملكية', subtitle: 'تعرفي على حقوقكِ القانونية', icon: BookOpen, color: '#10B981', bg: '#D1FAE5' },
    { id: 'profile', title: 'الملف الشخصي', subtitle: 'بياناتكِ الشخصية', icon: User, color: '#3B82F6', bg: '#DBEAFE' },
  ];

  if (view === 'menu') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0891B2', '#0E7490']} style={styles.menuHeader}>
          <Text style={styles.menuHeaderTitle}>المزيد</Text>
          <Text style={styles.menuHeaderSub}>أنتِ لستِ وحدكِ ❤️</Text>
        </LinearGradient>
        <ScrollView contentContainerStyle={styles.menuList} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => setView(item.id as ScreenView)}
                activeOpacity={0.7}
              >
                <ChevronLeft color={Colors.textMuted} size={18} />
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSub}>{item.subtitle}</Text>
                </View>
                <View style={[styles.menuItemIcon, { backgroundColor: item.bg }]}>
                  <IconComp color={item.color} size={22} />
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <LogOut color={Colors.error} size={20} />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  if (view === 'chat') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setView('menu')} style={styles.backBtn}>
            <ChevronLeft color={Colors.white} size={22} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle}>مساعدتكِ الذكية</Text>
            <Text style={styles.chatHeaderSub}>استشارات قانونية</Text>
          </View>
          <View style={styles.chatAvatarCircle}>
            <Scale color={Colors.white} size={20} />
          </View>
        </View>

        {messages.length === 0 && (
          <View style={styles.chatWelcome}>
            <Text style={styles.chatWelcomeTitle}>أنا هنا علشان أسمعكِ وأساعدكِ 💜</Text>
            <Text style={styles.chatWelcomeSub}>إيه أكثر حاجة مضايقاكِ النهارده؟</Text>
            <View style={styles.quickBtns}>
              {AI_QUICK_QUESTIONS.map((q) => (
                <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => handleSendMessage(q)}>
                  <Text style={styles.quickBtnText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <ScrollView ref={scrollRef} contentContainerStyle={styles.chatMessages} showsVerticalScrollIndicator={false}>
          {messages.map((msg, i) => (
            <View key={i} style={[styles.msgBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              {msg.role === 'assistant' && (
                <View style={styles.assistantAvatar}>
                  <Scale color={Colors.white} size={14} />
                </View>
              )}
              <View style={[styles.msgContent, msg.role === 'user' ? styles.userContent : styles.assistantContent]}>
                <Text style={[styles.msgText, msg.role === 'user' ? styles.userText : styles.assistantText]}>{msg.content}</Text>
              </View>
            </View>
          ))}
          {chatLoading && (
            <View style={[styles.msgBubble, styles.assistantBubble]}>
              <View style={styles.assistantAvatar}><Scale color={Colors.white} size={14} /></View>
              <View style={[styles.msgContent, styles.assistantContent]}>
                <ActivityIndicator color={Colors.primary} size="small" />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.chatInput}>
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || chatLoading}
          >
            <Send color={Colors.white} size={18} />
          </TouchableOpacity>
          <TextInput
            style={styles.chatTextInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="اكتبي رسالتكِ..."
            textAlign="right"
            multiline
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (view === 'psychological') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setView('menu')} style={styles.backBtn2}>
            <ChevronLeft color={Colors.white} size={22} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>دعم نفسي</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.moodCard}>
            <Text style={styles.moodTitle}>إزاي حاستكِ النهارده؟</Text>
            <View style={styles.moodRow}>
              {[
                { score: 1, icon: <Frown color="#EF4444" size={36} />, label: 'سيء' },
                { score: 2, icon: <Frown color="#F97316" size={36} />, label: 'مش كويس' },
                { score: 3, icon: <Meh color="#F59E0B" size={36} />, label: 'عادي' },
                { score: 4, icon: <Smile color="#10B981" size={36} />, label: 'كويس' },
                { score: 5, icon: <Smile color="#059669" size={36} />, label: 'ممتاز' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.score}
                  style={[styles.moodBtn, moodScore === m.score && styles.moodBtnActive]}
                  onPress={() => setMoodScore(m.score)}
                >
                  {m.icon}
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.journalCard}>
            <Text style={styles.journalTitle}>سجلي مشاعركِ ✍️</Text>
            <Text style={styles.journalSub}>اكتبي اللي جواكِ — هنا لن يراكِ أحد</Text>
            <TextInput
              style={styles.journalInput}
              value={journalText}
              onChangeText={setJournalText}
              placeholder="اكتبي ما تشعرين به..."
              textAlign="right"
              multiline
              numberOfLines={5}
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.saveJournalBtn, (!moodScore) && styles.saveBtnDisabled]}
              onPress={handleSaveMood}
              disabled={!moodScore || journalSaving}
            >
              {journalSaving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveJournalBtnText}>حفظ</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.psychTipsCard}>
            <Text style={styles.psychTipsTitle}>تمارين الهدوء 🌿</Text>
            {[
              { title: 'تنفس عميق', desc: 'خذي نفساً عميقاً لمدة 4 ثوانٍ، احبسيه 4 ثوانٍ، ثم أخرجيه ببطء' },
              { title: 'تذكري إنجازاتكِ', desc: 'فكري في شيء واحد أنجزتيه اليوم، مهما كان صغيراً' },
              { title: 'تواصلي', desc: 'تحدثي مع صديقة أو أحد أفراد الأسرة — لا تحملي ثقلكِ وحدكِ' },
            ].map((tip, i) => (
              <View key={i} style={styles.psychTip}>
                <View style={styles.psychTipNum}><Text style={styles.psychTipNumText}>{i + 1}</Text></View>
                <View style={styles.psychTipContent}>
                  <Text style={styles.psychTipTitle}>{tip.title}</Text>
                  <Text style={styles.psychTipDesc}>{tip.desc}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  if (view === 'afterdeath') {
    return (
      <View style={styles.container}>
        <View style={[styles.subHeader, { backgroundColor: '#F59E0B' }]}>
          <TouchableOpacity onPress={() => setView('menu')} style={styles.backBtn2}>
            <ChevronLeft color={Colors.white} size={22} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>بعد الوفاة</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCardTop, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.infoCardEmoji}>📋</Text>
            <Text style={[styles.infoCardTitle, { color: '#92400E' }]}>أول 30 يوم</Text>
            <Text style={[styles.infoCardDesc, { color: '#78350F' }]}>
              دليل بخطوات ما يجب فعله بعد الوفاة — خطوة بخطوة
            </Text>
          </View>
          {AFTER_DEATH_STEPS.map((step) => (
            <View key={step.num} style={styles.stepCard}>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.num}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={[styles.fullGuideBtn, { backgroundColor: '#F59E0B' }]} onPress={() => setView('chat')}>
            <Text style={styles.fullGuideBtnText}>اسأليني عن أي خطوة</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  if (view === 'rights') {
    return (
      <View style={styles.container}>
        <View style={[styles.subHeader, { backgroundColor: '#10B981' }]}>
          <TouchableOpacity onPress={() => setView('menu')} style={styles.backBtn2}>
            <ChevronLeft color={Colors.white} size={22} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>الحقوق والملكية</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCardTop, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.infoCardEmoji}>⚖️</Text>
            <Text style={[styles.infoCardTitle, { color: '#065F46' }]}>حقوقكِ القانونية</Text>
            <Text style={[styles.infoCardDesc, { color: '#047857' }]}>تعرفي على كامل حقوقكِ القانونية والمالية</Text>
          </View>
          {RIGHTS_INFO.map((right, i) => (
            <View key={i} style={styles.rightCard}>
              <View style={styles.rightContent}>
                <Text style={styles.rightTitle}>{right.title}</Text>
                <Text style={styles.rightDesc}>{right.desc}</Text>
              </View>
              <Text style={styles.rightEmoji}>{right.icon}</Text>
            </View>
          ))}
          <TouchableOpacity style={[styles.fullGuideBtn, { backgroundColor: '#10B981' }]} onPress={() => setView('chat')}>
            <Text style={styles.fullGuideBtnText}>استشيري مساعدتكِ القانونية</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  if (view === 'profile') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0891B2', '#0E7490']} style={[styles.subHeader, { paddingBottom: 40 }]}>
          <TouchableOpacity onPress={() => setView('menu')} style={styles.backBtn2}>
            <ChevronLeft color={Colors.white} size={22} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>الملف الشخصي</Text>
        </LinearGradient>
        <View style={styles.profileAvatarSection}>
          <View style={styles.profileAvatar}>
            <User color={Colors.white} size={40} />
          </View>
          <Text style={styles.profileName}>{profile?.full_name || 'المستخدمة'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
          {[
            { label: 'الاسم الكامل', value: profile?.full_name || '—' },
            { label: 'البريد الإلكتروني', value: profile?.email || '—' },
            { label: 'رقم الهاتف', value: profile?.phone || '—' },
          ].map((field, i) => (
            <View key={i} style={styles.profileField}>
              <Text style={styles.profileFieldValue}>{field.value}</Text>
              <Text style={styles.profileFieldLabel}>{field.label}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut color={Colors.error} size={20} />
            <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  menuHeader: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  menuHeaderTitle: { fontSize: 26, fontWeight: '700', color: Colors.white, textAlign: 'right', marginBottom: 4 },
  menuHeaderSub: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  menuList: { padding: 16 },
  menuItem: {
    flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  menuItemIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
  menuItemInfo: { flex: 1, alignItems: 'flex-end', marginRight: 2 },
  menuItemTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  menuItemSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  logoutItem: { borderWidth: 1.5, borderColor: Colors.error + '30', backgroundColor: Colors.errorLight + '60' },
  logoutText: { flex: 1, textAlign: 'right', fontSize: 16, fontWeight: '700', color: Colors.error },
  chatHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.primary,
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  chatHeaderInfo: { flex: 1, alignItems: 'flex-end', marginHorizontal: 12 },
  chatHeaderTitle: { fontSize: 17, fontWeight: '700', color: Colors.white },
  chatHeaderSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  chatAvatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  chatWelcome: { padding: 20, alignItems: 'flex-end' },
  chatWelcomeTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right', marginBottom: 6 },
  chatWelcomeSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'right', marginBottom: 16 },
  quickBtns: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  quickBtn: { backgroundColor: Colors.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  quickBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  chatMessages: { padding: 16, paddingBottom: 24 },
  msgBubble: { flexDirection: 'row-reverse', marginBottom: 12, alignItems: 'flex-end' },
  userBubble: { justifyContent: 'flex-start' },
  assistantBubble: { justifyContent: 'flex-end' },
  assistantAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  msgContent: { maxWidth: '78%', borderRadius: 18, padding: 12 },
  userContent: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  assistantContent: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: Colors.white, textAlign: 'right' },
  assistantText: { color: Colors.textPrimary, textAlign: 'right' },
  chatInput: {
    flexDirection: 'row-reverse', alignItems: 'flex-end', padding: 12,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  chatTextInput: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.textPrimary, maxHeight: 120 },
  subHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.primary,
    paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16,
  },
  backBtn2: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  subHeaderTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: Colors.white, textAlign: 'right' },
  content: { padding: 16 },
  infoCardTop: { borderRadius: 20, padding: 20, alignItems: 'flex-end', marginBottom: 16 },
  infoCardEmoji: { fontSize: 36, marginBottom: 8 },
  infoCardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  infoCardDesc: { fontSize: 14, lineHeight: 22, textAlign: 'right' },
  stepCard: {
    flexDirection: 'row-reverse', backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, alignItems: 'flex-start',
  },
  stepNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
  stepNumText: { fontSize: 16, fontWeight: '700', color: Colors.accent },
  stepInfo: { flex: 1, alignItems: 'flex-end' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  stepDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, textAlign: 'right' },
  fullGuideBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  fullGuideBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  rightCard: {
    flexDirection: 'row-reverse', backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, alignItems: 'flex-start',
  },
  rightEmoji: { fontSize: 28, marginLeft: 14 },
  rightContent: { flex: 1, alignItems: 'flex-end' },
  rightTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  rightDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, textAlign: 'right' },
  moodCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  moodTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right', marginBottom: 16 },
  moodRow: { flexDirection: 'row-reverse', justifyContent: 'space-around' },
  moodBtn: { alignItems: 'center', padding: 8, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  moodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  moodLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },
  journalCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  journalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right', marginBottom: 4 },
  journalSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'right', marginBottom: 12 },
  journalInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 14,
    fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.neutral50,
    minHeight: 100, textAlignVertical: 'top', marginBottom: 16,
  },
  saveJournalBtn: { backgroundColor: Colors.secondary, borderRadius: 14, padding: 14, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveJournalBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  psychTipsCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  psychTipsTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right', marginBottom: 16 },
  psychTip: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 14 },
  psychTipNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  psychTipNumText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  psychTipContent: { flex: 1, alignItems: 'flex-end' },
  psychTipTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  psychTipDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, textAlign: 'right' },
  profileAvatarSection: { alignItems: 'center', marginTop: -40, marginBottom: 16, zIndex: 1 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: Colors.white },
  profileName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: 12 },
  profileEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  profileContent: { paddingHorizontal: 16 },
  profileField: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 10, alignItems: 'flex-end', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  profileFieldLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4, fontWeight: '600' },
  profileFieldValue: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  logoutBtn: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.errorLight, borderRadius: 14, padding: 16, gap: 10, marginTop: 8 },
  logoutBtnText: { fontSize: 16, fontWeight: '700', color: Colors.error },
});
