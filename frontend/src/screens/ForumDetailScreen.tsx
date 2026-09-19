import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { useAuth } from '../context/AuthContext';
import forumService, { Question, Answer, Comment } from '../services/forumService';

interface RouteParams {
  questionId: string;
}

export const ForumDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { questionId } = route.params as RouteParams;
  const { colors, typography } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [activeCommentInput, setActiveCommentInput] = useState<string | null>(null);
  const [votedItems, setVotedItems] = useState<Set<string>>(new Set());
  const [voteCounts, setVoteCounts] = useState<{[key: string]: {upvotes: number; downvotes: number; total: number}}>({});
  const [userVotes, setUserVotes] = useState<{[key: string]: {hasVoted: boolean; voteType?: 1 | -1}}>({});

  useEffect(() => {
    loadQuestionDetail();
  }, [questionId]);

  const loadQuestionDetail = async () => {
    try {
      setLoading(true);
      const questionData = await forumService.getQuestionById(questionId);
      setQuestion(questionData);
      setAnswers(questionData.answers || []);
      setComments(questionData.comments || []);
      
      // Load vote counts
      await loadVoteCounts(questionData);
    } catch (error) {
      console.error('Error loading question:', error);
      Alert.alert('Hata', 'Soru yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const loadVoteCounts = async (questionData: Question) => {
    try {
      // Load question vote counts
      const questionVotes = await forumService.getQuestionVotes(questionData.id);
      setVoteCounts(prev => ({
        ...prev,
        [`question-${questionData.id}`]: questionVotes
      }));

      // Load question user vote status
      const questionUserVote = await forumService.getQuestionVoteStatus(questionData.id);
      setUserVotes(prev => ({
        ...prev,
        [`question-${questionData.id}`]: {
          hasVoted: questionUserVote.hasVoted,
          voteType: questionUserVote.voteType === 'UP' ? 1 : questionUserVote.voteType === 'DOWN' ? -1 : undefined
        }
      }));

      // Load answer vote counts and user vote status
      if (questionData.answers && questionData.answers.length > 0) {
        for (const answer of questionData.answers) {
          const answerVotes = await forumService.getAnswerVotes(answer.id);
          setVoteCounts(prev => ({
            ...prev,
            [`answer-${answer.id}`]: answerVotes
          }));

          const answerUserVote = await forumService.getAnswerVoteStatus(answer.id);
          setUserVotes(prev => ({
            ...prev,
            [`answer-${answer.id}`]: {
              hasVoted: answerUserVote.hasVoted,
              voteType: answerUserVote.voteType === 'UP' ? 1 : answerUserVote.voteType === 'DOWN' ? -1 : undefined
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading vote counts:', error);
    }
  };

  const handleVote = async (type: 'question' | 'answer', id: string, voteType: 1 | -1) => {
    const voteKey = `${type}-${id}`;
    const currentUserVote = userVotes[voteKey];
    
    try {
      if (type === 'question') {
        await forumService.voteQuestion(id, { type: voteType });
        // Update question vote counts
        const questionVotes = await forumService.getQuestionVotes(id);
        setVoteCounts(prev => ({
          ...prev,
          [`question-${id}`]: questionVotes
        }));
        
        // Update user vote status
        const questionUserVote = await forumService.getQuestionVoteStatus(id);
        setUserVotes(prev => ({
          ...prev,
          [`question-${id}`]: {
            hasVoted: questionUserVote.hasVoted,
            voteType: questionUserVote.voteType === 'UP' ? 1 : questionUserVote.voteType === 'DOWN' ? -1 : undefined
          }
        }));
      } else {
        await forumService.voteAnswer(id, { type: voteType });
        // Update answer vote counts
        const answerVotes = await forumService.getAnswerVotes(id);
        setVoteCounts(prev => ({
          ...prev,
          [`answer-${id}`]: answerVotes
        }));
        
        // Update user vote status
        const answerUserVote = await forumService.getAnswerVoteStatus(id);
        setUserVotes(prev => ({
          ...prev,
          [`answer-${id}`]: {
            hasVoted: answerUserVote.hasVoted,
            voteType: answerUserVote.voteType === 'UP' ? 1 : answerUserVote.voteType === 'DOWN' ? -1 : undefined
          }
        }));
      }
      
      // Show appropriate message
      if (currentUserVote?.hasVoted) {
        if (currentUserVote.voteType === voteType) {
          Alert.alert('Bilgi', 'Oyunuz kaldırıldı.');
        } else {
          Alert.alert('Bilgi', 'Oyunuz değiştirildi.');
        }
      } else {
        Alert.alert('Başarılı', 'Oyunuz kaydedildi!');
      }
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Hata', 'Oylama yapılırken bir hata oluştu.');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      Alert.alert('Hata', 'Lütfen bir cevap yazın.');
      return;
    }

    if (answerText.trim().length < 10) {
      Alert.alert('Hata', 'Cevap en az 10 karakter olmalıdır.');
      return;
    }

    try {
      setSubmitting(true);
      const newAnswer = await forumService.createAnswer(questionId, { content: answerText });
      setAnswers(prev => [...prev, newAnswer]);
      setAnswerText('');
      setShowAnswerInput(false);
      setQuestion(prev => prev ? { ...prev, answerCount: prev.answerCount + 1 } : null);
    } catch (error) {
      console.error('Error submitting answer:', error);
      Alert.alert('Hata', 'Cevap gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async (type: 'question' | 'answer', id: string) => {
    if (!commentText.trim()) {
      Alert.alert('Hata', 'Lütfen bir yorum yazın.');
      return;
    }

    if (commentText.trim().length < 5) {
      Alert.alert('Hata', 'Yorum en az 5 karakter olmalıdır.');
      return;
    }

    try {
      setSubmitting(true);
      let newComment: Comment;
      
      if (type === 'question') {
        newComment = await forumService.createQuestionComment(id, { content: commentText });
        setComments(prev => [...prev, newComment]);
      } else {
        newComment = await forumService.createAnswerComment(id, { content: commentText });
        setAnswers(prev => prev.map(answer => 
          answer.id === id ? { ...answer, comments: [...(answer.comments || []), newComment] } : answer
        ));
      }
      
      setCommentText('');
      setShowCommentInput(false);
      setActiveCommentInput(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Hata', 'Yorum gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderVoteButtons = (type: 'question' | 'answer', id: string, voteCount: number) => {
    const voteKey = `${type}-${id}`;
    const voteData = voteCounts[voteKey] || { upvotes: 0, downvotes: 0, total: voteCount };
    const userVote = userVotes[voteKey];
    
    return (
      <View style={styles.voteContainer}>
        <TouchableOpacity
          style={[
            styles.voteButton,
            { 
              backgroundColor: colors.surfaceSecondary,
              borderColor: userVote?.voteType === 1 ? colors.success : colors.border 
            }
          ]}
          onPress={() => handleVote(type, id, 1)}
        >
          <Ionicons 
            name={userVote?.voteType === 1 ? "heart" : "heart-outline"} 
            size={18} 
            color={userVote?.voteType === 1 ? colors.success : colors.textSecondary} 
          />
        </TouchableOpacity>
        
        <View style={styles.voteCountsContainer}>
          <Text style={[styles.voteCount, { color: colors.text }]}>
            {voteData.upvotes}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.voteButton,
            { 
              backgroundColor: colors.surfaceSecondary,
              borderColor: userVote?.voteType === -1 ? colors.error : colors.border 
            }
          ]}
          onPress={() => handleVote(type, id, -1)}
        >
          <Ionicons 
            name={userVote?.voteType === -1 ? "heart-dislike" : "heart-dislike-outline"} 
            size={18} 
            color={userVote?.voteType === -1 ? colors.error : colors.textSecondary} 
          />
        </TouchableOpacity>
        
        <View style={styles.voteCountsContainer}>
          <Text style={[styles.voteCount, { color: colors.text }]}>
            {voteData.downvotes}
          </Text>
        </View>
      </View>
    );
  };

  const renderAuthorInfo = (author: any, date: string) => {
    if (!author || typeof author !== 'object') {
      return (
        <View style={styles.authorInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>
              ?
            </Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>
              Bilinmeyen Kullanıcı
            </Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {date ? new Date(date).toLocaleDateString('tr-TR') : 'Tarih bilgisi yok'}
            </Text>
          </View>
        </View>
      );
    }

    const firstName = author.firstName || '';
    const lastName = author.lastName || '';
    
    if (!firstName && !lastName) {
      return (
        <View style={styles.authorInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>
              ?
            </Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>
              Bilinmeyen Kullanıcı
            </Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {date ? new Date(date).toLocaleDateString('tr-TR') : 'Tarih bilgisi yok'}
            </Text>
          </View>
        </View>
      );
    }

    const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase();
    const fullName = `${firstName} ${lastName}`.trim();

    return (
      <View style={styles.authorInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>
            {initials || '?'}
          </Text>
        </View>
        <View>
          <Text style={[styles.authorName, { color: colors.text }]}>
            {fullName || 'Bilinmeyen Kullanıcı'}
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {date ? new Date(date).toLocaleDateString('tr-TR') : 'Tarih bilgisi yok'}
          </Text>
        </View>
      </View>
    );
  };

  const renderQuestion = () => {
    if (!question) return null;

    return (
      <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
        <View style={styles.questionHeader}>
          {renderAuthorInfo(question.author, question.createdAt)}
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.categoryText, { color: colors.textOnPrimary }]}>
              {question.category}
            </Text>
          </View>
        </View>

        <Text style={[styles.questionTitle, { color: colors.text }]}>
          {question.title}
        </Text>

        <Text style={[styles.questionContent, { color: colors.text }]}>
          {question.content}
        </Text>

        <View style={styles.questionFooter}>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                {question.viewCount}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                {question.answerCount}
              </Text>
            </View>
          </View>

          <View style={styles.tags}>
            {question.tags.map(tag => (
              <View key={tag.id} style={[styles.tag, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  {tag.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {renderVoteButtons('question', question.id, question.voteCount)}

        <TouchableOpacity
          style={styles.commentButton}
          onPress={() => setShowCommentInput(!showCommentInput)}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
          <Text style={[styles.commentButtonText, { color: colors.primary }]}>
            Yorum Yap
          </Text>
        </TouchableOpacity>

        {showCommentInput && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={[styles.commentInput, { 
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border 
              }]}
              placeholder="Yorumunuzu yazın... (en az 5 karakter)"
              placeholderTextColor={colors.textTertiary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              {commentText.length}/5 karakter
            </Text>
            <View style={styles.commentInputActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowCommentInput(false);
                  setCommentText('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  İptal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton, 
                  { 
                    backgroundColor: (submitting || commentText.trim().length < 5) 
                      ? colors.textTertiary 
                      : colors.primary 
                  }
                ]}
                onPress={() => handleSubmitComment('question', question.id)}
                disabled={submitting || commentText.trim().length < 5}
              >
                <Text style={[styles.submitButtonText, { color: colors.textOnPrimary }]}>
                  {submitting ? 'Gönderiliyor...' : 'Gönder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {comments.length > 0 && (
          <View style={styles.commentsSection}>
            <Text style={[styles.commentsTitle, { color: colors.text }]}>
              Yorumlar ({comments.length})
            </Text>
            {comments.map(comment => (
              <View key={comment.id} style={styles.commentItem}>
                {renderAuthorInfo(comment.author, comment.createdAt)}
                <Text style={[styles.commentText, { color: colors.text }]}>
                  {comment.content}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderAnswer = (answer: Answer) => (
    <View key={answer.id} style={[styles.answerCard, { backgroundColor: colors.surface }]}>
      <View style={styles.answerHeader}>
        {renderAuthorInfo(answer.author, answer.createdAt)}
        {answer.isAccepted && (
          <View style={[styles.acceptedBadge, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.textOnPrimary} />
            <Text style={[styles.acceptedText, { color: colors.textOnPrimary }]}>
              Kabul Edildi
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.answerContent, { color: colors.text }]}>
        {answer.content}
      </Text>

      <View style={styles.answerFooter}>
        {renderVoteButtons('answer', answer.id, answer.voteCount)}

        <TouchableOpacity
          style={styles.commentButton}
          onPress={() => setActiveCommentInput(activeCommentInput === answer.id ? null : answer.id)}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
          <Text style={[styles.commentButtonText, { color: colors.primary }]}>
            Yorum Yap
          </Text>
        </TouchableOpacity>
      </View>

      {activeCommentInput === answer.id && (
        <View style={styles.commentInputContainer}>
          <TextInput
            style={[styles.commentInput, { 
              color: colors.text,
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border 
            }]}
            placeholder="Yorumunuzu yazın... (en az 5 karakter)"
            placeholderTextColor={colors.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {commentText.length}/5 karakter
          </Text>
          <View style={styles.commentInputActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => {
                setActiveCommentInput(null);
                setCommentText('');
              }}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                İptal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton, 
                { 
                  backgroundColor: (submitting || commentText.trim().length < 5) 
                    ? colors.textTertiary 
                    : colors.primary 
                }
              ]}
              onPress={() => handleSubmitComment('answer', answer.id)}
              disabled={submitting || commentText.trim().length < 5}
            >
              <Text style={[styles.submitButtonText, { color: colors.textOnPrimary }]}>
                {submitting ? 'Gönderiliyor...' : 'Gönder'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {answer.comments && answer.comments.length > 0 && (
        <View style={styles.commentsSection}>
          {answer.comments.map(comment => (
            <View key={comment.id} style={styles.commentItem}>
              {renderAuthorInfo(comment.author, comment.createdAt)}
              <Text style={[styles.commentText, { color: colors.text }]}>
                {comment.content}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={colors.primaryGradient as any} style={styles.headerGradient}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>Soru Detayı</Text>
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
      <LinearGradient colors={colors.primaryGradient as any} style={styles.headerGradient}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>Soru Detayı</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderQuestion()}

          <View style={styles.answersSection}>
            <Text style={[styles.answersTitle, { color: colors.text }]}>
              Cevaplar ({answers.length})
            </Text>
            {answers.map(renderAnswer)}
          </View>

          {!showAnswerInput && (
            <TouchableOpacity
              style={[styles.addAnswerButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAnswerInput(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.textOnPrimary} />
              <Text style={[styles.addAnswerText, { color: colors.textOnPrimary }]}>
                Cevap Yaz
              </Text>
            </TouchableOpacity>
          )}

          {showAnswerInput && (
            <View style={[styles.answerInputContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.answerInputTitle, { color: colors.text }]}>
                Cevabınızı Yazın
              </Text>
              <TextInput
                style={[styles.answerInput, { 
                  color: colors.text,
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border 
                }]}
                placeholder="Cevabınızı detaylı bir şekilde yazın... (en az 10 karakter)"
                placeholderTextColor={colors.textTertiary}
                value={answerText}
                onChangeText={setAnswerText}
                multiline
                numberOfLines={6}
              />
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                {answerText.length}/10 karakter
              </Text>
              <View style={styles.answerInputActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => {
                    setShowAnswerInput(false);
                    setAnswerText('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                    İptal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton, 
                    { 
                      backgroundColor: (submitting || answerText.trim().length < 10) 
                        ? colors.textTertiary 
                        : colors.primary 
                    }
                  ]}
                  onPress={handleSubmitAnswer}
                  disabled={submitting || answerText.trim().length < 10}
                >
                  <Text style={[styles.submitButtonText, { color: colors.textOnPrimary }]}>
                    {submitting ? 'Gönderiliyor...' : 'Cevabı Gönder'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  questionCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 24,
  },
  questionContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  voteButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteCountsContainer: {
    minWidth: 24,
    alignItems: 'center',
  },
  voteCount: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  commentButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentInputContainer: {
    marginTop: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  commentInputActions: {
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
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  commentItem: {
    marginBottom: 12,
    paddingLeft: 16,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  answersSection: {
    margin: 16,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  answerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acceptedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  answerContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  answerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addAnswerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  answerInputContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  answerInputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  answerInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  answerInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
}); 