import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

const SplashScreen = () => {
  const navigation = useNavigation();
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Always go through authentication first
      if (!isAuthenticated) {
        navigation.replace("Auth");
      } else if (!hasCompletedOnboarding) {
        navigation.replace("Onboarding");
      } else {
        navigation.replace("MainTabs");
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated, hasCompletedOnboarding]);

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

        <View style={styles.loadingContainer}>
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
        </View>
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
    opacity: 0.7,
  },
});

export default SplashScreen;
