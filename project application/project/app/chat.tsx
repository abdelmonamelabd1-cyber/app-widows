import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';
import {
  ChevronLeft,
  Send,
  Scale,
  MessageCircle,
  Shield,
  Heart,
  FileText,
  DollarSign,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Message = { role: 'user' | 'assistant'; content: string };

const QUICK_QUESTIONS = [
  'إيه حقوقي في الميراث؟',
  'أريد رفع دعوى نفقة',
  'مش عارفة أعمل إيه',
  'إجراءات بعد الوفاة',
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingHistory(false); return; }

    const { data } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(40);

    if (data && data.length > 0) {
      setMessages(data.map((d: { role: string; content: string }) => ({
        role: d.role as 'user' | 'assistant',
        content: d.content,
      })));
    }
    setLoadingHistory(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
  };

  const handleSend = async (text?: string) => {
    const msg = (text || inputText).trim();
    if (!msg || loading) return;
    setInputText('');

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: msg, history: messages.slice(-10) }),
      });

      const data = await response.json();

      if (data.content) {
        setMessages([...newMessages, { role: 'assistant', content: data.content }]);
      } else if (data.error) {
        setMessages([...newMessages, { role: 'assistant', content: 'حصلت مشكلة تقنية، حاولي تاني يا حبيبتي 💜' }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'مش قادرة أوصل للسيرفر دلوقتي، حاولي بعد كده 💜' }]);
    }

    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <LinearGradient colors={['#0891B2', '#0E7490']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>نور — مساعدتكِ</Text>
          <Text style={styles.headerSub}>استشارات قانونية ودعم نفسي</Text>
        </View>
        <View style={styles.avatarCircle}>
          <MessageCircle color={Colors.white} size={22} />
        </View>
      </LinearGradient>

      {/* Welcome / Quick questions */}
      {messages.length === 0 && !loadingHistory && (
        <View style={styles.welcome}>
          <View style={styles.welcomeIconCircle}>
            <Scale color={Colors.primary} size={36} />
          </View>
          <Text style={styles.welcomeTitle}>أنا هنا علشان أسمعكِ وأساعدكِ</Text>
          <Text style={styles.welcomeSub}>إيه أكثر حاجة مضايقاكِ النهارده؟</Text>

          <Text style={styles.quickLabel}>أسئلة شائعة:</Text>
          <View style={styles.quickBtns}>
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => handleSend(q)}>
                <Text style={styles.quickBtnText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.topicsRow}>
            <View style={styles.topicChip}>
              <Shield color={Colors.primary} size={14} />
              <Text style={styles.topicText}>ميراث ونفقة</Text>
            </View>
            <View style={styles.topicChip}>
              <Heart color="#EC4899" size={14} />
              <Text style={styles.topicText}>دعم نفسي</Text>
            </View>
            <View style={styles.topicChip}>
              <FileText color="#F59E0B" size={14} />
              <Text style={styles.topicText}>مستندات</Text>
            </View>
            <View style={styles.topicChip}>
              <DollarSign color="#10B981" size={14} />
              <Text style={styles.topicText}>مصاريف</Text>
            </View>
          </View>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      >
        {loadingHistory && (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        )}
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[styles.msgBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.assistantAvatar}>
                <MessageCircle color={Colors.white} size={14} />
              </View>
            )}
            <View style={[styles.msgContent, msg.role === 'user' ? styles.userContent : styles.assistantContent]}>
              <Text style={[styles.msgText, msg.role === 'user' ? styles.userMsgText : styles.assistantMsgText]}>
                {msg.content}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={[styles.msgBubble, styles.assistantBubble]}>
            <View style={styles.assistantAvatar}>
              <MessageCircle color={Colors.white} size={14} />
            </View>
            <View style={[styles.msgContent, styles.assistantContent]}>
              <ActivityIndicator color={Colors.primary} size="small" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || loading}
        >
          <Send color={Colors.white} size={18} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="اكتبي رسالتكِ..."
          textAlign="right"
          multiline
          placeholderTextColor={Colors.textMuted}
          onSubmitEditing={() => handleSend()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, alignItems: 'flex-end', marginHorizontal: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 10,
  },
  quickBtns: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  quickBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  topicsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  topicChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.white,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  topicText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  messagesList: { padding: 16, paddingBottom: 24 },
  msgBubble: { flexDirection: 'row-reverse', marginBottom: 12, alignItems: 'flex-end' },
  userBubble: { justifyContent: 'flex-start' },
  assistantBubble: { justifyContent: 'flex-end' },
  assistantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  msgContent: { maxWidth: '78%', borderRadius: 18, padding: 12 },
  userContent: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  assistantContent: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  msgText: { fontSize: 15, lineHeight: 24 },
  userMsgText: { color: Colors.white, textAlign: 'right' },
  assistantMsgText: { color: Colors.textPrimary, textAlign: 'right' },
  inputBar: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 120,
  },
});
