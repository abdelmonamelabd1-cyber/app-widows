import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { User, Lock, LogOut, Mail, Eye, EyeOff, Info, Heart, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setIsLoggedIn(true);
        setUserEmail(data.session.user.email || '');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      (() => {
        if (session?.user) {
          setIsLoggedIn(true);
          setUserEmail(session.user.email || '');
        } else {
          setIsLoggedIn(false);
          setUserEmail('');
        }
      })();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError('من فضلك أدخلي البريد الإلكتروني وكلمة السر');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        Alert.alert('تم التسجيل', 'تم إنشاء حسابك بنجاح!');
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ، حاولي مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2D6A4F', '#1B4332']} style={styles.header}>
        <Text style={styles.headerTitle}>الإعدادات</Text>
        {isLoggedIn && (
          <Text style={styles.userEmailText}>{userEmail}</Text>
        )}
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          <View style={styles.authCard}>
            <View style={styles.authHeader}>
              <User color="#2D6A4F" size={40} strokeWidth={1.5} />
              <Text style={styles.authTitle}>
                {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
              </Text>
              <Text style={styles.authSubtitle}>
                {isLogin
                  ? 'سجلي دخولك لحفظ بياناتك على السحابة'
                  : 'أنشئي حساباً للوصول لبياناتك من أي جهاز'}
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
            <View style={styles.inputContainer}>
              <Mail color="#8A8A8A" size={18} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="example@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            <Text style={styles.fieldLabel}>كلمة السر</Text>
            <View style={styles.inputContainer}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff color="#8A8A8A" size={18} strokeWidth={2} />
                ) : (
                  <Eye color="#8A8A8A" size={18} strokeWidth={2} />
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="أدخلي كلمة السر"
                secureTextEntry={!showPassword}
                textAlign="right"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            <TouchableOpacity
              style={[styles.authBtn, loading && styles.authBtnDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.authBtnText}>
                {loading ? 'جاري...' : isLogin ? 'دخول' : 'إنشاء حساب'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchAuth}
              onPress={() => { setIsLogin(!isLogin); setError(''); }}
            >
              <Text style={styles.switchAuthText}>
                {isLogin ? 'مش عندك حساب؟ سجلي جديد' : 'عندك حساب؟ ادخلي'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <User color="#2D6A4F" size={36} strokeWidth={1.5} />
            </View>
            <Text style={styles.profileEmail}>{userEmail}</Text>
            <View style={styles.profileBadge}>
              <Shield color="#2D6A4F" size={14} strokeWidth={2} />
              <Text style={styles.profileBadgeText}>حساب محمي ومشفر</Text>
            </View>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <LogOut color="#CC5555" size={18} strokeWidth={2} />
              <Text style={styles.signOutText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* About section */}
        <View style={styles.aboutCard}>
          <View style={styles.aboutHeader}>
            <Heart color="#B55A7A" size={22} strokeWidth={2} fill="#B55A7A" />
            <Text style={styles.aboutTitle}>عن التطبيق</Text>
          </View>
          <Text style={styles.aboutText}>
            تطبيق "محاسبة القرار" صُمِّم خصيصاً لمساعدة الأرامل في تنظيم حياتهن القانونية والمالية، وتوفير الدعم العاطفي والقانوني عبر المساعدة الذكية "نور".
          </Text>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>المطور</Text>
            <Text style={styles.aboutValue}>Abdelmonem</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>التواصل</Text>
            <Text style={styles.aboutValue}>abdelmonamelabd1@gmail.com</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>الإصدار</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
        </View>

        <View style={styles.offlineNote}>
          <Info color="#3A6EA5" size={16} strokeWidth={2} />
          <Text style={styles.offlineNoteText}>
            المستندات والمصاريف والمواعيد تعمل بدون إنترنت. محادثة نور تحتاج اتصال بالإنترنت.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'right' },
  userEmailText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'right', marginTop: 4 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  authHeader: { alignItems: 'center', marginBottom: 24, gap: 8 },
  authTitle: { fontSize: 20, fontWeight: '700', color: '#2C2C2C' },
  authSubtitle: { fontSize: 13, color: '#8A8A8A', textAlign: 'center', lineHeight: 20 },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#CC5555',
  },
  errorText: { color: '#CC5555', fontSize: 13, textAlign: 'right' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#4A4A4A', textAlign: 'right', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F0EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E0D8',
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: '#2C2C2C', paddingVertical: 13 },
  authBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  authBtnDisabled: { opacity: 0.6 },
  authBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  switchAuth: { alignItems: 'center', marginTop: 16 },
  switchAuthText: { color: '#2D6A4F', fontSize: 14, fontWeight: '600' },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    gap: 12,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF9F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmail: { fontSize: 16, fontWeight: '600', color: '#2C2C2C' },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF9F4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  profileBadgeText: { fontSize: 12, color: '#2D6A4F', fontWeight: '500' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#CC5555',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  signOutText: { color: '#CC5555', fontSize: 15, fontWeight: '600' },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, justifyContent: 'flex-end' },
  aboutTitle: { fontSize: 16, fontWeight: '700', color: '#2C2C2C' },
  aboutText: { fontSize: 13, color: '#5A5A5A', textAlign: 'right', lineHeight: 22, marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#F0EBE5', marginBottom: 12 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  aboutLabel: { fontSize: 13, color: '#8A8A8A' },
  aboutValue: { fontSize: 13, color: '#2C2C2C', fontWeight: '500' },
  offlineNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  offlineNoteText: { flex: 1, fontSize: 12, color: '#3A6EA5', textAlign: 'right', lineHeight: 18 },
});
