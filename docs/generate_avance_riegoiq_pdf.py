from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    ListFlowable,
    ListItem,
    PageBreak,
)


OUTPUT_PATH = r"C:\Users\da_sa\OneDrive\Desktop\pagina web plantas\docs\Avance_RiegoIQ_2_semanas.pdf"


styles = getSampleStyleSheet()
TITLE = ParagraphStyle(
    "TitleCustom",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=22,
    leading=26,
    textColor=colors.HexColor("#111827"),
    alignment=TA_LEFT,
    spaceAfter=10,
)
SUBTITLE = ParagraphStyle(
    "SubtitleCustom",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=11,
    leading=15,
    textColor=colors.HexColor("#475569"),
    spaceAfter=10,
)
H1 = ParagraphStyle(
    "Heading1Custom",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=19,
    textColor=colors.HexColor("#166534"),
    spaceBefore=12,
    spaceAfter=8,
)
BODY = ParagraphStyle(
    "BodyCustom",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=10.5,
    leading=14,
    textColor=colors.HexColor("#1f2937"),
    spaceAfter=6,
)


def bullets(items):
    return ListFlowable(
        [
            ListItem(Paragraph(item, BODY), leftIndent=10)
            for item in items
        ],
        bulletType="bullet",
        leftIndent=16,
        bulletFontName="Helvetica",
        bulletFontSize=9,
    )


def table(data, widths):
    tbl = Table(data, colWidths=widths, repeatRows=1)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D9F2E3")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return tbl


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        leftMargin=0.8 * inch,
        rightMargin=0.8 * inch,
        topMargin=0.8 * inch,
        bottomMargin=0.7 * inch,
        title="Informe de Avance Técnico - RiegoIQ",
        author="David Reséndiz",
    )

    story = []
    story.append(Paragraph("Informe de Avance Técnico<br/>RiegoIQ", TITLE))
    story.append(
        Paragraph(
            "Resumen de mejoras, correcciones y preparación para producción realizadas durante las últimas dos semanas.",
            SUBTITLE,
        )
    )
    story.append(
        table(
            [
                ["Dato", "Detalle"],
                ["Proyecto", "RiegoIQ - Sistema de riego IoT"],
                ["Alumno", "David Reséndiz"],
                ["Periodo", "Avance de 2 semanas"],
                ["Enfoque", "Frontend, backend, firmware, seguridad, rendimiento y despliegue en Render"],
            ],
            [1.8 * inch, 4.8 * inch],
        )
    )
    story.append(Spacer(1, 0.18 * inch))

    story.append(Paragraph("1. Resumen ejecutivo", H1))
    story.append(
        Paragraph(
            "Durante este periodo se estabilizó la aplicación completa, se corrigieron errores funcionales y de despliegue, "
            "se separaron correctamente los datos por usuario, se integró mejor el trabajo con los ESP32, se optimizó el "
            "rendimiento de la interfaz y se preparó el sistema para ejecutarse en producción sobre Render.",
            BODY,
        )
    )
    story.append(
        table(
            [
                ["Área", "Resultado", "Impacto"],
                ["Frontend", "Rediseño visual, menús estables, mejor experiencia móvil y desktop", "Mejor presentación y uso diario"],
                ["Backend", "Separación por usuario, seguridad y sesiones más robustas", "Menos cruces de datos y más consistencia"],
                ["Firmware", "Soporte completo en ambos sectores y cola offline de lecturas", "Mayor tolerancia a fallos de red"],
                ["Producción", "Preparación de variables, rutas SPA y despliegue funcional", "Sistema listo para pruebas reales arriba"],
            ],
            [1.4 * inch, 3.2 * inch, 2.0 * inch],
        )
    )

    story.append(Paragraph("2. Bugs y errores corregidos", H1))
    story.append(
        bullets(
            [
                "Se corrigió el menú del usuario en el navbar para que desplegara perfil, configuración, apariencia y cerrar sesión.",
                "Se arregló el comportamiento del dropdown renderizado por portal para que no se cerrara antes de abrir sus modales.",
                "Se eliminó el warning de React por claves duplicadas dentro de AnimatePresence en Navbar.",
                "Se reparó la búsqueda global para que el overlay apareciera correctamente y no quedara atrapado dentro del header.",
                "Se limpiaron caracteres dañados, escapes visibles y mojibake en componentes del frontend.",
                "Se resolvieron errores 404 del service worker, del manifest y de iconos o recursos inexistentes.",
                "Se corrigieron problemas de recarga en rutas SPA como login, superior e inferior en el despliegue de Render.",
                "Se corrigió el error de CORS en producción causado por apuntar el backend al dominio viejo del frontend.",
                "Se ajustó el comportamiento visual del estado de los ESP32 y la interacción para desvincularlos.",
                "Se corrigieron lecturas de humedad inválidas y otros fallos funcionales detectados al revisar backend.",
            ]
        )
    )

    story.append(Paragraph("3. Mejoras de frontend y experiencia de usuario", H1))
    story.append(
        bullets(
            [
                "Integración de ThemeProvider y ThemeSelector para aplicar temas reales, tamaño de texto y modo compacto.",
                "Integración de MaintenanceToggle dentro de PlantCard con actualización inmediata de estado.",
                "Mejora visual de ProfileModal, SettingsModal y WelcomeToast.",
                "Rediseño de SectorPage y PlantCard con una estética más profesional para presentación.",
                "Mejora del panel de SystemStatus con vinculación y desvinculación de ESP32 desde la interfaz.",
                "Limpieza de textos, iconos, etiquetas y consistencia visual en dashboard y páginas de sector.",
                "Ajustes de usabilidad para que la app se sienta más natural en móvil y escritorio.",
            ]
        )
    )

    story.append(Paragraph("4. Optimización de rendimiento", H1))
    story.append(
        bullets(
            [
                "Lazy loading de páginas, modales y componentes pesados para reducir carga inicial.",
                "Memoización, búsqueda diferida y limpieza de renders innecesarios en dashboard y sectores.",
                "Reducción de blur, sombras costosas y transiciones globales que afectaban el INP.",
                "Optimización del fondo de partículas, lluvia y animaciones continuas.",
                "Mejora de imágenes de plantas con lazy loading, srcSet y tamaños más adecuados.",
                "Reducción del bundle principal desde aproximadamente 279 kB gzip hasta alrededor de 141 kB gzip.",
                "Menos polling innecesario y mejor comportamiento cuando la pestaña está en segundo plano.",
            ]
        )
    )

    story.append(PageBreak())

    story.append(Paragraph("5. Backend, seguridad y separación por usuario", H1))
    story.append(
        bullets(
            [
                "Protección de rutas administrativas y operativas como devices y mqtt.",
                "Separación real de plantas y dispositivos por usuario para evitar cruces entre cuentas.",
                "Aislamiento de eventos socket.io por salas de usuario.",
                "Validaciones más fuertes para plantas, umbrales y combinaciones de sector y válvula.",
                "Mejora del scheduler para que también publique comandos al hardware real vía MQTT.",
                "Ajuste de cookies de refresh token para producción cross-site en Render.",
                "Incorporación de Content Security Policy real en el servidor.",
                "Corrección de CORS para aceptar únicamente el frontend nuevo y orígenes configurados.",
            ]
        )
    )

    story.append(Paragraph("6. Integración IoT y firmware", H1))
    story.append(
        bullets(
            [
                "Se completó el firmware del sector superior con la misma base funcional del inferior.",
                "El backend ahora acepta lecturas por plantId y también por valve o valveNumber.",
                "Se mejoró el flujo de vinculación de ESP32 por usuario y por sector.",
                "Se agregó una cola offline persistente usando Preferences para reenviar lecturas perdidas.",
                "Se mantuvo una versión de firmware directa para carga manual en ESP32 sin depender del repositorio.",
            ]
        )
    )

    story.append(Paragraph("7. Preparación para producción en Render", H1))
    story.append(
        bullets(
            [
                "Alineación de variables de entorno reales de backend y frontend.",
                "Ajuste de REACT_APP_API_URL al backend final en producción.",
                "Corrección del service worker, manifest e iconos faltantes.",
                "Limpieza de dominios antiguos y ajuste de FRONTEND_URL al dominio nuevo.",
                "Configuración correcta de rutas SPA para evitar fallos al recargar.",
                "Validación del despliegue funcional con frontend y backend operando en Render.",
            ]
        )
    )

    story.append(Paragraph("8. Archivos clave para explicar al profesor", H1))
    story.append(
        table(
            [
                ["Archivo", "Qué explica"],
                ["frontend/src/components/layout/Navbar.js", "Dropdowns, portales, menú de usuario y notificaciones"],
                ["frontend/src/components/layout/GlobalSearch.jsx", "Búsqueda global y overlay"],
                ["frontend/src/pages/SectorPage.jsx", "Vista principal por sector y mejoras visuales"],
                ["frontend/src/components/plant/PlantCard.js", "Acciones, historial, mantenimiento y estado de planta"],
                ["frontend/src/pages/Dashboard.js", "Carga principal y optimización general"],
                ["frontend/src/components/dashboard/SystemStatus.js", "Estado de ESP32, vinculación y desvinculación"],
                ["frontend/src/styles.css", "Pulido visual, mobile y rendimiento percibido"],
                ["backend/server.js", "CORS, Helmet, CSP, arranque y configuración general"],
                ["backend/src/routes/iot.routes.js", "Heartbeats, reportes IoT y separación por usuario"],
                ["backend/src/jobs/scheduleRunner.js", "Riego programado y comandos al hardware"],
                ["backend/src/mqtt/mqttClient.js", "Procesamiento MQTT y heartbeats"],
                ["backend/src/routes/auth.routes.js", "Login, refresh token y cookies de sesión"],
            ],
            [3.15 * inch, 3.35 * inch],
        )
    )

    story.append(Paragraph("9. Conclusión y estado actual", H1))
    story.append(
        Paragraph(
            "Al cierre de este avance, el sistema ya cuenta con una base funcional y visual mucho más madura. "
            "La aplicación web quedó más estable, más rápida, mejor organizada por usuario, mejor preparada para producción "
            "y lista para pruebas de campo con los ESP32.",
            BODY,
        )
    )
    story.append(
        Paragraph(
            "El siguiente paso natural ya no es una ronda grande de rediseño, sino validar en campo el comportamiento con "
            "dispositivos reales, lecturas de humedad, riego manual, riego programado y confirmación de ambos sectores "
            "trabajando sobre la misma base de datos.",
            BODY,
        )
    )

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
