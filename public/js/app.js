// Shop Hoa Thanh Nhã – tương tác phía trình duyệt (không phụ thuộc thư viện).
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const KEY = 'tn_cart';
  const vnd = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---- Giỏ hàng lưu trong trình duyệt; giá luôn do máy chủ tính lại.
  const cart = {
    get() {
      try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
      } catch (e) {
        return [];
      }
    },
    set(items) {
      try {
        localStorage.setItem(KEY, JSON.stringify(items));
      } catch (e) {}
      updateCount();
    },
    add(id, variant, qty) {
      const items = cart.get();
      const hit = items.find((i) => i.id === id && i.variant === variant);
      if (hit) hit.qty = Math.min(50, hit.qty + qty);
      else items.push({ id, variant, qty });
      cart.set(items);
    },
  };

  function updateCount() {
    const n = cart.get().reduce((s, i) => s + i.qty, 0);
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = n;
      el.dataset.count = n;
    });
  }

  let toastTimer;
  function toast(html) {
    const el = $('[data-toast]');
    if (!el) return;
    el.innerHTML = html;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  // Nút "Thêm vào giỏ" trên thẻ sản phẩm (bản tiêu chuẩn).
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    cart.add(btn.dataset.addToCart, 'Tiêu chuẩn', 1);
    toast(`<span>Đã thêm <b>${esc(btn.dataset.name)}</b></span><a href="/gio-hang">Xem giỏ</a>`);
  });

  // ---- Trang sản phẩm
  const buy = $('[data-buy-form]');
  if (buy) {
    const qtyInput = $('input[name="qty"]', buy);
    const priceEls = $$('[data-price]');
    const refreshPrice = () => {
      const v = $('input[name="variant"]:checked', buy);
      if (v) priceEls.forEach((el) => (el.textContent = vnd(Number(v.dataset.priceValue))));
    };
    $$('input[name="variant"]', buy).forEach((r) => r.addEventListener('change', refreshPrice));
    let submitter = 'add';
    $$('button[type="submit"]', buy).forEach((b) => b.addEventListener('click', () => (submitter = b.value)));
    buy.addEventListener('submit', (e) => {
      e.preventDefault();
      const variant = ($('input[name="variant"]:checked', buy) || {}).value || 'Tiêu chuẩn';
      const qty = Math.max(1, Math.min(50, parseInt(qtyInput && qtyInput.value, 10) || 1));
      cart.add(buy.dataset.id, variant, qty);
      if (submitter === 'buy') location.href = '/thanh-toan';
      else toast(`<span>Đã thêm <b>${esc(buy.dataset.name)}</b> vào giỏ</span><a href="/gio-hang">Xem giỏ</a>`);
    });
    const mobileBuy = $('[data-mobile-buy]');
    if (mobileBuy)
      mobileBuy.addEventListener('click', () => {
        submitter = 'buy';
        buy.requestSubmit ? buy.requestSubmit() : buy.dispatchEvent(new Event('submit', { cancelable: true }));
      });
  }

  // Nút +/- số lượng
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qty]');
    if (!b) return;
    const input = $('input', b.parentElement);
    input.value = Math.max(1, Math.min(50, (parseInt(input.value, 10) || 1) + Number(b.dataset.qty)));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Ảnh sản phẩm
  const main = $('[data-gallery-main]');
  $$('[data-gallery-thumb]').forEach((t) => t.addEventListener('click', () => (main.src = t.dataset.galleryThumb)));

  // ---- Trang giỏ hàng và đặt hàng
  async function priced() {
    const res = await fetch('/api/cart', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: cart.get() }) });
    return res.json();
  }

  function renderSummary(root, data) {
    const set = (sel, v) => $$(sel, root).forEach((el) => (el.textContent = v));
    set('[data-subtotal]', vnd(data.subtotal));
    set('[data-shipping]', data.shipping ? vnd(data.shipping) : 'Miễn phí');
    set('[data-total]', vnd(data.total));
    const box = $('[data-free-ship-box]', root);
    const free = Number(root.dataset.freeShip || 0);
    if (box && data.subtotal > 0) {
      box.hidden = false;
      const left = free - data.subtotal;
      const pct = Math.min(100, (data.subtotal / free) * 100);
      box.innerHTML = (left > 0 ? `Mua thêm <b>${vnd(left)}</b> để được miễn phí giao hàng` : '<b>Bạn được miễn phí giao hàng nội thành</b>') + `<div class="progress"><i style="width:${pct}%"></i></div>`;
    }
  }

  async function renderCart() {
    const page = $('.cart-layout[data-cart-page]');
    if (!page) return;
    const wrap = $('[data-cart-lines]', page);
    const data = await priced();
    // Đồng bộ lại giỏ: bỏ sản phẩm đã ngừng bán
    cart.set(data.lines.map((l) => ({ id: l.productId, variant: l.variant, qty: l.qty })));
    const btn = $('[data-checkout-btn]', page);
    if (!data.lines.length) {
      wrap.innerHTML = '<div class="empty"><p>Giỏ hàng đang trống.</p><a class="btn btn-dark" href="/">Chọn hoa ngay</a></div>';
      btn.setAttribute('aria-disabled', 'true');
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '.5';
    } else {
      wrap.innerHTML = data.lines
        .map(
          (l, i) => `<div class="cart-line">
          <a href="/san-pham/${l.slug}"><img src="${l.image}" alt="" width="88" height="110"></a>
          <div><h3><a href="/san-pham/${l.slug}">${esc(l.name)}</a></h3><div class="meta">${esc(l.variant)} · ${vnd(l.price)}</div>
            <div class="qty"><button type="button" data-line-qty="${i}" data-d="-1" aria-label="Giảm"><svg class="icon"><use href="#i-minus"/></svg></button><input value="${l.qty}" aria-label="Số lượng" readonly><button type="button" data-line-qty="${i}" data-d="1" aria-label="Tăng"><svg class="icon"><use href="#i-plus"/></svg></button></div>
            <button class="remove" type="button" data-remove="${i}">Xóa</button></div>
          <div class="line-total">${vnd(l.price * l.qty)}</div></div>`,
        )
        .join('');
    }
    renderSummary(page, data);
  }

  document.addEventListener('click', (e) => {
    const q = e.target.closest('[data-line-qty]');
    const r = e.target.closest('[data-remove]');
    if (!q && !r) return;
    const items = cart.get();
    if (q) {
      const it = items[Number(q.dataset.lineQty)];
      it.qty = Math.max(1, Math.min(50, it.qty + Number(q.dataset.d)));
    } else items.splice(Number(r.dataset.remove), 1);
    cart.set(items);
    renderCart();
  });

  async function renderCheckout() {
    const form = $('[data-checkout-form]');
    if (!form) return;
    const aside = $('aside[data-cart-page]', form);
    const data = await priced();
    const box = $('[data-mini-lines]', aside);
    if (!data.lines.length) {
      box.innerHTML = '<p class="muted">Giỏ hàng trống. <a class="link" href="/">Chọn hoa</a></p>';
      $('[data-submit]', form).disabled = true;
    } else {
      box.innerHTML = data.lines
        .map((l) => `<div class="mini-line"><img src="${l.image}" alt="" width="56" height="70"><div><strong>${esc(l.name)}</strong><small>${esc(l.variant)} · SL ${l.qty}</small></div><strong>${vnd(l.price * l.qty)}</strong></div>`)
        .join('');
    }
    renderSummary(aside, data);
    form.addEventListener('submit', (e) => {
      $('[data-cart-input]', form).value = JSON.stringify(cart.get());
      // Kiểm tra nhanh phía trình duyệt; máy chủ vẫn kiểm tra lại.
      const bad = $$('[required]', form).find((el) => !el.value.trim());
      if (bad) {
        e.preventDefault();
        bad.focus();
        bad.closest('.field').classList.add('has-error');
        toast('Vui lòng điền đủ các thông tin bắt buộc (*)');
        return;
      }
      const btn = $('[data-submit]', form);
      btn.disabled = true;
      btn.textContent = 'Đang gửi đơn…';
    });
    const focusMe = $('[data-focus-me]');
    if (focusMe) focusMe.focus();
  }

  // ---- Menu di động
  const drawer = $('#drawer');
  const opener = $('[data-drawer-open]');
  function setDrawer(open) {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    opener.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('[data-drawer-close].icon-btn', drawer).focus();
    else opener.focus();
  }
  if (drawer && opener) {
    opener.addEventListener('click', () => setDrawer(true));
    $$('[data-drawer-close]', drawer).forEach((b) => b.addEventListener('click', () => setDrawer(false)));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && drawer.classList.contains('open') && setDrawer(false));
  }

  // Sự kiện GA4: nhấp gọi điện / Zalo (chỉ chạy khi đã bật GA4 trong Admin).
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || typeof window.gtag !== 'function') return;
    if (a.href.startsWith('tel:')) window.gtag('event', 'click_call', { link_url: a.href });
    else if (a.href.includes('zalo.me')) window.gtag('event', 'click_zalo', { link_url: a.href });
  });

  $$('[data-autosubmit]').forEach((s) => s.addEventListener('change', () => s.form.submit()));

  // ---- Hiện dần khi cuộn
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && (en.target.classList.add('in'), io.unobserve(en.target))),
      { rootMargin: '0px 0px -8% 0px' },
    );
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });
  } else reveals.forEach((el) => el.classList.add('in'));

  updateCount();
  renderCart();
  renderCheckout();
})();
