import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { quizApi, quizEngApi } from '../services/api';
import { QuizQuestion, QuizProgress } from '../types/quiz';

/* ----------- Lottie (native) / fallback (web) ----------- */
let LottieView: any = null;
if (Platform.OS !== 'web') {
  LottieView = require('lottie-react-native').default;
}

/* ----------- helpers ----------- */
const { width: WW } = Dimensions.get('window');
const CARD_MAX_WIDTH = 640;
const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

/* ---------------------- Chedad ---------------------- */
const ChedadMascot = ({
  happy,
  visible,
}: {
  happy: boolean;
  visible: boolean;
}) => {
  const anim = useRef<any>(null);

  useEffect(() => {
    if (visible && anim.current) {
      anim.current.reset();
      anim.current.play();
    }
  }, [visible, happy]);

  if (!visible) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webMascotBox}>
        <View
          style={[
            styles.webMascotCircle,
            { backgroundColor: happy ? '#FFD700' : '#FF6B6B' },
          ]}
        >
          <Ionicons name={happy ? 'happy' : 'sad'} size={40} color="white" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ width: 120, height: 120, alignSelf: 'center' }}>
      <LottieView
        ref={anim}
        source={
          happy
            ? require('../assets/chedad/wink.json')
            : require('../assets/chedad/shake.json')
        }
        loop={false}
      />
    </View>
  );
};
/* ---------------------------------------------------- */

const DuolingoQuizScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { quizId, language } = route.params;
  const { colors } = useTheme();
  const { language: i18nLanguage } = useI18n();
  const { width, height } = useWindowDimensions();
  
  // Dil seçimine göre API seç
  const quizApiToUse = (language || i18nLanguage) === 'en' ? quizEngApi : quizApi;

  /* --------------- state --------------- */
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [matchingSel, setMatchingSel] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);

  /* --------------- anim --------------- */
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  /* --------------- helpers --------------- */
  const q = useMemo(() => questions[current], [questions, current]);
  const checkInput = useCallback(
    (i: string | number, a: string | number) =>
      String(i).trim().toLowerCase() === String(a).trim().toLowerCase(),
    []
  );

  const getIcon = (type: string) => {
    const map = {
      'multiple-choice': 'help-circle',
      matching: 'git-compare',
      'fill-in-the-blank': 'create',
      'code-completion': 'code-slash',
      'output-prediction': 'terminal',
    } as any;
    return (
      <Ionicons
        name={map[type] ?? 'help'}
        size={28}
        color={{
          'multiple-choice': colors.primary,
          matching: colors.accent,
          'fill-in-the-blank': colors.warning,
          'code-completion': colors.success,
          'output-prediction': colors.info,
        }[type] || colors.text}
      />
    );
  };

  /* --------------- effects --------------- */
  useEffect(() => {
    (async () => {
      try {
        await quizApiToUse.startQuiz(quizId);
        setStartTime(Date.now());
        const res = await quizApiToUse.getQuizById(quizId);
        setQuestions(res.data.questions ?? []);
      } catch (e) {
        Alert.alert('Hata', 'Quiz yüklenemedi.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId, quizApiToUse]);

  useEffect(() => {
    answered
      ? Animated.spring(feedbackAnim, {
        toValue: 1,
          useNativeDriver: true,
          friction: 6,
        }).start()
      : feedbackAnim.setValue(0);
  }, [answered]);

  useEffect(() => {
    if (q?.type === 'matching' && q.pairs)
      setMatchingSel(Array(q.pairs.length).fill(''));
  }, [q?.type]);

  /* --------------- submit --------------- */
  const submit = async (
    isCorrect: boolean,
    questionId: string,
    userAnswer: string | number
  ) => {
    if (answered) return;

    try {
      setAnswered(true);
      setIsAnswerCorrect(isCorrect);

      if (isCorrect) {
        setScore((s) => s + 1);
        setStreak((s) => s + 1);
        setTotalXP((xp) => xp + 10);
      } else {
        setStreak(0);
        setHearts((h) => h - 1);
      }

      setTimeout(async () => {
        setUserInput('');
        setStartTime(Date.now());

        if (current + 1 >= questions.length) {
          // Quiz tamamlandı - badge kontrolü yap
          try {
            const result = await quizApiToUse.completeQuiz(quizId);
            
            // Badge bildirimi göster
            if (result.data?.newlyAwardedBadges && result.data.newlyAwardedBadges.length > 0) {
              const badgeNames = result.data.newlyAwardedBadges.join(', ');
              Alert.alert(
                '🎉 Yeni Rozet Kazandın!',
                `Tebrikler! Şu rozetleri kazandın: ${badgeNames}`,
                [
                  {
                    text: 'Rozetleri Görüntüle',
                    onPress: () => {
                      navigation.navigate('QuizStats' as never);
                    }
                  },
                  {
                    text: 'Devam Et',
                    style: 'cancel'
                  }
                ]
              );
            }
          } catch (error) {
            console.error('Quiz tamamlanırken hata:', error);
          }
          
          setShowResults(true);
        } else {
          setCurrent((c) => c + 1);
          setAnswered(false);
        }
      }, 1500);
    } catch {
      Alert.alert('Hata', 'Cevap gönderilemedi.');
    }
  };

  /* --------------- render guards --------------- */
  if (loading)
    return (
      <Centered colors={colors}>
        <Text style={{ color: colors.text }}>Quiz yükleniyor…</Text>
      </Centered>
    );
  if (!questions.length)
    return (
      <Centered colors={colors}>
        <Text style={{ color: colors.text }}>Quiz bulunamadı</Text>
      </Centered>
    );
  if (showResults)
    return (
      <Results
        colors={colors}
        score={score}
        total={questions.length}
        xp={totalXP}
        hearts={hearts}
        streak={streak}
        navigation={navigation}
        restart={() => {
          setShowResults(false);
          setCurrent(0);
          setScore(0);
          setStreak(0);
          setTotalXP(0);
          setHearts(5);
          setStartTime(Date.now());
        }}
      />
    );

  /* --------------- main ui --------------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ minHeight: '100%', paddingBottom: 40 }}
        >
          {/* progress */}
          <View style={styles.progressBg}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
              style={{
                width: `${((current + 1) / questions.length) * 100}%`,
                height: '100%',
              }}
          />
        </View>

          {/* card */}
          <LinearGradient
            colors={[colors.surface, colors.surfaceSecondary + 'CC']}
            style={{
              alignSelf: 'center',
              width: Math.min(width * 0.92, CARD_MAX_WIDTH),
              borderRadius: 24,
              padding: clamp(width * 0.06, 20, 32),
              marginTop: 20,
              shadowColor: colors.primary,
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 4,
              alignItems: 'center',
            }}
          >
            <ChedadMascot happy={isAnswerCorrect} visible={answered} />

            <View style={{ marginBottom: 8 }}>{getIcon(q.type)}</View>

            <Text
              style={{
                color: colors.primary,
                fontSize: clamp(width * 0.05, 18, 26),
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {q.question}
            </Text>

            {/* CODE */}
            {q.codeTemplate && (
              <View style={styles.codeBox(width)}>
                <Text
                  style={{
                    color: '#00FF00',
                    fontFamily: 'monospace',
                    fontSize: clamp(width * 0.04, 14, 20),
                  }}
                      >
                  {q.codeTemplate}
                </Text>
              </View>
            )}

            {/* ANSWER TYPES */}
            {q.type === 'multiple-choice' && (
              <MultipleChoice
                q={q}
                colors={colors}
                answered={answered}
                onSelect={(i) => submit(i === q.correctAnswer, q.id, i)}
              />
            )}

            {q.type === 'fill-in-the-blank' && (
              <TextInputBlock
                  placeholder="Cevabınızı yazın"
                  value={userInput}
                setValue={setUserInput}
                disabled={answered}
                colors={colors}
                onSubmit={() =>
                  submit(checkInput(userInput, q.correctAnswer), q.id, userInput)
                }
              />
            )}

            {q.type === 'code-completion' && (
              <TextInputBlock
                  placeholder="Eksik kodu yazın"
                  value={userInput}
                setValue={setUserInput}
                disabled={answered}
                colors={colors}
                mono
                onSubmit={() =>
                  submit(checkInput(userInput, q.correctAnswer), q.id, userInput)
                }
              />
            )}

            {q.type === 'output-prediction' && (
              <TextInputBlock
                  placeholder="Çıktıyı yazın"
                  value={userInput}
                setValue={setUserInput}
                disabled={answered}
                colors={colors}
                mono
                onSubmit={() =>
                  submit(checkInput(userInput, q.correctAnswer), q.id, userInput)
                }
              />
            )}

            {q.type === 'matching' && (
              <MatchingBlock
                q={q}
                selections={matchingSel}
                setSelections={setMatchingSel}
                answered={answered}
                colors={colors}
                onSubmit={(ok) =>
                  submit(ok, q.id, matchingSel.join(','))
                }
              />
            )}

            {/* Hint */}
            {!answered && q.hints?.length ? (
              <HintButton hints={q.hints} colors={colors} />
            ) : null}

            {/* feedback */}
            {answered && (
              <Animated.View
                style={[
                  styles.feedbackBox,
                  {
                    backgroundColor: isAnswerCorrect
                      ? colors.success + '30'
                      : colors.error + '30',
                    transform: [
                      {
                        scale: feedbackAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                    opacity: feedbackAnim,
                  },
                ]}
              >
                <Ionicons 
                  name={isAnswerCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={28} 
                  color={isAnswerCorrect ? colors.success : colors.error} 
                  style={{ marginRight: 10 }} 
                />
                <Text
                  style={{
                  color: isAnswerCorrect ? colors.success : colors.error, 
                    fontSize: 17,
                    fontWeight: 'bold',
                  }}
                >
                  {isAnswerCorrect
                    ? q.explanation || 'Doğru!'
                    : `Yanlış! Doğru: ${q.correctAnswer}`}
                </Text>
              </Animated.View>
            )}

            {/* counter */}
            <View style={[styles.counter, { backgroundColor: colors.accent }]}>
              <Text style={styles.counterTxt}>
                {current + 1} / {questions.length} soru
              </Text>
            </View>
          </LinearGradient>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* -------------------------------------------------------------------------- */
/*                               SUB COMPONENTS                               */
/* -------------------------------------------------------------------------- */

const Centered = ({ colors, children }) => (
  <View style={[styles.center, { backgroundColor: colors.background }]}>
    {children}
  </View>
);

const Results = ({
  colors,
  score,
  total,
  xp,
  hearts,
  streak,
  navigation,
  restart,
}) => (
  <View style={[styles.center, { backgroundColor: colors.background }]}>
    <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
    <LinearGradient
      colors={[colors.primary, colors.accent]}
      style={styles.headerGradient}
    >
      <Ionicons name="trophy" size={64} color="gold" style={{ marginBottom: 16 }} />
      <Text style={styles.resultTitle}>Harika!</Text>
      <Text style={styles.resultSub}>
        {score} / {total} doğru
      </Text>
      <View style={styles.statsRow}>
        <Ionicons name="flash" size={22} color="white" />
        <Text style={styles.statTxt}>{xp} XP</Text>
        <Ionicons name="heart" size={22} color="white" style={{ marginLeft: 16 }} />
        <Text style={styles.statTxt}>{hearts}</Text>
        <Ionicons name="flame" size={22} color="white" style={{ marginLeft: 16 }} />
        <Text style={styles.statTxt}>{streak}</Text>
      </View>
      <TouchableOpacity style={styles.cta} onPress={() => navigation.goBack()}>
        <Text style={styles.ctaTxt}>Öğrenme Yoluna Dön</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: colors.success, marginTop: 12 }]}
        onPress={restart}
      >
        <Text style={[styles.ctaTxt, { color: 'white' }]}>Tekrar Çöz</Text>
      </TouchableOpacity>
    </LinearGradient>
  </View>
);

const HintButton = ({ hints, colors }) => (
  <TouchableOpacity
    style={styles.hintBtn(colors)}
    onPress={() => Alert.alert('İpucu', hints.join('\n'))}
  >
    <Ionicons name="bulb" size={20} color={colors.info} />
    <Text style={{ color: colors.info, marginLeft: 8, fontWeight: '500' }}>
      İpucu Göster
    </Text>
  </TouchableOpacity>
);

const MultipleChoice = ({ q, colors, answered, onSelect }) => (
  <View style={{ width: '100%', gap: 12 }}>
    {q.options?.map((option, i) => (
      <TouchableOpacity
        key={i}
        style={[
          {
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 12,
            padding: 16,
            borderWidth: 2,
            borderColor: 'transparent',
          },
          answered && i === q.correctAnswer && {
            borderColor: colors.success,
            backgroundColor: colors.success + '20',
          },
          answered && i !== q.correctAnswer && {
            borderColor: colors.error,
            backgroundColor: colors.error + '20',
          },
        ]}
        onPress={() => !answered && onSelect(i)}
        disabled={answered}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          {option}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const TextInputBlock = ({ placeholder, value, setValue, disabled, colors, mono, onSubmit }) => (
  <View style={{ width: '100%', gap: 12 }}>
    <TextInput
      style={{
        backgroundColor: colors.surfaceSecondary,
        borderRadius: 12,
        padding: 16,
        color: colors.text,
        fontSize: 16,
        fontFamily: mono ? 'monospace' : undefined,
        borderWidth: 2,
        borderColor: 'transparent',
      }}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={setValue}
      editable={!disabled}
      onSubmitEditing={onSubmit}
    />
    <TouchableOpacity
      style={{
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
      }}
      onPress={onSubmit}
      disabled={disabled}
    >
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
        Gönder
      </Text>
    </TouchableOpacity>
  </View>
);

const MatchingBlock = ({ q, selections, setSelections, answered, colors, onSubmit }) => {
  const checkAnswer = () => {
    const isCorrect = selections.every((sel, i) => sel === q.pairs[i].right);
    onSubmit(isCorrect);
  };

  return (
    <View style={{ width: '100%', gap: 16 }}>
      {q.pairs?.map((pair, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 14 }}>{pair.left}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 14 }}>
              {selections[i] || 'Seçiniz'}
            </Text>
          </View>
        </View>
      ))}
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {q.pairs?.map((pair, i) => (
          <TouchableOpacity
            key={i}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 8,
              padding: 8,
              paddingHorizontal: 12,
            }}
            onPress={() => {
              const newSelections = [...selections];
              newSelections[i] = pair.right;
              setSelections(newSelections);
            }}
            disabled={answered}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>{pair.right}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={{
          backgroundColor: colors.primary,
          borderRadius: 12,
          padding: 16,
          alignItems: 'center',
        }}
        onPress={checkAnswer}
        disabled={answered || selections.some(s => !s)}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
          Kontrol Et
        </Text>
      </TouchableOpacity>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  progressBg: {
    height: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#ccc4',
    overflow: 'hidden',
  },

  codeBox: (w: number) => ({
    backgroundColor: '#181c24',
    borderRadius: 10,
    padding: clamp(w * 0.04, 14, 24),
    marginVertical: 12,
    width: '100%',
  }),

  feedbackBox: {
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  counter: {
    alignSelf: 'center',
    marginTop: 18,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  counterTxt: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  /* results */
  headerGradient: {
    padding: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  resultTitle: { color: 'white', fontSize: 26, fontWeight: 'bold', marginTop: 6 },
  resultSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    marginBottom: 14,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  statTxt: { color: 'white', fontWeight: '600', marginHorizontal: 4 },
  cta: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'white',
    alignSelf: 'center',
  },
  ctaTxt: { color: 'white', fontSize: 15, fontWeight: '600' },

  /* hint */
  hintBtn: (c) => ({
    marginTop: 12,
    backgroundColor: c.info + '30',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  }),

  /* web mascot */
  webMascotBox: { width: 120, height: 120, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  webMascotCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
});

export default DuolingoQuizScreen; 
