import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../theme/ThemeProvider';
import aiService from '../services/aiService';
import { useI18n } from '../i18n/i18nProvider';

/* ---------- Tipler ---------- */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  language?: string;
  timestamp: Date;
}

interface ParsedAiResponse {
  message: string;
  code?: string;
  language?: string;
}

/* ---------- Ana Bileşen ---------- */
export const AiChatScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const { language } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  /* "typing…" animasyonu için üç nokta */
  const dots = [0, 1, 2].map(() => useRef(new Animated.Value(0)).current);

  /* JSON yanıtını parse et */
  const parseAiResponse = (response: string): ParsedAiResponse => {
    try {
      // JSON formatında gelen yanıtı parse et
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const parsed = JSON.parse(jsonStr);
        return {
          message: parsed.message || response,
          code: parsed.code || undefined,
          language: parsed.language || undefined,
        };
      }

      // Ham JSON objesi (Gemini sıkça fence'siz döner)
      const trimmed = response.trim();
      if (trimmed.startsWith('{') && trimmed.includes('"message"')) {
        const parsed = JSON.parse(trimmed);
        return {
          message: parsed.message || response,
          code: parsed.code || undefined,
          language: parsed.language || undefined,
        };
      }
      
      // Eğer JSON formatında değilse, direkt string olarak döndür
      return { message: response };
    } catch (error) {
      console.error('JSON parse error:', error);
      return { message: response };
    }
  };

  /* Markdown metni render et */
  const renderMarkdownText = (text: string) => {
    if (!text) return null;

    // Satırları böl
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Boş satır
      if (trimmedLine === '') {
        return <View key={index} style={styles.emptyLine} />;
      }
      
      // Liste öğesi (* ile başlayan)
      if (trimmedLine.startsWith('* ')) {
        const content = trimmedLine.substring(2);
        return (
          <View key={index} style={styles.listItem}>
            <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
            <Text style={[styles.text, { color: colors.text }]}>{content}</Text>
          </View>
        );
      }
      
      // Bold text (**text**)
      if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split('**');
        return (
          <Text key={index} style={[styles.text, { color: colors.text }]}>
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? (
                <Text key={partIndex} style={[styles.text, styles.boldText, { color: colors.primary }]}>
                  {part}
                </Text>
              ) : (
                <Text key={partIndex}>{part}</Text>
              )
            )}
          </Text>
        );
      }
      
      // Normal text
      return (
        <Text key={index} style={[styles.text, { color: colors.text }]}>
          {line}
        </Text>
      );
    });
  };

  /* Kod bloğunu kopyala */
  const copyCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert('Başarılı', 'Kod panoya kopyalandı!');
    } catch (error) {
      Alert.alert('Hata', 'Kod kopyalanamadı.');
    }
  };

  /* ilk açılışta welcome */
  useEffect(() => {
    const load = async () => {
      try {
        if (typeof localStorage !== 'undefined') {
          if (localStorage.getItem('screenshot_skip_welcome') === '1') {
            localStorage.removeItem('screenshot_skip_welcome');
            return;
          }
          // transcript hydrate may still be pending in the other effect
          if (localStorage.getItem('screenshot_chat_transcript')) {
            return;
          }
        }
        const res = await aiService.getWelcomeMessage(language);
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: res.message || 'Merhaba! Ben Chead, size nasıl yardımcı olabilirim?',
          timestamp: new Date(),
        }]);
      } catch {
        // sessiz geç
      }
    };
    load();
  }, [language]);

  /* typing animasyonu */
  useEffect(() => {
    if (!loading) return;
    const seq = Animated.loop(
      Animated.stagger(200, dots.map(dot =>
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      )),
    );
    seq.start();
    return () => seq.stop();
  }, [loading]);

  /* mesaj gönder */
  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.sendMessage(trimmed, language);
      const parsedResponse = parseAiResponse(res.response);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: parsedResponse.message,
        code: parsedResponse.code,
        language: parsedResponse.language,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: 'err' + Date.now(),
        role: 'assistant',
        content: 'Bir hata oluştu, tekrar dener misin?',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Portfolio screenshot helper: hydrate multi-turn OR auto-ask once
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;

    const transcriptRaw = localStorage.getItem('screenshot_chat_transcript');
    if (transcriptRaw) {
      localStorage.removeItem('screenshot_chat_transcript');
      try {
        const turns = JSON.parse(transcriptRaw) as Array<{
          role: 'user' | 'assistant';
          content: string;
          code?: string;
          language?: string;
        }>;
        if (Array.isArray(turns) && turns.length) {
          setMessages(
            turns.map((t, i) => ({
              id: `ss-${i}-${Date.now()}`,
              role: t.role,
              content: t.content,
              code: t.code,
              language: t.language,
              timestamp: new Date(),
            })),
          );
        }
      } catch {
        /* ignore bad transcript */
      }
      return;
    }

    const flag = localStorage.getItem('screenshot_auto_chat');
    if (flag !== '1') return;
    localStorage.removeItem('screenshot_auto_chat');
    const q = 'C++ pointer nedir kisaca acikla';
    const canned = localStorage.getItem('screenshot_gemini_response');
    if (canned) localStorage.removeItem('screenshot_gemini_response');
    const t = setTimeout(() => {
      (async () => {
        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: q,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        try {
          const raw = canned || (await aiService.sendMessage(q, language)).response;
          const parsedResponse = parseAiResponse(typeof raw === 'string' ? raw : String(raw));
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: parsedResponse.message,
            code: parsedResponse.code,
            language: parsedResponse.language,
            timestamp: new Date(),
          }]);
        } catch {
          setMessages(prev => [...prev, {
            id: 'err' + Date.now(),
            role: 'assistant',
            content: 'Bir hata oluştu, tekrar dener misin?',
            timestamp: new Date(),
          }]);
        } finally {
          setLoading(false);
        }
      })();
    }, 800);
    return () => clearTimeout(t);
  }, []);


  /* Scroll to bottom */
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  /* Kod bloğu render */
  const renderCodeBlock = (code: string, language?: string) => (
    <View style={[styles.codeBlock, { 
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.border 
    }]}>
      <View style={[styles.codeHeader, { 
        backgroundColor: colors.surfaceTertiary,
        borderBottomColor: colors.border 
      }]}>
        <Text style={[styles.codeLanguage, { color: colors.primary }]}>
          {language?.toUpperCase() || 'CODE'}
        </Text>
        <TouchableOpacity 
          style={styles.copyButton} 
          onPress={() => copyCode(code)}
        >
          <Ionicons name="copy-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={[styles.codeText, { color: colors.text }]}>{code}</Text>
      </ScrollView>
    </View>
  );

  /* --- JSX --- */
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient 
        colors={colors.primaryGradient} 
        style={styles.header}
      >
        <Ionicons name="code-slash" size={24} color={colors.textOnPrimary} />
        <Text style={[styles.title, { color: colors.textOnPrimary }]}>Chead Chat</Text>
      </LinearGradient>

      {/* Mesaj listesi */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.chatPad}
        >
          {messages.map(m => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.role === 'user' ? 
                  [styles.userBubble, { backgroundColor: colors.primary }] : 
                  [styles.aiBubble, { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border 
                  }],
              ]}
            >
              {/* Markdown metni render et */}
              <View style={styles.messageContent}>
                {renderMarkdownText(m.content)}
              </View>
              
              {/* Kod bloğu varsa göster */}
              {m.code && renderCodeBlock(m.code, m.language)}
            </View>
          ))}

          {/* typing gösterge */}
          {loading && (
            <View style={[styles.bubble, styles.aiBubble, styles.typing, { 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }]}>
              {dots.map((dot, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    { 
                      opacity: dot,
                      backgroundColor: colors.primary 
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Giriş alanı */}
        <View style={[styles.inputRow, { 
          borderTopColor: colors.border,
          backgroundColor: colors.surface 
        }]}>
          <TextInput
            style={[styles.input, { 
              color: colors.text,
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border 
            }]}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.send, { backgroundColor: colors.primary }]} 
            onPress={send}
          >
            {loading
              ? <ActivityIndicator color={colors.textOnPrimary} />
              : <Ionicons name="arrow-up" size={22} color={colors.textOnPrimary} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ---------- Stil ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center',
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  flex: { flex: 1 },
  chatPad: { padding: 16 },
  bubble: { 
    marginVertical: 6, 
    maxWidth: '85%', 
    padding: 14, 
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  userBubble: { 
    alignSelf: 'flex-end',
  },
  aiBubble: { 
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  messageContent: {
    flexDirection: 'column',
  },
  text: { 
    fontSize: 15, 
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  emptyLine: {
    height: 8,
  },
  
  // Kod bloğu stilleri
  codeBlock: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  codeLanguage: {
    fontSize: 12,
    fontWeight: '600',
  },
  copyButton: {
    padding: 4,
  },
  codeText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding: 12,
    lineHeight: 18,
  },
  
  inputRow: { 
    flexDirection: 'row', 
    padding: 12, 
    borderTopWidth: 1,
  },
  input: {
    flex: 1, 
    height: 110,
    paddingHorizontal: 14,
    borderRadius: 20,
    fontSize: 15,
    borderWidth: 1,
  },
  send: { 
    width: 46, 
    height: 46, 
    marginLeft: 8, 
    borderRadius: 23,
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  typing: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    marginHorizontal: 2 
  },
});
