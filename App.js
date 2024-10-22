import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, useColorScheme, SafeAreaView, Image, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';

const Drawer = createDrawerNavigator();

function HomeScreen({ navigation, setOpenSettings, isDarkMode, toggleDarkMode }) {
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

  const openSettings = useCallback(() => {
    navigation.closeDrawer();
    bottomSheetRef.current?.expand();
  }, [navigation]);

  useEffect(() => {
    setOpenSettings(() => openSettings);
  }, [setOpenSettings, openSettings]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? 'black' : 'white' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: isDarkMode ? 'white' : 'black' }}>{currentModel}</Text>
          <TouchableOpacity onPress={() => {/* TODO: Implement model selection */}}>
            <Ionicons name="chevron-down" size={24} color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => {/* TODO: Implement new chat */}}>
          <Ionicons name="add" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('./assets/images/brain-gray.png')}
          style={{ width: 150, height: 150, opacity: 0.5 }}
          resizeMode="contain"
        />
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={{ flex: 1, alignItems: 'center', backgroundColor: isDarkMode ? 'black' : 'white' }}>
          <Text style={{ color: isDarkMode ? 'white' : 'black' }}>Settings</Text>
          <TouchableOpacity onPress={toggleDarkMode}>
            <Text style={{ color: isDarkMode ? 'white' : 'black' }}>
              {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </Text>
          </TouchableOpacity>
          {/* TODO: Add more settings options */}
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}

function CustomDrawerContent({ openSettings }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: 20, paddingLeft: 20 }}>
        {/* TODO: Add chat history */}
        <Text>Chat History GOES HERE</Text>
        <TouchableOpacity
          style={{ position: 'absolute', bottom: 20, left: 20 }}
          onPress={openSettings}
        >
          <Text>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [openSettings, setOpenSettings] = useState(() => () => {});

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawerContent {...props} openSettings={openSettings} />}
          screenOptions={{
            drawerStyle: {
              width: '85%',
            },
            overlayColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <Drawer.Screen 
            name="Home" 
            options={{ headerShown: false }}
          >
            {(props) => <HomeScreen {...props} setOpenSettings={setOpenSettings} />}
          </Drawer.Screen>
        </Drawer.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
