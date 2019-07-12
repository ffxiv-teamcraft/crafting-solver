import {
  Buff,
  BuffAction,
  ByregotsBlessing,
  ComfortZone,
  Craft,
  CrafterStats,
  CraftingAction,
  CraftingActionsRegistry,
  CraftingJob,
  FlawlessSynthesis,
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
  Manipulation,
  ManipulationII,
  MastersMend,
  MastersMendII,
  MuscleMemory,
  Observe,
  ProgressAction,
  QualityAction,
  Reclaim,
  Reuse,
  Satisfaction,
  Simulation,
  SpecialtyAction,
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
      this.evaluate(best) < 300
    ) {
      this.newIteration();
      best = this.getSortedPopulation()[0];
      bestRun = new Simulation(this.recipe, best, this.stats).run(true);
      iteration++;
      if (iteration % 100 === 0) {
        this.reset(seed);
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

    if (this.evaluate(best) > 600) {
      console.log('roxxor !', best);
    }
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
      (simulationResult.simulation.progression / this.recipe.progress) * simulationResult.hqPercent
    );
    if (simulation.success) {
      score *= 1.2;
    }
    if (simulationResult.hqPercent >= 90) {
      score *= 1.5;
    }
    // Apply bonuses
    const bonusActions = [
      ByregotsBlessing,
      InnerQuiet,
      [Ingenuity, IngenuityII],
      [MastersMend, MastersMendII, Manipulation, ManipulationII],
      ComfortZone,
      GreatStrides,
      Innovation
    ];
    bonusActions.forEach(entry => {
      if (entry instanceof Array) {
        if (rotation.some(a => entry.some(action => a.is(action)))) {
          score *= 1.1;
        }
      } else {
        if (rotation.some(a => a.is(entry))) {
          score *= 1.1;
        }
      }
    });

    // If we used all the durability, apply a bonus
    if (simulation.durability <= 0 && simulation.success) {
      score *= 1.1;
    }

    simulation.reset();
    // Detect wrong timing on actions, to add a penalty based on them
    rotation.forEach((action, index) => {
      if (action.is(MastersMend) || action.is(MastersMendII)) {
        // If we are using master's mend without anything to repair, penalty !
        if (!rotation.slice(0, index).some(a => a.getDurabilityCost(simulation) > 0)) {
          score *= 0.8;
        }
      }
      if (action.is(QualityAction)) {
        // If we're using a quality action with no IQ, penalty !
        if (!rotation.slice(0, index).some(a => a.is(InnerQuiet))) {
          score *= 0.8;
        }
      }
      if (action.is(BuffAction) && index > 0) {
        // If we are overlapping some buffs, penalty !
        if (
          rotation.slice(0, index).some((a, i) => {
            return (
              a.is(BuffAction) &&
              (a as BuffAction).getBuff() === (action as BuffAction).getBuff() &&
              index - i <= (action as BuffAction).getDuration(simulation)
            );
          })
        ) {
          score *= 0.8;
        }
      }
      // If we have Observe with no focused action after, penalty !
      if (action.is(Observe) && index < rotation.length - 1) {
        if (!rotation[index + 1].is(FocusedSynthesis) && !rotation[index + 1].is(FocusedTouch)) {
          score *= 0.8;
        }
      }
      // Same for focused actions without Observe
      if (action.is(FocusedTouch) || action.is(FocusedSynthesis)) {
        if (index === 0 || !rotation[index - 1].is(Observe)) {
          score *= 0.8;
        }
      }

      // If we are using Great Strides or Innovation and wasting it, penalty !
      if (
        action.is(Innovation) &&
        action.is(GreatStrides) &&
        !rotation.slice(index, index + 3).some(a => a.is(QualityAction))
      ) {
        score *= 0.8;
      }
    });
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
    const excludedActions: Class<CraftingAction>[] = [
      Reclaim,
      Reuse,
      TrainedHand,
      Satisfaction,
      TricksOfTheTrade,
      WhistleWhileYouWork,
      HeartOfTheCrafter,
      FlawlessSynthesis
    ];
    if (!run.simulation.getBuff(Buff.INITIAL_PREPARATIONS)) {
      excludedActions.push(SpecialtyAction);
    }
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
