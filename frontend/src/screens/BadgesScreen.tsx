import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { badgeApi } from '../services/api';
import FuturisticNavbar from '../components/FuturisticNavbar';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Badge {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  rarity: string;
  category: string;
  earnedAt?: Date;
  isNew?: boolean;
}

interface BadgesScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

const BadgesScreen: React.FC<BadgesScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isAuthenticated && user) {
      loadBadges();
    }
  }, [isAuthenticated, user]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const response = await badgeApi.getUserBadges();
      console.log('Badges response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setBadges(response.data);
      } else {
        console.error('Invalid badges response:', response.data);
        setBadges([]);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
      Alert.alert('Hata', 'Rozetler yüklenirken bir hata oluştu.');
      setBadges([]);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedText = (trText: string, enText: string) => {
    return 'tr' === 'tr' ? trText : enText;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'uncommon': return '#10B981';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return colors.primary;
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return getLocalizedText('Yaygın', 'Common');
      case 'uncommon': return getLocalizedText('Nadir', 'Uncommon');
      case 'rare': return getLocalizedText('Nadir', 'Rare');
      case 'epic': return getLocalizedText('Efsanevi', 'Epic');
      case 'legendary': return getLocalizedText('Efsanevi', 'Legendary');
      default: return rarity;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'milestone': return getLocalizedText('Kilometre Taşı', 'Milestone');
      case 'achievement': return getLocalizedText('Başarım', 'Achievement');
      case 'mastery': return getLocalizedText('Ustalık', 'Mastery');
      case 'perfection': return getLocalizedText('Mükemmellik', 'Perfection');
      case 'streak': return getLocalizedText('Seri', 'Streak');
      case 'progress': return getLocalizedText('İlerleme', 'Progress');
      case 'special': return getLocalizedText('Özel', 'Special');
      default: return category;
    }
  };

  const categories = [
    { id: 'all', name: getLocalizedText('Tümü', 'All') },
    { id: 'milestone', name: getLocalizedText('Kilometre Taşı', 'Milestone') },
    { id: 'achievement', name: getLocalizedText('Başarım', 'Achievement') },
    { id: 'mastery', name: getLocalizedText('Ustalık', 'Mastery') },
    { id: 'perfection', name: getLocalizedText('Mükemmellik', 'Perfection') },
  ];

  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter(badge => badge.category === selectedCategory);

  const renderBadge = (badge: Badge, index: number) => (
    <View key={badge.id} style={[styles.badgeCard, { backgroundColor: colors.surface }]}>
      <View style={styles.badgeHeader}>
        <View style={[
          styles.badgeIcon,
          { 
            backgroundColor: badge.color + '20',
            borderColor: badge.color 
          }
        ]}>
          <Text style={[styles.badgeIconText, { color: badge.color }]}>
            {badge.icon}
          </Text>
        </View>
        
        <View style={styles.badgeInfo}>
          <View style={styles.badgeTitleRow}>
            <Text style={[styles.badgeTitle, { color: colors.text }]}>
              {getLocalizedText(badge.name, badge.nameEn)}
            </Text>
            {badge.isNew && (
              <View style={[styles.newBadge, { backgroundColor: colors.warning }]}>
                <Text style={[styles.newBadgeText, { color: colors.textOnPrimary }]}>
                  {getLocalizedText('YENİ', 'NEW')}
                </Text>
              </View>
            )}
          </View>
          
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(badge.rarity) + '20' }]}>
            <Text style={[styles.rarityText, { color: getRarityColor(badge.rarity) }]}>
              {getRarityText(badge.rarity)}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>
        {getLocalizedText(badge.description, badge.descriptionEn)}
      </Text>
      
      {badge.earnedAt && (
        <View style={styles.earnedInfo}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.earnedText, { color: colors.textSecondary }]}>
            {getLocalizedText('Kazanıldı:', 'Earned:')} {new Date(badge.earnedAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FuturisticNavbar title={getLocalizedText('Rozetler', 'Badges')} />
        <View style={styles.authContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.textSecondary} />
          <Text style={[styles.authText, { color: colors.textSecondary }]}>
            {getLocalizedText('Rozetleri görmek için giriş yapın', 'Please login to view badges')}
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('LoginScreen')}
          >
            <Text style={[styles.loginButtonText, { color: colors.textOnPrimary }]}>
              {getLocalizedText('Giriş Yap', 'Login')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FuturisticNavbar title={getLocalizedText('Rozetler', 'Badges')} />
      
      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              { 
                backgroundColor: selectedCategory === category.id 
                  ? colors.primary 
                  : colors.surface,
                borderColor: colors.border
              }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.categoryText,
              { 
                color: selectedCategory === category.id 
                  ? colors.textOnPrimary 
                  : colors.text 
              }
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Badges List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {getLocalizedText('Rozetler yükleniyor...', 'Loading badges...')}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.badgesContainer}
          contentContainerStyle={styles.badgesContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredBadges.length > 0 ? (
            filteredBadges.map((badge, index) => renderBadge(badge, index))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {getLocalizedText('Henüz rozet kazanmadınız', 'No badges earned yet')}
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                {getLocalizedText(
                  'Dersleri tamamlayarak ve testleri geçerek rozetler kazanabilirsiniz!',
                  'Complete lessons and pass tests to earn badges!'
                )}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  authText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryContainer: {
    maxHeight: 60,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  badgesContainer: {
    flex: 1,
  },
  badgesContent: {
    padding: 16,
  },
  badgeCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 16,
  },
  badgeIconText: {
    fontSize: 28,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  earnedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earnedText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BadgesScreen; 