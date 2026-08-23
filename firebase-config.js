/*
  FIREBASE SETUP
  --------------
  Fill in the values below from your own Firebase project. See README.md,
  section "Setting up Google sign-in and result tracking", for the exact
  steps to create the project and get these values. None of this is secret,
  it's the public identifier for your project, safe to commit to a repo.
*/

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDegVnR9X9RV16CqeQ-3iv_bdyh3wCvRpc",
  authDomain: "qls-physics-escape-room.firebaseapp.com",
  projectId: "qls-physics-escape-room",
  storageBucket: "qls-physics-escape-room.firebasestorage.app",
  messagingSenderId: "1017277925682",
  appId: "1:1017277925682:web:f3a7661725691f8291af2b",
};

// Only Google accounts on this domain are allowed to sign in and play.
const ALLOWED_DOMAIN = "quarrylane.org";

// Emails that can view the results dashboard (dashboard.html). Add your own
// school email here. This list is also just for the dashboard page's own
// UI check, the REAL access control lives in Firestore's security rules
// (see README), so keep both in sync when you add or remove someone.
const ADMIN_EMAILS = ["aarav.agarwal@quarrylane.org"];
