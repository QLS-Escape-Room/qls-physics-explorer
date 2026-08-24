/*
  GAME CONTENT
  ------------
  Edit the text between quotes to swap in your own questions.
  Do NOT rename any keys (type, prompt, answer, etc.), only change the values.

  There are four difficulty LEVELS (LEVEL_META below controls the buttons on the
  level-select screen). Each level has its own `rooms` array, right now every
  level has just one room (this month's station); more rooms get added to a
  level's `rooms` array in future months, same as before.

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

  Each puzzle has a `contribution`: a single character/short string awarded
  when solved. All contributions, across all rooms in a level, in order, spell
  out that level's final code needed to escape, computed automatically at the
  bottom, you don't need to edit it by hand.
*/

// Ranked easiest to hardest: regular Physics (single-step algebra), then
// AP Physics 1 (multi-concept algebra), then AP Physics C (calculus), then
// IB Physics (broadest topic range, every question is multi-part).
const LEVEL_META = [
  { key: "regular", label: "Level 1" },
  { key: "ap1", label: "Level 2" },
  { key: "apc", label: "Level 3" },
  { key: "ib", label: "Level 4" },
];

const LEVELS = {
  // ---------------------------------------------------------------
  regular: {
    title: "Physics Explorer, Level 1",
    intro:
      "You stayed after class to finish a project and got locked in the physics lab. " +
      "The exit door has a keypad lock. Clear this station to collect the code " +
      "and escape before your ride leaves!",
    rooms: [
      {
        id: "mechanics",
        title: "Station 1: Mechanics Bench",
        icon: "⚙️",
        intro: "Gears, carts, and a dusty ramp. Something here tracks motion.",
        puzzles: [
          {
            id: "phy1",
            type: "numeric",
            prompt:
              "The basketball has a mass of 6 kg and moves at 7 m/s right before it swishes through the net. Find its momentum, in kg·m/s.",
            answer: 42,
            hint: "Heavier and faster both count toward it. Combine them the simplest way two numbers can be combined.",
            contribution: "M",
          },
          {
            id: "phy2",
            type: "numeric",
            prompt:
              "A point on the hula hoop's rim moves at 8 m/s as it spins, with the hoop's radius 2 m. Find the centripetal acceleration, in m/s².",
            answer: 32,
            hint: "Speed counts double here. A tighter circle at the same speed pulls harder than a wider one.",
            contribution: "C",
          },
          {
            id: "phy3",
            type: "numeric",
            prompt:
              "A player collides with the padded pole, which pushes back with 20 N of force for 0.5 s while cushioning the hit. Find the impulse delivered, in N·s.",
            answer: 10,
            hint: "A push held for a stretch of time adds up to more than the push alone. How long it lasts matters as much as how hard.",
            contribution: "I",
          },
          {
            id: "phy4",
            type: "numeric",
            prompt:
              "The clipboard logs a sprint: starting at 10 m/s and accelerating at 2 m/s² for 5 s. Find the distance covered, in meters.",
            answer: 75,
            hint: "Part of the distance comes from the speed it already had; the rest comes from how much that speed kept building.",
            contribution: "V",
          },
          {
            id: "phy5",
            type: "numeric",
            prompt:
              "The framed school crest has a mass of 8 kg. Find its weight, in Newtons. (use g = 9.8 m/s²)",
            answer: 78.4,
            hint: "Everything with mass gets pulled the same way here. The pull just scales with how much there is.",
            contribution: "W",
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  ap1: {
    title: "Physics Explorer, Level 2",
    intro:
      "You stayed after class to finish some review and got locked in the school office. " +
      "The exit door has a keypad lock. Clear this station to collect the code " +
      "and escape before your ride leaves!",
    rooms: [
      {
        id: "circuits",
        title: "Station 1: Circuit Table",
        icon: "🔋",
        intro: "A breadboard, a battery, and a multimeter left mid-experiment.",
        puzzles: [
          {
            id: "ap1_1",
            type: "numeric",
            prompt:
              "Inside the envelope is a note: two masses, 3.0 kg and 5.0 kg, hang over a frictionless pulley. Find the acceleration of the system, in m/s². (use g = 9.8 m/s²)",
            answer: 2.45,
            hint: "The heavier side wins, but only by the gap between the two, and that leftover pull has to drag both masses along together.",
            contribution: "P",
          },
          {
            id: "ap1_2",
            type: "numeric",
            prompt:
              "The note describes a 0.50 kg ball on a vertical circular track of radius 1.2 m. Find the minimum speed at the top of the loop needed to stay on the track, in m/s.",
            answer: 3.43,
            hint: "At the slowest safe speed, gravity is doing the entire job of keeping it turning. Nothing's held in reserve, and nothing's wasted either.",
            contribution: "L",
          },
          {
            id: "ap1_3",
            type: "numeric",
            prompt:
              "The clipboard shows force readings on a 4.0 kg object: 20 N east and 15 N north. Find the magnitude of its acceleration, in m/s².",
            answer: 6.25,
            hint: "Two pushes at right angles don't just stack. Picture them as sides of a triangle, then spread whatever they add up to across the mass.",
            contribution: "F",
          },
          {
            id: "ap1_4",
            type: "numeric",
            prompt:
              "A note near the lamp describes a disk (I = 0.60 kg·m²) starting from rest under a 3.0 N·m torque. Find the time to reach 15 rad/s.",
            answer: 3,
            hint: "A steady twist builds spin at a steady rate. Figure out that rate first, then see how long it takes to reach the target speed.",
            contribution: "T",
          },
          {
            id: "ap1_5",
            type: "numeric",
            prompt:
              "A diagram taped to the sign shows a 3.0 kg mass at x = 0 and a 5.0 kg mass at x = 8.0 m. Find the center of mass, measured from the 3.0 kg mass, in meters.",
            answer: 5,
            hint: "The balance point leans toward whichever mass is heavier. Weight each position by how much sits there before averaging.",
            contribution: "S",
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  apc: {
    title: "Physics Explorer, Level 3",
    intro:
      "You stayed after class to finish some review and got locked in the music room. " +
      "The exit door has a keypad lock. Clear this station to collect the code " +
      "and escape before your ride leaves!",
    rooms: [
      {
        id: "waves",
        title: "Station 1: Optics & Waves Corner",
        icon: "🌊",
        intro: "A ripple tank, a prism, and a tuning fork hum quietly.",
        puzzles: [
          {
            id: "apc_1",
            type: "numeric",
            prompt:
              "Near the tuning fork, a note describes a disk (I = 5.0 kg·m²) starting from rest under a torque τ(t) = (4t + 2) N·m. Find ω at t = 3 s, in rad/s.",
            answer: 4.8,
            hint: "Torque piling up over time is what builds spin. Total it up across the interval, then scale by how hard the disk resists turning.",
            contribution: "R",
          },
          {
            id: "apc_2",
            type: "numeric",
            prompt:
              "Scribbled in the sheet music margin: a(t) = (6t − 4) m/s², with v(0) = 2 m/s. Find v at t = 5 s, in m/s.",
            answer: 57,
            hint: "Speed is nothing more than acceleration piling up over time, starting from wherever it began.",
            contribution: "O",
          },
          {
            id: "apc_3",
            type: "numeric",
            prompt:
              "The whiteboard note continues the problem: using the same a(t) = 6t − 4 with v(0) = 2 and x(0) = 0, find the position at t = 3 s, in meters.",
            answer: 15,
            hint: "Position piles up from speed the exact same way speed piled up from acceleration, one more round of the same trick.",
            contribution: "T",
          },
          {
            id: "apc_4",
            type: "numeric",
            prompt:
              "Sunlight streams through the window while a note poses: P(t) = (6t² + 4) W. Find the total energy delivered from t = 0 to t = 3 s, in Joules.",
            answer: 66,
            hint: "Energy is just power piling up over time. Total up everything delivered across the whole stretch.",
            contribution: "A",
          },
          {
            id: "apc_5",
            type: "numeric",
            prompt:
              "Hitting the drum takes a rotating swing; a note nearby poses: τ(θ) = (10 − 2θ) N·m. Find the work done rotating from θ = 0 to θ = 3 rad, in Joules.",
            answer: 21,
            hint: "This time the piling-up happens over angle, not time. Total the twist across the whole swing.",
            contribution: "T",
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  ib: {
    title: "Physics Explorer, Level 4",
    intro:
      "You stayed after a late robotics build night and got locked in the team's parking lot. " +
      "The exit door has a keypad lock. Clear this station to collect the code " +
      "and escape before your ride leaves!",
    rooms: [
      {
        id: "trailer",
        title: "Station 1: The Tech Lot",
        icon: "🚐",
        intro: "Team gear is scattered across the lot after a late build night.",
        puzzles: [
          {
            id: "ib1",
            type: "multipart",
            prompt:
              "Light from the streetlamp registers at 7.5×10¹⁴ Hz, ejecting electrons with kinetic energy 1.2×10⁻¹⁹ J. (h = 6.626×10⁻³⁴ J·s)",
            parts: [
              { label: "Work function (J)", type: "numeric", answer: 3.77e-19 },
              { label: "Threshold frequency (Hz)", type: "numeric", answer: 5.69e14 },
              { label: "New KE at 9.0×10¹⁴ Hz (J)", type: "numeric", answer: 2.19e-19 },
            ],
            hint: "Some of the photon's energy is spent just escaping the surface, whatever's left over shows up as motion. The threshold is the exact point where nothing's left over at all.",
            contribution: "I",
          },
          {
            id: "ib2",
            type: "multipart",
            prompt:
              "Taped to the railing, a diagram shows a double-slit setup: slits 0.25 mm apart, 600 nm light, a screen 2.0 m away.",
            parts: [
              { label: "First-fringe angle (degrees)", type: "numeric", answer: 0.1375 },
              { label: "Fringe position on screen (mm)", type: "numeric", answer: 4.8 },
              { label: "Fringe spacing at 450 nm (mm)", type: "numeric", answer: 3.6 },
            ],
            hint: "Where the waves line up perfectly depends on the wavelength compared to the slit spacing. The screen distance just stretches that angle out into an actual gap.",
            contribution: "B",
          },
          {
            id: "ib3",
            type: "multipart",
            prompt:
              "The trailer's onboard electronics run through a 100 μF capacitor charged to 12V through a 500 Ω resistor.",
            parts: [
              { label: "Max charge (μC)", type: "numeric", answer: 1200 },
              { label: "Energy stored (mJ)", type: "numeric", answer: 7.2 },
              { label: "Total energy supplied by the battery (mJ)", type: "numeric", answer: 14.4 },
              { label: "Heat dissipated in the resistor (mJ)", type: "numeric", answer: 7.2 },
            ],
            hint: "How much charge piles up depends on the capacitor's size and the push behind it. Only half of what the battery spends actually ends up stored. Track down where the other half goes.",
            contribution: "P",
          },
          {
            id: "ib4",
            type: "multipart",
            prompt:
              "A 400 kg car starts from rest at the top of a 30 m hill, reaching 22 m/s at the bottom over 80 m of track.",
            parts: [
              { label: "KE at the bottom (J)", type: "numeric", answer: 96800 },
              { label: "Energy lost to friction (J)", type: "numeric", answer: 20800 },
              { label: "Average friction force (N)", type: "numeric", answer: 260 },
            ],
            hint: "It started with height to spare and ended with only some of that turned into speed. Whatever's unaccounted for didn't just vanish.",
            contribution: "C",
          },
          {
            id: "ib5",
            type: "multipart",
            prompt:
              "Looking up past the trees, you imagine a satellite 500 km above Earth's surface (M = 5.97×10²⁴ kg, R = 6.37×10⁶ m, G = 6.674×10⁻¹¹).",
            parts: [
              { label: "Orbital radius (m)", type: "numeric", answer: 6.87e6 },
              { label: "Orbital speed (m/s)", type: "numeric", answer: 7616 },
              { label: "Period (s)", type: "numeric", answer: 5668 },
            ],
            hint: "What matters is distance from the center, not height above the ground. Gravity alone is doing the full job of holding the satellite on its curved path, and the trip around is just the circle's length divided by how fast it's covered.",
            contribution: "S",
          },
        ],
      },
    ],
  },
};

// Auto-built per level from each puzzle's `contribution`, in order.
// Don't edit directly.
Object.values(LEVELS).forEach((level) => {
  level.finalCode = level.rooms
    .flatMap((room) => room.puzzles.map((p) => p.contribution))
    .join("");
});
