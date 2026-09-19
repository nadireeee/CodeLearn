import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { useAuth } from '../context/AuthContext';
import forumService, { CreateQuestionDto } from '../services/forumService';

export const CreateQuestionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, typography } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'C' | 'C++'>('C');
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string }>>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tagsData = await forumService.getTags();
      setAvailableTags(tagsData);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    if (!trimmedTag) return;

    if (tags.includes(trimmedTag)) {
      Alert.alert('Hata', 'Bu etiket zaten eklenmiş.');
      return;
    }

    if (tags.length >= 5) {
      Alert.alert('Hata', 'En fazla 5 etiket ekleyebilirsiniz.');
      return;
    }

    setTags(prev => [...prev, trimmedTag]);
    setNewTag('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen bir başlık girin.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Hata', 'Lütfen soru içeriğini girin.');
      return;
    }

    if (title.length < 10) {
      Alert.alert('Hata', 'Başlık en az 10 karakter olmalıdır.');
      return;
    }

    if (content.length < 20) {
      Alert.alert('Hata', 'Soru içeriği en az 20 karakter olmalıdır.');
      return;
    }

    try {
      setSubmitting(true);
      const questionData: CreateQuestionDto = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags.length > 0 ? tags : undefined,
      };

      const newQuestion = await forumService.createQuestion(questionData);
      
      Alert.alert(
        'Başarılı',
        'Sorunuz başarıyla oluşturuldu!',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.navigate('ForumDetail', { questionId: newQuestion.id })
          }
        ]
      );
    } catch (error) {
      console.error('Error creating question:', error);
      Alert.alert('Hata', 'Soru oluşturulurken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTagSuggestions = () => {
    if (!showTagInput) return null;

    const filteredTags = availableTags.filter(tag => 
      tag.name.toLowerCase().includes(newTag.toLowerCase()) &&
      !tags.includes(tag.name.toLowerCase())
    );

    return (
      <View style={[styles.tagSuggestions, { backgroundColor: colors.surface }]}>
        {filteredTags.slice(0, 5).map(tag => (
          <TouchableOpacity
            key={tag.id}
            style={[styles.tagSuggestion, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => handleAddTag(tag.name)}
          >
            <Text style={[styles.tagSuggestionText, { color: colors.primary }]}>
              {tag.name}
            </Text>
          </TouchableOpacity>
        ))}
        {newTag.trim() && !filteredTags.find(tag => tag.name.toLowerCase() === newTag.toLowerCase()) && (
          <TouchableOpacity
            style={[styles.tagSuggestion, { backgroundColor: colors.primary }]}
            onPress={() => handleAddTag(newTag)}
          >
            <Text style={[styles.tagSuggestionText, { color: colors.textOnPrimary }]}>
              "{newTag}" ekle
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={colors.primaryGradient} style={styles.headerGradient}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>Soru Oluştur</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.primaryGradient} style={styles.headerGradient}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>Soru Oluştur</Text>
        <TouchableOpacity
          style={[styles.submitHeaderButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={[styles.submitHeaderButtonText, { color: colors.textOnPrimary }]}>
            {submitting ? 'Gönderiliyor...' : 'Gönder'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Kategori Seçimi */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Kategori
            </Text>
            <View style={styles.categoryContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  category === 'C' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setCategory('C')}
              >
                <Ionicons 
                  name="code" 
                  size={20} 
                  color={category === 'C' ? colors.textOnPrimary : colors.text} 
                />
                <Text style={[
                  styles.categoryButtonText,
                  { color: category === 'C' ? colors.textOnPrimary : colors.text }
                ]}>
                  C Programlama
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  category === 'C++' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setCategory('C++')}
              >
                <Ionicons 
                  name="code-slash" 
                  size={20} 
                  color={category === 'C++' ? colors.textOnPrimary : colors.text} 
                />
                <Text style={[
                  styles.categoryButtonText,
                  { color: category === 'C++' ? colors.textOnPrimary : colors.text }
                ]}>
                  C++
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Başlık */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Başlık *
            </Text>
            <TextInput
              style={[styles.titleInput, { 
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }]}
              placeholder="Sorunuzu kısaca özetleyen bir başlık yazın..."
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={255}
            />
            <View style={styles.validationContainer}>
              <Text style={[
                styles.characterCount, 
                { color: title.length >= 10 ? colors.success : colors.error }
              ]}>
                {title.length}/255
              </Text>
              {title.length > 0 && title.length < 10 && (
                <Text style={[styles.validationError, { color: colors.error }]}>
                  En az 10 karakter gerekli
                </Text>
              )}
            </View>
          </View>

          {/* İçerik */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Soru İçeriği *
            </Text>
            <TextInput
              style={[styles.contentInput, { 
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }]}
              placeholder="Sorunuzu detaylı bir şekilde açıklayın. Kod örnekleri, hata mesajları ve denediğiniz çözümleri ekleyebilirsiniz..."
              placeholderTextColor={colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />
            <View style={styles.validationContainer}>
              <Text style={[
                styles.characterCount, 
                { color: content.length >= 20 ? colors.success : colors.error }
              ]}>
                {content.length} karakter
              </Text>
              {content.length > 0 && content.length < 20 && (
                <Text style={[styles.validationError, { color: colors.error }]}>
                  En az 20 karakter gerekli
                </Text>
              )}
            </View>
          </View>

          {/* Etiketler */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Etiketler (İsteğe bağlı)
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Sorunuzu daha iyi kategorize etmek için etiketler ekleyin
            </Text>
            
            <View style={styles.tagsContainer}>
              {tags.map(tag => (
                <View key={tag} style={[styles.tagItem, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.tagText, { color: colors.textOnPrimary }]}>
                    {tag}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                    <Ionicons name="close-circle" size={16} color={colors.textOnPrimary} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {tags.length < 5 && (
                <TouchableOpacity
                  style={[styles.addTagButton, { borderColor: colors.border }]}
                  onPress={() => setShowTagInput(true)}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                  <Text style={[styles.addTagText, { color: colors.primary }]}>
                    Etiket Ekle
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {showTagInput && (
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.tagInput, { 
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border 
                  }]}
                  placeholder="Etiket adı..."
                  placeholderTextColor={colors.textTertiary}
                  value={newTag}
                  onChangeText={setNewTag}
                  autoFocus
                />
                {renderTagSuggestions()}
                <View style={styles.tagInputActions}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.border }]}
                    onPress={() => {
                      setShowTagInput(false);
                      setNewTag('');
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                      İptal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleAddTag(newTag)}
                  >
                    <Text style={[styles.addButtonText, { color: colors.textOnPrimary }]}>
                      Ekle
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Popüler Etiketler */}
          {!showTagInput && availableTags.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Popüler Etiketler
              </Text>
              <View style={styles.popularTags}>
                {availableTags.slice(0, 10).map(tag => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.popularTag, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => handleAddTag(tag.name)}
                    disabled={tags.includes(tag.name.toLowerCase())}
                  >
                    <Text style={[
                      styles.popularTagText, 
                      { 
                        color: tags.includes(tag.name.toLowerCase()) 
                          ? colors.textTertiary 
                          : colors.primary 
                      }
                    ]}>
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Gönder Butonu */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                (!title.trim() || !content.trim() || title.length < 10 || content.length < 20 || submitting) && { opacity: 0.6 }
              ]}
              onPress={handleSubmit}
              disabled={!title.trim() || !content.trim() || title.length < 10 || content.length < 20 || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Ionicons name="send" size={20} color={colors.textOnPrimary} />
              )}
              <Text style={[styles.submitButtonText, { color: colors.textOnPrimary }]}>
                {submitting ? 'Gönderiliyor...' : 'Soruyu Gönder'}
              </Text>
            </TouchableOpacity>
            {(!title.trim() || !content.trim() || title.length < 10 || content.length < 20) && (
              <Text style={[styles.validationError, { color: colors.error, textAlign: 'center', marginTop: 8 }]}>
                {!title.trim() ? 'Başlık gerekli' : 
                 !content.trim() ? 'İçerik gerekli' :
                 title.length < 10 ? 'Başlık en az 10 karakter olmalı' :
                 'İçerik en az 20 karakter olmalı'}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  submitHeaderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 200,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagInputContainer: {
    marginTop: 8,
  },
  tagInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  tagSuggestions: {
    marginTop: 8,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagSuggestion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  tagSuggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  popularTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  validationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validationError: {
    fontSize: 12,
    color: 'red',
  },
}); 