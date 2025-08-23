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

const SignUpScreen = ({ navigation }) => {
  const [authMethod, setAuthMethod] = useState("gmail");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

    setIsLoading(true);
    try {
      const result = await signUp(username.trim(), authMethod, email.trim());
      if (result.success) {
        navigation.replace("Onboarding");
      } else {
        setError(result.error || "Sign up failed. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Sign up error:", error);
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
            <View style={styles.authMethodContainer}>
              <Text style={styles.label}>Authentication Method</Text>
              <View style={styles.toggleContainer}>
                <View
                  style={[
                    styles.toggleOption,
                    authMethod === "gmail" && styles.toggleOptionActive,
                  ]}
                >
                  <MaterialIcons
                    name="mail"
                    size={24}
                    color={authMethod === "gmail" ? "#4CAF50" : "#BDBDBD"}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      authMethod === "gmail" && styles.toggleTextActive,
                    ]}
                  >
                    Gmail
                  </Text>
                </View>

                <Switch
                  value={authMethod === "apple"}
                  onValueChange={(value) =>
                    setAuthMethod(value ? "apple" : "gmail")
                  }
                  color="#FFFFFF"
                  trackColor={{
                    false: "rgba(255,255,255,0.3)",
                    true: "#FFFFFF",
                  }}
                  thumbColor={authMethod === "apple" ? "#4CAF50" : "#FFFFFF"}
                />

                <View
                  style={[
                    styles.toggleOption,
                    authMethod === "apple" && styles.toggleOptionActive,
                  ]}
                >
                  <MaterialIcons
                    name="apple"
                    size={24}
                    color={authMethod === "apple" ? "#4CAF50" : "#BDBDBD"}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      authMethod === "apple" && styles.toggleTextActive,
                    ]}
                  >
                    Apple
                  </Text>
                </View>
              </View>

              <Text style={styles.authMethodNote}>
                {authMethod === "gmail"
                  ? "You'll sign in with your Gmail account"
                  : "You'll sign in with your Apple ID"}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              {/* <Text style={styles.label}>Username</Text> */}
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
              {/* <Text style={styles.label}>Email</Text> */}
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
                  <TextInput.Icon icon="email" color="rgba(255,255,255,0.7)" />
                }
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              mode="contained"
              onPress={handleSignUp}
              disabled={!username.trim() || !email.trim() || isLoading}
              loading={isLoading}
              style={styles.signUpButton}
              buttonColor="#4CAF50"
              textColor="#FFFFFF"
              labelStyle={styles.buttonLabel}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </View>

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
    padding: 1,
    marginBottom: 10,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 8,
  },
  toggleOptionActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#BDBDBD",
  },
  toggleTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  authMethodNote: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: 8,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 15,
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
  },
  footer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    marginBottom: 30,
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
  },
});

export default SignUpScreen;
