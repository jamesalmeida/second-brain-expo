import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { SafeAreaView, View, TouchableOpacity, Animated } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Header from './components/Header';
import Settings from './components/Settings';
import ChatArea from './components/ChatArea';
import HamburgerMenu from './components/HamburgerMenu';
import BottomBar from './components/BottomBar';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
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
  const bottomBarRef = useRef(null);

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

  const MainScreen = ({ navigation }) => {
    const { isDarkMode } = useTheme();
    const { currentModel, setCurrentModel } = useChat();

    const openSettings = () => {
      bottomSheetRef.current?.expand();
    };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? 'black' : 'white' }}>
        <Header 
          navigation={navigation} 
          currentModel={currentModel}
          setCurrentModel={setCurrentModel}
        />
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ChatArea bottomBarRef={bottomBarRef} openSettings={openSettings} />
          <BottomBar ref={bottomBarRef} />
        </KeyboardAvoidingView>
        <Settings
          bottomSheetRef={bottomSheetRef}
          snapPoints={snapPoints}
          handleSheetChanges={handleSheetChanges}
          renderBackdrop={renderBackdrop}
        />
      </SafeAreaView>
    );
  };

  return (
    <ChatProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <Drawer.Navigator
              drawerContent={(props) => (
                <HamburgerMenu 
                  {...props} 
                  openSettings={() => openSettings(props.navigation)} 
                  navigation={props.navigation}
                />
              )}
              screenOptions={{
                drawerStyle: {
                  width: '89%',
                },
                overlayColor: 'rgba(0,0,0,0.5)',
              }}
            >
              <Drawer.Screen 
                name="Home" 
                component={MainScreen}
                options={{ 
                  headerShown: false,
                  title: "Second Brain"
                }}
              />
            </Drawer.Navigator>
          </NavigationContainer>
        </GestureHandlerRootView>
      </ThemeProvider>
    </ChatProvider>
  );
}
