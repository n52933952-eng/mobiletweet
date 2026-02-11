/**
 * Twitter Clone Mobile App
 * Main entry point
 */

import React, { useEffect } from 'react';
import { StatusBar, I18nManager } from 'react-native';
import { UserProvider } from './src/context/UserContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/constants';
import './src/config/firebase'; // Initialize Firebase & Google Sign-In
import oneSignalService from './src/services/onesignal';

function App(): React.JSX.Element {
  useEffect(() => {
    // Force LTR layout (disable RTL even if phone is Arabic)
    if (I18nManager.isRTL) {
      I18nManager.allowRTL(false);
      I18nManager.forceRTL(false);
    }

    // Initialize OneSignal for push notifications
    console.log('🔔 [App] Initializing OneSignal...');
    oneSignalService.initialize();
  }, []);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />
      <UserProvider>
        <NotificationProvider>
          <AppNavigator />
        </NotificationProvider>
      </UserProvider>
    </>
  );
}

export default App;
