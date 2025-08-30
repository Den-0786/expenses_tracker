import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TextInput, Button, Portal, Modal, Title } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const SignInScreen = ({ navigation }) => {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn } = useAuth();

  const errorTimeoutRef = useRef(null);

  const handlePinChange = (text) => {
    setPin(text);
    if (error) {
      setError("");
    }
  };

  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      errorTimeoutRef.current = setTimeout(() => {
        setError("");
      }, 3000);
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error]);

  const handleSignIn = async () => {
    if (!pin.trim()) {
      setError("Please enter your PIN");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn(pin.trim());
      if (result.success) {
        setError("");
        navigation.replace("MainTabs");
      } else {
        setError(result.error || "Invalid PIN");
        setPin("");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = () => {
    setShowForgotPinModal(true);
    setError("");
    setSuccessMessage("");
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
  };

  const handleResetPin = async () => {
    if (!resetEmail.trim()) {
      setError("Please enter your email address");
      return;
    }

    setResetLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setShowForgotPinModal(false);
      setResetEmail("");
      setError("");
      setSuccessMessage("PIN reset instructions sent to your email");
    } catch (error) {
      setError("Failed to send reset instructions. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={["#4CAF50", "#2196F3"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <MaterialIcons name="lock" size={80} color="#FFFFFF" />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Enter your PIN to sign in</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                value={pin}
                onChangeText={handlePinChange}
                placeholder="Enter your PIN"
                style={styles.input}
                outlineColor="rgba(255,255,255,0.5)"
                activeOutlineColor="#FFFFFF"
                textColor="#FFFFFF"
                placeholderTextColor="rgba(255,255,255,0.7)"
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
                left={
                  <TextInput.Icon icon="lock" color="rgba(255,255,255,0.7)" />
                }
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {successMessage ? (
                <Text style={styles.successText}>{successMessage}</Text>
              ) : null}

              <Button
                mode="text"
                onPress={handleForgotPin}
                textColor="rgba(255,255,255,0.8)"
                labelStyle={styles.forgotPinText}
                style={styles.forgotPinButton}
              >
                Forgot PIN?
              </Button>
            </View>

            <Button
              mode="contained"
              onPress={handleSignIn}
              disabled={!pin.trim() || isLoading}
              loading={isLoading}
              style={styles.signInButton}
              buttonColor="#4CAF50"
              textColor="#FFFFFF"
              labelStyle={styles.buttonLabel}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate("SignUp")}
              textColor="#FFFFFF"
              labelStyle={styles.linkText}
            >
              Sign Up
            </Button>
          </View>
        </View>

        <Portal>
          <Modal
            visible={showForgotPinModal}
            onDismiss={() => setShowForgotPinModal(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <MaterialIcons
                name="lock-reset"
                size={60}
                color="#4CAF50"
                style={styles.modalIcon}
              />

              <Title style={styles.modalTitle}>Reset Your PIN</Title>
              <Text style={styles.modalSubtitle}>
                Enter your email address to receive PIN reset instructions
              </Text>

              <TextInput
                mode="outlined"
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="Enter your email"
                style={styles.modalInput}
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email" color="#666" />}
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowForgotPinModal(false)}
                  style={styles.modalButton}
                  textColor="#666"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleResetPin}
                  loading={resetLoading}
                  disabled={!resetEmail.trim() || resetLoading}
                  style={styles.modalButton}
                  buttonColor="#4CAF50"
                >
                  {resetLoading ? "Sending..." : "Send Reset"}
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
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
  formContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  pinLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  pinSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 25,
    textAlign: "center",
    lineHeight: 20,
  },
  inputSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 15,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    width: "100%",
    marginBottom: 20,
  },
  errorText: {
    color: "#FFCDD2",
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  successText: {
    color: "#C8E6C9",
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },

  signInButton: {
    marginTop: -15,
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 10,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 5,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  forgotPinButton: {
    marginTop: 20,
    alignSelf: "center",
    paddingVertical: 8,
  },
  forgotPinText: {
    fontSize: 14,
    textDecorationLine: "underline",
    color: "rgba(255,255,255,0.8)",
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 20,
    padding: 0,
    elevation: 5,
  },
  modalContent: {
    padding: 30,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalInput: {
    width: "100%",
    marginBottom: 25,
    backgroundColor: "#f5f5f5",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 15,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
  },
});

export default SignInScreen;
