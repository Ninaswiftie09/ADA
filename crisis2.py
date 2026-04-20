def mochila_vms(vms, capacidad):
    n = len(vms)

    dp = [[0 for _ in range(capacidad + 1)] for _ in range(n + 1)]

    for i in range(1, n + 1):
        nombre, memoria, valor = vms[i - 1]

        for c in range(capacidad + 1):
            if memoria > c:
                dp[i][c] = dp[i - 1][c]
            else:
                sin_tomar = dp[i - 1][c]
                tomando = valor + dp[i - 1][c - memoria]
                dp[i][c] = max(sin_tomar, tomando)

    seleccionadas = []
    c = capacidad

    for i in range(n, 0, -1):
        if dp[i][c] != dp[i - 1][c]:
            nombre, memoria, valor = vms[i - 1]
            seleccionadas.append((nombre, memoria, valor))
            c -= memoria

    seleccionadas.reverse()
    return dp[n][capacidad], seleccionadas


def imprimir_resultado(vms, capacidad):
    valor_optimo, seleccionadas = mochila_vms(vms, capacidad)

    print("Capacidad máxima de memoria:", capacidad)
    print("VMs disponibles:")
    for nombre, memoria, valor in vms:
        print(f"  - {nombre}: memoria = {memoria}, valor = {valor}")

    print("\nValor óptimo total:", valor_optimo)

    memoria_total = sum(vm[1] for vm in seleccionadas)
    print("Memoria total usada:", memoria_total)

    print("\nVMs seleccionadas:")
    for nombre, memoria, valor in seleccionadas:
        print(f"  - {nombre}: memoria = {memoria}, valor = {valor}")


if __name__ == "__main__":
    capacidad = 50

    vms = [
        ("VM1", 10, 60),
        ("VM2", 20, 100),
        ("VM3", 30, 120),
        ("VM4", 25, 75)
    ]

    imprimir_resultado(vms, capacidad)