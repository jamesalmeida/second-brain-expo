import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { SafeAreaView, View, TouchableOpacity, Dimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Header from './src/components/Header';
import Settings from './src/components/Settings';
import ChatArea from './src/components/ChatArea';
import HamburgerMenu from './src/components/HamburgerMenu';
import BottomBar from './src/components/BottomBar';
import { ChatProvider, useChat } from './src/contexts/ChatContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import { useDeviceType } from './hooks/useDeviceType';
import { PortalProvider } from '@gorhom/portal';

const Drawer = createDrawerNavigator();

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openSettings, setOpenSettings] = useState(() => (navigation) => {
    navigation.closeDrawer();
    bottomSheetRef.current?.expand();
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const bottomSheetRef = useRef(null);
  const bottomBarRef = useRef(null);

  const snapPoints = useMemo(() => ['92%'], []);

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
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
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
          renderBackdrop={renderBackdrop}
        />
      </SafeAreaView>
    );
  };

  // Adjust the drawer width based on the device and orientation
  const { isTablet, width, height } = useDeviceType();
  const isLandscape = width > height;
  const drawerWidth = isTablet ? (isLandscape ? '40%' : '33%') : '89%';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PortalProvider>
        <ThemeProvider>
          <ChatProvider>
            <NavigationContainer>
              <Drawer.Navigator
                drawerContent={(props) => (
                  <HamburgerMenu 
                    {...props} 
                    openSettings={() => openSettings(props.navigation)} 
                    navigation={props.navigation}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                  />
                )}
                screenOptions={{
                  drawerStyle: {
                    width: drawerWidth,
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
          </ChatProvider>
        </ThemeProvider>
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
