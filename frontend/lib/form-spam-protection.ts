export function createFormSpamState() {
  return {
    websiteUrl: '',
    formStartedAt: Date.now(),
  };
}

export type FormSpamState = ReturnType<typeof createFormSpamState>;
