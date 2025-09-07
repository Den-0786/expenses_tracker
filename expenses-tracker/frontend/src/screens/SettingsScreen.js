import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Pressable,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import {
  Card,
  Title,
  Button,
  TextInput,
  Divider,
  List,
  Switch as PaperSwitch,
  Snackbar,
  Portal,
  Modal,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDatabase } from "../context/DatabaseContext";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import { useSecurity } from "../context/SecurityContext";
import { useSecurityNotice } from "../context/SecurityNoticeContext";
import { useAuth } from "../context/AuthContext";
import ApiService from "../services/api";

const ExpandableSection = ({
  title,
  children,
  isExpanded,
  onToggle,
  icon,
  showDivider = true,
}) => {
  const handleToggle = () => {
    onToggle();
  };

  return (
    <View style={styles.sectionContainer}>
      <Pressable
        style={styles.sectionHeader}
        onPress={handleToggle}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <View style={styles.sectionHeaderLeft}>
          <List.Icon icon={icon} color="#2196F3" />
          <Title style={styles.sectionTitle}>{title}</Title>
        </View>
        <MaterialIcons
          name={isExpanded ? "expand-more" : "chevron-right"}
          size={24}
          color="#2196F3"
        />
      </Pressable>

      {isExpanded && <View style={styles.sectionContent}>{children}</View>}

      {showDivider && <Divider style={styles.sectionDivider} />}
    </View>
  );
};

const SettingsScreen = () => {
  const navigation = useNavigation();
  const {
    getUserSettings,
    saveUserSettings,
    clearOldData,
    exportData,
    backupData,
    getDataUsage,
  } = useDatabase();
  const {
    scheduleDailyReminder,
    scheduleWeeklyReminder,
    scheduleMonthlyReminder,
    notificationSettings,
    updateNotificationSetting,
    cancelAllNotifications,
  } = useNotifications();
  const { theme, isDarkMode, themeMode, setTheme, toggleTheme } = useTheme();
  const {
    pin,
    isBiometricAvailable,
    isBiometricEnabled,
    isSecurityEnabled,
    autoLockEnabled,
    autoLockTimeout,
    autoLockOnLeave,
    toggleBiometric,
    toggleSecurity,
    toggleAutoLock,
    setAutoLockTimeout: setAutoLockTimeoutValue,
    setAutoLockOnLeave: setAutoLockOnLeaveValue,
    lockApp,
    resetSecurity,
    setAppPin,
  } = useSecurity();
  const {
    showSecurityNotice,
    updateSecurityNoticeSetting,
    resetToDefault,
    forceReset,
    ensureEnabled,
  } = useSecurityNotice();
  const { signOut, user, updateUser, deleteAccount, clearAllData } = useAuth();

  const [userSettings, setUserSettings] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    paymentFrequency: "monthly",
    paymentAmount: "",
    tithingPercentage: "10",
    tithingEnabled: true,
  });

  const [dataRetentionDays, setDataRetentionDays] = useState(365);

  const [dataUsage, setDataUsage] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    totalRecords: 0,
    databaseSize: "0 KB",
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [isLoading, setIsLoading] = useState(false);
  const [pinSetupVisible, setPinSetupVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinStep, setPinStep] = useState("pin");
  const [localSecurityNotice, setLocalSecurityNotice] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

  // App preferences state variables
  const [defaultCurrency, setDefaultCurrency] = useState("GHC");
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("Cash");
  const [startOfWeek, setStartOfWeek] = useState("monday");
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showStartOfWeekModal, setShowStartOfWeekModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAutoLockModal, setShowAutoLockModal] = useState(false);

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    appPreferences: false,
    paymentSettings: false,
    security: false,
    notifications: false,
    emailReports: false,
    categories: false,
    dataManagement: false,
    accountSettings: false,
    helpSupport: false,
    appInformation: false,
    appReset: false,
  });

  // Categories and Payment Methods state
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Email Reports state
  const [emailSettings, setEmailSettings] = useState({
    weeklyReports: false,
    monthlyReports: false,
    emailAddress: "",
  });

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newPaymentMethodName, setNewPaymentMethodName] = useState("");
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] =
    useState(false);

  // Help & Support state
  const [helpTopics, setHelpTopics] = useState([
    {
      id: 1,
      title: "Getting Started",
      content:
        "Learn how to add your first expense, set up categories, and start tracking your money.",
      expanded: false,
    },
    {
      id: 2,
      title: "Adding Expenses",
      content:
        "Tap the + button on the Expenses tab, fill in the details, and save to track your spending.",
      expanded: false,
    },
    {
      id: 3,
      title: "Managing Categories",
      content:
        "Go to Settings > Categories & Payment Methods to add, edit, or remove expense categories.",
      expanded: false,
    },
    {
      id: 4,
      title: "Setting Budgets",
      content:
        "Use the Budget tab to set monthly spending limits and track your progress.",
      expanded: false,
    },
    {
      id: 5,
      title: "Security Features",
      content:
        "Enable PIN lock and biometric authentication in Settings > Security & Privacy.",
      expanded: false,
    },
  ]);

  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  useEffect(() => {
    loadSettings();
    loadDataUsage();
    loadDataRetention();
    loadProfileImage();
    loadAppPreferences();
    loadCategories();
    loadPaymentMethods();
  }, []);

  // Reload profile image when user changes
  useEffect(() => {
    if (user?.id) {
      loadProfileImage();
    }
  }, [user?.id]);

  const loadProfileImage = async () => {
    try {
      // Try to load from database first
      if (user?.id) {
        try {
          const response = await ApiService.getUserProfileImage();
          if (response.success && response.profileImage) {
            setProfileImage(response.profileImage);
            return;
          }
        } catch (dbError) {
          // Database error - continue with AsyncStorage fallback
        }
      }

      // Fallback to AsyncStorage
      const savedImage = await AsyncStorage.getItem("profileImage");
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      // Error loading profile image
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);

        // Save to AsyncStorage for immediate use
        await AsyncStorage.setItem("profileImage", imageUri);

        // Save to database
        if (user?.id) {
          try {
            await ApiService.updateUserProfileImage(imageUri);
            showSnackbar(
              "Profile picture saved to database successfully!",
              "success"
            );
          } catch (dbError) {
            // Continue with AsyncStorage fallback
          }
        }

        showSnackbar("Profile picture updated successfully!", "success");
      }
    } catch (error) {
      showSnackbar(
        "Failed to update profile picture. Please try again.",
        "error"
      );
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showSnackbar("Camera permission is required to take a photo.", "error");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);

        // Save to AsyncStorage for immediate use
        await AsyncStorage.setItem("profileImage", imageUri);

        // Save to database
        if (user?.id) {
          try {
            await ApiService.updateUserProfileImage(imageUri);
            showSnackbar(
              "Profile picture saved to database successfully!",
              "success"
            );
          } catch (dbError) {
            // Continue with AsyncStorage fallback
          }
        }

        showSnackbar("Profile picture updated successfully!", "success");
      }
    } catch (error) {
      showSnackbar("Failed to take photo. Please try again.", "error");
    }
  };

  const showImagePickerOptions = () => {
    setIsImagePickerVisible(true);
  };

  const removeProfileImage = async () => {
    try {
      setProfileImage(null);

      // Remove from AsyncStorage
      await AsyncStorage.removeItem("profileImage");

      // Remove from database
      if (user?.id) {
        try {
          await ApiService.removeUserProfileImage();
          showSnackbar(
            "Profile picture removed from database successfully!",
            "success"
          );
        } catch (dbError) {
          // Continue with AsyncStorage fallback
        }
      }

      showSnackbar("Profile picture removed successfully!", "success");
    } catch (error) {
      showSnackbar(
        "Failed to remove profile picture. Please try again.",
        "error"
      );
    }
  };

  useEffect(() => {
    if (showSecurityNotice !== undefined) {
      setLocalSecurityNotice(showSecurityNotice);
    }
  }, [showSecurityNotice]);

  useEffect(() => {
    if (showSecurityNotice === undefined) {
      resetToDefault();
    } else if (showSecurityNotice === false) {
      ensureEnabled();
    } else {
      setLocalSecurityNotice(showSecurityNotice);
    }
  }, []);

  const showSnackbar = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await getUserSettings();
      if (settings) {
        setUserSettings(settings);
        setEditForm({
          paymentFrequency: settings.payment_frequency || "monthly",
          paymentAmount: (settings.payment_amount || "").toString(),
          tithingPercentage: (settings.tithing_percentage || "10").toString(),
          tithingEnabled: settings.tithing_enabled === 1,
        });
      }
    } catch (error) {
      showSnackbar("Failed to load settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataUsage = async () => {
    try {
      const usage = await getDataUsage();
      setDataUsage(usage);
    } catch (error) {
      showSnackbar(
        error?.message || "Failed to load data usage. Please try again.",
        "error"
      );
    }
  };

  const loadDataRetention = async () => {
    try {
      const retention = await AsyncStorage.getItem("dataRetentionDays");
      if (retention) {
        setDataRetentionDays(parseInt(retention));
      }
    } catch (error) {}
  };

  const saveDataRetention = async (days) => {
    try {
      // Save to database
      await ApiService.setUserPreference("dataRetentionDays", days);

      // Also save to AsyncStorage as fallback
      await AsyncStorage.setItem("dataRetentionDays", days.toString());
      setDataRetentionDays(days);
    } catch (error) {
      // Error saving data retention
    }
  };

  const handleSecurityToggle = async (enabled) => {
    if (enabled) {
      showSnackbar("Choose security method: Set PIN or Use Biometric", "info");
      const result = await toggleSecurity(true, "pin");
      if (result === "pin") {
        setPinStep("pin");
        setPinInput("");
        setConfirmPinInput("");
        setPinSetupVisible(true);
      }
    } else {
      showSnackbar(
        "Security will be disabled. You can re-enable it anytime.",
        "info"
      );
      await toggleSecurity(false);
      showSnackbar("Security disabled", "info");
    }
  };

  const toggleSection = useCallback((sectionName) => {
    setExpandedSections((prev) => {
      const newState = {
        ...prev,
        [sectionName]: !prev[sectionName],
      };
      return newState;
    });
  }, []);

  const handlePinSetup = async () => {
    if (pinStep === "pin") {
      if (pinInput.length < 4) {
        showSnackbar("PIN must be at least 4 digits", "error");
        return;
      }
      setPinStep("confirm");
    } else {
      if (pinInput !== confirmPinInput) {
        showSnackbar("PINs do not match. Please try again.", "error");
        setConfirmPinInput("");
        return;
      }

      try {
        // Call backend API to change PIN
        const response = await ApiService.changePin({
          currentPin: pin, // Use current PIN as old PIN
          newPin: pinInput,
        });

        if (response.success) {
          // Update local security context
          await setAppPin(pinInput);
          showSnackbar("PIN changed successfully!", "success");
          setPinSetupVisible(false);
          setPinStep("pin");
          setPinInput("");
          setConfirmPinInput("");
        } else {
          showSnackbar("Failed to change PIN. Please try again.", "error");
        }
      } catch (error) {
        showSnackbar(
          "Failed to change PIN. Please check your current PIN.",
          "error"
        );
      }
    }
  };

  const handlePinManagement = () => {
    if (pin) {
      setPinStep("pin");
      setPinInput("");
      setConfirmPinInput("");
      setPinSetupVisible(true);
    } else {
      setPinStep("pin");
      setPinInput("");
      setConfirmPinInput("");
      setPinSetupVisible(true);
    }
  };

  const handleSecurityNoticeToggle = async (enabled) => {
    if (!enabled) {
      showSnackbar(
        "Security notice must remain enabled for your safety",
        "info"
      );
      return;
    }

    setLocalSecurityNotice(enabled);
    try {
      await updateSecurityNoticeSetting(enabled);
    } catch (error) {
      setLocalSecurityNotice(!enabled);
      showSnackbar("Failed to update security notice setting", "error");
      return;
    }
    showSnackbar(
      enabled ? "Security notice enabled" : "Security notice disabled",
      "info"
    );
  };

  const handleResetSecurity = async () => {
    try {
      await resetSecurity();
      showSnackbar("Security settings reset successfully", "success");
    } catch (error) {
      showSnackbar("Failed to reset security settings", "error");
    }
  };

  const handleForceResetSecurityNotice = async () => {
    try {
      await forceReset();
      showSnackbar("Security notice reset to default successfully", "success");
    } catch (error) {
      showSnackbar("Failed to reset security notice", "error");
    }
  };

  const handleSaveSettings = async () => {
    if (!editForm.paymentAmount || parseFloat(editForm.paymentAmount) <= 0) {
      showSnackbar("Please enter a valid payment amount.", "error");
      return;
    }

    if (
      editForm.tithingEnabled &&
      (parseFloat(editForm.tithingPercentage) < 0 ||
        parseFloat(editForm.tithingPercentage) > 100)
    ) {
      showSnackbar(
        "Please enter a valid percentage between 0 and 100.",
        "error"
      );
      return;
    }

    try {
      await saveUserSettings(
        editForm.paymentFrequency,
        parseFloat(editForm.paymentAmount),
        parseFloat(editForm.tithingPercentage),
        editForm.tithingEnabled
      );

      setUserSettings({
        ...userSettings,
        payment_frequency: editForm.paymentFrequency,
        payment_amount: parseFloat(editForm.paymentAmount),
        tithing_percentage: parseFloat(editForm.tithingPercentage),
        tithing_enabled: editForm.tithingEnabled ? 1 : 0,
      });

      setEditMode(false);
      showSnackbar("Settings updated successfully!", "success");
    } catch (error) {
      showSnackbar(
        error?.message || "Failed to save settings. Please try again.",
        "error"
      );
    }
  };

  const handleClearOldData = async () => {
    try {
      await clearOldData(dataRetentionDays);
      showSnackbar("Old data cleared successfully!", "success");
      loadDataUsage();
    } catch (error) {
      showSnackbar(
        error?.message || "Failed to clear old data. Please try again.",
        "error"
      );
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      showSnackbar("Data exported successfully!", "success");
    } catch (error) {
      showSnackbar(
        error?.message || "Failed to export data. Please try again.",
        "error"
      );
    }
  };

  const handleBackupData = async () => {
    try {
      const data = await backupData();
      showSnackbar("Data backed up successfully!", "success");
    } catch (error) {
      showSnackbar(
        error?.message || "Failed to backup data. Please try again.",
        "error"
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Call backend API to delete account
      const response = await ApiService.deleteAccount(pin);

      if (response.success) {
        // Clear all local data
        await clearAllData();
        showSnackbar("Account deleted successfully!", "success");

        setTimeout(() => {
          navigation.replace("SignUp");
        }, 2000);
      } else {
        showSnackbar("Failed to delete account. Please try again.", "error");
      }
    } catch (error) {
      showSnackbar("Failed to delete account. Please check your PIN.", "error");
    }
  };

  const handleResetApp = async () => {
    try {
      await clearOldData(0);
      await resetSecurity();
      await cancelAllNotifications();

      // Use the new clearAllData function from AuthContext
      const result = await clearAllData();

      if (result.success) {
        showSnackbar("App reset complete! Please restart the app.", "success");

        setTimeout(() => {
          navigation.replace("SignUp");
        }, 2000);
      } else {
        showSnackbar("Failed to reset app. Please try again.", "error");
      }
    } catch (error) {
      showSnackbar("Failed to reset app. Please try again.", "error");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showSnackbar("Signed out successfully", "success");
      navigation.reset({
        index: 0,
        routes: [{ name: "SignIn" }],
      });
    } catch (error) {
      showSnackbar("Error signing out", "error");
    }
  };

  const calculateTithing = () => {
    if (!editForm.paymentAmount || !editForm.tithingEnabled) return 0;
    const amount = parseFloat(editForm.paymentAmount);
    const percentage = parseFloat(editForm.tithingPercentage);
    return (amount * percentage) / 100;
  };

  const calculateRemaining = () => {
    if (!editForm.paymentAmount) return 0;
    const amount = parseFloat(editForm.paymentAmount);
    const tithing = calculateTithing();
    return amount - tithing;
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    };
    return labels[frequency] || frequency;
  };

  const handleProfileEdit = () => {
    setProfileEditMode(true);
    setProfileForm({
      username: user?.username || "",
      email: user?.email || "",
    });
  };

  const handleProfileCancel = async () => {
    setProfileEditMode(false);
    await loadSettings(); // Reload settings to revert profile form
  };

  const handleProfileSave = async () => {
    if (!profileForm.username) {
      showSnackbar("Username cannot be empty.", "error");
      return;
    }
    if (!profileForm.email || !profileForm.email.includes("@")) {
      showSnackbar("Please enter a valid email address.", "error");
      return;
    }

    try {
      // Call backend API to update profile
      const response = await ApiService.updateUserProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      });

      if (response.success) {
        // Update local user data
        const result = await updateUser({
          username: profileForm.username.trim(),
          email: profileForm.email.trim(),
        });

        if (result.success) {
          showSnackbar("Profile updated successfully!", "success");
          setProfileEditMode(false);
        } else {
          showSnackbar(
            "Profile updated on server but failed to update locally",
            "warning"
          );
        }
      } else {
        showSnackbar("Failed to update profile. Please try again.", "error");
      }
    } catch (error) {
      showSnackbar("Failed to save profile. Please try again.", "error");
    }
  };

  const handlePinChange = () => {
    setPinStep("pin");
    setPinInput("");
    setConfirmPinInput("");
    setPinSetupVisible(true);
  };

  const handleCurrencyChange = async (currency) => {
    try {
      // Save to database
      await ApiService.setUserPreference("defaultCurrency", currency);

      // Also save to AsyncStorage as fallback
      await AsyncStorage.setItem("defaultCurrency", currency);

      setDefaultCurrency(currency);
      setShowCurrencyModal(false);
      showSnackbar(`Default currency set to ${currency}`, "success");
    } catch (error) {
      showSnackbar("Failed to update currency", "error");
    }
  };

  const handlePaymentMethodChange = async (method) => {
    try {
      // Save to database
      await ApiService.setUserPreference("defaultPaymentMethod", method);

      // Also save to AsyncStorage as fallback
      await AsyncStorage.setItem("defaultPaymentMethod", method);

      setDefaultPaymentMethod(method);
      setShowPaymentMethodModal(false);
      showSnackbar(`Default payment method set to ${method}`, "success");
    } catch (error) {
      showSnackbar("Failed to update payment method", "error");
    }
  };

  const handleStartOfWeekChange = async (day) => {
    try {
      // Save to database
      await ApiService.setUserPreference("startOfWeek", day);

      // Also save to AsyncStorage as fallback
      await AsyncStorage.setItem("startOfWeek", day);

      setStartOfWeek(day);
      setShowStartOfWeekModal(false);
      showSnackbar(`Start of week set to ${day}`, "success");
    } catch (error) {
      showSnackbar("Failed to update start of week", "error");
    }
  };

  const loadAppPreferences = async () => {
    try {
      // Try to load from database first
      const dbPreferences = await ApiService.getUserPreferences();
      if (dbPreferences.success && dbPreferences.preferences) {
        const prefs = dbPreferences.preferences;
        if (prefs.defaultCurrency) setDefaultCurrency(prefs.defaultCurrency);
        if (prefs.defaultPaymentMethod)
          setDefaultPaymentMethod(prefs.defaultPaymentMethod);
        if (prefs.startOfWeek) setStartOfWeek(prefs.startOfWeek);
        if (prefs.dataRetentionDays)
          setDataRetentionDays(parseInt(prefs.dataRetentionDays));
        if (prefs.autoLockDelay)
          setAutoLockDelay(parseInt(prefs.autoLockDelay));
      }
    } catch (error) {
      // Error loading preferences from database
    }

    // Fallback to AsyncStorage
    try {
      const currency = await AsyncStorage.getItem("defaultCurrency");
      const paymentMethod = await AsyncStorage.getItem("defaultPaymentMethod");
      const weekStart = await AsyncStorage.getItem("startOfWeek");
      const retention = await AsyncStorage.getItem("dataRetentionDays");
      const autoLock = await AsyncStorage.getItem("autoLockDelay");

      if (currency) setDefaultCurrency(currency);
      if (paymentMethod) setDefaultPaymentMethod(paymentMethod);
      if (weekStart) setStartOfWeek(weekStart);
      if (retention) setDataRetentionDays(parseInt(retention));
      if (autoLock) setAutoLockDelay(parseInt(autoLock));
    } catch (error) {
      // Error loading app preferences from AsyncStorage
    }
  };

  const loadCategories = async () => {
    try {
      const response = await ApiService.getCategories();
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (error) {
      // Fallback to default categories if API fails
      setCategories([
        {
          id: 1,
          name: "Food & Dining",
          color: "#FF6B6B",
          icon: "food",
          type: "expense",
        },
        {
          id: 2,
          name: "Transport",
          color: "#4ECDC4",
          icon: "car",
          type: "expense",
        },
        {
          id: 3,
          name: "Shopping",
          color: "#45B7D1",
          icon: "shopping",
          type: "expense",
        },
        {
          id: 4,
          name: "Bills & Utilities",
          color: "#96CEB4",
          icon: "lightning-bolt",
          type: "expense",
        },
        {
          id: 5,
          name: "Entertainment",
          color: "#FFEAA7",
          icon: "gamepad-variant",
          type: "expense",
        },
        {
          id: 6,
          name: "Healthcare",
          color: "#DDA0DD",
          icon: "medical-bag",
          type: "expense",
        },
        {
          id: 7,
          name: "Education",
          color: "#98D8C8",
          icon: "school",
          type: "expense",
        },
        {
          id: 8,
          name: "Other",
          color: "#F7DC6F",
          icon: "dots-horizontal",
          type: "expense",
        },
      ]);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await ApiService.getPaymentMethods();
      if (response.success) {
        setPaymentMethods(response.paymentMethods);
      }
    } catch (error) {
      // Fallback to default payment methods if API fails
      setPaymentMethods([
        { id: 1, name: "Cash", icon: "cash", color: "#4CAF50" },
        {
          id: 2,
          name: "MTN Mobile Money",
          icon: "cellphone",
          color: "#FF9800",
        },
        { id: 3, name: "Telecel Cash", icon: "cellphone", color: "#E91E63" },
        {
          id: 4,
          name: "AirtelTigo Money",
          icon: "cellphone",
          color: "#2196F3",
        },
        { id: 5, name: "Bank Transfer", icon: "bank", color: "#795548" },
        { id: 6, name: "Credit Card", icon: "credit-card", color: "#607D8B" },
        {
          id: 7,
          name: "Debit Card",
          icon: "credit-card-outline",
          color: "#9C27B0",
        },
      ]);
    }
  };

  const handleManageCategories = () => {
    setShowCategoriesModal(true);
  };

  const handleManagePaymentMethods = () => {
    setShowPaymentMethodsModal(true);
  };

  const handleHelpCenter = () => {
    setShowHelpModal(true);
  };

  const handleContactUs = () => {
    setShowContactModal(true);
  };

  const handleTutorial = () => {
    setShowTutorialModal(true);
  };

  const handleSendFeedback = () => {
    setShowFeedbackModal(true);
  };

  const handlePrivacyPolicy = () => {
    setShowPrivacyModal(true);
  };

  const handleTermsOfService = () => {
    setShowTermsModal(true);
  };

  // Categories Management Functions
  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        const response = await ApiService.createCategory({
          name: newCategoryName.trim(),
          type: "expense",
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          icon: "tag",
        });

        if (response.success) {
          await loadCategories(); // Reload from database
          setNewCategoryName("");
          setShowAddCategoryModal(false);
          showSnackbar("Category added successfully!", "success");
        } else {
          showSnackbar("Failed to add category", "error");
        }
      } catch (error) {
        showSnackbar("Failed to add category. Please try again.", "error");
      }
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  const handleUpdateCategory = async () => {
    if (newCategoryName.trim() && editingCategory) {
      try {
        const response = await ApiService.updateCategory(editingCategory.id, {
          name: newCategoryName.trim(),
        });

        if (response.success) {
          await loadCategories(); // Reload from database
          setEditingCategory(null);
          setNewCategoryName("");
          showSnackbar("Category updated successfully!", "success");
        } else {
          showSnackbar("Failed to update category", "error");
        }
      } catch (error) {
        showSnackbar("Failed to update category. Please try again.", "error");
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const response = await ApiService.deleteCategory(categoryId);
      if (response.success) {
        await loadCategories(); // Reload from database
        showSnackbar("Category deleted successfully!", "success");
      } else {
        showSnackbar("Failed to delete category", "error");
      }
    } catch (error) {
      showSnackbar("Failed to delete category. Please try again.", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName("");
  };

  // Payment Methods Management Functions
  const handleAddPaymentMethod = async () => {
    if (newPaymentMethodName.trim()) {
      try {
        const response = await ApiService.createPaymentMethod({
          name: newPaymentMethodName.trim(),
          icon: "credit-card",
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        });

        if (response.success) {
          await loadPaymentMethods(); // Reload from database
          setNewPaymentMethodName("");
          setShowAddPaymentMethodModal(false);
          showSnackbar("Payment method added successfully!", "success");
        } else {
          showSnackbar("Failed to add payment method", "error");
        }
      } catch (error) {
        showSnackbar(
          "Failed to add payment method. Please try again.",
          "error"
        );
      }
    }
  };

  const handleEditPaymentMethod = (method) => {
    setEditingPaymentMethod(method);
    setNewPaymentMethodName(method.name);
  };

  const handleUpdatePaymentMethod = async () => {
    if (newPaymentMethodName.trim() && editingPaymentMethod) {
      try {
        const response = await ApiService.updatePaymentMethod(
          editingPaymentMethod.id,
          {
            name: newPaymentMethodName.trim(),
          }
        );

        if (response.success) {
          await loadPaymentMethods(); // Reload from database
          setEditingPaymentMethod(null);
          setNewPaymentMethodName("");
          showSnackbar("Payment method updated successfully!", "success");
        } else {
          showSnackbar("Failed to update payment method", "error");
        }
      } catch (error) {
        showSnackbar(
          "Failed to update payment method. Please try again.",
          "error"
        );
      }
    }
  };

  const handleDeletePaymentMethod = (methodId) => {
    setPaymentMethods(
      paymentMethods.filter((method) => method.id !== methodId)
    );
    showSnackbar("Payment method deleted successfully!", "success");
  };

  const handleCancelPaymentMethodEdit = () => {
    setEditingPaymentMethod(null);
    setNewPaymentMethodName("");
  };

  // Help & Support Functions
  const handleHelpTopicSelect = (topic) => {
    setHelpTopics((prevTopics) => {
      const newTopics = prevTopics.map((t) =>
        t.id === topic.id ? { ...t, expanded: !t.expanded } : t
      );
      return newTopics;
    });
  };

  const handleContactSupport = () => {
    // In a real app, this would open email or phone
    showSnackbar("Contact support at: dennisopokuamponsah86@gmail.com", "info");
  };

  const handleTutorialStart = () => {
    // In a real app, this would start an interactive tutorial
    showSnackbar("Tutorial feature coming soon!", "info");
  };

  const handleFeedbackSubmit = () => {
    if (feedbackMessage.trim()) {
      // In a real app, this would send feedback to server
      showSnackbar("Thank you for your feedback!", "success");
      setFeedbackMessage("");
      setShowFeedbackInput(false);
    }
  };

  const handlePrivacyPolicyView = () => {
    // In a real app, this would show actual privacy policy
    showSnackbar(
      "Privacy Policy: We protect your data with encryption and secure storage.",
      "info"
    );
  };

  const handleTermsOfServiceView = () => {
    // In a real app, this would show actual terms of service
    showSnackbar(
      "Terms of Service: By using this app, you agree to our terms and conditions.",
      "info"
    );
  };

  return (
    <LinearGradient colors={["#4CAF50", "#2196F3"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Settings</Text>
            {/* <Text style={styles.headerSubtitle}>
              {isLoading ? "Loading..." : "Manage your preferences"}
            </Text> */}
          </View>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={showImagePickerOptions}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileInitials}>
                <Text style={styles.profileInitialsText}>
                  {user?.username
                    ? user.username.substring(0, 2).toUpperCase()
                    : "U"}
                </Text>
              </View>
            )}
            <View style={styles.editIconContainer}>
              <MaterialIcons name="edit" size={12} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.contentContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <ExpandableSection
            title="Payment Settings"
            icon="credit-card"
            isExpanded={expandedSections.paymentSettings}
            onToggle={() => toggleSection("paymentSettings")}
          >
            <View style={styles.cardHeader}>
              <Button
                mode={editMode ? "contained" : "outlined"}
                onPress={() => setEditMode(!editMode)}
                compact
              >
                {editMode ? "Save" : "Edit"}
              </Button>
            </View>

            {editMode ? (
              <View>
                <View style={styles.frequencyContainer}>
                  <Text style={styles.label}>Payment Frequency</Text>
                  <View style={styles.frequencyButtons}>
                    {["daily", "weekly", "monthly"].map((freq) => (
                      <Button
                        key={freq}
                        mode={
                          editForm.paymentFrequency === freq
                            ? "contained"
                            : "outlined"
                        }
                        onPress={() =>
                          setEditForm({ ...editForm, paymentFrequency: freq })
                        }
                        style={styles.frequencyButton}
                        compact
                      >
                        {getFrequencyLabel(freq)}
                      </Button>
                    ))}
                  </View>
                </View>

                <TextInput
                  label="Payment Amount"
                  value={editForm.paymentAmount}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, paymentAmount: text })
                  }
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  placeholder="Enter your payment amount"
                />

                <View style={styles.tithingContainer}>
                  <View style={styles.tithingHeader}>
                    <Text style={styles.label}>Tithing</Text>
                    <PaperSwitch
                      value={editForm.tithingEnabled}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, tithingEnabled: value })
                      }
                      color="#2196F3"
                    />
                  </View>

                  {editForm.tithingEnabled && (
                    <TextInput
                      label="Tithing Percentage"
                      value={editForm.tithingPercentage}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, tithingPercentage: text })
                      }
                      keyboardType="numeric"
                      mode="outlined"
                      style={styles.input}
                      placeholder="10"
                      right={<TextInput.Affix text="%" />}
                    />
                  )}
                </View>

                {editForm.paymentAmount && (
                  <Card style={styles.summaryCard}>
                    <Card.Content>
                      <Title style={styles.summaryTitle}>Summary</Title>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Payment Amount:</Text>
                        <Text style={styles.summaryValue}>
                          ${parseFloat(editForm.paymentAmount || 0).toFixed(2)}
                        </Text>
                      </View>
                      {editForm.tithingEnabled && (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>
                            Tithing ({editForm.tithingPercentage}%):
                          </Text>
                          <Text style={styles.summaryValue}>
                            -${calculateTithing().toFixed(2)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                          Available for Expenses:
                        </Text>
                        <Text
                          style={[styles.summaryValue, styles.remainingValue]}
                        >
                          ${calculateRemaining().toFixed(2)}
                        </Text>
                      </View>
                    </Card.Content>
                  </Card>
                )}

                <View style={styles.editButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setEditMode(false);
                      loadSettings();
                    }}
                    style={styles.editButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSaveSettings}
                    style={styles.editButton}
                  >
                    Save Changes
                  </Button>
                </View>
              </View>
            ) : (
              <View>
                <List.Item
                  title="Payment Frequency"
                  description={getFrequencyLabel(
                    userSettings?.payment_frequency
                  )}
                  left={(props) => (
                    <List.Icon {...props} icon="calendar-month" />
                  )}
                />
                <Divider style={styles.itemDivider} />
                <List.Item
                  title="Payment Amount"
                  left={(props) => <List.Icon {...props} icon="currency-usd" />}
                />
                <Divider style={styles.itemDivider} />
                <List.Item
                  title="Tithing"
                  left={(props) => <List.Icon {...props} icon="church" />}
                />
              </View>
            )}
          </ExpandableSection>

          <ExpandableSection
            title="Notifications"
            icon="bell"
            isExpanded={expandedSections.notifications}
            onToggle={() => toggleSection("notifications")}
          >
            <List.Item
              title="Daily Reminders"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationSettings?.daily || false}
                  onValueChange={(value) =>
                    updateNotificationSetting("daily", value)
                  }
                  color="#2196F3"
                />
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Weekly Summaries"
              left={(props) => <List.Icon {...props} icon="view-week" />}
              right={() => (
                <Switch
                  value={notificationSettings?.weekly || false}
                  onValueChange={(value) =>
                    updateNotificationSetting("weekly", value)
                  }
                  color="#2196F3"
                />
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Monthly Summaries"
              left={(props) => <List.Icon {...props} icon="calendar-month" />}
              right={() => (
                <Switch
                  value={notificationSettings?.monthly || false}
                  onValueChange={(value) =>
                    updateNotificationSetting("monthly", value)
                  }
                  color="#2196F3"
                />
              )}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Email Reports"
            icon="email"
            isExpanded={expandedSections.emailReports}
            onToggle={() => toggleSection("emailReports")}
          >
            <List.Item
              title="Weekly Email Reports"
              description="Receive detailed weekly budget reports via email"
              left={(props) => <List.Icon {...props} icon="email" />}
              right={() => (
                <Switch
                  value={emailSettings.weeklyReports}
                  onValueChange={(value) =>
                    setEmailSettings((prev) => ({
                      ...prev,
                      weeklyReports: value,
                    }))
                  }
                  color="#2196F3"
                />
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Monthly Email Reports"
              description="Receive comprehensive monthly financial summaries"
              left={(props) => <List.Icon {...props} icon="email-multiple" />}
              right={() => (
                <Switch
                  value={emailSettings.monthlyReports}
                  onValueChange={(value) =>
                    setEmailSettings((prev) => ({
                      ...prev,
                      monthlyReports: value,
                    }))
                  }
                  color="#2196F3"
                />
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Email Address"
              description={emailSettings.emailAddress || "Not set"}
              left={(props) => <List.Icon {...props} icon="at" />}
              onPress={() => {
                Alert.prompt(
                  "Email Address",
                  "Enter your email address for reports:",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Save",
                      onPress: (text) => {
                        if (text && text.includes("@")) {
                          setEmailSettings((prev) => ({
                            ...prev,
                            emailAddress: text,
                          }));
                          showSnackbar("Email address updated!", "success");
                        } else {
                          showSnackbar(
                            "Please enter a valid email address",
                            "error"
                          );
                        }
                      },
                    },
                  ],
                  "plain-text",
                  emailSettings.emailAddress || ""
                );
              }}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Email Reports"
            icon="email"
            isExpanded={expandedSections.emailReports}
            onToggle={() => toggleSection("emailReports")}
          >
            <List.Item
              title="Weekly Email Reports"
              description="Receive detailed weekly budget reports via email"
              left={(props) => <List.Icon {...props} icon="email" />}
              right={() => (
                <Switch
                  value={emailSettings.weeklyReports}
                  onValueChange={(value) =>
                    setEmailSettings((prev) => ({
                      ...prev,
                      weeklyReports: value,
                    }))
                  }
                  color="#2196F3"
                />
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Monthly Email Reports"
              description="Receive comprehensive monthly financial summaries"
              left={(props) => <List.Icon {...props} icon="email-multiple" />}
              right={() => (
                <Switch
                  value={emailSettings.monthlyReports}
                  onValueChange={(value) =>
                    setEmailSettings((prev) => ({
                      ...prev,
                      monthlyReports: value,
                    }))
                  }
                  color="#2196F3"
                />
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Email Address"
              description={emailSettings.emailAddress || "Not set"}
              left={(props) => <List.Icon {...props} icon="at" />}
              onPress={() => {
                Alert.prompt(
                  "Email Address",
                  "Enter your email address for reports:",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Save",
                      onPress: (text) => {
                        if (text && text.includes("@")) {
                          setEmailSettings((prev) => ({
                            ...prev,
                            emailAddress: text,
                          }));
                          showSnackbar("Email address updated!", "success");
                        } else {
                          showSnackbar(
                            "Please enter a valid email address",
                            "error"
                          );
                        }
                      },
                    },
                  ],
                  "plain-text",
                  emailSettings.emailAddress || ""
                );
              }}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Data Management"
            icon="database"
            isExpanded={expandedSections.dataManagement}
            onToggle={() => toggleSection("dataManagement")}
          >
            <List.Item
              title="Data Retention"
              description={`Keep expenses for ${dataRetentionDays} days`}
              left={(props) => <List.Icon {...props} icon="database" />}
            />

            <View style={styles.retentionSlider}>
              <Text
                style={[
                  styles.retentionLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Days to keep data:
              </Text>
              <View style={styles.retentionButtons}>
                {[30, 90, 180, 365].map((days) => (
                  <Button
                    key={days}
                    mode={dataRetentionDays === days ? "contained" : "outlined"}
                    onPress={() => saveDataRetention(days)}
                    compact
                    style={styles.retentionButton}
                  >
                    {days}
                  </Button>
                ))}
              </View>
            </View>

            <Divider style={styles.itemDivider} />

            <List.Item
              title="Export Data"
              description="Download all data as JSON"
              left={(props) => <List.Icon {...props} icon="download" />}
              right={() => (
                <Button mode="outlined" compact onPress={handleExportData}>
                  Export
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Backup & Restore"
              description="Create backup of your data"
              left={(props) => <List.Icon {...props} icon="backup-restore" />}
              right={() => (
                <Button mode="outlined" compact onPress={handleBackupData}>
                  Backup
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Data Usage"
              description={`${dataUsage.totalRecords} records (${dataUsage.databaseSize})`}
              left={(props) => <List.Icon {...props} icon="cloud-download" />}
              right={() => (
                <Button mode="outlined" compact onPress={loadDataUsage}>
                  Refresh
                </Button>
              )}
            />

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleClearOldData}
              style={styles.dangerButton}
              textColor="#F44336"
            >
              Clear Old Data
            </Button>
          </ExpandableSection>

          <ExpandableSection
            title="Account Settings"
            icon="account"
            isExpanded={expandedSections.accountSettings}
            onToggle={() => toggleSection("accountSettings")}
          >
            {profileEditMode ? (
              <View>
                <TextInput
                  label="Username"
                  value={profileForm.username}
                  onChangeText={(text) =>
                    setProfileForm({ ...profileForm, username: text })
                  }
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="account" />}
                />

                <TextInput
                  label="Email"
                  value={profileForm.email}
                  onChangeText={(text) =>
                    setProfileForm({ ...profileForm, email: text })
                  }
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="email" />}
                />

                <View style={styles.editButtons}>
                  <Button
                    mode="outlined"
                    onPress={handleProfileCancel}
                    style={styles.editButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleProfileSave}
                    style={styles.editButton}
                  >
                    Save Changes
                  </Button>
                </View>
              </View>
            ) : (
              <>
                <List.Item
                  title="Username"
                  description={user?.username || "Not set"}
                  left={(props) => <List.Icon {...props} icon="account" />}
                  right={() => (
                    <Button mode="outlined" compact onPress={handleProfileEdit}>
                      Edit
                    </Button>
                  )}
                />
                <Divider style={styles.itemDivider} />
                <List.Item
                  title="Email"
                  description={user?.email || "Not set"}
                  left={(props) => <List.Icon {...props} icon="email" />}
                  right={() => (
                    <Button mode="outlined" compact onPress={handleProfileEdit}>
                      Edit
                    </Button>
                  )}
                />
                <Divider style={styles.itemDivider} />
                <List.Item
                  title="Authentication Method"
                  description="PIN"
                  left={(props) => <List.Icon {...props} icon="lock" />}
                  right={() => (
                    <Button mode="outlined" compact onPress={handlePinChange}>
                      Change PIN
                    </Button>
                  )}
                />
              </>
            )}

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleDeleteAccount}
              style={styles.dangerButton}
              textColor="#FF9800"
            >
              Delete Account
            </Button>
          </ExpandableSection>

          <ExpandableSection
            title="App Preferences"
            icon="cog"
            isExpanded={expandedSections.appPreferences}
            onToggle={() => toggleSection("appPreferences")}
          >
            <List.Item
              title="Default Currency"
              description={defaultCurrency}
              left={(props) => <List.Icon {...props} icon="currency-usd" />}
              right={() => (
                <Button
                  mode="outlined"
                  compact
                  onPress={() => setShowCurrencyModal(true)}
                >
                  Change
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Default Payment Method"
              description={defaultPaymentMethod}
              left={(props) => <List.Icon {...props} icon="credit-card" />}
              right={() => (
                <Button
                  mode="outlined"
                  compact
                  onPress={() => setShowPaymentMethodModal(true)}
                >
                  Change
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Theme"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <View style={styles.themeButtons}>
                  <Button
                    mode={themeMode === "light" ? "contained" : "outlined"}
                    compact
                    onPress={() => setTheme("light")}
                    style={styles.themeButton}
                  >
                    Light
                  </Button>
                  <Button
                    mode={themeMode === "dark" ? "contained" : "outlined"}
                    compact
                    onPress={() => setTheme("dark")}
                    style={styles.themeButton}
                  >
                    Dark
                  </Button>
                  <Button
                    mode={themeMode === "system" ? "contained" : "outlined"}
                    compact
                    onPress={() => setTheme("system")}
                    style={styles.themeButton}
                  >
                    Auto
                  </Button>
                </View>
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Start of Week"
              description={
                startOfWeek.charAt(0).toUpperCase() + startOfWeek.slice(1)
              }
              left={(props) => <List.Icon {...props} icon="view-week" />}
              right={() => (
                <Button
                  mode="outlined"
                  compact
                  onPress={() => setShowStartOfWeekModal(true)}
                >
                  Change
                </Button>
              )}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Security & Privacy"
            icon="shield-check"
            isExpanded={expandedSections.security}
            onToggle={() => toggleSection("security")}
          >
            <List.Item
              title="App Security"
              description={isSecurityEnabled ? "Enabled" : "Disabled"}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="shield-check"
                  color={theme.colors.primary}
                />
              )}
              right={() => (
                <Switch
                  value={isSecurityEnabled}
                  onValueChange={handleSecurityToggle}
                  color={theme.colors.primary}
                />
              )}
            />
            <Divider style={styles.itemDivider} />

            <List.Item
              title="Show Security Notice"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="bell-outline"
                  color={theme.colors.primary}
                />
              )}
              right={() => (
                <Switch
                  value={localSecurityNotice}
                  onValueChange={handleSecurityNoticeToggle}
                  color={theme.colors.primary}
                />
              )}
            />

            <List.Item
              title="PIN Lock"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="lock"
                  color={theme.colors.primary}
                />
              )}
              right={() => (
                <Button
                  mode="outlined"
                  compact
                  onPress={() => handlePinManagement()}
                  textColor={theme.colors.primary}
                  outlineColor={theme.colors.primary}
                  disabled={!isSecurityEnabled}
                >
                  {pin ? "Change" : "Set"}
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />

            {isBiometricAvailable && (
              <List.Item
                title="Biometric Lock"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="fingerprint"
                    color={theme.colors.primary}
                  />
                )}
                right={() => (
                  <Switch
                    value={isBiometricEnabled}
                    onValueChange={toggleBiometric}
                    color={theme.colors.primary}
                    disabled={!isSecurityEnabled}
                  />
                )}
              />
            )}
            {isBiometricAvailable && <Divider style={styles.itemDivider} />}

            {!isSecurityEnabled && (
              <Text style={styles.securityInfoText}>
                Enable App Security above to use auto-lock features
              </Text>
            )}

            <List.Item
              title="Auto Lock"
              description={`Lock app after ${autoLockTimeout} minutes of inactivity`}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="clock-outline"
                  color={theme.colors.primary}
                />
              )}
              right={() => (
                <Switch
                  value={autoLockEnabled}
                  onValueChange={toggleAutoLock}
                  color={theme.colors.primary}
                  disabled={!isSecurityEnabled}
                />
              )}
            />

            {autoLockEnabled && isSecurityEnabled && (
              <View style={styles.autoLockContainer}>
                <Text style={styles.autoLockLabel}>Timeout (minutes):</Text>
                <View style={styles.autoLockButtons}>
                  {[1, 5, 15, 30].map((minutes) => (
                    <Button
                      key={minutes}
                      mode={
                        autoLockTimeout === minutes ? "contained" : "outlined"
                      }
                      onPress={() => setAutoLockTimeoutValue(minutes)}
                      compact
                      style={styles.autoLockButton}
                    >
                      {minutes}
                    </Button>
                  ))}
                </View>
              </View>
            )}
            <Divider style={styles.itemDivider} />

            <List.Item
              title="Auto-Lock When Leaving App"
              description={`Lock app ${autoLockOnLeave === 0 ? "immediately" : `after ${autoLockOnLeave} minute(s)`} when leaving`}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="exit-to-app"
                  color={theme.colors.primary}
                />
              )}
              right={() => (
                <Button
                  mode="outlined"
                  compact
                  onPress={() => setShowAutoLockModal(true)}
                  textColor={theme.colors.primary}
                  outlineColor={theme.colors.primary}
                  disabled={!isSecurityEnabled}
                >
                  {autoLockOnLeave === 0 ? "Immediate" : `${autoLockOnLeave}m`}
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />

            <List.Item
              title="Lock App Now"
              description="Immediately lock the app"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="lock-clock"
                  color={theme.colors.primary}
                />
              )}
              right={() => (
                <Button
                  mode="outlined"
                  compact
                  onPress={lockApp}
                  textColor={theme.colors.error}
                  outlineColor={theme.colors.error}
                  disabled={!isSecurityEnabled}
                >
                  Lock
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />

            <List.Item
              title="Reset Security"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="security"
                  color={theme.colors.warning}
                />
              )}
              right={() => (
                <Button
                  mode="outlined"
                  compact
                  onPress={handleResetSecurity}
                  textColor={theme.colors.warning}
                  outlineColor={theme.colors.warning}
                  disabled={!isSecurityEnabled}
                >
                  Reset
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />

            <List.Item
              title="Privacy Policy"
              description="View privacy policy"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={() => (
                <Button mode="outlined" compact onPress={handlePrivacyPolicy}>
                  View
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />

            <List.Item
              title="Terms of Service"
              description="View terms"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={() => (
                <Button mode="outlined" compact onPress={handleTermsOfService}>
                  View
                </Button>
              )}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Categories & Payment Methods"
            icon="tag-multiple"
            isExpanded={expandedSections.categories}
            onToggle={() => toggleSection("categories")}
          >
            <List.Item
              title="Manage Categories"
              left={(props) => <List.Icon {...props} icon="tag-multiple" />}
              right={() => (
                <Button
                  mode="outlined"
                  compact
                  onPress={handleManageCategories}
                >
                  Manage
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Payment Methods"
              left={(props) => (
                <List.Icon {...props} icon="credit-card-multiple" />
              )}
              right={() => (
                <Button
                  mode="outlined"
                  compact
                  onPress={handleManagePaymentMethods}
                >
                  Manage
                </Button>
              )}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Help & Support"
            icon="help-circle"
            isExpanded={expandedSections.helpSupport}
            onToggle={() => toggleSection("helpSupport")}
          >
            <List.Item
              title="Help Center"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={() => (
                <Button mode="outlined" compact onPress={handleHelpCenter}>
                  Open
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Contact Us"
              left={(props) => <List.Icon {...props} icon="message" />}
              right={() => (
                <Button mode="outlined" compact onPress={handleContactUs}>
                  Contact
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Tutorial"
              left={(props) => <List.Icon {...props} icon="play-circle" />}
              right={() => (
                <Button mode="outlined" compact onPress={handleTutorial}>
                  Replay
                </Button>
              )}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Send Feedback"
              left={(props) => <List.Icon {...props} icon="comment-text" />}
              right={() => (
                <Button mode="outlined" compact onPress={handleSendFeedback}>
                  Send
                </Button>
              )}
            />
          </ExpandableSection>

          <ExpandableSection
            title="App Information"
            icon="information"
            isExpanded={expandedSections.appInformation}
            onToggle={() => toggleSection("appInformation")}
          >
            <List.Item
              title="Version"
              description={Constants.expoConfig?.version || "1.0.0"}
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Build"
              description={
                Constants.expoConfig?.runtimeVersion || "Development"
              }
              left={(props) => <List.Icon {...props} icon="code-braces" />}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="Database"
              description="Neon Database"
              left={(props) => <List.Icon {...props} icon="database" />}
            />
            <Divider style={styles.itemDivider} />
            <List.Item
              title="About"
              description="Learn more about this app"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={() => (
                <Button mode="outlined" compact onPress={() => {}}>
                  View
                </Button>
              )}
            />
          </ExpandableSection>

          <ExpandableSection
            title="App Reset"
            icon="refresh"
            isExpanded={expandedSections.appReset}
            onToggle={() => toggleSection("appReset")}
            showDivider={false}
          >
            <Text style={styles.warningText}>
              Warning: This will delete all your data and reset the app to its
              initial state.
            </Text>
            <View style={styles.resetButtons}>
              <Button
                mode="outlined"
                onPress={handleResetApp}
                style={styles.dangerButton}
                textColor="#F44336"
              >
                Reset App
              </Button>
              <Button
                mode="outlined"
                onPress={handleSignOut}
                style={styles.dangerButton}
                textColor="#FF9800"
              >
                Sign Out
              </Button>
            </View>
          </ExpandableSection>

          <Portal>
            <Modal
              visible={pinSetupVisible}
              onDismiss={() => setPinSetupVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>
                    {pinStep === "pin" ? "Set Your PIN" : "Confirm Your PIN"}
                  </Title>
                  <Text style={styles.modalSubtitle}>
                    {pinStep === "pin"
                      ? "Choose a 4-6 digit PIN to secure your app"
                      : "Re-enter your PIN to confirm"}
                  </Text>

                  <TextInput
                    label={pinStep === "pin" ? "Enter PIN" : "Confirm PIN"}
                    value={pinStep === "pin" ? pinInput : confirmPinInput}
                    onChangeText={
                      pinStep === "pin" ? setPinInput : setConfirmPinInput
                    }
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.modalInput}
                    placeholder="PIN"
                    maxLength={6}
                    secureTextEntry
                    textColor={theme.colors.text}
                    placeholderTextColor={theme.colors.textSecondary}
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                  />

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setPinSetupVisible(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handlePinSetup}
                      disabled={
                        (pinStep === "pin" && pinInput.length < 4) ||
                        (pinStep === "confirm" && confirmPinInput.length < 4)
                      }
                      style={styles.modalButton}
                      buttonColor={theme.colors.primary}
                      textColor="#FFFFFF"
                    >
                      {pinStep === "pin" ? "Continue" : "Set PIN"}
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          <Portal>
            <Modal
              visible={isImagePickerVisible}
              onDismiss={() => setIsImagePickerVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>
                    Update Profile Picture
                  </Title>
                  <Text style={styles.modalSubtitle}>
                    Choose how you want to update your profile picture
                  </Text>

                  <View style={styles.imagePickerButtons}>
                    <Button
                      mode="contained"
                      onPress={() => {
                        takePhoto();
                        setIsImagePickerVisible(false);
                      }}
                      style={styles.imagePickerButton}
                      buttonColor="#4CAF50"
                      textColor="#FFFFFF"
                      icon="camera"
                    >
                      Take Photo
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => {
                        pickImage();
                        setIsImagePickerVisible(false);
                      }}
                      style={styles.imagePickerButton}
                      buttonColor="#2196F3"
                      textColor="#FFFFFF"
                      icon="image"
                    >
                      Choose from Gallery
                    </Button>
                    {profileImage && (
                      <Button
                        mode="outlined"
                        onPress={() => {
                          removeProfileImage();
                          setIsImagePickerVisible(false);
                        }}
                        style={styles.imagePickerButton}
                        textColor="#F44336"
                        outlineColor="#F44336"
                        icon="delete"
                      >
                        Remove Picture
                      </Button>
                    )}
                  </View>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setIsImagePickerVisible(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Cancel
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Currency Selection Modal */}
          <Portal>
            <Modal
              visible={showCurrencyModal}
              onDismiss={() => setShowCurrencyModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>
                    Select Default Currency
                  </Title>
                  <Text style={styles.modalSubtitle}>
                    Choose your preferred currency for transactions
                  </Text>

                  <View style={styles.currencyButtons}>
                    {[
                      "GHC",
                      "USD",
                      "EUR",
                      "GBP",
                      "JPY",
                      "CAD",
                      "AUD",
                      "CHF",
                      "CNY",
                    ].map((currency) => (
                      <Button
                        key={currency}
                        mode={
                          defaultCurrency === currency
                            ? "contained"
                            : "outlined"
                        }
                        onPress={() => handleCurrencyChange(currency)}
                        style={styles.currencyButton}
                        buttonColor={
                          defaultCurrency === currency
                            ? theme.colors.primary
                            : undefined
                        }
                        textColor={
                          defaultCurrency === currency ? "#FFFFFF" : undefined
                        }
                      >
                        {currency}
                      </Button>
                    ))}
                  </View>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowCurrencyModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Cancel
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Payment Method Selection Modal */}
          <Portal>
            <Modal
              visible={showPaymentMethodModal}
              onDismiss={() => setShowPaymentMethodModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>
                    Select Default Payment Method
                  </Title>
                  <Text style={styles.modalSubtitle}>
                    Choose your preferred payment method
                  </Text>

                  <View style={styles.paymentMethodButtons}>
                    {[
                      "Cash",
                      "Credit Card",
                      "Debit Card",
                      "Bank Transfer",
                      "Digital Wallet",
                      "Check",
                    ].map((method) => (
                      <Button
                        key={method}
                        mode={
                          defaultPaymentMethod === method
                            ? "contained"
                            : "outlined"
                        }
                        onPress={() => handlePaymentMethodChange(method)}
                        style={styles.paymentMethodButton}
                        buttonColor={
                          defaultPaymentMethod === method
                            ? theme.colors.primary
                            : undefined
                        }
                        textColor={
                          defaultPaymentMethod === method
                            ? "#FFFFFF"
                            : undefined
                        }
                      >
                        {method}
                      </Button>
                    ))}
                  </View>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowPaymentMethodModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Cancel
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Start of Week Selection Modal */}
          <Portal>
            <Modal
              visible={showStartOfWeekModal}
              onDismiss={() => setShowStartOfWeekModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>Select Start of Week</Title>
                  <Text style={styles.modalSubtitle}>
                    Choose which day your week starts on
                  </Text>

                  <View style={styles.startOfWeekButtons}>
                    {["monday", "sunday"].map((day) => (
                      <Button
                        key={day}
                        mode={startOfWeek === day ? "contained" : "outlined"}
                        onPress={() => handleStartOfWeekChange(day)}
                        style={styles.startOfWeekButton}
                        buttonColor={
                          startOfWeek === day ? theme.colors.primary : undefined
                        }
                        textColor={startOfWeek === day ? "#FFFFFF" : undefined}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </Button>
                    ))}
                  </View>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowStartOfWeekModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Cancel
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Categories Management Modal */}
          <Portal>
            <Modal
              visible={showCategoriesModal}
              onDismiss={() => setShowCategoriesModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>Manage Categories</Title>
                  <Text style={styles.modalSubtitle}>
                    Add, edit, or remove expense categories
                  </Text>

                  {/* Add New Category */}
                  <View style={styles.addItemContainer}>
                    <TextInput
                      label="Category Name"
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      mode="outlined"
                      style={styles.addItemInput}
                      placeholder="Enter category name"
                    />
                    <Button
                      mode="contained"
                      onPress={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      style={styles.addItemButton}
                    >
                      Add
                    </Button>
                  </View>

                  {/* Categories List */}
                  <ScrollView
                    style={styles.itemsList}
                    showsVerticalScrollIndicator={false}
                  >
                    {categories.map((category) => (
                      <View key={category.id} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <View
                            style={[
                              styles.itemColor,
                              { backgroundColor: category.color },
                            ]}
                          />
                          <Text style={styles.itemName}>{category.name}</Text>
                        </View>
                        <View style={styles.itemActions}>
                          <Button
                            mode="outlined"
                            compact
                            onPress={() => handleEditCategory(category)}
                            style={styles.actionButton}
                          >
                            Edit
                          </Button>
                          <Button
                            mode="outlined"
                            compact
                            onPress={() => handleDeleteCategory(category.id)}
                            textColor="#F44336"
                            outlineColor="#F44336"
                            style={styles.actionButton}
                          >
                            Delete
                          </Button>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Edit Category Modal */}
                  {editingCategory && (
                    <View style={styles.editItemContainer}>
                      <Text style={styles.editItemTitle}>Edit Category</Text>
                      <TextInput
                        label="Category Name"
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                        mode="outlined"
                        style={styles.editItemInput}
                      />
                      <View style={styles.editItemButtons}>
                        <Button
                          mode="outlined"
                          onPress={handleCancelEdit}
                          style={styles.editItemButton}
                        >
                          Cancel
                        </Button>
                        <Button
                          mode="contained"
                          onPress={handleUpdateCategory}
                          disabled={!newCategoryName.trim()}
                          style={styles.editItemButton}
                        >
                          Update
                        </Button>
                      </View>
                    </View>
                  )}

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowCategoriesModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Close
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Payment Methods Management Modal */}
          <Portal>
            <Modal
              visible={showPaymentMethodsModal}
              onDismiss={() => setShowPaymentMethodsModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>
                    Manage Payment Methods
                  </Title>
                  <Text style={styles.modalSubtitle}>
                    Add, edit, or remove payment methods
                  </Text>

                  {/* Add New Payment Method */}
                  <View style={styles.addItemContainer}>
                    <TextInput
                      label="Payment Method Name"
                      value={newPaymentMethodName}
                      onChangeText={setNewPaymentMethodName}
                      mode="outlined"
                      style={styles.addItemInput}
                      placeholder="Enter payment method name"
                    />
                    <Button
                      mode="contained"
                      onPress={handleAddPaymentMethod}
                      disabled={!newPaymentMethodName.trim()}
                      style={styles.addItemButton}
                    >
                      Add
                    </Button>
                  </View>

                  {/* Payment Methods List */}
                  <ScrollView
                    style={styles.itemsList}
                    showsVerticalScrollIndicator={false}
                  >
                    {paymentMethods.map((method) => (
                      <View key={method.id} style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <View
                            style={[
                              styles.itemColor,
                              { backgroundColor: method.color },
                            ]}
                          />
                          <Text style={styles.itemName}>{method.name}</Text>
                        </View>
                        <View style={styles.itemActions}>
                          <Button
                            mode="outlined"
                            compact
                            onPress={() => handleEditPaymentMethod(method)}
                            style={styles.actionButton}
                          >
                            Edit
                          </Button>
                          <Button
                            mode="outlined"
                            compact
                            onPress={() => handleDeletePaymentMethod(method.id)}
                            textColor="#F44336"
                            outlineColor="#F44336"
                            style={styles.actionButton}
                          >
                            Delete
                          </Button>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Edit Payment Method Modal */}
                  {editingPaymentMethod && (
                    <View style={styles.editItemContainer}>
                      <Text style={styles.editItemTitle}>
                        Edit Payment Method
                      </Text>
                      <TextInput
                        label="Payment Method Name"
                        value={newPaymentMethodName}
                        onChangeText={setNewPaymentMethodName}
                        mode="outlined"
                        style={styles.editItemInput}
                      />
                      <View style={styles.editItemButtons}>
                        <Button
                          mode="outlined"
                          onPress={handleCancelPaymentMethodEdit}
                          style={styles.editItemButton}
                        >
                          Cancel
                        </Button>
                        <Button
                          mode="contained"
                          onPress={handleUpdatePaymentMethod}
                          disabled={!newPaymentMethodName.trim()}
                          style={styles.editItemButton}
                        >
                          Update
                        </Button>
                      </View>
                    </View>
                  )}

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowPaymentMethodsModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Close
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Help Center Modal */}
          <Portal>
            <Modal
              visible={showHelpModal}
              onDismiss={() => setShowHelpModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>Help Center</Title>
                  <Text style={styles.modalSubtitle}>
                    Get help with using the app
                  </Text>

                  <ScrollView
                    style={styles.helpTopicsList}
                    showsVerticalScrollIndicator={false}
                  >
                    {helpTopics.map((topic) => (
                      <View key={topic.id} style={styles.helpTopicItem}>
                        <TouchableOpacity
                          style={styles.helpTopicHeader}
                          onPress={() => handleHelpTopicSelect(topic)}
                        >
                          <View style={styles.helpTopicContent}>
                            <Text style={styles.helpTopicTitle}>
                              {topic.title}
                            </Text>
                          </View>
                          <MaterialIcons
                            name={
                              topic.expanded ? "expand-less" : "expand-more"
                            }
                            size={24}
                            color="#666"
                          />
                        </TouchableOpacity>
                        {topic.expanded && (
                          <View style={styles.helpTopicExpanded}>
                            <Text style={styles.helpTopicFullContent}>
                              {topic.content}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowHelpModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Close
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Contact Us Modal */}
          <Portal>
            <Modal
              visible={showContactModal}
              onDismiss={() => setShowContactModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>Contact Us</Title>
                  <Text style={styles.modalSubtitle}>
                    Get in touch with our support team
                  </Text>

                  <View style={styles.contactInfoContainer}>
                    <View style={styles.contactItem}>
                      <MaterialIcons
                        name="email"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <View style={styles.contactDetails}>
                        <Text style={styles.contactLabel}>Email Support</Text>
                        <Text style={styles.contactValue}>
                          dennisopokuamponsah86@gmail.com
                        </Text>
                      </View>
                    </View>

                    <View style={styles.contactItem}>
                      <MaterialIcons
                        name="phone"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <View style={styles.contactDetails}>
                        <Text style={styles.contactLabel}>Phone Support</Text>
                        <Text style={styles.contactValue}>
                          +233 24 566 0786
                        </Text>
                      </View>
                    </View>

                    <View style={styles.contactItem}>
                      <MaterialIcons
                        name="schedule"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <View style={styles.contactDetails}>
                        <Text style={styles.contactLabel}>Support Hours</Text>
                        <Text style={styles.contactValue}>
                          Mon-Fri: 8AM-6PM GMT
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="contained"
                      onPress={handleContactSupport}
                      style={styles.modalButton}
                      buttonColor={theme.colors.primary}
                    >
                      Contact Support
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => setShowContactModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Close
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Tutorial Modal */}
          <Portal>
            <Modal
              visible={showTutorialModal}
              onDismiss={() => setShowTutorialModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>Tutorial</Title>
                  <Text style={styles.modalSubtitle}>
                    Learn how to use the app step by step
                  </Text>

                  <View style={styles.tutorialStepsContainer}>
                    <View style={styles.tutorialStep}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>
                          Add Your First Expense
                        </Text>
                        <Text style={styles.stepDescription}>
                          Go to the Expenses tab and tap the + button to add
                          your first expense.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.tutorialStep}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>2</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Set Up Categories</Text>
                        <Text style={styles.stepDescription}>
                          Customize your expense categories in Settings to match
                          your spending habits.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.tutorialStep}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>3</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Create a Budget</Text>
                        <Text style={styles.stepDescription}>
                          Set monthly spending limits in the Budget tab to stay
                          on track.
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="contained"
                      onPress={handleTutorialStart}
                      style={styles.modalButton}
                      buttonColor={theme.colors.primary}
                    >
                      Start Tutorial
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => setShowTutorialModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Close
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Feedback Modal */}
          <Portal>
            <Modal
              visible={showFeedbackModal}
              onDismiss={() => setShowFeedbackModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>Send Feedback</Title>
                  <Text style={styles.modalSubtitle}>
                    Share your thoughts with us
                  </Text>

                  <TextInput
                    label="Your Feedback"
                    value={feedbackMessage}
                    onChangeText={setFeedbackMessage}
                    mode="outlined"
                    style={styles.feedbackInput}
                    placeholder="Tell us what you think about the app..."
                    multiline
                    numberOfLines={4}
                  />

                  <View style={styles.modalButtons}>
                    <Button
                      mode="contained"
                      onPress={handleFeedbackSubmit}
                      disabled={!feedbackMessage.trim()}
                      style={styles.modalButton}
                      buttonColor={theme.colors.primary}
                    >
                      Send Feedback
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => setShowFeedbackModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Cancel
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Privacy Policy Modal */}
          <Portal>
            <Modal
              visible={showPrivacyModal}
              onDismiss={() => setShowPrivacyModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>Privacy Policy</Title>
                  <Text style={styles.modalSubtitle}>
                    How we protect your data
                  </Text>

                  <Text style={styles.modalInfo}>
                    Privacy policy content will be implemented in a future
                    update.
                  </Text>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowPrivacyModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Close
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Terms of Service Modal */}
          <Portal>
            <Modal
              visible={showTermsModal}
              onDismiss={() => setShowTermsModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>Terms of Service</Title>
                  <Text style={styles.modalSubtitle}>
                    Terms and conditions of use
                  </Text>

                  <Text style={styles.modalInfo}>
                    Terms of service content will be implemented in a future
                    update.
                  </Text>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowTermsModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Close
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          {/* Auto-Lock On Leave Modal */}
          <Portal>
            <Modal
              visible={showAutoLockModal}
              onDismiss={() => setShowAutoLockModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.modalTitle}>
                    Auto-Lock When Leaving App
                  </Title>
                  <Text style={styles.modalSubtitle}>
                    Choose when the app should automatically lock after you
                    leave
                  </Text>

                  <View style={styles.autoLockOptionsContainer}>
                    {[
                      {
                        value: 0,
                        label: "Immediately",
                        description: "Lock as soon as you leave the app",
                      },
                      {
                        value: 1,
                        label: "1 Minute",
                        description: "Wait 1 minute after leaving",
                      },
                      {
                        value: 2,
                        label: "2 Minutes",
                        description: "Wait 2 minutes after leaving",
                      },
                      {
                        value: 3,
                        label: "3 Minutes",
                        description: "Wait 3 minutes after leaving",
                      },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.autoLockOption,
                          autoLockOnLeave === option.value &&
                            styles.autoLockOptionSelected,
                        ]}
                        onPress={() => setAutoLockOnLeaveValue(option.value)}
                      >
                        <View style={styles.autoLockOptionContent}>
                          <Text
                            style={[
                              styles.autoLockOptionLabel,
                              autoLockOnLeave === option.value &&
                                styles.autoLockOptionLabelSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text
                            style={[
                              styles.autoLockOptionDescription,
                              autoLockOnLeave === option.value &&
                                styles.autoLockOptionDescriptionSelected,
                            ]}
                          >
                            {option.description}
                          </Text>
                        </View>
                        {autoLockOnLeave === option.value && (
                          <MaterialIcons
                            name="check-circle"
                            size={24}
                            color={theme.colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowAutoLockModal(false)}
                      style={styles.modalButton}
                      textColor={theme.colors.textSecondary}
                      outlineColor={theme.colors.border}
                    >
                      Close
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Modal>
          </Portal>

          <Snackbar
            visible={snackbarVisible}
            onDismiss={hideSnackbar}
            duration={3000}
            style={{
              backgroundColor:
                snackbarType === "success"
                  ? "#4CAF50"
                  : snackbarType === "error"
                    ? "#F44336"
                    : "#2196F3",
            }}
            action={{
              label: "Dismiss",
              onPress: hideSnackbar,
            }}
          >
            {snackbarMessage}
          </Snackbar>
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  header: {
    backgroundColor: "transparent",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    top: 7,
  },
  profileImageContainer: {
    position: "relative",
    marginLeft: 15,
    bottom: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  profileInitials: {
    width: 60,
    height: 60,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  profileInitialsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 1,
  },
  editIconContainer: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  card: {
    margin: 10,
    marginTop: 5,
    marginBottom: 15,
    elevation: 4,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  frequencyContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  frequencyButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  frequencyButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
  },
  tithingContainer: {
    marginBottom: 20,
  },
  tithingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: "#f8f9fa",
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  remainingValue: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "bold",
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  editButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  retentionSlider: {
    marginVertical: 15,
  },
  retentionLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  retentionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  retentionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  divider: {
    marginVertical: 20,
  },
  dangerButton: {
    borderColor: "#F44336",
    marginTop: 10,
  },
  warningText: {
    fontSize: 14,
    color: "#F44336",
    marginBottom: 15,
    textAlign: "center",
    fontStyle: "italic",
  },
  themeButtons: {
    flexDirection: "row",
    gap: 5,
  },
  themeButton: {
    minWidth: 50,
  },
  modalContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    margin: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    elevation: 8,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
  },
  modalInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  imagePickerButtons: {
    marginBottom: 20,
    gap: 15,
  },
  imagePickerButton: {
    marginBottom: 10,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 20,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  itemDivider: {
    marginVertical: 10,
    backgroundColor: "#BDBDBD",
    height: 1.5,
  },
  resetButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  autoLockContainer: {
    marginVertical: 15,
    paddingHorizontal: 16,
  },
  autoLockLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  autoLockButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  autoLockButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  autoLockOptionsContainer: {
    marginVertical: 20,
  },
  autoLockOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
  },
  autoLockOptionSelected: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  autoLockOptionContent: {
    flex: 1,
  },
  autoLockOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  autoLockOptionLabelSelected: {
    color: "#2196F3",
  },
  autoLockOptionDescription: {
    fontSize: 14,
    color: "#666",
  },
  autoLockOptionDescriptionSelected: {
    color: "#1976D2",
  },
  securityNoticeResetContainer: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  securityNoticeResetButton: {
    alignSelf: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  securityInfoText: {
    fontSize: 14,
    color: "#FF9800",
    marginTop: 10,
    marginBottom: 15,
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
    color: "#333",
  },
  sectionContent: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionDivider: {
    marginTop: 4,
    marginHorizontal: 16,
    height: 1,
    backgroundColor: "#9E9E9E",
  },
  // Categories and Payment Methods styles
  addItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  addItemInput: {
    flex: 1,
  },
  addItemButton: {
    minWidth: 80,
  },
  itemsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    minWidth: 60,
  },
  editItemContainer: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  editItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  editItemInput: {
    marginBottom: 12,
  },
  editItemButtons: {
    flexDirection: "row",
    gap: 10,
  },
  editItemButton: {
    flex: 1,
  },
  // Help & Support styles
  helpTopicsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  helpTopicItem: {
    flexDirection: "column",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 8,
    width: "100%",
  },
  helpTopicContent: {
    flex: 1,
    width: "100%",
  },
  helpTopicTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },

  helpTopicHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "100%",
  },
  contactInfoContainer: {
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  contactDetails: {
    marginLeft: 16,
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: "#666",
  },
  tutorialStepsContainer: {
    marginBottom: 20,
  },
  tutorialStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00897B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  feedbackInput: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
  },
  helpTopicExpanded: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 8,
    marginTop: 4,
    marginHorizontal: 0,
    borderWidth: 3,
    borderColor: "#FF0000",
    alignSelf: "stretch",
    width: "100%",
  },
  helpTopicFullContent: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    fontWeight: "400",
  },
});

export default SettingsScreen;
