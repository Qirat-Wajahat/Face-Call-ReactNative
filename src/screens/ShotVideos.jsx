import {View, Text, StyleSheet, Pressable} from 'react-native';
import React from 'react';
import InAppBrowser from 'react-native-inappbrowser-reborn';

const ShortVideos = () => {
  const handleOpenInAppBrowser = async () => {
    if (await InAppBrowser.isAvailable()) {
      const url = 'https://youtube.com/shorts/ncQ3s91a0j8?si=ovGhdA-2MsnwOHlP';
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

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleOpenInAppBrowser}>
        <Text style={styles.text}>Click Me!</Text>
      </Pressable>
    </View>
  );
};

export default ShortVideos;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    color: '#757575',
    fontSize: 24,
  },
});
