import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

interface MatchingPair {
  left: string;
  right: string;
}

interface MatchingQuestionProps {
  question: string;
  pairs: MatchingPair[];
  onAnswer: (isCorrect: boolean, selectedPairs: MatchingPair[]) => void;
  onNext: () => void;
  explanation?: string;
}

const { width } = Dimensions.get('window');

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  question,
  pairs,
  onAnswer,
  onNext,
  explanation,
}) => {
  const { colors } = useTheme();
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<{ [key: number]: number }>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [animations] = useState(() => 
    pairs.map(() => new Animated.Value(0))
  );

  useEffect(() => {
    // Stagger animation for pairs
    const animations = pairs.map((_, index) => 
      Animated.timing(new Animated.Value(0), {
        toValue: 1,
        duration: 300 + index * 100,
        useNativeDriver: true,
      })
    );
    
    Animated.stagger(100, animations).start();
  }, []);

  const handleLeftPress = (index: number) => {
    if (isCompleted || matchedPairs[index] !== undefined) return;
    setSelectedLeft(index);
  };

  const handleRightPress = (index: number) => {
    if (isCompleted || Object.values(matchedPairs).includes(index)) return;
    
    if (selectedLeft !== null) {
      const newMatchedPairs = { ...matchedPairs, [selectedLeft]: index };
      setMatchedPairs(newMatchedPairs);
      setSelectedLeft(null);
      setSelectedRight(null);

      // Check if all pairs are matched
      if (Object.keys(newMatchedPairs).length === pairs.length) {
        checkAnswer(newMatchedPairs);
      }
    } else {
      setSelectedRight(index);
    }
  };

  const checkAnswer = (matchedPairs: { [key: number]: number }) => {
    const isCorrect = Object.entries(matchedPairs).every(([leftIndex, rightIndex]) => {
      return pairs[parseInt(leftIndex)].right === pairs[rightIndex].right;
    });

    setIsCompleted(true);
    onAnswer(isCorrect, pairs);

    if (explanation) {
      setTimeout(() => {
        setShowExplanation(true);
      }, 1000);
    }
  };

  const getLeftItemStyle = (index: number) => {
    if (matchedPairs[index] !== undefined) {
      return {
        backgroundColor: colors.success,
        borderColor: colors.success,
      };
    }

    if (selectedLeft === index) {
      return {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      };
    }

    return {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    };
  };

  const getRightItemStyle = (index: number) => {
    if (Object.values(matchedPairs).includes(index)) {
      return {
        backgroundColor: colors.success,
        borderColor: colors.success,
      };
    }

    if (selectedRight === index) {
      return {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      };
    }

    return {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    };
  };

  const getTextStyle = (index: number, isLeft: boolean) => {
    const isMatched = isLeft 
      ? matchedPairs[index] !== undefined
      : Object.values(matchedPairs).includes(index);

    if (isMatched) {
      return { color: colors.textOnPrimary };
    }

    const isSelected = isLeft ? selectedLeft === index : selectedRight === index;
    if (isSelected) {
      return { color: colors.textOnPrimary };
    }

    return { color: colors.text };
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={{
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 22,
        textAlign: 'center',
        marginVertical: 24,
      }}>
        {question}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 18 }}>Sol Taraf</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 18 }}>Sağ Taraf</Text>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', padding: 16 }}>
        {/* Sol kutular */}
        <View style={{ flex: 1, marginRight: 8 }}>
          {pairs.map((pair, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: colors.surface, // Açık renk
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                shadowColor: colors.primary,
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16 }}>{pair.left}</Text>
            </View>
          ))}
        </View>
        {/* Sağ kutular */}
        <View style={{ flex: 1, marginLeft: 8 }}>
          {pairs.map((pair, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: colors.surface, // Açık renk
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                shadowColor: colors.primary,
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16 }}>{pair.right}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {Object.keys(matchedPairs).length} / {pairs.length} eşleştirildi
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(Object.keys(matchedPairs).length / pairs.length) * 100}%`,
                backgroundColor: colors.primary,
              }
            ]} 
          />
        </View>
      </View>

      {/* Explanation */}
      {showExplanation && explanation && (
        <View style={[styles.explanationContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={styles.explanationHeader}>
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text style={[styles.explanationTitle, { color: colors.text }]}>
              Açıklama
            </Text>
          </View>
          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
            {explanation}
          </Text>
        </View>
      )}

      {/* Next Button */}
      {isCompleted && (
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={onNext}
        >
          <Text style={[styles.nextButtonText, { color: colors.textOnPrimary }]}>
            Devam Et
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
  matchingContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 20,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  itemWrapper: {
    marginBottom: 12,
  },
  matchingItem: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  explanationContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default MatchingQuestion;
