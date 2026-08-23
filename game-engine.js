(function () {
  const state = {
    levelKey: null,
    roomIndex: 0,
    solved: new Set(), // puzzle ids solved
    collectedFragments: [], // in room order
    startTime: null,
    timerHandle: null,
    activePuzzleId: null,
  };

  let activeLevel = null; // LEVELS[state.levelKey]
  let activeScenes = null; // SCENES[state.levelKey]

  // Each room's background photo, real-door location (if the photo has one),
  // and where its puzzle props sit on real objects in that photo. Coordinates
  // are in the photo's own pixel space (all bg images are 1100x825).
  // Keyed by level, since each level currently has its own single room/photo.
  const SCENES = {
    regular: [
      {
        // Mechanics Bench, gym, real basketball hoop + bleachers
        bgImage: "art/bg-mechanics.jpg",
        bgSize: { w: 1100, h: 825 },
        glow: "#f2b134",
        door: null,
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
        // Circuit Table, school office entrance, real door + mail slot
        bgImage: "art/bg-circuits.jpg",
        bgSize: { w: 1100, h: 825 },
        glow: "#5ee1c9",
        extraHidden: true, // objects here start with no idle glow at all, hover only
        door: { cx: 562, cy: 375, r: 60 },
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
        // Optics & Waves Corner, music room, real whiteboard + piano
        bgImage: "art/bg-waves.jpg",
        bgSize: { w: 1100, h: 825 },
        glow: "#7ecbff",
        door: null,
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
        // The Tech Lot, robotics team trailer + parking lot
        bgImage: "art/bg-win.jpg",
        bgSize: { w: 1100, h: 825 },
        glow: "#c9a6ff",
        door: null,
        props: [
          { type: "marker", cx: 791, cy: 114, size: 55, label: "Streetlamp", icon: "💡" },
          { type: "marker", cx: 760, cy: 330, size: 90, label: "Stair railing", icon: "🪜" },
          { type: "marker", cx: 515, cy: 195, size: 75, label: "Trailer's tech badge", icon: "🔌" },
          { type: "marker", cx: 1005, cy: 430, size: 130, label: "Parked van", icon: "🚐" },
          { type: "marker", cx: 330, cy: 55, size: 90, label: "The sky overhead", icon: "🛰️" },
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
      btn.innerHTML = `<span class="level-btn-label">${meta.label}</span>`;
      btn.addEventListener("click", () => selectLevel(meta.key));
      grid.appendChild(btn);
    });
  }

  function selectLevel(key) {
    state.levelKey = key;
    activeLevel = LEVELS[key];
    activeScenes = SCENES[key];
    state.roomIndex = 0;
    state.solved.clear();
    state.collectedFragments = [];
    state.activePuzzleId = null;
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

  function buildPropSVG(scene, prop, puzzle, isSolved) {
    if (isSolved) return ""; // already collected, nothing left to draw
    const half = prop.size / 2;
    return `
    <svg class="hotspot prop" style="--prop-glow:${scene.glow}" data-hotspot="${puzzle.id}"
         x="${prop.cx - half}" y="${prop.cy - half}" width="${prop.size}" height="${prop.size}"
         viewBox="0 0 100 100" tabindex="0" role="button" aria-label="${prop.label}">
      ${propShapeMarkup(prop.type, prop.icon)}
    </svg>`;
  }

  function buildDoorSVG(scene, allSolved) {
    if (!scene.door) return "";
    const { cx, cy, r } = scene.door;
    return `
    <svg class="hotspot door-hotspot ${allSolved ? "unlocked" : "locked"}" data-hotspot="door"
         x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}"
         viewBox="0 0 100 100" tabindex="0" role="button" aria-label="Door">
      <circle class="door-hit" cx="50" cy="50" r="48" />
      <text class="door-icon" x="50" y="58" font-size="26" text-anchor="middle">${allSolved ? "🔓" : "🔒"}</text>
    </svg>`;
  }

  // ---------- Room scene ----------

  function buildRoomSceneSVG(scene, room) {
    const allSolved = room.puzzles.every((p) => state.solved.has(p.id));
    const { w, h } = scene.bgSize;

    const propsMarkup = room.puzzles
      .map((puzzle, idx) => buildPropSVG(scene, scene.props[idx], puzzle, state.solved.has(puzzle.id)))
      .join("");

    return `
    <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" class="scene-svg${scene.extraHidden ? " scene-extra-hidden" : ""}">
      <image x="0" y="0" width="${w}" height="${h}" href="${scene.bgImage}" />
      ${propsMarkup}
      ${buildDoorSVG(scene, allSolved)}
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

  function updateProgressionUI() {
    const room = activeLevel.rooms[state.roomIndex];
    const scene = currentScene();
    const allSolved = room.puzzles.every((p) => state.solved.has(p.id));
    const foundCount = room.puzzles.filter((p) => state.solved.has(p.id)).length;

    const counter = document.getElementById("found-counter");
    counter.textContent = `${foundCount} / ${room.puzzles.length} found`;
    counter.classList.toggle("all-found", allSolved);

    if (scene.door) {
      const doorEl = document.querySelector('[data-hotspot="door"]');
      if (doorEl) {
        doorEl.classList.toggle("unlocked", allSolved);
        doorEl.classList.toggle("locked", !allSolved);
        const icon = doorEl.querySelector(".door-icon");
        if (icon) icon.textContent = allSolved ? "🔓" : "🔒";
      }
      document.getElementById("continue-row").style.display = "none";
    } else {
      document.getElementById("continue-row").style.display = allSolved ? "block" : "none";
    }

    document.getElementById("scene-hint").textContent = allSolved
      ? scene.door
        ? "All clues found. Click the door to escape!"
        : "All clues found. Time to escape!"
      : "Click objects in the room to investigate them.";
  }

  function renderRoom() {
    const room = activeLevel.rooms[state.roomIndex];
    document.getElementById("room-icon").textContent = room.icon;
    document.getElementById("room-title").textContent = room.title;
    document.getElementById("room-intro").textContent = room.intro;
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

  function openPuzzlePanel(puzzleId) {
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
    const body = document.getElementById("panel-body");
    body.innerHTML = "";

    const prompt = document.createElement("p");
    prompt.className = "prompt";
    prompt.textContent = puzzle.prompt;
    body.appendChild(prompt);

    if (isSolved) {
      const banner = document.createElement("p");
      banner.className = "solved-banner";
      banner.textContent = "✓ Solved!";
      body.appendChild(banner);
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
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
    }

    updateProgressionUI();
    // Refresh the panel in place so it shows the solved state.
    openPuzzlePanel(puzzle.id);
  }

  function handleDoorClick() {
    const room = activeLevel.rooms[state.roomIndex];
    const allSolved = room.puzzles.every((p) => state.solved.has(p.id));
    if (!allSolved) {
      const doorEl = document.querySelector('[data-hotspot="door"]');
      if (doorEl) {
        doorEl.classList.remove("shake");
        void doorEl.offsetWidth; // restart animation
        doorEl.classList.add("shake");
      }
      document.getElementById("scene-hint").textContent =
        "🔒 Still locked. Solve every clue in this room first.";
      return;
    }
    goToNextRoom(room);
  }

  function goToNextRoom(room) {
    const fragment = room.puzzles.map((p) => p.contribution).join("");
    state.collectedFragments.push(fragment);

    if (state.roomIndex < activeLevel.rooms.length - 1) {
      state.roomIndex += 1;
      showScreen("room");
      renderRoom();
    } else {
      const finalTime = stopStopwatch();
      document.getElementById("win-time").textContent = finalTime;
      const meta = LEVEL_META.find((m) => m.key === state.levelKey);
      Auth.recordResult(state.levelKey, meta ? meta.label : state.levelKey, finalTime, activeLevel.finalCode);
      renderWinScene();
      showScreen("win");
    }
  }

  // scene click/keyboard delegation (bound once)
  document.getElementById("scene-container").addEventListener("click", (e) => {
    const hotspot = e.target.closest("[data-hotspot]");
    if (!hotspot) return;
    const id = hotspot.getAttribute("data-hotspot");
    if (id === "door") {
      handleDoorClick();
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
      handleDoorClick();
    } else {
      openPuzzlePanel(id);
    }
  });
  document.getElementById("panel-close").addEventListener("click", closePuzzlePanel);
  document.getElementById("btn-next-room").addEventListener("click", () => {
    goToNextRoom(activeLevel.rooms[state.roomIndex]);
  });

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

  function restart() {
    state.roomIndex = 0;
    state.solved.clear();
    state.collectedFragments = [];
    state.activePuzzleId = null;
    document.getElementById("stopwatch").textContent = "00:00";
    showScreen("intro");
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
    showScreen("level");
  }
  document.getElementById("btn-change-level").addEventListener("click", goToLevelSelect);
  document.getElementById("btn-back-to-levels").addEventListener("click", goToLevelSelect);
  document.getElementById("btn-restart").addEventListener("click", restart);

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

  renderLevelSelect();

  Auth.onAuthChange((user) => {
    const userBar = document.getElementById("user-bar");
    if (user) {
      userBar.style.display = "flex";
      document.getElementById("user-email").textContent = user.email;
      showScreen("level");
    } else {
      userBar.style.display = "none";
      showScreen("signin");
    }
  });
})();
