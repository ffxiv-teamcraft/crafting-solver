import { Solver } from '../src/solver';
import {
  alc70i350Stats,
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
    const simulation = new Simulation(infusionOfMindRecipe, rotation, alc70i350Stats);
    const run = simulation.run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(15);
    expect(simulation.getReliabilityReport().successPercent).toBe(100);
  });

  it('Should be able to solve lvl 75 rotation with lvl 70 stats', () => {
    const solver = new Solver(enchantedTruegoldInkRecipe, alc70i350Stats, {
      hqTarget: 50
    });
    const rotation = solver.run();
    const simulation = new Simulation(enchantedTruegoldInkRecipe, rotation, alc70i350Stats);
    const run = simulation.run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(40);
    expect(simulation.getReliabilityReport().successPercent).toBe(100);
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
    const simulation = new Simulation(infusionOfMindRecipe, rotation, alc70i350Stats);
    const run = simulation.run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(80);
    expect(simulation.getReliabilityReport().successPercent).toBe(100);
  });

  it('Should be able to solve lvl 78 40 dur rotation with lvl 80 stats', () => {
    const solver = new Solver(enchantedTruegoldInkRecipe, lvl80Stats, {
      hqTarget: 50
    });
    const rotation = solver.run();
    const simulation = new Simulation(dwarvenMythrilNugget, rotation, lvl80Stats);
    const run = simulation.run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(50);
    expect(simulation.getReliabilityReport().successPercent).toBe(100);
  });

  it('Should be able to solve lvl 80 80 dur rotation with low lvl 80 stats', () => {
    const solver = new Solver(dwarvenMythrilRing, gsm80LowStats, {
      hqTarget: 100
    });
    const rotation = solver.run();
    const simulation = new Simulation(dwarvenMythrilRing, rotation, gsm80LowStats);
    const run = simulation.run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(50);
    expect(simulation.getReliabilityReport().successPercent).toBe(100);
  });
});
