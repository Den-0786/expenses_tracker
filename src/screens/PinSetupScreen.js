import React, { useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card, Title, Button, TextInput, Snackbar } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useSecurity } from "../context/SecurityContext";

const PinSetupScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { setAppPin } = useSecurity();

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");

  const pinInputRef = useRef();
  const confirmPinInputRef = useRef();

  const showSnackbar = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  const handlePinSubmit = () => {
    if (pin.length < 4) {
      showSnackbar("PIN must be at least 4 digits", "error");
      return;
    }

    if (pin.length > 8) {
      showSnackbar("PIN cannot exceed 8 digits", "error");
      return;
    }

    setShowConfirm(true);
    setTimeout(() => {
      confirmPinInputRef.current?.focus();
    }, 100);
  };

  const handleConfirmPin = async () => {
    if (pin !== confirmPin) {
      showSnackbar("PINs do not match. Please try again.", "error");
      setConfirmPin("");
      setShowConfirm(false);
      setPin("");
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
      return;
    }

    try {
      const success = await setAppPin(pin);
      if (success) {
        showSnackbar("PIN set successfully! Redirecting to app...", "success");
        setTimeout(() => {
          navigation.replace("MainTabs");
        }, 1500);
      } else {
        showSnackbar("Failed to set PIN. Please try again.", "error");
      }
    } catch (error) {
      showSnackbar("An error occurred. Please try again.", "error");
    }
  };

  const handleSkip = () => {
    navigation.replace("MainTabs");
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="lock" size={60} color={theme.colors.primary} />
            <Title style={[styles.title, { color: theme.colors.text }]}>
              Secure Your Finances
            </Title>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              Set up a PIN to protect your financial data
            </Text>
          </View>

          {/* PIN Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {showConfirm ? "Confirm PIN" : "Enter PIN"}
            </Text>
            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              {showConfirm
                ? "Re-enter your PIN to confirm"
                : "Choose a 4-8 digit PIN"}
            </Text>

            {!showConfirm ? (
              <TextInput
                ref={pinInputRef}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                placeholder="Enter PIN"
                maxLength={8}
                secureTextEntry
                autoFocus
                textColor={theme.colors.text}
                placeholderTextColor={theme.colors.textSecondary}
                outlineColor={theme.colors.border}
                activeOutlineColor={theme.colors.primary}
              />
            ) : (
              <TextInput
                ref={confirmPinInputRef}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                placeholder="Confirm PIN"
                maxLength={8}
                secureTextEntry
                autoFocus
                textColor={theme.colors.text}
                placeholderTextColor={theme.colors.textSecondary}
                outlineColor={theme.colors.border}
                activeOutlineColor={theme.colors.primary}
              />
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {!showConfirm ? (
              <Button
                mode="contained"
                onPress={handlePinSubmit}
                disabled={pin.length < 4}
                style={styles.primaryButton}
                buttonColor={theme.colors.primary}
                textColor="#FFFFFF"
              >
                Continue
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleConfirmPin}
                disabled={confirmPin.length < 4}
                style={styles.primaryButton}
                buttonColor={theme.colors.primary}
                textColor="#FFFFFF"
              >
                Set PIN
              </Button>
            )}

            <Button
              mode="outlined"
              onPress={() => {
                if (showConfirm) {
                  setShowConfirm(false);
                  setConfirmPin("");
                  setPin("");
                  setTimeout(() => {
                    pinInputRef.current?.focus();
                  }, 100);
                } else {
                  handleSkip();
                }
              }}
              style={styles.secondaryButton}
              textColor={theme.colors.textSecondary}
              outlineColor={theme.colors.border}
            >
              {showConfirm ? "Back" : "Skip for now"}
            </Button>
          </View>

          {/* Security Info */}
          <View style={styles.infoContainer}>
            <MaterialIcons
              name="security"
              size={20}
              color={theme.colors.info}
            />
            <Text
              style={[styles.infoText, { color: theme.colors.textSecondary }]}
            >
              Your PIN is stored locally on your device and never shared
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={hideSnackbar}
        duration={3000}
        style={{
          backgroundColor:
            snackbarType === "success"
              ? theme.colors.success
              : snackbarType === "error"
                ? theme.colors.error
                : theme.colors.info,
        }}
        action={{
          label: "Dismiss",
          onPress: hideSnackbar,
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    elevation: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 8,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButton: {
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 8,
    textAlign: "center",
    lineHeight: 16,
  },
});

export default PinSetupScreen;
