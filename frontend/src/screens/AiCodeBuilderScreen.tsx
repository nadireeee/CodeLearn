import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Modal, StyleSheet, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { CodeEditor, Button, AiSuggestions as AiSuggestionsComponent } from '../components';
import aiService from '../services/aiService';
import type { AiSuggestion } from '../components/AiSuggestions';
import { useRoute } from '@react-navigation/native';
import projectService, { Project } from '../services/projectService';
import { useI18n } from '../i18n/i18nProvider';
import { submitCode, submitProjectFromMongoDB, checkMultiFileSupport } from '../services/judge0Service';

// Language type now supports all common file types
export type Language = 'c' | 'cpp' | 'md' | 'txt' | 'h' | string;

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: Language;
}

function getLanguageFromFilename(name: string): Language {
  if (name.endsWith('.cpp')) return 'cpp';
  if (name.endsWith('.c')) return 'c';
  if (name.endsWith('.md')) return 'md';
  if (name.endsWith('.h')) return 'h';
  if (name.endsWith('.txt')) return 'txt';
  return 'txt';
}

export const AiCodeBuilderScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const route = useRoute<any>();
  const projectId = route.params?.projectId;

  // State
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [showFileModal, setShowFileModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'c' | 'cpp'>('cpp');
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [isAiFileCreating, setIsAiFileCreating] = useState(false);
  const [isProjectCreating, setIsProjectCreating] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectListModal, setShowProjectListModal] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [runOutput, setRunOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  // ✅ YENİ AI STATE'LERİ
  const [codeSessionId, setCodeSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [codeAnalysis, setCodeAnalysis] = useState<any>(null);
  const [codeErrors, setCodeErrors] = useState<any[]>([]);
  const [codeSuggestions, setCodeSuggestions] = useState<any[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [aiChatMessage, setAiChatMessage] = useState('');
  const [isAiChatting, setIsAiChatting] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [showAiChatModal, setShowAiChatModal] = useState(false);
  const [codeInsights, setCodeInsights] = useState<any>(null);
  const [isGettingInsights, setIsGettingInsights] = useState(false);

  // Helpers
  const selectedFile = files.find(f => f.id === selectedFileId);
  const currentFile = files.find(f => f.id === currentFileId) || files[0] || {
    id: '',
    name: '',
    content: '',
    language: 'txt' as Language
  };

  // Debug: currentFile değişikliklerini takip et
  useEffect(() => {
    console.log('🔄 currentFileId değişti:', currentFileId);
    console.log('🔄 selectedFileId değişti:', selectedFileId);
    console.log('📁 currentFile:', currentFile?.name);
    console.log('📄 currentFile içerik uzunluğu:', currentFile?.content?.length);
    console.log('📄 currentFile içeriği (ilk 50 karakter):', currentFile?.content?.substring(0, 50));
    console.log('📁 selectedFile:', selectedFile?.name);
    console.log('📄 selectedFile içerik uzunluğu:', selectedFile?.content?.length);
  }, [currentFileId, selectedFileId, currentFile, selectedFile]);

  // ✅ AI SESSION BAŞLATMA
  useEffect(() => {
    if (selectedProject && !codeSessionId) {
      startAISession();
    }
  }, [selectedProject]);

  // ✅ AI SESSION BAŞLAT
  const startAISession = async () => {
    try {
      const session = await aiService.startCodeSession(
        selectedLanguage as 'c' | 'cpp',
        'Kod geliştirme ve analiz için AI desteği'
      );
      setCodeSessionId(session.sessionId);
      console.log('✅ AI Session başlatıldı:', session.sessionId);
    } catch (error) {
      console.error('❌ AI Session başlatılamadı:', error);
    }
  };

  // ✅ KOD ANALİZİ
  const analyzeCurrentCode = async () => {
    if (!currentFile?.content || !codeSessionId) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await aiService.analyzeCodeChange(
        codeSessionId,
        currentFile.content,
        currentFile.language as 'c' | 'cpp',
        'Bu kodun kalitesini ve olası hatalarını analiz et'
      );
      
      setCodeAnalysis(analysis);
      setCodeErrors(analysis.errors || []);
      setCodeSuggestions(analysis.suggestions || []);
      setShowAnalysisModal(true);
      
      console.log('✅ Kod analizi tamamlandı:', analysis);
    } catch (error) {
      console.error('❌ Kod analizi hatası:', error);
      Alert.alert('Hata', 'Kod analizi yapılamadı.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ✅ AI İLE SOHBET
  const sendAiChatMessage = async () => {
    if (!aiChatMessage.trim() || !codeSessionId || !currentFile?.content) return;
    
    setIsAiChatting(true);
    try {
      const response = await aiService.chatWithAI(
        codeSessionId,
        currentFile.content,
        currentFile.language as 'c' | 'cpp',
        aiChatMessage
      );
      
      setAiChatHistory(prev => [
        ...prev,
        { role: 'user', content: aiChatMessage },
        { role: 'assistant', content: response.response }
      ]);
      
      setAiChatMessage('');
      console.log('✅ AI sohbet yanıtı:', response);
    } catch (error) {
      console.error('❌ AI sohbet hatası:', error);
      Alert.alert('Hata', 'AI ile sohbet edilemedi.');
    } finally {
      setIsAiChatting(false);
    }
  };

  // ✅ KOD İPUÇLARI AL
  const getCodeInsights = async () => {
    if (!currentFile?.content || !codeSessionId) return;
    
    setIsGettingInsights(true);
    try {
      const insights = await aiService.getCodeInsights(
        codeSessionId,
        currentFile.content,
        currentFile.language as 'c' | 'cpp'
      );
      
      setCodeInsights(insights);
      console.log('✅ Kod ipuçları alındı:', insights);
    } catch (error) {
      console.error('❌ Kod ipuçları hatası:', error);
      Alert.alert('Hata', 'Kod ipuçları alınamadı.');
    } finally {
      setIsGettingInsights(false);
    }
  };

  // ✅ KOD OPTİMİZASYONU
  const optimizeCode = async (focus?: 'performance' | 'readability' | 'security') => {
    if (!currentFile?.content) return;
    
    setIsLoading(true);
    try {
      const result = await aiService.optimizeCode(
        currentFile.content,
        currentFile.language as 'c' | 'cpp',
        focus
      );
      
      if (result.optimizedCode) {
        handleCodeChange(result.optimizedCode);
        Alert.alert(
          'Kod Optimize Edildi',
          `İyileştirmeler:\n${result.improvements.join('\n')}`
        );
      }
    } catch (error) {
      console.error('❌ Kod optimizasyon hatası:', error);
      Alert.alert('Hata', 'Kod optimizasyonu yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  // Project load (from backend)
  useEffect(() => {
    if (projectId) {
      (async () => {
        try {
          const project = await projectService.getProject(projectId);
          if (project && project.files.length > 0) {
            const loadedFiles = project.files.map(f => ({
              ...f,
              id: f.name + '_' + Date.now() + '_' + Math.random(),
              language: getLanguageFromFilename(f.name),
            }));
            setFiles(loadedFiles);
            setCurrentFileId(loadedFiles[0].id);
            setSelectedFileId(loadedFiles[0].id); // ✅ Bu satırı ekledik
            setProjectName(project.name);
            setSelectedProject(project);
          }
        } catch (e) {
          Alert.alert('Hata', 'Proje yüklenemedi.');
        }
      })();
    }
  }, [projectId]);

  // Save to backend on file change
  useEffect(() => {
    if (projectId && files.length > 0) {
      projectService.updateProject(projectId, {
        files: files.map(f => ({
          name: f.name,
          content: f.content,
          language: f.language,
        })),
      });
    }
  }, [files, projectId]);

  // Manual file creation - SADECE BACKEND PROJESİ VARSA
  const createFile = () => {
    if (!selectedProject) {
      Alert.alert('Hata', 'Önce bir proje seçmelisiniz!');
      return;
    }
    
    if (!newFileName.trim()) return;
    
    const id = newFileName.trim() + '_' + Date.now() + '_' + Math.random();
    const newFile: ProjectFile = {
      id,
      name: newFileName.trim(),
      content: '',
      language: getLanguageFromFilename(newFileName.trim()),
    };
    
    setFiles([...files, newFile]);
    setCurrentFileId(id);
    setSelectedFileId(id); // ✅ Bu satırı ekledik
    setShowFileModal(false);
    setNewFileName('');
    setHasUnsavedChanges(true); // Değişiklik yapıldı
  };

  // Dosya sil - SADECE BACKEND PROJESİ VARSA
  const deleteFile = (id: string) => {
    if (!selectedProject) {
      Alert.alert('Hata', 'Önce bir proje seçmelisiniz!');
      return;
    }
    
    if (files.length === 1) {
      Alert.alert('Hata', 'En az bir dosya olmalı!');
      return;
    }
    
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    setCurrentFileId(updated[0].id);
    setSelectedFileId(updated[0].id); // ✅ Bu satırı ekledik
    setHasUnsavedChanges(true); // Değişiklik yapıldı
  };

  // Kod değişikliği
  const handleCodeChange = (code: string) => {
    setFiles(files.map(f => f.id === currentFileId ? { ...f, content: code } : f));
    setHasUnsavedChanges(true);
  };

  // AI ile proje oluştur
  const handleAiCreateProject = async () => {
    if (!projectName.trim() || !projectDescription.trim()) {
      Alert.alert('Hata', 'Proje adı ve açıklaması gerekli!');
      return;
    }
    
    setIsProjectCreating(true);
    try {
      const res = await aiService.createProject(projectName.trim(), projectDescription.trim(), selectedLanguage);
      
      if (res.success && res.files.length > 0) {
        // Her dosya için benzersiz id üret
        const newProjectFiles: ProjectFile[] = res.files.map(f => ({
          id: f.name + '_' + Date.now() + '_' + Math.random(),
          name: f.name,
          content: f.content,
          language: getLanguageFromFilename(f.name)
        }));
        
        setFiles(newProjectFiles);
        setCurrentFileId(newProjectFiles[0].id);
        setSelectedFileId(newProjectFiles[0].id);
        setProjectName(projectName);
        setShowProjectModal(false);
        setProjectDescription('');
        
        // ✅ YENİ EKLENEN: Proje oluşturulduktan sonra backend'e kaydet ve otomatik seç
        try {
          console.log('💾 Yeni proje backend\'e kaydediliyor...');
          const savedProject = await projectService.createProject({
            name: projectName.trim(),
            description: projectDescription.trim(),
            language: selectedLanguage,
            files: res.files.map(f => ({
              name: f.name,
              content: f.content,
              language: getLanguageFromFilename(f.name)
            }))
          });
          
          console.log('✅ Proje backend\'e kaydedildi:', savedProject);
          
          // Oluşturulan projeyi otomatik seç
          setSelectedProject(savedProject);
          setProjectLoaded(true);
          setHasUnsavedChanges(false);
          
          // AI Session başlat
          if (!codeSessionId) {
            startAISession();
          }
          
          console.log('🎯 Yeni proje otomatik seçildi:', savedProject.name);
          
        } catch (saveError) {
          console.error('❌ Proje kaydedilemedi:', saveError);
          Alert.alert('Uyarı', 'Proje oluşturuldu ama kaydedilemedi. Manuel olarak kaydetmeniz gerekebilir.');
        }
        
        // Rozet bildirimi kontrolü
        if ((res as any).newlyAwardedBadges && (res as any).newlyAwardedBadges.length > 0) {
          const badgeNames = (res as any).newlyAwardedBadges.join(', ');
          Alert.alert(
            '🎉 Yeni Rozet Kazandın!',
            `Tebrikler! Şu rozetleri kazandın: ${badgeNames}`,
            [
              {
                text: 'Rozetleri Görüntüle',
                onPress: () => {
                  // Quiz stats ekranına yönlendir
                  // navigation.navigate('QuizStats' as never);
                }
              },
              {
                text: 'Devam Et',
                style: 'cancel'
              }
            ]
          );
        } else {
          Alert.alert('Başarılı', `${projectName} projesi başarıyla oluşturuldu ve açıldı!`);
        }
      } else {
        Alert.alert('Hata', res.error || 'Proje oluşturulamadı.');
      }
    } catch (error) {
      console.error('AI proje oluşturma hatası:', error);
      Alert.alert('Hata', 'AI proje oluşturamadı.');
    } finally {
      setIsProjectCreating(false);
    }
  };

  // AI ile kod üret - SADECE BACKEND PROJESİ VARSA
  const handleAiGenerate = async () => {
    if (!selectedProject) {
      Alert.alert('Hata', 'Önce bir proje seçmelisiniz!');
      return;
    }
    
    if (!aiInput.trim() || !selectedFile) {
      Alert.alert('Hata', 'AI açıklaması ve seçili dosya gerekli!');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await aiService.generateCodeWithContext(aiInput, selectedFile.content, selectedFile.language as 'c' | 'cpp');
      const code = res.code;
      
      if (!code || code.trim().length === 0) {
        Alert.alert('Hata', 'AI kod üretemedi!');
        return;
      }
      
      handleCodeChange(code);
      setAiInput('');
    } catch (e) {
      console.error('AI kod üretim hatası:', e);
      Alert.alert('Hata', 'AI kod üretim hatası!');
    } finally {
      setIsLoading(false);
    }
  };

  // AI ile dosya oluştur - SADECE BACKEND PROJESİ VARSA
  const handleAiCreateFile = async () => {
    if (!selectedProject) {
      Alert.alert('Hata', 'Önce bir proje seçmelisiniz!');
      return;
    }
    
    if (!aiInput.trim() || !newFileName.trim()) {
      Alert.alert('Hata', 'Dosya adı ve AI açıklaması gerekli!');
      return;
    }
    
    setIsAiFileCreating(true);
    try {
      const language = getLanguageFromFilename(newFileName.trim());
      const res = await aiService.generateCodeWithContext(aiInput, '', language as 'c' | 'cpp');
      const code = res.code;
      
      if (!code || code.trim().length === 0) {
        Alert.alert('Hata', 'AI kod üretemedi!');
      return;
    }
    
      const id = newFileName.trim() + '_' + Date.now() + '_' + Math.random();
      const newFile: ProjectFile = {
        id,
        name: newFileName.trim(),
        content: code,
        language: getLanguageFromFilename(newFileName.trim()),
      };
      
      setFiles([...files, newFile]);
      setCurrentFileId(id);
      setSelectedFileId(id); // ✅ Bu satırı ekledik
      setShowFileModal(false);
      setNewFileName('');
      setAiInput('');
      setHasUnsavedChanges(true); // Değişiklik yapıldı
    } catch (e) {
      console.error('AI dosya oluşturma hatası:', e);
      Alert.alert('Hata', 'AI dosya oluşturamadı.');
    } finally {
      setIsAiFileCreating(false);
    }
  };

  // ZIP olarak indir - SADECE BACKEND PROJESİ VARSA
  const handleDownloadZip = async () => {
    if (!selectedProject) {
      Alert.alert('Hata', 'Önce bir proje seçmelisiniz!');
      return;
    }
    
    try {
      const blob = await projectService.downloadZip(selectedProject._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedProject.name}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ZIP indirme hatası:', e);
      Alert.alert('Hata', 'ZIP indirilemedi.');
    }
  };

  // Proje yoksa boş state
  const resetToEmptyState = () => {
    setFiles([]);
    setCurrentFileId(null);
    setSelectedProject(null);
    setProjectName('');
    setHasUnsavedChanges(false);
  };

  // Proje listesini yükle
  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const projectsList = await projectService.getProjects();
      setProjects(projectsList);
    } catch (error) {
      console.error('Projeler yüklenemedi:', error);
      Alert.alert('Hata', 'Projeler yüklenemedi.');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Proje seç
  const selectProject = async (project: Project) => {
    console.log('🔄 Proje seçiliyor:', project.name);
    setSelectedProject(project);
    setProjectLoaded(true);
    setHasUnsavedChanges(false);
    
    // Proje dosyalarını yükle
    const projectFiles = project.files.map((file, index) => ({
      id: `${project._id}-${index}`,
      name: file.name,
      content: file.content,
      language: getLanguageFromFilename(file.name)
    }));
    
    setFiles(projectFiles);
    console.log('📁 Proje dosyaları yüklendi:', projectFiles.map(f => f.name));
    
    // İlk dosyayı otomatik seç
    if (projectFiles.length > 0) {
      const firstFile = projectFiles[0];
      console.log('🎯 İlk dosya otomatik seçiliyor:', firstFile.name);
      setCurrentFileId(firstFile.id);
      setSelectedFileId(firstFile.id);
    }
    
    setShowProjectListModal(false);
  };

  // Mevcut projeyi kaydet
  const saveCurrentProject = async () => {
    if (!selectedProject) return;
    
    setIsSaving(true);
    try {
      await projectService.updateProject(selectedProject._id, {
        files: files.map(f => ({
          name: f.name,
          content: f.content,
          language: f.language,
        })),
      });
      setHasUnsavedChanges(false);
      Alert.alert('Başarılı', 'Proje kaydedildi!');
    } catch (error) {
      console.error('Proje kaydedilemedi:', error);
      Alert.alert('Hata', 'Proje kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Proje listesi modal'ını açtığında projeleri yükle
  useEffect(() => {
    if (showProjectListModal) {
      loadProjects();
    }
  }, [showProjectListModal]);

  // Dosya seç
  const selectFile = (fileId: string) => {
    console.log('=== DOSYA SEÇME BAŞLADI ===');
    console.log('Tıklanan dosya ID:', fileId);
    console.log('Mevcut currentFileId:', currentFileId);
    console.log('Tüm dosyalar:', files.map(f => ({ id: f.id, name: f.name, contentLength: f.content.length })));
    
    const selectedFile = files.find(f => f.id === fileId);
    if (selectedFile) {
      console.log('✅ Seçilen dosya bulundu:', selectedFile.name);
      console.log('📄 Dosya içeriği uzunluğu:', selectedFile.content.length);
      console.log('📄 Dosya içeriği (ilk 100 karakter):', selectedFile.content.substring(0, 100));
      
      setCurrentFileId(fileId);
      setSelectedFileId(fileId); // ✅ Bu satırı ekledik
      console.log('🔄 currentFileId güncellendi:', fileId);
      console.log('🔄 selectedFileId güncellendi:', fileId);
    } else {
      console.error('❌ Dosya bulunamadı:', fileId);
      console.error('Mevcut dosya ID\'leri:', files.map(f => f.id));
    }
    console.log('=== DOSYA SEÇME BİTTİ ===');
  };

  const handleRunCode = async () => {
    if (!selectedProject || files.length === 0) {
      setRunOutput('❌ Proje seçilmemiş veya dosya yok!');
      return;
    }
    
    setRunOutput('🔄 Kod çalıştırılıyor...');
    setIsRunning(true);
    
    try {
      console.log('🚀 Kod çalıştırma başlatılıyor...');
      console.log('📁 Proje:', selectedProject.name);
      console.log('📄 Dosyalar:', files.map(f => ({ name: f.name, size: f.content.length })));
      
      // MongoDB'dan gelen dosyaları Judge0'a gönder
      const projectFiles = files.map(f => ({
        name: f.name,
        content: f.content,
        language: f.language
      }));
      
      // Ana dosyayı bul (main fonksiyonu olan veya şu anki dosya)
      let mainFileName = currentFile?.name || 'main.cpp';
      const mainFileCandidate = files.find(f => 
        f.content.includes('int main(') || f.content.includes('int main ')
      );
      if (mainFileCandidate) {
        mainFileName = mainFileCandidate.name;
      }
      
      console.log('🎯 Ana dosya:', mainFileName);
      
      // Judge0'a gönder
      const result = await submitProjectFromMongoDB({
        projectFiles,
        mainFileName,
        stdin: '',
        compilerOptions: '-std=c++17 -O2 -Wall -Wextra'
      });
      
      console.log('✅ Judge0 sonucu:', result);
      
      // Sonucu işle
      if (result.status?.id === 3) { // Accepted
        setRunOutput(`✅ Çalıştırma başarılı!\n\n📤 Çıktı:\n${result.stdout || '(Çıktı yok)'}\n\n⏱️ Süre: ${result.time}s\n💾 Bellek: ${result.memory}KB\n\n🔧 Derleme çıktısı:\n${result.compile_output || 'Derleme başarılı'}`);
      } else if (result.status?.id === 6) { // Compilation Error
        setRunOutput(`❌ Derleme hatası!\n\n🔧 Hata detayları:\n${result.compile_output || result.message || 'Bilinmeyen derleme hatası'}\n\n📝 İpucu: Header dosyalarının doğru include edildiğinden emin olun.`);
      } else if (result.status?.id === 5) { // Time Limit Exceeded
        setRunOutput(`⏰ Zaman aşımı!\n\n${result.message || 'Program çok uzun sürdü'}`);
      } else if (result.status?.id === 4) { // Wrong Answer
        setRunOutput(`❌ Yanlış çıktı!\n\n📤 Çıktı:\n${result.stdout || ''}\n\n🔍 Beklenen:\n${result.expected_output || 'Belirtilmemiş'}`);
      } else if (result.status?.id === 11) { // Runtime Error
        setRunOutput(`💥 Çalışma zamanı hatası!\n\n📤 Çıktı:\n${result.stdout || ''}\n\n🔍 Hata:\n${result.stderr || result.message || 'Bilinmeyen hata'}`);
      } else {
        setRunOutput(`❓ Bilinmeyen durum (${result.status?.id}): ${result.status?.description}\n\n📤 Çıktı:\n${result.stdout || result.stderr || result.message || 'Detay yok'}\n\n🔧 Derleme çıktısı:\n${result.compile_output || 'Yok'}`);
      }
      
    } catch (error) {
      console.error('❌ Kod çalıştırma hatası:', error);
      setRunOutput(`❌ Çalıştırma hatası!\n\n🔧 Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}\n\n💡 İpucu: Judge0 servisinin çalıştığından emin olun.`);
    } finally {
      setIsRunning(false);
    }
  };

  // UI
    return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>{t('aiCodeBuilder.title')}</Text>
          {selectedProject ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {selectedProject.name}
        </Text>
          ) : (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('aiCodeBuilder.selectOrCreateProject')}
            </Text>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {/* Proje Seç Butonu */}
            <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowProjectListModal(true)}
            >
            <Ionicons name="folder-open" size={20} color="white" />
            <Text style={styles.headerButtonText}>{t('aiCodeBuilder.selectProject')}</Text>
            </TouchableOpacity>
            
          {/* Kaydet Butonu - SADECE PROJE SEÇİLİYSE */}
          {selectedProject && hasUnsavedChanges && (
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: colors.success }]}
              onPress={saveCurrentProject}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="save" size={20} color="white" />
              )}
              <Text style={styles.headerButtonText}>
                {isSaving ? t('aiCodeBuilder.saving') : t('aiCodeBuilder.save')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Yeni Proje Butonu */}
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.accent }]}
            onPress={() => setShowProjectModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.headerButtonText}>{t('aiCodeBuilder.newProject')}</Text>
        </TouchableOpacity>

          {/* İndir Butonu - SADECE PROJE SEÇİLİYSE */}
          {selectedProject && (
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.info }]}
              onPress={handleDownloadZip}
            >
              <Ionicons name="download" size={20} color="white" />
              <Text style={styles.headerButtonText}>{t('aiCodeBuilder.download')}</Text>
              </TouchableOpacity>
          )}
        </View>
            </View>
            
      {/* Main Content */}
      {selectedProject ? (
        <View style={styles.content}>
          {/* File Tree - SADECE PROJE SEÇİLİYSE */}
          <View style={[styles.fileTree, { backgroundColor: colors.surface }]}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border
            }}>
              <Text style={[styles.sectionTitle, { color: colors.text, margin: 0 }]}>
                {t('aiCodeBuilder.files')} ({files.length})
              </Text>
              <TouchableOpacity
                style={{ 
                  backgroundColor: colors.primary, 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  borderRadius: 12 
                }}
                onPress={() => setShowFileModal(true)}
              >
                <Ionicons name="add" size={14} color="white" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.fileList}>
              {files.length === 0 ? (
                <View style={{ 
                  padding: 20, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Ionicons name="folder-open" size={32} color={colors.textSecondary} />
                  <Text style={{ 
                    color: colors.textSecondary, 
                    marginTop: 8, 
                    textAlign: 'center' 
                  }}>
                    Henüz dosya yok
                  </Text>
                </View>
              ) : (
                files.map((file) => (
                  <TouchableOpacity
                    key={file.id}
                    style={[
                      styles.fileItem,
                      currentFileId === file.id && { 
                        backgroundColor: colors.primary + '20',
                        borderLeftWidth: 3,
                        borderLeftColor: colors.primary
                      }
                    ]}
                    onPress={() => {
                      console.log('🔄 Dosya tıklandı:', file.name, file.id);
                      selectFile(file.id);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons 
                        name={(() => {
                          if (file.name.endsWith('.cpp') || file.name.endsWith('.cc')) return 'code-working';
                          if (file.name.endsWith('.c')) return 'code-working';
                          if (file.name.endsWith('.h') || file.name.endsWith('.hpp')) return 'library';
                          if (file.name.endsWith('.md')) return 'document-text';
                          return 'document';
                        })()} 
                        size={16} 
                        color={currentFileId === file.id ? colors.primary : colors.textSecondary} 
                      />
                      <View style={{ marginLeft: 8, flex: 1 }}>
                        <Text style={[
                          styles.fileName, 
                          { 
                            color: currentFileId === file.id ? colors.primary : colors.text,
                            fontWeight: currentFileId === file.id ? 'bold' : 'normal'
                          }
                        ]}>
                          {file.name}
                        </Text>
                        <Text style={{ 
                          color: colors.textSecondary, 
                          fontSize: 10,
                          marginTop: 2
                        }}>
                          {file.content.length} karakter • {file.content.split('\n').length} satır
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash" size={14} color={colors.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.addFileButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFileModal(true)}
            >
              <Ionicons name="add" size={16} color="white" />
              <Text style={styles.addFileButtonText}>{t('aiCodeBuilder.addFile')}</Text>
            </TouchableOpacity>
          </View>

          {/* Code Editor - SADECE PROJE SEÇİLİYSE */}
          <View style={styles.editorContainer}>
            {currentFile && currentFile.content !== undefined ? (
              <>
                {/* Üst kontrol paneli */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  margin: 8, 
                  flexWrap: 'wrap',
                  backgroundColor: colors.surface,
                  padding: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  {/* Şu anki dosya bilgisi */}
                  <View style={{ 
                    backgroundColor: colors.primary, 
                    paddingHorizontal: 12, 
                    paddingVertical: 8, 
                    borderRadius: 8,
                    marginRight: 12,
                    marginBottom: 8
                  }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                      📄 {currentFile.name}
                    </Text>
                    <Text style={{ color: 'white', fontSize: 10, opacity: 0.8 }}>
                      {currentFile.content.length} karakter
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: colors.success, 
                      padding: 12, 
                      borderRadius: 8, 
                      marginRight: 12,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      minWidth: 140
                    }}
                    onPress={handleRunCode}
                    disabled={isRunning || !selectedProject || files.length === 0}
                  >
                    <Ionicons name="play" size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 6 }}>
                      {isRunning ? 'Çalıştırılıyor...' : 'Projeyi Çalıştır'}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Proje bilgileri */}
                  <View style={{ 
                    backgroundColor: colors.info, 
                    paddingHorizontal: 10, 
                    paddingVertical: 6, 
                    borderRadius: 12,
                    marginRight: 8,
                    marginBottom: 8
                  }}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                      {files.length} dosya
                    </Text>
                  </View>
                  
                  {/* Dosya türleri */}
                  <View style={{ 
                    backgroundColor: colors.accent, 
                    paddingHorizontal: 10, 
                    paddingVertical: 6, 
                    borderRadius: 12,
                    marginRight: 8,
                    marginBottom: 8
                  }}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                      {(() => {
                        const cppFiles = files.filter(f => f.name.endsWith('.cpp') || f.name.endsWith('.cc'));
                        const cFiles = files.filter(f => f.name.endsWith('.c'));
                        const headerFiles = files.filter(f => f.name.endsWith('.h') || f.name.endsWith('.hpp'));
                        const types = [];
                        if (cppFiles.length > 0) types.push(`${cppFiles.length} C++`);
                        if (cFiles.length > 0) types.push(`${cFiles.length} C`);
                        if (headerFiles.length > 0) types.push(`${headerFiles.length} Header`);
                        return types.join(', ') || 'Bilinmeyen';
                      })()}
                    </Text>
                  </View>
                  
                  {/* Ana dosya */}
                  {(() => {
                    const mainFile = files.find(f => 
                      f.content.includes('int main(') || f.content.includes('int main ')
                    ) || currentFile;
                    
                    if (mainFile) {
                      return (
                        <View style={{ 
                          backgroundColor: colors.warning, 
                          paddingHorizontal: 10, 
                          paddingVertical: 6, 
                          borderRadius: 12,
                          marginBottom: 8
                        }}>
                          <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                            Ana: {mainFile.name}
                          </Text>
                        </View>
                      );
                    }
                    return null;
                  })()}
                  
                  {isRunning && <ActivityIndicator color={colors.success} size="small" />}
                </View>
                
                {/* Kod editörü */}
                <View style={styles.editor}>
                  <View style={{ 
                    backgroundColor: colors.surface, 
                    padding: 8, 
                    borderBottomWidth: 1, 
                    borderBottomColor: colors.border,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>
                      💻 {currentFile.name} - {currentFile.language.toUpperCase()}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
                      {currentFile.content.split('\n').length} satır
                    </Text>
                  </View>
                  
                  <CodeEditor
                    code={currentFile.content}
                    language={currentFile.language as 'c' | 'cpp'}
                    onCodeChange={handleCodeChange}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            ) : (
              <View style={{ 
                ...styles.editor, 
                backgroundColor: colors.surface, 
                justifyContent: 'center', 
                alignItems: 'center',
                borderRadius: 8,
                margin: 8,
                borderWidth: 1,
                borderColor: colors.border
              }}>
                <Ionicons name="document-text" size={48} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>
                  {files.length === 0 ? 'Henüz dosya yok' : 'Dosya seçin'}
                </Text>
                <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12, textAlign: 'center' }}>
                  {files.length === 0 ? 
                    'Proje dosyaları yükleniyor...' : 
                    'Sol panelden bir dosya seçin'
                  }
                </Text>
                {/* Debug bilgisi */}
                <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 10, textAlign: 'center' }}>
                  Debug: currentFileId={currentFileId}, selectedFileId={selectedFileId}
                  {'\n'}Files: {files.length}, CurrentFile: {currentFile ? 'var' : 'yok'}
                </Text>
              </View>
            )}
          </View>

          {/* Çıktı gösterimi */}
          {runOutput !== '' && (
            <View style={{ 
              margin: 8,
              backgroundColor: colors.surface, 
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              maxHeight: 200
            }}>
              <View style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8
              }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                  📤 Çalıştırma Sonucu
                </Text>
              </View>
              <ScrollView style={{ padding: 12 }}>
                <Text style={{ 
                  color: colors.text, 
                  fontFamily: 'monospace',
                  fontSize: 12,
                  lineHeight: 16
                }}>
                  {runOutput}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* AI Panel - SADECE PROJE SEÇİLİYSE */}
          <View style={[styles.aiPanel, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('aiCodeBuilder.aiAssistant')}</Text>
            
            {/* ✅ SADECE AI SOHBET BUTONU */}
            <View style={styles.aiActionButtons}>
              <TouchableOpacity
                style={[styles.aiActionButton, { backgroundColor: colors.accent, flex: 1 }]}
                onPress={() => setShowAiChatModal(true)}
              >
                <Ionicons name="chatbubbles" size={16} color="white" />
                <Text style={styles.aiActionButtonText}>AI ile Sohbet</Text>
              </TouchableOpacity>
            </View>

            {/* Optimizasyon butonlarını tamamen kaldır */}

            <TextInput
              style={[styles.aiInput, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              placeholder={t('aiCodeBuilder.aiInputPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={aiInput}
              onChangeText={setAiInput}
              multiline
            />
            <View style={styles.aiButtons}>
              <Button
                title={t('aiCodeBuilder.generateCode')}
                onPress={handleAiGenerate}
                loading={isLoading}
                style={{ ...styles.aiButton, backgroundColor: colors.primary }}
              />
              <Button
                title={t('aiCodeBuilder.createFile')}
                onPress={handleAiCreateFile}
                loading={isAiFileCreating}
                style={{ ...styles.aiButton, backgroundColor: colors.accent }}
              />
            </View>
          </View>
        </View>
      ) : (
        /* Proje Seçilmediğinde Gösterilecek Mesaj */
        <View style={styles.emptyState}>
          <Ionicons name="folder-open" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            {t('aiCodeBuilder.selectProjectTitle')}
          </Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            {t('aiCodeBuilder.selectProjectDescription')}
          </Text>
          <View style={styles.emptyStateButtons}>
            <TouchableOpacity 
              style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowProjectListModal(true)}
            >
              <Ionicons name="folder-open" size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>{t('aiCodeBuilder.selectProject')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowProjectModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>{t('aiCodeBuilder.newProject')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Project Creation Modal */}
      <Modal visible={showProjectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.mobileModalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="rocket" size={24} color="#3b82f6" />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('aiCodeBuilder.createNewProject')}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowProjectModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder={t('aiCodeBuilder.projectNamePlaceholder')}
                value={projectName}
                onChangeText={setProjectName}
                style={[styles.modalInput, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border,
                  fontSize: 16,
                  minHeight: 48
                }]}
                placeholderTextColor={colors.textSecondary}
              />
              
              <TextInput
                placeholder={t('aiCodeBuilder.projectDescriptionPlaceholder')}
                value={projectDescription}
                onChangeText={setProjectDescription}
                multiline
                numberOfLines={4}
                style={[styles.modalInput, styles.textArea, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border,
                  fontSize: 16,
                  minHeight: 100
                }]}
                placeholderTextColor={colors.textSecondary}
              />
              
              <View style={styles.languageSelector}>
                <Text style={[styles.languageLabel, { color: colors.text }]}>{t('aiCodeBuilder.programmingLanguage')}</Text>
                <View style={styles.languageButtons}>
                  <TouchableOpacity
                    style={[
                      styles.languageButton,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      selectedLanguage === 'cpp' && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
                    ]}
                    onPress={() => setSelectedLanguage('cpp')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      { color: colors.text },
                      selectedLanguage === 'cpp' && { color: colors.primary, fontWeight: 'bold' }
                    ]}>C++</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.languageButton,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      selectedLanguage === 'c' && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
                    ]}
                    onPress={() => setSelectedLanguage('c')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      { color: colors.text },
                      selectedLanguage === 'c' && { color: colors.primary, fontWeight: 'bold' }
                    ]}>C</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowProjectModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('aiCodeBuilder.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.createButton,
                  { opacity: (!projectName.trim() || !projectDescription.trim() || isProjectCreating) ? 0.5 : 1 }
                ]}
                onPress={handleAiCreateProject}
                disabled={!projectName.trim() || !projectDescription.trim() || isProjectCreating}
              >
                {isProjectCreating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={styles.createButtonText}>{t('aiCodeBuilder.createWithAI')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Project List Modal */}
      <Modal visible={showProjectListModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.mobileModalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="folder-open" size={24} color="#3b82f6" />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('aiCodeBuilder.selectProject')}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowProjectListModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {isLoadingProjects ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  {t('aiCodeBuilder.loadingProjects')}
                </Text>
              </View>
            ) : projects.length === 0 ? (
              <View style={styles.emptyProjectsContainer}>
                <Ionicons name="folder-open" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyProjectsText, { color: colors.textSecondary }]}>
                  {t('aiCodeBuilder.noProjects')}
                </Text>
                <Text style={[styles.emptyProjectsSubtext, { color: colors.textSecondary }]}>
                  {t('aiCodeBuilder.createNewProjectPrompt')}
                </Text>
                <TouchableOpacity
                  style={[styles.createProjectButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setShowProjectListModal(false);
                    setShowProjectModal(true);
                  }}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.createProjectButtonText}>Yeni Proje Oluştur</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.projectsList} showsVerticalScrollIndicator={false}>
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project._id}
                    style={[
                      styles.projectItem,
                      styles.mobileProjectItem,
                      selectedProject?._id === project._id && { 
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary
                      }
                    ]}
                    onPress={() => {
                      console.log('📱 Proje seçiliyor:', project.name);
                      selectProject(project);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.projectIconContainer}>
                      <Ionicons 
                        name="folder" 
                        size={24} 
                        color={selectedProject?._id === project._id ? colors.primary : colors.textSecondary} 
                      />
                    </View>
                    <View style={styles.projectInfo}>
                      <Text style={[styles.projectName, { color: colors.text }]}>
                        {project.name}
                      </Text>
                      <Text style={[styles.projectDetails, { color: colors.textSecondary }]}>
                        {project.files.length} dosya • {project.files[0]?.language?.toUpperCase() || 'C++'}
                      </Text>
                      <Text style={[styles.projectDate, { color: colors.textSecondary }]}>
                        {new Date(project.updatedAt || project.createdAt).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                    <View style={styles.projectSelectIndicator}>
                      {selectedProject?._id === project._id ? (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      ) : (
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowProjectListModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('aiCodeBuilder.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setShowProjectListModal(false);
                  setShowProjectModal(true);
                }}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={[styles.cancelButtonText, { color: 'white' }]}>Yeni Proje</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ KOD ANALİZ MODAL */}
      <Modal visible={showAnalysisModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="analytics" size={24} color="#3b82f6" />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Kod Analizi Sonuçları</Text>
            </View>
            
            <ScrollView style={styles.analysisContent}>
              {codeAnalysis && (
                <View style={styles.analysisSection}>
                  <Text style={[styles.analysisTitle, { color: colors.text }]}>📊 Genel Kalite</Text>
                  <View style={[styles.qualityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.analysisText, { color: colors.textSecondary }]}>
                      Kalite: {codeAnalysis.quality}/100
                    </Text>
                    <Text style={[styles.analysisText, { color: colors.textSecondary }]}>
                      Karmaşıklık: {codeAnalysis.complexity}/10
                    </Text>
                    <Text style={[styles.analysisText, { color: colors.textSecondary }]}>
                      Bakım: {codeAnalysis.maintainability}/100
                    </Text>
                  </View>
                </View>
              )}
              
              {codeErrors.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={[styles.analysisTitle, { color: colors.error }]}>❌ Hatalar ({codeErrors.length})</Text>
                  {codeErrors.map((error, index) => (
                    <View key={index} style={[styles.errorItem, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
                      <Text style={[styles.errorText, { color: colors.error }]}>
                        Satır {error.line}: {error.message}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {codeSuggestions.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={[styles.analysisTitle, { color: colors.info }]}>💡 Öneriler ({codeSuggestions.length})</Text>
                  {codeSuggestions.map((suggestion, index) => (
                    <View key={index} style={[styles.suggestionItem, { backgroundColor: colors.info + '20', borderColor: colors.info + '40' }]}>
                      <Text style={[styles.suggestionText, { color: colors.text }]}>
                        {suggestion.title}
                      </Text>
                      <Text style={[styles.suggestionDescription, { color: colors.textSecondary }]}>
                        {suggestion.description}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {!codeAnalysis && codeErrors.length === 0 && codeSuggestions.length === 0 && (
                <View style={styles.emptyAnalysisContainer}>
                  <Ionicons name="analytics" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyAnalysisText, { color: colors.textSecondary }]}>
                    Analiz sonucu bulunamadı
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAnalysisModal(false)}
              >
                <Text style={styles.cancelButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ AI SOHBET MODAL */}
      <Modal visible={showAiChatModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="chatbubbles" size={24} color="#3b82f6" />
              <Text style={[styles.modalTitle, { color: colors.text }]}>AI ile Sohbet</Text>
            </View>
            
            <ScrollView style={styles.chatContent}>
              {aiChatHistory.length === 0 ? (
                <View style={styles.emptyChatContainer}>
                  <Ionicons name="chatbubbles" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyChatText, { color: colors.textSecondary }]}>
                    AI'ya kod hakkında soru sorun
                  </Text>
                  <Text style={[styles.emptyChatSubtext, { color: colors.textSecondary }]}>
                    Örnek: "Bu kodda hangi optimizasyonları yapabilirim?"
                  </Text>
                </View>
              ) : (
                aiChatHistory.map((message, index) => (
                  <View key={index} style={[
                    styles.chatMessage,
                    message.role === 'user' ? 
                      [styles.userMessage, { backgroundColor: colors.primary }] : 
                      [styles.aiMessage, { backgroundColor: colors.surface, borderColor: colors.border }]
                  ]}>
                    <View style={styles.chatMessageHeader}>
                      <Ionicons 
                        name={message.role === 'user' ? 'person' : 'sparkles'} 
                        size={14} 
                        color={message.role === 'user' ? 'white' : colors.primary} 
                      />
                      <Text style={[
                        styles.chatMessageRole,
                        { color: message.role === 'user' ? 'white' : colors.primary }
                      ]}>
                        {message.role === 'user' ? 'Siz' : 'AI Asistan'}
                      </Text>
                    </View>
                    <Text style={[
                      styles.chatMessageText,
                      { color: message.role === 'user' ? 'white' : colors.text }
                    ]}>
                      {message.content}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            
            <View style={[styles.chatInputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.chatInput, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="AI'ya kod hakkında soru sorun..."
                placeholderTextColor={colors.textSecondary}
                value={aiChatMessage}
                onChangeText={setAiChatMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  { 
                    backgroundColor: aiChatMessage.trim() ? colors.primary : colors.textSecondary,
                    opacity: aiChatMessage.trim() ? 1 : 0.5
                  }
                ]}
                onPress={sendAiChatMessage}
                disabled={isAiChatting || !aiChatMessage.trim()}
              >
                {isAiChatting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAiChatModal(false);
                  setAiChatMessage('');
                }}
              >
                <Text style={styles.cancelButtonText}>Kapat</Text>
              </TouchableOpacity>
              
              {aiChatHistory.length > 0 && (
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.warning }]}
                  onPress={() => {
                    setAiChatHistory([]);
                    setAiChatMessage('');
                  }}
                >
                  <Ionicons name="trash" size={16} color="white" />
                  <Text style={[styles.cancelButtonText, { color: 'white' }]}>Temizle</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* File Creation Modal */}
      <Modal visible={showFileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="document" size={24} color="#3b82f6" />
              <Text style={styles.modalTitle}>{t('aiCodeBuilder.createNewFile')}</Text>
            </View>
            
              <TextInput
              placeholder={t('aiCodeBuilder.fileNamePlaceholder')}
                value={newFileName}
                onChangeText={setNewFileName}
              style={styles.modalInput}
              />
            
              <TextInput
              placeholder={t('aiCodeBuilder.aiDescriptionPlaceholder')}
              value={aiInput}
              onChangeText={setAiInput}
                multiline
              numberOfLines={2}
              style={[styles.modalInput, styles.textArea]}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFileModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('aiCodeBuilder.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]}
                onPress={createFile}
              >
                <Text style={styles.createButtonText}>{t('aiCodeBuilder.emptyFile')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.createButton,
                  { opacity: (!aiInput.trim() || !newFileName.trim() || isAiFileCreating) ? 0.5 : 1 }
                ]}
                onPress={handleAiCreateFile}
                disabled={!aiInput.trim() || !newFileName.trim() || isAiFileCreating}
              >
                {isAiFileCreating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={styles.createButtonText}>{t('aiCodeBuilder.createWithAI')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  fileTree: {
    width: 250,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  fileList: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    gap: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
  },
  deleteButton: {
    padding: 4,
  },
  addFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  addFileButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
  },
  editor: {
    flex: 1,
  },
  aiPanel: {
    width: 300,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    padding: 16,
  },
  aiInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  aiButtons: {
    gap: 8,
  },
  aiButton: {
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalInput: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48, // Mobil için minimum touch area
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#3b82f6',
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  languageSelector: {
    marginBottom: 20,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#3b82f6',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  emptyStateButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emptyProjectsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProjectsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyProjectsSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  projectsList: {
    flex: 1,
    marginBottom: 16,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  projectInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  projectDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  projectDate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  projectSelectIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  createProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  createProjectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  aiActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  aiActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  aiActionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  optimizationButtons: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  optimizationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    flex: 1,
  },
  optimizationButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  analysisContent: {
    flex: 1,
    maxHeight: 300,
  },
  analysisSection: {
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    marginBottom: 4,
  },
  errorItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
  },
  suggestionItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 12,
  },
  chatContent: {
    flex: 1,
    maxHeight: 400,
    marginBottom: 16,
  },
  chatMessage: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    marginLeft: 40,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    marginRight: 40,
    borderWidth: 1,
  },
  chatMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  chatMessageRole: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 4,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyChatSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyAnalysisContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyAnalysisText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  mobileModalContent: {
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
    marginHorizontal: 'auto',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  mobileProjectItem: {
    minHeight: 80,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  projectIconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  projectInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  projectDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  projectDate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  projectSelectIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  createProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  createProjectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AiCodeBuilderScreen; 