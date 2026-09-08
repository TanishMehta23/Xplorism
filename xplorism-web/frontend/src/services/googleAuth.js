let isGoogleAuthInitialized = false;

const isNativePlatform = () => {
  return typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();
};

export const initGoogleAuth = async () => {
  if (isGoogleAuthInitialized) return;
  if (isNativePlatform()) {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.initialize({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      isGoogleAuthInitialized = true;
    } catch (e) {
      console.warn('Native GoogleAuth init warning:', e);
    }
  }
};

export const nativeGoogleSignIn = async () => {
  if (!isGoogleAuthInitialized) {
    await initGoogleAuth();
  }
  const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
  const googleUser = await GoogleAuth.signIn();
  // Return the idToken credential string
  const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;
  if (!idToken) {
    throw new Error('Google did not return an ID token.');
  }
  return idToken;
};
