// Tarifas fijas de ejemplo (edítalas cuando quieras)
const RATES = {
  bitcoin:  { usd: 60000, eur: 55000 },
  ethereum: { usd: 2800,  eur: 2600  },
  solana:   { usd: 160,   eur: 150   }
};

const SYMBOL = { bitcoin:'BTC', ethereum:'ETH', solana:'SOL' };

// Elementos del DOM
const elCrypto   = document.getElementById('crypto');
const elFiat     = document.getElementById('fiat');
const elAmount   = document.getElementById('amount');
const elResult   = document.getElementById('result');
const elUnitPrice= document.getElementById('unitPrice'); // <- NUEVO
const elError    = document.getElementById('error');

// Formateadores
const fmtMoney = (n, currency) =>
  new Intl.NumberFormat(navigator.language, { style:'currency', currency }).format(n);
const fmtNum = (n) =>
  new Intl.NumberFormat(navigator.language, { maximumFractionDigits: 8 }).format(n);

// Lógica principal
function render(){
  elError.textContent = '';

  const crypto = elCrypto.value;   // 'bitcoin' | 'ethereum' | 'solana'
  const fiat   = elFiat.value;     // 'usd' | 'eur'
  const raw    = elAmount.value.trim();

  const table = RATES[crypto] || {};
  const price = table[fiat];

  if (typeof price !== 'number') {
    // Si no hay tarifa disponible para esa combinación
    elUnitPrice.textContent = '—';
    elResult.textContent = '—';
    elError.textContent = 'Tarifa no disponible para esa combinación.';
    return;
  }

  // Mostrar SIEMPRE el precio unitario seleccionado
  elUnitPrice.textContent = `1 ${SYMBOL[crypto]} = ${fmtMoney(price, fiat.toUpperCase())}`;

  // Si no hay cantidad, dejamos el resultado principal en guion
  if (raw === '') {
    elResult.textContent = '—';
    return;
  }

  const amount = parseFloat(raw);
  if (Number.isNaN(amount) || amount < 0) {
    elResult.textContent = '—';
    elError.textContent = 'Introduce una cantidad válida (≥ 0).';
    return;
  }

  const total = amount * price;
  elResult.textContent = `${fmtNum(amount)} ${SYMBOL[crypto]} = ${fmtMoney(total, fiat.toUpperCase())}`;
}

// Eventos
elCrypto.addEventListener('change', render);
elFiat.addEventListener('change', render);
elAmount.addEventListener('input', render);

// Init
render();
