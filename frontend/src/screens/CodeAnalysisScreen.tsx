import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { Button, Card, ZipUploader } from '../components';
import api from '../services/api';

interface CodeAnalysisScreenProps {
  // Props removed - using React Navigation hooks instead
}

interface Analysis {
  _id: string;
  projectName: string;
  originalFileName: string;
  analysis: {
    totalFiles: number;
    totalLines: number;
    languages: string[];
    complexity: number;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      file: string;
      line?: number;
      suggestion?: string;
    }>;
    suggestions: Array<{
      category: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      codeExample?: string;
    }>;
    metrics: {
      cyclomaticComplexity: number;
      maintainabilityIndex: number;
      codeDuplication: number;
      documentationCoverage: number;
    };
  };
  aiRecommendations: string;
  createdAt: string;
}

export const CodeAnalysisScreen: React.FC<CodeAnalysisScreenProps> = () => {
  const { colors, typography } = useTheme();
  const { t } = useI18n();
  const navigation = useNavigation();
  
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/code-analysis/analyses');
      setAnalyses(response.data.analyses);
    } catch (error) {
      console.error('Error loading analyses:', error);
      Alert.alert('Hata', 'Analizler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyses();
    setRefreshing(false);
  };

  const handleFileUpload = async (uri: string, name: string) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'application/zip',
        name,
      } as any);
      formData.append('projectName', name.replace('.zip', ''));

      const response = await api.post('/code-analysis/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.analysisId) {
        Alert.alert('Başarılı', 'Dosya yüklendi ve analiz başlatıldı.');
        loadAnalyses();
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Hata', 'Dosya yüklenirken bir hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAnalysis = async (analysisId: string) => {
    Alert.alert(
      'Analizi Sil',
      'Bu analizi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/code-analysis/analyses/${analysisId}`);
              loadAnalyses();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Hata', 'Analiz silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'error': return colors.error;
      case 'warning': return colors.warning;
      case 'info': return colors.info;
      default: return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kod Analizi</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Yeni Analiz
          </Text>
          <ZipUploader
            onFileSelected={handleFileUpload}
            isUploading={isUploading}
            isAnalyzing={isAnalyzing}
          />
        </View>

        {/* Analyses List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Analiz Geçmişi
          </Text>
          
          {analyses.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="analytics" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Henüz kod analizi yapmadınız
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                ZIP dosyanızı yükleyerek ilk analizinizi başlatın
              </Text>
            </Card>
          ) : (
            analyses.map((analysis) => (
              <Card key={analysis._id} style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <View style={styles.analysisInfo}>
                    <Text style={[styles.projectName, { color: colors.text }]}>
                      {analysis.projectName}
                    </Text>
                    <Text style={[styles.fileName, { color: colors.textSecondary }]}>
                      {analysis.originalFileName}
                    </Text>
                    <Text style={[styles.date, { color: colors.textTertiary }]}>
                      {new Date(analysis.createdAt).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteAnalysis(analysis._id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>

                {/* Metrics */}
                <View style={styles.metricsContainer}>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>
                      {analysis.analysis.totalFiles}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Dosya
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>
                      {analysis.analysis.totalLines}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Satır
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>
                      {analysis.analysis.issues.length}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Sorun
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>
                      {analysis.analysis.suggestions.length}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Öneri
                    </Text>
                  </View>
                </View>

                {/* Languages */}
                <View style={styles.languagesContainer}>
                  {analysis.analysis.languages.map((lang) => (
                    <View key={lang} style={[styles.languageTag, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.languageText, { color: colors.primary }]}>
                        {lang.toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Issues Summary */}
                {analysis.analysis.issues.length > 0 && (
                  <View style={styles.issuesContainer}>
                    <Text style={[styles.issuesTitle, { color: colors.text }]}>
                      Tespit Edilen Sorunlar:
                    </Text>
                    {analysis.analysis.issues.slice(0, 3).map((issue, index) => (
                      <View key={index} style={styles.issueItem}>
                        <View style={[styles.issueDot, { backgroundColor: getIssueColor(issue.type) }]} />
                        <Text style={[styles.issueText, { color: colors.text }]}>
                          {issue.message}
                        </Text>
                      </View>
                    ))}
                    {analysis.analysis.issues.length > 3 && (
                      <Text style={[styles.moreIssues, { color: colors.textTertiary }]}>
                        +{analysis.analysis.issues.length - 3} daha...
                      </Text>
                    )}
                  </View>
                )}

                {/* AI Recommendations Preview */}
                {analysis.aiRecommendations && (
                  <View style={styles.recommendationsContainer}>
                    <Text style={[styles.recommendationsTitle, { color: colors.text }]}>
                      AI Önerileri:
                    </Text>
                    <Text style={[styles.recommendationsText, { color: colors.textSecondary }]}>
                      {analysis.aiRecommendations.substring(0, 150)}...
                    </Text>
                  </View>
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  analysisCard: {
    marginBottom: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analysisInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  languageTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  issuesContainer: {
    marginBottom: 16,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  issueText: {
    fontSize: 13,
    flex: 1,
  },
  moreIssues: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  recommendationsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationsText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default CodeAnalysisScreen; 