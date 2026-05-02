# Guia de F12 / DevTools - RiegoIQ

## Objetivo
Esta guia sirve para revisar, demostrar y diagnosticar la aplicacion desde el navegador usando `F12`.

## Como abrir DevTools
- `F12`
- `Ctrl + Shift + I`
- clic derecho -> `Inspeccionar`

## Pestanas mas utiles

### `Elements`
Sirve para:
- revisar estructura HTML
- ver clases CSS activas
- confirmar que el tema cambio
- validar estilos responsivos

Prueba rapida:
- inspecciona el `body`
- revisa si cambia entre clases como `riego-theme-dark` o similares

### `Console`
Sirve para:
- ver errores JavaScript
- probar valores del navegador
- revisar `localStorage`
- confirmar estado visual rapido

### `Network`
Sirve para:
- revisar llamadas al backend
- validar login
- ver `heartbeat`, `report`, `plants`, `devices`
- comprobar que `socket.io` este conectado

### `Application`
Sirve para:
- revisar `localStorage`
- revisar cookies
- ver service workers o cache si aplica

### `Performance`
Sirve para:
- grabar la carga
- revisar lag
- comprobar si el scroll o la carga inicial mejoraron

## Que revisar para demostrar la app

### 1. Login
En `Network` filtra por:
```txt
auth
```

Debes ver llamadas como:
- `/api/auth/login`
- `/api/auth/refresh`

### 2. Carga de plantas
En `Network` filtra por:
```txt
plants
```

Debes ver:
- `GET /api/plants`

### 3. Estado de dispositivos
En `Network` filtra por:
```txt
devices
```

Debes ver:
- `GET /api/devices`

### 4. Tráfico IoT
En `Network` filtra por:
```txt
iot
```

Debes ver segun el caso:
- `/api/iot/heartbeat`
- `/api/iot/report`
- `/api/iot/valve/Superior`
- `/api/iot/valve/Inferior`

### 5. Socket en tiempo real
En `Network` filtra por:
```txt
socket.io
```

Si esta activo, la app mantiene una conexion de tiempo real con el backend.

## Comandos utiles en `Console`

### Ver usuario persistido
```js
JSON.parse(localStorage.getItem("iot_user"))
```

### Ver compatibilidad de sesion vieja
```js
JSON.parse(localStorage.getItem("sessionUser"))
```

### Ver tema actual guardado
```js
localStorage.getItem("riego_theme")
```

### Ver si esta activo el modo compacto
```js
localStorage.getItem("riego_compact")
```

### Ver tamano de fuente guardado
```js
localStorage.getItem("riego_fontsize")
```

### Ver si se activo el banner offline
```js
localStorage.getItem("iot_offline")
```

### Ver las clases actuales del `body`
```js
document.body.className
```

### Ver variables visuales del tema
```js
getComputedStyle(document.documentElement).getPropertyValue("--bg")
```

### Ver ruta actual
```js
window.location.pathname
```

### Medir tiempo basico de navegacion
```js
performance.getEntriesByType("navigation")[0]
```

### Ver tamano actual de la ventana
```js
({ width: window.innerWidth, height: window.innerHeight })
```

## Que no deberia aparecer en `Console`
- errores rojos repetidos
- fallos de CORS
- `401` inesperados despues del login
- errores de `socket.io`
- errores de carga de imagenes o chunks

## Que no deberias esperar ver en `localStorage`
El sistema actual es mas seguro que guardar todo ahi.

Por eso:
- el `access token` no deberia quedar persistido en `localStorage`
- el `refresh token` va en cookie `httpOnly`, asi que no lo veras desde `Console`

Eso es normal.

## Como revisar cookies
En `Application -> Cookies` puedes revisar si existe la cookie de sesion o refresh del backend.

No podras leer una cookie `httpOnly` con `document.cookie`, y eso esta bien.

## Como comprobar el modo responsive
1. Abre `F12`
2. Activa `Toggle device toolbar`
3. Prueba anchos como:
- `390 x 844`
- `768 x 1024`
- `1280 x 800`

Revisa:
- navbar
- dashboard
- sector page
- cards
- modales

## Como grabar rendimiento
1. Ve a `Performance`
2. Presiona `Record`
3. Recarga la pagina o navega al dashboard
4. Deten la grabacion

Te sirve para mostrar:
- carga inicial
- fluidez del scroll
- trabajo de scripting
- repaints grandes

## Filtros utiles de `Network`
```txt
auth
plants
devices
stats
iot
socket.io
heartbeat
report
```

## Mini checklist para la presentacion
- Login correcto
- Dashboard carga sin errores
- Sectores muestran plantas
- `GET /api/plants` responde bien
- `GET /api/devices` responde bien
- `socket.io` conectado
- tema y configuracion persistiendo
- sin errores rojos importantes en consola

## Resumen corto para exposicion
Con `F12` se puede demostrar que la aplicacion mantiene sesion, consume la API correctamente, recibe actualizaciones en tiempo real y conserva configuraciones visuales del usuario, todo desde herramientas nativas del navegador.
