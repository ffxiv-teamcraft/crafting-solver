import { Craft, CrafterStats } from '@ffxiv-teamcraft/simulator'

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
}

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
}

export const alc70i350Stats: CrafterStats = new CrafterStats(14, 1467, 1468, 474, true, 70, [
  70,
  70,
  70,
  70,
  70,
  70,
  70,
  70
])
