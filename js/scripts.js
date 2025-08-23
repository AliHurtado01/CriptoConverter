
let RATES = {
  bitcoin:  { usd: 60000, eur: 55000 },
  ethereum: { usd: 2800,  eur: 2600  },
  solana:   { usd: 160,   eur: 150   }
};

let SYMBOL = { bitcoin:'BTC', ethereum:'ETH', solana:'SOL' };

let elCrypto   = document.getElementById('crypto');
let elFiat     = document.getElementById('fiat');
let elAmount   = document.getElementById('amount');
let elResult   = document.getElementById('result');
let elUnitPrice= document.getElementById('unitPrice');
let elError    = document.getElementById('error');


let fmtMoney = (n, currency) =>
  new Intl.NumberFormat(navigator.language, { style:'currency', currency }).format(n);
let fmtNum = (n) =>
  new Intl.NumberFormat(navigator.language, { maximumFractionDigits: 8 }).format(n);


function render(){
  elError.textContent = '';

  let crypto = elCrypto.value;   // 'bitcoin' | 'ethereum' | 'solana'
  let fiat   = elFiat.value;     // 'usd' | 'eur'
  let raw    = elAmount.value.trim();

  let table = RATES[crypto] || {};
  let price = table[fiat];

  if (typeof price !== 'number') {

    elUnitPrice.textContent = '—';
    elResult.textContent = '—';
    elError.textContent = 'Tarifa no disponible para esa combinación.';
    return;
  }


  elUnitPrice.textContent = `1 ${SYMBOL[crypto]} = ${fmtMoney(price, fiat.toUpperCase())}`;


  if (raw === '') {
    elResult.textContent = '—';
    return;
  }

  let amount = parseFloat(raw);
  if (Number.isNaN(amount) || amount < 0) {
    elResult.textContent = '—';
    elError.textContent = 'Introduce una cantidad válida (≥ 0).';
    return;
  }

  let total = amount * price;
  elResult.textContent = `${fmtNum(amount)} ${SYMBOL[crypto]} = ${fmtMoney(total, fiat.toUpperCase())}`;
}


elCrypto.addEventListener('change', render);
elFiat.addEventListener('change', render);
elAmount.addEventListener('input', render);

render();
