import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const AuthScreen = ({ navigation }) => {
  const [isNewUser, setIsNewUser] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user exists to determine if they're new or returning
    if (user) {
      setIsNewUser(false);
    }
  }, [user]);

  const handleNewUser = () => {
    setIsNewUser(true);
    navigation.navigate("SignUp");
  };

  const handleReturningUser = () => {
    setIsNewUser(false);
    navigation.navigate("SignIn");
  };

  return (
    <LinearGradient
      colors={["#4CAF50", "#2196F3"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons
            name="account-balance-wallet"
            size={100}
            color="#FFFFFF"
          />
          <Text style={styles.title}>Welcome to Expense Tracker</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to get started
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionCard, isNewUser && styles.optionCardActive]}
            onPress={handleNewUser}
            activeOpacity={0.8}
          >
            <View style={styles.optionIcon}>
              <MaterialIcons
                name="person-add"
                size={40}
                color={isNewUser ? "#4CAF50" : "#FFFFFF"}
              />
            </View>
            <Text
              style={[
                styles.optionTitle,
                isNewUser && styles.optionTitleActive,
              ]}
            >
              New User
            </Text>
            <Text
              style={[
                styles.optionDescription,
                isNewUser && styles.optionDescriptionActive,
              ]}
            >
              Create a new account and start tracking your expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, !isNewUser && styles.optionCardActive]}
            onPress={handleReturningUser}
            activeOpacity={0.8}
          >
            <View style={styles.optionIcon}>
              <MaterialIcons
                name="login"
                size={40}
                color={!isNewUser ? "#4CAF50" : "#FFFFFF"}
              />
            </View>
            <Text
              style={[
                styles.optionTitle,
                !isNewUser && styles.optionTitleActive,
              ]}
            >
              Returning User
            </Text>
            <Text
              style={[
                styles.optionDescription,
                !isNewUser && styles.optionDescriptionActive,
              ]}
            >
              Sign in to access your existing account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isNewUser
              ? "Ready to start your financial journey?"
              : "Welcome back! Let's continue tracking your expenses"}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 50,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
  },
  optionsContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  optionCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    minHeight: 180,
    justifyContent: "center",
  },
  optionCardActive: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderColor: "#4CAF50",
    transform: [{ scale: 1.02 }],
  },
  optionIcon: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  optionTitleActive: {
    color: "#4CAF50",
  },
  optionDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 20,
  },
  optionDescriptionActive: {
    color: "#666666",
  },
  footer: {
    alignItems: "center",
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default AuthScreen;
