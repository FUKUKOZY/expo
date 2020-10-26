import { EventEmitter } from '@unimodules/core';
import { useEffect, useLayoutEffect, useState } from 'react';
import { addNotificationResponseReceivedListener } from './NotificationsEmitter';
// We need any native module for EventEmitter
// to be able to be subscribed to.
const MockNativeModule = {
    addListener: () => { },
    removeListeners: () => { },
};
// Event emitter used solely for the purpose
// of distributing initial notification response
// to useInitialNotificationResponse hook
const eventEmitter = new EventEmitter(MockNativeModule);
const RESPONSE_EVENT_TYPE = 'response';
// Initial notification response caught by
// global subscription
let globalInitialNotificationResponse = undefined;
// A subscription for initial notification response,
// cleared immediately once we believe we have caught
// the initial notification response or there will be none
// (by useInitialNotificationResponse hook).
let globalSubscription = addNotificationResponseReceivedListener(response => {
    // If useInitialNotificationResponse is already registered we want to
    // notify it
    eventEmitter.emit(RESPONSE_EVENT_TYPE, response);
    // If useInitialNotificationResponse isn't registered yet, we'll provide it
    // with good initial value.
    globalInitialNotificationResponse = response;
    ensureGlobalSubscriptionIsCleared();
});
function ensureGlobalSubscriptionIsCleared() {
    if (globalSubscription) {
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
    const [initialNotificationResponse, setInitialNotificationResponse] = useState(globalInitialNotificationResponse);
    useLayoutEffect(() => {
        // Register for internal initial notification response events
        const subscription = eventEmitter.addListener(RESPONSE_EVENT_TYPE, response => {
            setInitialNotificationResponse(currentResponse => currentResponse ?? response);
        });
        // In case global subscription has already triggered
        // and we missed the eventEmitter notification reset the value
        setInitialNotificationResponse(currentResponse => currentResponse ?? globalInitialNotificationResponse);
        // Clear the subscription as hook cleanup
        return () => subscription.remove();
    }, []);
    useEffect(() => {
        // process.nextTick & requestAnimationFrame-like,
        // without this on iOS the subscription is cleared
        // before it's triggered
        setTimeout(() => {
            // If there was an "initial notification response"
            // it has already been delivered.
            ensureGlobalSubscriptionIsCleared();
            // Ensure the value is not undefined (if by this time
            // it's still undefined there was no "initial notification response").
            setInitialNotificationResponse(currentResponse => currentResponse ?? null);
        }, 0);
    }, []);
    return initialNotificationResponse;
}
//# sourceMappingURL=useInitialNotificationResponse.js.map