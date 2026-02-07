def evaluar_polinomio_naive(coeficientes, x):
    resultado = 0
    grado = len(coeficientes) - 1

    for k in range(grado + 1):
        # calcular x^k a pura multiplicación
        potencia = 1
        for _ in range(k):
            potencia *= x

        resultado += coeficientes[k] * potencia

    return resultado


def evaluar_polinomio_horner(coeficientes, x):
    resultado = 0
    for coef in reversed(coeficientes):
        resultado = coef + x * resultado
    return resultado


def conteo_mults_naive(grado):
    return (grado * (grado + 1)) // 2 + (grado + 1)


def conteo_mults_horner(grado):
    return grado + 1


if __name__ == "__main__":
    x = 2  # valor que se elige para evaluar el polinomio

    coef_n4 = [3, -1, 0, 5, 2]           # grado 4
    coef_n5 = [3, -1, 0, 5, 2, 4]        # grado 5
    coef_n6 = [3, -1, 0, 5, 2, 4, -2]    # grado 6

    for coeficientes in [coef_n4, coef_n5, coef_n6]:
        grado = len(coeficientes) - 1

        resultado_naive = evaluar_polinomio_naive(coeficientes, x)
        resultado_horner = evaluar_polinomio_horner(coeficientes, x)

        print(f"grado n = {grado}")
        print("resultado naive  =", resultado_naive)
        print("resultado horner =", resultado_horner)
        print("mults naive (teóricas) :", conteo_mults_naive(grado))
        print("mults horner (teóricas):", conteo_mults_horner(grado))
        print("-" * 40)
