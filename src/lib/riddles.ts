export interface Riddle {
  id: string;
  question: string;
  answers: string[];
}

/**
 * 12 distinct, non-overlapping riddle banks — one dedicated set per level
 * (Levels 1–12), escalating gradually from approachable classics to trickier
 * lateral-thinking and poetic riddles.
 */
export const LEVEL_RIDDLE_BANKS: Riddle[][] = [
  // Level 1: Classic warm-up riddles
  [
    {
      id: "l1-1",
      question: "I speak without a mouth and hear without ears. Wind brings me to life. What am I?",
      answers: ["echo", "an echo"],
    },
    {
      id: "l1-2",
      question: "The more of me you take, the more you leave behind. What am I?",
      answers: ["footsteps", "steps", "footstep", "step"],
    },
    {
      id: "l1-3",
      question: "What has keys but cannot open locks?",
      answers: ["piano", "keyboard", "a piano", "a keyboard"],
    },
    {
      id: "l1-4",
      question: "What gets wetter the more it dries?",
      answers: ["towel", "a towel"],
    },
    {
      id: "l1-5",
      question: "What has hands but cannot clap?",
      answers: ["clock", "a clock", "watch", "a watch"],
    },
    {
      id: "l1-6",
      question: "I am tall when I am young and short when I am old. What am I?",
      answers: ["candle", "a candle"],
    },
    {
      id: "l1-7",
      question: "What has a head and a tail but no body?",
      answers: ["coin", "a coin"],
    },
    {
      id: "l1-8",
      question: "I follow you all day but vanish at night. What am I?",
      answers: ["shadow", "a shadow", "your shadow"],
    },
  ],

  // Level 2: Everyday objects & clever turns
  [
    {
      id: "l2-1",
      question: "I have cities but no houses, mountains but no trees, and water but no fish. What am I?",
      answers: ["map", "a map"],
    },
    {
      id: "l2-2",
      question: "What can travel around the world while staying in one corner?",
      answers: ["stamp", "a stamp", "postage stamp"],
    },
    {
      id: "l2-3",
      question: "What building has the most stories?",
      answers: ["library", "a library"],
    },
    {
      id: "l2-4",
      question: "The more you have of me, the less you see. What am I?",
      answers: ["darkness", "dark", "the dark"],
    },
    {
      id: "l2-5",
      question: "What can you catch but never throw?",
      answers: ["cold", "a cold", "breath"],
    },
    {
      id: "l2-6",
      question: "What has to be broken before you can use it?",
      answers: ["egg", "an egg"],
    },
    {
      id: "l2-7",
      question: "What has a neck without a head and two sleeves without arms?",
      answers: ["shirt", "a shirt"],
    },
    {
      id: "l2-8",
      question: "I have teeth that never bite and I help you start the morning neat. What am I?",
      answers: ["comb", "a comb"],
    },
  ],

  // Level 3: Wordplay & household puzzles
  [
    {
      id: "l3-1",
      question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
      answers: ["m", "letter m", "the letter m"],
    },
    {
      id: "l3-2",
      question: "What is full of holes yet still holds water?",
      answers: ["sponge", "a sponge"],
    },
    {
      id: "l3-3",
      question: "What goes up and never comes down?",
      answers: ["age", "your age"],
    },
    {
      id: "l3-4",
      question: "What has one eye but cannot see?",
      answers: ["needle", "a needle", "hurricane", "storm"],
    },
    {
      id: "l3-5",
      question: "What runs around the whole yard without moving an inch?",
      answers: ["fence", "a fence"],
    },
    {
      id: "l3-6",
      question: "I shave every day, yet my beard stays the same. Who am I?",
      answers: ["barber", "a barber"],
    },
    {
      id: "l3-7",
      question: "What belongs to you, yet everyone else uses it far more than you do?",
      answers: ["name", "your name"],
    },
    {
      id: "l3-8",
      question: "I have legs that never walk and a back that never bends. What am I?",
      answers: ["chair", "a chair"],
    },
  ],

  // Level 4: Nature & elements
  [
    {
      id: "l4-1",
      question: "I have a bed that I never sleep in and a mouth that never speaks. What am I?",
      answers: ["river", "a river", "stream"],
    },
    {
      id: "l4-2",
      question: "Feed me and I live; give me a drink and I die. What am I?",
      answers: ["fire", "flame", "a flame"],
    },
    {
      id: "l4-3",
      question: "I fly without wings and cry without eyes. Wherever I go, darkness follows. What am I?",
      answers: ["cloud", "a cloud", "clouds"],
    },
    {
      id: "l4-4",
      question: "I touch the earth and I touch the sky, yet if I touch you I may strike you down. What am I?",
      answers: ["lightning", "thunderbolt"],
    },
    {
      id: "l4-5",
      question: "Voiceless it cries, wingless flutters, toothless bites, mouthless mutters. What is it?",
      answers: ["wind", "the wind"],
    },
    {
      id: "l4-6",
      question: "What falls from the sky without ever getting hurt?",
      answers: ["rain", "snow", "raindrops"],
    },
    {
      id: "l4-7",
      question: "What roots nobody sees, grows taller than trees, and never stops reaching?",
      answers: ["mountain", "a mountain", "mountains"],
    },
    {
      id: "l4-8",
      question: "I arrive silently in winter, melt when warmth arrives, and no two of my crystals match. What am I?",
      answers: ["snowflake", "a snowflake", "snow"],
    },
  ],

  // Level 5: Paradoxes & tools
  [
    {
      id: "l5-1",
      question: "The person who makes it sells it. The person who buys it never uses it. The person who uses it never knows it. What is it?",
      answers: ["coffin", "a coffin", "casket"],
    },
    {
      id: "l5-2",
      question: "I have no voice, yet I tell you the exact speed of time with a steady swing. What am I?",
      answers: ["pendulum", "a pendulum", "metronome"],
    },
    {
      id: "l5-3",
      question: "What disappears the moment you say its name?",
      answers: ["silence"],
    },
    {
      id: "l5-4",
      question: "What can fill an entire room without taking up any space?",
      answers: ["light", "sunlight", "darkness"],
    },
    {
      id: "l5-5",
      question: "The more you take away from me, the bigger I grow. What am I?",
      answers: ["hole", "a hole"],
    },
    {
      id: "l5-6",
      question: "I have a ring with no finger and speak when struck. What am I?",
      answers: ["bell", "a bell", "telephone", "phone"],
    },
    {
      id: "l5-7",
      question: "I go all around the house on a single foot and leave a clean trail behind. What am I?",
      answers: ["broom", "a broom", "mop"],
    },
    {
      id: "l5-8",
      question: "You walk into a dark cabin with one match, an oil lamp, a candle, and a fireplace. What do you light first?",
      answers: ["match", "the match", "a match"],
    },
  ],

  // Level 6: Language & letterplay
  [
    {
      id: "l6-1",
      question: "What 5-letter word becomes shorter when you add two letters to it?",
      answers: ["short"],
    },
    {
      id: "l6-2",
      question: "What begins with T, ends with T, and has T inside it?",
      answers: ["teapot", "a teapot"],
    },
    {
      id: "l6-3",
      question: "What word is always spelled incorrectly in every dictionary?",
      answers: ["incorrectly"],
    },
    {
      id: "l6-4",
      question: "I have 13 hearts, yet no other organs at all. What am I?",
      answers: ["deck of cards", "cards", "a deck of cards", "playing cards"],
    },
    {
      id: "l6-5",
      question: "What word contains 26 letters yet only has three syllables?",
      answers: ["alphabet", "the alphabet"],
    },
    {
      id: "l6-6",
      question: "Forward I am heavy, backward I am not. What am I?",
      answers: ["ton", "a ton"],
    },
    {
      id: "l6-7",
      question: "What begins with an E, ends with an E, and usually contains only one letter?",
      answers: ["envelope", "an envelope"],
    },
    {
      id: "l6-8",
      question: "Which English word sounds the exact same even if you remove its last four letters?",
      answers: ["queue"],
    },
  ],

  // Level 7: Time, calendars & perception
  [
    {
      id: "l7-1",
      question: "This thing all things devours: birds, beasts, trees, flowers; gnaws iron, bites steel. What is it?",
      answers: ["time"],
    },
    {
      id: "l7-2",
      question: "I am always ahead of you, yet you can never see me coming. What am I?",
      answers: ["future", "the future", "tomorrow"],
    },
    {
      id: "l7-3",
      question: "What month of the year has 28 days?",
      answers: ["all", "all of them", "every month", "february"],
    },
    {
      id: "l7-4",
      question: "What appears twice in a week, once in a year, and never in a day?",
      answers: ["e", "letter e", "the letter e"],
    },
    {
      id: "l7-5",
      question: "What breaks yet never falls, and what falls yet never breaks?",
      answers: ["day and night", "dawn and dusk", "day", "night"],
    },
    {
      id: "l7-6",
      question: "I never was, am always to be; no one ever saw me, nor ever will. What am I?",
      answers: ["tomorrow"],
    },
    {
      id: "l7-7",
      question: "What can you hold in your right hand, yet never in your left hand?",
      answers: ["left elbow", "your left elbow", "left hand", "your left hand"],
    },
    {
      id: "l7-8",
      question: "I turn once, what is out will not get in; I turn again, what is in will not get out. What am I?",
      answers: ["key", "a key"],
    },
  ],

  // Level 8: Mirrors, reflections & craft
  [
    {
      id: "l8-1",
      question: "If you look at me I look right back, yet I have no eyes of my own. What am I?",
      answers: ["mirror", "a mirror", "reflection"],
    },
    {
      id: "l8-2",
      question: "I have a spine and many leaves, yet I am neither animal nor plant. What am I?",
      answers: ["book", "a book"],
    },
    {
      id: "l8-3",
      question: "I wear a cap without a head and leave my mark wherever I am led. What am I?",
      answers: ["pen", "a pen", "marker"],
    },
    {
      id: "l8-4",
      question: "I have four wings that turn in the breeze, yet I never leave the ground. What am I?",
      answers: ["windmill", "a windmill"],
    },
    {
      id: "l8-5",
      question: "I am bought by the yard and worn by the foot. What am I?",
      answers: ["carpet", "a carpet", "rug"],
    },
    {
      id: "l8-6",
      question: "I have a golden head and a golden tail, yet I have no body at all. Wait—when flipped, I settle arguments. What am I?",
      answers: ["penny", "a penny", "quarter", "gold coin"],
    },
    {
      id: "l8-7",
      question: "You measure my life in hours; I serve you by expiring. Thin, I am quick; fat, I am slow; wind is my foe. What am I?",
      answers: ["wax candle", "taper", "wick", "candle"],
    },
    {
      id: "l8-8",
      question: "I have branches yet no fruit, trunk, or leaves. What am I?",
      answers: ["bank", "a bank"],
    },
  ],

  // Level 9: Deeper lateral thinking
  [
    {
      id: "l9-1",
      question: "A barrel of water weighs 60 pounds. What can you put in it to make it weigh 40 pounds?",
      answers: ["hole", "a hole", "holes"],
    },
    {
      id: "l9-2",
      question: "What has four fingers and a thumb, yet is neither flesh nor bone?",
      answers: ["glove", "a glove"],
    },
    {
      id: "l9-3",
      question: "What tastes better than it smells?",
      answers: ["tongue", "a tongue", "your tongue"],
    },
    {
      id: "l9-4",
      question: "I go through towns and over hills, yet I never move. What am I?",
      answers: ["road", "a road", "path", "highway"],
    },
    {
      id: "l9-5",
      question: "The more you mend me, the less of me remains to fix. What am I?",
      answers: ["mistake", "a mistake", "error", "tear"],
    },
    {
      id: "l9-6",
      question: "What can pass straight through glass without breaking it?",
      answers: ["sunlight", "light", "sunbeam"],
    },
    {
      id: "l9-7",
      question: "I am lighter than a feather, yet even the strongest person cannot hold me for five minutes. What am I?",
      answers: ["breath", "your breath"],
    },
    {
      id: "l9-8",
      question: "The rich want me, the poor have me, and if you eat me you will die. What am I?",
      answers: ["nothing"],
    },
  ],

  // Level 10: Celestial & labyrinthine riddles
  [
    {
      id: "l10-1",
      question: "I rise without a ladder, warm the cold, and set in painted gold. What am I?",
      answers: ["sun", "the sun"],
    },
    {
      id: "l10-2",
      question: "I wax and wane without losing weight, guiding tides across the night. What am I?",
      answers: ["moon", "the moon"],
    },
    {
      id: "l10-3",
      question: "I always point to the north though I have no eyes to see the stars. What am I?",
      answers: ["compass", "a compass"],
    },
    {
      id: "l10-4",
      question: "I hold grains that measure time as they slip through a narrow waist. What am I?",
      answers: ["hourglass", "an hourglass", "sandglass"],
    },
    {
      id: "l10-5",
      question: "I guard every door yet turn only when invited by teeth of brass. What am I?",
      answers: ["lock", "a lock", "padlock"],
    },
    {
      id: "l10-6",
      question: "I weave a silver trap in corners without thread or loom. Who am I?",
      answers: ["spider", "a spider"],
    },
    {
      id: "l10-7",
      question: "My home is a shell I carry on my back, and I leave a silver ribbon wherever I travel. What am I?",
      answers: ["snail", "a snail"],
    },
    {
      id: "l10-8",
      question: "I bridge two banks without touching the water below. What am I?",
      answers: ["bridge", "a bridge"],
    },
  ],

  // Level 11: Logic & observation
  [
    {
      id: "l11-1",
      question: "What travels faster: heat or cold?",
      answers: ["heat"],
    },
    {
      id: "l11-2",
      question: "You see a boat filled with people, yet there is not a single person on board. How is that possible?",
      answers: ["married", "they are married", "all married"],
    },
    {
      id: "l11-3",
      question: "What has a bottom at the top?",
      answers: ["legs", "your legs", "trousers", "pants"],
    },
    {
      id: "l11-4",
      question: "I have no voice, yet I tell you secrets of centuries past in black and white. What am I?",
      answers: ["newspaper", "scroll", "book", "letter"],
    },
    {
      id: "l11-5",
      question: "What loses its head in the morning and gets it back at night?",
      answers: ["pillow", "a pillow"],
    },
    {
      id: "l11-6",
      question: "What can you keep only after you give it to someone else?",
      answers: ["word", "your word", "promise", "a promise"],
    },
    {
      id: "l11-7",
      question: "I can be cracked, made, told, and played. What am I?",
      answers: ["joke", "a joke"],
    },
    {
      id: "l11-8",
      question: "What has ears all around yet cannot hear a sound?",
      answers: ["corn", "cornfield", "cornstalk", "maize"],
    },
  ],

  // Level 12: Master labyrinth riddles
  [
    {
      id: "l12-1",
      question: "Alive without breath, as cold as death; never thirsty, ever drinking; all in mail, never clinking. What am I?",
      answers: ["fish", "a fish"],
    },
    {
      id: "l12-2",
      question: "I am forged in fire, beaten with iron, and turned into a blade or a shield. What am I?",
      answers: ["steel", "sword", "iron", "metal"],
    },
    {
      id: "l12-3",
      question: "I have a tongue that never tastes and soles that never feel. What am I?",
      answers: ["shoe", "a shoe", "boot", "a boot"],
    },
    {
      id: "l12-4",
      question: "Thirty white horses on a red hill: first they champ, then they stamp, then they stand still. What are they?",
      answers: ["teeth", "your teeth"],
    },
    {
      id: "l12-5",
      question: "It cannot be seen, cannot be felt, cannot be heard, cannot be smelt; it lies behind stars and under hills and fills empty holes. What is it?",
      answers: ["dark", "darkness", "the dark"],
    },
    {
      id: "l12-6",
      question: "The sharper I am, the clearer your sight, yet I am made of sand and heat. What am I?",
      answers: ["lens", "a lens", "glasses", "spectacles"],
    },
    {
      id: "l12-7",
      question: "I have no wings, yet I soar with ink and paper across oceans of thought. What am I?",
      answers: ["letter", "a letter", "poem", "story"],
    },
    {
      id: "l12-8",
      question: "You leave me behind when you make a choice, yet I am the only guide out of a maze. What am I?",
      answers: ["clue", "thread", "trail", "bread crumb", "breadcrumb"],
    },
  ],
];

export const ALL_RIDDLES: Riddle[] = LEVEL_RIDDLE_BANKS.flat();

export function createRng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const r = createRng(seed);
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/**
 * Picks `count` riddles for `levelIndex` (0-based).
 * - Levels 1..12 draw exclusively from their dedicated level bank so each level
 *   has completely different riddles.
 * - Endless levels 13+ rotate through banks while excluding any riddle IDs
 *   already encountered in earlier levels of the current run.
 */
export function selectRiddlesForLevel(
  levelIndex: number,
  count: number,
  seed: number,
  usedRiddleIds?: Set<string>
): Riddle[] {
  const bankIdx = levelIndex % LEVEL_RIDDLE_BANKS.length;
  const primaryPool = shuffleWithSeed(LEVEL_RIDDLE_BANKS[bankIdx], seed);

  const chosen: Riddle[] = [];
  const chosenIds = new Set<string>();

  const tryAdd = (riddle: Riddle) => {
    if (chosen.length >= count) return;
    if (chosenIds.has(riddle.id)) return;
    if (usedRiddleIds && usedRiddleIds.has(riddle.id)) return;
    chosen.push(riddle);
    chosenIds.add(riddle.id);
  };

  for (const r of primaryPool) {
    tryAdd(r);
  }

  // If endless play exhausted this level's tier, draw unused riddles from the rest of the bank
  if (chosen.length < count) {
    const fallbackPool = shuffleWithSeed(ALL_RIDDLES, seed ^ 0x9e3779b9);
    for (const r of fallbackPool) {
      tryAdd(r);
    }
  }

  // Only if all 96 unique riddles were already cleared in one marathon run, allow fresh pulls from this tier
  if (chosen.length < count) {
    for (const r of primaryPool) {
      if (chosen.length >= count) break;
      if (!chosenIds.has(r.id)) {
        chosen.push(r);
        chosenIds.add(r.id);
      }
    }
  }

  if (usedRiddleIds) {
    for (const r of chosen) {
      usedRiddleIds.add(r.id);
    }
  }

  return chosen;
}

export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isAnswerCorrect(riddle: Riddle, rawInput: string): boolean {
  const v = normalizeAnswer(rawInput);
  if (!v) return false;
  const vStripped = v.replace(/^(a|an|the) /, "");

  return riddle.answers.some((ans) => {
    const n = normalizeAnswer(ans);
    return n === v || n.replace(/^(a|an|the) /, "") === vStripped;
  });
}

export function getHintText(riddle: Riddle): string {
  const clean = riddle.answers[0].replace(/^(a|an|the) /i, "");
  return `Hint: ${clean.length} ${clean.length === 1 ? "letter" : "letters"}, starts with “${clean[0].toUpperCase()}”.`;
}
