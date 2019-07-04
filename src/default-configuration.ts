import { SolverConfiguration } from './solver-configuration';

export const defaultConfiguration: SolverConfiguration = {
  populationSize: 200,
  iterations: 300,
  progressAccuracy: 10,
  safe: true,
  weights: {
    finished: 10,
    progress: 8,
    hq: 50,
    length: 5
  }
};
