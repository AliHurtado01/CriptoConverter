// app.js – Lógica del simulador de convertidor de criptomonedas
// Cubre: datos remotos (fetch + fallback JSON), HTML generado, librerías externas (SweetAlert2, Chart.js, dayjs),
// flujo completo (convertir, ticket, historial, favoritos), formularios con precarga y persistencia.

import { UI } from "./ui.js";
import { ASSETS, getSimplePrices, get7dSeries, coinInfo } from "./api.js";

const els = {
  amount: document.getElementById("amount"),
  from: document.getElementById("from"),
  to: document.getElementById("to"),
  form: document.getElementById("formConvert"),
  result: document.getElementById("result"),
  ticket: document.getElementById("ticket"),
  historyBtn: document.getElementById("btnHistory"),
  historyCount: document.getElementById("historyCount"),
  resetBtn: document.getElementById("btnReset"),
  market: document.getElementById("market"),
  tplCoin: /** @type {HTMLTemplateElement} */ (
    document.getElementById("tpl-coin")
  ),
  chart: /** @type {HTMLCanvasElement} */ (document.getElementById("chart")),
};

const STORE = {
  prefill: "cc_prefill_v1",
  history: "cc_history_v1",
  favs: "cc_favs_v1",
  lastSymbol: "cc_lastSymbol_v1",
};

let chart;

init();
async function init() {
  // Precarga de formulario
  prefillForm();

  // Rellenar selects con assets (criptos + fiat)
  fillAssetSelects();

  // Cargar mercado rápido
  await renderMarket();

  // Eventos
  bindEvents();

  // Serie inicial para gráfico
  updateChart();

  updateHistoryCount();
}

// ----- Prefill -----
function prefillForm() {
  const saved = readJSON(STORE.prefill, {});
  els.amount.value = saved.amount ?? "100";
  els.from.value = saved.from ?? "btc";
  els.to.value = saved.to ?? "usd";
}

// ----- Selects -----
function fillAssetSelects() {
  const keys = Object.keys(ASSETS);
  for (const key of keys) {
    const opt1 = new Option(labelFor(key), key);
    const opt2 = new Option(labelFor(key), key);
    els.from.appendChild(opt1);
    els.to.appendChild(opt2);
  }
}
function labelFor(sym) {
  const meta = ASSETS[sym];
  return meta.name || sym.toUpperCase();
}

// ----- Mercado rápido  -----
async function renderMarket() {
  const data = await getSimplePrices("usd");
  const coins = ["btc", "eth", "sol", "ada", "xrp"];
  els.market.innerHTML = "";
  for (const sym of coins) {
    const node = els.tplCoin.content.firstElementChild.cloneNode(true);
    const info = coinInfo(sym);
    node.querySelector(".card__img").src =
      info?.img || "https://via.placeholder.com/400x200?text=Coin";
    node.querySelector(".card__title").textContent =
      info?.name || sym.toUpperCase();
    node.querySelector(".badge").textContent = sym.toUpperCase();
    node.querySelector(".card__desc").textContent = "Precio spot (USD)";
    node.querySelector(".price").textContent =
      "$" +
      Number(data.rates[sym]).toLocaleString(undefined, {
        maximumFractionDigits: 8,
      });
    node.querySelector(".addPair").addEventListener("click", () => {
      els.from.value = sym;
      els.to.value = "usd";
      UI.toast("Par seleccionado", `${sym.toUpperCase()} → USD`);
      updateChart();
    });
    els.market.appendChild(node);
  }
}

// ----- Eventos -----
function bindEvents() {
  els.form.addEventListener("submit", onConvert);
  els.from.addEventListener("change", () => {
    savePrefill();
    updateChart();
  });
  els.to.addEventListener("change", savePrefill);
  els.amount.addEventListener("input", savePrefill);
  els.historyBtn.addEventListener("click", showHistory);
  els.resetBtn.addEventListener("click", resetAll);
}

// ----- Conversión + Ticket -----
async function onConvert(ev) {
  ev.preventDefault();
  const amount = Number(els.amount.value);
  const from = els.from.value;
  const to = els.to.value;

  if (!Number.isFinite(amount) || amount <= 0) {
    return UI.error("Ingresa un monto válido");
  }
  if (from === to) {
    return UI.error("Selecciona activos diferentes para convertir");
  }

  const base = await getSimplePrices("usd");
  // Pasos: convertir "from" a USD, luego USD a "to"
  const priceFromUSD = from === "usd" ? 1 : base.rates[from];
  const priceToUSD = to === "usd" ? 1 : base.rates[to];

  let result;
  if (from === "usd" && priceToUSD) {
    result = amount / priceToUSD;
  } else if (to === "usd" && priceFromUSD) {
    result = amount * priceFromUSD;
  } else {

    const inUSD = amount * priceFromUSD;
    result = inUSD / (priceToUSD || 1);
  }

  // Simular comisión 0.35% y redondeos
  const fee = +(result * 0.0035).toFixed(8);
  const net = +(result - fee).toFixed(8);

  const summary = `${amount} ${from.toUpperCase()} ≈ ${net} ${to.toUpperCase()} (fee: ${fee} ${to.toUpperCase()})`;
  els.result.textContent = summary;

  // Ticket (HTML generado)
  const t = {
    id: "CC-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    date: dayjs().format("YYYY-MM-DD HH:mm"),
    from,
    to,
    amount,
    gross: result,
    fee,
    net,
  };
  els.ticket.classList.remove("hidden");
  els.ticket.innerHTML = `
    <h3>Ticket ${t.id}</h3>
    <div class="small">${t.date}</div>
    <hr>
    <p>De: <strong>${from.toUpperCase()}</strong> · A: <strong>${to.toUpperCase()}</strong></p>
    <p>Monto: <strong>${amount}</strong></p>
    <p>Resultado bruto: <strong>${result}</strong> · Comisión: <strong>${fee}</strong></p>
    <h3>Total neto: ${net} ${to.toUpperCase()}</h3>
  `;

  // Guardar en historial
  const hist = readJSON(STORE.history, []);
  hist.unshift(t);
  writeJSON(STORE.history, hist.slice(0, 50));
  updateHistoryCount();

  UI.toast("Conversión realizada");
}

function updateHistoryCount() {
  const hist = readJSON(STORE.history, []);
  els.historyCount.textContent = hist.length;
}

// ----- Historial -----
function showHistory() {
  const hist = readJSON(STORE.history, []);
  if (!hist.length)
    return UI.modal(
      "Historial",
      '<p class="small">Aún no hay conversiones.</p>'
    );
  const rows = hist
    .map(
      (h) => `
    <tr>
      <td>${h.date}</td>
      <td>${h.amount} ${h.from.toUpperCase()}</td>
      <td>${h.net} ${h.to.toUpperCase()}</td>
      <td>${h.id}</td>
    </tr>
  `
    )
    .join("");
  const html = `
    <div class="ticket">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr><th>Fecha</th><th>De</th><th>Resultado</th><th>Ticket</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  UI.modal("Historial de conversiones", html);
}

// ----- Chart -----
async function updateChart() {
  const sym = els.from.value;
  const info = coinInfo(sym);
  if (!info) {
    // si es fiat, mostrar plano
    drawChart([{ t: new Date(), y: 1 }], sym.toUpperCase());
    return;
  }
  const series = await get7dSeries(info.id, "usd");
  drawChart(series, info.name);
}

function drawChart(series, label) {
  const data = {
    labels: series.map((p) => dayjs(p.t).format("DD/MM")),
    datasets: [
      {
        label: label,
        data: series.map((p) => p.y),
        borderWidth: 2,
        tension: 0.2,
        fill: false,
      },
    ],
  };
  const cfg = {
    type: "line",
    data,
    options: {
      responsive: true,
      scales: { y: { ticks: { callback: (v) => "$" + v } } },
      plugins: { legend: { display: false } },
    },
  };
  if (chart) {
    chart.destroy();
  }
  chart = new Chart(els.chart, cfg);
}

// ----- Persistencia -----
function savePrefill() {
  writeJSON(STORE.prefill, {
    amount: els.amount.value,
    from: els.from.value,
    to: els.to.value,
  });
}

function resetAll() {
  localStorage.removeItem(STORE.prefill);
  localStorage.removeItem(STORE.history);
  els.result.textContent = "";
  els.ticket.classList.add("hidden");
  prefillForm();
  updateHistoryCount();
  UI.toast("Reiniciado");
}

// Utils
function readJSON(k, def) {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? def;
  } catch (e) {
    return def;
  }
}
function writeJSON(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
}
