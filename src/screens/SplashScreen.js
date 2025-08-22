import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

const SplashScreen = () => {
  const navigation = useNavigation();
  const { isAuthenticated, hasCompletedOnboarding, user, isLoading } =
    useAuth();

  const [currentPhase, setCurrentPhase] = useState("dots"); // "dots" or "countdown"
  const [countdown, setCountdown] = useState(10);

  // Animation values for dots
  const dot1Opacity = new Animated.Value(0.3);
  const dot2Opacity = new Animated.Value(0.3);
  const dot3Opacity = new Animated.Value(0.3);

  useEffect(() => {
    // Phase 1: Animated dots for 5 seconds
    const dotsTimer = setTimeout(() => {
      setCurrentPhase("countdown");
    }, 5000);

    // Start dots animation immediately
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dot1Opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => animateDots());
    };

    // Start animation immediately
    animateDots();

    return () => clearTimeout(dotsTimer);
  }, []); // Only run once on mount

  useEffect(() => {
    // Phase 2: Countdown for 10 seconds
    if (currentPhase === "countdown") {
      const countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 0; // Set to 0 to show completion
          }
          return prev - 1;
        });
      }, 1000);

      // Cleanup function to clear interval
      return () => {
        clearInterval(countdownTimer);
      };
    }
  }, [currentPhase]);

  // Separate useEffect to handle navigation when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && !isLoading) {
      console.log("SplashScreen: Navigation decision", {
        isAuthenticated,
        hasCompletedOnboarding,
        user: user?.username,
      });

      // Wait for auth status to be loaded before navigating
      if (isAuthenticated && hasCompletedOnboarding) {
        // User is authenticated and has completed onboarding, go to main app
        console.log("SplashScreen: Navigating to MainTabs");
        navigation.replace("MainTabs");
      } else if (isAuthenticated && !hasCompletedOnboarding) {
        // User is authenticated but hasn't completed onboarding
        console.log("SplashScreen: Navigating to Onboarding");
        navigation.replace("Onboarding");
      } else {
        // No user, go to SignUp
        console.log("SplashScreen: Navigating to SignUp");
        navigation.replace("SignUp");
      }
    }
  }, [
    countdown,
    isLoading,
    isAuthenticated,
    hasCompletedOnboarding,
    navigation,
  ]);

  return (
    <LinearGradient
      colors={["#4CAF50", "#2196F3"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name="account-balance-wallet"
            size={120}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.title}>Expense Tracker</Text>
        <Text style={styles.subtitle}>Smart Financial Management</Text>

        {currentPhase === "dots" ? (
          // Phase 1: Animated dots
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[styles.loadingDot, { opacity: dot1Opacity }]}
            />
            <Animated.View
              style={[styles.loadingDot, { opacity: dot2Opacity }]}
            />
            <Animated.View
              style={[styles.loadingDot, { opacity: dot3Opacity }]}
            />
            {isLoading && (
              <Text style={styles.loadingText}>Checking authentication...</Text>
            )}
          </View>
        ) : (
          // Phase 2: Countdown
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownLabel}>seconds remaining</Text>
            <Text style={styles.countdownSubtext}>
              {isLoading ? "Preparing..." : "Redirecting soon..."}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
    marginBottom: 50,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 6,
  },
  countdownContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  countdownLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  countdownSubtext: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.7,
    marginTop: 10,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: 20,
    textAlign: "center",
  },
});

export default SplashScreen;
