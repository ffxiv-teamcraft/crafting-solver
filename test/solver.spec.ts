import { Solver } from '../src/solver';
import {
  alc70i350Stats,
  dwarvenMythrilNugget,
  enchantedTruegoldInkRecipe,
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

  it('Should be able to solve lvl 78 40 dur rotation with lvl 80 stats', () => {
    const solver = new Solver(enchantedTruegoldInkRecipe, alc70i350Stats, {
      hqTarget: 15
    });
    const rotation = solver.run();
    const run = new Simulation(dwarvenMythrilNugget, rotation, lvl80Stats).run(true);
    console.log(rotation);
    expect(run.hqPercent).toBeGreaterThanOrEqual(10);
  });
});
