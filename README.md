# Uso-Bateria 🔋

Clawd, la mascota de Claude, al lado de una **batería pixelada** que te dice cuánto te queda de tu uso **semanal** de Claude. Aparece en las sesiones de **Claude Code** de la app de escritorio: en un **mini panel** que la propia app coloca en una esquina del chat y recoloca al abrir o cerrar paneles, o, donde no hay paneles, **pintada en el fondo** de la ventana. Todo se ajusta escribiendo `/bateria-ajustes`.

![Uso-Bateria en un chat](assets/chat.png)

<details>
<summary>Ver en Claude Code, en modo claro y en un portátil</summary>

**Claude Code con el panel de la derecha abierto**

![En Claude Code con el panel abierto](assets/panel.png)

**Claude Code con la lista de hilos abierta**

![En Claude Code con la lista de hilos](assets/code.png)

**Modo claro**

![En modo claro](assets/light.png)

**Portátil (1440 × 900)**

![En un portátil](assets/laptop.png)

</details>

> Las capturas son simulaciones de Claude Desktop (a 2000 × 1080, salvo la del portátil). El recuadro y sus animaciones son los reales; el sitio exacto del mini panel lo decide la app.

## Dónde funciona

- ✅ En las sesiones de **Claude Code** de la app de escritorio (la pestaña **Code**) que trabajan en una carpeta de **tu ordenador**.
- ❌ En las **conversaciones normales** de Claude: allí la app no ejecuta el código de los plugins (solo usa sus habilidades y conectores), así que no se puede dibujar nada, ni panel ni fondo.
- ❌ En la terminal no se dibuja (solo sale una línea de texto con el porcentaje).
- ⏳ En las sesiones de Claude Code **en la nube**: el plugin se carga y sus comandos funcionan, pero hoy la app no se conecta a esas sesiones para dibujar mods (ni paneles ni fondos). `/bateria-diagnostico` lo muestra como *"no surface is attached"*. El plugin queda preparado: si la app empieza a conectarse, la batería aparecerá sola.

## Qué hace Clawd según la batería

![Estados de Clawd](assets/moods.png)

| Te queda | Qué pasa |
| --- | --- |
| **Más del 60 %** | Clawd salta y saluda, con brillitos alrededor. Batería verde. |
| **21–60 %** | Camina de un lado a otro. Batería amarilla (verde por encima del 50 %). |
| **20 % o menos** | Está cansado y suda, la batería se pone roja y el borde parpadea. |
| **0 %** | Se queda dormido y le salen "z". |

Además:
- **Arriba a la derecha** sale cuándo se renueva el límite semanal (`renueva sáb 10:00`, o `renueva hoy 10:00` si es el mismo día).
- **En la fila de abajo** (`5H`) está el límite de 5 horas y a qué hora se recarga (`60% · recarga 13:00`).
- Los números se actualizan después de cada respuesta de Claude, y el reloj cada minuto.

## Tres modos

| | **Auto** (por defecto) | **Panel** | **Fondo** |
| --- | --- | --- | --- |
| Dónde sale | En el mini panel; si la app no lo muestra, en el fondo | Siempre en el mini panel | Siempre pintado en el fondo de la ventana |
| Paneles abiertos (Hilos, Contexto…) | La app recoloca el mini panel | La app lo recoloca | Un panel abierto lo puede tapar |
| Fondos y temas | Compatible, salvo si tiene que pasar al fondo | Compatible con cualquiera | Ocupa el fondo: no se combina con otro tema que ponga fondo |
| Cómo se mueve | Lo coloca la app (en el fondo, con `/bateria-mover`) | Lo coloca la app | Con `/bateria-mover` y un clic, o con la posición |
| Tamaño | Fijo en píxeles (en el fondo, crece con la ventana) | Fijo en píxeles | Crece con la ventana |

Para cambiar de modo: `/bateria-ajustes modo panel` (o `auto`, `fondo`). Se aplica al momento.

## Instalación

Necesitas **Claude Desktop** (la app de escritorio). Elige la forma que te resulte más cómoda; todas instalan lo mismo.

### Opción 1: desde la app, dentro de Claude Code

> ⚠️ **Hazlo desde una sesión de Claude Code**, no desde la página **Plugins** del menú de la izquierda. Esa página instala plugins para las conversaciones normales, y ahí la batería no se ve.

1. Abre la pestaña **Code** y empieza una sesión en una carpeta de tu ordenador.
2. En la caja donde escribes, pulsa el botón **+** y entra en **Plugins**.
3. Pulsa **Añadir** (arriba a la derecha) → **Añadir marketplace** (*Add marketplace*) y escribe:
   ```
   Lehendakari02/Uso-Bateria
   ```
   **No uses el buscador:** solo busca en el catálogo oficial y este plugin no sale ahí.
4. Aparece la tarjeta **Uso bateria**: pulsa el botón **+** para instalarla (**Probar** solo abre un chat de prueba).
5. Elige los ajustes, o deja los de por defecto.
6. **Abre una sesión nueva de Claude Code** y escribe cualquier mensaje. La batería aparece en una esquina; si no, escribe `/bateria`.

> Si no ves la batería, la forma más segura de instalarla es la **opción 3** (terminal). Instala el plugin para todas tus sesiones de Claude Code, también las de la app.

### Opción 2: con un comando en Claude Code

En el chat de una sesión de Claude Code, escribe:

```
/plugin install uso-bateria --marketplace Lehendakari02/Uso-Bateria
```

Si tu versión no acepta `--marketplace`, hazlo en dos pasos:

```
/plugin marketplace add Lehendakari02/Uso-Bateria
```

```
/plugin install uso-bateria@uso-bateria
```

### Opción 3: desde la terminal de tu ordenador

```bash
claude plugin install uso-bateria --marketplace Lehendakari02/Uso-Bateria
```

O en dos pasos:

```bash
claude plugin marketplace add Lehendakari02/Uso-Bateria
```

```bash
claude plugin install uso-bateria@uso-bateria
```

### Opción 4: pidiéndoselo a Claude

En una sesión de Claude Code **en tu ordenador** (no en la nube), escribe algo como:

> Instala el plugin `uso-bateria` del marketplace `Lehendakari02/Uso-Bateria`.

Claude ejecutará los comandos de la opción 3 y te pedirá permiso antes.

En todos los casos, **abre una sesión nueva** al terminar.

## Comandos

Se escriben en el chat:

| Comando | Qué hace |
| --- | --- |
| `/bateria` | Vuelve a abrir el mini panel si lo has cerrado. |
| `/bateria-ajustes` | Muestra los ajustes y los cambia al momento (ver **Ajustes**). |
| `/bateria-mover` | **En el fondo:** la batería se marca con un borde que parpadea y el aviso *"Haz clic donde quieras ponerme"*. El siguiente clic en un hueco vacío de la ventana la coloca ahí. Escríbelo otra vez para cancelar. |
| `/bateria-diagnostico` | Si no ves la batería: te dice qué ha contestado la app al pedirle el mini panel y el fondo, y si hay datos de uso. |
| `/bateria-reset` | **En el fondo:** devuelve la batería a la posición de los ajustes. |

![Moviendo la batería con /bateria-mover](assets/mover.png)

El sitio que eliges con `/bateria-mover` se recuerda aunque cierres la app, hasta que uses `/bateria-reset` o cambies la posición en los ajustes. No hace falta tocar la batería primero, y un clic normal nunca la mueve: solo el clic que viene después de `/bateria-mover`.

## Ajustes

### Desde el chat: `/bateria-ajustes` (lo más fácil)

Escribe `/bateria-ajustes` y verás los ajustes actuales. Para cambiar uno, añade el ajuste y el valor; puedes usar palabras en castellano:

```
/bateria-ajustes tamaño grande
```

```
/bateria-ajustes estilo compacto posición abajo-izquierda
```

```
/bateria-ajustes modo fondo
```

Los cambios se ven al momento y se guardan para las próximas sesiones. Para volver a los ajustes del plugin: `/bateria-ajustes reset`.

| Ajuste | Valores | Por defecto |
| --- | --- | --- |
| `modo` | `auto`, `panel`, `fondo` | `auto` |
| `posición` (en el fondo) | `abajo-derecha`, `derecha`, `arriba-derecha`, `abajo-izquierda`, `izquierda`, `arriba-izquierda` | `abajo-derecha` |
| `tamaño` | `diminuto`, `pequeño`, `mediano`, `grande`, `muy-grande` | `pequeño` |
| `estilo` | `completo`, `compacto` | `completo` |
| `opacidad` (del recuadro) | `solid`, `normal`, `cristal` | `normal` |
| `idioma` | `español`, `inglés` | `español` |
| `móvil` | `ocultar`, `mostrar` | `ocultar` |

También valen los nombres en inglés (`size large`, `style compact`, `position bottom-left`…).

### Desde la configuración del plugin

Son los mismos ajustes, en inglés (`mode`, `position`, `size`, `style`, `opacity`, `language`, `mobile`). Lo que cambies con `/bateria-ajustes` tiene prioridad. Después de cambiarlos, abre una sesión nueva.

- **En el chat de Claude Code:**
  ```
  /plugin configure uso-bateria@uso-bateria
  ```
- **Desde la terminal**, al instalar (puedes poner varios `--config`):
  ```bash
  claude plugin install uso-bateria --marketplace Lehendakari02/Uso-Bateria --config size=medium
  ```
  O después, con los valores que quieras cambiar:
  ```bash
  echo '{"size":"medium","style":"full"}' | claude plugin configure uso-bateria@uso-bateria --values-stdin
  ```

> La página **Plugins** de la app solo muestra el resumen y los archivos del plugin, no sus ajustes: usa `/bateria-ajustes`.

### Tamaños

En el mini panel cada tamaño tiene un ancho fijo, sea cual sea la ventana:

![Tamaños](assets/size.png)

En el fondo el recuadro crece con la ventana: `pequeño` mide unos 220 px de ancho en un monitor de 1920 px.

### Estilo

- `full` (por defecto): el recuadro completo, con cabecera (`USO SEMANAL`), cuándo se renueva y el límite de 5 horas con su hora de recarga.
- `compact`: una tira baja con Clawd, la batería, el porcentaje, cuándo se renueva y el `5H`.

![Estilo compacto](assets/compact.png)

### Posiciones (en el fondo)

En el fondo, el recuadro va **en el hueco libre al lado del chat**: entre el chat y el borde derecho (las `right`) o entre la barra lateral y el chat (las `left`). Las `bottom` lo ponen a la altura de la caja donde escribes; las `top` lo suben, sin meterlo debajo de la barra de arriba. Si ninguna te encaja, usa `/bateria-mover`.

![Posiciones en modo fondo](assets/pos.png)

![Modo fondo](assets/fondo.png)

### Fondo del recuadro

![Opciones de fondo](assets/op.png)

`solid` es totalmente opaco, `normal` es casi opaco y `glass` deja ver un poco lo que hay detrás.

### Idioma

Los textos del recuadro salen **en castellano** (`USO SEMANAL`, `QUEDA`, `renueva`, `recarga` y los días de la semana). Para verlos en inglés: `/bateria-ajustes idioma inglés`.

### En el móvil

En la app del móvil no hay sitio libre al lado del chat, así que la batería viene **oculta** (`hide`). Si la quieres ver: `/bateria-ajustes móvil mostrar`.

## Preguntas frecuentes

**¿Gasta tokens?**
No. Solo lee los números de uso que Claude ya tiene y no llama a la IA. Tampoco envía nada a ningún sitio.

**¿Qué número muestra?**
Con un plan Pro o Max, el límite semanal. Si usas Claude con una clave de API (sin límites de plan), muestra cuánto te queda de la ventana de contexto.

**¿La puedo arrastrar con el ratón?**
No: la app no avisa a los plugins cuando arrastras el ratón. En el mini panel la coloca la app. En el fondo, usa `/bateria-mover` y haz clic donde la quieras.

**¿Sale en las conversaciones normales de Claude?**
No. Allí la app no ejecuta el código de los plugins, ni para paneles ni para fondos. Solo en Claude Code.

**He cerrado el mini panel, ¿cómo lo recupero?**
Escribe `/bateria`, o abre una sesión nueva.

**Lo he instalado y no sale nada.**
1. Comprueba que estás en una sesión de **Claude Code** (pestaña **Code**) de tu ordenador, no en una conversación normal.
2. Abre una sesión **nueva** después de instalar y envía un mensaje.
3. Escribe `/bateria-diagnostico` y mira qué ha contestado la app. Si te dice que el comando no existe, el plugin no está cargado en Claude Code: instálalo con la **opción 3** (terminal) y abre otra sesión.
4. En la terminal, `claude plugin list` debe mostrar `uso-bateria@uso-bateria` como *enabled*.

**¿Funciona con otros temas o fondos?**
En el mini panel, sí, con cualquiera. En el fondo, la batería ocupa el fondo de la ventana, y ahí solo cabe una cosa: si otro plugin pone un fondo o una foto, se pisan y solo se ve uno.

**¿Y si en mi sistema está activado "reducir movimiento"?**
Clawd y la batería se quedan quietos.

**¿Cómo lo quito?**
En **+** → **Plugins**, desactiva o elimina `uso-bateria`, o escribe `claude plugin uninstall uso-bateria` en la terminal. Después abre una sesión nueva.

## Estado

Es un proyecto en marcha. El modo auto, el mini panel, `/bateria-ajustes` y `/bateria-mover` son nuevos y aún se están probando en la app real. Si algo no se ve bien, abre un *issue* en este repositorio con una captura.

## Créditos

El dibujo de Clawd, la batería pixelada y sus animaciones parten de [usage-battery](https://github.com/Handsher/usage-battery), de Handsher. Licencia MIT (ver [LICENSE](LICENSE)). Proyecto de fans, sin relación con Anthropic.
