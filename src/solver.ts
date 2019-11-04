import {
  Buff,
  ByregotsBlessing,
  Craft,
  CrafterStats,
  CraftingAction,
  CraftingActionsRegistry,
  CraftingJob,
  FinalAppraisal,
  FocusedSynthesis,
  FocusedTouch,
  GreatStrides,
  Ingenuity,
  InnerQuiet,
  Innovation,
  Manipulation,
  MastersMend,
  MuscleMemory,
  Observe,
  ProgressAction,
  QualityAction,
  Reflect,
  RemoveFinalAppraisal,
  Reuse,
  Simulation,
  TrainedEye,
  TricksOfTheTrade
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
    ).filter((action: CraftingAction) => {
      const levelRequirement = action.getLevelRequirement();
      if (
        levelRequirement.job !== CraftingJob.ANY &&
        this.stats.levels[levelRequirement.job] !== undefined
      ) {
        return this.stats.levels[levelRequirement.job] >= levelRequirement.level;
      }
      return this.stats.level >= levelRequirement.level;
    });
  }

  private reset(seed?: CraftingAction[]) {
    this.population = [];
    for (let i = 0; i < this.config.populationSize; i++) {
      if (seed === undefined) {
        this.population.push(this.generateRotation());
      } else {
        this.population.push(this.getMutation(seed));
      }
    }
  }

  /**
   * Finds the best rotation based on recipe and stats given.
   */
  public run(seed?: CraftingAction[]): CraftingAction[] {
    this.reset(seed);
    let best = this.getSortedPopulation()[0];
    let bestRun = new Simulation(this.recipe, best, this.stats).run(true);
    let hqTarget = this.config.hqTarget;
    let iteration = 0;
    while (
      bestRun.hqPercent < hqTarget ||
      !bestRun.success ||
      iteration < 10 ||
      this.evaluate(best) < 130
    ) {
      this.newIteration();
      best = this.getSortedPopulation()[0];
      bestRun = new Simulation(this.recipe, best, this.stats).run(true);
      iteration++;
      if (iteration % 100 === 0) {
        this.reset(best);
      }
      if (iteration === 300) {
        break;
      }
    }

    // console.log(
    //   `Found a solution ! Score: ${this.evaluate(best)}, HQ%: ${bestRun.hqPercent}, success: ${
    //     bestRun.success
    //   }, iterations: ${iteration}`
    // );
    // console.log(best);

    // Remove skipped actions and return the rotation
    return best.filter((action, index) => {
      return !bestRun.steps[index].skipped && bestRun.steps[index].success;
    });
  }

  public evaluate(rotation: CraftingAction[]): number {
    const simulation = new Simulation(this.recipe, rotation, this.stats);
    const simulationResult = simulation.run(true);
    // Compute base score
    let score = Math.floor(
      Math.min(simulationResult.simulation.progression / this.recipe.progress, 1) *
        simulationResult.hqPercent
    );
    score += simulationResult.hqPercent;
    // Apply bonuses
    const bonusActions = [
      ByregotsBlessing,
      [Ingenuity],
      [MastersMend, Manipulation],
      [GreatStrides, Innovation]
    ];
    bonusActions.forEach(entry => {
      if (entry instanceof Array) {
        if (rotation.some(a => entry.some(action => a.is(action)))) {
          score += 5;
        }
      } else {
        if (rotation.some(a => a.is(entry))) {
          score += 5;
        }
      }
    });

    // If we used all the durability, apply a bonus
    if (simulation.durability <= 0 && simulation.success) {
      score += 5;
    }

    simulation.reset();
    // Detect wrong timing on actions, to add a penalty based on them
    rotation.forEach((action, index) => {
      if (index === 0 && !(action.is(MuscleMemory) || action.is(Reflect))) {
        score -= 10;
      }

      if (action.is(MastersMend)) {
        // If we are using master's mend without anything to repair, penalty !
        if (
          rotation.slice(0, index).reduce((dur, a) => a.getDurabilityCost(simulation) + dur, 0) < 30
        ) {
          score -= 5;
        }
      }
      if (action.is(QualityAction)) {
        // If we're using a quality action with no IQ, penalty !
        if (!rotation.slice(0, index).some(a => a.is(InnerQuiet) || a.is(Reflect))) {
          score -= 10;
        }
      }
      // If we have Observe with no focused action after, penalty !
      if (action.is(Observe) && index < rotation.length - 1) {
        if (!rotation[index + 1].is(FocusedSynthesis) && !rotation[index + 1].is(FocusedTouch)) {
          score -= 20;
        }
      }
      // Same for focused actions without Observe
      if (action.is(FocusedTouch) || action.is(FocusedSynthesis)) {
        if (index === 0 || !rotation[index - 1].is(Observe)) {
          score -= 20;
        }
      }

      // If we are using Great Strides or Innovation and wasting it, penalty !
      if (
        action.is(GreatStrides) &&
        !rotation.slice(index, index + 3).some(a => a.is(QualityAction))
      ) {
        score -= 10;
      }

      // If we are using actions that have <100% success rate, penalty !
      if (action.getSuccessRate(simulation) < 100) {
        score -= 5;
      }
    });
    return score - rotation.length;
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
    const roll = Math.round(Math.random() * 3);
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
      default:
        break;
    }
    return clone;
  }

  private randomAction(
    currentRotation: CraftingAction[],
    index = currentRotation.length - 1
  ): CraftingAction {
    const isInsertingAction = index < currentRotation.length - 1;

    // Run a simulation and stop it at the given index to read buffs
    const run = new Simulation(this.recipe, currentRotation, this.stats).run(false, index);

    // Prepare an array of available actions to be filtered later on
    let availableActions = this.availableActions;

    // Exclude some useless actions
    const excludedActions: Class<CraftingAction>[] = [Reuse, TricksOfTheTrade];

    // If we don't have more than 10 levels above the recipe, remove trained actions.
    if (this.stats.level - this.recipe.lvl < 10) {
      excludedActions.push(TrainedEye);
    }

    // If it's not first step, remove first step actions
    if (
      index > 0 ||
      currentRotation.filter(a => !a.is(FinalAppraisal) && !a.is(RemoveFinalAppraisal)).length > 0
    ) {
      excludedActions.push(MuscleMemory, Reflect);
    }
    // If we already used IQ, don't put it inside rotation again
    if (currentRotation.some(a => a.is(InnerQuiet) || a.is(Reflect))) {
      excludedActions.push(InnerQuiet);
    }
    // If previous action was observe, prefer the combo actions
    if (index > 0 && currentRotation[index - 1].is(Observe)) {
      availableActions = [new FocusedSynthesis(), new FocusedTouch()];
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
        new ByregotsBlessing()
      ];
    }

    if (isInsertingAction) {
      // If we're inserting before a focused action, it needs to be Observe
      if (
        currentRotation[index + 1].is(FocusedTouch) ||
        currentRotation[index + 1].is(FocusedSynthesis)
      ) {
        availableActions = [new Observe()];
      }
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
