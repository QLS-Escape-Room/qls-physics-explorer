# Physics Lab Lockdown

A browser-based physics escape room. No install, open `index.html` or host it as a static site. Sign-in
and result tracking use Firebase (Google's free hosted backend), so there's still no server for you to
run yourself, see "Setting up Google sign-in and result tracking" below.

## Files

- `content.js`, **all your questions live here.** Edit this to change puzzles.
- `index.html`, `styles.css`, `game-engine.js`, the game engine. You shouldn't need to touch these to just change questions.
- `art/bg-mechanics.jpg`, `art/bg-circuits.jpg`, `art/bg-waves.jpg`, background art (stylized illustrations of the real school) for the three stations. The win screen is a generated graphic (trophy + confetti), not a photo, so it always looks the same regardless of background art. `art/bg-win.jpg` is no longer referenced by the game and can be deleted if you don't want it kept around.
- `photos/`, `backgounds/`, raw source photos/art used to produce the images above. Gitignored, not published, since some are copyrighted or not yours to redistribute and shouldn't ship in a public repo. Safe to delete once you're happy with the generated art in `art/`.
- `tools/photo_to_sketch.py`, an optional script that turns a photo into a vector line-art sketch (Canny edge detection, all local, no AI/network). Not currently used by the game, but there if you want that look for a room later.

## Swapping in different background art

The background images (`art/bg-*.jpg`) are plain images, replace the file with any image of the same name (ideally similar aspect ratio, roughly 4:3) and reload. Keep them people-free (empty rooms/hallways) since this game gets shared with classmates.

If you swap a background, you'll likely also want to reposition the puzzle "props", each room's three puzzles are drawn as objects directly onto real things in the photo (a basketball in a hoop, an envelope in a mail slot, a note on a whiteboard, etc.), not generic floating icons. These live in `game-engine.js` in the `ROOM_SCENES` array: each prop has `cx`/`cy` pixel coordinates (in the photo's own 1100×825 space) plus a `type` (`basketball`, `envelope`, `note`, `clipboard`, `sheetmusic`, or `tuningfork`) and a matching reward animation when solved. A room can also have a `door` (real photographed door, with coordinates for its click region), if the photo has no door, the room falls back to a plain "Continue" button once all three puzzles are solved. Get coordinates by eyeballing the image and testing in the browser, reload and nudge `cx`/`cy` until the object lines up.

## Editing questions

Open `content.js`. Each room has a `puzzles` array. Copy an existing puzzle block and edit the text:

- `type`: `"mcq"` (multiple choice), `"numeric"` (a calculated answer), or `"text"` (short word answer)
- `prompt`: the question text
- `options`: only for `mcq`, list of choices
- `answer`: the correct choice (mcq), correct number (numeric), or correct word (text)
- `tolerance`: only for `numeric`, how much rounding error to allow (e.g. `0.5`)
- `hint`: optional hint text
- `contribution`: a short string (usually 1 letter) awarded when solved

All `contribution`s across all rooms, in order, form the final door code, this is computed automatically, you don't need to manage it.

You can add more puzzles to a room, add more rooms (copy a room block), or change the theme/title/intro text at the top of the file.

## Setting up Google sign-in and result tracking

Students sign in with their school Google account before playing. Only accounts on your school's
domain are let in, and only a student's first completion of each level is recorded (time + the code
they escaped with), so replays don't overwrite their real result. This runs on Firebase, Google's free
hosted backend for exactly this kind of app, no server for you to run or pay for.

You'll need your own Google account (not a school admin account, any Google account can create a free
Firebase project).

1. **Create the Firebase project.** Go to [console.firebase.google.com](https://console.firebase.google.com),
   sign in, and click "Add project." Name it anything (e.g. `physics-lab-lockdown`). You can decline
   Google Analytics when asked, it's not needed here.

2. **Turn on Google sign-in.** In the project, go to **Build → Authentication → Get started**. On the
   "Sign-in method" tab, enable the **Google** provider (it'll ask for a support email, use your own).

3. **Create the database.** Go to **Build → Firestore Database → Create database**. Choose
   **production mode** (we're setting explicit rules below, not the open test-mode rules) and pick a
   location.

4. **Register a web app and get your config.** Go to **Project settings** (the gear icon) →
   **General** tab → scroll to "Your apps" → click the `</>` (web) icon. Give it any nickname, skip
   Firebase Hosting (you're deploying to GitHub Pages). It'll show a `firebaseConfig` object, copy
   those six values into `firebase-config.js` in this project, replacing the `PASTE_YOUR_...`
   placeholders.

5. **Set who can see the results dashboard.** In `firebase-config.js`, add your own school email (and
   any other teacher/staff who should see results) to the `ADMIN_EMAILS` list.

6. **Lock down the database.** In **Firestore Database → Rules**, replace the default rules with the
   ones below (this is what actually enforces "only your first attempt counts" and "students can only
   see their own result," not just the app's own UI, which a student could bypass by editing the page).
   Put the same email(s) from `ADMIN_EMAILS` into the `allow read` line, then click **Publish**.

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /attempts/{attemptId} {
         allow read: if request.auth != null &&
           (request.auth.uid == resource.data.uid ||
            request.auth.token.email in ["aarav.agarwal@quarrylane.org"]);

         allow create: if request.auth != null &&
           request.auth.token.email.matches('.*@quarrylane[.]org$') &&
           request.resource.data.uid == request.auth.uid &&
           attemptId == request.auth.uid + '_' + request.resource.data.levelKey &&
           !exists(/databases/$(database)/documents/attempts/$(attemptId));

         allow update, delete: if false;
       }
     }
   }
   ```

7. **Whitelist your deployed domain.** In **Authentication → Settings → Authorized domains**, add the
   domain you're deploying to (e.g. `<your-username>.github.io`). `localhost` is already allowed by
   default, so local testing works without this step.

Once deployed, students sign in at the game's normal URL, and you (or anyone in `ADMIN_EMAILS`) can see
everyone's results at `dashboard.html` on the same site.

## Testing locally

Just double-click `index.html` to open it in a browser. No server required.

## Deploying to GitHub Pages

```bash
git init
git add .
git commit -m "Physics Lab Lockdown escape room"
```

Then create a new repo on GitHub (e.g. `physics-escape-room`) and push:

```bash
git remote add origin https://github.com/<your-username>/physics-escape-room.git
git branch -M main
git push -u origin main
```

In the repo on GitHub: **Settings → Pages → Source → Deploy from branch → main → / (root) → Save**.

Your game will be live at `https://<your-username>.github.io/physics-escape-room/` within a minute or two. Share that link with your classmates.
