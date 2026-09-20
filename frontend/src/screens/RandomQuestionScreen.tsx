import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { CodeEditor } from '../components/CodeEditor';
import FuturisticNavbar from '../components/FuturisticNavbar';
import api from '../services/api';
import { analyzeCode, chatWithAI } from '../services/api';
import { submitCode, submitOOPProject } from '../services/judge0Service';

const RandomQuestionScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const { t, language } = useI18n();
  
  const [question, setQuestion] = useState('');
  const [expected, setExpected] = useState('');
  const [solutionCode, setSolutionCode] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestedCode, setSuggestedCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Compilation states
  const [compilationResult, setCompilationResult] = useState<any>(null);
  const [compiling, setCompiling] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<'c' | 'cpp'>('cpp');
  
  // Programming language selection
  const [selectedProgrammingLanguage, setSelectedProgrammingLanguage] = useState<'c' | 'cpp'>('cpp');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
  // User preferences
  const [userPreferences, setUserPreferences] = useState<any>({});
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // AI states
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiChat, setAiChat] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // ✅ YENİ: INPUT İLE ÇALIŞTIRMA FONKSİYONU
  const [userInput, setUserInput] = useState('');
  const [showInputModal, setShowInputModal] = useState(false);

  useEffect(() => {
    fetchUserPreferences();
    fetchQuestion(); // Sayfa açıldığında ilk soruyu al
  }, []);

  useEffect(() => {
    fetchQuestion();
  }, [language, selectedProgrammingLanguage]);

  const fetchUserPreferences = async () => {
    try {
      const res = await api.get('/onboarding/status');
      if (res.data.hasCompletedOnboarding) {
        // Get detailed preferences
        const prefsRes = await api.get('/onboarding/preferences');
        setUserPreferences(prefsRes.data.preferences || {});
      }
    } catch (err) {
      console.log('Could not fetch user preferences');
    }
  };

  const fetchQuestion = async () => {
    setLoading(true);
    setError('');
    setEvaluation(null);
    setSuggestions([]);
    setSuggestedCode('');
    setUserAnswer('');
    setCompilationResult(null);
    try {
      console.log('[RandomQuestion] Sending language to backend:', language);
      console.log('[RandomQuestion] Sending user preferences:', userPreferences);
      
      const requestData: any = {
        programmingLanguage: selectedProgrammingLanguage,
        language,
      };
      
      // Add user preferences if available
      if (Object.keys(userPreferences).length > 0) {
        requestData.userPreferences = userPreferences;
      }
      
      const res = await api.post('/ai/random-question', requestData);
      setQuestion(res.data.question);
      setExpected(res.data.expectedAnswer);
      setSolutionCode(res.data.solutionCode);
      setCodeLanguage(selectedProgrammingLanguage);
    } catch (err) {
      setError(t('randomQuestion.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/ai/random-question/evaluate', {
        question,
        userAnswer,
      });
      setEvaluation(res.data.evaluation);
      setSuggestions(res.data.suggestions || []);
      setSuggestedCode(res.data.suggestedCode || '');
      
      // Rozet bildirimi kontrolü
      if (res.data.newlyAwardedBadges && res.data.newlyAwardedBadges.length > 0) {
        const badgeNames = res.data.newlyAwardedBadges.join(', ');
        Alert.alert(
          language === 'en' ? '🎉 New Badge Unlocked!' : '🎉 Yeni Rozet Kazandın!',
          language === 'en' 
            ? `Congratulations! You've earned: ${badgeNames}`
            : `Tebrikler! Şu rozetleri kazandın: ${badgeNames}`,
          [
            {
              text: language === 'en' ? 'View Badges' : 'Rozetleri Görüntüle',
              onPress: () => {
                // Quiz stats ekranına yönlendir
                navigation.navigate('QuizStats' as never);
              }
            },
            {
              text: language === 'en' ? 'Continue' : 'Devam Et',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (err) {
      setError(language === 'en' 
        ? 'Failed to get evaluation. Please try again.' 
        : 'Değerlendirme alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ GELİŞTİRİLMİŞ DERLEME VE ÇALIŞTIRMA FONKSİYONU
  const compileAndRunCode = async () => {
    if (!userAnswer.trim()) {
      setError(language === 'en' 
        ? 'Please write code to run' 
        : 'Lütfen çalıştırılacak kodu yazın');
      return;
    }

    setCompiling(true);
    setCompilationResult(null);
    setError('');

    try {
      console.log('🚀 RandomQuestion kod derleniyor...');
      console.log('📝 Kod dili:', codeLanguage);
      console.log('📄 Kod uzunluğu:', userAnswer.length);
      
      // ✅ OOP desteği kontrolü
      const hasClassDeclaration = userAnswer.includes('class ') || userAnswer.includes('struct ');
      const hasInclude = userAnswer.includes('#include');
      
      let result;
      
      if (hasClassDeclaration && codeLanguage === 'cpp') {
        // Nesne yönelimli C++ kodu - OOP modu kullan
        console.log('🎯 OOP modu kullanılıyor...');
        
        result = await submitOOPProject({
          projectFiles: [{
            name: 'main.cpp',
            content: userAnswer,
            language: 'cpp'
          }],
          mainFileName: 'main.cpp',
          stdin: '',
          compilerOptions: '-std=c++17 -O2 -Wall'
        });
      } else {
        // Normal kod - standart modu kullan
        console.log('📝 Standart modu kullanılıyor...');
        
        const language_id = codeLanguage === 'c' ? 50 : 54;
        result = await submitCode({
          source_code: userAnswer,
          language_id,
          stdin: '',
        });
      }
      
      console.log('✅ Judge0 sonucu:', result);
      
      // Sonucu detaylı olarak işle
      let output = '';
      let error = '';
      let success = false;
      
      if (result.status?.id === 3) { // Accepted
        success = true;
        output = result.stdout || (language === 'en' ? 'Program executed successfully (no output)' : 'Program başarıyla çalıştı (çıktı yok)');
        if (result.stderr) {
          output += `\n\n${language === 'en' ? 'Warnings:' : 'Uyarılar:'}\n${result.stderr}`;
        }
      } else if (result.status?.id === 6) { // Compilation Error
        error = result.compile_output || result.message || (language === 'en' ? 'Compilation failed' : 'Derleme başarısız');
        
        // OOP hatalarına özel ipuçları
        if (hasClassDeclaration) {
          error += `\n\n${language === 'en' ? 'OOP Tips:' : 'OOP İpuçları:'}\n`;
          error += language === 'en' 
            ? '- Check class declarations and member functions\n- Ensure proper constructor/destructor syntax\n- Verify access specifiers (public, private, protected)'
            : '- Sınıf tanımlarını ve üye fonksiyonları kontrol edin\n- Constructor/destructor sözdizimini doğrulayın\n- Erişim belirleyicilerini kontrol edin (public, private, protected)';
        }
      } else if (result.status?.id === 5) { // Time Limit Exceeded
        error = language === 'en' ? 'Time limit exceeded' : 'Zaman aşımı';
      } else if (result.status?.id === 4) { // Wrong Answer
        error = language === 'en' ? 'Wrong answer' : 'Yanlış cevap';
        output = result.stdout || '';
      } else if (result.status?.id === 11) { // Runtime Error
        error = result.stderr || result.message || (language === 'en' ? 'Runtime error' : 'Çalışma zamanı hatası');
        output = result.stdout || '';
        
        // OOP runtime hatalarına özel ipuçları
        if (hasClassDeclaration) {
          error += `\n\n${language === 'en' ? 'OOP Runtime Tips:' : 'OOP Çalışma Zamanı İpuçları:'}\n`;
          error += language === 'en' 
            ? '- Check object initialization\n- Verify pointer/reference usage\n- Ensure proper memory management'
            : '- Nesne başlatmayı kontrol edin\n- Pointer/referans kullanımını doğrulayın\n- Bellek yönetimini kontrol edin';
        }
      } else {
        error = result.message || result.stderr || (language === 'en' ? 'Unknown error occurred' : 'Bilinmeyen hata oluştu');
        output = result.stdout || '';
      }
      
      setCompilationResult({
        output,
        error,
        success,
        status: result.status?.description || 'Unknown',
        time: result.time || '0.0',
        memory: result.memory || 0,
        compile_output: result.compile_output || '',
        raw_result: result,
        is_oop: hasClassDeclaration
      });
      
    } catch (err) {
      console.error('❌ Derleme hatası:', err);
      setError(language === 'en' 
        ? 'An error occurred while compiling the code.' 
        : 'Kod derlenirken bir hata oluştu.');
    } finally {
      setCompiling(false);
    }
  };

  // ✅ YENİ: INPUT İLE ÇALIŞTIRMA FONKSİYONU
  const compileAndRunWithInput = async () => {
    if (!userAnswer.trim()) {
      setError(language === 'en' 
        ? 'Please write code to run' 
        : 'Lütfen çalıştırılacak kodu yazın');
      return;
    }

    setCompiling(true);
    setCompilationResult(null);
    setError('');

    try {
      console.log('🚀 RandomQuestion kod input ile derleniyor...');
      console.log('📝 Kod dili:', codeLanguage);
      console.log('📄 Kod uzunluğu:', userAnswer.length);
      console.log('⌨️ Kullanıcı input:', userInput);
      
      const language_id = codeLanguage === 'c' ? 50 : 54;
      
      const result = await submitCode({
        source_code: userAnswer,
        language_id,
        stdin: userInput,
      });
      
      console.log('✅ Judge0 sonucu:', result);
      
      // Sonucu işle (yukarıdaki gibi)
      let output = '';
      let error = '';
      let success = false;
      
      if (result.status?.id === 3) { // Accepted
        success = true;
        output = result.stdout || (language === 'en' ? 'Program executed successfully (no output)' : 'Program başarıyla çalıştı (çıktı yok)');
        if (result.stderr) {
          output += `\n\n${language === 'en' ? 'Warnings:' : 'Uyarılar:'}\n${result.stderr}`;
        }
      } else if (result.status?.id === 6) { // Compilation Error
        error = result.compile_output || result.message || (language === 'en' ? 'Compilation failed' : 'Derleme başarısız');
      } else if (result.status?.id === 5) { // Time Limit Exceeded
        error = language === 'en' ? 'Time limit exceeded' : 'Zaman aşımı';
      } else if (result.status?.id === 4) { // Wrong Answer
        error = language === 'en' ? 'Wrong answer' : 'Yanlış cevap';
        output = result.stdout || '';
      } else if (result.status?.id === 11) { // Runtime Error
        error = result.stderr || result.message || (language === 'en' ? 'Runtime error' : 'Çalışma zamanı hatası');
        output = result.stdout || '';
      } else {
        error = result.message || result.stderr || (language === 'en' ? 'Unknown error occurred' : 'Bilinmeyen hata oluştu');
        output = result.stdout || '';
      }
      
      setCompilationResult({
        output,
        error,
        success,
        status: result.status?.description || 'Unknown',
        time: result.time || '0.0',
        memory: result.memory || 0,
        compile_output: result.compile_output || '',
        raw_result: result,
        with_input: true,
        user_input: userInput
      });
      
      setShowInputModal(false);
      setUserInput('');
      
    } catch (err) {
      console.error('❌ Derleme hatası:', err);
      setError(language === 'en' 
        ? 'An error occurred while compiling the code.' 
        : 'Kod derlenirken bir hata oluştu.');
    } finally {
      setCompiling(false);
    }
  };

  const handleProgrammingLanguageChange = (lang: 'c' | 'cpp') => {
    setSelectedProgrammingLanguage(lang);
    setShowLanguageModal(false);
    // Yeni dil seçildiğinde yeni soru al
    setTimeout(() => {
      fetchQuestion();
    }, 100);
  };

  // Programming Language Selection Modal
  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <View style={styles.modal}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('randomQuestion.selectLanguage')}
            </Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                selectedProgrammingLanguage === 'c' && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => handleProgrammingLanguageChange('c')}
            >
              <Ionicons 
                name="code" 
                size={24} 
                color={selectedProgrammingLanguage === 'c' ? colors.primary : colors.textSecondary} 
              />
              <View style={styles.languageInfo}>
                <Text style={[
                  styles.languageName, 
                  { color: selectedProgrammingLanguage === 'c' ? colors.primary : colors.text }
                ]}>
                  C
                </Text>
                <Text style={[styles.languageDesc, { color: colors.textSecondary }]}>
                  {t('randomQuestion.cDescription')}
                </Text>
              </View>
              {selectedProgrammingLanguage === 'c' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                selectedProgrammingLanguage === 'cpp' && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => handleProgrammingLanguageChange('cpp')}
            >
              <Ionicons 
                name="code-slash" 
                size={24} 
                color={selectedProgrammingLanguage === 'cpp' ? colors.primary : colors.textSecondary} 
              />
              <View style={styles.languageInfo}>
                <Text style={[
                  styles.languageName, 
                  { color: selectedProgrammingLanguage === 'cpp' ? colors.primary : colors.text }
                ]}>
                  C++
                </Text>
                <Text style={[styles.languageDesc, { color: colors.textSecondary }]}>
                  {t('randomQuestion.cppDescription')}
                </Text>
              </View>
              {selectedProgrammingLanguage === 'cpp' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const updatePreferences = async (newPreferences: any) => {
    setPreferencesLoading(true);
    try {
      await api.post('/onboarding/preferences', {
        preferences: newPreferences
      });
      setUserPreferences(newPreferences);
      setShowPreferencesModal(false);
      Alert.alert(
        language === 'en' ? 'Success' : 'Başarılı', 
        language === 'en' ? 'Your preferences have been updated!' : 'Tercihleriniz güncellendi!'
      );
    } catch (err) {
      Alert.alert(
        language === 'en' ? 'Error' : 'Hata', 
        language === 'en' ? 'An error occurred while updating preferences.' : 'Tercihler güncellenirken bir hata oluştu.'
      );
    } finally {
      setPreferencesLoading(false);
    }
  };

  const getPreferenceLabel = (key: string, value: string) => {
    const labels: any = {
      experienceLevel: {
        beginner: language === 'en' ? 'Beginner' : 'Başlangıç',
        intermediate: language === 'en' ? 'Intermediate' : 'Orta',
        advanced: language === 'en' ? 'Advanced' : 'İleri'
      },
      learningGoal: {
        general: language === 'en' ? 'General Programming' : 'Genel Programlama',
        game_dev: language === 'en' ? 'Game Development' : 'Oyun Geliştirme',
        web_dev: language === 'en' ? 'Web Development' : 'Web Geliştirme',
        mobile_dev: language === 'en' ? 'Mobile Development' : 'Mobil Geliştirme',
        system_programming: language === 'en' ? 'System Programming' : 'Sistem Programlama'
      },
      interests: {
        algorithms: language === 'en' ? 'Algorithms' : 'Algoritmalar',
        data_structures: language === 'en' ? 'Data Structures' : 'Veri Yapıları',
        oop: language === 'en' ? 'Object Oriented Programming' : 'Nesne Yönelimli Programlama',
        memory_management: language === 'en' ? 'Memory Management' : 'Bellek Yönetimi',
        stl: language === 'en' ? 'STL (Standard Template Library)' : 'STL (Standard Template Library)'
      }
    };
    return labels[key]?.[value] || value;
  };

  const renderPreferencesCard = () => (
    <View style={[styles.preferencesCard, { backgroundColor: colors.surface }]}>
      <View style={styles.preferencesHeader}>
        <Ionicons name="person-circle" size={24} color={colors.primary} />
        <Text style={[styles.preferencesTitle, { color: colors.text }]}>
          {language === 'en' ? 'Learning Profile' : 'Öğrenme Profilin'}
        </Text>
        <TouchableOpacity
          onPress={() => setShowPreferencesModal(true)}
          style={[styles.editButton, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="pencil" size={16} color={colors.textOnPrimary} />
          <Text style={[styles.editButtonText, { color: colors.textOnPrimary }]}>
            {language === 'en' ? 'Update' : 'Güncelle'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.preferencesContent}>
        {userPreferences.experienceLevel && (
          <View style={styles.preferenceItem}>
            <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Experience Level:' : 'Deneyim Seviyesi:'}
            </Text>
            <Text style={[styles.preferenceValue, { color: colors.text }]}>
              {getPreferenceLabel('experienceLevel', userPreferences.experienceLevel)}
            </Text>
          </View>
        )}
        
        {userPreferences.learningGoal && (
          <View style={styles.preferenceItem}>
            <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Learning Goal:' : 'Öğrenme Hedefi:'}
            </Text>
            <Text style={[styles.preferenceValue, { color: colors.text }]}>
              {getPreferenceLabel('learningGoal', userPreferences.learningGoal)}
            </Text>
          </View>
        )}
        
        {userPreferences.interests && userPreferences.interests.length > 0 && (
          <View style={styles.preferenceItem}>
            <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Interests:' : 'İlgi Alanları:'}
            </Text>
            <Text style={[styles.preferenceValue, { color: colors.text }]}>
              {userPreferences.interests.map((interest: string) => 
                getPreferenceLabel('interests', interest)
              ).join(', ')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderPreferencesModal = () => (
    <Modal
      visible={showPreferencesModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Öğrenme Profilini Güncelle
            </Text>
            <TouchableOpacity
              onPress={() => setShowPreferencesModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Bu tercihler, sana özel sorular üretmek için kullanılır.
            </Text>
            
            {/* Experience Level */}
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                Deneyim Seviyesi
              </Text>
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: userPreferences.experienceLevel === level 
                        ? colors.accent 
                        : colors.surfaceSecondary,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setUserPreferences((prev: any) => ({ ...prev, experienceLevel: level }))}
                >
                  <Text style={[
                    styles.optionText,
                    { 
                      color: userPreferences.experienceLevel === level 
                        ? colors.textOnPrimary 
                        : colors.text 
                    }
                  ]}>
                    {getPreferenceLabel('experienceLevel', level)}
                  </Text>
                  {userPreferences.experienceLevel === level && (
                    <Ionicons name="checkmark" size={20} color={colors.textOnPrimary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Learning Goal */}
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                Öğrenme Hedefi
              </Text>
              {['general', 'game_dev', 'web_dev', 'mobile_dev', 'system_programming'].map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: userPreferences.learningGoal === goal 
                        ? colors.accent 
                        : colors.surfaceSecondary,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setUserPreferences((prev: any) => ({ ...prev, learningGoal: goal }))}
                >
                  <Text style={[
                    styles.optionText,
                    { 
                      color: userPreferences.learningGoal === goal 
                        ? colors.textOnPrimary 
                        : colors.text 
                    }
                  ]}>
                    {getPreferenceLabel('learningGoal', goal)}
                  </Text>
                  {userPreferences.learningGoal === goal && (
                    <Ionicons name="checkmark" size={20} color={colors.textOnPrimary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setShowPreferencesModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                İptal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => updatePreferences(userPreferences)}
              disabled={preferencesLoading}
            >
              {preferencesLoading ? (
                <ActivityIndicator color={colors.textOnPrimary} size="small" />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.textOnPrimary }]}>
                  Kaydet
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const handleAnalyzeCode = async () => {
    setAiLoading(true);
    try {
      const res = await analyzeCode('random-question-session', userAnswer, codeLanguage, question);
      setAiAnalysis(res.data);
    } catch {
      setAiAnalysis({ analysis: 'Analiz yapılamadı.' });
    }
    setAiLoading(false);
  };

  const handleChatWithAI = async () => {
    setAiLoading(true);
    try {
      const res = await chatWithAI('random-question-session', userAnswer, codeLanguage, 'Kodum doğru mu?', question);
      setAiChat(res.data.response);
    } catch {
      setAiChat('AI ile görüşme başarısız.');
    }
    setAiLoading(false);
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
          <Text key={index} style={[styles.text, styles.boldText, { color: colors.primary }]}>
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
      
      // Normal text - View içinde Text kullanıyoruz
      return (
        <View key={index}>
          <Text style={[styles.text, { color: colors.text }]}>
            {line}
          </Text>
        </View>
      );
    });
  };

  // ✅ YENİ: INPUT MODAL RENDER
  const renderInputModal = () => (
    <Modal
      visible={showInputModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowInputModal(false)}
    >
      <View style={styles.modal}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {language === 'en' ? 'Program Input' : 'Program Girişi'}
            </Text>
            <TouchableOpacity onPress={() => setShowInputModal(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {language === 'en' 
                ? 'Enter input for your program (stdin):' 
                : 'Programınız için giriş verisi (stdin):'}
            </Text>
            
            <TextInput
              style={[styles.inputField, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder={language === 'en' ? 'Enter input data...' : 'Giriş verisini yazın...'}
              placeholderTextColor={colors.textSecondary}
              value={userInput}
              onChangeText={setUserInput}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => setShowInputModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textOnPrimary }]}>
                  {language === 'en' ? 'Cancel' : 'İptal'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={compileAndRunWithInput}
                disabled={compiling}
              >
                {compiling ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <>
                    <Ionicons name="play" size={16} color={colors.textOnPrimary} />
                    <Text style={[styles.modalButtonText, { color: colors.textOnPrimary }]}>
                      {language === 'en' ? 'Run' : 'Çalıştır'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FuturisticNavbar 
        title={t('randomQuestion.title')}
        onBack={() => {}}
        showBack={false}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Language Selection and New Question Button */}
          <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={[styles.languageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowLanguageModal(true)}
            >
              <Ionicons name="code" size={20} color={colors.primary} />
              <Text style={[styles.languageButtonText, { color: colors.primary }]}>
                {selectedProgrammingLanguage.toUpperCase()}
            </Text>
              <Ionicons name="chevron-down" size={16} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.newQuestionButton, { backgroundColor: colors.primary }]}
              onPress={fetchQuestion}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.newQuestionButtonText}>
                    {t('randomQuestion.newQuestion')}
            </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          </View>

        {/* User Preferences Card */}
        {Object.keys(userPreferences).length > 0 && renderPreferencesCard()}

        {/* Question Content */}
        {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('randomQuestion.loading')}
                </Text>
              </View>
        ) : question ? (
          <View style={styles.content}>
            {/* Question */}
            <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
              <View style={styles.questionHeader}>
                <Ionicons name="help-circle" size={24} color={colors.primary} />
                <Text style={[styles.questionTitle, { color: colors.text }]}>
                  {t('randomQuestion.question')}
                </Text>
              </View>
                <Text style={[styles.questionText, { color: colors.text }]}>
                  {question}
                </Text>
            </View>
                
            {/* Code Editor */}
            <View style={[styles.codeCard, { backgroundColor: colors.surface }]}>
              <View style={styles.codeHeader}>
                <Ionicons name="code" size={24} color={colors.primary} />
                <Text style={[styles.codeTitle, { color: colors.text }]}>
                  {t('randomQuestion.yourCode')}
                  </Text>
                  </View>
                <CodeEditor
                  code={userAnswer}
                language={codeLanguage}
                  onCodeChange={setUserAnswer}
                  readOnly={false}
                style={styles.codeEditor}
              />
                </View>

                {/* ✅ GELİŞTİRİLMİŞ ACTION BUTTONS */}
                <View style={styles.actionButtons}>
                  {/* Basit Çalıştır */}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                    onPress={compileAndRunCode}
                    disabled={compiling || !userAnswer.trim()}
                  >
                    {compiling ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="play" size={20} color="white" />
                    )}
                    <Text style={styles.actionButtonText}>
                      {compiling ? t('randomQuestion.compiling') : t('randomQuestion.run')}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Input ile Çalıştır */}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.info }]}
                    onPress={() => setShowInputModal(true)}
                    disabled={compiling || !userAnswer.trim()}
                  >
                    <Ionicons name="terminal" size={20} color="white" />
                    <Text style={styles.actionButtonText}>
                      {language === 'en' ? 'Run with Input' : 'Input ile Çalıştır'}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Kod Analizi */}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.warning }]}
                    onPress={handleAnalyzeCode}
                    disabled={aiLoading || !userAnswer.trim()}
                  >
                    {aiLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="analytics" size={20} color="white" />
                    )}
                    <Text style={styles.actionButtonText}>
                      {aiLoading ? 
                        (language === 'en' ? 'Analyzing...' : 'Analiz...') : 
                        (language === 'en' ? 'Analyze Code' : 'Kod Analizi')
                      }
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Değerlendirme */}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.accent }]}
                    onPress={submitAnswer}
                    disabled={loading || !userAnswer.trim()}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                    <Text style={styles.actionButtonText}>
                      {loading ? t('randomQuestion.evaluating') : t('randomQuestion.evaluate')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ✅ GELİŞTİRİLMİŞ COMPILATION RESULT */}
                {compilationResult && (
                  <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.resultHeader}>
                      <Ionicons 
                        name={compilationResult.success ? "checkmark-circle" : "alert-circle"} 
                        size={24} 
                        color={compilationResult.success ? colors.success : colors.error} 
                      />
                      <Text style={[styles.resultTitle, { color: colors.text }]}>
                        {language === 'en' ? 'Execution Result' : 'Çalıştırma Sonucu'}
                      </Text>
                      
                      {/* Durum göstergesi */}
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: compilationResult.success ? colors.success : colors.error }
                      ]}>
                        <Text style={[styles.statusText, { color: colors.textOnPrimary }]}>
                          {compilationResult.status}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Performans bilgileri */}
                    {compilationResult.success && (
                      <View style={styles.performanceInfo}>
                        <View style={styles.performanceItem}>
                          <Ionicons name="time" size={16} color={colors.info} />
                          <Text style={[styles.performanceText, { color: colors.textSecondary }]}>
                            {language === 'en' ? 'Time:' : 'Süre:'} {compilationResult.time}s
                          </Text>
                        </View>
                        <View style={styles.performanceItem}>
                          <Ionicons name="hardware-chip" size={16} color={colors.info} />
                          <Text style={[styles.performanceText, { color: colors.textSecondary }]}>
                            {language === 'en' ? 'Memory:' : 'Bellek:'} {compilationResult.memory}KB
                          </Text>
                        </View>
                        {compilationResult.with_input && (
                          <View style={styles.performanceItem}>
                            <Ionicons name="terminal" size={16} color={colors.info} />
                            <Text style={[styles.performanceText, { color: colors.textSecondary }]}>
                              {language === 'en' ? 'With Input' : 'Input ile'}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    {/* Çıktı */}
                    {compilationResult.output && (
                      <View style={styles.outputSection}>
                        <Text style={[styles.outputLabel, { color: colors.textSecondary }]}>
                          {language === 'en' ? 'Output:' : 'Çıktı:'}
                        </Text>
                        <View style={[styles.outputContainer, { backgroundColor: colors.background }]}>
                          <Text style={[styles.outputText, { color: colors.text, fontFamily: 'monospace' }]}>
                            {compilationResult.output}
                          </Text>
                        </View>
                      </View>
                    )}
                    
                    {/* Hata */}
                    {compilationResult.error && (
                      <View style={styles.errorSection}>
                        <Text style={[styles.errorLabel, { color: colors.error }]}>
                          {language === 'en' ? 'Error:' : 'Hata:'}
                        </Text>
                        <View style={[styles.errorContainer, { backgroundColor: colors.error + '10' }]}>
                          <Text style={[styles.errorText, { color: colors.error, fontFamily: 'monospace' }]}>
                            {compilationResult.error}
                          </Text>
                        </View>
                      </View>
                    )}
                    
                    {/* Kullanıcı input'u (eğer varsa) */}
                    {compilationResult.user_input && (
                      <View style={styles.inputSection}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                          {language === 'en' ? 'Program Input:' : 'Program Girişi:'}
                        </Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                          <Text style={[styles.inputText, { color: colors.textSecondary, fontFamily: 'monospace' }]}>
                            {compilationResult.user_input}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

            {/* Results */}
          {evaluation && (
            <View style={[styles.resultCard, styles.evaluationCard, { backgroundColor: colors.surface, borderColor: colors.success }]}>
              <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                <Text style={[styles.resultTitle, { color: colors.success, fontSize: 20 }]}>
                    {t('randomQuestion.evaluation')}
                </Text>
              </View>
              <Text style={[styles.evaluationText, { color: colors.text, fontSize: 16, lineHeight: 24 }]}>
                {evaluation}
              </Text>
              {suggestions.length > 0 && (
                <View style={styles.suggestionsBlock}>
                  <Text style={[styles.suggestionsTitle, { color: colors.primary }]}>
                    {language === 'en' ? 'Suggestions' : 'Öneriler'}
                  </Text>
                  {suggestions.map((s, i) => (
                    <Text key={i} style={[styles.suggestionItem, { color: colors.text }]}>
                      • {s}
                    </Text>
                  ))}
                </View>
              )}
              {!!suggestedCode && (
                <View style={[styles.suggestedCodeBlock, { backgroundColor: colors.background }]}>
                  <Text style={[styles.suggestionsTitle, { color: colors.primary }]}>
                    {language === 'en' ? 'Suggested code' : 'Önerilen kod'}
                  </Text>
                  <Text style={[styles.suggestedCodeText, { color: colors.text }]}>
                    {suggestedCode}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Compilation Result */}
          {compilationResult && (
            <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
              <View style={styles.resultHeader}>
                  <Ionicons name="terminal" size={24} color={colors.primary} />
                <Text style={[styles.resultTitle, { color: colors.text }]}>
                    {t('randomQuestion.output')}
                </Text>
              </View>
                <Text style={[styles.outputText, { color: colors.text }]}>
                  {compilationResult.output || compilationResult.error}
                    </Text>
                </View>
              )}

            {/* Error */}
          {error && (
              <View style={[styles.errorCard, { backgroundColor: colors.error + '10' }]}>
                <Ionicons name="alert-circle" size={24} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('randomQuestion.noQuestion')}
            </Text>
          <TouchableOpacity
            style={[styles.newQuestionButton, { backgroundColor: colors.primary }]}
            onPress={fetchQuestion}
          >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.newQuestionButtonText}>
                {t('randomQuestion.getQuestion')}
            </Text>
          </TouchableOpacity>
        </View>
        )}
      </ScrollView>

      {renderLanguageModal()}
      {renderPreferencesModal()}
      {renderInputModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  newQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  newQuestionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  questionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  codeCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  codeEditor: {
    minHeight: 200,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  evaluationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  evaluationCard: {
    borderWidth: 2,
    marginTop: 8,
    padding: 18,
  },
  suggestionsBlock: {
    marginTop: 14,
    gap: 6,
  },
  suggestionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  suggestionItem: {
    fontSize: 15,
    lineHeight: 22,
  },
  suggestedCodeBlock: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
  },
  suggestedCodeText: {
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 20,
    marginTop: 6,
  },
  outputText: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  preferencesCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  preferencesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  preferencesContent: {
    gap: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputField: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  performanceInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  outputSection: {
    marginTop: 12,
  },
  outputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  outputContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorSection: {
    marginTop: 12,
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  inputSection: {
    marginTop: 12,
  },
  inputText: {
    fontSize: 12,
  },
  inputContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default RandomQuestionScreen; 