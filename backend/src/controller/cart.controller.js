import Cart from "../models/cart.model.js";
import MenuItem from "../models/menuItem.model.js";

const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const recalcTotals = (cart) => {
    const total = (cart.items || []).reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
    cart.totalPrice = roundMoney(total);
};

const findOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [], totalPrice: 0 });
    }
    return cart;
};

// =================================================================
// 1. GET USER CART
// =================================================================
export const getCart = async (req, res) => {
    try {
        // The user ID is typically attached to the request by the auth middleware (req.user.id)
        const userId = req.user._id;
        
        const cart = await findOrCreateCart(userId);
        await cart.populate([{ path: 'items.menuItemId', select: 'name price imageUrl restaurant' }]);

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
    const userId = req.user._id;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    if (!menuItemId || !restaurantId) {
        return res.status(400).json({ success: false, message: 'Missing menu item or restaurant ID.' });
    }

    try {
        const cart = await findOrCreateCart(userId);
        
        const menuItem = await MenuItem.findById(menuItemId).populate('restaurant', '_id');
        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found.' });
        }

        if (menuItem.restaurant && String(menuItem.restaurant._id) !== String(restaurantId)) {
            return res.status(400).json({ success: false, message: 'Restaurant ID does not match menu item.' });
        }

        // 1. Check if item already exists in the cart (same restaurant + same menu item)
        const existingItemIndex = cart.items.findIndex(
            item => String(item.menuItemId) === String(menuItemId) && String(item.restaurantId) === String(restaurantId)
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += qty;
        } else {
            cart.items.push({
                menuItemId: menuItem._id,
                restaurantId: restaurantId,
                name: menuItem.name,
                price: Number(menuItem.price),
                quantity: qty,
            });
        }

        recalcTotals(cart);
        
        await cart.save();
        await cart.populate([{ path: 'items.menuItemId', select: 'name price imageUrl restaurant' }]);

        res.status(200).json({ success: true, message: 'Item added to cart.', data: cart });
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
    const userId = req.user._id;
    const newQty = parseInt(quantity, 10);
    
    if (isNaN(newQty) || newQty < 0) {
        return res.status(400).json({ success: false, message: 'Invalid quantity provided.' });
    }

    try {
        const cart = await findOrCreateCart(userId);
        
        const itemIndex = cart.items.findIndex(item => String(item.menuItemId) === String(itemId));

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

            recalcTotals(cart);
            
            await cart.save();
            await cart.populate([{ path: 'items.menuItemId', select: 'name price imageUrl restaurant' }]);

            res.status(200).json({ success: true, message: message, data: cart });
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
    const userId = req.user._id;

    try {
        const cart = await findOrCreateCart(userId);

        const initialLength = cart.items.length;
        
        // Filter out the item to be removed
        cart.items = cart.items.filter(item => String(item.menuItemId) !== String(itemId));
        
        if (cart.items.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }
        
        recalcTotals(cart);
        await cart.save();
        await cart.populate([{ path: 'items.menuItemId', select: 'name price imageUrl restaurant' }]);

        res.status(200).json({ success: true, message: 'Item successfully removed.', data: cart });
    } catch (error) {
        console.error("Error removing item:", error);
        res.status(500).json({ success: false, message: 'Server error while removing item.' });
    }
};

// =================================================================
// 5. CLEAR CART (DELETE /api/cart/clear)
// =================================================================
export const clearCart = async (req, res) => {
    const userId = req.user._id;

    try {
        const cart = await findOrCreateCart(userId);
        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();
        res.status(200).json({ success: true, message: 'Cart cleared successfully.', data: cart });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ success: false, message: 'Server error while clearing cart.' });
    }
};