(function () {
  const state = {
    levelKey: null,
    roomIndex: 0,
    solved: new Set(), // puzzle ids solved
    cards: [], // clue cards handed out by solved clues: { name, value, label, from }
    revealed: {}, // {{placeholder}} values the player has placed, by name
    keyFound: false,
    equationsOn: false,
    equationLayout: [],
    lightsOff: false,
    startTime: null,
    timerHandle: null,
    activePuzzleId: null,
  };

  let activeLevel = null; // LEVELS[state.levelKey]
  let activeScenes = null; // SCENES[state.levelKey]

  // Each level's single room: background photo, how the player gets out (the
  // `exit`), and where the five puzzle props sit on real objects in the photo.
  // Props are in story order, prop N goes with puzzle N. Coordinates are in the
  // photo's own pixel space (all bg images are 1100x825).
  //
  // exit.mode:
  //   "code"    -> solve every clue, then type the code you assembled from them
  //   "key"     -> solve every clue, then find the key, then click the door
  //   "melody"  -> solve every clue, then play the five notes from the clues on the piano
  const SCENES = {
    regular: [
      {
        // The Gym: equipment cage with a letter lock
        bgImage: "art/bg-mechanics.jpg",
        bgSize: { w: 1100, h: 825 },
        glow: "#f2b134",
        lights: { kind: "lights", cx: 470, cy: 388 },
        eqBlocks: [
          { x: 705, y: 215, w: 385, h: 165, cols: 2 },
          { x: 300, y: 690, w: 620, h: 110, cols: 2 },
        ],
        exit: {
          art: "cage",
          mode: "code",
          rect: { x: 22, y: 175, w: 210, h: 280 },
          codeLabel: "Cage lock",
          codePrompt: "The lock wants a five letter word. Use the letters from the clues, in the order you found them.",
          lockedMsg: "🔒 The cage lock needs a code. Solve every clue to get all five letters.",
          readyMsg: "All five letters found. Click the cage and enter the code!",
        },
        props: [
          { type: "basketball", cx: 871, cy: 190, size: 46, label: "Basketball in the net", icon: "🏀" },
          { type: "marker", cx: 190, cy: 715, size: 70, label: "Hula hoop on the floor", icon: "⭕" },
          { type: "marker", cx: 280, cy: 360, size: 60, label: "Padded pole", icon: "🛡️" },
          { type: "clipboard", cx: 820, cy: 410, size: 84, label: "Clipboard on the bleachers", icon: "📋" },
          { type: "marker", cx: 585, cy: 190, size: 90, label: "Framed school crest", icon: "🖼️" },
        ],
      },
    ],
    ap1: [
      {
        // The Front Office: meeting behind a locked door, spare key in the barrel
        bgImage: "art/bg-circuits.jpg",
        bgSize: { w: 1100, h: 825 },
        glow: "#5ee1c9",
        extraHidden: true, // objects here start with no idle glow at all, hover only
        lights: { kind: "daynight", cx: 46, cy: 92, size: 70 },
        eqBlocks: [
          { x: 190, y: 690, w: 600, h: 115, cols: 1 },
          { x: 840, y: 490, w: 250, h: 190, cols: 1 },
          { x: 260, y: 520, w: 140, h: 120, cols: 1 },
        ],
        exit: {
          art: "door",
          mode: "key",
          cx: 562,
          cy: 375,
          r: 60,
          lockedIcon: "🔒",
          unlockedIcon: "🔓",
          label: "Office door",
          meetingSign: { x: 530, y: 286, w: 150, h: 44 },
          lockedMsg: "🔒 The meeting is going on inside and the door is locked. Follow the memos to find the key.",
          keyMsg: "A spare key is hiding somewhere around the entrance. Look for a glint!",
          readyMsg: "You have the key. Click the door!",
        },
        keySpot: { cx: 118, cy: 600, size: 88 },
        props: [
          { type: "envelope", cx: 522, cy: 508, size: 88, label: "Envelope in the mail slot", icon: "✉️" },
          { type: "note", cx: 300, cy: 420, size: 78, label: "Note on the wall", icon: "📝" },
          { type: "clipboard", cx: 930, cy: 435, size: 78, label: "Clipboard on the brick wall", icon: "📋" },
          { type: "marker", cx: 930, cy: 270, size: 70, label: "Wall lamp", icon: "💡" },
          { type: "marker", cx: 500, cy: 195, size: 110, label: "School sign", icon: "🪧" },
        ],
      },
    ],
    apc: [
      {
        // The Music Room: locked piano, play the collected notes
        bgImage: "art/bg-waves.jpg",
        bgSize: { w: 1100, h: 825 },
        glow: "#7ecbff",
        lights: { kind: "lights", cx: 807, cy: 350 },
        eqBlocks: [
          { x: 230, y: 8, w: 330, h: 130, cols: 1 },
          { x: 640, y: 8, w: 330, h: 130, cols: 1 },
          { x: 230, y: 505, w: 280, h: 50, cols: 1 },
          { x: 845, y: 300, w: 150, h: 170, cols: 1 },
        ],
        exit: {
          art: "door",
          mode: "melody",
          cx: 468,
          cy: 430,
          r: 52,
          lockedIcon: "🔒",
          unlockedIcon: "🎹",
          label: "Piano",
          lockedMsg: "🔒 The piano lid is locked. Solve every clue to collect all five notes.",
          readyMsg: "All five notes found. Click the piano and play them in order!",
        },
        props: [
          { type: "tuningfork", cx: 95, cy: 438, size: 48, label: "Tuning fork resting on the xylophone bars", icon: "🎵" },
          { type: "sheetmusic", cx: 490, cy: 393, size: 62, label: "Sheet music on the piano stand", icon: "🎼" },
          { type: "note", cx: 1032, cy: 365, size: 66, label: "Note taped to the whiteboard", icon: "📝" },
          { type: "marker", cx: 438, cy: 260, size: 85, label: "Arched window", icon: "🪟" },
          { type: "marker", cx: 210, cy: 440, size: 90, label: "Drum kit", icon: "🥁" },
        ],
      },
    ],
    ib: [
      {
        // The Tech Lot: robot on the ground, trailer with a digit lock
        bgImage: "art/bg-win.jpg",
        bgSize: { w: 1100, h: 825 },
        glow: "#c9a6ff",
        lights: { kind: "daynight", cx: 935, cy: 95, size: 110 },
        eqBlocks: [
          { x: 30, y: 340, w: 610, h: 150, cols: 2 },
          { x: 570, y: 600, w: 510, h: 200, cols: 2 },
          { x: 20, y: 640, w: 240, h: 150, cols: 1 },
        ],
        exit: {
          art: "trailerLock",
          mode: "code",
          rect: { x: 180, y: 238, w: 176, h: 68 },
          codeLabel: "Trailer lock",
          codePrompt: "The lock wants five characters. Use the ones from the checklist, in the order you found them.",
          lockedMsg: "🔒 The trailer lock needs a code. Finish the whole checklist to get every character.",
          readyMsg: "The checklist is done. Click the trailer lock and enter the code!",
        },
        props: [
          { type: "marker", cx: 791, cy: 114, size: 55, label: "Streetlamp", icon: "💡" },
          { type: "marker", cx: 760, cy: 330, size: 90, label: "Stair railing", icon: "🪜" },
          { type: "marker", cx: 515, cy: 195, size: 75, label: "Trailer's tech badge", icon: "🔌" },
          { type: "marker", cx: 1005, cy: 430, size: 130, label: "Parked van", icon: "🚐" },
          { type: "robot", cx: 400, cy: 640, size: 260, label: "Team 7419 robot", icon: "🤖" },
        ],
      },
    ],
  };

  const PROP_SOLVE_ANIM = {
    basketball: "prop-anim-basketball",
    envelope: "prop-anim-envelope",
    note: "prop-anim-flutter",
    clipboard: "prop-anim-flutter",
    sheetmusic: "prop-anim-close",
    robot: "prop-anim-robot",
  };

  const screens = {
    signin: document.getElementById("screen-signin"),
    level: document.getElementById("screen-level"),
    intro: document.getElementById("screen-intro"),
    room: document.getElementById("screen-room"),
    win: document.getElementById("screen-win"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function checkValue(type, answer, rawInput) {
    if (type === "numeric") {
      const val = parseFloat(rawInput);
      if (Number.isNaN(val)) return false;
      return val === answer;
    }
    return String(rawInput).trim().toLowerCase() === String(answer).trim().toLowerCase();
  }

  function checkAnswer(puzzle, rawInput) {
    if (puzzle.type === "mcq") {
      return rawInput === puzzle.answer;
    }
    return checkValue(puzzle.type, puzzle.answer, rawInput);
  }

  // ---------- Level select ----------

  function renderLevelSelect() {
    const grid = document.getElementById("level-grid");
    grid.innerHTML = "";
    LEVEL_META.forEach((meta) => {
      const btn = document.createElement("button");
      btn.className = "level-btn";
      btn.dataset.levelKey = meta.key;
      btn.innerHTML =
        `<span class="level-btn-label">${meta.label}</span>` +
        `<span class="level-btn-story">${meta.story}</span>`;
      btn.addEventListener("click", () => selectLevel(meta.key));
      grid.appendChild(btn);
    });

    // Mark levels this player has already completed. Fetched fresh every
    // time the level-select screen renders, so it stays current right after
    // finishing a level.
    Auth.getCompletedLevels().then((completedKeys) => {
      completedKeys.forEach((key) => {
        const btn = grid.querySelector(`[data-level-key="${key}"]`);
        if (btn && !btn.querySelector(".level-check")) {
          const check = document.createElement("span");
          check.className = "level-check";
          check.textContent = "✓";
          check.setAttribute("aria-label", "Completed");
          btn.appendChild(check);
        }
      });
    });
  }

  function selectLevel(key) {
    state.levelKey = key;
    activeLevel = LEVELS[key];
    activeScenes = SCENES[key];
    state.roomIndex = 0;
    state.solved.clear();
    state.cards = [];
    state.revealed = {};
    state.keyFound = false;
    state.activePuzzleId = null;
    // Locked in at the moment a level is chosen, so it can't change mid-run.
    state.equationsOn = document.getElementById("toggle-equations").checked;
    renderIntro();
    showScreen("intro");
  }

  function startStopwatch() {
    clearInterval(state.timerHandle);
    state.startTime = Date.now();
    state.timerHandle = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const ss = String(elapsed % 60).padStart(2, "0");
      document.getElementById("stopwatch").textContent = `${mm}:${ss}`;
    }, 1000);
  }

  function stopStopwatch() {
    clearInterval(state.timerHandle);
    return document.getElementById("stopwatch").textContent;
  }

  function renderIntro() {
    document.getElementById("game-title").textContent = activeLevel.title;
    document.getElementById("intro-title").textContent = activeLevel.title;
    document.getElementById("intro-story").textContent = activeLevel.storyTitle;
    document.getElementById("intro-text").textContent = activeLevel.intro;
  }

  // ---------- Prop shapes (drawn directly onto real objects in the photo) ----------

  function propShapeMarkup(type, icon) {
    switch (type) {
      case "basketball":
        return `
          <ellipse cx="50" cy="92" rx="24" ry="4.5" fill="#000000" opacity="0.22" />
          <circle cx="50" cy="46" r="36" fill="#e8792a" stroke="#7a3f10" stroke-width="3" />
          <path d="M14,46 H86" stroke="#3a1d08" stroke-width="2.2" fill="none" />
          <path d="M50,10 V82" stroke="#3a1d08" stroke-width="2.2" fill="none" />
          <!-- net strands crossing in front of the ball, converging to the bottom of the net -->
          <path d="M14,18 Q40,58 50,90" stroke="#f4efe0" stroke-width="2.4" fill="none" opacity="0.9" />
          <path d="M86,18 Q60,58 50,90" stroke="#f4efe0" stroke-width="2.4" fill="none" opacity="0.9" />
          <path d="M26,34 Q50,40 74,34" stroke="#f4efe0" stroke-width="1.8" fill="none" opacity="0.75" />
          <path d="M22,54 Q50,62 78,54" stroke="#f4efe0" stroke-width="1.8" fill="none" opacity="0.75" />`;
      case "envelope":
        return `
          <ellipse cx="50" cy="94" rx="24" ry="4.5" fill="#000000" opacity="0.22" />
          <g transform="rotate(7 50 28)">
            <rect x="20" y="26" width="56" height="62" rx="2" fill="#e2d6b8" opacity="0.5" />
            <rect x="18" y="24" width="56" height="62" rx="2" fill="#f3ead9" stroke="#8a7550" stroke-width="2.2" />
            <path d="M18,29 L46,50 L74,29" fill="none" stroke="#8a7550" stroke-width="1.8" opacity="0.8" />
            <line x1="27" y1="62" x2="65" y2="62" stroke="#c9b98f" stroke-width="1.8" />
            <line x1="27" y1="72" x2="58" y2="72" stroke="#c9b98f" stroke-width="1.8" />
            <rect x="18" y="24" width="7" height="62" fill="#ffffff" opacity="0.16" />
          </g>
          <!-- brass slot lip casting a shadow over the tucked-in top edge -->
          <rect x="8" y="14" width="84" height="12" fill="#2a2010" opacity="0.4" />`;
      case "note":
        return `
          <g transform="rotate(-6 50 50)">
            <rect x="14" y="10" width="72" height="78" rx="4" fill="#fef3c1" stroke="#00000022" stroke-width="2" />
            <circle cx="50" cy="19" r="4" fill="#c0392b" />
            <line x1="24" y1="42" x2="76" y2="42" stroke="#d8c98a" stroke-width="2" />
            <line x1="24" y1="55" x2="76" y2="55" stroke="#d8c98a" stroke-width="2" />
            <line x1="24" y1="68" x2="60" y2="68" stroke="#d8c98a" stroke-width="2" />
          </g>`;
      case "clipboard":
        return `
          <rect x="12" y="14" width="76" height="80" rx="6" fill="#d7dde5" stroke="#00000022" stroke-width="2" />
          <rect x="35" y="5" width="30" height="15" rx="3" fill="#9aa4b0" />
          <line x1="24" y1="42" x2="76" y2="42" stroke="#8892a3" stroke-width="3" />
          <line x1="24" y1="57" x2="76" y2="57" stroke="#8892a3" stroke-width="3" />
          <line x1="24" y1="72" x2="58" y2="72" stroke="#8892a3" stroke-width="3" />`;
      case "sheetmusic":
        return `
          <ellipse cx="50" cy="90" rx="34" ry="5" fill="#000000" opacity="0.18" />
          <g transform="rotate(-8 50 62)">
            <rect x="12" y="40" width="76" height="46" rx="2" fill="#fbf8f0" stroke="#00000030" stroke-width="1.5" />
            <line x1="50" y1="41" x2="50" y2="85" stroke="#00000022" stroke-width="1" />
            <line x1="19" y1="51" x2="45" y2="49" stroke="#444" stroke-width="1" />
            <line x1="19" y1="59" x2="45" y2="57" stroke="#444" stroke-width="1" />
            <line x1="19" y1="67" x2="44" y2="65" stroke="#444" stroke-width="1" />
            <line x1="19" y1="75" x2="43" y2="73" stroke="#444" stroke-width="1" />
            <line x1="55" y1="49" x2="81" y2="51" stroke="#444" stroke-width="1" />
            <line x1="56" y1="57" x2="81" y2="59" stroke="#444" stroke-width="1" />
            <line x1="57" y1="65" x2="80" y2="67" stroke="#444" stroke-width="1" />
            <line x1="58" y1="73" x2="79" y2="75" stroke="#444" stroke-width="1" />
          </g>`;
      case "tuningfork":
        return `
          <ellipse cx="50" cy="93" rx="20" ry="4" fill="#000000" opacity="0.2" />
          <g transform="rotate(-4 50 50)">
            <rect x="45" y="52" width="10" height="38" rx="2" fill="#c7cdd8" stroke="#5a6270" stroke-width="1.5" />
            <path d="M32,15 V56" stroke="#c7cdd8" stroke-width="7" fill="none" stroke-linecap="round" />
            <path d="M68,15 V56" stroke="#c7cdd8" stroke-width="7" fill="none" stroke-linecap="round" />
            <path d="M32,56 Q50,66 68,56" stroke="#c7cdd8" stroke-width="7" fill="none" stroke-linecap="round" />
            <line x1="34" y1="20" x2="34" y2="50" stroke="#ffffff" stroke-width="1.5" opacity="0.6" />
            <line x1="66" y1="20" x2="66" y2="50" stroke="#ffffff" stroke-width="1.5" opacity="0.6" />
          </g>`;
      case "robot":
        // Team 7419's robot, loosely based on the real one: blue bumpers with
        // white numbers, a clear ball hopper full of yellow balls, a silver
        // shooter arm on top, and a bundle of wires.
        return `
          <ellipse cx="50" cy="90" rx="47" ry="6" fill="#000" opacity="0.28" />
          <circle cx="7" cy="80" r="5" fill="#f5d327" stroke="#a88f10" stroke-width="0.8" />
          <circle cx="96" cy="70" r="5" fill="#f5d327" stroke="#a88f10" stroke-width="0.8" />
          <circle cx="85" cy="89" r="4.5" fill="#f5d327" stroke="#a88f10" stroke-width="0.8" />
          <polygon points="10,66 50,80 92,62 52,49" fill="#4a5060" stroke="#262b35" stroke-width="1" />
          <circle cx="23" cy="56" r="5.5" fill="#f5d327" stroke="#a88f10" stroke-width="0.8" />
          <circle cx="33" cy="60" r="5.5" fill="#f5d327" stroke="#a88f10" stroke-width="0.8" />
          <circle cx="27" cy="66" r="5.5" fill="#f5d327" stroke="#a88f10" stroke-width="0.8" />
          <circle cx="38" cy="67" r="5.5" fill="#f5d327" stroke="#a88f10" stroke-width="0.8" />
          <circle cx="19" cy="63" r="5.5" fill="#f5d327" stroke="#a88f10" stroke-width="0.8" />
          <polygon points="13,46 45,57 45,77 13,66" fill="#cfe6f7" fill-opacity="0.32" stroke="#e4f1fb" stroke-width="1" />
          <polygon points="13,46 31,38 63,49 45,57" fill="#cfe6f7" fill-opacity="0.22" stroke="#e4f1fb" stroke-width="0.8" />
          <rect x="47" y="66" width="12" height="8" fill="#8a919e" stroke="#4c525e" stroke-width="0.8" transform="skewY(-14)" />
          <ellipse cx="72" cy="55" rx="17" ry="8" fill="#22262e" stroke="#0f1116" stroke-width="1" />
          <polygon points="58,52 70,34 88,40 84,54 70,58" fill="#c9ced8" stroke="#6f7784" stroke-width="1" />
          <circle cx="70" cy="45" r="4" fill="#6f7784" />
          <circle cx="59" cy="53" r="2" fill="#ff7a1a" />
          <path d="M46,74 C52,80 58,70 66,76" stroke="#e03a2f" stroke-width="1.8" fill="none" />
          <path d="M50,72 C56,76 60,66 68,70" stroke="#1a1a1a" stroke-width="1.6" fill="none" />
          <polygon points="10,66 50,80 50,91 10,77" fill="#1f3fc4" stroke="#0d1f6b" stroke-width="1" />
          <polygon points="50,80 92,62 92,73 50,91" fill="#2a4ce0" stroke="#0d1f6b" stroke-width="1" />
          <polygon points="12,68 50,81.5 50,84 12,70.5" fill="#e03a2f" />
          <polygon points="52,81.5 90,65 90,67.5 52,84" fill="#e03a2f" />
          <text transform="translate(16,77) rotate(19.3)" font-size="7.5" font-weight="700" fill="#fff" font-family="Arial, sans-serif">7419</text>
          <text transform="translate(58,87) rotate(-23)" font-size="7.5" font-weight="700" fill="#fff" font-family="Arial, sans-serif">7419</text>`;
      case "marker":
        // A near-invisible hotspot for puzzles hosted on an object that's
        // already part of the background photo, nothing to draw on top of,
        // just enough of a soft highlight to catch a hover, not a glance.
        // (marker-glow/marker-icon get a dedicated hover rule in styles.css,
        // since their low resting opacity makes drop-shadow alone too weak.)
        return `
          <ellipse class="marker-glow" cx="50" cy="52" rx="30" ry="26" fill="#ffffff" opacity="0.05" />
          <text class="marker-icon" x="50" y="60" font-size="22" text-anchor="middle" opacity="0.32">${icon || ""}</text>`;
      default:
        return "";
    }
  }

  // Small check mark left where a solved clue was, so it can be reopened.
  function buildSolvedBadgeSVG(prop, puzzle, delayed) {
    return `
    <svg class="hotspot solved-badge${delayed ? " delayed" : ""}" data-hotspot="${puzzle.id}"
         x="${prop.cx - 20}" y="${prop.cy - 20}" width="40" height="40"
         viewBox="0 0 40 40" tabindex="0" role="button" aria-label="${prop.label} (solved, click to review)">
      <circle cx="20" cy="20" r="16" />
      <path d="M11 20.5 l6.5 6.5 l12 -14" />
    </svg>`;
  }

  function buildPropSVG(scene, prop, puzzle, isSolved) {
    if (isSolved) return buildSolvedBadgeSVG(prop, puzzle, false);
    const half = prop.size / 2;
    return `
    <svg class="hotspot prop" style="--prop-glow:${scene.glow}" data-hotspot="${puzzle.id}"
         x="${prop.cx - half}" y="${prop.cy - half}" width="${prop.size}" height="${prop.size}"
         viewBox="0 0 100 100" tabindex="0" role="button" aria-label="${prop.label}">
      ${propShapeMarkup(prop.type, prop.icon)}
    </svg>`;
  }

  function escapeXml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---------- Exits: cage lock, trailer lock, doors ----------

  function lockChars(room) {
    return room.puzzles.map((p) => p.contribution);
  }

  // A padlock body with one empty slot per character in the code (shackle on top).
  function buildLockPlateSVG(room, x, y, slotW, slotH) {
    const gap = 6;
    const pad = 6;
    const count = room.puzzles.length;
    const plateW = count * slotW + (count - 1) * gap + pad * 2;
    const plateH = slotH + pad * 2;
    const cx = x + plateW / 2;
    const slots = room.puzzles
      .map((p, i) => {
        const sx = x + pad + i * (slotW + gap);
        return `
        <g class="lock-slot">
          <rect x="${sx}" y="${y + pad}" width="${slotW}" height="${slotH}" rx="4" />
          <text x="${sx + slotW / 2}" y="${y + pad + slotH / 2 + 8}" text-anchor="middle">?</text>
        </g>`;
      })
      .join("");
    return `
      <path class="lock-shackle" d="M ${cx - 18} ${y} v -16 a 18 18 0 0 1 36 0 v 16" fill="none" />
      <rect class="lock-plate" x="${x}" y="${y}" width="${plateW}" height="${plateH}" rx="9" />
      ${slots}
      <text class="lock-status" x="${x + plateW + 18}" y="${y + plateH / 2 + 8}" font-size="24" text-anchor="middle">🔒</text>`;
  }

  function buildCageSVG(scene, room) {
    const { x, y, w, h } = scene.exit.rect;
    return `
    <g class="hotspot exit-hotspot cage-exit locked" data-hotspot="door" tabindex="0" role="button" aria-label="Equipment cage">
      <defs>
        <pattern id="cageMesh" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0H18M0 0V18" stroke="#5a6475" stroke-width="2.4" />
        </pattern>
      </defs>
      <g class="cage-door">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1a202b" fill-opacity="0.28" />
        <rect class="cage-mesh" x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#cageMesh)" />
        <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#3b4453" stroke-width="7" />
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#3b4453" stroke-width="9" rx="4" />
        <rect x="${x + 50}" y="${y + 14}" width="${w - 100}" height="30" rx="4" fill="#f2c94c" stroke="#7a5b00" stroke-width="2" />
        <text x="${x + w / 2}" y="${y + 36}" text-anchor="middle" font-size="17" font-weight="700" fill="#3a2a00" font-family="Arial, sans-serif" letter-spacing="1">EQUIPMENT</text>
      </g>
      ${buildLockPlateSVG(room, x + 14, y + 132, 28, 36)}
    </g>`;
  }

  function buildTrailerLockSVG(scene, room) {
    const { x, y } = scene.exit.rect;
    return `
    <g class="hotspot exit-hotspot trailer-exit locked" data-hotspot="door" tabindex="0" role="button" aria-label="Trailer lock">
      ${buildLockPlateSVG(room, x, y + 24, 28, 32)}
    </g>`;
  }

  function buildDoorSVG(scene, allSolved) {
    const ex = scene.exit;
    const { cx, cy, r } = ex;
    const sign = ex.meetingSign
      ? `<g class="meeting-sign">
           <rect x="${ex.meetingSign.x}" y="${ex.meetingSign.y}" width="${ex.meetingSign.w}" height="${ex.meetingSign.h}" rx="4" fill="#b3261e" stroke="#5c0f0b" stroke-width="2" />
           <text x="${ex.meetingSign.x + ex.meetingSign.w / 2}" y="${ex.meetingSign.y + 19}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" font-family="Arial, sans-serif">MEETING</text>
           <text x="${ex.meetingSign.x + ex.meetingSign.w / 2}" y="${ex.meetingSign.y + 37}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="Arial, sans-serif">IN PROGRESS</text>
         </g>`
      : "";
    return `
    ${sign}
    <svg class="hotspot door-hotspot exit-hotspot ${allSolved ? "unlocked" : "locked"}" data-hotspot="door"
         x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}"
         viewBox="0 0 100 100" tabindex="0" role="button" aria-label="${ex.label}">
      <circle class="door-hit" cx="50" cy="50" r="48" />
      <circle class="door-badge" cx="50" cy="50" r="24" />
      <text class="door-icon" x="50" y="60" font-size="30" text-anchor="middle">${ex.lockedIcon}</text>
    </svg>`;
  }

  function buildExitSVG(scene, room) {
    switch (scene.exit.art) {
      case "cage":
        return buildCageSVG(scene, room);
      case "trailerLock":
        return buildTrailerLockSVG(scene, room);
      default:
        return buildDoorSVG(scene, false);
    }
  }

  function buildKeySVG(scene) {
    if (!scene.keySpot) return "";
    const { cx, cy, size } = scene.keySpot;
    const half = size / 2;
    return `
    <svg class="hotspot key-hotspot is-hidden" data-hotspot="key"
         x="${cx - half}" y="${cy - half}" width="${size}" height="${size}"
         viewBox="0 0 100 100" tabindex="0" role="button" aria-label="Something glinting in the barrel">
      <g transform="rotate(-35 50 50)">
        <circle cx="26" cy="50" r="14" fill="none" stroke="#f2c94c" stroke-width="7" />
        <rect x="38" y="46" width="46" height="8" rx="2" fill="#f2c94c" />
        <rect x="72" y="54" width="7" height="13" fill="#f2c94c" />
        <rect x="60" y="54" width="7" height="9" fill="#f2c94c" />
      </g>
      <text class="key-sparkle" x="80" y="26" font-size="22" text-anchor="middle">✨</text>
    </svg>`;
  }

  // ---------- Hidden equations (only visible with the lights off) ----------

  const EQ = { fs: 28, charW: 0.47, lineH: 1.5 };

  function visibleLength(text) {
    return text.replace(/_\{([^}]*)\}|_(\w)/g, (m, multi, single) => multi || single).length;
  }

  // Equations go into a few fixed blocks on walls, floors and ceilings (the
  // scene's eqBlocks), as neat centered lists in one size. The longest lines go
  // into the widest blocks, and a line only goes where it fits.
  function computeEquationLayout(scene, room) {
    const seen = new Set();
    const remaining = [];
    room.puzzles.forEach((p) =>
      (p.equations || []).forEach((t) => {
        if (!seen.has(t)) {
          seen.add(t);
          remaining.push(t);
        }
      })
    );
    remaining.sort((a, b) => visibleLength(b) - visibleLength(a));

    const lineH = EQ.fs * EQ.lineH;
    const capacity = (b) => Math.floor(b.h / lineH) * (b.cols || 1);
    const maxCharsIn = (b) => b.w / (b.cols || 1) / (EQ.fs * EQ.charW);
    // If everything fits in one block, keep it all together in the first such block.
    const single = (scene.eqBlocks || []).find(
      (b) => capacity(b) >= remaining.length && remaining.every((t) => visibleLength(t) <= maxCharsIn(b))
    );
    const blocks = single ? [single] : (scene.eqBlocks || []).slice().sort((a, b) => b.w - a.w);
    const placed = [];
    blocks.forEach((block) => {
      if (!remaining.length) return;
      const cols = block.cols || 1;
      const colW = block.w / cols;
      const rows = Math.floor(block.h / lineH);
      const maxChars = colW / (EQ.fs * EQ.charW);
      const group = [];
      for (let i = 0; i < remaining.length && group.length < rows * cols; ) {
        if (visibleLength(remaining[i]) <= maxChars) group.push(remaining.splice(i, 1)[0]);
        else i++;
      }
      const usedRows = Math.ceil(group.length / cols);
      const top = block.y + (block.h - usedRows * lineH) / 2;
      group.forEach((text, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        placed.push({
          text,
          x: block.x + colW * (col + 0.5),
          y: top + lineH * (row + 0.5) + EQ.fs * 0.35,
        });
      });
    });
    return placed;
  }

  // "v_0t" and "P_{out}" become real subscripts.
  function formatEquation(text) {
    return escapeXml(text).replace(
      /_\{([^}]*)\}|_(\w)/g,
      (m, multi, single) => `<tspan dy="9" font-size="70%">${multi || single}</tspan><tspan dy="-9">&#8203;</tspan>`
    );
  }

  function buildEquationTextSVG() {
    return state.equationLayout
      .map(({ text, x, y }) => {
        return `<text class="eq-glow" x="${x}" y="${y}" text-anchor="middle" style="font-size:${EQ.fs}px">${formatEquation(text)}</text>`;
      })
      .join("");
  }

  // Outdoors the control is a sun in the sky that becomes a moon at night.
  function buildSunSVG(lights) {
    const { cx, cy, size } = lights;
    const rays = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      const x1 = (50 + 35 * Math.cos(a)).toFixed(1);
      const y1 = (50 + 35 * Math.sin(a)).toFixed(1);
      const x2 = (50 + 46 * Math.cos(a)).toFixed(1);
      const y2 = (50 + 46 * Math.sin(a)).toFixed(1);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    }).join("");
    return `
    <svg class="hotspot sun-toggle${state.lightsOff ? " is-dark" : ""}" data-hotspot="lights"
         x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" viewBox="0 0 100 100"
         tabindex="0" role="button" aria-label="Sun. Click to switch between day and night.">
      <defs>
        <mask id="moonMask">
          <rect width="100" height="100" fill="#fff" />
          <circle cx="68" cy="38" r="27" fill="#000" />
        </mask>
      </defs>
      <g class="sun-body">
        <g class="sun-rays">${rays}</g>
        <circle class="sun-disc" cx="50" cy="50" r="25" />
      </g>
      <g class="moon-body">
        <circle cx="48" cy="52" r="31" fill="#eaf0ff" mask="url(#moonMask)" />
      </g>
    </svg>`;
  }

  // The control that turns the room dark (or night) so the equations show up.
  function buildLightSwitchSVG(scene) {
    if (!state.equationsOn || !scene.lights) return "";
    const { kind, cx, cy } = scene.lights;
    const dn = kind === "daynight";
    if (dn) return buildSunSVG(scene.lights);
    return `
    <svg class="hotspot light-switch${state.lightsOff ? " is-dark" : ""}" data-hotspot="lights"
         x="${cx - 24}" y="${cy - 36}" width="48" height="72" viewBox="0 0 48 72"
         tabindex="0" role="button" aria-label="${dn ? "Day and night switch" : "Light switch"}">
      <rect class="switch-plate" x="3" y="3" width="42" height="66" rx="7" />
      <text class="switch-label" x="24" y="17" text-anchor="middle" font-size="${dn ? 12 : 8}">${dn ? "☀️" : "ON"}</text>
      <rect class="switch-slot" x="16" y="22" width="16" height="28" rx="4" />
      <rect class="switch-lever" x="14" y="23" width="20" height="13" rx="3" />
      <text class="switch-label" x="24" y="63" text-anchor="middle" font-size="${dn ? 12 : 8}">${dn ? "🌙" : "OFF"}</text>
    </svg>`;
  }

  // ---------- Room scene ----------

  function buildRoomSceneSVG(scene, room) {
    const { w, h } = scene.bgSize;

    const propsMarkup = room.puzzles
      .map((puzzle, idx) => buildPropSVG(scene, scene.props[idx], puzzle, state.solved.has(puzzle.id)))
      .join("");
    const veil = scene.lights && scene.lights.kind === "daynight" ? "#050b22" : "#03060d";

    // Exit goes under the props so a prop that overlaps it still gets the click.
    return `
    <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" class="scene-svg${scene.extraHidden ? " scene-extra-hidden" : ""}${state.lightsOff ? " dark" : ""}">
      <image class="scene-bg" x="0" y="0" width="${w}" height="${h}" href="${scene.bgImage}" />
      <rect class="dark-veil" x="0" y="0" width="${w}" height="${h}" fill="${veil}" />
      ${buildEquationTextSVG()}
      ${buildExitSVG(scene, room)}
      ${propsMarkup}
      ${buildLightSwitchSVG(scene)}
      ${buildKeySVG(scene)}
    </svg>`;
  }

  function currentScene() {
    return activeScenes[state.roomIndex % activeScenes.length];
  }

  function renderScene() {
    const room = activeLevel.rooms[state.roomIndex];
    const scene = currentScene();
    document.getElementById("scene-container").innerHTML = buildRoomSceneSVG(scene, room);
    updateProgressionUI();
  }

  function placeholderNames(puzzle) {
    return [...puzzle.prompt.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
  }

  function missingNames(puzzle) {
    return placeholderNames(puzzle).filter((n) => state.revealed[n] == null);
  }

  function isUnlocked(puzzle) {
    return missingNames(puzzle).length === 0;
  }

  // The "Clues found" row: every card collected so far. Clicking one reopens the
  // clue it came from, so notes can be read again.
  function renderClueNotebook() {
    const el = document.getElementById("clue-notebook");
    if (!state.cards.length) {
      el.style.display = "none";
      return;
    }
    el.innerHTML = "";
    const label = document.createElement("span");
    label.className = "strip-label";
    label.textContent = "Clues found";
    el.appendChild(label);
    state.cards.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = `clue-card${state.revealed[c.name] != null ? " used" : ""}`;
      btn.textContent = c.label;
      btn.title = state.revealed[c.name] != null ? "Already placed. Click to reread the note." : "Click to reread the note.";
      btn.addEventListener("click", () => openPuzzlePanel(c.from));
      el.appendChild(btn);
    });
    el.style.display = "flex";
  }

  function renderCollectedStrip(room) {
    const strip = document.getElementById("collected-strip");
    const scene = currentScene();
    if (scene.exit.mode === "key") {
      strip.innerHTML = `<span class="strip-label">🔑 Spare key</span> <span class="strip-chip${state.keyFound ? " on" : ""}">${state.keyFound ? "Got it" : "Not found yet"}</span>`;
      strip.style.display = "block";
      return;
    }
    strip.style.display = "none";
  }

  function updateProgressionUI() {
    const room = activeLevel.rooms[state.roomIndex];
    const scene = currentScene();
    const ex = scene.exit;
    const allSolved = room.puzzles.every((p) => state.solved.has(p.id));
    const foundCount = room.puzzles.filter((p) => state.solved.has(p.id)).length;
    const isDoor = ex.art === "door";
    const exitReady = allSolved && (ex.mode !== "key" || state.keyFound);

    const counter = document.getElementById("found-counter");
    counter.textContent = `${foundCount} / ${room.puzzles.length} found`;
    counter.classList.toggle("all-found", allSolved);

    const exitEl = document.querySelector('[data-hotspot="door"]');
    if (exitEl) {
      exitEl.classList.toggle("ready", exitReady);
      if (isDoor) {
        exitEl.classList.toggle("unlocked", exitReady);
        exitEl.classList.toggle("locked", !exitReady);
        const doorIcon = exitEl.querySelector(".door-icon");
        if (doorIcon) doorIcon.textContent = exitReady ? ex.unlockedIcon : ex.lockedIcon;
      }
    }

    const keyEl = document.querySelector('[data-hotspot="key"]');
    if (keyEl) keyEl.classList.toggle("is-hidden", !(allSolved && !state.keyFound));

    renderCollectedStrip(room);
    renderClueNotebook();

    let hint = "Click objects in the room to investigate them. If a clue is missing a piece, see if one of the clues you've found fits.";
    if (allSolved) {
      hint = ex.mode === "key" && !state.keyFound ? ex.keyMsg : ex.readyMsg;
    }
    if (state.equationsOn && scene.lights) {
      hint += state.lightsOff
        ? " The extra clues are glowing."
        : " Extra clues are on. They're somewhere in this room.";
    }
    document.getElementById("scene-hint").textContent = hint;
  }

  function renderRoom() {
    const room = activeLevel.rooms[state.roomIndex];
    document.getElementById("room-icon").textContent = room.icon;
    document.getElementById("room-title").textContent = room.title;
    document.getElementById("room-intro").textContent = room.intro;
    state.lightsOff = false;
    state.equationLayout = state.equationsOn ? computeEquationLayout(currentScene(), room) : [];
    closePuzzlePanel();
    renderScene();
  }

  function findPuzzleAndProp(room, scene, puzzleId) {
    const idx = room.puzzles.findIndex((p) => p.id === puzzleId);
    return { puzzle: room.puzzles[idx], prop: scene.props[idx] };
  }

  function buildSingleAnswerBody(puzzle, body, onSolved) {
    const row = document.createElement("div");
    row.className = "answer-row";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = puzzle.type === "numeric" ? "Enter a number" : "Enter your answer";
    const submit = document.createElement("button");
    submit.textContent = "Submit";
    const feedback = document.createElement("p");
    feedback.className = "feedback";

    const attempt = () => {
      if (input.disabled) return; // ignore stray Enter/submit after already solved
      const correct = checkAnswer(puzzle, input.value);
      feedback.textContent = correct ? "Correct!" : "Not quite, try again.";
      feedback.className = `feedback ${correct ? "correct" : "wrong"}`;
      if (correct) {
        input.disabled = true;
        submit.disabled = true;
        onSolved();
      }
    };

    submit.addEventListener("click", attempt);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") attempt();
    });

    row.appendChild(input);
    row.appendChild(submit);
    body.appendChild(row);
    body.appendChild(feedback);
    setTimeout(() => input.focus(), 50);
  }

  function buildMultipartBody(puzzle, body, onSolved) {
    const inputs = puzzle.parts.map((part) => {
      const wrap = document.createElement("div");
      wrap.className = "part-row";
      const label = document.createElement("label");
      label.textContent = part.label;
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = part.type === "numeric" ? "Enter a number" : "Enter your answer";
      wrap.appendChild(label);
      wrap.appendChild(input);
      body.appendChild(wrap);
      return { part, input, wrap };
    });

    const submit = document.createElement("button");
    submit.textContent = "Check answers";
    submit.style.marginTop = "6px";
    const feedback = document.createElement("p");
    feedback.className = "feedback";

    const attempt = () => {
      if (submit.disabled) return; // ignore stray Enter/submit after already solved
      let allCorrect = true;
      inputs.forEach(({ part, input, wrap }) => {
        const correct = checkValue(part.type, part.answer, input.value);
        wrap.classList.toggle("correct", correct);
        wrap.classList.toggle("wrong", !correct);
        if (!correct) allCorrect = false;
      });
      feedback.textContent = allCorrect
        ? "Correct!"
        : "Some parts aren't quite right yet. Check each one.";
      feedback.className = `feedback ${allCorrect ? "correct" : "wrong"}`;
      if (allCorrect) {
        inputs.forEach(({ input }) => (input.disabled = true));
        submit.disabled = true;
        onSolved();
      }
    };

    submit.addEventListener("click", attempt);
    body.appendChild(submit);
    body.appendChild(feedback);
    setTimeout(() => inputs[0] && inputs[0].input.focus(), 50);
  }

  // Fills {{name}} placeholders: "???" until the player places the matching
  // clue card, then the value on that card.
  function fillPrompt(el, puzzle) {
    puzzle.prompt.split(/(\{\{\w+\}\})/).forEach((piece) => {
      const m = piece.match(/^\{\{(\w+)\}\}$/);
      if (!m) {
        el.appendChild(document.createTextNode(piece));
        return;
      }
      const placed = state.revealed[m[1]] != null;
      const span = document.createElement("span");
      span.className = placed ? "revealed-value" : "missing-value";
      span.textContent = placed ? state.revealed[m[1]] : "???";
      el.appendChild(span);
    });
  }

  function formatAnswer(puzzle) {
    if (puzzle.type === "multipart") return puzzle.parts.map((pt) => `${pt.label}: ${pt.answer}`);
    return [String(puzzle.answer)];
  }

  function appendRevealBox(body, puzzle) {
    if (!puzzle.reveal) return;
    const box = document.createElement("div");
    box.className = "reveal-box";
    const title = document.createElement("p");
    title.className = "reveal-title";
    title.textContent = "You found";
    const text = document.createElement("p");
    text.textContent = puzzle.reveal.text;
    box.appendChild(title);
    box.appendChild(text);
    if (activeLevel.collect) {
      const chip = document.createElement("p");
      chip.className = "reveal-chip";
      chip.textContent = `${activeLevel.collect.chip}: ${puzzle.contribution}`;
      box.appendChild(chip);
    }
    body.appendChild(box);
  }

  // A clue with a missing piece: pick which of the clues you've found fits.
  function buildCardPicker(puzzle, body) {
    const note = document.createElement("p");
    note.className = "locked-note";
    body.appendChild(note);

    const open = state.cards.filter((c) => state.revealed[c.name] == null);
    if (!open.length) {
      note.textContent = "🔒 A piece of this clue is missing, and you haven't found anything that could fit yet.";
      return;
    }
    note.textContent = "🔒 A piece of this clue is missing. Which of the clues you've found fits here?";

    const row = document.createElement("div");
    row.className = "card-picker";
    const feedback = document.createElement("p");
    feedback.className = "feedback";
    open.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "clue-card";
      btn.textContent = c.label;
      btn.addEventListener("click", () => {
        if (missingNames(puzzle).includes(c.name)) {
          state.revealed[c.name] = c.value;
          updateProgressionUI();
          openPuzzlePanel(puzzle.id, true);
        } else {
          feedback.textContent = "That doesn't fit here. Try a different clue.";
          feedback.className = "feedback wrong";
          btn.classList.add("wrong");
          setTimeout(() => btn.classList.remove("wrong"), 300);
        }
      });
      row.appendChild(btn);
    });
    body.appendChild(row);
    body.appendChild(feedback);
  }

  function openPuzzlePanel(puzzleId, justPlaced) {
    const room = activeLevel.rooms[state.roomIndex];
    const scene = currentScene();
    const { puzzle, prop } = findPuzzleAndProp(room, scene, puzzleId);
    if (!puzzle) return;

    state.activePuzzleId = puzzleId;
    const panel = document.getElementById("puzzle-panel");
    panel.style.display = "block";
    document.getElementById("panel-icon").textContent = prop.icon;
    document.getElementById("panel-label").textContent = prop.label;

    const isSolved = state.solved.has(puzzle.id);
    const unlocked = isUnlocked(puzzle);
    const body = document.getElementById("panel-body");
    body.innerHTML = "";

    const prompt = document.createElement("p");
    prompt.className = "prompt";
    fillPrompt(prompt, puzzle);
    body.appendChild(prompt);

    if (isSolved) {
      const banner = document.createElement("p");
      banner.className = "solved-banner";
      banner.textContent = "✓ Solved!";
      body.appendChild(banner);
      const answers = document.createElement("p");
      answers.className = "answer-line";
      answers.textContent = `Answer: ${formatAnswer(puzzle).join(" | ")}`;
      body.appendChild(answers);
      appendRevealBox(body, puzzle);
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    if (!unlocked) {
      buildCardPicker(puzzle, body);
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    if (justPlaced) {
      const ok = document.createElement("p");
      ok.className = "feedback correct";
      ok.textContent = "That fits!";
      body.appendChild(ok);
    }

    if (puzzle.type === "mcq") {
      const optWrap = document.createElement("div");
      optWrap.className = "options";
      puzzle.options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          const correct = checkAnswer(puzzle, opt);
          if (correct) {
            btn.classList.add("correct");
            [...optWrap.children].forEach((b) => (b.disabled = true));
            solvePuzzle(puzzle);
          } else {
            btn.classList.add("wrong");
            setTimeout(() => btn.classList.remove("wrong"), 300);
          }
        });
        optWrap.appendChild(btn);
      });
      body.appendChild(optWrap);
    } else if (puzzle.type === "multipart") {
      buildMultipartBody(puzzle, body, () => solvePuzzle(puzzle));
    } else {
      buildSingleAnswerBody(puzzle, body, () => solvePuzzle(puzzle));
    }

    if (puzzle.hint) {
      const hintBtn = document.createElement("button");
      hintBtn.className = "secondary";
      hintBtn.textContent = "Show hint";
      hintBtn.style.marginTop = "10px";
      const hintText = document.createElement("p");
      hintText.className = "hint-text";
      hintText.style.display = "none";
      hintText.textContent = puzzle.hint;
      hintBtn.addEventListener("click", () => {
        hintText.style.display = "block";
        hintBtn.disabled = true;
      });
      body.appendChild(hintBtn);
      body.appendChild(hintText);
    }

    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closePuzzlePanel() {
    state.activePuzzleId = null;
    document.getElementById("puzzle-panel").style.display = "none";
  }

  function solvePuzzle(puzzle) {
    state.solved.add(puzzle.id);
    if (puzzle.reveal && puzzle.reveal.card) state.cards.push({ ...puzzle.reveal.card, from: puzzle.id });

    // Play the object's reward animation in place, then remove it.
    const propEl = document.querySelector(`[data-hotspot="${puzzle.id}"]`);
    if (propEl) {
      const room = activeLevel.rooms[state.roomIndex];
      const scene = currentScene();
      const { prop } = findPuzzleAndProp(room, scene, puzzle.id);
      const animClass = PROP_SOLVE_ANIM[prop.type] || "prop-anim-flutter";
      propEl.classList.add("solved-away");
      propEl.classList.add(animClass);
      propEl.addEventListener(
        "animationend",
        () => {
          propEl.style.visibility = "hidden";
        },
        { once: true }
      );
      // The badge fades in once the object's own animation has played.
      propEl.insertAdjacentHTML("afterend", buildSolvedBadgeSVG(prop, puzzle, true));
    }

    updateProgressionUI();
    // Refresh the panel in place so it shows the solved state.
    openPuzzlePanel(puzzle.id);
  }

  function shakeExit() {
    const exitEl = document.querySelector('[data-hotspot="door"]');
    if (exitEl) {
      exitEl.classList.remove("shake");
      void exitEl.getBoundingClientRect(); // restart animation
      exitEl.classList.add("shake");
    }
  }

  function handleExitClick() {
    const room = activeLevel.rooms[state.roomIndex];
    const ex = currentScene().exit;
    const allSolved = room.puzzles.every((p) => state.solved.has(p.id));
    if (!allSolved) {
      shakeExit();
      document.getElementById("scene-hint").textContent = ex.lockedMsg;
      return;
    }
    if (ex.mode === "key" && !state.keyFound) {
      shakeExit();
      document.getElementById("scene-hint").textContent = ex.keyMsg;
      return;
    }
    if (ex.mode === "melody") {
      openMelodyPanel(room);
      return;
    }
    if (ex.mode === "code") {
      openCodePanel();
      return;
    }
    finishLevel();
  }

  // The player assembles the code from the clues and types it in themselves.
  function openCodePanel() {
    const ex = currentScene().exit;
    const panel = document.getElementById("puzzle-panel");
    panel.style.display = "block";
    document.getElementById("panel-icon").textContent = "🔒";
    document.getElementById("panel-label").textContent = ex.codeLabel;
    const body = document.getElementById("panel-body");
    body.innerHTML = "";

    const prompt = document.createElement("p");
    prompt.className = "prompt";
    prompt.textContent = ex.codePrompt;
    body.appendChild(prompt);

    const row = document.createElement("div");
    row.className = "answer-row";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter the code";
    input.maxLength = activeLevel.finalCode.length;
    input.autocomplete = "off";
    input.spellcheck = false;
    const submit = document.createElement("button");
    submit.textContent = "Try the lock";
    const feedback = document.createElement("p");
    feedback.className = "feedback";

    const attempt = () => {
      if (input.disabled) return;
      if (input.value.trim().toUpperCase() === activeLevel.finalCode.toUpperCase()) {
        input.disabled = true;
        submit.disabled = true;
        feedback.textContent = "The lock clicks open!";
        feedback.className = "feedback correct";
        setTimeout(finishLevel, 800);
      } else {
        feedback.textContent = "That's not the code. Check the letters on your clues, and the order.";
        feedback.className = "feedback wrong";
        shakeExit();
      }
    };
    submit.addEventListener("click", attempt);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") attempt();
    });

    row.appendChild(input);
    row.appendChild(submit);
    body.appendChild(row);
    body.appendChild(feedback);
    setTimeout(() => input.focus(), 50);
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function handleLightsClick() {
    state.lightsOff = !state.lightsOff;
    document.querySelector(".scene-svg").classList.toggle("dark", state.lightsOff);
    document.querySelector('[data-hotspot="lights"]').classList.toggle("is-dark", state.lightsOff);
    updateProgressionUI();
  }

  function handleKeyClick() {
    state.keyFound = true;
    updateProgressionUI();
  }

  // ---------- Piano (Level 3's exit) ----------

  const PIANO_KEYS = [
    { note: "C", freq: 261.63 },
    { note: "D", freq: 293.66 },
    { note: "E", freq: 329.63 },
    { note: "F", freq: 349.23 },
    { note: "G", freq: 392.0 },
    { note: "A", freq: 440.0 },
    { note: "B", freq: 493.88 },
    { note: "C", freq: 523.25 },
  ];

  let audioCtx = null;
  function playTone(freq) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.95);
    } catch (e) {
      // No audio available, the keys still work silently.
    }
  }

  function openMelodyPanel(room) {
    const notes = lockChars(room);
    const panel = document.getElementById("puzzle-panel");
    panel.style.display = "block";
    document.getElementById("panel-icon").textContent = "🎹";
    document.getElementById("panel-label").textContent = "Piano";
    const body = document.getElementById("panel-body");
    body.innerHTML = "";

    const intro = document.createElement("p");
    intro.className = "prompt";
    intro.textContent = "The lid is locked. Play the five notes from the clues, in the order you found them.";
    body.appendChild(intro);

    // Only shows how far you've got, never which notes.
    const progress = document.createElement("p");
    progress.className = "melody-notes";
    const chips = notes.map(() => {
      const c = document.createElement("span");
      c.className = "strip-chip";
      c.textContent = "•";
      progress.appendChild(c);
      return c;
    });
    body.appendChild(progress);

    const keys = document.createElement("div");
    keys.className = "piano-keys";
    const feedback = document.createElement("p");
    feedback.className = "feedback";
    let position = 0;
    let done = false;

    PIANO_KEYS.forEach((k) => {
      const btn = document.createElement("button");
      btn.className = "piano-key";
      btn.innerHTML = `<span>${k.note}</span>`;
      btn.addEventListener("click", () => {
        if (done) return;
        playTone(k.freq);
        if (k.note === notes[position]) {
          chips[position].classList.add("played");
          position += 1;
          feedback.textContent = "";
          feedback.className = "feedback";
          if (position === notes.length) {
            done = true;
            feedback.textContent = "That's the melody! The lid is opening...";
            feedback.className = "feedback correct";
            setTimeout(finishLevel, 1100);
          }
        } else {
          position = 0;
          chips.forEach((c) => c.classList.remove("played"));
          feedback.textContent = "That's not the next note. Start again from the first one.";
          feedback.className = "feedback wrong";
          btn.classList.add("wrong");
          setTimeout(() => btn.classList.remove("wrong"), 300);
        }
      });
      keys.appendChild(btn);
    });
    body.appendChild(keys);
    body.appendChild(feedback);
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function finishLevel() {
    closePuzzlePanel();
    const finalTime = stopStopwatch();
    document.getElementById("win-time").textContent = finalTime;
    document.getElementById("win-title").textContent = `🎉 ${activeLevel.winTitle}`;
    document.getElementById("win-text").textContent = activeLevel.winText;
    const meta = LEVEL_META.find((m) => m.key === state.levelKey);
    Auth.recordResult(
      state.levelKey,
      meta ? meta.label : state.levelKey,
      finalTime,
      activeLevel.finalCode,
      state.equationsOn
    );
    renderWinScene();
    showScreen("win");
  }

  // scene click/keyboard delegation (bound once)
  document.getElementById("scene-container").addEventListener("click", (e) => {
    const hotspot = e.target.closest("[data-hotspot]");
    if (!hotspot) return;
    const id = hotspot.getAttribute("data-hotspot");
    if (id === "door") {
      handleExitClick();
    } else if (id === "key") {
      handleKeyClick();
    } else if (id === "lights") {
      handleLightsClick();
    } else {
      openPuzzlePanel(id);
    }
  });
  document.getElementById("scene-container").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const hotspot = e.target.closest("[data-hotspot]");
    if (!hotspot) return;
    e.preventDefault();
    const id = hotspot.getAttribute("data-hotspot");
    if (id === "door") {
      handleExitClick();
    } else if (id === "key") {
      handleKeyClick();
    } else if (id === "lights") {
      handleLightsClick();
    } else {
      openPuzzlePanel(id);
    }
  });
  document.getElementById("panel-close").addEventListener("click", closePuzzlePanel);

  // ---------- Win scene ----------

  function buildConfettiMarkup() {
    const colors = ["#5ee1c9", "#f2b134", "#6bffb0", "#ff6b6b", "#7ecbff", "#ffffff"];
    let markup = "";
    for (let i = 0; i < 28; i++) {
      const x = (i * 137) % 800;
      const y = 15 + ((i * 89) % 350);
      const rot = (i * 53) % 360;
      const color = colors[i % colors.length];
      markup +=
        i % 3 === 0
          ? `<circle cx="${x}" cy="${y}" r="5" fill="${color}" opacity="0.85" />`
          : `<rect x="${x}" y="${y}" width="12" height="6" rx="1.5" fill="${color}" opacity="0.85" transform="rotate(${rot} ${x} ${y})" />`;
    }
    return markup;
  }

  function buildWinSceneSVG() {
    return `
    <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" class="win-scene-svg">
      <defs>
        <linearGradient id="winSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1b2a4a" />
          <stop offset="100%" stop-color="#0a1226" />
        </linearGradient>
        <radialGradient id="winGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#f2d675" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#f2d675" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="trophyGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffe9a8" />
          <stop offset="100%" stop-color="#c9971f" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#winSky)" />
      <rect width="800" height="400" fill="url(#winGlow)" />
      ${buildConfettiMarkup()}
      <g transform="translate(400,190)">
        <ellipse cx="0" cy="118" rx="90" ry="12" fill="#000" opacity="0.25" />
        <rect x="-55" y="96" width="110" height="18" rx="4" fill="url(#trophyGold)" stroke="#8a6a10" stroke-width="2" />
        <rect x="-14" y="70" width="28" height="30" fill="url(#trophyGold)" stroke="#8a6a10" stroke-width="2" />
        <path d="M-40,10 Q-40,70 -14,72 L14,72 Q40,70 40,10 L40,-10 L-40,-10 Z" fill="url(#trophyGold)" stroke="#8a6a10" stroke-width="2.5" />
        <path d="M-40,-4 C-70,-4 -70,40 -38,36" fill="none" stroke="url(#trophyGold)" stroke-width="6" />
        <path d="M40,-4 C70,-4 70,40 38,36" fill="none" stroke="url(#trophyGold)" stroke-width="6" />
        <rect x="-42" y="-24" width="84" height="18" rx="3" fill="url(#trophyGold)" stroke="#8a6a10" stroke-width="2" />
        <text x="0" y="34" font-size="30" text-anchor="middle">⭐</text>
      </g>
    </svg>`;
  }

  function renderWinScene() {
    document.getElementById("win-scene-container").innerHTML = buildWinSceneSVG();
  }

  document.getElementById("btn-start").addEventListener("click", () => {
    startStopwatch();
    showScreen("room");
    renderRoom();
  });
  function goToLevelSelect() {
    clearInterval(state.timerHandle);
    document.getElementById("stopwatch").textContent = "00:00";
    document.getElementById("game-title").textContent = "Quarry Lane School";
    renderLevelSelect();
    showScreen("level");
  }
  document.getElementById("btn-change-level").addEventListener("click", goToLevelSelect);
  document.getElementById("btn-back-to-levels").addEventListener("click", goToLevelSelect);
  document.getElementById("btn-restart").addEventListener("click", goToLevelSelect);

  // ---------- Sign-in gate ----------

  document.getElementById("btn-google-signin").addEventListener("click", () => {
    const errorEl = document.getElementById("signin-error");
    errorEl.style.display = "none";
    Auth.signIn().catch((err) => {
      errorEl.textContent =
        err.code === "auth/popup-closed-by-user"
          ? "Sign-in was closed before finishing. Try again."
          : "Couldn't sign in with that account. Make sure you're using your Quarry Lane School Google account.";
      errorEl.style.display = "block";
    });
  });

  document.getElementById("btn-sign-out").addEventListener("click", () => {
    clearInterval(state.timerHandle);
    Auth.signOut();
  });

  const eqToggle = document.getElementById("toggle-equations");
  try {
    eqToggle.checked = localStorage.getItem("pe-equations") === "1";
  } catch (e) {
    // Storage blocked, the toggle just starts off each visit.
  }
  eqToggle.addEventListener("change", () => {
    try {
      localStorage.setItem("pe-equations", eqToggle.checked ? "1" : "0");
    } catch (e) {
      // Nothing to do if storage is blocked.
    }
  });

  renderLevelSelect();

  Auth.onAuthChange((user) => {
    const userBar = document.getElementById("user-bar");
    if (user) {
      userBar.style.display = "flex";
      document.getElementById("user-email").textContent = user.email;
      renderLevelSelect();
      showScreen("level");
    } else {
      userBar.style.display = "none";
      showScreen("signin");
    }
  });
})();
