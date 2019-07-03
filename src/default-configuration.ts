import { SolverConfiguration } from './solver-configuration';

export const defaultConfiguration: SolverConfiguration = {
  populationSize: 200,
  iterations: 300,
  progressAccuracy: 5,
  safe: false,
  weights: {
    finished: 10,
    progress: 5,
    hq: 50,
    length: 10
  }
};
