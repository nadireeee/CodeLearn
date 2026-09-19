import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import forumService, { Question, GetQuestionsQuery } from '../services/forumService';

export const ForumListScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, typography } = useTheme();
  const { t } = useI18n();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'C' | 'C++' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'most_voted' | 'most_viewed'>('newest');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadQuestions = async (refresh = false) => {
    try {
      if (refresh) {
        setPage(0);
        setHasMore(true);
      }

      const query: GetQuestionsQuery = {
        search: searchText || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        sortBy,
        page: refresh ? 0 : page,
        limit: 20,
      };

      const response = await forumService.getQuestions(query);
      
      if (refresh) {
        setQuestions(response.questions);
      } else {
        setQuestions(prev => [...prev, ...response.questions]);
      }
      
      setHasMore(response.questions.length === 20);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuestions(true);
  }, [searchText, selectedCategory, sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    loadQuestions(true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      loadQuestions();
    }
  };

  const renderQuestionItem = ({ item }: { item: Question }) => (
    <TouchableOpacity
      style={[styles.questionCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('ForumDetail', { questionId: item.id })}
    >
      <View style={styles.questionHeader}>
        <View style={styles.authorInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>
              {item.author.firstName[0]}{item.author.lastName[0]}
            </Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>
              {item.author.firstName} {item.author.lastName}
            </Text>
            <Text style={[styles.questionDate, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.categoryText, { color: colors.textOnPrimary }]}>
            {item.category}
          </Text>
        </View>
      </View>

      <Text style={[styles.questionTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title}
      </Text>

      <Text style={[styles.questionContent, { color: colors.textSecondary }]} numberOfLines={3}>
        {item.content}
      </Text>

      <View style={styles.questionFooter}>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.statText, { color: colors.textTertiary }]}>
              {item.viewCount}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.statText, { color: colors.textTertiary }]}>
              {item.answerCount}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="arrow-up-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.statText, { color: colors.textTertiary }]}>
              {item.voteCount}
            </Text>
          </View>
        </View>

        <View style={styles.tags}>
          {item.tags.slice(0, 3).map(tag => (
            <View key={tag.id} style={[styles.tag, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {tag.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Sorularda ara..."
          placeholderTextColor={colors.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.filters}>
        <View style={styles.categoryFilter}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[
              styles.categoryButtonText,
              { color: selectedCategory === 'all' ? colors.textOnPrimary : colors.text }
            ]}>
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'C' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedCategory('C')}
          >
            <Text style={[
              styles.categoryButtonText,
              { color: selectedCategory === 'C' ? colors.textOnPrimary : colors.text }
            ]}>
              C
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'C++' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedCategory('C++')}
          >
            <Text style={[
              styles.categoryButtonText,
              { color: selectedCategory === 'C++' ? colors.textOnPrimary : colors.text }
            ]}>
              C++
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            const sorts: Array<'newest' | 'most_voted' | 'most_viewed'> = ['newest', 'most_voted', 'most_viewed'];
            const currentIndex = sorts.indexOf(sortBy);
            const nextIndex = (currentIndex + 1) % sorts.length;
            setSortBy(sorts[nextIndex]);
          }}
        >
          <Ionicons name="funnel-outline" size={20} color={colors.primary} />
          <Text style={[styles.sortText, { color: colors.primary }]}>
            {sortBy === 'newest' ? 'En Yeni' : sortBy === 'most_voted' ? 'En Çok Oylanan' : 'En Çok Görüntülenen'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={colors.primaryGradient} style={styles.headerGradient}>
          <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>Forum</Text>
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
        <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>Forum</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateQuestion')}
        >
          <Ionicons name="add" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={questions}
        renderItem={renderQuestionItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          hasMore && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )
        }
        contentContainerStyle={styles.listContainer}
      />
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  questionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  questionDate: {
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  questionContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
}); 