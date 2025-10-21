const APP = (function () {
  const products = [
    {
      id: 1,
      title: "The Last Library",
      author: "A. Author",
      price: 199,
      category: "Fiction",
      image: "images/The_Last_Library_Royal+FREYA+SAMPSON+Books.webp",
      desc: "A compelling novel about memory and books.",
    },
    {
      id: 2,
      title: "Science for Everyone",
      author: "Dr S. Wise",
      price: 120,
      category: "Science",
      image: "images/scienceforeveryone.jpeg",
      desc: "Clear introductions to key scientific ideas.",
    },
    {
      id: 3,
      title: "Tiny Tales",
      author: "M. Child",
      price: 85,
      category: "Children",
      image: "images/tiny tales.jpeg",
      desc: "Short stories for the little ones.",
    },
    {
      id: 4,
      title: "Business Basics",
      author: "K. Commerce",
      price: 150,
      category: "Non-fiction",
      image: "images/business basics.webp",
      desc: "An accessible guide to starting a business.",
    },
    {
      id: 5,
      title: "Modern Poetry",
      author: "L. Lines",
      price: 90,
      category: "Fiction",
      image: "images/book1.jpg",
      desc: "Contemporary poems on life and belonging.",
    },
    {
      id: 6,
      title: "Space Explained",
      author: "N. Cosmos",
      price: 220,
      category: "Science",
      image: "images/spaceexplained.jpeg",
      desc: "A visual guide to the universe.",
    },
  ];

  const CART_KEY = "litreads_cart_v1";

  /* --- cart helpers --- */
  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  function getCartCount() {
    const cart = loadCart();
    return cart.reduce((s, i) => s + (i.quantity || 0), 0);
  }
  function addToCart(productId, qty = 1) {
    const cart = loadCart();
    const existing = cart.find((i) => i.id === productId);
    if (existing) existing.quantity += qty;
    else cart.push({ id: productId, quantity: qty });
    saveCart(cart);
    refreshCartUI();
  }
  function updateCartItem(productId, qty) {
    let cart = loadCart();
    cart = cart
      .map((i) => (i.id === productId ? { ...i, quantity: qty } : i))
      .filter((i) => i.quantity > 0);
    saveCart(cart);
    refreshCartUI();
  }
  function removeCartItem(productId) {
    let cart = loadCart();
    cart = cart.filter((i) => i.id !== productId);
    saveCart(cart);
    refreshCartUI();
  }
  function clearCart() {
    localStorage.removeItem(CART_KEY);
    refreshCartUI();
  }

  /* --- UI renderers --- */
  function renderHomeFeatured() {
    const el = document.getElementById("home-featured");
    if (!el) return;
    const featured = products.slice(0, 4);
    el.innerHTML = featured
      .map(
        (p) => `
      <div class="card">
        <img src="${p.image}" alt="${escapeHtml(p.title)}" />
        <div class="title">${escapeHtml(p.title)}</div>
        <div class="meta">${escapeHtml(p.author)}</div>
        <div class="price">R${p.price.toFixed(2)}</div>
        <div><a class="btn" href="product-detail.html?id=${p.id}">View</a></div>
      </div>
    `
      )
      .join("");
  }

  function renderProductGrid(filter = {}) {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    let list = products.slice();

    // search
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter((p) =>
        (p.title + p.author + p.desc + p.category).toLowerCase().includes(q)
      );
    }
    // category
    if (filter.category) {
      const normalizedFilterCat = filter.category.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.category && p.category.trim().toLowerCase() === normalizedFilterCat
      );
    }
    // price
    if (filter.maxPrice !== undefined) {
      list = list.filter((p) => p.price <= filter.maxPrice);
    }
    // sort
    if (filter.sort === "low") list.sort((a, b) => a.price - b.price);
    else if (filter.sort === "high") list.sort((a, b) => b.price - a.price);
    else list.reverse(); // newest first (simple reverse for sample data)

    if (list.length === 0) {
      document.getElementById("no-results").hidden = false;
      grid.innerHTML = "";
      return;
    } else {
      document.getElementById("no-results").hidden = true;
    }

    grid.innerHTML = list
      .map(
        (p) => `
      <div class="card">
        <img src="${p.image}" alt="${escapeHtml(p.title)}" />
        <div class="title">${escapeHtml(p.title)}</div>
        <div class="meta">${escapeHtml(p.author)} • ${escapeHtml(
          p.category
        )}</div>
        <div class="price">R${p.price.toFixed(2)}</div>
        <div style="display:flex;gap:.5rem;margin-top:.5rem">
          <a class="btn" href="product-detail.html?id=${p.id}">View</a>
          <button class="btn" onclick="APP.handleAdd(${
            p.id
          })">Add to cart</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  function renderProductDetail(id) {
    const wrapper = document.getElementById("product-detail");
    if (!wrapper) return;
    const p = products.find((x) => x.id === id);
    if (!p) {
      wrapper.innerHTML = "<p>Product not found.</p>";
      return;
    }
    wrapper.innerHTML = `
      <div class="product-detail">
        <div class="image card"><img src="${p.image}" alt="${escapeHtml(
      p.title
    )}" /></div>
        <div class="info card">
          <h2>${escapeHtml(p.title)}</h2>
          <div class="meta">${escapeHtml(p.author)} • ${escapeHtml(
      p.category
    )}</div>
          <p>${escapeHtml(p.desc)}</p>
          <div><strong>R${p.price.toFixed(2)}</strong></div>
          <div class="actions">
            <label>Qty <input id="pd-qty" type="number" min="1" value="1" style="width:70px;padding:.4rem;border-radius:6px;border:1px solid #ddd" /></label>
            <button class="btn btn-primary" id="pd-add">Add to cart</button>
            <a class="btn" href="cart.html">View Cart</a>
          </div>
        </div>
      </div>
    `;
    document.getElementById("pd-add").addEventListener("click", () => {
      const q = parseInt(document.getElementById("pd-qty").value) || 1;
      addToCart(p.id, q);
      alert(`${p.title} added to cart`);
    });
  }

  function renderCartPage() {
    const container = document.getElementById("cart-items");
    if (!container) return;
    const cart = loadCart();
    if (cart.length === 0) {
      container.innerHTML =
        '<p>Your cart is empty. <a href="products.html">Browse books</a>.</p>';
      document.getElementById("cart-total").textContent = "R0.00";
      return;
    }
    const rows = cart
      .map((item) => {
        const p = products.find((pp) => pp.id === item.id);
        const subtotal = p.price * item.quantity;
        return `
      <div class="cart-item">
        <img src="${p.image}" alt="${escapeHtml(p.title)}" />
        <div style="flex:1">
          <div class="title">${escapeHtml(p.title)}</div>
          <div class="meta">${escapeHtml(p.author)}</div>
          <div>R${p.price.toFixed(2)}</div>
        </div>
        <div class="qty-control">
          <button onclick="APP.adjust(${p.id}, ${Math.max(
          1,
          item.quantity - 1
        )})">-</button>
          <div style="min-width:30px;text-align:center">${item.quantity}</div>
          <button onclick="APP.adjust(${p.id}, ${item.quantity + 1})">+</button>
        </div>
        <div style="width:120px;text-align:right">R${subtotal.toFixed(2)}</div>
        <div style="width:80px;text-align:right"><button onclick="APP.remove(${
          p.id
        })">Remove</button></div>
      </div>
      `;
      })
      .join("");
    container.innerHTML = rows;
    const total = cart.reduce(
      (s, i) => s + products.find((p) => p.id === i.id).price * i.quantity,
      0
    );
    document.getElementById("cart-total").textContent = `R${total.toFixed(2)}`;
  }

  /* --- utility functions --- */
  function populateCategoryOptions() {
    const select = document.getElementById("category-filter");
    if (!select) return;
    const cats = Array.from(new Set(products.map((p) => p.category)));
    cats.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );
  }

  /* --- small UI refreshers --- */
  function refreshCartUI() {
    // update cart counts on all spots
    document
      .querySelectorAll(
        "#cart-count, #cart-count-2, #cart-count-3, #cart-count-4"
      )
      .forEach((el) => {
        if (el) el.textContent = getCartCount();
      });
    // update cart pages if present
    renderCartPage();
  }

  /* --- event handlers exposed to global (for inline onclick) --- */
  function handleAdd(id) {
    addToCart(id, 1);
    alert("Added to cart");
  }

  function adjust(id, qty) {
    updateCartItem(id, qty);
  }

  function remove(id) {
    removeCartItem(id);
  }

  /* --- checkout & forms --- */
  function initCheckout() {
    const form = document.getElementById("checkout-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // basic validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      // show confirmation and clear cart
      document.getElementById("checkout-confirm").hidden = false;
      clearCart();
      form.reset();
    });
  }

  function initContact() {
    const f = document.getElementById("contact-form");
    if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!f.checkValidity()) {
        f.reportValidity();
        return;
      }
      document.getElementById("contact-confirm").hidden = false;
      f.reset();
    });
  }

  function initNewsletter() {
    const nf = document.getElementById("newsletter-form");
    if (!nf) return;
    nf.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Thanks for subscribing! (simulated)");
      nf.reset();
    });
  }

  /* --- page init routine --- */
  function init() {
    // common renders
    renderHomeFeatured();
    populateCategoryOptions();
    refreshCartUI();
    initNewsletter();
    initContact();
    initCheckout();

    // if on products page -> wire controls
    const productGrid = document.getElementById("product-grid");
    if (productGrid !== null) {
      const urlParams = new URLSearchParams(location.search);
      const presetCat = urlParams.get("category") || "";
      const searchInput = document.getElementById("search");
      const categoryFilter = document.getElementById("category-filter");
      const sortEl = document.getElementById("sort");
      const priceEl = document.getElementById("price-filter");
      const priceValue = document.getElementById("price-value");

      if (presetCat) categoryFilter.value = presetCat;

      // initial render
      const doRender = () =>
        renderProductGrid({
          q: searchInput.value,
          category: categoryFilter.value,
          sort: sortEl.value,
          maxPrice: parseFloat(priceEl.value),
        });

      priceValue.textContent = priceEl.value;
      searchInput?.addEventListener("input", doRender);
      categoryFilter?.addEventListener("change", doRender);
      sortEl?.addEventListener("change", doRender);
      priceEl?.addEventListener("input", () => {
        priceValue.textContent = priceEl.value;
        doRender();
      });

      // render first time
      doRender();
    }

    // product detail
    const pd = document.getElementById("product-detail");
    if (pd !== null) {
      const id = parseInt(new URLSearchParams(location.search).get("id"), 10);
      renderProductDetail(id);
    }
  }

  /* --- expose public API for inline calls --- */
  return {
    init,
    handleAdd,
    adjust,
    remove,
    addToCart,
    products, // exported for easy editing in dev
  };
})();

/* expose to window so inline onclicks work */
window.APP = APP;

/* init on DOM ready */
document.addEventListener("DOMContentLoaded", () => {
  APP.init();

  // Dark mode toggle (works for all pages)
  document.querySelectorAll("#dark-mode-toggle").forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      document.documentElement.classList.toggle("dark-mode");
    });
  });
  // Apply dark mode from localStorage
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark-mode");
    document.documentElement.classList.add("dark-mode");
  }

  // Dark mode toggle (works for all pages)
  document.querySelectorAll("#dark-mode-toggle").forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      document.documentElement.classList.toggle("dark-mode", isDark);
      localStorage.setItem("darkMode", isDark ? "on" : "off");
    });
  });
});
