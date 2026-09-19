import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, Input } from '../components';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import api from '../services/api';

const { width } = Dimensions.get('window');

interface Forum {
  id: string;
  name: string;
  description: string;
  postCount: number;
  memberCount: number;
  isActive: boolean;
  createdAt: Date;
}

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'question' | 'discussion' | 'announcement' | 'tutorial' | 'share';
  viewCount: number;
  voteCount: number;
  commentCount: number;
  isPinned: boolean;
  isAccepted: boolean;
  tags: string[];
  createdAt: Date;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  forum: {
    id: string;
    name: string;
  };
  media?: Array<{
    id: string;
    url: string;
    type: string;
    title?: string;
  }>;
}

const ForumScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [forums, setForums] = useState<Forum[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedForum, setSelectedForum] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchForums();
    fetchPosts();
  }, []);

  const fetchForums = async () => {
    try {
      const response = await api.get('/forum');
      setForums(response.data);
    } catch (error) {
      console.error('Error fetching forums:', error);
    }
  };

  const fetchPosts = async (forumId?: string) => {
    try {
      setLoading(true);
      const params: any = { page: 1, limit: 20 };
      if (forumId) params.forumId = forumId;
      if (filterType !== 'all') params.type = filterType;

      const response = await api.get('/forum/posts', { params });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchForums(), fetchPosts(selectedForum || undefined)]);
    setRefreshing(false);
  };

  const handleForumSelect = (forumId: string) => {
    setSelectedForum(forumId === selectedForum ? null : forumId);
    fetchPosts(forumId === selectedForum ? undefined : forumId);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchPosts(selectedForum || undefined);
      return;
    }

    try {
      setLoading(true);
      const params: any = { q: searchQuery };
      if (selectedForum) params.forumId = selectedForum;
      if (filterType !== 'all') params.type = filterType;

      const response = await api.get('/forum/search', { params });
      setPosts(response.data);
    } catch (error) {
      console.error('Error searching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return 'help-circle';
      case 'discussion': return 'chatbubbles';
      case 'announcement': return 'megaphone';
      case 'tutorial': return 'school';
      case 'share': return 'share';
      default: return 'document';
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'question': return colors.primary;
      case 'discussion': return colors.secondary;
      case 'announcement': return colors.warning;
      case 'tutorial': return colors.success;
      case 'share': return colors.accent;
      default: return colors.textSecondary;
    }
  };

  const renderForumItem = ({ item }: { item: Forum }) => (
    <TouchableOpacity
      style={[
        styles.forumItem,
        {
          backgroundColor: selectedForum === item.id ? colors.primary + '20' : colors.surface,
          borderColor: selectedForum === item.id ? colors.primary : colors.border,
        }
      ]}
      onPress={() => handleForumSelect(item.id)}
    >
      <View style={styles.forumHeader}>
        <Text style={[typography.h4, { color: colors.text }]}>
          {item.name}
        </Text>
        <View style={[styles.forumBadge, { backgroundColor: colors.primary }]}>
          <Text style={[typography.caption, { color: colors.textOnPrimary }]}>
            {item.postCount}
          </Text>
        </View>
      </View>
      <Text style={[typography.body2, { color: colors.textSecondary }]}>
        {item.description}
      </Text>
      <View style={styles.forumStats}>
        <View style={styles.statItem}>
          <Ionicons name="document-text" size={16} color={colors.textTertiary} />
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {item.postCount} posts
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color={colors.textTertiary} />
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {item.memberCount} members
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }: { item: Post }) => (
    <Card style={styles.postCard} onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
      <View style={styles.postHeader}>
        <View style={styles.postTypeContainer}>
          <Ionicons 
            name={getPostTypeIcon(item.type) as any} 
            size={20} 
            color={getPostTypeColor(item.type)} 
          />
          <Text style={[typography.caption, { color: getPostTypeColor(item.type), marginLeft: 4 }]}>
            {item.type.toUpperCase()}
          </Text>
        </View>
        {item.isPinned && (
          <Ionicons name="pin" size={16} color={colors.warning} />
        )}
      </View>

      <Text style={[typography.h5, { color: colors.text, marginBottom: 8 }]}>
        {item.title}
      </Text>

      <Text style={[typography.body2, { color: colors.textSecondary, marginBottom: 12 }]} numberOfLines={3}>
        {item.content}
      </Text>

      {item.media && item.media.length > 0 && (
        <View style={styles.mediaPreview}>
          <Ionicons name="image" size={16} color={colors.textTertiary} />
          <Text style={[typography.caption, { color: colors.textTertiary, marginLeft: 4 }]}>
            {item.media.length} attachment{item.media.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[typography.caption, { color: colors.primary }]}>
                #{tag}
              </Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              +{item.tags.length - 3} more
            </Text>
          )}
        </View>
      )}

      <View style={styles.postFooter}>
        <View style={styles.postAuthor}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            by {item.author.username}
          </Text>
        </View>
        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={14} color={colors.textTertiary} />
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {item.viewCount}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="thumbs-up" size={14} color={colors.textTertiary} />
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {item.voteCount}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={14} color={colors.textTertiary} />
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {item.commentCount}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaViewRN style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryGradient[0], colors.primaryGradient[1]]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={[typography.h2, { color: colors.textOnPrimary }]}>
            {t('forum.title')}
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Ionicons name="add" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <Input
            placeholder={t('forum.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            icon="search"
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.surface }]}
            onPress={() => {/* Show filter modal */}}
          >
            <Ionicons name="filter" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Forums List */}
        <FlatList
          data={forums}
          keyExtractor={(item) => item.id}
          renderItem={renderForumItem}
          contentContainerStyle={styles.forumList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />

        {/* Posts List */}
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          contentContainerStyle={styles.postList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      </View>
    </SafeAreaViewRN>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 100,
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    padding: 10,
  },
  forumList: {
    padding: 10,
  },
  forumItem: {
    padding: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 5,
  },
  forumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  forumBadge: {
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  forumStats: {
    flexDirection: 'row',
    marginTop: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  postList: {
    padding: 10,
  },
  postCard: {
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  postTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  tag: {
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  postAuthor: {
    flex: 1,
  },
  postStats: {
    flexDirection: 'row',
  },
});

export default ForumScreen; 