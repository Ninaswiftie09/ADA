# Genetic algorithm logic
# Implementación del Algoritmo Genético para resolver el Problema del Viajante (TSP)
import random
from dataclasses import dataclass
from typing import List, Sequence, Tuple


# Parámetros configurables del algoritmo genético
@dataclass
class GAConfig:
    population_size: int = 120   # Cuántas rutas candidatas hay en cada generación
    generations: int = 400        # Cuántas veces evoluciona la población
    mutation_rate: float = 0.08   # Probabilidad de que un individuo mute (8%)
    tournament_size: int = 4      # Cuántos individuos compiten en cada selección
    elite_count: int = 2          # Cuántos mejores pasan directos a la siguiente generación


# Calcula la distancia total de una ruta dada la matriz de distancias
def route_distance(route: Sequence[int], matrix: Sequence[Sequence[float]], closed: bool) -> float:
    total = 0.0
    # Suma las distancias entre cada par consecutivo de destinos
    for a, b in zip(route, route[1:]):
        total += float(matrix[a][b])
    # En modo closed, suma el regreso al punto de partida
    if closed and len(route) > 1:
        total += float(matrix[route[-1]][route[0]])
    return total


# Devuelve los índices de destinos que puede permutar el algoritmo (excluye inicio y fin fijos)
def _middle_genes(n: int, closed: bool) -> List[int]:
    if closed:
        return list(range(1, n))       # El 0 es fijo como inicio
    return list(range(1, n - 1))       # El 0 es inicio y el n-1 es fin, ambos fijos


# Construye la ruta completa a partir de los genes intermedios
def _build_route(middle: Sequence[int], n: int, closed: bool) -> List[int]:
    if closed:
        return [0, *middle]            # Empieza en 0, luego los intermedios
    return [0, *middle, n - 1]         # Empieza en 0, termina en el último destino


# Crea un individuo aleatorio (una ruta aleatoria)
def _random_individual(n: int, closed: bool) -> List[int]:
    genes = _middle_genes(n, closed)
    random.shuffle(genes)              # Desordena los destinos aleatoriamente
    return genes


# Selección por torneo: elige k individuos al azar y devuelve el de menor distancia
def _tournament(population: List[List[int]], scores: List[float], k: int) -> List[int]:
    contenders = random.sample(range(len(population)), k=min(k, len(population)))
    best_idx = min(contenders, key=lambda idx: scores[idx])
    return population[best_idx][:]


# Cruce ordenado (OX1): combina dos padres preservando el orden relativo de los destinos
# Garantiza que cada destino aparezca exactamente una vez en el hijo
def _ordered_crossover(parent_a: List[int], parent_b: List[int]) -> List[int]:
    if len(parent_a) <= 1:
        return parent_a[:]
    # Elige un segmento aleatorio del padre A
    start, end = sorted(random.sample(range(len(parent_a)), 2))
    child = [None] * len(parent_a)
    child[start:end + 1] = parent_a[start:end + 1]
    # Completa con los genes del padre B en el orden en que aparecen (sin repetir)
    fill = [gene for gene in parent_b if gene not in child]
    fill_idx = 0
    for i, value in enumerate(child):
        if value is None:
            child[i] = fill[fill_idx]
            fill_idx += 1
    return child


# Mutación por intercambio: con cierta probabilidad, intercambia dos destinos al azar
# Esto introduce diversidad y evita quedarse atrapado en mínimos locales
def _mutate(individual: List[int], mutation_rate: float) -> None:
    if len(individual) < 2:
        return
    if random.random() < mutation_rate:
        i, j = random.sample(range(len(individual)), 2)
        individual[i], individual[j] = individual[j], individual[i]


# Función principal: ejecuta el algoritmo genético y devuelve la mejor ruta encontrada
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

    # Inicializa la población con rutas aleatorias
    population = [_random_individual(n, closed) for _ in range(cfg.population_size)]

    # Bucle principal: evoluciona la población por N generaciones
    for _ in range(cfg.generations):
        # Evalúa la distancia total de cada individuo en la generación actual
        scored = [
            route_distance(_build_route(ind, n, closed), distance_matrix, closed)
            for ind in population
        ]

        # Elitismo: los mejores individuos pasan directos a la siguiente generación
        elite_indexes = sorted(range(len(population)), key=lambda idx: scored[idx])[: cfg.elite_count]
        next_population = [population[idx][:] for idx in elite_indexes]

        # Llena el resto de la nueva generación con hijos generados por cruce y mutación
        while len(next_population) < cfg.population_size:
            parent_a = _tournament(population, scored, cfg.tournament_size)
            parent_b = _tournament(population, scored, cfg.tournament_size)
            child = _ordered_crossover(parent_a, parent_b)   # Cruce
            _mutate(child, cfg.mutation_rate)                 # Mutación
            next_population.append(child)

        population = next_population

    # Al terminar todas las generaciones, evalúa la población final y saca el mejor
    final_scores = [
        route_distance(_build_route(ind, n, closed), distance_matrix, closed)
        for ind in population
    ]
    best_idx = min(range(len(population)), key=lambda idx: final_scores[idx])
    best_route = _build_route(population[best_idx], n, closed)
    best_distance = final_scores[best_idx]

    # En modo closed, agrega el destino inicial al final para cerrar el circuito
    if closed:
        best_route = [*best_route, best_route[0]]

    return best_route, best_distance
