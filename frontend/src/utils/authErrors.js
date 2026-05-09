export function authError(code) {
  const map = {
    'auth/email-already-in-use':                    'An account with this email already exists.',
    'auth/invalid-email':                            'Invalid email address.',
    'auth/weak-password':                            'Password must be at least 6 characters.',
    'auth/user-not-found':                           'Wrong email or password.',
    'auth/wrong-password':                           'Wrong email or password.',
    'auth/invalid-credential':                       'Wrong email or password.',
    'auth/too-many-requests':                        'Too many attempts. Please wait a moment and try again.',
    'auth/user-disabled':                            'This account has been disabled. Contact support.',
    'auth/network-request-failed':                   'Network error. Check your connection and try again.',
    'auth/popup-blocked':                            'Popup was blocked. Allow popups for this site and try again.',
    'auth/operation-not-allowed':                    'This sign-in method is not enabled.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    'auth/popup-closed-by-user':                     null,
    'auth/cancelled-popup-request':                  null,
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
