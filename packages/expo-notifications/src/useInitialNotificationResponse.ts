import { Subscription } from '@unimodules/core';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { NotificationResponse } from './Notifications.types';
import { addNotificationResponseReceivedListener } from './NotificationsEmitter';

// Initial notification response caught by
// global subscription
let globalInitialNotificationResponse: NotificationResponse | undefined = undefined;

// A subscription for initial notification response,
// cleared immediately once we believe we have caught
// the initial notification response or there will be none.
let globalSubscription: Subscription | null = addNotificationResponseReceivedListener(response => {
  // If useInitialNotificationResponse isn't registered yet, we'll provide it
  // with good initial value.
  globalInitialNotificationResponse = response;
  ensureGlobalSubscriptionIsCleared();
});

function dispatchGlobalSubscriptionClear() {
  // process.nextTick/requestAnimationFrame-like
  setTimeout(() => ensureGlobalSubscriptionIsCleared(), 0);
}

AppState.addEventListener('change', dispatchGlobalSubscriptionClear);

function ensureGlobalSubscriptionIsCleared() {
  if (globalSubscription) {
    AppState.removeEventListener('change', dispatchGlobalSubscriptionClear);
    globalSubscription.remove();
    globalSubscription = null;
  }
}

/**
 * Returns an initial notification response if the app
 * was opened as a result of tapping on a notification,
 * null if the app doesn't seem to be opened as a result
 * of tapping on a notification, undefined until we are sure
 * of which to return.
 */
export default function useInitialNotificationResponse() {
  const [initialNotificationResponse, setInitialNotificationResponse] = useState<
    NotificationResponse | null | undefined
  >(globalInitialNotificationResponse);

  useEffect(() => {
    // process.nextTick & requestAnimationFrame-like,
    // without this on iOS the subscription is cleared
    // before it's triggered
    setTimeout(() => {
      // Ensure the value is not undefined (if by this time
      // it's still undefined there was no "initial notification response").
      setInitialNotificationResponse(
        currentResponse => currentResponse ?? globalInitialNotificationResponse ?? null
      );
    }, 0);
  }, []);

  return initialNotificationResponse;
}
