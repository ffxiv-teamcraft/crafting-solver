export interface SolverConfiguration {
  /**
   * Amount of rotations in each iteration.
   */
  populationSize: number;

  hqTarget: number;

  /**
   * What's the overshoot on accuracy we want.
   */
  progressAccuracy: number;
}
