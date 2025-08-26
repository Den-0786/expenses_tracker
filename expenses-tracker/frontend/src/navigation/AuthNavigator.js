import React, { useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../context/AuthContext";

import SplashScreen from "../screens/SplashScreen";
import SignUpScreen from "../screens/SignUpScreen";
import SignInScreen from "../screens/SignInScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import MainTabNavigator from "./MainTabNavigator";
import NotesScreen from "../screens/NotesScreen";

const Stack = createStackNavigator();

const AuthNavigator = () => {
  const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Notes" component={NotesScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
