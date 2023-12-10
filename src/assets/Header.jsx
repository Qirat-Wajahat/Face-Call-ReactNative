import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Animated} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {useNavigation} from '@react-navigation/native';

const Header = ({handleLogout}) => {
  const [showSideMenu, setShowSideMenu] = useState(false);
  const slideAnimation = useRef(new Animated.Value(-300)).current;

  const navigation = useNavigation();

  const openMenu = () => {
    setShowSideMenu(true);

    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnimation, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowSideMenu(false));
  };

  const toggleSideMenu = () => {
    if (showSideMenu) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleOpenInAppBrowser = async () => {
    if (await InAppBrowser.isAvailable()) {
      const url = 'https://uphello.in';
      const result = await InAppBrowser.open(url, {
        showTitle: true,
        enableUrlBarHiding: true,
        enableDefaultShare: true,
        forceCloseOnRedirection: false,
        hasBackButton: true,
        includeReferrel: true,
        animated: true,
      });
      console.log(result);
    } else {
      console.error('InAppBrowser is null');
    }
  };

  useEffect(() => {
    slideAnimation.setValue(-300);
  }, []);

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerLeft} onPress={toggleSideMenu}>
        <Icon
          name={showSideMenu ? 'keyboard-arrow-left' : 'menu'}
          size={25}
          color="#000000"
          style={styles.headerMenuIcon}
        />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Face Call</Text>

      <Animated.View
        style={[
          styles.sideMenu,
          {transform: [{translateX: slideAnimation}]},
          showSideMenu ? null : {display: 'none'},
        ]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            toggleSideMenu;
            navigation.navigate('EditProfile');
          }}>
          <Icon name="account-circle" size={25} color="gray" />
          <Text style={styles.menuText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={toggleSideMenu}>
          <Icon name="privacy-tip" size={25} color="gray" />
          <Text style={styles.menuText}>Privacy & Policies</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={toggleSideMenu}>
          <Icon name="thumb-up" size={25} color="gray" />

          <Text style={styles.menuText}>Rate App</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            toggleSideMenu();
            handleLogout();
          }}>
          <Icon name="exit-to-app" size={25} color="gray" />

          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity onPress={handleOpenInAppBrowser}>
        <View style={styles.headerRight}>
          <Icon
            name="shopping-bag"
            size={25}
            color="#000000"
            style={styles.headerPencilIcon}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 80,
    padding: 15,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#0a0a0a',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1e1e1',
    height: 40,
    width: 40,
    borderRadius: 25,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1e1e1',
    height: 40,
    width: 40,
    borderRadius: 25,
  },
  headerMenuIcon: {
    marginLeft: 7,
  },
  headerPencilIcon: {
    marginLeft: 7,
  },
  sideMenu: {
    position: 'absolute',
    top: 80,
    left: 0,
    backgroundColor: '#ffffff',
    width: 250,
    height: 'auto',
    elevation: 20,
    borderWidth: 0,
    zIndex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  menuText: {
    fontSize: 18,
    marginLeft: 10,
    color: '#333',
  },
});

export default Header;
