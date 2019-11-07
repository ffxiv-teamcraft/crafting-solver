import { Solver } from '../src/solver';
import {
  alc70i350Stats,
  ALC_1770_1520_564_STATS,
  dwarvenMythrilNugget,
  dwarvenMythrilRing,
  enchantedTruegoldInkRecipe,
  gsm80LowStats,
  infusionOfMindRecipe,
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
    expect(run.hqPercent).toBeGreaterThanOrEqual(50);
  });

  it('Should be able to solve lvl 80 80 dur rotation with low lvl 80 stats', () => {
    const solver = new Solver(dwarvenMythrilRing, gsm80LowStats, {
      hqTarget: 100
    });
    const rotation = solver.run();
    const run = new Simulation(dwarvenMythrilRing, rotation, gsm80LowStats).run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(50);
  });
});
