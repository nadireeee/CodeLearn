import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface Badge {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  rarity: string;
}

interface BadgeNotificationProps {
  badge: Badge | null;
  visible: boolean;
  onClose: () => void;
  locale: 'tr' | 'en';
}

const { width } = Dimensions.get('window');

const BadgeNotification: React.FC<BadgeNotificationProps> = ({
  badge,
  visible,
  onClose,
  locale,
}) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        hideNotification();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, badge]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible || !badge) return null;

  const getLocalizedText = (trText: string, enText: string) => {
    return locale === 'tr' ? trText : enText;
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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.badgeContainer, { backgroundColor: colors.surface }]}>
        {/* Badge Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: badge.color + '20',
              borderColor: badge.color,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={[styles.badgeIcon, { color: badge.color }]}>
            {badge.icon}
          </Text>
        </Animated.View>

        {/* Badge Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {locale === 'tr' ? badge.name : badge.nameEn}
            </Text>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(badge.rarity) + '20' }]}>
              <Text style={[styles.rarityText, { color: getRarityColor(badge.rarity) }]}>
                {getRarityText(badge.rarity)}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {locale === 'tr' ? badge.description : badge.descriptionEn}
          </Text>
          
          <View style={styles.achievementText}>
            <Ionicons name="trophy" size={16} color={colors.warning} />
            <Text style={[styles.achievementLabel, { color: colors.warning }]}>
              {getLocalizedText('Başarım Kazandınız!', 'Achievement Unlocked!')}
            </Text>
          </View>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideNotification}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  badgeContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 16,
  },
  badgeIcon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  achievementText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  achievementLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default BadgeNotification; 