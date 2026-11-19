import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, EmptyState, Screen } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
        <EmptyState
          icon="compass-outline"
          title="Page not found"
          body="The screen you were looking for does not exist in MoneyGuard."
          action={<Button label="Go to home" onPress={() => router.replace('/')} />}
        />
      </View>
    </Screen>
  );
}
