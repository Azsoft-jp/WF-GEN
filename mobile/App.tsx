import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  let webAppUrl = process.env.EXPO_PUBLIC_WEB_APP_URL;

  if (!webAppUrl) {
    if (__DEV__) {
      webAppUrl = 'http://localhost:5173'; // Fallback for local development
    }
  }

  if (!webAppUrl) {
    return (
      <View style={styles.container}>
         <Text style={styles.errorText}>Configuration Error</Text>
         <Text style={styles.errorSubText}>EXPO_PUBLIC_WEB_APP_URL is not set.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <WebView 
        source={{ uri: webAppUrl }}
        style={styles.webview}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0c0c0e', // Match the Web dark theme background
  },
  webview: {
    flex: 1,
    backgroundColor: '#0c0c0e',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c0c0e',
    padding: 20,
  },
  errorText: {
    color: '#f27d26',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorSubText: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
  }
});
