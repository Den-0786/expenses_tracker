import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TextInput, Button, Switch, Card } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useSecurity } from "../context/SecurityContext";

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const { signUp } = useAuth();
  const { isBiometricAvailable, authenticateWithBiometric, toggleSecurity } =
    useSecurity();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePin = (pin) => {
    return pin.length >= 4;
  };

  const handleSignUp = async () => {
    setError("");

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (!pin.trim()) {
      setError("Please enter a PIN");
      return;
    }

    if (!validatePin(pin.trim())) {
      setError("PIN must be at least 4 characters long");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp(username.trim(), email.trim(), pin.trim());
      if (result.success) {
        // Enable security (PIN is managed by backend)
        await toggleSecurity(true, "pin");

        // Show biometric setup if available
        if (isBiometricAvailable) {
          setShowBiometricSetup(true);
        }
      } else {
        setError(result.error || "Sign up failed. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
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
            <MaterialIcons
              name="account-balance-wallet"
              size={80}
              color="#FFFFFF"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join us to start tracking your expenses
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.cardWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  style={styles.input}
                  outlineColor="rgba(255,255,255,0.5)"
                  activeOutlineColor="#FFFFFF"
                  textColor="#FFFFFF"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  left={
                    <TextInput.Icon
                      icon="account"
                      color="rgba(255,255,255,0.7)"
                    />
                  }
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  style={styles.input}
                  outlineColor="rgba(255,255,255,0.5)"
                  activeOutlineColor="#FFFFFF"
                  textColor="#FFFFFF"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  left={
                    <TextInput.Icon
                      icon="email"
                      color="rgba(255,255,255,0.7)"
                    />
                  }
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Create a PIN (min 4 characters)"
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
                  placeholder="Confirm your PIN"
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
                onPress={handleSignUp}
                disabled={
                  !username.trim() ||
                  !email.trim() ||
                  !pin.trim() ||
                  !confirmPin.trim() ||
                  isLoading
                }
                loading={isLoading}
                style={styles.signUpButton}
                buttonColor="#4CAF50"
                textColor="#FFFFFF"
                labelStyle={styles.buttonLabel}
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
            </View>
          </View>

          {/* Biometric Setup Modal */}
          {showBiometricSetup && (
            <View style={styles.biometricOverlay}>
              <Card style={styles.biometricCard}>
                <Card.Content style={styles.biometricContent}>
                  <MaterialIcons
                    name="fingerprint"
                    size={60}
                    color="#4CAF50"
                    style={styles.biometricIcon}
                  />
                  <Text style={styles.biometricTitle}>
                    Enable Biometric Security
                  </Text>
                  <Text style={styles.biometricSubtitle}>
                    Use your fingerprint or face recognition for quick and
                    secure access to your account.
                  </Text>

                  {isBiometricAvailable ? (
                    <View style={styles.biometricOption}>
                      <Text style={styles.biometricOptionText}>
                        Enable Biometric Authentication
                      </Text>
                      <Switch
                        value={enableBiometric}
                        onValueChange={setEnableBiometric}
                        color="#4CAF50"
                      />
                    </View>
                  ) : (
                    <Text style={styles.biometricUnavailableText}>
                      Biometric authentication is not available on this device.
                    </Text>
                  )}

                  <View style={styles.biometricButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setEnableBiometric(false);
                        navigation.replace("MainTabs");
                      }}
                      style={styles.biometricButton}
                      textColor="#666"
                    >
                      Skip
                    </Button>
                    <Button
                      mode="contained"
                      onPress={async () => {
                        if (enableBiometric) {
                          try {
                            // Test biometric authentication
                            const success = await authenticateWithBiometric();
                            if (success) {
                              // Enable biometric in security settings
                              await toggleSecurity(true, "biometric");
                            }
                          } catch (error) {
                            // Silent error handling
                          }
                        }
                        navigation.replace("MainTabs");
                      }}
                      style={styles.biometricButton}
                      buttonColor="#4CAF50"
                    >
                      Continue
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
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
    marginBottom: 1,
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
  inputSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 10,
    textAlign: "center",
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
  signUpButton: {
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
  biometricOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  biometricCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    elevation: 10,
  },
  biometricContent: {
    padding: 30,
    alignItems: "center",
  },
  biometricIcon: {
    marginBottom: 20,
  },
  biometricTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  biometricSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  biometricOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  biometricOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  biometricUnavailableText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
  },
  biometricButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 15,
  },
  biometricButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
  },
});

export default SignUpScreen;
