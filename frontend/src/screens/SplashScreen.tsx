import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../i18n/i18nProvider";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  duration = 4000,
}) => {
  const { colors, typography } = useTheme();
  const { t } = useI18n();

  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);
  const slideAnim = new Animated.Value(80);
  const codeAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);
  const progressAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Start pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    ).start();

    // Main animation sequence
    const animations = Animated.sequence([
      // Logo entrance with rotation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
      // Text slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: Platform.OS !== "web",
      }),
      // Code animation with stagger
      Animated.timing(codeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]);

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration - 500,
      useNativeDriver: false,
    }).start();

    animations.start();

    const timer = setTimeout(() => {
      // Fade out animation before completing
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: Platform.OS !== "web",
      }).start(() => {
        onComplete();
      });
    }, duration - 500);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[styles.logoBackground, { backgroundColor: colors.surface }]}
          >
            <View style={styles.logoIconContainer}>
              <Ionicons name="code-slash" size={50} color={colors.primary} />
              <View
                style={[styles.plusPlus, { backgroundColor: colors.accent }]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.textOnPrimary,
                      fontWeight: "bold",
                      fontSize: 10,
                    },
                  ]}
                >
                  ++
                </Text>
              </View>
            </View>
          </View>

          {/* Floating code symbols */}
          <Animated.View
            style={[
              styles.floatingSymbol,
              styles.symbol1,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, -10],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text
              style={[
                typography.code,
                { color: colors.textOnPrimary, fontSize: 20 },
              ]}
            >
              {"{}"}
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.floatingSymbol,
              styles.symbol2,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 10],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text
              style={[
                typography.code,
                { color: colors.textOnPrimary, fontSize: 18 },
              ]}
            >
              {"</>"}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Title Section */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              typography.h1,
              { color: colors.textOnPrimary },
            ]}
          >
            Code<Text style={{ color: colors.accent }}>Learn</Text>
          </Text>

          <Animated.View
            style={[
              styles.taglineContainer,
              {
                opacity: slideAnim.interpolate({
                  inputRange: [0, 80],
                  outputRange: [1, 0],
                }),
              },
            ]}
          >
            <Text
              style={[
                styles.tagline,
                typography.body2,
                { color: colors.textOnPrimary, opacity: 0.8 },
              ]}
            >
              {t("welcomeSubtitle")}
            </Text>
          </Animated.View>

          <Text
            style={[
              styles.subtitle,
              typography.body1,
              { color: colors.textOnPrimary, opacity: 0.9 },
            ]}
          >
            {t("welcome")}
          </Text>
        </Animated.View>

        {/* Code Animation Section */}
        <Animated.View
          style={[
            styles.codeContainer,
            {
              opacity: codeAnim,
              transform: [
                {
                  translateY: codeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.codeBlock, { backgroundColor: colors.surface }]}>
            <View style={styles.codeHeader}>
              <View style={styles.codeDots}>
                <View style={[styles.dot, { backgroundColor: "#FF5F57" }]} />
                <View style={[styles.dot, { backgroundColor: "#FFBD2E" }]} />
                <View style={[styles.dot, { backgroundColor: "#28CA42" }]} />
              </View>
              <Text
                style={[typography.caption, { color: colors.textSecondary }]}
              >
                main.cpp
              </Text>
            </View>

            <View style={styles.codeContent}>
              <Text style={[typography.code, { color: colors.textSecondary }]}>
                <Text style={{ color: "#7C3AED" }}>#include</Text>{" "}
                <Text style={{ color: "#059669" }}>{"<iostream>"}</Text>
              </Text>
              <Text
                style={[
                  typography.code,
                  { color: colors.textSecondary, marginTop: 4 },
                ]}
              >
                <Text style={{ color: "#7C3AED" }}>int</Text>{" "}
                <Text style={{ color: "#DC2626" }}>main</Text>
                <Text style={{ color: colors.textSecondary }}>() {"{"}</Text>
              </Text>
              <Text
                style={[
                  typography.code,
                  { color: colors.textSecondary, marginTop: 4, marginLeft: 16 },
                ]}
              >
                std::<Text style={{ color: "#DC2626" }}>cout</Text>{" "}
                <Text style={{ color: colors.textSecondary }}>{"<<"}</Text>{" "}
                <Text style={{ color: "#059669" }}>"Hello, World!"</Text>;
              </Text>
              <Text
                style={[
                  typography.code,
                  { color: colors.textSecondary, marginTop: 4 },
                ]}
              >
                {"}"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: codeAnim,
              transform: [
                {
                  translateY: codeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.loadingSection}>
            <Text
              style={[
                typography.body2,
                {
                  color: colors.textOnPrimary,
                  opacity: 0.9,
                  marginBottom: 12,
                  fontWeight: "600",
                },
              ]}
            >
              Kodlama Maceranız Başlıyor...
            </Text>

            <View
              style={[styles.loadingBar, { backgroundColor: colors.surface }]}
            >
              <Animated.View
                style={[
                  styles.loadingProgress,
                  {
                    backgroundColor: colors.accent,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>

            <View style={styles.loadingSteps}>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textOnPrimary, opacity: 0.7 },
                ]}
              >
                Compiler hazırlanıyor...
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBackground: {
    width: 140,
    height: 140,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0px 12px 20px rgba(0, 0, 0, 0.4)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
      },
    }),
  },
  logoIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  plusPlus: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingSymbol: {
    position: "absolute",
  },
  symbol1: {
    top: -20,
    left: -30,
  },
  symbol2: {
    bottom: -20,
    right: -30,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 36,
  },
  taglineContainer: {
    marginBottom: 8,
  },
  tagline: {
    textAlign: "center",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  codeContainer: {
    width: "100%",
    maxWidth: 320,
    marginBottom: 48,
  },
  codeBlock: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  codeDots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  codeContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 280,
  },
  loadingSection: {
    width: "100%",
    alignItems: "center",
  },
  loadingBar: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  loadingProgress: {
    height: "100%",
    borderRadius: 3,
  },
  loadingSteps: {
    marginTop: 12,
    alignItems: "center",
  },
}); 