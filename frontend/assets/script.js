;(() => {
  const INR_RATE = 83 // simple USD→INR conversion
  const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)

  const fmt = (n) => fmtINR(n)

  // Footer year
  const y = document.getElementById("year")
  if (y) y.textContent = String(new Date().getFullYear())

  // CART persistence
  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem("dd_cart") || "[]")
    } catch {
      return []
    }
  }
  function saveCart(items) {
    localStorage.setItem("dd_cart", JSON.stringify(items))
    updateNavCartCount()
  }
  function updateNavCartCount() {
    const link = document.getElementById("nav-cart-link")
    if (!link) return
    const items = loadCart()
    const count = items.reduce((sum, it) => sum + (it.qty || 1), 0)
    link.textContent = count > 0 ? `Cart (${count})` : "Cart"
  }
  updateNavCartCount()

  // MENU dynamic price + add-to-cart
  function initMenuCards() {
    const cards = document.querySelectorAll(".menu-item")
    cards.forEach((card) => {
      const baseUsd = Number.parseFloat(card.getAttribute("data-base-price") || "0")
      const form = card.querySelector(".menu-form")
      const priceEl = card.querySelector("[data-price]")
      const select = form?.querySelector('select[name="size"]')
      const button = form?.querySelector(".add-to-cart")

      function compute() {
        const mult = Number.parseFloat(select?.value || "1")
        const priceInr = baseUsd * mult * INR_RATE
        if (priceEl) priceEl.textContent = fmt(priceInr)
        return priceInr
      }

      if (select) select.addEventListener("change", compute)
      compute()

      if (button) {
        button.addEventListener("click", () => {
          const id = card.getAttribute("data-id") || ""
          const name = card.querySelector(".h4")?.textContent?.trim() || "Item"
          const mult = Number.parseFloat(select?.value || "1")
          const unitPriceInr = baseUsd * mult * INR_RATE
          const notes = form?.querySelector('input[name="notes"]')?.value?.trim() || ""
          const mods = Array.from(form?.querySelectorAll('input[name="mods"]:checked') || []).map((el) => el.value)

          const cart = loadCart()
          const key = JSON.stringify({ id, mult, mods, notes })
          const existing = cart.find((it) => it.key === key)
          if (existing) {
            existing.qty += 1
          } else {
            cart.push({
              key,
              id,
              name,
              unitPrice: Math.round(unitPriceInr),
              qty: 1,
              options: { sizeMultiplier: mult, mods, notes },
            })
          }
          saveCart(cart)

          button.textContent = "Added!"
          setTimeout(() => (button.textContent = "Add to Cart"), 1000)
        })
      }
    })
  }
  initMenuCards()

  // RESTAURANT filters
  function initRestaurantFilters() {
    const form = document.getElementById("restaurant-filters")
    const list = document.getElementById("restaurant-list")
    if (!form || !list) return

    const cuisineSel = form.querySelector('select[name="cuisine"]')
    const priceSel = form.querySelector('select[name="price"]')
    const ratingSel = form.querySelector('select[name="rating"]')
    const dietChecks = form.querySelectorAll('input[name="diet"]')
    const resetBtn = document.getElementById("reset-filters")

    function norm(str) {
      return (str || "").toLowerCase().trim()
    }

    function applyFilters() {
      const cuisine = norm(cuisineSel?.value)
      const price = (priceSel?.value || "").trim()
      const minRating = Number.parseFloat(ratingSel?.value || "0")
      const diets = Array.from(dietChecks)
        .filter((c) => c.checked)
        .map((c) => norm(c.value))

      const cards = list.querySelectorAll(".restaurant-card")
      cards.forEach((card) => {
        const c = norm(card.getAttribute("data-cuisine"))
        const p = (card.getAttribute("data-price") || "").trim()
        const d = (card.getAttribute("data-dietary") || "").split(",").map(norm).filter(Boolean)
        const r = Number.parseFloat(card.getAttribute("data-rating") || "0")

        let show = true
        if (cuisine && c !== cuisine) show = false
        if (price && p !== price) show = false
        if (!isNaN(minRating) && minRating > 0 && r < minRating) show = false
        if (diets.length > 0) {
          for (const need of diets) {
            if (!d.includes(need)) {
              show = false
              break
            }
          }
        }
        card.style.display = show ? "" : "none"
      })
    }

    form.addEventListener("change", applyFilters)
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        setTimeout(applyFilters, 0)
      })
    }
    applyFilters()
  }
  initRestaurantFilters()

  // ORDER page cart rendering
  function initCartPage() {
    const listEl = document.getElementById("cart-list")
    const emptyEl = document.getElementById("cart-empty")
    const contEl = document.getElementById("cart-container")
    if (!listEl || !emptyEl || !contEl) return

    const subtotalEl = document.getElementById("subtotal")
    const deliveryEl = document.getElementById("delivery")
    const totalEl = document.getElementById("total")
    const checkoutBtn = document.getElementById("checkout")

    function render() {
      const cart = loadCart()
      if (cart.length === 0) {
        emptyEl.hidden = false
        contEl.hidden = true
        return
      }
      emptyEl.hidden = true
      contEl.hidden = false

      listEl.innerHTML = ""
      let subtotal = 0
      cart.forEach((it, idx) => {
        const li = document.createElement("li")
        li.className = "cart-item"

        const opts = []
        if (it.options?.sizeMultiplier && it.options.sizeMultiplier !== 1) {
          opts.push(`Size x${it.options.sizeMultiplier}`)
        }
        if (it.options?.mods?.length) {
          opts.push(`Mods: ${it.options.mods.join(", ")}`)
        }
        if (it.options?.notes) {
          opts.push(`Notes: ${it.options.notes}`)
        }

        const left = document.createElement("div")
        left.innerHTML = `
          <h4 class="h4">${it.name}</h4>
          <p class="muted">${opts.join(" • ") || "No customizations"}</p>
          <div class="qty-controls" aria-label="Quantity controls for ${it.name}">
            <button aria-label="Decrease quantity">−</button>
            <span>${it.qty}</span>
            <button aria-label="Increase quantity">+</button>
            <button aria-label="Remove item" style="margin-left: .5rem;">Remove</button>
          </div>
        `

        const right = document.createElement("div")
        right.innerHTML = `<strong>${fmt(it.unitPrice * it.qty)}</strong>`

        li.appendChild(left)
        li.appendChild(right)
        listEl.appendChild(li)

        subtotal += it.unitPrice * it.qty

        const [decBtn, , incBtn, removeBtn] = left.querySelectorAll("button")

        incBtn.addEventListener("click", () => {
          const c = loadCart()
          c[idx].qty += 1
          saveCart(c)
          render()
        })
        decBtn.addEventListener("click", () => {
          const c = loadCart()
          c[idx].qty = Math.max(1, c[idx].qty - 1)
          saveCart(c)
          render()
        })
        removeBtn.addEventListener("click", () => {
          const c = loadCart()
          c.splice(idx, 1)
          saveCart(c)
          render()
        })
      })

      const DELIVERY_USD = 3.99
      const delivery = cart.length ? Math.round(DELIVERY_USD * INR_RATE) : 0
      if (subtotalEl) subtotalEl.textContent = fmt(subtotal)
      if (deliveryEl) deliveryEl.textContent = fmt(delivery)
      if (totalEl) totalEl.textContent = fmt(subtotal + delivery)
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        alert("Checkout complete! (Demo)\nThank you for your order.")
        saveCart([])
        render()
      })
    }

    render()
  }
  initCartPage()
})()
