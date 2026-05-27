# Genetic algorithm logic
import random
from dataclasses import dataclass
from typing import List, Sequence, Tuple


@dataclass
class GAConfig:
    population_size: int = 120
    generations: int = 400
    mutation_rate: float = 0.08
    tournament_size: int = 4
    elite_count: int = 2


def route_distance(route: Sequence[int], matrix: Sequence[Sequence[float]], closed: bool) -> float:
    total = 0.0
    for a, b in zip(route, route[1:]):
        total += float(matrix[a][b])
    if closed and len(route) > 1:
        total += float(matrix[route[-1]][route[0]])
    return total


def _middle_genes(n: int, closed: bool) -> List[int]:
    if closed:
        return list(range(1, n))
    return list(range(1, n - 1))


def _build_route(middle: Sequence[int], n: int, closed: bool) -> List[int]:
    if closed:
        return [0, *middle]
    return [0, *middle, n - 1]


def _random_individual(n: int, closed: bool) -> List[int]:
    genes = _middle_genes(n, closed)
    random.shuffle(genes)
    return genes


def _tournament(population: List[List[int]], scores: List[float], k: int) -> List[int]:
    contenders = random.sample(range(len(population)), k=min(k, len(population)))
    best_idx = min(contenders, key=lambda idx: scores[idx])
    return population[best_idx][:]


def _ordered_crossover(parent_a: List[int], parent_b: List[int]) -> List[int]:
    if len(parent_a) <= 1:
        return parent_a[:]
    start, end = sorted(random.sample(range(len(parent_a)), 2))
    child = [None] * len(parent_a)
    child[start:end + 1] = parent_a[start:end + 1]
    fill = [gene for gene in parent_b if gene not in child]
    fill_idx = 0
    for i, value in enumerate(child):
        if value is None:
            child[i] = fill[fill_idx]
            fill_idx += 1
    return child


def _mutate(individual: List[int], mutation_rate: float) -> None:
    if len(individual) < 2:
        return
    if random.random() < mutation_rate:
        i, j = random.sample(range(len(individual)), 2)
        individual[i], individual[j] = individual[j], individual[i]


def optimize_route(
    distance_matrix: Sequence[Sequence[float]],
    mode: str,
    config: GAConfig | None = None,
) -> Tuple[List[int], float]:
    n = len(distance_matrix)
    if n < 2 or n > 15:
        raise ValueError("The route must contain between 2 and 15 destinations.")

    closed = mode == "closed"
    if mode not in {"open", "closed"}:
        raise ValueError("mode must be 'open' or 'closed'.")

    cfg = config or GAConfig()
    population = [_random_individual(n, closed) for _ in range(cfg.population_size)]

    for _ in range(cfg.generations):
        scored = [
            route_distance(_build_route(ind, n, closed), distance_matrix, closed)
            for ind in population
        ]
        elite_indexes = sorted(range(len(population)), key=lambda idx: scored[idx])[: cfg.elite_count]
        next_population = [population[idx][:] for idx in elite_indexes]

        while len(next_population) < cfg.population_size:
            parent_a = _tournament(population, scored, cfg.tournament_size)
            parent_b = _tournament(population, scored, cfg.tournament_size)
            child = _ordered_crossover(parent_a, parent_b)
            _mutate(child, cfg.mutation_rate)
            next_population.append(child)

        population = next_population

    final_scores = [
        route_distance(_build_route(ind, n, closed), distance_matrix, closed)
        for ind in population
    ]
    best_idx = min(range(len(population)), key=lambda idx: final_scores[idx])
    best_route = _build_route(population[best_idx], n, closed)
    best_distance = final_scores[best_idx]

    if closed:
        best_route = [*best_route, best_route[0]]

    return best_route, best_distance
