# Revisión de contenido — CARTA_HOPPERS_SEP 26.pdf

Transcripción de las 5 páginas del PDF a `lib/menu/default-menu.ts` (carta predeterminada y punto de partida del panel).
Todo es editable desde `/admin` sin tocar código.

## Cobertura

| Página | Contenido | Dónde quedó |
| --- | --- | --- |
| 1 | Sin alcohol (8), Gin tonic (3), Whiskys (6), Vinos tintos/blancos/espumosos/copa (12), “Seguinos por Instagram” | Categorías `sin-alcohol`, `gin-tonic`, `whiskys`, `vinos`; Instagram en datos del negocio |
| 2 | Tabla de 10 cervezas tiradas con cervecería, color, aroma, sabor/final, graduación e IBU; “Nuestras cervezas” (pinta, media, especiales, media especiales, botellas); Happy Hour | `cervezas-tiradas` (ficha técnica + precios generales), `cervezas-botella`, bloque Happy Hour |
| 3 | Cocktails (24), “¿Cómo la estás pasando?” con Instagram y WhatsApp | `cocktails`; título y texto de cierre del pie |
| 4 | Papas (6), Para picar (4), Pizzetas (6), Burgers (4), aviso de sal | `papas`, `para-picar`, `pizzetas`, `burgers` |
| 5 | Libre de gluten (1), Sándwiches (4), Postres (2), Adicionales (2), “Hacenos parte de tus mejores momentos” | `libre-de-gluten`, `sandwiches`, `postres`, `adicionales`; frase de bienvenida y texto de cierre |

Total: 15 categorías, 95 productos, 4 precios generales de cerveza y 5 promociones de Happy Hour (verificado por `tests/default-menu.test.ts`).

No se reprodujeron los logos de terceros (Pepsi, Patagonia, Corona) ni las ilustraciones del PDF. Tampoco se cargaron fotos: el PDF no trae una foto confiable para cada producto, así que se deben subir desde el panel.

## Datos dudosos y decisiones provisionales

| Pág. | Texto en el PDF | Decisión provisional |
| --- | --- | --- |
| 2 | Nombres de estilos superpuestos en la columna izquierda (“GOLDEN / STOUT WOODY / RED / SCOTCH / APA / IPA / RED FRUIT / VERA IPA”) | **Interpretación provisional pendiente de confirmación del cliente.** Como la tabla tiene 10 filas, “Red” y “Scotch” se tomaron como una sola cerveza: **Red Scotch** (Walmunz, rubí, caramelizado). Orden: Golden, Stout, Woody, Red Scotch, APA, IPA, Barley Wine, Honey, Red Fruit, Vera IPA. |
| 2 | Stout — IBU 65 | Se cargó tal como está impreso. Es alto para el estilo, conviene confirmarlo. |
| 2 | Fila de Woody: “BIER REPUBLIC”; el resto dice “BIER REPUBLIK” | Se unificó como **Bier Republik**. |
| 2 | Color de Barley Wine: “DORADA” superpuesto con “OBSCURA” | “Dorada oscura”. |
| 2 | Color de Honey: “DORADO” superpuesto con “INTENSO”; Red Fruit: “ROJO” superpuesto con “BRILLANTE” | “Dorado intenso” y “Rojo brillante”. |
| 2 | Color de APA cortado en líneas (“DORAD / O / PÁLID / O”) | “Dorado pálido”. |
| 2 | “ESPECIALES” / “MEDIA ESPECIALES” | La carta no dice qué estilos son “especiales”. Quedan como **precios generales** de la categoría y no se asocian a ningún estilo; cada estilo se carga sin precio propio. |
| 2 | “*IBU: UNIDAD INTERNACIONAL DE AMARGOS” | Nota de la categoría: “IBU: unidad internacional de amargor · Gr. ol.: graduación alcohólica.” |
| 2 | “TODOSLOS DÍASDE17A 20HS –SÓLO ENEFECTIVO–” | “Todos los días de 17 a 20 h” · “Solo en efectivo”. |
| 1 | “Medida”, sola, debajo de la lista de whiskys, sin valor | Se omitió. Si hay una medida estándar (por ejemplo, en cc), cargarla como nota de la categoría Whiskys. |
| 1 | “JHONNIE WALKER” con las variantes “BLACK” $12.000 y “RED” $10.000 | Dos productos: **Johnnie Walker Black** y **Johnnie Walker Red**. |
| 1 | “JAMENSON”, “JAGGERMEISTER” | Se corrigió la ortografía de la marca: **Jameson**, **Jägermeister**. Jägermeister queda en Whiskys, como en el PDF. |
| 1 | “LIMÓN \| POMELO \| PEPINO \| FRUTOS ROJOS \| JENGIBRE” bajo Gin tonic | Se cargó como nota de la categoría. No queda claro si son sabores a elegir o la guarnición. |
| 1 | “APÓSTOLES GIN” con “Apóstoles Mate” y “Apóstoles Rosa Mosqueta” | Dos productos en el subgrupo “Apóstoles Gin”. |
| 1 | “Don David Cabernet Sauv Reserva”, “Las Perdices Brut Rose”, “Fond De Cave” | “Cabernet Sauvignon”, “Brut Rosé”, “Fond de Cave”. |
| 1 | “VINO DE LA CASA \| COPA $6.000” | Producto “Vino de la casa”, subgrupo “Por copa”, descripción “Copa”. |
| 1 y 2 | “Corona sin alcohol” aparece en Sin alcohol y en Nuestras cervezas | Se mantiene en las dos categorías, como en el PDF. |
| 3 | “Orange / Tonic” debajo de Campari; “Cuba Libre” debajo de Ron Bacardí 7 años | Se interpretaron como descripción (modo de servir). |
| 3 | Red Bull y Toc Toc dentro de Cocktails | Quedan en Cocktails, como en el PDF. |
| 3 | “Contanostuexperienciapornuestroscanales oficales” · “WhatsApp: 3518 06-3069” | Texto de cierre con espacios y “oficiales”. El número se muestra como “351 806-3069” y enlaza a `https://wa.me/543518063069`. |
| 4 | “PapasBaston(SalsaPicante a parte)”, “Papas enbastónbañadasen…”, “Tirasde…”, “aliolii” | Se corrigieron espacios y errores de tipeo: “Papas bastón (salsa picante aparte)”, “Papas en bastón bañadas en…”, “Tiras de…”, “alioli”. |
| 4 | “Zuccini”, “re hidratados”, “mozarella”, “jamon cocidos” | “zucchini”, “rehidratados”, “mozzarella”, “jamón cocido”. |
| 4 | “Cebolla Carmelizada”, “Medallón de Ternera de (140 gr)”, “Beacon”, “Soja Texrurizada” | “cebolla caramelizada”, “medallón de ternera (140 g)”, “bacon”, “soja texturizada”. |
| 4 | “EL EXCESO DE SAL ES PERJUIDICIAL PARA LA SALUD. LEY Nº 14.349.” | “El exceso de sal es perjudicial para la salud. Ley N.º 14.349.” Se muestra al final de Papas, Para picar, Pizzetas y Burgers (la página 4, donde aparece en el PDF) y en el pie. Se puede activar en otras categorías desde el panel. |
| 4 y 5 | “*TODAS INCLUYEN…” / “*TODOS INCLUYEN ACOMPAÑAMIENTO DE PAPAS BASTON” | Nota de las categorías **Burgers** y **Sándwiches**. En la página 5 la nota está bajo la columna de sándwiches; queda por confirmar si también aplica a las empanadas árabes (por ahora, no). |
| 5 | “EMPANADAS ARABES (3 UNIDADES)” en “Libre de gluten” | Producto “Empanadas árabes”, descripción “3 unidades”, etiqueta “Sin gluten”. Lo mismo para “Michelob Gluten Free”. |
| 5 | “SÁNDWICHS”, “TIRAMISU”, “CombinadodeVerduras de Estación” | “Sándwiches”, “Tiramisú”, “Combinado de verduras de estación”. |
| Todas | Mayúsculas mezcladas en las descripciones (“Panceta Crocante”, “Queso Tybo”) | Se normalizó a mayúscula inicial, sin cambiar ingredientes. Se respetaron las grafías propias: “Ali Oli”, “Hö”, “Tybo”, “Tasty Hö”. |

## Datos que el PDF no trae (no se inventaron)

- **Dirección y horarios generales del local:** están vacíos y no se muestran en la carta hasta que se carguen desde *Negocio*.
- **Fotos de productos:** se muestran ilustraciones de respaldo por categoría hasta que se suban las fotos reales.
