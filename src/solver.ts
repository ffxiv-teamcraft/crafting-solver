import {
  Craft,
  CrafterStats,
  CraftingAction,
  CraftingActionsRegistry,
  CraftingJob,
  Simulation
} from '@ffxiv-teamcraft/simulator';
import { SolverConfiguration } from './solver-configuration';
import { defaultConfiguration } from './default-configuration';

export class Solver {
  /**
   * How many % of the pool on the top should we consider as absolute best rotations.
   */
  private static ROXXORS_PERCENTAGE = 10;

  /**
   * All the available actions for this crafter.
   */
  private readonly availableActions: CraftingAction[] = [];

  /**
   * Our population for the GA part of the algorithm.
   */
  private population: CraftingAction[][] = [];

  /**
   * The configuration for our solver.
   */
  private config: SolverConfiguration;

  constructor(
    private recipe: Craft,
    private stats: CrafterStats,
    config: Partial<SolverConfiguration> = {}
  ) {
    this.config = { ...defaultConfiguration, ...config };
    if (this.config.populationSize % 2 === 1) {
      throw new Error('Population Size must be an even number');
    }
    this.availableActions = CraftingActionsRegistry.ALL_ACTIONS.map(
      (a: any) => a.action as CraftingAction
    ).filter(action => {
      const levelRequirement = action.getLevelRequirement();
      if (
        levelRequirement.job !== CraftingJob.ANY &&
        this.stats.levels[levelRequirement.job] !== undefined
      ) {
        return this.stats.levels[levelRequirement.job] >= levelRequirement.level;
      }
      return this.stats.level >= levelRequirement.level;
    });
    for (let i = 0; i < this.config.populationSize; i++) {
      this.population.push(this.generateRotation());
    }
  }

  /**
   * Finds the best rotation based on recipe and stats given.
   */
  public run(): CraftingAction[] {
    for (let i = 0; i < this.config.iterations; i++) {
      this.newIteration();
    }
    // Remove all the non-roxxors for better perfs on reliability report
    this.population.splice(
      0,
      Math.floor((this.config.populationSize * Solver.ROXXORS_PERCENTAGE) / 100)
    );
    // Once all iterations are done, get the best one, based on reliability too.
    const winner = this.getSortedPopulation(true)[0];
    const winnerRun = new Simulation(this.recipe, winner, this.stats).run();
    // Remove skipped actions and return the rotation
    return winner.filter((action, index) => {
      return !winnerRun.steps[index].skipped;
    });
  }

  public evaluate(rotation: CraftingAction[], withReliability = false): number {
    const simulation = new Simulation(this.recipe, rotation, this.stats);
    const simulationResult = simulation.run(false, Infinity, this.config.safe);
    let score = 0;
    // Add points if simulation ended properly.
    if (
      simulationResult.success &&
      simulationResult.simulation.progression - this.config.progressAccuracy >= this.recipe.progress
    ) {
      score += 100 * this.config.weights.finished;
    } else {
      score +=
        (simulationResult.simulation.progression / this.recipe.progress) *
        100 *
        this.config.weights.progress;
    }
    score += simulationResult.hqPercent * this.config.weights.hq;
    score -= rotation.length * this.config.weights.length;
    if (withReliability) {
      const report = simulation.getReliabilityReport();
      score *= report.successPercent / 100;
    }
    return score;
  }

  private getSortedPopulation(withReliability = false): CraftingAction[][] {
    return this.population
      .map(rotation => {
        return {
          rotation: rotation,
          score: this.evaluate(rotation, withReliability)
        };
      })
      .sort((a, b) => b.score - a.score)
      .map(row => row.rotation);
  }

  private newIteration(): void {
    const sorted = this.getSortedPopulation();

    // Remove bottom half, cya loosers
    const winners = sorted.slice(0, sorted.length / 2);

    const roxxors = winners.splice(
      0,
      Math.floor((winners.length * Solver.ROXXORS_PERCENTAGE) / 100)
    );

    const newcommers: CraftingAction[][] = [];

    // Each roxxor produces two children
    roxxors.forEach(rotation => {
      newcommers.push(this.getMutation(rotation), this.getMutation(rotation));
    });

    // Then fill with the other ones
    for (let i = 0; i < this.config.populationSize - newcommers.length; i++) {
      newcommers.push(this.getMutation(winners[i]));
    }

    this.population = [...roxxors, ...winners, ...newcommers];
  }

  private getMutation(rotation: CraftingAction[]): CraftingAction[] {
    const roll = Math.floor(Math.random() * 3);
    const clone = [...rotation];
    switch (roll) {
      case 0: // Add an action
        clone.splice(Math.floor(Math.random() * clone.length), 0, this.randomAction());
        break;
      case 1: // Change an action for another one
        clone.splice(Math.floor(Math.random() * clone.length), 1, this.randomAction());
        break;
      case 2: // Remove an action
        clone.splice(Math.floor(Math.random() * clone.length), 1);
        break;
      case 3: // Move an action from an index to another
        const action = clone.splice(Math.floor(Math.random() * clone.length), 1)[0];
        clone.splice(Math.floor(Math.random() * clone.length), 0, action);
        break;
    }
    return clone;
  }

  private randomAction(): CraftingAction {
    return this.availableActions[Math.floor(Math.random() * this.availableActions.length)];
  }

  private generateRotation(): CraftingAction[] {
    const rotation: CraftingAction[] = [];
    let simulation = new Simulation(this.recipe, rotation, this.stats);
    // While the craft isn't finished, add a random action
    do {
      rotation.push(this.randomAction());
      simulation.run(false, Infinity, this.config.safe);
    } while (simulation.run(false, Infinity, this.config.safe) === undefined);
    return rotation;
  }
}
