# Physics Explorer

A browser-based physics escape room. No install, open `index.html` or host it as a static site. Sign-in
and result tracking use Firebase (Google's free hosted backend), so there's still no server for you to
run yourself, see "Setting up Google sign-in and result tracking" below.

## Files

- `content-v1.js` and `content-v2.js`, **all your questions live here.** `content-v1.js` is the original set of
  levels (V1), `content-v2.js` is the new set (V2). Edit these to change puzzles.
- `index.html`, `styles.css`, `game-engine.js`, the game engine. You shouldn't need to touch these to just change questions.
  The engine runs every set. Level select opens on the newest version, with a small "Version" dropdown to switch to older ones.
- `art/bg-*.jpg`, background art. V1 uses `bg-mechanics.jpg`, `bg-circuits.jpg`, `bg-waves.jpg` and `bg-win.jpg`
  (one per level). V2 uses two per level: a hallway (`*-hall.jpg`) and the room it leads into, all illustrated
  AI-made art (1100x825 once resized). Don't delete any of them, both sets still need them.
- `photos/`, `backgounds/`, raw source photos/art. Gitignored, not published, since some are copyrighted or not
  yours to redistribute and shouldn't ship in a public repo. Safe to delete once you're happy with `art/`.
- `tools/photo_to_sketch.py`, an optional script that turns a photo into a vector line-art sketch (Canny edge
  detection, all local, no AI/network). Not currently used by the game, but there if you want that look later.

## Swapping in different background art

The background images (`art/bg-*.jpg`) are plain images, replace the file with any image of the same name
(ideally similar aspect ratio) and reload. Keep them people-free (empty rooms/hallways) since this game gets
shared with classmates.

If you swap a background, you'll likely also want to reposition the puzzle objects. Each puzzle is a
near-invisible hover-reveal hotspot placed directly on a real object in the photo (a bulletin board, a vent, a
door), not a generic floating icon. These live in `game-engine.js` in the `SCENES_V1` and `SCENES_V2` objects: each level is an array
of two scenes (hallway, then room), and each scene's `props` array has one entry per puzzle in that room, in
order, with `cx`/`cy` pixel coordinates (in the photo's own pixel space, all sized to 1100px wide) and an `icon`
emoji. Get coordinates by eyeballing the image and testing in the browser, reload and nudge `cx`/`cy` until the
object lines up.

## Versions (V1, V2, and future ones)

Each version is its own set of four levels. **V1** is the original set (one room per level). **V2** is the newer set
(a hallway and a room per level, illustrated scenes). The level-select screen opens on the **newest** version, and
older ones are in the "Version" dropdown above the level cards, newest first.

- V1 keeps its original level keys (`regular`, `ap1`, `apc`, `ib`), so every result already saved stays valid.
- V2 keys are prefixed with `v2_` (`v2_regular`, and so on), so versions never share a saved result. A player
  can finish every version, and only their first attempt at each level counts, same as before.
- Finished levels get a check mark on their card, per player account, on any device. The dropdown also shows
  "x / 4 done" per version.
- Results show up as "V1 Level 1" / "V2 Level 1" on the dashboard.
- Progress inside a level is not saved. Closing the tab midway restarts that level.

**Adding a new version (say V3):**

1. Copy `content-v2.js` to `content-v3.js` and rename `LEVEL_META_V2`, `LEVELS_V2` and `EQUATIONS_V2` to the `_V3`
   names (also the `title:` lines, "Physics Explorer V3"). Edit the questions.
2. Add `<script src="content-v3.js"></script>` to `index.html`, before `game-engine.js`.
3. In `game-engine.js`, add a `SCENES_V3` object next to `SCENES_V2` (backgrounds and button positions), and add a
   new entry to the **end** of the `LEVEL_SETS` list with `id: "v3"`, `label: "V3"`, `prefix: "v3_"`, and its
   `meta`, `levels` and `scenes`. The last entry in that list is the one that opens by default.

## Editing questions

Open `content-v2.js` (or `content-v1.js` for the original levels, which have one room per level). In V2 each level has two rooms (a hallway with 2 puzzles, a main room with 3), each with a
`puzzles` array. Copy an existing puzzle block and edit the text:

- `type`: `"numeric"` (a calculated answer) or `"multipart"` (several sub-answers in one puzzle, see below)
- `prompt`: the question text (a `{{name}}` placeholder shows as `???` until an earlier clue reveals it)
- `answer`: the correct number (numeric only)
- `hint`: optional hint text
- `contribution`: a short string (usually 1 character) awarded when solved
- `reveal`: `{ text, card: { name, value, label } }`, the story text shown after solving, and (except on the
  last clue) a card handed to the player. `card.name` must match a `{{name}}` placeholder in a later clue.

All `contribution`s across both rooms, in order, form the level's final code, computed automatically, you
don't need to manage it.

You can add more puzzles to a room (and a matching prop in `SCENES`), or change the theme/title/intro text at
the top of the file.

## Stories, clue order and equations

Each level is its own story told across two rooms (a hallway, then the room it leads into), five clues total,
solved in order. Every clue after the first has a `{{name}}` placeholder in its `prompt` that shows as `???`
until the player places the matching clue card (see `reveal.card` above). Nothing tells the player which clue a
card belongs to, they reread their clues and work it out. The `contribution` characters are the code the player
types in (Levels 1, 3, 4), the piano notes (none currently, see `mode: "melody"` in `game-engine.js` if you want
one), or not shown at all for a key hunt (Level 2). They only ever appear inside the clue itself.

The "Extra clues" switch on the home page adds a light switch to each room. Flipped to dark, that room's
equations glow on the walls, floors and ceilings. The lists they sit in are set by `eqBlocks` per scene in
`game-engine.js`, and the equations themselves live in the `EQUATIONS_V1` and `EQUATIONS_V2` objects in the content files, keyed by puzzle
id (`_0` and `_{out}` make subscripts). Whether it was on is saved with the result (`equationsOn`) and shown on
the dashboard.

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
            request.auth.token.email in [
              "qlsescaperoom@gmail.com",
              "aagarwal77@gmail.com",
              "mitalyp@gmail.com",
              "aaravpagarwal@gmail.com"
            ]);

         allow create: if request.auth != null &&
           request.auth.token.email.matches('.*@(quarrylane[.]org|student[.]quarrylane[.]org)$') &&
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
git commit -m "Physics Explorer escape room"
```

Then create a new repo on GitHub (e.g. `physics-escape-room`) and push:

```bash
git remote add origin https://github.com/<your-username>/physics-escape-room.git
git branch -M main
git push -u origin main
```

In the repo on GitHub: **Settings → Pages → Source → Deploy from branch → main → / (root) → Save**.

Your game will be live at `https://<your-username>.github.io/physics-escape-room/` within a minute or two. Share that link with your classmates.
