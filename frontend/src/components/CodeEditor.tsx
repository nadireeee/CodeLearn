import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface CodeEditorProps {
  code?: string;
  language?: string;
  filename?: string;
  onCodeChange?: (code: string) => void;
  onSave?: (code: string) => void;
  onRun?: (code: string) => void;
  readOnly?: boolean;
  style?: ViewStyle;
  placeholder?: string;
}

interface LineNumberProps {
  lineNumber: number;
  style?: TextStyle;
}

const LineNumber: React.FC<LineNumberProps> = ({ lineNumber, style }) => (
  <Text style={[styles.lineNumber, style]}>
    {lineNumber.toString().padStart(3, ' ')}
  </Text>
);

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code = '',
  language = 'cpp',
  filename = 'main.cpp',
  onCodeChange,
  onSave,
  onRun,
  readOnly = false,
  style,
  placeholder = 'Kodunuzu buraya yazın...',
}) => {
  const { colors } = useTheme();
  const [currentCode, setCurrentCode] = useState(code || '');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    console.log('CodeEditor: code prop değişti:', (code || '').substring(0, 50) + '...');
    setCurrentCode(code || '');
  }, [code]);

  const lines = (currentCode || '').split('\n');
  const lineCount = lines.length;

  // Syntax highlighting
  const highlightCode = (code: string) => {
    const keywords = [
      'int', 'float', 'double', 'char', 'bool', 'void', 'string',
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
      'break', 'continue', 'return', 'class', 'struct', 'public', 'private',
      'protected', 'static', 'const', 'virtual', 'template', 'namespace',
      'using', 'include', 'define', 'cout', 'cin', 'endl', 'std',
      'auto', 'nullptr', 'true', 'false', 'new', 'delete'
    ];

    const types = ['int', 'float', 'double', 'char', 'bool', 'void', 'string'];
    const functions = ['main', 'printf', 'scanf', 'cout', 'cin', 'endl'];

    let highlighted = code;

    // Highlight keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `**${keyword}**`);
    });

    // Highlight strings
    highlighted = highlighted.replace(/"([^"]*)"/g, '`"$1"`');
    highlighted = highlighted.replace(/'([^']*)'/g, "`'$1'`");

    // Highlight comments
    if (highlighted.includes('//')) {
      const commentIndex = highlighted.indexOf('//');
      const codePart = highlighted.substring(0, commentIndex);
      const commentPart = highlighted.substring(commentIndex);
      highlighted = `${codePart}~${commentPart}~`;
    }

    // Highlight preprocessor directives
    highlighted = highlighted.replace(/#(\w+)/g, '^#$1^');

    return highlighted;
  };

  const renderHighlightedLine = (line: string, lineIndex: number) => {
    const highlighted = highlightCode(line);
    
    return (
      <View key={lineIndex} style={styles.codeLine}>
        <LineNumber 
          lineNumber={lineIndex + 1} 
          style={{ color: colors.textTertiary }}
        />
        <Text style={[styles.codeText, { color: colors.text }]}>
          {highlighted.split('**').map((part, partIndex) => {
            if (partIndex % 2 === 1) {
              return <Text key={partIndex} style={{ color: colors.primary, fontWeight: '600' }}>{part}</Text>;
            }
            return part.split('`').map((subPart, subIndex) => {
              if (subIndex % 2 === 1) {
                return <Text key={subIndex} style={{ color: colors.success }}>{subPart}</Text>;
              }
              return subPart.split('~').map((finalPart, finalIndex) => {
                if (finalIndex % 2 === 1) {
                  return <Text key={finalIndex} style={{ color: colors.textTertiary, fontStyle: 'italic' }}>{finalPart}</Text>;
                }
                return finalPart.split('^').map((preprocessorPart, preprocessorIndex) => {
                  if (preprocessorIndex % 2 === 1) {
                    return <Text key={preprocessorIndex} style={{ color: colors.accent, fontWeight: '600' }}>{preprocessorPart}</Text>;
                  }
                  return preprocessorPart;
                });
              });
            });
          })}
        </Text>
      </View>
    );
  };

  const handleCodeChange = (text: string) => {
    setCurrentCode(text);
    setIsTyping(true);
    onCodeChange?.(text);
    
    // Reset typing indicator after delay
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleSave = () => {
    onSave?.(currentCode);
    Alert.alert('Başarılı', 'Kod kaydedildi!');
  };

  const handleRun = () => {
    onRun?.(currentCode);
  };

  const handleUndo = () => {
    // Simple undo functionality
    Alert.alert('Bilgi', 'Undo özelliği yakında eklenecek!');
  };

  const handleRedo = () => {
    // Simple redo functionality
    Alert.alert('Bilgi', 'Redo özelliği yakında eklenecek!');
  };

  const containerStyle: ViewStyle = {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...style,
  };

  return (
    <View style={containerStyle}>
      {/* Editor Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.fileIcon}>
            <Ionicons name="document-text" size={16} color={colors.textSecondary} />
          </View>
          <Text style={[styles.filename, { color: colors.text }]}>{filename}</Text>
          {isTyping && (
            <View style={styles.typingIndicator}>
              <Text style={[styles.typingText, { color: colors.textTertiary }]}>düzenleniyor...</Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleUndo} style={styles.headerButton}>
            <Ionicons name="arrow-undo" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRedo} style={styles.headerButton}>
            <Ionicons name="arrow-redo" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Ionicons name="save" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRun} style={[styles.runButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="play" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Code Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.codeContainer}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.codeContent}>
          <TextInput
            ref={textInputRef}
            style={[styles.codeInput, { color: colors.text }]}
            value={currentCode}
            onChangeText={handleCodeChange}
            multiline
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border }]}>
        <Text style={[styles.statusText, { color: colors.textTertiary }]}>
          {lineCount} satır | {language.toUpperCase()}
        </Text>
        <Text style={[styles.statusText, { color: colors.textTertiary }]}>
          UTF-8
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    marginRight: 8,
  },
  filename: {
    fontSize: 14,
    fontWeight: '600',
  },
  typingIndicator: {
    marginLeft: 8,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 6,
    marginLeft: 4,
    borderRadius: 4,
  },
  runButton: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 4,
  },
  codeContainer: {
    flex: 1,
  },
  codeContent: {
    padding: 12,
  },
  codeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 20,
  },
  lineNumber: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginRight: 12,
    minWidth: 30,
    textAlign: 'right',
  },
  codeText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeInput: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
    minHeight: 200,
    padding: 12,
    textAlignVertical: 'top',
  },
});

export default CodeEditor; 