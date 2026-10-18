/*
  GAME CONTENT
  ------------
  Edit the text between quotes to swap in your own questions.
  Do NOT rename any keys (type, prompt, answer, etc.), only change the values.

  There are four difficulty levels (LEVEL_META_V2 below controls the buttons on the
  level-select screen). Each level is its own story, told across two rooms: a
  hallway (2 clues) and a main room (3 clues, ending in that level's lock/key/
  melody). The five clues still have to be solved in a fixed order, but that
  order weaves back and forth between the two rooms (solve one in the hallway,
  the next is in the room, the next is back in the hallway, and so on), so
  `solveOrder` lists the puzzle ids in the actual order they get solved. That's
  what builds the final code, and it's why the codePrompt text can honestly say
  "in the order you found them."

  How the order works: every clue after the first is missing a piece. Its prompt
  has a {{name}} placeholder, which shows as ??? until the player places the
  matching "clue card" into it. Solving a clue hands the player a card:

    reveal: { text: "story text shown after solving",
              card: { name: "name", value: "8", label: "8 m/s" } }

  `name` must match a {{name}} placeholder in some other clue's prompt. `label`
  is what the player sees on the card, `value` is what fills the blank. Nothing
  tells the player which clue a card belongs in, they have to work that out.
  A clue with no `card` (the last one) just shows its story text.

  Puzzle types:
    "numeric"   -> a calculated answer. `answer` is a number, the player's input
                   must match it exactly (no rounding leeway), so pick a value
                   you expect them to actually type.
    "multipart" -> several small sub-answers in one puzzle (used for IB-style
                   multi-step problems). `parts` is a list of
                   { label, type: "numeric" | "text", answer }.
                   ALL parts must be correct to solve the puzzle.

  Each puzzle has a `contribution`: a single character awarded when solved. In
  levels with a lock (Level 1, Level 3, Level 4) they make up the code the
  player has to type in, in Level 2 (a key hunt) they're not shown. They only
  show up inside the clue itself, so the player has to reread their clues and
  put the code together on their own. The final code is computed automatically
  at the bottom, from `solveOrder`, not from array position.

  `collect` sets the label on that character inside the clue:
    { chip: "Lock letter" }  or null for no visible code.
*/

const LEVEL_META_V2 = [
  { key: "regular", label: "Level 1", story: "The Locked Harkness Room" },
  { key: "ap1", label: "Level 2", story: "The Trophy Case Riddle" },
  { key: "apc", label: "Level 3", story: "Override Code" },
  { key: "ib", label: "Level 4", story: "Lab Lockdown" },
];

const LEVELS_V2 = {
  // ---------------------------------------------------------------
  regular: {
    title: "Physics Explorer V2, Level 1",
    storyTitle: "The Locked Harkness Room",
    intro:
      "You're setting up for today's Harkness seminar, but the classroom door swung shut behind you " +
      "on your way back from the hallway. The room's far door has a keypad lock, if you can get " +
      "back in to punch in the code. Clues are scattered between the hallway and the room, each one " +
      "needs a piece from the other, so you'll be walking back and forth to solve them in order.",
    winTitle: "You're back in!",
    winText: "The keypad beeped, the door popped open, and the Harkness table is ready right on time.",
    collect: { chip: "Keypad digit" },
    solveOrder: ["phy1", "phy3", "phy2", "phy4", "phy5"],
    rooms: [
      {
        id: "hallway",
        title: "Station 1: The Hallway",
        icon: "🚪",
        intro: "Lockers stretch down the hall. The row of lockers and the window in the classroom door both catch your eye.",
        puzzles: [
          {
            id: "phy1",
            type: "numeric",
            prompt:
              "A water bottle rolls out of an open locker and hits the floor at 5 m/s, with a mass of 0.6 kg. Find its momentum, in kg·m/s.",
            answer: 3,
            hint: "Heavier and faster both count toward it. Combine them the simplest way two numbers can be combined.",
            contribution: "3",
            reveal: {
              text: "Stuck inside the locker door, a sticky note reads: \"3.5 kg\".",
              card: { name: "mass", value: "3.5", label: "3.5 kg" },
            },
          },
          {
            id: "phy2",
            type: "numeric",
            prompt:
              "Through the door's glass, a hallway monitor paces past at a steady 1.5 m/s for {{time}} s. Find the distance covered, in meters.",
            answer: 22.5,
            hint: "Distance is just speed multiplied by how long it kept going.",
            contribution: "2",
            reveal: {
              text: "Taped to the inside of the glass: \"6 N\".",
              card: { name: "force", value: "6", label: "6 N" },
            },
          },
        ],
      },
      {
        id: "room",
        title: "Station 2: The Harkness Room",
        icon: "🏫",
        intro: "Back inside. A keypad on the far door is dark, waiting for a code.",
        puzzles: [
          {
            id: "phy3",
            type: "numeric",
            prompt:
              "A stack of library books on the bookshelf has a mass of {{mass}} kg. Find its weight, in Newtons. (use g = 9.8 m/s²)",
            answer: 34.3,
            hint: "Everything with mass gets pulled the same way here. The pull just scales with how much there is.",
            contribution: "2",
            reveal: {
              text: "Wedged behind the books: \"15 s\".",
              card: { name: "time", value: "15", label: "15 s" },
            },
          },
          {
            id: "phy4",
            type: "numeric",
            prompt:
              "Someone bumps the oval table with {{force}} N of force for 0.8 s. Find the impulse delivered, in N·s.",
            answer: 4.8,
            hint: "A push held for a stretch of time adds up to more than the push alone.",
            contribution: "4",
            reveal: {
              text: "Scratched into the table leg: \"0.4 A\".",
              card: { name: "current", value: "0.4", label: "0.4 A" },
            },
          },
          {
            id: "phy5",
            type: "numeric",
            prompt:
              "The AC unit's fan motor draws {{current}} A from a 120V line. Find the power, in Watts.",
            answer: 48,
            hint: "Power is voltage and current working together. Multiply what's pushing by what's flowing.",
            contribution: "8",
            reveal: {
              text: "The keypad screen flickers on. All five digits are ready, try the lock!",
            },
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  ap1: {
    title: "Physics Explorer V2, Level 2",
    storyTitle: "The Trophy Case Riddle",
    intro:
      "You cut through the Catwalk on your way to practice, but the trophy case at the far end is " +
      "locked and everyone's asking where the spare key went. Every clue you solve gives you a scrap " +
      "of info that another clue needs, back in the other room, so you'll be walking back and forth. " +
      "Work out which is which, find the key, and get to practice on time!",
    winTitle: "Found it!",
    winText: "The case creaked open. The missing team photo was tucked right behind the trophies the whole time.",
    collect: null,
    solveOrder: ["ap1_1", "ap1_3", "ap1_2", "ap1_4", "ap1_5"],
    rooms: [
      {
        id: "hallway",
        title: "Station 1: The Catwalk",
        icon: "🖼️",
        intro: "A quiet hallway with a lounge table, track lights overhead, and windows looking down on the gym.",
        puzzles: [
          {
            id: "ap1_1",
            type: "numeric",
            prompt:
              "The track lights overhead give off 1.5 W of light power equally in all directions. Find the intensity 1.0 m away, in W/m².",
            answer: 0.119,
            hint: "The same power ends up spread over a bigger and bigger sphere as you move away. Divide the power by that sphere's surface area.",
            contribution: "S",
            reveal: {
              text: "A maintenance tag flutters down from the light fixture: \"second trophy mass 3.0 kg\".",
              card: { name: "mass2", value: "3.0", label: "3.0 kg" },
            },
          },
          {
            id: "ap1_2",
            type: "numeric",
            prompt:
              "One window's mounting bracket feels a force of {{force}} N at a perpendicular distance of 0.3 m from the wall anchor. Find the torque, in N·m.",
            answer: 4.5,
            hint: "Twisting effect is the push times how far out from the pivot it's applied.",
            contribution: "P",
            reveal: {
              text: "Taped to the window frame: \"required torque 30 N·m\".",
              card: { name: "torque", value: "30", label: "30 N·m" },
            },
          },
        ],
      },
      {
        id: "room",
        title: "Station 2: The Trophy Alcove",
        icon: "🏆",
        intro: "Blue chairs flank a locked glass case. The key has to be around here somewhere.",
        puzzles: [
          {
            id: "ap1_3",
            type: "numeric",
            prompt:
              "Taped to the window, a note describes: a 2.0 kg trophy at x = 0 and a {{mass2}} kg trophy at x = 1.5 m. Find the center of mass, measured from the 2.0 kg trophy, in meters.",
            answer: 0.9,
            hint: "The balance point leans toward whichever mass is heavier. Weight each position by how much sits there before averaging.",
            contribution: "E",
            reveal: {
              text: "Scratched into the window frame: \"mounting force 15 N\".",
              card: { name: "force", value: "15", label: "15 N" },
            },
          },
          {
            id: "ap1_4",
            type: "numeric",
            prompt:
              "A note tucked into the blue armchair says a bracket needs a torque of {{torque}} N·m at 0.5 m from its pivot. Find the force needed, in Newtons.",
            answer: 60,
            hint: "Twisting effect is force times distance from the pivot. Rearrange to solve for the force.",
            contribution: "A",
            reveal: {
              text: "Under the cushion: \"shelf height 1.2 m\".",
              card: { name: "height", value: "1.2", label: "1.2 m" },
            },
          },
          {
            id: "ap1_5",
            type: "numeric",
            prompt:
              "A 0.4 kg trophy topples from a shelf {{height}} m up inside the case. Find its speed just before hitting the case floor, in m/s. (use g = 9.8 m/s²)",
            answer: 4.85,
            hint: "Falling height turns into speed the same way every time, the mass along for the ride doesn't matter.",
            contribution: "K",
            reveal: {
              text: "Something glints behind the lowest shelf, the spare key!",
            },
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  apc: {
    title: "Physics Explorer V2, Level 3",
    storyTitle: "Override Code",
    intro:
      "The Gym Foyer's exit door lock glitched out after last period, and now it just blinks red. " +
      "The custodian says there's a manual override code, but it's scattered across notes taped around " +
      "the foyer and the game area, each one needing a piece from the other room. Walk back and forth, " +
      "solving clues in order.",
    winTitle: "Override accepted!",
    winText: "The lock chirps green. Whatever glitched it, it's fixed, at least for tonight.",
    collect: { chip: "Override digit" },
    solveOrder: ["apc_1", "apc_3", "apc_2", "apc_4", "apc_5"],
    rooms: [
      {
        id: "hallway",
        title: "Station 1: The Gym Foyer",
        icon: "📌",
        intro: "Benches line a long hallway. The ceiling vent and the foosball table both have notes stuck to them.",
        puzzles: [
          {
            id: "apc_1",
            type: "numeric",
            prompt:
              "Taped by the ceiling vent: a(t) = (6t − 2) m/s², v(0) = 3 m/s. Find v at t = 3 s.",
            answer: 24,
            hint: "Speed is nothing more than acceleration piling up over time, starting from wherever it began.",
            contribution: "2",
            reveal: {
              text: "Written under the vent grille: \"τ(t) = 5t + 1\".",
              card: { name: "coef", value: "5", label: "coef = 5" },
            },
          },
          {
            id: "apc_2",
            type: "numeric",
            prompt:
              "Taped to the foosball table: using the same a(t) = 6t − 2 with v(0) = 3 and x(0) = {{x0}}, find the position at t = 3 s.",
            answer: 27,
            hint: "Position piles up from speed the exact same way speed piled up from acceleration, one more round of the same trick.",
            contribution: "4",
            reveal: {
              text: "Under the foosball table's edge: \"F(x) = 8 − 2x\".",
              card: { name: "coef2", value: "2", label: "coef = 2" },
            },
          },
        ],
      },
      {
        id: "room",
        title: "Station 2: The Game Area",
        icon: "🔑",
        intro: "Glass doors lead outside, a ping-pong table waits, and a door lock glows red on the wall.",
        puzzles: [
          {
            id: "apc_3",
            type: "numeric",
            prompt:
              "The entrance door's closer arm swings under τ(t) = {{coef}}t + 1 N·m on a pivot with I = 2.0 kg·m² from rest. Find ω at t = 2 s.",
            answer: 6,
            hint: "Torque piling up over time is what builds spin. Total it up across the interval, then scale by how hard the rod resists turning.",
            contribution: "6",
            reveal: {
              text: "Scratched into the door's kickplate: \"x(0) = 0\".",
              card: { name: "x0", value: "0", label: "x(0) = 0" },
            },
          },
          {
            id: "apc_4",
            type: "numeric",
            prompt:
              "A ping-pong ball is hit across the table with F(x) = (8 − {{coef2}}x) N across the table. Find the work done from x = 0 to x = 2 m, in Joules.",
            answer: 12,
            hint: "When the force itself keeps changing with position, total it up across the whole distance instead of just multiplying force by distance.",
            contribution: "2",
            reveal: {
              text: "Under the table, a note: \"C = 20 μF\".",
              card: { name: "cap", value: "20", label: "C = 20 μF" },
            },
          },
          {
            id: "apc_5",
            type: "numeric",
            prompt:
              "The door lock's backup capacitor ({{cap}} μF) charges via I(t) = 0.5t A. Find the charge delivered from t = 0 to t = 4 s, in Coulombs.",
            answer: 4,
            hint: "Charge is current piling up over time. Total it up across the interval.",
            contribution: "7",
            reveal: {
              text: "The lock beeps green, the override code is accepted. Click it to unlock!",
            },
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  ib: {
    title: "Physics Explorer V2, Level 4",
    storyTitle: "Lab Lockdown",
    intro:
      "The Fabrication Lab auto-locked after equipment was left running unsupervised. A safety " +
      "checklist by the door has to be worked through in order, but the steps ping-pong between the " +
      "hallway and the lab itself, since each one gives you a number the next step (in the other room) " +
      "needs. Get through the checklist and get the lab back open.",
    winTitle: "Lab unlocked!",
    winText: "The bolt retracts with a clunk. Whoever left the printer running is getting an earful tomorrow.",
    collect: { chip: "Override character" },
    solveOrder: ["ib1", "ib3", "ib2", "ib4", "ib5"],
    rooms: [
      {
        id: "hallway",
        title: "Station 1: The Safe Zone Hallway",
        icon: "☣️",
        intro: "A red-tiled stripe runs down the hall. The heavy door on the right has a narrow window with something behind it.",
        puzzles: [
          {
            id: "ib1",
            type: "multipart",
            prompt:
              "A faint marking on a red floor tile lists an old classroom sample: 6.0×10²⁰ nuclei, half-life 5 years. Very big numbers have to be typed with e, like 3.2e18.",
            parts: [
              { label: "Decay constant (per year)", type: "numeric", answer: 0.139 },
              { label: "Nuclei remaining after 10 years (type it with e, like 3.2e18)", type: "numeric", answer: 1.5e20 },
              { label: "Activity after 10 years, in decays/year (type it with e, like 3.2e18)", type: "numeric", answer: 2.08e19 },
            ],
            hint: "Half-life and decay constant are two ways of describing the same fading rate. Once you have one, exponential decay carries the rest forward, including how fast it's decaying at that later moment.",
            contribution: "L",
            reveal: {
              text: "Someone scrawled a note on the tile: \"print head belt runs at 2.0 m/s\".",
              card: { name: "launchSpeed", value: "2.0", label: "2.0 m/s" },
            },
          },
          {
            id: "ib2",
            type: "multipart",
            prompt:
              "Behind the narrow window of the right-hand door sits a {{cap}} μF capacitor, charged to 10.0V through a 1000 Ω resistor.",
            parts: [
              { label: "Max charge (μC)", type: "numeric", answer: 1000 },
              { label: "Energy stored (mJ)", type: "numeric", answer: 5 },
              { label: "Time constant (s)", type: "numeric", answer: 0.1 },
            ],
            hint: "How much charge piles up depends on the capacitor's size and the push behind it. The resistor's job is just how quickly it gets there.",
            contribution: "B",
            reveal: {
              text: "A sticky note stuck to the glass: \"tool caddy rolling at 1.5 m/s\".",
              card: { name: "rollSpeed", value: "1.5", label: "1.5 m/s" },
            },
          },
        ],
      },
      {
        id: "room",
        title: "Station 2: The Fabrication Lab",
        icon: "🔧",
        intro: "3D printers hum along one wall. A tool caddy sits near the workbench, and the inner door waits, locked.",
        puzzles: [
          {
            id: "ib3",
            type: "multipart",
            prompt:
              "A small print-head part pops loose and launches horizontally at {{launchSpeed}} m/s from the bench, 0.8 m up. (use g = 9.8 m/s². Give answers to 3 significant figures.)",
            parts: [
              { label: "Time to fall (s)", type: "numeric", answer: 0.404 },
              { label: "Horizontal distance (m)", type: "numeric", answer: 0.808 },
              { label: "Impact speed (m/s)", type: "numeric", answer: 4.44 },
            ],
            hint: "The fall down and the travel sideways happen on their own separate clocks. Find how long the fall takes first, then combine both directions for the final speed.",
            contribution: "A",
            reveal: {
              text: "It skids into a loose capacitor casing, rated 100 μF.",
              card: { name: "cap", value: "100", label: "100 μF" },
            },
          },
          {
            id: "ib4",
            type: "multipart",
            prompt:
              "The tool caddy (4.0 kg, radius 0.15 m, a solid cylinder) rolls without slipping at {{rollSpeed}} m/s across the floor.",
            parts: [
              { label: "Translational KE (J)", type: "numeric", answer: 4.5 },
              { label: "Rotational KE (J)", type: "numeric", answer: 2.25 },
              { label: "Total KE (J)", type: "numeric", answer: 6.75 },
            ],
            hint: "Rolling without slipping means the spin speed and the straight-line speed are locked together. A solid cylinder's rotational inertia gives it exactly half as much spinning energy as moving energy.",
            contribution: "4",
            reveal: {
              text: "It bumps a loose wire, and a meter nearby reads 2.5 A.",
              card: { name: "current", value: "2.5", label: "2.5 A" },
            },
          },
          {
            id: "ib5",
            type: "multipart",
            prompt:
              "The robot arm's servo, wired to the lab door's release, draws {{current}} A at 24V, running for 8.0 s to retract the bolt.",
            parts: [
              { label: "Power (W)", type: "numeric", answer: 60 },
              { label: "Energy used (J)", type: "numeric", answer: 480 },
              { label: "Useful mechanical energy at 75% efficiency (J)", type: "numeric", answer: 360 },
            ],
            hint: "Power times time gives the total energy spent. Since the servo isn't perfectly efficient, only part of that energy actually does useful work.",
            contribution: "!",
            reveal: {
              text: "The bolt retracts. Every step is done, enter the code!",
            },
          },
        ],
      },
    ],
  },
};

// Equations shown as glowing writing on walls, floors and ceilings when the
// player turns on "Extra clues" and flips the room's light switch. Keyed by
// puzzle id. `_0` and `_{out}` render as real subscripts.
const EQUATIONS_V2 = {
  phy1: ["p = mv"],
  phy2: ["d = vt"],
  phy3: ["W = mg"],
  phy4: ["J = FΔt"],
  phy5: ["P = VI"],
  ap1_1: ["I = P / 4πr²"],
  ap1_2: ["τ = Fr"],
  ap1_3: ["x = (m_1x_1 + m_2x_2) / (m_1 + m_2)"],
  ap1_4: ["F = τ / r"],
  ap1_5: ["v = √(2gh)"],
  apc_1: ["v = v_0 + ∫a dt"],
  apc_2: ["x = x_0 + ∫v dt"],
  apc_3: ["ω = (1/I) ∫τ dt"],
  apc_4: ["W = ∫F dx"],
  apc_5: ["Q = ∫I dt"],
  ib1: ["λ = ln2 / t_{½}", "N = N_0e^(-λt)", "A = λN"],
  ib2: ["Q = CV", "E = ½CV²", "τ = RC"],
  ib3: ["t = √(2h/g)", "x = vt", "v_y = gt", "v = √(v_x² + v_y²)"],
  ib4: ["KE = ½mv² + ½Iω²", "I = ½mr²"],
  ib5: ["P = VI", "E = Pt"],
};

Object.values(LEVELS_V2).forEach((level) => {
  level.rooms.forEach((room) => {
    room.puzzles.forEach((p) => {
      p.equations = EQUATIONS_V2[p.id] || [];
    });
  });
});

// Auto-built from `solveOrder`, in that order (not array position), since play
// order now weaves between the hallway and the room. Don't edit directly.
Object.values(LEVELS_V2).forEach((level) => {
  const byId = {};
  level.rooms.forEach((room) => room.puzzles.forEach((p) => (byId[p.id] = p)));
  level.finalCode = level.solveOrder.map((id) => byId[id].contribution).join("");
});
