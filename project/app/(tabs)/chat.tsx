import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Send, MessageCircle, Sparkles, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const NOOR_INTRO = `أهلاً حبيبتي، أنا نور 💛

أنا هنا معكِ في كل خطوة. سواء محتاجة تتكلمي، أو عندك سؤال قانوني، أو محتاجة مساعدة في أي حاجة بعد وفاة زوجك...

أنا هنا. إيه اللي تعبك النهارده؟`;

const NOOR_SYSTEM_PROMPT = `أنت "نور" - مساعدة ذكية متخصصة في دعم الأرامل. شخصيتك:
- دافئة ومتعاطفة جداً، تتحدثين بالعامية المصرية
- تستخدمين عبارات مثل "حبيبتي"، "يا قلبي"، "أنا جنبك"
- متخصصة في القانون المصري: الإرث، النفقة، الحضانة، المستندات الرسمية
- تطرحين أسئلة متابعة لتفهمي الوضع بشكل أعمق
- تقدمين خطوات عملية وواضحة
- عندما تشعرين أن الموضوع يحتاج محامي حقيقي، تقولين ذلك بلطف
- لا تعطين معلومات قانونية خاطئة - إن لم تكوني متأكدة قولي ذلك بصدق

الرد دائماً بالعربية.`;

const generateId = () => Math.random().toString(36).substr(2, 9);

const NOOR_RESPONSES: Record<string, string> = {
  'مخنوقة': `يا قلبي، أنا فاهمة تماماً إحساسك ده. الضغط بيكون صعب جداً في الفترة دي.\n\nخليني أكون جنبك. إيه اللي بيأثر عليكِ أكتر دلوقتي؟ هل هي ضغوط قانونية وأوراق؟ ولا ضغط مالي؟ ولا إحساس بالوحدة؟\n\nكلميني حبيبتي، أنا هنا.`,
  'إرث': `حبيبتي، الإرث من أهم الحقوق اللي لازم تعرفيها. \n\n🟡 حقك في الإرث:\n• لو مفيش أولاد: ربع التركة\n• لو في أولاد: الثمن\n\nأول خطوة هي رفع دعوى "حصر إرث" في محكمة الأحوال الشخصية.\n\nعندك شهادة الوفاة؟ وهل الورثة التانيين متعاونين معاكِ؟`,
  'حضانة': `يا قلبي، حق الحضانة من أقدس الحقوق اللي ربنا كفلهولك.\n\n⭐ كأم، الحضانة الفعلية للأطفال إيدك تلقائياً.\n\nبس لازم تثبتي ده قانونياً عشان تكوني محمية:\n1. تقديم طلب إثبات حضانة في محكمة الأسرة\n2. معاكِ شهادة وفاة الأب\n3. الطلب بيتم بدون رسوم كبيرة\n\nعمر الأطفال كام؟ عشان أوضحلك الخطوات الصح.`,
  'نفقة': `حبيبتي، النفقة حقك الشرعي والقانوني.\n\n💛 اللي لازم تعرفيه:\n• نفقة أطفالك تيجي من تركة أبوهم\n• نفقة عدتك (4 شهور و10 أيام) واجبة\n• المسكن حقك طول فترة العدة\n\nروحي محكمة الأسرة وقولي: "عايزة أطلب نفقة للأطفال من التركة"\n\nكان زوجك بياخد معاش أو مرتب؟ عشان نحدد من فين نطلب النفقة.`,
};

const getFallbackResponse = (message: string): string => {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(NOOR_RESPONSES)) {
    if (lower.includes(key) || message.includes(key)) return response;
  }

  if (message.includes('وفاة') || message.includes('مات')) {
    return `يا قلبي، أنا حاسة بثقل اللي بتمري بيه.\n\nفي الأول، خليني أقولك إنك قوية جداً إنك بتحاولي تعدي المرحلة دي.\n\nإيه أكتر حاجة محتاجة مساعدة فيها دلوقتي؟ الأوراق الرسمية؟ أم الوضع المالي؟ أم عندك سؤال محدد؟`;
  }

  if (message.includes('شكرا') || message.includes('شكراً')) {
    return `يسعدني دايماً أقدر أساعدك حبيبتي 💛\n\nأنا هنا في أي وقت. متترددیش تسأليني في أي حاجة.`;
  }

  return `أنا معاكِ وبسمعك حبيبتي 💛\n\nعشان أقدر أساعدك صح، ممكن تحكيلي أكتر؟ إيه الوضع اللي بتواجهيه دلوقتي بالتحديد؟\n\nأنا هنا أساعدك سواء في الأوراق القانونية، أو الإرث، أو الحضانة، أو أي حاجة تانية.`;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: NOOR_INTRO,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    scrollToBottom();

    // Try to call the AI edge function, fall back to local responses
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/noor-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || anonKey}`,
          'Apikey': anonKey || '',
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.reply || getFallbackResponse(text),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('API error');
      }
    } catch {
      const fallback = getFallbackResponse(text);
      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'intro',
        role: 'assistant',
        content: NOOR_INTRO,
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#B55A7A', '#8B3A5A']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={clearChat} style={styles.headerAction}>
            <RefreshCw color="rgba(255,255,255,0.8)" size={18} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.noorAvatar}>
              <Sparkles color="#FFFFFF" size={20} strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.noorName}>نور</Text>
              <Text style={styles.noorStatus}>مساعدتك القانونية والعاطفية</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.noorAvatarSmall}>
                  <Sparkles color="#FFFFFF" size={12} strokeWidth={2} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                  ]}
                >
                  {msg.content}
                </Text>
                <Text
                  style={[
                    styles.bubbleTime,
                    msg.role === 'user' ? styles.bubbleTimeUser : styles.bubbleTimeAssistant,
                  ]}
                >
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageRow, styles.messageRowAssistant]}>
              <View style={styles.noorAvatarSmall}>
                <Sparkles color="#FFFFFF" size={12} strokeWidth={2} />
              </View>
              <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <ActivityIndicator size="small" color="#B55A7A" />
                  <Text style={styles.typingText}>نور بتكتب...</Text>
                </View>
              </View>
            </View>
          )}
          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Send color="#FFFFFF" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="اكتبي رسالتك لنور..."
            placeholderTextColor="#AAAAAA"
            multiline
            maxLength={1000}
            textAlign="right"
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAction: { padding: 8 },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noorName: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', textAlign: 'right' },
  noorStatus: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  keyboardView: { flex: 1 },
  messagesList: { flex: 1 },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowUser: { justifyContent: 'flex-start' },
  messageRowAssistant: { justifyContent: 'flex-end' },
  noorAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#B55A7A',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    backgroundColor: '#2D6A4F',
    borderBottomLeftRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderBottomRightRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  bubbleTextUser: { color: '#FFFFFF' },
  bubbleTextAssistant: { color: '#2C2C2C' },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'left',
  },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.65)' },
  bubbleTimeAssistant: { color: '#AAAAAA' },
  typingBubble: { paddingVertical: 10 },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13, color: '#B55A7A' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D8',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F0EB',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#2C2C2C',
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#B55A7A',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: '#DDD' },
});
