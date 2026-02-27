/**
 * exportHistory.js — utilidades para exportar historial de plantas
 * Uso:
 *   import { exportCSV, exportPDF } from "../../utils/exportHistory";
 *   exportCSV(plant, history);
 *   exportPDF(plant, history);
 */

// ── Exportar CSV ──────────────────────────────────────
export function exportCSV(plant, history) {
  const { humidity, irrigations } = history;

  const humRows = humidity.map(h => [
    new Date(h.ts).toLocaleDateString("es-MX"),
    new Date(h.ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
    h.value,
    h.value < plant.minHumidity ? "ALERTA" : h.value > plant.maxHumidity ? "ALTA" : "ÓPTIMA",
  ]);

  const irrRows = irrigations.map(r => [
    new Date(r.ts).toLocaleDateString("es-MX"),
    new Date(r.ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
    r.duration,
    `+${r.raised}%`,
  ]);

  const lines = [
    `"Sistema de Riego IoT — Historial de ${plant.name}"`,
    `"Sector: ${plant.sector} | Riego: ${plant.irrigationType} | Rango: ${plant.minHumidity}%–${plant.maxHumidity}%"`,
    `"Exportado: ${new Date().toLocaleString("es-MX")}"`,
    "",
    "=== HISTORIAL DE HUMEDAD ===",
    '"Fecha","Hora","Humedad (%)","Estado"',
    ...humRows.map(r => r.map(c => `"${c}"`).join(",")),
    "",
    "=== HISTORIAL DE RIEGOS ===",
    '"Fecha","Hora","Duración (min)","Humedad ganada"',
    ...irrRows.map(r => r.map(c => `"${c}"`).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${plant.name}_historial_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Exportar PDF (HTML → ventana de impresión) ────────
export function exportPDF(plant, history) {
  const { humidity, irrigations } = history;

  const avgHum  = Math.round(humidity.reduce((s, h) => s + h.value, 0) / humidity.length);
  const minHum  = Math.min(...humidity.map(h => h.value));
  const maxHum  = Math.max(...humidity.map(h => h.value));
  const alerts  = humidity.filter(h => h.value < plant.minHumidity).length;
  const isHealthy = avgHum >= plant.minHumidity && avgHum <= plant.maxHumidity;

  const humRows = humidity.slice(-20).reverse().map(h => `
    <tr>
      <td>${new Date(h.ts).toLocaleDateString("es-MX")}</td>
      <td>${new Date(h.ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</td>
      <td style="color:${h.value < plant.minHumidity ? "#ef4444" : h.value > plant.maxHumidity ? "#38bdf8" : "#22c55e"}; font-weight:700">${h.value}%</td>
      <td>${h.value < plant.minHumidity ? "⚠ Crítica" : h.value > plant.maxHumidity ? "↑ Alta" : "✓ Óptima"}</td>
    </tr>
  `).join("");

  const irrRows = irrigations.slice(-10).reverse().map(r => `
    <tr>
      <td>${new Date(r.ts).toLocaleDateString("es-MX")}</td>
      <td>${new Date(r.ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</td>
      <td>${r.duration} min</td>
      <td style="color:#22c55e; font-weight:700">+${r.raised}%</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Historial — ${plant.name}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', sans-serif; background:#fff; color:#1a1a1a; padding:32px; }
    .header { border-bottom:3px solid #059669; padding-bottom:16px; margin-bottom:24px; }
    .logo { font-size:28px; margin-bottom:4px; }
    h1 { font-size:22px; font-weight:800; color:#064e3b; }
    .meta { font-size:13px; color:#6b7280; margin-top:4px; }
    .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    .stat { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; text-align:center; }
    .stat-val { font-size:24px; font-weight:800; color:#059669; display:block; }
    .stat-lbl { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; }
    .health { padding:10px 16px; border-radius:8px; margin-bottom:24px; font-weight:600; font-size:13px;
      background:${isHealthy ? "#f0fdf4" : "#fefce8"};
      border:1px solid ${isHealthy ? "#86efac" : "#fde047"};
      color:${isHealthy ? "#15803d" : "#854d0e"}; }
    h2 { font-size:16px; font-weight:700; color:#064e3b; margin-bottom:10px; border-left:3px solid #059669; padding-left:10px; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; font-size:13px; }
    th { background:#064e3b; color:#fff; padding:8px 12px; text-align:left; font-weight:600; }
    td { padding:7px 12px; border-bottom:1px solid #e5e7eb; }
    tr:nth-child(even) td { background:#f9fafb; }
    .footer { font-size:11px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:12px; margin-top:8px; }
    @media print { body { padding:16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🌱</div>
    <h1>Historial — ${plant.name}</h1>
    <p class="meta">Sector ${plant.sector} · ${plant.irrigationType} · Rango óptimo: ${plant.minHumidity}%–${plant.maxHumidity}%</p>
    <p class="meta">Exportado el ${new Date().toLocaleString("es-MX")}</p>
  </div>

  <div class="stats">
    <div class="stat"><span class="stat-val">${avgHum}%</span><span class="stat-lbl">Promedio</span></div>
    <div class="stat"><span class="stat-val" style="color:#ef4444">${minHum}%</span><span class="stat-lbl">Mínimo</span></div>
    <div class="stat"><span class="stat-val" style="color:#0284c7">${maxHum}%</span><span class="stat-lbl">Máximo</span></div>
    <div class="stat"><span class="stat-val" style="color:${alerts>0?"#ef4444":"#059669"}">${alerts}</span><span class="stat-lbl">Alertas</span></div>
  </div>

  <div class="health">${isHealthy ? "✓ Salud óptima — La planta se encuentra dentro del rango ideal de humedad." : "⚠ Revisar — La humedad promedio está fuera del rango óptimo."}</div>

  <h2>📈 Historial de Humedad (últimas 20 lecturas)</h2>
  <table>
    <thead><tr><th>Fecha</th><th>Hora</th><th>Humedad</th><th>Estado</th></tr></thead>
    <tbody>${humRows}</tbody>
  </table>

  <h2>💧 Historial de Riegos (últimos 10)</h2>
  ${irrigations.length === 0
    ? `<p style="color:#9ca3af;font-size:13px;margin-bottom:24px">Sin riegos registrados en este período.</p>`
    : `<table><thead><tr><th>Fecha</th><th>Hora</th><th>Duración</th><th>Humedad ganada</th></tr></thead><tbody>${irrRows}</tbody></table>`}

  <div class="footer">Sistema de Riego IoT · Generado automáticamente · ${new Date().toLocaleDateString("es-MX")}</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}