# Guia de Firmware ESP32 - RiegoIQ

## Objetivo
Este documento explica como funciona el firmware de los dos ESP32 del sistema `RiegoIQ`, como se comunican con el backend y como validar que cada sector esta trabajando correctamente.

## Archivos principales
- [ESP32-INF-01.ino](C:\Users\da_sa\OneDrive\Desktop\pagina web plantas\firmware\ESP32-INF-01\ESP32-INF-01.ino)
- [ESP32-SUP-01.ino](C:\Users\da_sa\OneDrive\Desktop\pagina web plantas\firmware\ESP32-SUP-01\ESP32-SUP-01.ino)

## Arquitectura general
El sistema usa `2 ESP32`, uno por sector:
- `ESP32-SUP-01` controla el sector `Superior`
- `ESP32-INF-01` controla el sector `Inferior`

Cada ESP32 puede manejar:
- `5 sensores de humedad`
- `5 relevadores`
- `5 plantas` por sector, asociadas por `valveNumber`

La relacion logica es:
- `sensor 1 -> valvula 1 -> planta con valveNumber 1`
- `sensor 2 -> valvula 2 -> planta con valveNumber 2`
- y asi hasta la `5`

## Flujo de funcionamiento
Cuando el ESP32 arranca:
1. Se conecta a la red WiFi.
2. Se conecta al broker MQTT.
3. Envia un `heartbeat` HTTP al backend.
4. Consulta por HTTP el estado actual de las valvulas del sector.
5. Entra al ciclo principal de lectura y sincronizacion.

Durante el `loop`:
- Cada `10 segundos` lee sensores.
- Cada `10 segundos` consulta al backend el estado de las valvulas.
- Cada `30 segundos` envia `heartbeat`.
- Si MQTT esta disponible, publica por MQTT.
- Si MQTT falla, usa HTTP como respaldo.

## Endpoints usados por el firmware

### `POST /api/iot/heartbeat`
Se usa para avisar que el ESP32 sigue conectado.

Headers requeridos:
```http
x-device-id: ESP32-SUP-01 o ESP32-INF-01
x-api-key: <IOT_API_KEY>
```

Body de ejemplo:
```json
{
  "sector": "Superior",
  "deviceId": "ESP32-SUP-01",
  "mqttOk": true,
  "rssi": -61
}
```

### `GET /api/iot/valve/:sector`
El firmware consulta el estado de las valvulas del sector para abrir o cerrar relevadores.

Ejemplo:
```http
GET /api/iot/valve/Superior
```

Respuesta esperada:
```json
{
  "sector": "Superior",
  "command": "CLOSED",
  "plants": [
    {
      "id": "661...",
      "name": "Aloe Vera",
      "valveStatus": "OPEN",
      "valveNumber": 1,
      "humidity": 42
    }
  ]
}
```

### `POST /api/iot/report`
Se usa para reportar lecturas de humedad.

Formato actual compatible con el backend:
```json
{
  "sector": "Inferior",
  "deviceId": "ESP32-INF-01",
  "readings": [
    { "valve": 1, "valveNumber": 1, "humidity": 58 },
    { "valve": 2, "valveNumber": 2, "humidity": 61 }
  ]
}
```

Nota importante:
- El backend acepta `plantId` si algun dia quieres reportar una planta especifica.
- Actualmente el firmware trabaja por `valve` y `valveNumber`, que se mapean contra la planta del mismo `sector`.

## Topics MQTT usados

### Comando de valvulas
```txt
riegoiq/Superior/valve/command
riegoiq/Inferior/valve/command
```

Payloads aceptados por el firmware:
```json
{ "valve": 1, "command": "OPEN" }
```

```json
{ "valveNumber": 3, "command": "OPEN" }
```

```json
{ "command": "CLOSE_ALL" }
```

```json
{
  "plants": [
    { "valveNumber": 1, "valveStatus": "OPEN" },
    { "valveNumber": 2, "valveStatus": "CLOSED" }
  ]
}
```

### Reporte de humedad
```txt
riegoiq/Superior/report
riegoiq/Inferior/report
```

### Heartbeat MQTT
```txt
riegoiq/Superior/heartbeat
riegoiq/Inferior/heartbeat
```

## Pines
La base actual de los dos firmwares usa:

### Sensores
```txt
36, 39, 34, 35, 32
```

### Relevadores
```txt
26, 27, 14, 12, 13
```

## Logica de lectura de humedad
El firmware:
- toma varias lecturas ADC
- saca un promedio
- valida si el valor esta en rango
- convierte el ADC a porcentaje `0-100`

Reglas actuales:
- `SECO_ADC = 3200`
- `HUMEDO_ADC = 1000`
- si el valor esta fuera de `800-3400`, se considera que no hay sensor y se reporta `-1`

Si un sensor no esta conectado:
- no se incluye en el reporte
- no rompe el reporte de los demas sensores

## Como se decide abrir o cerrar una valvula
El firmware no decide solo toda la logica de riego.

El flujo correcto es:
1. El ESP32 reporta humedad.
2. El backend actualiza la planta.
3. El backend decide si debe abrir o cerrar segun `minHumidity`, `maxHumidity` y `valveStatus`.
4. El firmware consulta el estado actualizado de la valvula y aplica el cambio al relevador.

Eso permite que la regla de negocio quede centralizada en el backend.

## Relacion con la base de datos
Cada planta en Mongo debe tener:
- `sector = "Superior"` o `sector = "Inferior"`
- `valveNumber = 1..5`

Ejemplo:
- si el ESP32 superior manda `{ "valve": 3, "humidity": 44 }`
- el backend busca la planta del sector `Superior` con `valveNumber = 3`
- y actualiza esa planta

## Validacion rapida antes de presentar

### Checklist del firmware
- El ESP32 conecta a WiFi.
- El ESP32 conecta a MQTT o al menos logra HTTP.
- Aparece `Online` en la vista de dispositivos.
- El sector correcto recibe lecturas.
- Cada planta responde segun su `valveNumber`.
- El riego manual desde la pagina cambia el relevador correcto.
- El `heartbeat` se refleja en el dashboard.

### Checklist de datos
- Debe haber maximo `5 plantas` por sector para coincidir con el hardware actual.
- Cada planta debe tener `valveNumber` unico dentro de su sector.
- El `deviceId` del firmware debe coincidir con el que reporta el backend.

## Limitaciones actuales
Como proyecto academico, el firmware funciona bien para demostracion, pero hay puntos mejorables:
- credenciales WiFi/MQTT hardcodeadas
- `setInsecure()` en TLS para MQTT
- sin buffer local tipo SPIFFS para lecturas offline

Eso no impide presentar el proyecto, pero si conviene mencionarlo como mejora futura.

## Resumen corto para exposicion
`RiegoIQ` usa dos ESP32, uno por sector, cada uno con cinco canales de sensado y riego. Los dispositivos reportan humedad al backend, reciben el estado de las valvulas y sincronizan el riego en tiempo real mediante MQTT con respaldo por HTTP.
