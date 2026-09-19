import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';

const { width: screenWidth } = Dimensions.get('window');

interface Badge {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  icon: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  unlockedAt?: string;
  isNew?: boolean;
  progress?: number;
}

interface ModernBadgeCardProps {
  badge: Badge;
  index: number;
  onPress?: () => void;
  language?: 'tr' | 'en';
  isUnlocked?: boolean;
}

const ModernBadgeCard: React.FC<ModernBadgeCardProps> = ({
  badge,
  index,
  onPress,
  language = 'tr',
  isUnlocked = true,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.delay(index * 150),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Glow animation for new badges
    if (badge.isNew) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [index, badge.isNew]);

  const getRarityConfig = (rarity: string) => {
    const configs = {
      common: {
        borderWidth: 2,
        borderColor: colors.badge.common,
        glowColor: colors.badge.common,
        shadowColor: colors.badge.common,
      },
      uncommon: {
        borderWidth: 2,
        borderColor: colors.badge.uncommon,
        glowColor: colors.badge.uncommon,
        shadowColor: colors.badge.uncommon,
      },
      rare: {
        borderWidth: 3,
        borderColor: colors.badge.rare,
        glowColor: colors.badge.rare,
        shadowColor: colors.badge.rare,
      },
      epic: {
        borderWidth: 3,
        borderColor: colors.badge.epic,
        glowColor: colors.badge.epic,
        shadowColor: colors.badge.epic,
      },
      legendary: {
        borderWidth: 4,
        borderColor: colors.badge.legendary,
        glowColor: colors.badge.legendary,
        shadowColor: colors.badge.legendary,
      },
    };
    return configs[rarity as keyof typeof configs] || configs.common;
  };

  const rarityConfig = getRarityConfig(badge.rarity);

  const rotateZ = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.badgeContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: isUnlocked ? 1 : 0.5,
          },
        ]}
      >
        {/* Glow Effect */}
        {badge.isNew && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowOpacity,
                shadowColor: rarityConfig.glowColor,
              },
            ]}
          />
        )}

        {/* Badge Border */}
        <View
          style={[
            styles.badgeBorder,
            {
              borderColor: rarityConfig.borderColor,
              borderWidth: rarityConfig.borderWidth,
            },
          ]}
        >
          {/* Glass Effect */}
          <LinearGradient
            colors={[
              `${rarityConfig.borderColor}20`,
              `${rarityConfig.borderColor}10`,
            ]}
            style={styles.gradientOverlay}
          />

          {/* Badge Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ rotateZ }],
              },
            ]}
          >
            <Ionicons
              name={badge.icon as any}
              size={40}
              color={rarityConfig.borderColor}
            />
          </Animated.View>

          {/* Progress Bar for locked badges */}
          {!isUnlocked && badge.progress !== undefined && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: colors.borderSecondary },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${badge.progress}%`,
                      backgroundColor: rarityConfig.borderColor,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Badge Info */}
        <View style={styles.badgeInfo}>
          <Text
            style={[
              styles.badgeName,
              {
                color: colors.text,
                opacity: isUnlocked ? 1 : 0.7,
              },
            ]}
            numberOfLines={1}
          >
            {language === 'en' ? badge.nameEn || badge.name : badge.name}
          </Text>
          <Text
            style={[
              styles.badgeDescription,
              {
                color: colors.textSecondary,
                opacity: isUnlocked ? 1 : 0.5,
              },
            ]}
            numberOfLines={2}
          >
            {language === 'en' ? badge.descriptionEn || badge.description : badge.description}
          </Text>
        </View>

        {/* Rarity Indicator */}
        <View
          style={[
            styles.rarityIndicator,
            {
              backgroundColor: rarityConfig.borderColor,
            },
          ]}
        >
          <Text style={styles.rarityText}>
            {badge.rarity.toUpperCase()}
          </Text>
        </View>

        {/* New Badge Indicator */}
        {badge.isNew && (
          <View
            style={[
              styles.newBadgeIndicator,
              {
                backgroundColor: colors.accent,
              },
            ]}
          >
            <Text style={styles.newBadgeText}>NEW!</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: (screenWidth - 60) / 2,
    marginBottom: 20,
  },
  badgeContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  badgeBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
  },
  iconContainer: {
    zIndex: 1,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  badgeInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  rarityIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  newBadgeIndicator: {
    position: 'absolute',
    top: -10,
    left: -10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    transform: [{ rotate: '-15deg' }],
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});

export default ModernBadgeCard; 