export interface SolverConfiguration {
  /**
   * Amount of rotations in each iteration.
   */
  populationSize: number

  /**
   * Amount of times you run an iteration.
   */
  iterations: number

  /**
   * Weights for each metric to affect how it's applied to the rotation's score.
   */
  weights: {
    finished: number
    progress: number
    hq: number
    length: number
  }

  /**
   * What's the overshoot on accuracy we want.
   */
  progressAccuracy: number
}
