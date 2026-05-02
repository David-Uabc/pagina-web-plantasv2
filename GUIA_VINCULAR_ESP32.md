# Guia para vincular nuevos ESP32 por usuario - RiegoIQ

## Objetivo
Esta guia explica como registrar y vincular los ESP32 de cada usuario sin mezclar plantas, sectores ni dispositivos entre cuentas.

## Como funciona ahora
Cada usuario ve y controla solo:
- sus plantas
- sus dispositivos
- sus lecturas IoT
- sus comandos de valvulas

La relacion correcta es:
- `usuario -> dispositivos ESP32 -> sectores -> plantas`

Eso significa que aunque dos usuarios tengan un sector `Superior`, sus datos ya no se deben cruzar.

## Regla principal
Antes de usar un ESP32 con una cuenta, primero hay que vincularlo desde el frontend con esa cuenta.

## Donde se vincula
En el dashboard:
1. Inicia sesion con la cuenta del usuario.
2. Ve a la tarjeta `Estado del sistema`.
3. Presiona el boton `Vincular ESP32`.
4. Escribe el `deviceId`.
5. Elige el sector.
6. Presiona `Guardar dispositivo`.

## Importante
El `deviceId` que pongas en la pagina debe ser exactamente el mismo que esta en el firmware.

Ejemplo en el firmware:
```cpp
const char* DEVICE_ID = "ESP32-SUP-MARIA-01";
```

Ese mismo valor debe registrarse en la app:
```txt
ESP32-SUP-MARIA-01
```

## Convencion recomendada
Para evitar choques entre usuarios, usa `deviceId` unicos.

Ejemplos:
- `ESP32-SUP-DAVID-01`
- `ESP32-INF-DAVID-01`
- `ESP32-SUP-MARIA-01`
- `ESP32-INF-MARIA-01`

No es recomendable que todos usen:
- `ESP32-SUP-01`
- `ESP32-INF-01`

porque esos IDs deben ser unicos en todo el sistema.

## Flujo completo para un usuario nuevo

### 1. Crear su cuenta
El usuario debe registrarse e iniciar sesion.

### 2. Crear sus plantas
Debe registrar sus plantas en:
- `Sector Superior`
- `Sector Inferior`

Cada planta debe tener un `valveNumber` correcto:
- `1`
- `2`
- `3`
- `4`
- `5`

## Regla de valvulas
Dentro del mismo usuario y sector:
- no debe repetirse el mismo `valveNumber`

Ejemplo correcto:
- Lavanda -> `Superior` -> `V1`
- Menta -> `Superior` -> `V2`

Ejemplo incorrecto:
- Lavanda -> `Superior` -> `V1`
- Aloe -> `Superior` -> `V1`

## 3. Vincular sus dispositivos
Desde la tarjeta `Estado del sistema`:

### ESP32 del sector superior
- `deviceId`: `ESP32-SUP-MARIA-01`
- `sector`: `Superior`

### ESP32 del sector inferior
- `deviceId`: `ESP32-INF-MARIA-01`
- `sector`: `Inferior`

## 4. Cargar el firmware con ese mismo ID
En el firmware hay que poner el mismo `DEVICE_ID`.

Ejemplo:
```cpp
const char* DEVICE_ID = "ESP32-INF-MARIA-01";
const char* SECTOR    = "Inferior";
```

## 5. Encender el ESP32
Cuando el dispositivo empiece a enviar:
- `heartbeat`
- `report`
- `valve/:sector`

el backend ya sabra a que usuario pertenece y solo trabajara con sus plantas.

## Que pasa si no se vincula primero
Si el backend no puede asociar el ESP32 con seguridad a un solo usuario:
- no aceptara lecturas
- no devolvera valvulas
- respondera con error de vinculacion segura

Eso es intencional para evitar que un usuario afecte a otro.

## Checklist rapido
- El usuario ya tiene cuenta
- El usuario ya tiene plantas
- Cada planta tiene `valveNumber` correcto
- El ESP32 fue vinculado desde su cuenta
- El firmware usa el mismo `DEVICE_ID`
- El `sector` del firmware coincide con el sector registrado

## Ejemplo real

### En la app
- `deviceId`: `ESP32-SUP-MARIA-01`
- `sector`: `Superior`

### En el firmware
```cpp
const char* DEVICE_ID = "ESP32-SUP-MARIA-01";
const char* SECTOR    = "Superior";
```

### Resultado
- Maria solo vera y controlara sus plantas del sector superior
- otro usuario no recibira esas lecturas ni esos comandos

## Resumen corto para exposicion
Cada usuario vincula sus ESP32 desde el dashboard usando un `deviceId` unico por dispositivo. A partir de esa vinculacion, el backend separa lecturas, valvulas, historiales y estados por propietario, evitando que los sectores de distintas cuentas se mezclen.
