const PRODUCTS = [
  { id: 1, name: 'Manzanas Rojas',    cat: 'frutas',    price: 9500,  unit: 'por kg',      emoji: '🍎' },
  { id: 2, name: 'Vegetales Frescos', cat: 'verduras',  price: 6500,  unit: 'por kg',      emoji: '🥦' },
  { id: 3, name: 'Frutas del Mercado',cat: 'frutas',    price: 7500,  unit: 'por kg',      emoji: '🍊' },
  { id: 4, name: 'Lácteos Variados',  cat: 'lacteos',   price: 12000, unit: 'por unidad',  emoji: '🥛' },
  { id: 5, name: 'Queso Campesino',   cat: 'lacteos',   price: 15000, unit: 'por kg',      emoji: '🧀' },
  { id: 6, name: 'Queso Amarillo',    cat: 'lacteos',   price: 18000, unit: 'por kg',      emoji: '🧀' },
  { id: 7, name: 'Agua Mineral',      cat: 'bebidas',   price: 2500,  unit: 'por botella', emoji: '💧' },
  { id: 8, name: 'Jugo de Naranja',   cat: 'bebidas',   price: 5500,  unit: 'por litro',   emoji: '🍊' },
  { id: 9, name: 'Pan Artesanal',     cat: 'panaderia', price: 4000,  unit: 'por unidad',  emoji: '🍞' },
];

let cart          = {};        
let userPoints    = 0;         
let totalCompras  = 0;         
let pointsEnabled = false;     
let pointsUsed    = 0;         
let currentCat    = 'todos';   

const POINTS_PER_1000    = 10;   
const PESOS_PER_100_PTS  = 1000; 

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}



function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatCOP(value) {
  return '$' + value.toLocaleString('es-CO');
}

function getLevel(points) {
  if (points >= 5000) return 'Oro';
  if (points >= 2000) return 'Plata';
  return 'Bronce';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function updatePointsBadge() {
  document.getElementById('points-display').textContent = userPoints;
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const filtered = currentCat === 'todos'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.cat === currentCat);

  grid.innerHTML = filtered.map(p => `
    <div class="product-card">
      <div class="product-emoji-block product-emoji-${p.cat}">${p.emoji}</div>
      <div class="product-body">
        <div class="product-cat ${p.cat}">${capitalize(p.cat)}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-footer">
          <div>
            <div class="product-price">${formatCOP(p.price)}</div>
            <div class="product-unit">${p.unit}</div>
          </div>
          <button class="add-btn" onclick="addToCart(${p.id})">+ Agregar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterCat(btn, cat) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCat = cat;
  renderProducts();
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  updateCartBadge();
  renderCart();
  const p = PRODUCTS.find(x => x.id === id);
  showToast(`${p.name} agregado al carrito`);
}

function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  updateCartBadge();
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const total = Object.values(cart).reduce((a, b) => a + b, 0);
  document.getElementById('cart-count').textContent = total;
}

function cartSubtotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(x => x.id === +id);
    return sum + p.price * qty;
  }, 0);
}

function calcEarnedPoints(totalPagado) {
  return Math.floor(totalPagado / 1000) * POINTS_PER_1000;
}

function calcDiscount(pts) {
  return Math.floor(pts / 100) * PESOS_PER_100_PTS;
}

function renderCart() {
  const body   = document.getElementById('cart-body');
  const footer = document.getElementById('cart-footer');
  const items  = Object.keys(cart);

  if (!items.length) {
    body.innerHTML = '<p class="cart-empty">Tu carrito está vacío</p>';
    footer.style.display = 'none';
    resetPoints();
    return;
  }

  body.innerHTML = items.map(id => {
    const p   = PRODUCTS.find(x => x.id === +id);
    const qty = cart[id];
    return `
      <div class="cart-item">
        <div class="cart-item-emoji">${p.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${formatCOP(p.price)} / ${p.unit}</div>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(${id}, -1)">−</button>
            <span class="qty-num">${qty}</span>
            <button class="qty-btn" onclick="changeQty(${id}, 1)">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <button class="delete-btn" onclick="removeFromCart(${id})">🗑</button>
          <span class="cart-item-sub">Subtotal: ${formatCOP(p.price * qty)}</span>
        </div>
      </div>
    `;
  }).join('');

  footer.style.display = 'block';
  updateCartTotals();
}

function updateCartTotals() {
  const sub      = cartSubtotal();
  const discount = calcDiscount(pointsUsed);
  const total    = Math.max(0, sub - discount);
  const earn     = calcEarnedPoints(total);

  const maxUsable = Math.min(userPoints, sub);

  document.getElementById('cart-subtotal').textContent  = formatCOP(sub);
  document.getElementById('cart-total').textContent     = formatCOP(total);
  document.getElementById('earn-pts').textContent       = `${earn} puntos`;
  document.getElementById('pts-available').textContent  = userPoints;
  document.getElementById('pts-max').textContent        = maxUsable;

  const slider = document.getElementById('pts-slider');
  slider.max = maxUsable;

  if (pointsUsed > maxUsable) {
    pointsUsed   = maxUsable;
    slider.value = maxUsable;
    updatePointsSlider();
  }
}

function openCart() {
  document.getElementById('cart-panel').classList.add('open');
  document.getElementById('overlay-bg').classList.add('open');
  renderCart();
}

function closeCart() {
  document.getElementById('cart-panel').classList.remove('open');
  document.getElementById('overlay-bg').classList.remove('open');
}

function togglePoints() {
  pointsEnabled = !pointsEnabled;
  const toggle = document.getElementById('pts-toggle');
  const slider = document.getElementById('pts-slider');

  toggle.classList.toggle('off', !pointsEnabled);
  slider.disabled = !pointsEnabled;

  if (!pointsEnabled) {
    resetPoints();
  }

  updateCartTotals();
}

function resetPoints() {
  pointsUsed = 0;
  const slider = document.getElementById('pts-slider');
  if (slider) {
    slider.value = 0;
    slider.disabled = true;
  }
  const toggle = document.getElementById('pts-toggle');
  if (toggle) toggle.classList.add('off');
  pointsEnabled = false;

  const ptsUsedEl = document.getElementById('pts-used');
  const ptsDiscEl = document.getElementById('pts-disc');
  if (ptsUsedEl) ptsUsedEl.textContent = '0 puntos';
  if (ptsDiscEl) ptsDiscEl.textContent = '-$0';
}

function updatePointsSlider() {
  const slider   = document.getElementById('pts-slider');
  pointsUsed     = +slider.value;
  const discount = calcDiscount(pointsUsed);

  document.getElementById('pts-used').textContent = `${pointsUsed} puntos`;
  document.getElementById('pts-disc').textContent = `-${formatCOP(discount)}`;
  updateCartTotals();
}

function checkout() {
  const sub      = cartSubtotal();
  const discount = calcDiscount(pointsUsed);
  const total    = Math.max(0, sub - discount);
  const earned   = calcEarnedPoints(total);

  userPoints   = userPoints - pointsUsed + earned;
  totalCompras = totalCompras + total;

  showToast(`✅ Compra exitosa! +${earned} puntos acumulados 🎁`);

  cart = {};
  resetPoints();
  updateCartBadge();
  updatePointsBadge();
  closeCart();
  renderCart();
}


function openProfile() {
  const equiv = Math.floor(userPoints / 100) * 1000;
  const level = getLevel(userPoints);

  document.getElementById('profile-pts').textContent          = userPoints;
  document.getElementById('profile-equiv').textContent        = `Equivale a ${formatCOP(equiv)} en descuentos`;
  document.getElementById('profile-total-compras').textContent = formatCOP(totalCompras);
  document.getElementById('profile-nivel').textContent        = level;

  document.getElementById('profile-panel').classList.add('open');
  document.getElementById('profile-bg').classList.add('open');
}

function closeProfile() {
  document.getElementById('profile-panel').classList.remove('open');
  document.getElementById('profile-bg').classList.remove('open');
}


renderProducts();
updatePointsBadge();