/*
  AUTH / RESULT TRACKING
  -----------------------
  Wraps Firebase Authentication (Google sign-in, restricted to ALLOWED_DOMAIN
  from firebase-config.js) and Firestore (storing each student's first-ever
  result per level). Exposes a small `Auth` object on window that both
  game-engine.js and dashboard.js use.

  Security note: the domain check here (and the ADMIN_EMAILS check) is only
  for the app's own UI, it decides what to SHOW someone. The actual access
  control that can't be bypassed lives in Firestore's security rules (see
  README.md), since a student could otherwise open devtools and call these
  functions directly.
*/

(function () {
  firebase.initializeApp(FIREBASE_CONFIG);
  const auth = firebase.auth();
  const db = firebase.firestore();

  let currentUser = null;
  let resolved = false;
  const listeners = [];

  function notifyAll() {
    listeners.forEach((cb) => cb(currentUser));
  }

  auth.onAuthStateChanged((user) => {
    resolved = true;
    if (user && user.email && user.email.toLowerCase().endsWith("@" + ALLOWED_DOMAIN.toLowerCase())) {
      currentUser = user;
    } else {
      if (user) {
        // Signed in, but not with a school account. Not allowed, back out.
        auth.signOut();
      }
      currentUser = null;
    }
    notifyAll();
  });

  function onAuthChange(callback) {
    listeners.push(callback);
    if (resolved) callback(currentUser);
  }

  function signIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: ALLOWED_DOMAIN });
    return auth.signInWithPopup(provider);
  }

  function signOutUser() {
    return auth.signOut();
  }

  function getCurrentUser() {
    return currentUser;
  }

  function isAdmin(user) {
    return !!user && ADMIN_EMAILS.includes(user.email);
  }

  function recordResult(levelKey, levelLabel, timeText, code) {
    if (!currentUser) return Promise.resolve();
    const docId = `${currentUser.uid}_${levelKey}`;
    return db
      .collection("attempts")
      .doc(docId)
      .set({
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || currentUser.email,
        levelKey,
        levelLabel,
        timeText,
        code,
        solvedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .catch((err) => {
        // A denied write here just means this level was already recorded
        // for this student, Firestore's rules block the second write. That's
        // expected on a replay, not a real error.
        if (err.code !== "permission-denied") {
          console.error("Could not record result", err);
        }
      });
  }

  window.Auth = {
    onAuthChange,
    signIn,
    signOut: signOutUser,
    currentUser: getCurrentUser,
    isAdmin,
    recordResult,
  };
})();
