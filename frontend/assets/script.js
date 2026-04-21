;(() => {
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
          await window.foodAPI.addToCart({
            restaurantId: item.restaurantId,
            menuItemId: item.menuItemId || item.id,
            quantity: item.qty || 1
          })
        }
      } catch (error) {
        console.error('Failed to sync cart with backend:', error)
      }
    }
  }
  window.foodyCart = {
    load: loadCart,
    save: saveCart,
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
      const basePrice = Number.parseFloat(card.getAttribute("data-base-price") || "0")
      const form = card.querySelector(".menu-form")
      const priceEl = card.querySelector("[data-price]")
      const qtySelect = form?.querySelector('select[name="size"], select[name="quantity"]')

      function compute() {
        const qty = Math.max(1, Number.parseInt(qtySelect?.value || "1", 10))
        const total = basePrice * qty
        if (priceEl) priceEl.textContent = fmt(total)
        return { qty, total }
      }

      if (qtySelect) qtySelect.addEventListener("change", compute)
      compute()
    })
  }
  window.foodyInitMenuCards = initMenuCards

  async function addMenuItemToCartFromCard(card) {
    const id = card.getAttribute("data-id") || card.dataset.id || ""
    const restaurantId = card.getAttribute("data-restaurant-id") || card.dataset.restaurantId || null
    const name = card.querySelector(".h4")?.textContent?.trim() || "Item"
    const basePrice = Number.parseFloat(card.getAttribute("data-base-price") || card.dataset.basePrice || "0")
    const form = card.querySelector(".menu-form")
    const qtySelect = form?.querySelector('select[name="size"], select[name="quantity"]')
    const qty = Math.max(1, Number.parseInt(qtySelect?.value || "1", 10))
    const notes = form?.querySelector('input[name="notes"]')?.value?.trim() || ""
    const mods = Array.from(form?.querySelectorAll('input[name="mods"]:checked') || []).map((el) => el.value)

    if (!restaurantId) {
      alert("Please pick a restaurant first.")
      window.location.href = "restaurants.html"
      return
    }

    const cart = loadCart()
    const key = JSON.stringify({ id, restaurantId, notes, mods })
    const existing = cart.find((it) => it.key === key)
    if (existing) {
      existing.qty += qty
    } else {
      cart.push({
        key,
        id,
        menuItemId: id,
        restaurantId,
        name,
        unitPrice: Math.round(basePrice),
        qty,
        options: { mods, notes },
      })
    }
    await saveCart(cart)
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

      const delivery = cart.length ? 50 : 0
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
                street: user?.addresses?.find(a => a.isDefault)?.street || user?.addresses?.[0]?.street || '123 Main St',
                city: user?.addresses?.find(a => a.isDefault)?.city || user?.addresses?.[0]?.city || 'City',
                postalCode: user?.addresses?.find(a => a.isDefault)?.zipCode || user?.addresses?.[0]?.zipCode || '12345',
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
  // Mobile Menu Toggle
  // PROFILE PAGE handling
  async function initProfilePage() {
    const personalForm = document.getElementById('personal-form');
    if (!personalForm) return;

    // Load user profile data
    async function loadUserProfile() {
      try {
        const user = await window.foodAPI.me();
        if (!user || !user.user) return;

        const userData = user.user;

        // Populate form fields
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const birthdayInput = document.getElementById('birthday');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const avatarInitials = document.getElementById('avatar-initials');

        if (firstNameInput) firstNameInput.value = userData.firstName || '';
        if (lastNameInput) lastNameInput.value = userData.lastName || '';
        if (emailInput) emailInput.value = userData.email || '';
        if (phoneInput) phoneInput.value = userData.phone || '';
        if (birthdayInput && userData.birthday) {
          birthdayInput.value = new Date(userData.birthday).toISOString().split('T')[0];
        }

        // Update profile header
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || 'User';
        if (profileName) profileName.textContent = fullName;
        if (profileEmail) profileEmail.textContent = userData.email;

        // Update avatar initials
        const initials = (userData.firstName?.charAt(0) || 'U') + (userData.lastName?.charAt(0) || '');
        if (avatarInitials) avatarInitials.textContent = initials.toUpperCase();
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }

    // Handle form submission
    personalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstNameInput = document.getElementById('firstName');
      const lastNameInput = document.getElementById('lastName');
      const phoneInput = document.getElementById('phone');
      const birthdayInput = document.getElementById('birthday');

      try {
        const updateData = {
          firstName: firstNameInput.value || '',
          lastName: lastNameInput.value || '',
          phone: phoneInput.value || '',
          birthday: birthdayInput.value ? new Date(birthdayInput.value) : null
        };

        // Call API to update user profile
        const result = await window.foodAPI.updateUserProfile(updateData);

        if (result && result.success) {
          alert('Profile updated successfully!');
          // Refresh the profile data
          await loadUserProfile();
        } else {
          alert(result?.message || 'Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        alert(error?.message || 'Failed to update profile');
      }
    });

    // Load profile data on page load
    await loadUserProfile();
  }

  initProfilePage();

  // CART POPUP - Show modal when item is added to cart
  function initAddToCartPopup() {
    // Create modal HTML if it doesn't exist
    let modal = document.getElementById('cart-popup-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cart-popup-modal';
      modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        align-items: center;
        justify-content: center;
      `;
      modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 0.5rem; text-align: center; animation: popIn 0.3s ease; box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);">
          <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem; color: #2d3748;">✅ Item Added to Cart</h3>
          <p style="margin: 0 0 1.5rem 0; color: #718096; font-size: 0.95rem;">Your item has been added successfully</p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button id="popup-continue-shopping" style="padding: 0.75rem 1.5rem; background: #f7fafc; border: 1px solid #cbd5e0; border-radius: 0.375rem; cursor: pointer; font-weight: 600; transition: background 0.2s;">Continue Shopping</button>
            <button id="popup-view-cart" style="padding: 0.75rem 1.5rem; background: #3182ce; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600; transition: background 0.2s;">View Cart</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Add animation styles
      const style = document.createElement('style');
      style.textContent = `
        @keyframes popIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        #popup-continue-shopping:hover { background: #edf2f7; }
        #popup-view-cart:hover { background: #2c5aa0; }
      `;
      document.head.appendChild(style);
    }

    // Override the add-to-cart button click handler to show modal
    // We need to replace the existing event listener
    const originalHandler = document.addEventListener;
    let handlerAttached = false;

    // Only attach once
    if (!window.addToCartPopupAttached) {
      window.addToCartPopupAttached = true;
      
      document.addEventListener('click', async (e) => {
        const btn = e.target?.closest?.('.add-to-cart');
        if (!btn) return;
        const card = btn.closest('.menu-item');
        if (!card) return;
        e.preventDefault();
        e.stopPropagation();

        const originalText = btn.textContent;
        btn.disabled = true;
        try {
          await addMenuItemToCartFromCard(card);
          btn.textContent = '✅ Added!';

          // Show cart popup modal
          const modalEl = document.getElementById('cart-popup-modal');
          if (modalEl) {
            modalEl.style.display = 'flex';

            // Handle popup buttons
            const continueBtn = document.getElementById('popup-continue-shopping');
            const viewCartBtn = document.getElementById('popup-view-cart');

            const closeModal = () => {
              modalEl.style.display = 'none';
            };

            const handleContinue = () => {
              closeModal();
            };

            const handleViewCart = () => {
              window.location.href = 'order.html';
            };

            if (continueBtn) continueBtn.onclick = handleContinue;
            if (viewCartBtn) viewCartBtn.onclick = handleViewCart;

            // Close modal when clicking outside
            const handleBackdropClick = (event) => {
              if (event.target === modalEl) {
                closeModal();
              }
            };
            modalEl.onclick = handleBackdropClick;

            // Auto close after 2 seconds if user doesn't click
            const autoCloseTimeout = setTimeout(closeModal, 2000);

            // Update click handlers to clear timeout
            if (continueBtn) {
              continueBtn.onclick = () => {
                clearTimeout(autoCloseTimeout);
                handleContinue();
              };
            }
            if (viewCartBtn) {
              viewCartBtn.onclick = () => {
                clearTimeout(autoCloseTimeout);
                handleViewCart();
              };
            }
          }

          setTimeout(() => {
            btn.textContent = originalText;
          }, 1200);
        } catch (err) {
          console.error('Add to cart failed:', err);
          alert(err?.message || 'Failed to add to cart');
        } finally {
          btn.disabled = false;
        }
      }, true); // Use capture phase to ensure this runs before other handlers
    }
  }

  initAddToCartPopup();

  // =================================================================
  // FORM WITH LIVE PREVIEW - For Beautiful Form Filling Effects
  // =================================================================
  // =================================================================
  // SOCKET.IO REAL-TIME ORDER TRACKING
  // =================================================================
  window.orderRealtimeUtils = {
    io: null,
    currentOrderId: null,
    listeners: {},

    // Show notification for order status change
    showOrderStatusNotification(data) {
      const { orderId, newStatus, message } = data;
      
      const notification = document.createElement('div');
      notification.className = 'order-status-notification success';
      notification.innerHTML = `
        <button class="notification-close">✕</button>
        <div class="notification-header">
          <div class="notification-icon">✓</div>
          <h4 class="notification-title">Order Updated</h4>
        </div>
        <p class="notification-message">${message || `Order status updated to ${newStatus}`}</p>
      `;

      document.body.appendChild(notification);

      // Close button handler
      notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      });

      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (notification.parentElement) {
          notification.style.animation = 'slideOut 0.3s ease';
          setTimeout(() => notification.remove(), 300);
        }
      }, 5000);
    },

    // Initialize Socket.io connection
    initSocket() {
      // Load Socket.io library dynamically
      if (typeof io === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
        script.onload = () => {
          this._connectSocket();
        };
        document.head.appendChild(script);
      } else {
        this._connectSocket();
      }
    },

    _connectSocket() {
      // Get server URL
      const socketURL = window.API_BASE_URL ? 
        window.API_BASE_URL.replace('/api', '') : 
        window.location.origin;

      this.io = io(socketURL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.io.on('connect', () => {
        console.log('Socket connected:', this.io.id);
      });

      this.io.on('order-status-changed', (data) => {
        console.log('Order status changed:', data);
        this.showOrderStatusNotification(data);
        this._notifyListeners('order-status-changed', data);
      });

      this.io.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    },

    // Join order room for real-time updates
    joinOrderRoom(orderId, userId) {
      if (!this.io) {
        this.initSocket();
      }
      
      this.currentOrderId = orderId;
      this.io.emit('join-order', orderId, userId);
      console.log(`Joined order room: order-${orderId}`);
    },

    // Leave order room
    leaveOrderRoom(orderId) {
      if (this.io && orderId) {
        this.io.emit('leave-order', orderId);
        this.currentOrderId = null;
      }
    },

    // Listen for order status changes
    onOrderStatusChanged(callback) {
      this._addListener('order-status-changed', callback);
    },

    // Add event listener
    _addListener(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    },

    // Notify all listeners
    _notifyListeners(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(callback => {
          callback(data);
        });
      }
    },

    // Disconnect
    disconnect() {
      if (this.io) {
        this.io.disconnect();
        this.io = null;
      }
    }
  };

  // Initialize Socket.io when page loads
  window.addEventListener('load', () => {
    window.orderRealtimeUtils.initSocket();
  });

  // =================================================================
  // MULTI-RESTAURANT CART MANAGEMENT
  // =================================================================
  // =================================================================
  // GOOGLE MAPS INTEGRATION
  // =================================================================
  window.mapsUtils = {
    map: null,
    markers: [],
    infoWindows: [],
    GOOGLE_MAPS_API_KEY: 'AIzaSyDxd1d5xWz8PZdKEzEV-sN-Z_5P-9qM7k4',
    DEFAULT_CENTER: { lat: 22.3039, lng: 70.8022 }, // Rajkot, Gujarat

    // Load Google Maps API
    loadGoogleMapsAPI() {
      if (window.google && window.google.maps) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },

    // Initialize map on element
    async initMap(elementId, center = this.DEFAULT_CENTER, zoom = 12) {
      try {
        await this.loadGoogleMapsAPI();

        const element = document.getElementById(elementId);
        if (!element) return null;

        this.map = new google.maps.Map(element, {
          center,
          zoom,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true
        });

        return this.map;
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    },

    // Add marker to map
    addMarker(position, title, icon = null) {
      if (!this.map) return null;

      const marker = new google.maps.Marker({
        position,
        map: this.map,
        title,
        icon
      });

      this.markers.push(marker);
      return marker;
    },

    // Add info window to marker
    addInfoWindow(marker, content) {
      const infoWindow = new google.maps.InfoWindow({ content });
      marker.addListener('click', () => {
        this.infoWindows.forEach(iw => iw.close());
        infoWindow.open(this.map, marker);
      });
      this.infoWindows.push(infoWindow);
      return infoWindow;
    },

    // Clear all markers
    clearMarkers() {
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];
      this.infoWindows = [];
    },

    // Pan to location
    panTo(location) {
      if (this.map) {
        this.map.panTo(location);
      }
    },

    // Get current user location
    async getCurrentLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    },

    // Calculate distance between two coordinates
    calculateDistance(from, to) {
      const R = 6371; // Earth's radius in km
      const dLat = ((to.lat - from.lat) * Math.PI) / 180;
      const dLng = ((to.lng - from.lng) * Math.PI) / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },

    // Get address from coordinates (reverse geocoding)
    async getAddressFromCoordinates(lat, lng) {
      await this.loadGoogleMapsAPI();
      
      return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error('Geocoding failed'));
          }
        });
      });
    },

    // Get coordinates from address
    async getCoordinatesFromAddress(address) {
      await this.loadGoogleMapsAPI();
      
      return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              address: results[0].formatted_address
            });
          } else {
            reject(new Error('Geocoding failed'));
          }
        });
      });
    },

    // Watch delivery boy location (simulate with updates)
    watchDeliveryLocation(orderId, onLocationUpdate) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          onLocationUpdate({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          });
        },
        (error) => console.error('Location watch error:', error),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );

      return watchId;
    }
  };

  window.multiRestaurantCart = {
    STORAGE_KEY: 'foody_multi_restaurant_cart',

    // Get cart from localStorage
    load() {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : { restaurants: {} };
      } catch (e) {
        console.error('Error loading cart:', e);
        return { restaurants: {} };
      }
    },

    // Save cart to localStorage
    save(cart) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
      } catch (e) {
        console.error('Error saving cart:', e);
      }
    },

    // Add item to cart for a specific restaurant
    addItem(restaurantId, restaurantName, item) {
      const cart = this.load();
      
      // Initialize restaurant section if not exists
      if (!cart.restaurants[restaurantId]) {
        cart.restaurants[restaurantId] = {
          id: restaurantId,
          name: restaurantName,
          items: []
        };
      }

      // Check if item already exists
      const existingItem = cart.restaurants[restaurantId].items.find(
        it => it.menuItemId === item.menuItemId && it.customizations === item.customizations
      );

      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
      } else {
        cart.restaurants[restaurantId].items.push({
          ...item,
          quantity: item.quantity || 1
        });
      }

      this.save(cart);
      return cart;
    },

    // Remove item from cart
    removeItem(restaurantId, itemKey) {
      const cart = this.load();
      
      if (cart.restaurants[restaurantId]) {
        cart.restaurants[restaurantId].items = cart.restaurants[restaurantId].items.filter(
          item => item.key !== itemKey
        );

        // Remove restaurant section if no items left
        if (cart.restaurants[restaurantId].items.length === 0) {
          delete cart.restaurants[restaurantId];
        }
      }

      this.save(cart);
      return cart;
    },

    // Update item quantity
    updateQuantity(restaurantId, itemKey, quantity) {
      const cart = this.load();
      
      if (cart.restaurants[restaurantId]) {
        const item = cart.restaurants[restaurantId].items.find(it => it.key === itemKey);
        if (item) {
          if (quantity <= 0) {
            return this.removeItem(restaurantId, itemKey);
          }
          item.quantity = quantity;
          this.save(cart);
        }
      }

      return cart;
    },

    // Clear all items
    clear() {
      this.save({ restaurants: {} });
    },

    // Get total count
    getItemCount() {
      const cart = this.load();
      let count = 0;
      Object.values(cart.restaurants).forEach(restaurant => {
        restaurant.items.forEach(item => {
          count += item.quantity || 1;
        });
      });
      return count;
    },

    // Get restaurants in cart
    getRestaurants() {
      const cart = this.load();
      return Object.values(cart.restaurants);
    }
  };

  window.formPreviewUtils = {
    // Initialize a form with live preview
    initFormPreview(formSelector, previewSelector, fieldMap) {
      const form = document.querySelector(formSelector);
      const preview = document.querySelector(previewSelector);
      
      if (!form || !preview) return;

      // Get all input elements
      const inputs = form.querySelectorAll('input, textarea, select');

      // Set up listeners for each input
      inputs.forEach((input) => {
        input.addEventListener('input', () => {
          this.updatePreview(preview, form, fieldMap);
          this.updateProgressIndicator(form, fieldMap);
        });

        input.addEventListener('change', () => {
          this.updatePreview(preview, form, fieldMap);
          this.updateProgressIndicator(form, fieldMap);
        });

        // Initial preview load
        this.updatePreview(preview, form, fieldMap);
        this.updateProgressIndicator(form, fieldMap);
      });
    },

    // Update preview with form data
    updatePreview(preview, form, fieldMap) {
      // Update avatar initials
      const firstName = form.querySelector('[name="firstName"]')?.value || '';
      const lastName = form.querySelector('[name="lastName"]')?.value || '';
      const avatarEl = preview.querySelector('.preview-avatar');
      if (avatarEl) {
        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
        avatarEl.textContent = initials || '👤';
      }

      // Update name
      const nameEl = preview.querySelector('.preview-info h3');
      if (nameEl) {
        nameEl.textContent = `${firstName} ${lastName}`.trim() || 'Your Name';
      }

      // Update each preview item
      Object.entries(fieldMap).forEach(([inputName, previewName]) => {
        const input = form.querySelector(`[name="${inputName}"]`);
        const previewItem = preview.querySelector(`[data-preview="${previewName}"]`);

        if (input && previewItem) {
          const value = input.value;
          const valueEl = previewItem.querySelector('.preview-item-value');
          const iconEl = previewItem.querySelector('.preview-item-icon');

          if (value) {
            valueEl.textContent = this.formatPreviewValue(inputName, value);
            valueEl.classList.remove('placeholder');
            previewItem.classList.add('filled');
            if (iconEl) iconEl.textContent = '✓';
          } else {
            valueEl.textContent = `Not provided`;
            valueEl.classList.add('placeholder');
            previewItem.classList.remove('filled');
            if (iconEl) iconEl.textContent = '';
          }
        }
      });
    },

    // Format preview values based on field type
    formatPreviewValue(fieldName, value) {
      if (fieldName === 'email') {
        return value.split('@')[0] + '@...';
      }
      if (fieldName === 'phone') {
        return value.replace(/(\d{2})\d+(\d{2})/, '+91 $1**$2');
      }
      if (fieldName === 'birthday') {
        const date = new Date(value);
        return date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' });
      }
      if (fieldName === 'address') {
        return value.substring(0, 30) + (value.length > 30 ? '...' : '');
      }
      return value;
    },

    // Update progress dots
    updateProgressIndicator(form, fieldMap) {
      const progressDots = form.querySelectorAll('.progress-dot');
      let filledCount = 0;

      Object.keys(fieldMap).forEach((inputName, index) => {
        const input = form.querySelector(`[name="${inputName}"]`);
        if (input && input.value) {
          filledCount++;
          if (progressDots[index]) {
            progressDots[index].classList.add('filled');
          }
        } else {
          if (progressDots[index]) {
            progressDots[index].classList.remove('filled');
          }
        }
      });

      // Update current indicator
      const totalFields = Object.keys(fieldMap).length;
      const progressPercent = Math.round((filledCount / totalFields) * 100);

      // Show "current" indicator on next field to fill
      progressDots.forEach((dot, index) => {
        dot.classList.remove('current');
      });

      const nextEmptyIndex = Object.keys(fieldMap).findIndex((inputName) => {
        const input = form.querySelector(`[name="${inputName}"]`);
        return !input || !input.value;
      });

      if (nextEmptyIndex >= 0 && progressDots[nextEmptyIndex]) {
        progressDots[nextEmptyIndex].classList.add('current');
      }
    }
  };

  window.orderStatusUtils = {
    statuses: ['Pending', 'Confirmed', 'Preparing', 'Ready For Pickup', 'Out For Delivery', 'Delivered'],
    
    // Create order status progression HTML
    createStatusProgression(currentStatus) {
      const statuses = this.statuses;
      const currentIndex = statuses.indexOf(currentStatus) || 0;
      
      const progressionHTML = `
        <div class="order-status-progression">
          ${statuses.map((status, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            const statusClass = isCompleted ? 'completed' : isActive ? 'active' : '';
            
            return `
              <div class="order-status-step ${statusClass}">
                <div class="status-dot">${index + 1}</div>
                <div class="status-label">${status}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      return progressionHTML;
    },

    // Create status update buttons
    createStatusControls(currentStatus, onStatusChange) {
      const statuses = this.statuses;
      const currentIndex = statuses.indexOf(currentStatus) || 0;
      
      const buttonsHTML = statuses
        .map((status, index) => {
          const isAvailable = index >= currentIndex;
          const isActive = status === currentStatus;
          const disabled = !isAvailable ? 'disabled' : '';
          
          return `
            <button 
              class="status-button ${isActive ? 'active' : ''}" 
              ${disabled}
              data-status="${status}"
            >
              ${status}
            </button>
          `;
        })
        .join('');
      
      const controlsHTML = `
        <div class="order-status-controls">
          <div class="status-button-group">
            ${buttonsHTML}
          </div>
        </div>
      `;
      
      return controlsHTML;
    },

    // Render order status in a card
    renderOrderCard(order) {
      const fmtINR = (n) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
      
      const createdDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const itemsHTML = order.items.map(item => `
        <div class="order-item">
          <div>
            <strong>${item.name}</strong> × ${item.quantity}
          </div>
          <div>${fmtINR(item.price * item.quantity)}</div>
        </div>
      `).join('');

      return `
        <div class="order-card" data-order-id="${order._id}">
          <div class="order-header">
            <div>
              <div class="order-id">Order #${order._id.slice(-8).toUpperCase()}</div>
              <div class="order-time">${createdDate}</div>
            </div>
            <div style="text-align: right;">
              <strong>${fmtINR(order.totalPrice)}</strong>
              <div style="font-size: 0.85rem; color: var(--color-accent);">${order.orderStatus}</div>
            </div>
          </div>

          ${this.createStatusProgression(order.orderStatus)}

          <div class="order-customer">
            <h4>Customer</h4>
            <p style="margin: 0; font-size: 0.9rem;">${order.user?.name || 'Unknown'}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.85rem; color: rgba(17,24,39,0.6);">${order.user?.phone || 'N/A'}</p>
          </div>

          <div class="order-items">
            <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem;">Items</h4>
            ${itemsHTML}
          </div>

          ${this.createStatusControls(order.orderStatus)}
        </div>
      `;
    }
  };

  function initMobileMenu() {
    const toggle = document.createElement('button');
    toggle.className = 'menu-toggle';
    toggle.innerHTML = '☰';
    toggle.setAttribute('aria-label', 'Toggle Navigation');
    
    const headerInner = document.querySelector('.header-inner');
    const nav = document.querySelector('.nav');
    
    if (headerInner && nav) {
      headerInner.insertBefore(toggle, nav);
      
      toggle.addEventListener('click', () => {
        nav.classList.toggle('is-open');
        toggle.innerHTML = nav.classList.contains('is-open') ? '✕' : '☰';
        document.body.style.overflow = nav.classList.contains('is-open') ? 'hidden' : '';
      });
      
      // Close menu when clicking links
      nav.querySelectorAll('.nav-link, .button').forEach(link => {
        link.addEventListener('click', () => {
          nav.classList.remove('is-open');
          toggle.innerHTML = '☰';
          document.body.style.overflow = '';
        });
      });
    }
  }
  
  initMobileMenu();
})()
