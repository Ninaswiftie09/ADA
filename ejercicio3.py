import numpy as np


def mochila_fraccional(pesos, valores, capacidad):
    ratios = valores / pesos

    # Índices que ordenan ratios de mayor a menor
    orden = np.argsort(ratios)[::-1]

    valor_total = 0.0
    cap_restante = capacidad

    for i in orden:
        if cap_restante <= 0:
            break

        # Tomar la mayor fracción posible del objeto i
        fraccion = min(1.0, cap_restante / pesos[i])
        valor_total += fraccion * valores[i]
        cap_restante -= fraccion * pesos[i]

    return valor_total


pesos = np.array([2, 3, 5, 4])
valores = np.array([6, 5, 8, 9])
W = 8

print(f"Valor máximo: {mochila_fraccional(pesos, valores, W)}")