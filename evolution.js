// evolution.js — the genetic algorithm: "survival of the fittest" for brains.
//
// After each generation we build the next one like this:
//   1. ELITISM:   the 5 best cars' brains are copied over untouched, so the best
//                 progress is never lost.
//   2. SELECTION: for every other slot we pick parents from the top performers,
//                 with better cars more likely to be picked (weighted by fitness).
//   3. CROSSOVER: half the time we mix two parents' weights together.
//   4. MUTATION:  we randomly nudge a few weights (how many = the mutation slider).
// Repeat for many generations and the brains slowly get better at driving.

const ELITE_COUNT = 5;

// Takes the finished cars and returns a list of brains for the next generation.
function nextGeneration(cars, populationSize, mutationRate) {
  // Best first
  const ranked = cars.slice().sort((a, b) => b.fitness - a.fitness);

  // 1. Elitism: the top few go straight through, no changes.
  const brains = ranked.slice(0, ELITE_COUNT).map((c) => c.brain.clone());

  // Only the top quarter get a chance to be parents.
  const parents = ranked.slice(0, Math.max(ELITE_COUNT, Math.floor(populationSize / 4)));
  const totalFitness = parents.reduce((sum, c) => sum + c.fitness + 0.01, 0);

  // Roulette wheel: a car with twice the fitness gets twice the slice of the wheel.
  function pickParent() {
    let r = Math.random() * totalFitness;
    for (const c of parents) {
      r -= c.fitness + 0.01;
      if (r <= 0) return c.brain;
    }
    return parents[0].brain;
  }

  while (brains.length < populationSize) {
    const mum = pickParent();
    // 3. Crossover half the time; otherwise a straight copy of one parent.
    const child = Math.random() < 0.5 ? NeuralNetwork.crossover(mum, pickParent()) : mum.clone();
    // 4. Mutation
    child.mutate(mutationRate);
    brains.push(child);
  }
  return brains;
}
