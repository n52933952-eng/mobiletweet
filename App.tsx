/**
 * Twitter Clone Mobile App
 * Main entry point
 */

import React, { useEffect } from 'react';
import { StatusBar, I18nManager } from 'react-native';
import { UserProvider } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/constants';
import './src/config/firebase'; // Initialize Firebase & Google Sign-In

function App(): React.JSX.Element {
  useEffect(() => {
    // Force LTR layout (disable RTL even if phone is Arabic)
    if (I18nManager.isRTL) {
      I18nManager.allowRTL(false);
      I18nManager.forceRTL(false);
      // Note: App needs restart for RTL changes to take effect
      // But we're preventing RTL from ever being enabled
    }
  }, []);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />
      <UserProvider>
        <AppNavigator />
      </UserProvider>
    </>
  );
}

export default App;
