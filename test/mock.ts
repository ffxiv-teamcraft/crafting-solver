import { Craft, CrafterStats } from '@ffxiv-teamcraft/simulator';

export const infusionOfMindRecipe: Craft = {
  id: '3595',
  job: 14,
  rlvl: 288,
  durability: 80,
  quality: 12913,
  progress: 2854,
  lvl: 69,
  suggestedCraftsmanship: 1075,
  suggestedControl: 1050,
  yield: 3,
  hq: 1,
  quickSynth: 1,
  ingredients: [
    {
      id: 19872,
      amount: 1,
      quality: 1244
    },
    {
      id: 19907,
      amount: 1,
      quality: 1313
    },
    {
      id: 19915,
      amount: 2,
      quality: 1313
    },
    {
      id: 20013,
      amount: 1,
      quality: 1272
    },
    {
      id: 19,
      amount: 2
    },
    {
      id: 18,
      amount: 1
    }
  ]
};

export const enchantedTruegoldInkRecipe: Craft = {
  id: '3856',
  job: 14,
  rlvl: 390,
  durability: 40,
  quality: 14071,
  progress: 1574,
  lvl: 71,
  suggestedCraftsmanship: 1320,
  suggestedControl: 1220,
  hq: 1,
  quickSynth: 1,
  ingredients: [
    {
      id: 27696,
      amount: 3,
      quality: 2245.37231
    },
    {
      id: 27764,
      amount: 1,
      quality: 2245.37231
    },
    {
      id: 19872,
      amount: 1,
      quality: 1571.76062
    },
    {
      id: 13,
      amount: 6
    }
  ]
};

export const dwarvenMythrilNugget: Craft = {
  id: '3831',
  job: 11,
  rlvl: 415,
  durability: 40,
  quality: 17956,
  progress: 1822,
  lvl: 78,
  suggestedCraftsmanship: 1662,
  suggestedControl: 1541,
  hq: 1,
  quickSynth: 1,
  ingredients: [
    {
      id: 27702,
      amount: 4,
      quality: 3150.0874
    },
    {
      id: 12531,
      amount: 1,
      quality: 866.6508
    },
    {
      id: 10,
      amount: 7
    }
  ]
};

export const dwarvenMythrilRing: Craft = {
  id: '4461',
  job: 11,
  rlvl: 430,
  durability: 80,
  quality: 20287,
  progress: 3943,
  lvl: 80,
  suggestedCraftsmanship: 1866,
  suggestedControl: 1733,
  hq: 1,
  quickSynth: 1,
  ingredients: [
    {
      id: 27715,
      amount: 1,
      quality: 5154.554
    },
    {
      id: 27757,
      amount: 1,
      quality: 5154.554
    },
    {
      id: 27749,
      amount: 1,
      quality: 4906.142
    },
    {
      id: 10,
      amount: 7
    },
    {
      id: 8,
      amount: 7
    }
  ]
};

export const lvl71Recipe: Craft = {
  id: '3812',
  job: 8,
  rlvl: 390,
  durability: 80,
  quality: 14071,
  progress: 3149,
  lvl: 71,
  suggestedCraftsmanship: 1320,
  suggestedControl: 1220,
  hq: 1,
  quickSynth: 1,
  ingredients: [
    {
      id: 27683,
      amount: 4,
      quality: 2638.3125
    },
    {
      id: 10,
      amount: 6
    }
  ]
};

export const alc70i350Stats: CrafterStats = new CrafterStats(14, 1467, 1468, 474, true, 70, [
  70,
  70,
  70,
  70,
  70,
  70,
  70,
  70
]);

export const ALC_1770_1520_564_STATS: CrafterStats = new CrafterStats(
  14,
  1770,
  1520,
  564,
  true,
  70,
  [70, 70, 70, 70, 70, 70, 70, 70]
);

export const gsm80LowStats: CrafterStats = new CrafterStats(11, 1751, 1501, 493, false, 80, [
  80,
  80,
  80,
  80,
  80,
  80,
  80,
  80
]);

export const lvl80Stats: CrafterStats = new CrafterStats(14, 2218, 2275, 541, true, 80, [
  80,
  80,
  80,
  80,
  80,
  80,
  80,
  80
]);
