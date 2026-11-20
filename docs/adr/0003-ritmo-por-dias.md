# 0003 · Ritmo por días distintos, no por eventos

- **Estado**: aceptada
- **Fecha**: 2026-11-20

## Contexto

La hora pico se calculaba con los últimos 100 eventos públicos de GitHub. Un perfil real tuvo 96 eventos en una sola ráfaga a medianoche: la hora pico pasó a las 00:00, el segundo tipo saltó de Veneno a Siniestro y el compañero cambió (Litwick → Houndour) por una sola noche de trabajo.

## Decisión

- La hora pico cuenta **días distintos** con actividad en cada hora, no eventos. Una ráfaga pesa como un día.
- Para ser «búho nocturno» (segundo tipo Siniestro) hace falta actividad entre las 22:00 y las 05:00 en **al menos 3 días distintos** (`MIN_NIGHT_DAYS`).

## Consecuencias

- El tipo refleja hábitos, no picos aislados.
- Los perfiles con poca historia en la ventana de eventos dependen de su segundo lenguaje, que es más estable.
- Pruebas: «una sola ráfaga a medianoche no te vuelve búho nocturno».
