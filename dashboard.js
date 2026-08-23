/*
  RESULTS DASHBOARD
  -----------------
  Lists every recorded attempt from Firestore. Gated to ADMIN_EMAILS
  (firebase-config.js) for the UI, but the real access control is the
  Firestore security rule on the `attempts` collection (see README.md),
  since this page's own checks can be bypassed by anyone reading the source.
*/

(function () {
  const gate = document.getElementById("dash-gate");
  const denied = document.getElementById("dash-denied");
  const content = document.getElementById("dash-content");
  const tbody = document.getElementById("dash-tbody");
  const summary = document.getElementById("dash-summary");
  const userBar = document.getElementById("user-bar");

  function show(el) {
    [gate, denied, content].forEach((e) => (e.style.display = "none"));
    el.style.display = "block";
  }

  document.getElementById("btn-dash-signin").addEventListener("click", () => {
    const errorEl = document.getElementById("signin-error");
    errorEl.style.display = "none";
    Auth.signIn().catch((err) => {
      errorEl.textContent =
        err.code === "auth/popup-closed-by-user"
          ? "Sign-in was closed before finishing. Try again."
          : "Couldn't sign in with that account.";
      errorEl.style.display = "block";
    });
  });

  document.getElementById("btn-sign-out").addEventListener("click", () => {
    Auth.signOut();
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function loadResults() {
    summary.textContent = "Loading...";
    firebase
      .firestore()
      .collection("attempts")
      .orderBy("solvedAt", "desc")
      .get()
      .then((snap) => {
        tbody.innerHTML = "";
        snap.forEach((doc) => {
          const d = doc.data();
          const when = d.solvedAt && d.solvedAt.toDate ? d.solvedAt.toDate().toLocaleString() : "";
          const tr = document.createElement("tr");
          tr.innerHTML =
            `<td>${escapeHtml(d.name)}</td>` +
            `<td>${escapeHtml(d.email)}</td>` +
            `<td>${escapeHtml(d.levelLabel || d.levelKey)}</td>` +
            `<td>${escapeHtml(d.timeText)}</td>` +
            `<td>${escapeHtml(d.code)}</td>` +
            `<td>${escapeHtml(when)}</td>`;
          tbody.appendChild(tr);
        });
        summary.textContent = `${snap.size} result${snap.size === 1 ? "" : "s"} recorded.`;
      })
      .catch((err) => {
        summary.textContent = "Could not load results: " + err.message;
      });
  }

  Auth.onAuthChange((user) => {
    if (user) {
      userBar.style.display = "flex";
      document.getElementById("user-email").textContent = user.email;
    } else {
      userBar.style.display = "none";
    }

    if (!user) {
      show(gate);
      return;
    }
    if (!Auth.isAdmin(user)) {
      show(denied);
      return;
    }
    show(content);
    loadResults();
  });
})();
