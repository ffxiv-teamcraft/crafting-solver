import { Solver } from '../src/solver';
import { Simulation } from '@ffxiv-teamcraft/simulator';
import { generateStarRecipe, generateStats } from './mock';

describe('Solver tests', () => {
  it('Should be able to solve lvl 90 rotation', () => {
    const recipe = generateStarRecipe(560, 1000, 5200, 130, 115, 90, 80);
    const stats = generateStats(90, 2659, 2803, 548);
    const solver = new Solver(recipe, stats);
    const rotation = solver.run();
    const simulation = new Simulation(recipe, rotation, stats);
    const run = simulation.run(true);
    expect(run.hqPercent).toBeGreaterThanOrEqual(15);
    expect(simulation.getReliabilityReport().successPercent).toBe(100);
  });
});
