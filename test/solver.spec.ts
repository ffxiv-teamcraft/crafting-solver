import { Solver } from '../src/solver';
import { alc70i350Stats, enchantedTruegoldInkRecipe, infusionOfMindRecipe } from './mock';
import { Simulation } from '@ffxiv-teamcraft/simulator';

describe('Solver tests', () => {
  it('Should be able to solve lvl 70 rotation', () => {
    const solver = new Solver(infusionOfMindRecipe, alc70i350Stats);
    const rotation = solver.run();
    const run = new Simulation(infusionOfMindRecipe, rotation, alc70i350Stats).run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(80);
  });

  it('Should be able to solve lvl 75 rotation with lvl 70 stats', () => {
    const solver = new Solver(enchantedTruegoldInkRecipe, alc70i350Stats, {
      hqTarget: 50
    });
    const rotation = solver.run();
    const run = new Simulation(enchantedTruegoldInkRecipe, rotation, alc70i350Stats).run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(40);
  });
});
