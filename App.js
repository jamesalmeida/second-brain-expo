import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { SafeAreaView, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Header from './components/Header';
import Settings from './components/Settings';
import ChatArea from './components/ChatArea';
import HamburgerMenu from './components/HamburgerMenu';
import BottomBar from './components/BottomBar';
import { ChatProvider, useChat } from './ChatContext';
import { Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';

const Drawer = createDrawerNavigator();

export default function App() {
  const [openSettings, setOpenSettings] = useState(() => (navigation) => {
    navigation.closeDrawer();
    bottomSheetRef.current?.expand();
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const bottomSheetRef = useRef(null);

  const snapPoints = useMemo(() => ['92%'], []);

  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
  }, []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ChatProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Drawer.Navigator
            drawerContent={(props) => (
              <HamburgerMenu 
                {...props} 
                openSettings={() => openSettings(props.navigation)} 
                isDarkMode={isDarkMode}
                navigation={props.navigation}
              />
            )}
            screenOptions={{
              drawerStyle: {
                width: '85%',
                backgroundColor: isDarkMode ? '#1c1c1e' : 'white',
              },
              overlayColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <Drawer.Screen 
              name="Settings" 
              options={{ headerShown: false }}
            >
              {({ navigation }) => {
                const { currentModel, setCurrentModel } = useChat(); // Access currentModel from context
                return (
                  <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? 'black' : 'white' }}>
                    <Header 
                      navigation={navigation} 
                      currentModel={currentModel} // Use currentModel from context
                      setCurrentModel={setCurrentModel} // Use setCurrentModel from context
                      isDarkMode={isDarkMode} 
                    />
                    <KeyboardAvoidingView 
                      behavior={Platform.OS === "ios" ? "padding" : "height"}
                      style={{ flex: 1 }}
                      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                    >
                      <ChatArea />
                      <BottomBar isDarkMode={isDarkMode} />
                    </KeyboardAvoidingView>
                    <Settings
                      bottomSheetRef={bottomSheetRef}
                      snapPoints={snapPoints}
                      handleSheetChanges={handleSheetChanges}
                      renderBackdrop={renderBackdrop}
                      isDarkMode={isDarkMode}
                      toggleDarkMode={toggleDarkMode}
                    />
                  </SafeAreaView>
                );
              }}
            </Drawer.Screen>
          </Drawer.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </ChatProvider>
  );
}
