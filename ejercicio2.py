import pandas as pd


def scheduling_penalizaciones(df):
    # Ordenar por penalización de forma descendente
    df_ord = df.sort_values(by="penalizacion", ascending=False)

    schedule = {}

    for _, fila in df_ord.iterrows():
        tarea = fila["tarea"]
        deadline = fila["deadline"]

        asignado = False

        # Buscar el slot más tardío disponible <= deadline
        for s in range(deadline, 0, -1):
            if s not in schedule:
                schedule[s] = tarea
                asignado = True
                break

        if not asignado:
            print(f"Tarea {tarea} queda fuera del schedule")

    pen_total = df[~df["tarea"].isin(schedule.values())]["penalizacion"].sum()
    return schedule, pen_total


datos = {
    "tarea": ["T1", "T2", "T3", "T4"],
    "deadline": [2, 1, 2, 1],
    "penalizacion": [40, 50, 30, 20],
}

df = pd.DataFrame(datos)

schedule, pen = scheduling_penalizaciones(df)
print("Schedule:", schedule)
print("Penalización total:", pen)