import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SecurityNoticeContext = createContext();

export const useSecurityNotice = () => {
  const context = useContext(SecurityNoticeContext);
  if (!context) {
    throw new Error('useSecurityNotice must be used within a SecurityNoticeProvider');
  }
  return context;
};

export const SecurityNoticeProvider = ({ children }) => {
  const [showSecurityNotice, setShowSecurityNotice] = useState(true);

  useEffect(() => {
    loadSecurityNoticeSetting();
  }, []);

  const loadSecurityNoticeSetting = async () => {
    try {
      const setting = await AsyncStorage.getItem('showSecurityNotice');
      if (setting !== null) {
        setShowSecurityNotice(setting === 'true');
      }
    } catch (error) {
      console.log('Error loading security notice setting:', error);
    }
  };

  const updateSecurityNoticeSetting = async (enabled) => {
    try {
      await AsyncStorage.setItem('showSecurityNotice', enabled.toString());
      setShowSecurityNotice(enabled);
    } catch (error) {
      console.log('Error saving security notice setting:', error);
    }
  };

  const value = {
    showSecurityNotice,
    updateSecurityNoticeSetting,
  };

  return (
    <SecurityNoticeContext.Provider value={value}>
      {children}
    </SecurityNoticeContext.Provider>
  );
};
