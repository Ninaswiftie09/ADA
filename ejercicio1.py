def seleccion_actividades(actividades):
    # Ordenar por tiempo de finalización ascendente
    ordenadas = sorted(actividades, key=lambda x: x[2])

    seleccionadas = []
    fin_actual = 0

    for nombre, inicio, fin in ordenadas:
        if inicio >= fin_actual:
            seleccionadas.append(nombre)
            fin_actual = fin

    return seleccionadas


actividades = [
    ("A", 1, 4),
    ("B", 3, 5),
    ("C", 0, 6),
    ("D", 5, 7),
    ("E", 3, 8),
    ("F", 6, 10),
    ("G", 8, 11),
]

resultado = seleccion_actividades(actividades)
print("Actividades seleccionadas:", resultado)