import {
  Buff,
  ByregotsBlessing,
  Craft,
  CrafterStats,
  CraftingAction,
  CraftingActionsRegistry,
  CraftingJob,
  FocusedSynthesis,
  FocusedTouch,
  GreatStrides,
  HeartOfTheCrafter,
  Ingenuity,
  IngenuityII,
  InitialPreparations,
  InnerQuiet,
  Innovation,
  MakersMark,
  MuscleMemory,
  Observe,
  ProgressAction,
  Reclaim,
  Reuse,
  Satisfaction,
  Simulation,
  TrainedHand,
  TricksOfTheTrade,
  WhistleWhileYouWork
} from '@ffxiv-teamcraft/simulator';
import { SolverConfiguration } from './solver-configuration';
import { defaultConfiguration } from './default-configuration';
import { Class } from '@kaiu/serializer';

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
    this.reset();
  }

  private reset() {
    this.population = [];
    for (let i = 0; i < this.config.populationSize; i++) {
      this.population.push(this.generateRotation());
    }
  }

  /**
   * Finds the best rotation based on recipe and stats given.
   */
  public run(): CraftingAction[] {
    let best = this.getSortedPopulation()[0];
    let bestRun = new Simulation(this.recipe, best, this.stats).run(true);
    let hqTarget = this.config.hqTarget;
    let iteration = 0;
    while (bestRun.hqPercent < hqTarget || !bestRun.success) {
      this.newIteration();
      best = this.getSortedPopulation()[0];
      bestRun = new Simulation(this.recipe, best, this.stats).run(true);
      iteration++;
      if (iteration % 100 === 0) {
        hqTarget -= 10;
      }
      if (iteration === 300) {
        break;
      }
    }

    console.log(
      `Found a solution ! Score: ${this.evaluate(best)}, HQ%: ${bestRun.hqPercent}, success: ${
        bestRun.success
      }, iterations: ${iteration}`
    );
    // Remove skipped actions and return the rotation
    return best.filter((action, index) => {
      return !bestRun.steps[index].skipped;
    });
  }

  public evaluate(rotation: CraftingAction[]): number {
    const simulation = new Simulation(this.recipe, rotation, this.stats);
    const simulationResult = simulation.run(true);
    // Compute base score
    let score = Math.floor(
      (simulationResult.simulation.progression / this.recipe.progress) * simulationResult.hqPercent
    );
    // Apply bonuses
    if (rotation.some(a => a.is(ByregotsBlessing))) {
      score *= 1.1;
    }
    if (rotation.some(a => a.is(InnerQuiet))) {
      score *= 1.1;
    }
    // For each action used with success rate < 70%, reduce score
    score -= 2 * rotation.filter(a => a.getSuccessRate(simulation) < 70).length;
    return Math.floor(score);
  }

  private getSortedPopulation(): CraftingAction[][] {
    return this.population
      .map(rotation => {
        return {
          rotation: rotation,
          score: this.evaluate(rotation)
        };
      })
      .sort((a, b) => b.score - a.score)
      .map(s => s.rotation);
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
    const affectedIndex = Math.floor(Math.random() * clone.length);
    switch (roll) {
      case 0: // Add an action
        clone.splice(affectedIndex, 0, this.randomAction(rotation, affectedIndex));
        break;
      case 1: // Change an action for another one
        clone.splice(affectedIndex, 1, this.randomAction(rotation, affectedIndex));
        break;
      case 2: // Remove an action
        clone.splice(affectedIndex, 1);
        break;
      case 3: // Move an action from an index to another
        const action = clone.splice(affectedIndex, 1)[0];
        clone.splice(Math.floor(Math.random() * clone.length), 0, action);
        break;
    }
    return clone;
  }

  private randomAction(
    currentRotation: CraftingAction[],
    index = currentRotation.length - 1
  ): CraftingAction {
    const run = new Simulation(this.recipe, currentRotation, this.stats).run();
    let availableActions = this.availableActions;
    const excludedActions: Class<CraftingAction>[] = [
      Reclaim,
      Reuse,
      TrainedHand,
      Satisfaction,
      TricksOfTheTrade,
      WhistleWhileYouWork,
      HeartOfTheCrafter
    ];
    // If it's not first step, remove first step actions
    if (index > 0 || currentRotation.length > 0) {
      excludedActions.push(MuscleMemory, InitialPreparations, MakersMark);
    }
    // If we already used IQ, don't put it inside rotation again
    if (currentRotation.some(a => a.is(InnerQuiet))) {
      excludedActions.push(InnerQuiet);
    }
    // If previous action was observe, prefer the combo actions
    if (index > 0 && currentRotation[index - 1].is(Observe)) {
      availableActions = [new FocusedSynthesis(), new FocusedTouch()];
    }
    // If there's no IQ at turn > 2, add it !
    if (index > 1 && !currentRotation.some(a => a.is(InnerQuiet))) {
      availableActions = [new InnerQuiet()];
    }
    // Under innovation or GS? Prefer quality actions
    if (
      (index > 0 && run.simulation.getBuff(Buff.INNOVATION)) ||
      run.simulation.getBuff(Buff.GREAT_STRIDES)
    ) {
      excludedActions.push(ProgressAction);
    }
    // 11 stacks of IQ? You should consider blessing.
    if (
      run.simulation.getBuff(Buff.INNER_QUIET) &&
      run.simulation.getBuff(Buff.INNER_QUIET).stacks === 11
    ) {
      availableActions = [
        new GreatStrides(),
        new Innovation(),
        new Ingenuity(),
        new IngenuityII(),
        new ByregotsBlessing()
      ];
    }

    // Remove all the excluded actions
    availableActions = availableActions.filter(a => {
      return !excludedActions.some(skippedAction => a.is(skippedAction));
    });
    return availableActions[Math.floor(Math.random() * availableActions.length)];
  }

  private generateRotation(): CraftingAction[] {
    const rotation: CraftingAction[] = [];
    let simulation = new Simulation(this.recipe, rotation, this.stats);
    // While the craft isn't finished, add a random action
    do {
      rotation.push(this.randomAction(rotation));
      simulation.reset();
      simulation.run(false);
    } while (simulation.success === undefined);
    return rotation;
  }
}
