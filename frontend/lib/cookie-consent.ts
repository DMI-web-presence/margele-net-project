export type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export const cookieConsentStorageKey = 'margele_cookie_consent_v1';

export const defaultCookiePreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export const readCookiePreferences = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedPreferences = window.localStorage.getItem(cookieConsentStorageKey);
    if (!storedPreferences) {
      return null;
    }

    const parsedPreferences = JSON.parse(storedPreferences) as Partial<CookiePreferences>;

    return {
      necessary: true,
      analytics: Boolean(parsedPreferences.analytics),
      marketing: Boolean(parsedPreferences.marketing),
    } satisfies CookiePreferences;
  } catch {
    return null;
  }
};

export const writeCookiePreferences = (nextPreferences: CookiePreferences) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    cookieConsentStorageKey,
    JSON.stringify({
      ...nextPreferences,
      updatedAt: new Date().toISOString(),
    }),
  );
};
