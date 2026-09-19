import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

export interface AiSuggestion {
  id: string;
  type: 'completion' | 'optimization' | 'error-fix' | 'analysis';
  title: string;
  description: string;
  code?: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

interface AiSuggestionsProps {
  suggestions: AiSuggestion[];
  onApplySuggestion: (suggestion: AiSuggestion) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  visible: boolean;
}

export const AiSuggestions: React.FC<AiSuggestionsProps> = ({
  suggestions,
  onApplySuggestion,
  onDismissSuggestion,
  visible,
}) => {
  const { colors, typography } = useTheme();
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animation, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, animation]);

  const getTypeIcon = (type: AiSuggestion['type']) => {
    switch (type) {
      case 'completion':
        return 'code';
      case 'optimization':
        return 'flash';
      case 'error-fix':
        return 'bug';
      case 'analysis':
        return 'analytics';
      default:
        return 'bulb';
    }
  };

  const getTypeColor = (type: AiSuggestion['type']) => {
    switch (type) {
      case 'completion':
        return colors.primary;
      case 'optimization':
        return colors.accent;
      case 'error-fix':
        return colors.error;
      case 'analysis':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getImpactColor = (impact: AiSuggestion['impact']) => {
    switch (impact) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getEffortColor = (effort: AiSuggestion['effort']) => {
    switch (effort) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const handleApplySuggestion = (suggestion: AiSuggestion) => {
    Alert.alert(
      'Öneriyi Uygula',
      `"${suggestion.title}" önerisini uygulamak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Uygula',
          onPress: () => {
            onApplySuggestion(suggestion);
            onDismissSuggestion(suggestion.id);
          },
        },
      ]
    );
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    Alert.alert(
      'Öneriyi Kapat',
      'Bu öneriyi kapatmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kapat',
          style: 'destructive',
          onPress: () => onDismissSuggestion(suggestionId),
        },
      ]
    );
  };

  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            AI Önerileri ({suggestions.length})
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => suggestions.forEach(s => onDismissSuggestion(s.id))}
          style={styles.clearAllButton}
        >
          <Text style={[styles.clearAllText, { color: colors.primary }]}>
            Tümünü Kapat
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
        {suggestions.map((suggestion) => (
          <View
            key={suggestion.id}
            style={[
              styles.suggestionItem,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <View style={styles.suggestionHeader}>
              <View style={styles.suggestionType}>
                <Ionicons
                  name={getTypeIcon(suggestion.type)}
                  size={16}
                  color={getTypeColor(suggestion.type)}
                />
                <Text style={[styles.suggestionTypeText, { color: getTypeColor(suggestion.type) }]}>
                  {suggestion.type === 'completion' && 'Tamamlama'}
                  {suggestion.type === 'optimization' && 'Optimizasyon'}
                  {suggestion.type === 'error-fix' && 'Hata Düzeltme'}
                  {suggestion.type === 'analysis' && 'Analiz'}
                </Text>
              </View>
              
              <View style={styles.suggestionMetrics}>
                <View style={styles.metric}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Etki:
                  </Text>
                  <View style={[styles.metricBadge, { backgroundColor: getImpactColor(suggestion.impact) + '20' }]}>
                    <Text style={[styles.metricText, { color: getImpactColor(suggestion.impact) }]}>
                      {suggestion.impact === 'high' && 'Yüksek'}
                      {suggestion.impact === 'medium' && 'Orta'}
                      {suggestion.impact === 'low' && 'Düşük'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.metric}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Çaba:
                  </Text>
                  <View style={[styles.metricBadge, { backgroundColor: getEffortColor(suggestion.effort) + '20' }]}>
                    <Text style={[styles.metricText, { color: getEffortColor(suggestion.effort) }]}>
                      {suggestion.effort === 'high' && 'Yüksek'}
                      {suggestion.effort === 'medium' && 'Orta'}
                      {suggestion.effort === 'low' && 'Düşük'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={[styles.suggestionTitle, { color: colors.text }]}>
              {suggestion.title}
            </Text>
            
            <Text style={[styles.suggestionDescription, { color: colors.textSecondary }]}>
              {suggestion.description}
            </Text>

            {suggestion.code && (
              <View style={[styles.codePreview, { backgroundColor: colors.background }]}>
                <Text style={[styles.codeText, { color: colors.text }]} numberOfLines={3}>
                  {suggestion.code}
                </Text>
              </View>
            )}

            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { 
                width: `${suggestion.confidence * 100}%`,
                backgroundColor: colors.primary 
              }]} />
            </View>
            <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
              Güven: {Math.round(suggestion.confidence * 100)}%
            </Text>

            <View style={styles.suggestionActions}>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={() => handleApplySuggestion(suggestion)}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.applyButtonGradient}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.applyButtonText}>Uygula</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dismissButton, { borderColor: colors.border }]}
                onPress={() => handleDismissSuggestion(suggestion.id)}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
                <Text style={[styles.dismissButtonText, { color: colors.textSecondary }]}>
                  Kapat
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 400,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearAllButton: {
    padding: 4,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionsList: {
    maxHeight: 320,
  },
  suggestionItem: {
    margin: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  suggestionType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionTypeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  suggestionMetrics: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
  },
  metricBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  metricText: {
    fontSize: 10,
    fontWeight: '500',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  codePreview: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  confidenceBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 10,
    marginBottom: 12,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  applyButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  dismissButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 