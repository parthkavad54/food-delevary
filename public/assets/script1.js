// A simple object to manage the cart state (you'd replace this with real backend/local storage)
const cart = {
    items: [],
    count: 0,
    total: 0,
};

// --- DOM References ---
const menuItems = document.querySelectorAll('.menu-item');
const cartCountDesktop = document.getElementById('nav-cart-link');
const cartCountMobile = document.getElementById('cart-item-count-mobile');
const currentYearSpan = document.getElementById('year');


/**
 * Formats a number as currency (e.g., 12.99 -> $12.99)
 * @param {number} amount 
 */
function formatCurrency(amount) {
    return '$' + amount.toFixed(2);
}

/**
 * Calculates the total price for a menu item based on user selections.
 * @param {HTMLElement} itemElement - The main .menu-item article
 * @returns {number} The final calculated price
 */
function calculatePrice(itemElement) {
    const basePrice = parseFloat(itemElement.dataset.basePrice);
    const form = itemElement.querySelector('.menu-form');
    
    // 1. Get Size Multiplier
    const sizeSelect = form.querySelector('select[name="size"]');
    const sizeMultiplier = sizeSelect ? parseFloat(sizeSelect.value) : 1;
    
    // Calculate price based on size
    let currentPrice = basePrice * sizeMultiplier;

    // 2. Add fixed costs for modifiers (simplified: every checkbox adds a fixed amount)
    // NOTE: In a real app, you'd calculate exact modifier costs here.
    // For this example, we'll assume a $1.00 flat fee for any checked modification.
    const checkedMods = form.querySelectorAll('input[name="mods"]:checked');
    const modificationCost = checkedMods.length * 1.00; // $1.00 per mod

    currentPrice += modificationCost;

    return currentPrice;
}

/**
 * Updates the price display on a single menu item.
 * @param {HTMLElement} itemElement - The main .menu-item article
 */
function updateItemPrice(itemElement) {
    const priceSpan = itemElement.querySelector('.price[data-price]');
    if (priceSpan) {
        const newPrice = calculatePrice(itemElement);
        priceSpan.textContent = formatCurrency(newPrice);
        // Store the current price in the article for easy access on "Add to Cart"
        itemElement.dataset.currentPrice = newPrice.toFixed(2);
    }
}

/**
 * Updates the cart count displayed in the header and mobile button.
 */
function updateCartDisplay() {
    // Basic counter update logic
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.count = totalItems;

    // Update desktop link
    if (cartCountDesktop) {
        cartCountDesktop.innerHTML = `🛒 Cart (${cart.count})`;
    }
    
    // Update mobile fixed button
    if (cartCountMobile) {
        cartCountMobile.textContent = cart.count;
    }
}

/**
 * Handles the "Add to Cart" action.
 * @param {Event} event 
 */
function handleAddToCart(event) {
    event.preventDefault(); // Stop form submission/navigation

    const button = event.target.closest('.add-to-cart');
    if (!button) return;

    const itemElement = button.closest('.menu-item');
    const form = itemElement.querySelector('.menu-form');

    // Simple validation: check if size is selected
    const sizeSelect = form.querySelector('select[name="size"]');
    if (sizeSelect && sizeSelect.value === "") {
        alert("Please select a size/portion before adding to cart.");
        sizeSelect.focus();
        return;
    }

    const itemID = itemElement.dataset.id;
    const itemPrice = parseFloat(itemElement.dataset.currentPrice);
    const itemTitle = itemElement.querySelector('.h4').textContent;

    // Gather selected customization details
    const customizations = {
        size: sizeSelect ? sizeSelect.options[sizeSelect.selectedIndex].text : 'Regular',
        notes: form.querySelector('input[name="notes"]').value.trim(),
        mods: Array.from(form.querySelectorAll('input[name="mods"]:checked')).map(cb => cb.parentNode.textContent.trim()),
    };

    // Create a new cart item object
    const newItem = {
        id: Date.now(), // Unique ID for this specific order instance
        itemID: itemID,
        name: itemTitle,
        price: itemPrice,
        quantity: 1,
        details: customizations,
    };

    // Add to cart and update display
    cart.items.push(newItem);
    updateCartDisplay();
    
    // Visual feedback for the user
    button.textContent = '✅ Added!';
    button.classList.add('button-outline'); // optional visual change
    button.classList.remove('button-primary');
    
    setTimeout(() => {
        button.textContent = '🛒 Add to Cart';
        button.classList.remove('button-outline');
        button.classList.add('button-primary');
    }, 1500); 

    console.log('Cart Items:', cart.items); // For debugging
}


/**
 * Initialization function
 */
function initMenu() {
    // 1. Update copyright year
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // 2. Attach event listeners to all menu items
    menuItems.forEach(item => {
        const form = item.querySelector('.menu-form');
        
        // Initial price calculation
        updateItemPrice(item);

        // Listener for changes in form inputs (size or mods)
        form.addEventListener('change', () => {
            updateItemPrice(item);
        });

        // Listener for the Add to Cart button
        const addToCartButton = item.querySelector('.add-to-cart');
        if (addToCartButton) {
             addToCartButton.addEventListener('click', handleAddToCart);
        }
    });

    // 3. Initial cart display update
    updateCartDisplay();
}

// Run the initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initMenu);