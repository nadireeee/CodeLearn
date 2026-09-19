import React from 'react';
import { View, Text, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface CodePreviewProps {
  code: string;
  language?: string;
  title?: string;
  style?: ViewStyle;
}

const CodePreview: React.FC<CodePreviewProps> = ({
  code,
  language = 'cpp',
  title,
  style,
}) => {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...style,
  };

  const titleStyle: TextStyle = {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  };

  const codeStyle: TextStyle = {
    fontSize: 13,
    fontFamily: 'monospace',
    color: colors.text,
    lineHeight: 20,
  };

  const keywordStyle: TextStyle = {
    color: colors.primary,
    fontWeight: '600',
  };

  const stringStyle: TextStyle = {
    color: colors.success,
  };

  const commentStyle: TextStyle = {
    color: colors.textTertiary,
    fontStyle: 'italic',
  };

  // Simple syntax highlighting for C++
  const highlightCode = (code: string) => {
    const keywords = [
      'int', 'float', 'double', 'char', 'bool', 'void', 'string',
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
      'break', 'continue', 'return', 'class', 'struct', 'public', 'private',
      'protected', 'static', 'const', 'virtual', 'template', 'namespace',
      'using', 'include', 'define', 'cout', 'cin', 'endl'
    ];

    const lines = code.split('\n');
    return lines.map((line, lineIndex) => {
      let highlightedLine = line;
      
      // Highlight keywords
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlightedLine = highlightedLine.replace(regex, `**${keyword}**`);
      });

      // Highlight strings
      highlightedLine = highlightedLine.replace(/"([^"]*)"/g, '`"$1"`');
      highlightedLine = highlightedLine.replace(/'([^']*)'/g, "`'$1'`");

      // Highlight comments
      if (highlightedLine.includes('//')) {
        const commentIndex = highlightedLine.indexOf('//');
        const codePart = highlightedLine.substring(0, commentIndex);
        const commentPart = highlightedLine.substring(commentIndex);
        highlightedLine = `${codePart}~${commentPart}~`;
      }

      return (
        <Text key={lineIndex} style={codeStyle}>
          {highlightedLine.split('**').map((part, partIndex) => {
            if (partIndex % 2 === 1) {
              return <Text key={partIndex} style={keywordStyle}>{part}</Text>;
            }
            return part.split('`').map((subPart, subIndex) => {
              if (subIndex % 2 === 1) {
                return <Text key={subIndex} style={stringStyle}>{subPart}</Text>;
              }
              return subPart.split('~').map((finalPart, finalIndex) => {
                if (finalIndex % 2 === 1) {
                  return <Text key={finalIndex} style={commentStyle}>{finalPart}</Text>;
                }
                return finalPart;
              });
            });
          })}
        </Text>
      );
    });
  };

  return (
    <View style={containerStyle}>
      {title && <Text style={titleStyle}>{title}</Text>}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {highlightCode(code)}
        </ScrollView>
      </ScrollView>
    </View>
  );
};

export default CodePreview; 