import { Solver } from '../src/solver';
import {
  alc70i350Stats,
  ALC_1770_1520_564_STATS,
  dwarvenMythrilNugget,
  dwarvenMythrilRing,
  enchantedTruegoldInkRecipe,
  gsm80LowStats,
  infusionOfMindRecipe,
  lvl71Recipe,
  lvl80Stats
} from './mock';
import { CraftingActionsRegistry, Simulation } from '@ffxiv-teamcraft/simulator';

describe('Solver tests', () => {
  it('Should be able to solve lvl 70 rotation', () => {
    const solver = new Solver(infusionOfMindRecipe, alc70i350Stats);
    const rotation = solver.run();
    const run = new Simulation(infusionOfMindRecipe, rotation, alc70i350Stats).run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(15);
  });

  it('Should be able to solve lvl 75 rotation with lvl 70 stats', () => {
    const solver = new Solver(enchantedTruegoldInkRecipe, alc70i350Stats, {
      hqTarget: 50
    });
    const rotation = solver.run();
    const run = new Simulation(enchantedTruegoldInkRecipe, rotation, alc70i350Stats).run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(40);
  });

  it('Should give a very good score for a real user-made rotation', () => {
    const solver = new Solver(lvl71Recipe, ALC_1770_1520_564_STATS);
    const rotation = CraftingActionsRegistry.importFromCraftOpt([
      'muscleMemory',
      'comfortZone',
      'innerQuiet',
      'steadyHand2',
      'prudentTouch',
      'prudentTouch',
      'prudentTouch',
      'prudentTouch',
      'prudentTouch',
      'manipulation2',
      'ingenuity',
      'observe',
      'focusedTouch',
      'comfortZone',
      'steadyHand2',
      'prudentTouch',
      'prudentTouch',
      'pieceByPiece',
      'brandOfEarth',
      'brandOfEarth',
      'observe',
      'focusedSynthesis',
      'steadyHand',
      'ingenuity2',
      'greatStrides',
      'innovation',
      'byregotsBlessing',
      'carefulSynthesis3'
    ]);
    expect(solver.evaluate(rotation)).toBeGreaterThan(300);
  });

  it('Should be able to solve lvl 75 rotation with lvl 70 stats using a seed', () => {
    const solver = new Solver(enchantedTruegoldInkRecipe, alc70i350Stats);
    const seed = CraftingActionsRegistry.importFromCraftOpt([
      'muscleMemory',
      'comfortZone',
      'innerQuiet',
      'manipulation2',
      'steadyHand2',
      'prudentTouch',
      'prudentTouch',
      'prudentTouch',
      'prudentTouch',
      'steadyHand2',
      'prudentTouch',
      'prudentTouch',
      'prudentTouch',
      'carefulSynthesis3',
      'carefulSynthesis3'
    ]);

    const rotation = solver.run(seed);
    const run = new Simulation(infusionOfMindRecipe, rotation, alc70i350Stats).run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(80);
  });

  it('Should be able to solve lvl 78 40 dur rotation with lvl 80 stats', () => {
    const solver = new Solver(enchantedTruegoldInkRecipe, lvl80Stats, {
      hqTarget: 50
    });
    const rotation = solver.run();
    const run = new Simulation(dwarvenMythrilNugget, rotation, lvl80Stats).run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(10);
  });

  it('Should be able to solve lvl 80 80 dur rotation with low lvl 80 stats', () => {
    const solver = new Solver(dwarvenMythrilRing, gsm80LowStats, {
      hqTarget: 100
    });
    const rotation = solver.run();
    const run = new Simulation(dwarvenMythrilRing, rotation, gsm80LowStats).run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(10);
  });
});
