import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TextInput, Button, Switch } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const SignInScreen = ({ navigation }) => {
  const [authMethod, setAuthMethod] = useState("pin"); 
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

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
        // Navigate to onboarding first
        navigation.replace("Onboarding");
      } else {
        setError(result.error || "Invalid PIN");
        setPin("");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setError("Biometric authentication not implemented yet");
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
            <MaterialIcons name="lock" size={80} color="#FFFFFF" />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your account</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.authMethodContainer}>
              <Text style={styles.label}>Sign In Method</Text>
              <View style={styles.toggleContainer}>
                <View
                  style={[
                    styles.toggleOption,
                    authMethod === "pin" && styles.toggleOptionActive,
                  ]}
                >
                  <MaterialIcons
                    name="lock"
                    size={24}
                    color={authMethod === "pin" ? "#4CAF50" : "#BDBDBD"}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      authMethod === "pin" && styles.toggleTextActive,
                    ]}
                  >
                    PIN
                  </Text>
                </View>

                <Switch
                  value={authMethod === "biometric"}
                  onValueChange={(value) =>
                    setAuthMethod(value ? "biometric" : "pin")
                  }
                  color="#FFFFFF"
                  trackColor={{
                    false: "rgba(255,255,255,0.3)",
                    true: "#FFFFFF",
                  }}
                  thumbColor={
                    authMethod === "biometric" ? "#4CAF50" : "#FFFFFF"
                  }
                />

                <View
                  style={[
                    styles.toggleOption,
                    authMethod === "biometric" && styles.toggleOptionActive,
                  ]}
                >
                  <MaterialIcons
                    name="fingerprint"
                    size={24}
                    color={authMethod === "biometric" ? "#4CAF50" : "#BDBDBD"}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      authMethod === "biometric" && styles.toggleTextActive,
                    ]}
                  >
                    Biometric
                  </Text>
                </View>
              </View>

              <Text style={styles.authMethodNote}>
                {authMethod === "pin"
                  ? "Enter your PIN to sign in"
                  : "Use fingerprint or face ID to sign in"}
              </Text>
            </View>

            {authMethod === "pin" ? (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Enter PIN</Text>
                <TextInput
                  mode="outlined"
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter your PIN"
                  style={styles.input}
                  outlineColor="rgba(255,255,255,0.5)"
                  activeOutlineColor="#FFFFFF"
                  textColor="#FFFFFF"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  left={
                    <TextInput.Icon icon="lock" color="rgba(255,255,255,0.7)" />
                  }
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>
            ) : (
              <View style={styles.biometricContainer}>
                <View style={styles.biometricButton}>
                  <MaterialIcons name="fingerprint" size={60} color="#FFFFFF" />
                  <Text style={styles.biometricText}>
                    Authentication
                  </Text>
                </View>
              </View>
            )}

            <Button
              mode="contained"
              onPress={
                authMethod === "pin" ? handleSignIn : handleBiometricAuth
              }
              disabled={
                authMethod === "pin" ? !pin.trim() || isLoading : isLoading
              }
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
    marginBottom: 30,
  },
  authMethodContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 25,
    padding: 3,
    marginBottom: 10,
  },
  toggleOption: {
    flex: 1,
    flexDirection:"row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap:15,
  },
  toggleOptionActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#BDBDBD",
    marginTop: 3,
  },
  toggleTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  authMethodNote: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    textAlign: "center",
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
  },
  errorText: {
    color: "#FFCDD2",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  biometricContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  biometricButton: {
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderStyle: "dashed",
  },
  biometricText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 15,
    textAlign: "center",
  },
  signInButton: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flex: 1,
    flexDirection:"row",
    justifyContent:"center",
    alignItems: "center",
    marginTop: -15,
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
  },
});

export default SignInScreen;
