import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface ZipUploaderProps {
  onFileSelected: (uri: string, name: string) => void;
  isUploading?: boolean;
  isAnalyzing?: boolean;
  style?: ViewStyle;
}

export const ZipUploader: React.FC<ZipUploaderProps> = ({
  onFileSelected,
  isUploading = false,
  isAnalyzing = false,
  style,
}) => {
  const { colors } = useTheme();

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets) {
        return;
      }

      const file = result.assets[0];
      
      if (!file.name.endsWith('.zip')) {
        Alert.alert('Hata', 'Lütfen sadece ZIP dosyası seçin.');
        return;
      }

      if (file.size && file.size > 10 * 1024 * 1024) { // 10MB
        Alert.alert('Hata', 'Dosya boyutu çok büyük (maksimum 10MB).');
        return;
      }
      
      onFileSelected(file.uri, file.name);

    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
    }
  };

  const containerStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={pickDocument}
      disabled={isUploading || isAnalyzing}
    >
      {isUploading ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.title, { color: colors.text, marginTop: 16 }]}>Yükleniyor...</Text>
        </>
      ) : isAnalyzing ? (
        <>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.title, { color: colors.text, marginTop: 16 }]}>Analiz ediliyor...</Text>
        </>
      ) : (
        <>
          <Ionicons name="cloud-upload-outline" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Proje Yükle
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            ZIP dosyasını buraya sürükleyin veya tıklayın
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ZipUploader; 