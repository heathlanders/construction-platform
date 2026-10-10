import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigation/AppNavigator';
import { databaseInitError } from '@/lib/database';

function ErrorScreen({ title, error }: { title: string; error: unknown }) {
  const message = error instanceof Error ? `${error.message}\n\n${error.stack ?? ''}` : String(error);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f1c2e' }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ color: '#ff8a8a', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>{title}</Text>
      <Text style={{ color: '#eaf0f6', fontSize: 13, fontFamily: 'monospace' }} selectable>
        {message}
      </Text>
    </ScrollView>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: unknown }
> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error('App crashed:', error);
  }

  render() {
    if (this.state.error) {
      return <ErrorScreen title="App error" error={this.state.error} />;
    }
    return this.props.children;
  }
}

export default function App() {
  // If the local DB couldn't initialize at all, show why instead of failing silently.
  if (databaseInitError) {
    return <ErrorScreen title="Database failed to initialize" error={databaseInitError} />;
  }
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
