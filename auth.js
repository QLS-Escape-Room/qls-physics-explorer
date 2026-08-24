/*
  AUTH / RESULT TRACKING
  -----------------------
  Wraps Firebase Authentication (Google sign-in, restricted to ALLOWED_DOMAINS
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

  function isAllowedDomain(email) {
    const lower = email.toLowerCase();
    return ALLOWED_DOMAINS.some((domain) => lower.endsWith("@" + domain.toLowerCase()));
  }

  // Admin emails (ADMIN_EMAILS in firebase-config.js) can sign in even from
  // outside the school domains, e.g. a personal Gmail used just to view the
  // dashboard. Everyone else still needs a school account.
  function isAllowedUser(user) {
    return isAllowedDomain(user.email) || ADMIN_EMAILS.includes(user.email);
  }

  auth.onAuthStateChanged((user) => {
    resolved = true;
    if (user && user.email && isAllowedUser(user)) {
      currentUser = user;
    } else {
      if (user) {
        // Signed in, but not with a school account or an admin email. Not allowed, back out.
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
    // "*" hints Google to prefer a Workspace account over a personal Gmail
    // in the picker. It can't restrict to two specific domains at once, so
    // the real enforcement is isAllowedDomain() above, after sign-in.
    provider.setCustomParameters({ hd: "*" });
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
        // A "permission-denied" here is expected on a replay, the security
        // rules block the second write on purpose. It can also mean the
        // rules (or the database itself) aren't set up correctly though, so
        // this still logs, just as a warning instead of an error, since a
        // normal player never has devtools open to see it either way.
        console.warn("recordResult did not save (may be an expected replay-block):", err.code, err.message);
      });
  }

  function getCompletedLevels() {
    if (!currentUser) return Promise.resolve([]);
    return db
      .collection("attempts")
      .where("uid", "==", currentUser.uid)
      .get()
      .then((snap) => snap.docs.map((doc) => doc.data().levelKey))
      .catch((err) => {
        console.warn("Could not load completed levels:", err.code, err.message);
        return [];
      });
  }

  window.Auth = {
    onAuthChange,
    signIn,
    signOut: signOutUser,
    currentUser: getCurrentUser,
    isAdmin,
    recordResult,
    getCompletedLevels,
  };
})();
