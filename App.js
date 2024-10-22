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
import { ChatProvider } from './ChatContext';

const Drawer = createDrawerNavigator();

export default function App() {
  const [openSettings, setOpenSettings] = useState(() => (navigation) => {
    navigation.closeDrawer();
    bottomSheetRef.current?.expand();
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentModel, setCurrentModel] = useState('GPT-4');
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
              {({ navigation }) => (
                <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? 'black' : 'white' }}>
                  <Header navigation={navigation} currentModel={currentModel} isDarkMode={isDarkMode} />
                  <View style={{ flex: 1 }}>
                    <ChatArea />
                    <BottomBar isDarkMode={isDarkMode} />
                  </View>
                  <Settings
                    bottomSheetRef={bottomSheetRef}
                    snapPoints={snapPoints}
                    handleSheetChanges={handleSheetChanges}
                    renderBackdrop={renderBackdrop}
                    isDarkMode={isDarkMode}
                    toggleDarkMode={toggleDarkMode}
                  />
                </SafeAreaView>
              )}
            </Drawer.Screen>
          </Drawer.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </ChatProvider>
  );
}
