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

interface MultipleChoiceQuestionProps {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  onAnswer: (isCorrect: boolean, selectedAnswer: number) => void;
  onNext: () => void;
  showExplanation?: boolean;
}

const { width } = Dimensions.get('window');

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  options,
  correctAnswer,
  explanation,
  onAnswer,
  onNext,
  showExplanation = true,
}) => {
  const { colors } = useTheme();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanationState, setShowExplanationState] = useState(false);
  const [animations] = useState(() => 
    options.map(() => new Animated.Value(0))
  );

  useEffect(() => {
    // Stagger animation for options
    const animations = options.map((_, index) => 
      Animated.timing(new Animated.Value(0), {
        toValue: 1,
        duration: 300 + index * 100,
        useNativeDriver: true,
      })
    );
    
    Animated.stagger(100, animations).start();
  }, []);

  const handleOptionPress = (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    const isCorrect = index === correctAnswer;
    onAnswer(isCorrect, index);
    
    // Show explanation after a short delay
    if (showExplanation) {
      setTimeout(() => {
        setShowExplanationState(true);
      }, 1000);
    }
  };

  const handleNext = () => {
    onNext();
  };

  const getOptionStyle = (index: number) => {
    if (!isAnswered) {
      return {
        backgroundColor: selectedAnswer === index ? colors.primary : colors.surface,
        borderColor: selectedAnswer === index ? colors.primary : colors.border,
      };
    }

    if (index === correctAnswer) {
      return {
        backgroundColor: colors.success,
        borderColor: colors.success,
      };
    }

    if (selectedAnswer === index && index !== correctAnswer) {
      return {
        backgroundColor: colors.error,
        borderColor: colors.error,
      };
    }

    return {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    };
  };

  const getOptionTextStyle = (index: number) => {
    if (!isAnswered) {
      return {
        color: selectedAnswer === index ? colors.textOnPrimary : colors.text,
      };
    }

    if (index === correctAnswer || (selectedAnswer === index && index !== correctAnswer)) {
      return {
        color: colors.textOnPrimary,
      };
    }

    return {
      color: colors.textSecondary,
    };
  };

  const getOptionIcon = (index: number) => {
    if (!isAnswered) {
      return selectedAnswer === index ? 'checkmark-circle' : 'ellipse-outline';
    }

    if (index === correctAnswer) {
      return 'checkmark-circle';
    }

    if (selectedAnswer === index && index !== correctAnswer) {
      return 'close-circle';
    }

    return 'ellipse-outline';
  };

  const getOptionIconColor = (index: number) => {
    if (!isAnswered) {
      return selectedAnswer === index ? colors.textOnPrimary : colors.textSecondary;
    }

    if (index === correctAnswer) {
      return colors.textOnPrimary;
    }

    if (selectedAnswer === index && index !== correctAnswer) {
      return colors.textOnPrimary;
    }

    return colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={[styles.questionText, { color: colors.text }]}>
          {question}
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <Animated.View
            key={index}
            style={[
              styles.optionWrapper,
              {
                opacity: animations[index],
                transform: [
                  {
                    translateY: animations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.optionButton,
                getOptionStyle(index),
              ]}
              onPress={() => handleOptionPress(index)}
              disabled={isAnswered}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <Ionicons
                  name={getOptionIcon(index) as any}
                  size={24}
                  color={getOptionIconColor(index)}
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionText, getOptionTextStyle(index)]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Explanation */}
      {showExplanationState && explanation && (
        <Animated.View style={[styles.explanationContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={styles.explanationHeader}>
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text style={[styles.explanationTitle, { color: colors.text }]}>
              Açıklama
            </Text>
          </View>
          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
            {explanation}
          </Text>
        </Animated.View>
      )}

      {/* Next Button */}
      {isAnswered && (
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
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
  optionsContainer: {
    flex: 1,
  },
  optionWrapper: {
    marginBottom: 12,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
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

export default MultipleChoiceQuestion;
