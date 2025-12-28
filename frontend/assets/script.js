;(() => {
  const INR_RATE = 83 // simple USD→INR conversion
  const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)

  const fmt = (n) => fmtINR(n)

  // Footer year
  const y = document.getElementById("year")
  if (y) y.textContent = String(new Date().getFullYear())

  // Authentication management - verify with backend and toggle nav
  async function checkAuth() {
    const token = localStorage.getItem('foody_token');
    const navAuth = document.getElementById('nav-auth');
    const navUser = document.getElementById('nav-user');

    if (!token) {
      localStorage.removeItem('foody_user');
      if (navAuth) navAuth.style.display = 'flex';
      if (navUser) navUser.style.display = 'none';
      return null;
    }

    try {
      const me = await window.foodAPI.me();
      if (me && me.user) {
        if (navAuth) navAuth.style.display = 'none';
        if (navUser) navUser.style.display = 'flex';
        return me.user;
      }
    } catch (e) {
      // Token invalid/expired; clear session state
      localStorage.removeItem('foody_token');
      localStorage.removeItem('foody_user');
    }

    if (navAuth) navAuth.style.display = 'flex';
    if (navUser) navUser.style.display = 'none';
    return null;
  }

  // Redirect to login if page is protected
  async function guardProtectedPages() {
    const protectedPaths = ['dashboard.html', 'profile.html', 'order.html'];
    const isProtected = protectedPaths.some(p => location.pathname.endsWith(p));
    if (!isProtected) return;

    const user = await checkAuth();
    if (!user) {
      const params = new URLSearchParams({ redirect: location.pathname });
      window.location.href = `login.html?${params.toString()}`;
    }
  }

  // Enhanced authentication functions
  async function loginUser(email, password) {
    try {
      const response = await window.foodAPI.login(email, password);
      checkAuth();
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async function registerUser(userData) {
    try {
      const response = await window.foodAPI.register(userData);
      checkAuth();
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async function logoutUser() {
    try {
      await window.foodAPI.logout();
      checkAuth();
      // Clear local cart on logout
      localStorage.removeItem('dd_cart');
      updateNavCartCount();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // Initialize auth check + guard
  checkAuth();
  guardProtectedPages();

  // Location functionality with pincode API
  function initLocationSelector() {
    const pincodeInput = document.getElementById('pincode-input');
    const locationSelect = document.getElementById('location-select');
    const searchBtn = document.getElementById('location-search-btn');
    
    if (!pincodeInput || !locationSelect || !searchBtn) return;

    // Enable search button when pincode is entered
    pincodeInput.addEventListener('input', function() {
      const pincode = this.value.trim();
      if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
        searchBtn.disabled = false;
      } else {
        searchBtn.disabled = true;
        locationSelect.disabled = true;
        locationSelect.innerHTML = '<option value="">Select City</option>';
      }
    });

    // Search for cities by pincode
    searchBtn.addEventListener('click', async function() {
      const pincode = pincodeInput.value.trim();
      if (pincode.length !== 6) return;

      searchBtn.textContent = '⏳';
      searchBtn.disabled = true;

      try {
        // Using a free pincode API (you can replace with your preferred API)
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
          const postOffices = data[0].PostOffice;
          const cities = [...new Set(postOffices.map(po => po.District))];
          
          // Add popular cities like Surat and Rajkot if not found
          const popularCities = ['Surat', 'Rajkot', 'Ahmedabad', 'Vadodara', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai'];
          popularCities.forEach(city => {
            if (!cities.includes(city)) {
              cities.push(city);
            }
          });
          
          locationSelect.innerHTML = '<option value="">Select City</option>';
          cities.sort().forEach(city => {
            const option = document.createElement('option');
            option.value = city.toLowerCase().replace(/\s+/g, '-');
            option.textContent = city;
            locationSelect.appendChild(option);
          });
          
          locationSelect.disabled = false;
          
          // Show success message
          showLocationMessage(`Found ${cities.length} cities for pincode ${pincode}`, 'success');
        } else {
          showLocationMessage(`No cities found for pincode ${pincode}`, 'error');
        }
      } catch (error) {
        console.error('Error fetching location data:', error);
        showLocationMessage('Error fetching location data. Please try again.', 'error');
      } finally {
        searchBtn.textContent = '🔍';
        searchBtn.disabled = false;
      }
    });

    // Handle city selection
    locationSelect.addEventListener('change', function() {
      if (this.value) {
        const selectedCity = this.options[this.selectedIndex].textContent;
        showLocationMessage(`Selected: ${selectedCity}`, 'success');
        
        // Store selected location in localStorage
        localStorage.setItem('foody_location', JSON.stringify({
          pincode: pincodeInput.value,
          city: selectedCity,
          timestamp: Date.now()
        }));
      }
    });

    // Load saved location on page load
    const savedLocation = localStorage.getItem('foody_location');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        // Check if location is not too old (24 hours)
        if (Date.now() - location.timestamp < 24 * 60 * 60 * 1000) {
          pincodeInput.value = location.pincode;
          // Auto-search for saved location
          setTimeout(() => {
            if (pincodeInput.value.length === 6) {
              searchBtn.click();
              // Set the saved city after a short delay
              setTimeout(() => {
                const options = Array.from(locationSelect.options);
                const savedOption = options.find(opt => opt.textContent === location.city);
                if (savedOption) {
                  locationSelect.value = savedOption.value;
                }
              }, 1000);
            }
          }, 500);
        }
      } catch (error) {
        console.error('Error loading saved location:', error);
      }
    }
  }

  function showLocationMessage(message, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.location-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create new message
    const messageEl = document.createElement('div');
    messageEl.className = `location-message ${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${type === 'success' ? '#dcfce7' : '#fef2f2'};
      color: ${type === 'success' ? '#166534' : '#dc2626'};
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'};
      font-size: 0.875rem;
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(messageEl);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
      }
    }, 3000);
  }

  // Add CSS animations for messages
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Initialize location selector
  initLocationSelector();

  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      await logoutUser();
      window.location.href = 'index.html';
    });
  }

  // CART persistence - Enhanced with API integration
  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem("dd_cart") || "[]")
    } catch {
      return []
    }
  }
  
  async function saveCart(items) {
    localStorage.setItem("dd_cart", JSON.stringify(items))
    updateNavCartCount()
    
    // Sync with backend if user is logged in
    if (window.foodAPI && window.foodAPI.token) {
      try {
        await window.foodAPI.clearCart()
        for (const item of items) {
          await window.foodAPI.addToCart(item)
        }
      } catch (error) {
        console.error('Failed to sync cart with backend:', error)
      }
    }
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
          const restaurantId = card.getAttribute("data-restaurant-id") || null
          const key = JSON.stringify({ id, mult, mods, notes, restaurantId })
          const existing = cart.find((it) => it.key === key)
          if (existing) {
            existing.qty += 1
          } else {
            cart.push({
              key,
              id,
              menuItemId: id,
              restaurantId: restaurantId,
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

        const buttons = left.querySelectorAll("button")
        const decBtn = buttons[0]  // Decrease button
        const incBtn = buttons[1]  // Increase button  
        const removeBtn = buttons[2]  // Remove button

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

      const DELIVERY_USD = 0.2
      const delivery = cart.length ? Math.round(DELIVERY_USD * INR_RATE) : 0
      if (subtotalEl) subtotalEl.textContent = fmt(subtotal)
      if (deliveryEl) deliveryEl.textContent = fmt(delivery)
      if (totalEl) totalEl.textContent = fmt(subtotal + delivery)
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", async () => {
        const cart = loadCart()
        if (cart.length === 0) {
          alert("Your cart is empty!")
          return
        }

        // Check if user is logged in
        const token = localStorage.getItem('foody_token')
        if (!token) {
          alert("Please login to place an order")
          window.location.href = 'login.html'
          return
        }

        // Group cart items by restaurant
        const itemsByRestaurant = {}
        cart.forEach(item => {
          const restId = item.restaurantId
          if (!restId) {
            alert("Some items in your cart are missing restaurant information. Please remove them and try again.")
            return
          }
          if (!itemsByRestaurant[restId]) {
            itemsByRestaurant[restId] = []
          }
          itemsByRestaurant[restId].push(item)
        })

        try {
          // Create orders for each restaurant (one order per restaurant)
          for (const [restaurantId, items] of Object.entries(itemsByRestaurant)) {
            // Calculate totals
            let totalPrice = 0
            const orderItems = items.map(item => {
              const itemTotal = item.unitPrice * item.qty
              totalPrice += itemTotal
              return {
                name: item.name,
                quantity: item.qty,
                price: item.unitPrice,
                menuItem: item.menuItemId || item.id,
                notes: item.notes || item.options?.notes || ''
              }
            })

            const deliveryFee = 50 // Fixed delivery fee
            const taxAmount = totalPrice * 0.05 // 5% tax
            const grandTotal = totalPrice + deliveryFee + taxAmount

            // Get user's delivery address (simplified - you'd get this from user profile)
            const userStr = localStorage.getItem('foody_user')
            const user = userStr ? JSON.parse(userStr) : null

            const orderData = {
              restaurant: restaurantId,
              items: orderItems,
              totalPrice: totalPrice,
              deliveryFee: deliveryFee,
              taxAmount: taxAmount,
              grandTotal: grandTotal,
              paymentMethod: 'COD',
              deliveryAddress: {
                street: user?.address?.line1 || '123 Main St',
                city: user?.address?.city || 'City',
                postalCode: user?.address?.postalCode || '12345',
                country: 'India'
              }
            }

            if (window.foodAPI) {
              const response = await window.foodAPI.createOrder(orderData)
              if (!response || !response.success) {
                throw new Error(response?.message || 'Failed to create order')
              }
            } else {
              throw new Error('API not available')
            }
          }

          alert("Order placed successfully!\nThank you for your order.")
          saveCart([])
          render()
          // Redirect to orders/dashboard
          window.location.href = 'dashboard.html'
        } catch (error) {
          console.error('Error placing order:', error)
          alert("Error placing order: " + (error.message || "Please try again"))
        }
      })
    }

    render()
  }
  initCartPage()
})()
