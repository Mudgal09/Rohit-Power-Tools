/* ── TOAST ────────────────────────────────────────────────────── */
let toastEl = null;
function showToast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'rpt-toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

/* ── ADD TO CART (global) ─────────────────────────────────────── */
function addToCart(productId, qty = 1) {
  fetch('/cart/add', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ productId, qty }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showToast('✅ ' + data.message);
        // Update cart count in navbar
        const badge = document.getElementById('navCartCount');
        if (badge) badge.textContent = data.cartCount;
      } else {
        showToast('❌ ' + data.message);
      }
    })
    .catch(() => showToast('❌ Could not add to cart. Please try again.'));
}

/* ── AUTO-DISMISS ALERTS ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.flash-container .alert').forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) bsAlert.close();
    }, 4000);
  });
});
