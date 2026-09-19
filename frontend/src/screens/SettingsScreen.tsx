import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../i18n/i18nProvider";
import { useAuth } from "../context/AuthContext";

interface SettingsScreenProps {
  // Removed onNavigateBack prop since this is now a tab screen
}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { colors, typography, colorScheme, toggleColorScheme } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { logout } = useAuth();

  const handleLanguageToggle = () => {
    setLanguage(language === "en" ? "tr" : "en");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, typography.h2, { color: colors.text }]}>
            {t('settings')}
          </Text>

          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text
              style={[
                styles.sectionTitle,
                typography.h4,
                { color: colors.text },
              ]}
            >
              Görünüm
            </Text>

            <SettingItem
              icon="moon"
              title={colorScheme === "dark" ? t("lightMode") : t("darkMode")}
              subtitle={`Şu anda ${colorScheme === "dark" ? "karanlık" : "aydınlık"} mod kullanılıyor`}
              rightComponent={
                <Switch
                  value={colorScheme === "dark"}
                  onValueChange={toggleColorScheme}
                  trackColor={{
                    false: colors.borderSecondary,
                    true: colors.primary,
                  }}
                  thumbColor={colors.surface}
                  ios_backgroundColor={colors.borderSecondary}
                />
              }
              colors={colors}
              typography={typography}
            />
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text
              style={[
                styles.sectionTitle,
                typography.h4,
                { color: colors.text },
              ]}
            >
              {t("language")}
            </Text>

            <SettingItem
              icon="language"
              title={t("language")}
              subtitle={language === "en" ? "English" : "Türkçe"}
              rightComponent={
                <TouchableOpacity
                  onPress={handleLanguageToggle}
                  style={[
                    styles.languageButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textOnPrimary, fontWeight: "600" },
                    ]}
                  >
                    {language === "en" ? "TR" : "EN"}
                  </Text>
                </TouchableOpacity>
              }
              colors={colors}
              typography={typography}
            />
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text
              style={[
                styles.sectionTitle,
                typography.h4,
                { color: colors.text },
              ]}
            >
              Hakkında
            </Text>

            <SettingItem
              icon="code-slash"
              title="CodeLearn"
              subtitle="Version 1.0.0"
              colors={colors}
              typography={typography}
            />

            <SettingItem
              icon="information-circle"
              title="Bu uygulama hakkında"
              subtitle="C ve C++ programlamayı öğrenin"
              colors={colors}
              typography={typography}
            />

            <SettingItem
              icon="help-circle"
              title="Yardım & Destek"
              subtitle="Öğrenme yolculuğunuzda yardım alın"
              rightComponent={
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textTertiary}
                />
              }
              colors={colors}
              typography={typography}
            />
          </View>

          <View
            style={[styles.previewSection, { backgroundColor: colors.surface }]}
          >
            <Text
              style={[
                styles.sectionTitle,
                typography.h4,
                { color: colors.text },
              ]}
            >
              Önizleme
            </Text>

            <View
              style={[
                styles.previewCard,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <View
                style={[
                  styles.previewIcon,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="code" size={24} color={colors.textOnPrimary} />
              </View>
              <View style={styles.previewContent}>
                <Text
                  style={[
                    typography.body1,
                    { color: colors.text, fontWeight: "600" },
                  ]}
                >
                  {language === "en" ? "Hello, World!" : "Merhaba, Dünya!"}
                </Text>
                <Text
                  style={[
                    typography.code,
                    { color: colors.textSecondary, marginTop: 4 },
                  ]}
                >
                  printf("Hello, World!");
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text
              style={[
                styles.sectionTitle,
                typography.h4,
                { color: colors.text },
              ]}
            >
              Hesap
            </Text>

            <TouchableOpacity onPress={handleLogout} style={styles.settingItem}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.error },
                ]}
              >
                <Ionicons
                  name="log-out"
                  size={20}
                  color={colors.textOnPrimary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text
                  style={[
                    typography.body1,
                    { color: colors.error, fontWeight: "500" },
                  ]}
                >
                  {t('logout')}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  Hesabınızdan çıkış yapın
                </Text>
              </View>
              <View style={styles.settingRight}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textTertiary}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  onPress?: () => void;
  colors: any;
  typography: any;
}> = ({
  icon,
  title,
  subtitle,
  rightComponent,
  onPress,
  colors,
  typography,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.settingItem}
    disabled={!onPress}
  >
    <View
      style={[styles.settingIcon, { backgroundColor: colors.primaryLight }]}
    >
      <Ionicons name={icon} size={20} color={colors.textOnPrimary} />
    </View>
    <View style={styles.settingContent}>
      <Text
        style={[typography.body1, { color: colors.text, fontWeight: "500" }]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: 2 },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
    {rightComponent && (
      <View style={styles.settingRight}>{rightComponent}</View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontWeight: "700",
  },
  placeholder: {
    width: 44,
  },
  content: {
    paddingHorizontal: 24,
    gap: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: "600",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingRight: {
    marginLeft: 12,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 36,
    alignItems: "center",
  },
  previewSection: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
}); 