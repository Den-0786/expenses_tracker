import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TextInput, Button } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useNotifications } from "../context/NotificationContext";
import { showSuccess, showError } from "../utils/toast";

const ResetPinScreen = ({ navigation, route }) => {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { sendImmediateNotification } = useNotifications();

  const { email } = route.params || {};

  useEffect(() => {
    if (!email) {
      navigation.navigate("SignIn");
    }
  }, [email, navigation]);

  const validatePin = (pin) => {
    return pin.length >= 4;
  };

  const handleResetPin = async () => {
    setError("");

    if (!newPin.trim()) {
      setError("Please enter a new PIN");
      return;
    }

    if (!validatePin(newPin.trim())) {
      setError("PIN must be at least 4 characters long");
      return;
    }

    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/reset-pin-confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            newPin: newPin.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showSuccess("PIN Reset", "Your PIN has been reset successfully");
        navigation.navigate("SignIn");
      } else {
        setError(data.message || "Failed to reset PIN. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <LinearGradient
        colors={["#4CAF50", "#2196F3"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <MaterialIcons name="lock-reset" size={80} color="#FFFFFF" />
            <Text style={styles.title}>Reset Your PIN</Text>
            <Text style={styles.subtitle}>Enter your new PIN below</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.cardWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  value={newPin}
                  onChangeText={setNewPin}
                  placeholder="Enter new PIN"
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
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  placeholder="Confirm new PIN"
                  style={styles.input}
                  outlineColor="rgba(255,255,255,0.5)"
                  activeOutlineColor="#FFFFFF"
                  textColor="#FFFFFF"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                  left={
                    <TextInput.Icon
                      icon="lock-check"
                      color="rgba(255,255,255,0.7)"
                    />
                  }
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                mode="contained"
                onPress={handleResetPin}
                disabled={!newPin.trim() || !confirmPin.trim() || isLoading}
                loading={isLoading}
                style={styles.resetButton}
                buttonColor="#4CAF50"
                textColor="#FFFFFF"
                labelStyle={styles.buttonLabel}
              >
                {isLoading ? "Resetting PIN..." : "Reset PIN"}
              </Button>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your PIN?</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate("SignIn")}
              textColor="#FFFFFF"
              labelStyle={styles.linkText}
            >
              Sign In
            </Button>
          </View>
        </View>
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
    paddingTop: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 30,
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
    marginBottom: 10,
    marginTop: -27,
  },
  cardWrapper: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 30,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  resetButton: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    marginBottom: 25,
  },
  footerText: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: -3,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default ResetPinScreen;
