export interface SolverConfiguration {
  /**
   * Amount of rotations in each iteration.
   */
  populationSize: number;

  safe: boolean;

  hqTarget: number;

  /**
   * What's the overshoot on accuracy we want.
   */
  progressAccuracy: number;
}
