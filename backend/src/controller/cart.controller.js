// Import the necessary modules (e.g., your Cart model)
import Cart from "../models/cart.model.js" 
import MenuItem from '../models/menuItem.model.js'; 

// Mock function to simulate finding a cart in the database
const findOrCreateCart = async (userId) => {
    // In a real application, you'd use: 
    // let cart = await Cart.findOne({ user: userId }).populate('items.menuItem');
    // if (!cart) { cart = await Cart.create({ user: userId, items: [] }); }
    
    // Mock Data for demonstration
    const mockCart = {
        _id: 'cart123',
        user: userId,
        items: [
            { itemId: 'menuItemA', restaurantId: 'rest1', name: 'Burger', price: 10.00, quantity: 2 },
            { itemId: 'menuItemB', restaurantId: 'rest2', name: 'Fries', price: 3.50, quantity: 1 }
        ],
        totalPrice: 23.50
    };
    return mockCart;
};

// Mock function to simulate saving the cart to the database
const saveCart = async (cart) => {
    // await cart.save();
    return cart; // Returns the updated cart object
};

// =================================================================
// 1. GET USER CART
// =================================================================
export const getCart = async (req, res) => {
    try {
        // The user ID is typically attached to the request by the auth middleware (req.user.id)
        const userId = req.user.id; 
        
        const cart = await findOrCreateCart(userId);

        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching cart.' });
    }
};

// =================================================================
// 2. ADD ITEM TO CART (POST /api/cart/add)
// =================================================================
export const addItemToCart = async (req, res) => {
    const { menuItemId, restaurantId, quantity } = req.body;
    const userId = req.user.id;
    const qty = parseInt(quantity) || 1; 

    if (!menuItemId || !restaurantId) {
        return res.status(400).json({ success: false, message: 'Missing menu item or restaurant ID.' });
    }

    try {
        let cart = await findOrCreateCart(userId);
        
        // 1. Check if item already exists in the cart
        const existingItemIndex = cart.items.findIndex(item => item.itemId === menuItemId);

        if (existingItemIndex > -1) {
            // Item exists: increase quantity
            cart.items[existingItemIndex].quantity += qty;
        } else {
            // Item does not exist: fetch item details and add it
            // NOTE: In a real app, you MUST fetch the price and details from the MenuItem model
            // const itemDetails = await MenuItem.findById(menuItemId);
            // if (!itemDetails) return res.status(404).json({ message: 'Menu item not found.' });

            // Mock item details for demonstration
            const newItem = {
                itemId: menuItemId,
                restaurantId: restaurantId,
                name: 'New Item Mock', // Fetched from DB
                price: 5.00,           // Fetched from DB
                quantity: qty,
            };
            cart.items.push(newItem);
        }

        // 2. Recalculate total price (Crucial for security and accuracy)
        cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        // 3. Save changes
        const updatedCart = await saveCart(cart);

        res.status(200).json({ success: true, message: 'Item added to cart.', data: updatedCart });
    } catch (error) {
        console.error("Error adding item to cart:", error);
        res.status(500).json({ success: false, message: 'Server error while adding item.' });
    }
};

// =================================================================
// 3. UPDATE ITEM QUANTITY (PUT /api/cart/update/:itemId)
// =================================================================
export const updateCartItemQuantity = async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;
    const newQty = parseInt(quantity);
    
    if (isNaN(newQty) || newQty < 0) {
        return res.status(400).json({ success: false, message: 'Invalid quantity provided.' });
    }

    try {
        let cart = await findOrCreateCart(userId);
        
        const itemIndex = cart.items.findIndex(item => item.itemId === itemId);

        if (itemIndex > -1) {
            if (newQty === 0) {
                // If quantity is 0, remove the item
                cart.items.splice(itemIndex, 1);
                var message = 'Item removed from cart.';
            } else {
                // Update quantity
                cart.items[itemIndex].quantity = newQty;
                var message = 'Item quantity updated.';
            }

            // Recalculate total price
            cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            
            const updatedCart = await saveCart(cart);

            res.status(200).json({ success: true, message: message, data: updatedCart });
        } else {
            res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }
    } catch (error) {
        console.error("Error updating cart quantity:", error);
        res.status(500).json({ success: false, message: 'Server error while updating cart.' });
    }
};

// =================================================================
// 4. REMOVE ITEM FROM CART (DELETE /api/cart/remove/:itemId)
// =================================================================
export const removeItemFromCart = async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user.id;

    try {
        let cart = await findOrCreateCart(userId);

        const initialLength = cart.items.length;
        
        // Filter out the item to be removed
        cart.items = cart.items.filter(item => item.itemId !== itemId);
        
        if (cart.items.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }
        
        // Recalculate total price
        cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const updatedCart = await saveCart(cart);

        res.status(200).json({ success: true, message: 'Item successfully removed.', data: updatedCart });
    } catch (error) {
        console.error("Error removing item:", error);
        res.status(500).json({ success: false, message: 'Server error while removing item.' });
    }
};

// =================================================================
// 5. CLEAR CART (DELETE /api/cart/clear)
// =================================================================
export const clearCart = async (req, res) => {
    const userId = req.user.id;

    try {
        let cart = await findOrCreateCart(userId);

        // Reset the items array and total price
        cart.items = [];
        cart.totalPrice = 0;

        const updatedCart = await saveCart(cart);

        res.status(200).json({ success: true, message: 'Cart cleared successfully.', data: updatedCart });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ success: false, message: 'Server error while clearing cart.' });
    }
};