/**
 * Converts Firebase Authentication error codes to user-friendly messages.
 */
export const getAuthErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists.';
      case 'auth/invalid-email':
        return 'Please provide a valid email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful attempts. Please wait a few minutes before trying again.';
      case 'auth/network-request-failed':
        return 'Network connection error. Please verify your connection and try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in window was closed before completion.';
      default:
        return (error as { message?: string }).message || 'An unexpected error occurred. Please try again.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};
