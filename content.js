/*
  GAME CONTENT
  ------------
  Edit the text between quotes to swap in your own questions.
  Do NOT rename any keys (type, prompt, answer, etc.), only change the values.

  There are four difficulty LEVELS (LEVEL_META below controls the buttons on the
  level-select screen). Each level is its own story, set in one room, with five
  clues that have to be solved IN ORDER.

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
    "mcq"       -> multiple choice. `options` is a list of strings, `answer` must
                   exactly match one of the option strings.
    "numeric"   -> a calculated answer. `answer` is a number, the player's input
                   must match it exactly (no rounding leeway), so pick a value
                   you expect them to actually type.
    "text"      -> a short word/phrase answer, case-insensitive.
    "multipart" -> several small sub-answers in one puzzle (used for IB-style
                   multi-step problems). `parts` is a list of
                   { label, type: "numeric" | "text", answer }.
                   ALL parts must be correct to solve the puzzle.

  Each puzzle has a `contribution`: a single character awarded when solved. In
  levels with a lock (Level 1 and Level 4) they make up the code the player has
  to type in, in Level 3 they are the piano notes to play, in order. They are
  only shown inside the clue itself, so the player has to reread their clues and
  put the code together on their own. The final code is computed automatically
  at the bottom.

  `collect` sets the label on that character inside the clue:
    { chip: "Lock letter" }  or null for no visible code.
*/

// Ranked easiest to hardest: regular Physics (single-step algebra), then
// AP Physics 1 (multi-concept algebra), then AP Physics C (calculus), then
// IB Physics (broadest topic range, every question is multi-part).
const LEVEL_META = [
  { key: "regular", label: "Level 1", story: "Coach's Locked Playbook" },
  { key: "ap1", label: "Level 2", story: "The Locked Meeting" },
  { key: "apc", label: "Level 3", story: "The Lost Melody" },
  { key: "ib", label: "Level 4", story: "Load-Out Night" },
];

const LEVELS = {
  // ---------------------------------------------------------------
  regular: {
    title: "Physics Explorer, Level 1",
    storyTitle: "Coach's Locked Playbook",
    intro:
      "It's the night before the big game, and Coach locked the playbook in the equipment cage. " +
      "As a joke, Coach left a trail of clues around the gym. Each one you solve gives you a letter " +
      "for the cage lock and a scrap of info that another clue needs. Work out which clue it belongs " +
      "to, reread your clues to put the letters together, and open the cage before your ride leaves!",
    winTitle: "The cage is open!",
    winText: "You spelled SWISH, the lock popped, and the playbook is yours. Coach is going to laugh.",
    collect: { chip: "Lock letter" },
    rooms: [
      {
        id: "gym",
        title: "The Gym",
        icon: "🏀",
        intro: "The equipment cage is locked. Coach left a clue on everything in here.",
        puzzles: [
          {
            id: "phy1",
            type: "numeric",
            prompt:
              "The basketball has a mass of 6 kg and moves at 7 m/s right before it swishes through the net. Find its momentum, in kg·m/s.",
            answer: 42,
            hint: "Heavier and faster both count toward it. Combine them the simplest way two numbers can be combined.",
            contribution: "S",
            reveal: {
              text: "Taped inside the net is a scrap of paper. It says: \"8 m/s\".",
              card: { name: "rimSpeed", value: "8", label: "8 m/s" },
            },
          },
          {
            id: "phy2",
            type: "numeric",
            prompt:
              "A point on the hula hoop's rim moves at {{rimSpeed}} m/s as it spins, with the hoop's radius 2 m. Find the centripetal acceleration, in m/s².",
            answer: 32,
            hint: "Speed counts double here. A tighter circle at the same speed pulls harder than a wider one.",
            contribution: "W",
            reveal: {
              text: "Scratched inside the hoop is a short note: \"0.5 s\".",
              card: { name: "contactTime", value: "0.5", label: "0.5 s" },
            },
          },
          {
            id: "phy3",
            type: "numeric",
            prompt:
              "A player collides with the padded pole, which pushes back with 20 N of force for {{contactTime}} s while cushioning the hit. Find the impulse delivered, in N·s.",
            answer: 10,
            hint: "A push held for a stretch of time adds up to more than the push alone. How long it lasts matters as much as how hard.",
            contribution: "I",
            reveal: {
              text: "A sticker on the pole reads: \"2 m/s²\".",
              card: { name: "sprintAcc", value: "2", label: "2 m/s²" },
            },
          },
          {
            id: "phy4",
            type: "numeric",
            prompt:
              "The clipboard logs a sprint: starting at 10 m/s and accelerating at {{sprintAcc}} m/s² for 5 s. Find the distance covered, in meters.",
            answer: 75,
            hint: "Part of the distance comes from the speed it already had; the rest comes from how much that speed kept building.",
            contribution: "S",
            reveal: {
              text: "The last page of the clipboard has just one line: \"8 kg\".",
              card: { name: "crestMass", value: "8", label: "8 kg" },
            },
          },
          {
            id: "phy5",
            type: "numeric",
            prompt:
              "The framed school crest has a mass of {{crestMass}} kg. Find its weight, in Newtons. (use g = 9.8 m/s²)",
            answer: 78.4,
            hint: "Everything with mass gets pulled the same way here. The pull just scales with how much there is.",
            contribution: "H",
            reveal: {
              text: "Behind the crest is the last letter. That's all five. Put them together and try the cage lock!",
            },
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  ap1: {
    title: "Physics Explorer, Level 2",
    storyTitle: "The Locked Meeting",
    intro:
      "You're the student aide carrying the signed field trip forms, but the staff meeting already " +
      "started and the office doors are locked. The secretary left a trail of memos around the " +
      "entrance that ends at a spare key. Every memo is missing a piece, and the pieces are scattered " +
      "across the other memos. Work out what goes where, find the key, and get inside before your " +
      "ride leaves!",
    winTitle: "You're in!",
    winText: "The key turned, the door swung open, and the whole meeting looked up as you walked in with the forms.",
    collect: null,
    rooms: [
      {
        id: "office",
        title: "The Front Office",
        icon: "🔑",
        intro: "The meeting is happening inside, and the door is locked. The memos around the entrance lead to a spare key.",
        puzzles: [
          {
            id: "ap1_1",
            type: "numeric",
            prompt:
              "Inside the envelope is a note: two masses, 3.0 kg and 5.0 kg, hang over a frictionless pulley. Find the acceleration of the system, in m/s². (use g = 9.8 m/s²)",
            answer: 2.45,
            hint: "The heavier side wins, but only by the gap between the two, and that leftover pull has to drag both masses along together.",
            contribution: "M",
            reveal: {
              text: "A second memo is tucked in the envelope. All it says is: \"1.2 m\".",
              card: { name: "radius", value: "1.2", label: "1.2 m" },
            },
          },
          {
            id: "ap1_2",
            type: "numeric",
            prompt:
              "The note describes a 0.50 kg ball on a vertical circular track of radius {{radius}} m. Find the minimum speed at the top of the loop needed to stay on the track, in m/s.",
            answer: 3.43,
            hint: "At the slowest safe speed, gravity is doing the entire job of keeping it turning. Nothing's held in reserve, and nothing's wasted either.",
            contribution: "E",
            reveal: {
              text: "Behind the note is a sticky tab that says: \"4.0 kg\".",
              card: { name: "cartMass", value: "4.0", label: "4.0 kg" },
            },
          },
          {
            id: "ap1_3",
            type: "numeric",
            prompt:
              "The clipboard shows force readings on a {{cartMass}} kg object: 20 N east and 15 N north. Find the magnitude of its acceleration, in m/s².",
            answer: 6.25,
            hint: "Two pushes at right angles don't just stack. Picture them as sides of a triangle, then spread whatever they add up to across the mass.",
            contribution: "M",
            reveal: {
              text: "The last line on the clipboard reads: \"3.0 N·m\".",
              card: { name: "torque", value: "3.0", label: "3.0 N·m" },
            },
          },
          {
            id: "ap1_4",
            type: "numeric",
            prompt:
              "A note near the lamp describes a disk (I = 0.60 kg·m²) starting from rest under a {{torque}} N·m torque. Find the time to reach 15 rad/s.",
            answer: 3,
            hint: "A steady twist builds spin at a steady rate. Figure out that rate first, then see how long it takes to reach the target speed.",
            contribution: "O",
            reveal: {
              text: "The lamp note ends with: \"8.0 m\".",
              card: { name: "gap", value: "8.0", label: "8.0 m" },
            },
          },
          {
            id: "ap1_5",
            type: "numeric",
            prompt:
              "A diagram taped to the sign shows a 3.0 kg mass at x = 0 and a 5.0 kg mass at x = {{gap}} m. Find the center of mass, measured from the 3.0 kg mass, in meters.",
            answer: 5,
            hint: "The balance point leans toward whichever mass is heavier. Weight each position by how much sits there before averaging.",
            contribution: "S",
            reveal: {
              text: "The diagram has a tiny key drawn on it. A spare key must be hiding somewhere around the entrance!",
            },
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  apc: {
    title: "Physics Explorer, Level 3",
    storyTitle: "The Lost Melody",
    intro:
      "The last part of the school concert piece has gone missing from the music room. The music " +
      "teacher locked it inside the piano, and the lid only opens if you play the right notes in " +
      "the right order. Every clue you solve gives you one note and a scrap of info another clue " +
      "needs. Work out which is which, keep track of the five notes, and play them before your ride leaves!",
    winTitle: "The melody is back!",
    winText: "The piano lid opened and the missing score slid out. The concert is saved.",
    collect: { chip: "Note" },
    rooms: [
      {
        id: "music",
        title: "The Music Room",
        icon: "🎹",
        intro: "The piano is locked. Every instrument in here is holding a clue.",
        puzzles: [
          {
            id: "apc_1",
            type: "numeric",
            prompt:
              "Near the tuning fork, a note describes a disk (I = 5.0 kg·m²) starting from rest under a torque τ(t) = (4t + 2) N·m. Find ω at t = 3 s, in rad/s.",
            answer: 4.8,
            hint: "Torque piling up over time is what builds spin. Total it up across the interval, then scale by how hard the disk resists turning.",
            contribution: "E",
            reveal: {
              text: "The fork hums out a note. A scrap of paper on the xylophone says: \"2 m/s\".",
              card: { name: "v0", value: "2", label: "2 m/s" },
            },
          },
          {
            id: "apc_2",
            type: "numeric",
            prompt:
              "Scribbled in the sheet music margin: a(t) = (6t − 4) m/s², with v(0) = {{v0}} m/s. Find v at t = 5 s, in m/s.",
            answer: 57,
            hint: "Speed is nothing more than acceleration piling up over time, starting from wherever it began.",
            contribution: "E",
            reveal: {
              text: "A note on the music stand says: \"3 s\".",
              card: { name: "time", value: "3", label: "3 s" },
            },
          },
          {
            id: "apc_3",
            type: "numeric",
            prompt:
              "The whiteboard note continues the problem: using the same a(t) = 6t − 4 with v(0) = 2 and x(0) = 0, find the position at t = {{time}} s, in meters.",
            answer: 15,
            hint: "Position piles up from speed the exact same way speed piled up from acceleration, one more round of the same trick.",
            contribution: "F",
            reveal: {
              text: "In the corner of the whiteboard: \"6 W/s²\".",
              card: { name: "gain", value: "6", label: "6 W/s²" },
            },
          },
          {
            id: "apc_4",
            type: "numeric",
            prompt:
              "Sunlight streams through the window while a note poses: P(t) = ({{gain}}t² + 4) W. Find the total energy delivered from t = 0 to t = 3 s, in Joules.",
            answer: 66,
            hint: "Energy is just power piling up over time. Total up everything delivered across the whole stretch.",
            contribution: "G",
            reveal: {
              text: "Taped to the window frame: \"2 N·m/rad\".",
              card: { name: "spring", value: "2", label: "2 N·m/rad" },
            },
          },
          {
            id: "apc_5",
            type: "numeric",
            prompt:
              "Hitting the drum takes a rotating swing; a note nearby poses: τ(θ) = (10 − {{spring}}θ) N·m. Find the work done rotating from θ = 0 to θ = 3 rad, in Joules.",
            answer: 21,
            hint: "This time the piling-up happens over angle, not time. Total the twist across the whole swing.",
            contribution: "G",
            reveal: {
              text: "The drum rings out the last note, and the piano lid clicks. Now play the five notes in order!",
            },
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  ib: {
    title: "Physics Explorer, Level 4",
    storyTitle: "Load-Out Night",
    intro:
      "Team 7419's trailer leaves for the tournament in a few minutes, and the robot is still " +
      "sitting on the lot. Each step of the load-out checklist gives you a number that another step " +
      "needs, so you'll have to work out which goes where. The trailer has a combination lock, and " +
      "the code comes from the checklist. Finish it, load the robot, put the code together, and lock " +
      "up before the trailer rolls out!",
    winTitle: "The robot is packed!",
    winText: "The lock clicked shut on 7419!, the trailer pulled out on time, and the robot is on its way to the tournament.",
    collect: { chip: "Lock character" },
    rooms: [
      {
        id: "trailer",
        title: "The Tech Lot",
        icon: "🚐",
        intro: "The trailer is packed except for the robot. Work through the load-out checklist in order.",
        puzzles: [
          {
            id: "ib1",
            type: "multipart",
            prompt:
              "You test the robot's Limelight camera under the streetlamp. Light at 7.5×10¹⁴ Hz hits its sensor and ejects electrons with kinetic energy 1.2×10⁻¹⁹ J. (h = 6.626×10⁻³⁴ J·s)",
            parts: [
              { label: "Work function (J)", type: "numeric", answer: 3.77e-19 },
              { label: "Threshold frequency (Hz)", type: "numeric", answer: 5.69e14 },
              { label: "New KE at 9.0×10¹⁴ Hz (J)", type: "numeric", answer: 2.19e-19 },
            ],
            hint: "Some of the photon's energy is spent just escaping the surface, whatever's left over shows up as motion. The threshold is the exact point where nothing's left over at all.",
            contribution: "7",
            reveal: {
              text: "The camera test passed. A sticker on the robot says: \"60 kg\".",
              card: { name: "mass", value: "60", label: "60 kg" },
            },
          },
          {
            id: "ib2",
            type: "multipart",
            prompt:
              "Next to the railing you slide out the loading ramp, tilted 15° above horizontal. You push the {{mass}} kg robot up it at a constant speed, and the friction coefficient is 0.20. (use g = 9.8 m/s². Give answers to 3 significant figures.)",
            parts: [
              { label: "Weight component along the ramp (N)", type: "numeric", answer: 152 },
              { label: "Friction force (N)", type: "numeric", answer: 114 },
              { label: "Push force needed (N)", type: "numeric", answer: 266 },
            ],
            hint: "Split the robot's weight into a piece along the ramp and a piece pressing into it. Friction only cares about the pressing piece, and the push has to beat both.",
            contribution: "4",
            reveal: {
              text: "The ramp is set. A tag on the railing says: \"12 V\".",
              card: { name: "gateV", value: "12", label: "12 V" },
            },
          },
          {
            id: "ib3",
            type: "multipart",
            prompt:
              "The trailer's lift gate runs on a 100 μF capacitor charged to {{gateV}} V through a 500 Ω resistor.",
            parts: [
              { label: "Max charge (μC)", type: "numeric", answer: 1200 },
              { label: "Energy stored (mJ)", type: "numeric", answer: 7.2 },
              { label: "Total energy supplied by the battery (mJ)", type: "numeric", answer: 14.4 },
              { label: "Heat dissipated in the resistor (mJ)", type: "numeric", answer: 7.2 },
            ],
            hint: "How much charge piles up depends on the capacitor's size and the push behind it. Only half of what the battery spends actually ends up stored. Track down where the other half goes.",
            contribution: "1",
            reveal: {
              text: "The lift gate whirs up. The dispatch sheet says: \"1200 kg\".",
              card: { name: "trailerMass", value: "1200", label: "1200 kg" },
            },
          },
          {
            id: "ib4",
            type: "multipart",
            prompt:
              "The tow van (1500 kg) backs into the empty trailer ({{trailerMass}} kg) at 0.80 m/s. They couple together and move as one, and the trailer starts at rest. (Give answers to 3 significant figures.)",
            parts: [
              { label: "Speed after coupling (m/s)", type: "numeric", answer: 0.444 },
              { label: "Kinetic energy lost (J)", type: "numeric", answer: 213 },
              { label: "Impulse on the trailer (N·s)", type: "numeric", answer: 533 },
            ],
            hint: "Nothing outside pushes on the pair while they couple, so their total motion stays the same, just shared out over more mass. Some energy always goes missing in a crash like this.",
            contribution: "9",
            reveal: {
              text: "The hitch clicks shut. The driver's note says: \"0.50 m/s\".",
              card: { name: "driveSpeed", value: "0.50", label: "0.50 m/s" },
            },
          },
          {
            id: "ib5",
            type: "multipart",
            prompt:
              "The robot ({{mass}} kg) drives up the 2.4 m ramp at a constant {{driveSpeed}} m/s. The ramp is still tilted at 15°, and the drive motors are 80% efficient. Ignore friction. (use g = 9.8 m/s². Give answers to 3 significant figures.)",
            parts: [
              { label: "Time to climb the ramp (s)", type: "numeric", answer: 4.8 },
              { label: "Mechanical power needed (W)", type: "numeric", answer: 76.1 },
              { label: "Electrical power drawn (W)", type: "numeric", answer: 95.1 },
            ],
            hint: "Time is just distance over speed. The motors only fight the part of gravity pointing down the ramp, and since they aren't perfect, they draw more power than they deliver.",
            contribution: "!",
            reveal: {
              text: "The robot rolls into the trailer. Every step on the checklist is done. Put the code together and try the trailer lock!",
            },
          },
        ],
      },
    ],
  },
};

// Equations shown as scattered notes in the room when the player turns on
// "Show equations" on the home page. Keyed by puzzle id. Repeats within a room
// are collapsed into a single note.
const EQUATIONS = {
  // Level 1
  phy1: ["p = mv"],
  phy2: ["a = v² / r"],
  phy3: ["J = FΔt"],
  phy4: ["d = v_0t + ½at²"],
  phy5: ["W = mg"],
  // Level 2
  ap1_1: ["a = (m₂ − m₁)g / (m₁ + m₂)"],
  ap1_2: ["v = √(gr)"],
  ap1_3: ["F = ma", "F = √(Fx² + Fy²)"],
  ap1_4: ["α = τ / I", "ω = αt"],
  ap1_5: ["x = (m₁x₁ + m₂x₂) / (m₁ + m₂)"],
  // Level 3
  apc_1: ["ω = (1/I) ∫τ dt"],
  apc_2: ["v = v_0 + ∫a dt"],
  apc_3: ["x = x_0 + ∫v dt"],
  apc_4: ["E = ∫P dt"],
  apc_5: ["W = ∫τ dθ"],
  // Level 4
  ib1: ["K = hf − φ", "φ = hf_0"],
  ib2: ["F = mg sin θ", "f = μmg cos θ"],
  ib3: ["Q = CV", "E = ½CV²"],
  ib4: ["m₁v₁ = (m₁ + m₂)v", "KE = ½mv²", "J = Δp"],
  ib5: ["t = d / v", "P = Fv", "η = P_{out} / P_{in}"],
};

Object.values(LEVELS).forEach((level) => {
  level.rooms.forEach((room) => {
    room.puzzles.forEach((p) => {
      p.equations = EQUATIONS[p.id] || [];
    });
  });
});

// Auto-built per level from each puzzle's `contribution`, in order.
// Don't edit directly.
Object.values(LEVELS).forEach((level) => {
  level.finalCode = level.rooms
    .flatMap((room) => room.puzzles.map((p) => p.contribution))
    .join("");
});
