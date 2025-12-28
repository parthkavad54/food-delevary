# Restaurant Owner Panel Setup Guide

## Creating a Restaurant Owner Account

There are **three ways** to create a restaurant owner account:

### Method 1: Using the Script (Recommended)

Run the restaurant owner creation script:

```bash
cd backend
npm run create-owner
```

**Default Restaurant Owner Credentials:**
- **Email:** `owner@restaurant.com`
- **Password:** `owner123`

### Method 2: Custom Owner via Environment Variables

Create or update the `.env` file in the `backend` folder and add:

```env
OWNER_EMAIL=your-restaurant@email.com
OWNER_PASSWORD=your-secure-password
OWNER_NAME=Restaurant Owner Name
OWNER_PHONE=1234567890
```

Then run:
```bash
cd backend
npm run create-owner
```

### Method 3: Register via API

You can register a restaurant owner directly through the API:

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurant Owner",
    "email": "owner@restaurant.com",
    "password": "owner123",
    "phone": "1234567890",
    "role": "restaurant_owner"
  }'
```

**Using the frontend signup page:**
1. Go to `http://localhost:5000/signup.html`
2. Fill in the registration form
3. In the browser console, run:
   ```javascript
   // Register as restaurant owner
   fetch('http://localhost:5000/api/auth/register', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       name: 'Restaurant Owner',
       email: 'owner@restaurant.com',
       password: 'owner123',
       phone: '1234567890',
       role: 'restaurant_owner'
     })
   }).then(r => r.json()).then(console.log);
   ```

## Accessing the Restaurant Owner Panel

1. **Start your server:**
   ```bash
   npm start
   ```

2. **Navigate to the login page:**
   - Open `http://localhost:5000/login.html` in your browser

3. **Login with restaurant owner credentials:**
   - Email: `owner@restaurant.com` (or your custom email)
   - Password: `owner123` (or your custom password)

4. **Access Restaurant Owner Panel:**
   - After login, navigate to `http://localhost:5000/restaurant-dashboard.html`
   - Or the system will automatically redirect you based on your role

## Restaurant Owner Panel Features

Once logged in as a restaurant owner, you can:

### Dashboard (`restaurant-dashboard.html`)
- View restaurant statistics
- See total orders, pending orders, completed orders
- View total revenue
- See menu item count
- Quick access to all management sections

### Manage Orders (`restaurant-orders.html`)
- View all orders for your restaurants
- Filter orders by status (Pending, Confirmed, Preparing, etc.)
- View detailed order information
- Update order status:
  - Pending → Confirmed → Preparing → Ready For Pickup → Out For Delivery → Delivered
- View customer details and delivery addresses

### Manage Menu Items (`restaurant-menu.html`)
- View all menu items for your restaurants
- Add new menu items
- Edit existing menu items
- Delete menu items
- Filter by category (Appetizer, Main Course, Dessert, etc.)
- Filter by availability
- Search menu items

## Setting Up Your First Restaurant

After logging in as a restaurant owner, you need to create a restaurant:

### Option 1: Through the API

```bash
curl -X POST http://localhost:5000/api/restaurants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Restaurant",
    "description": "Delicious food served fresh",
    "phone": "1234567890",
    "cuisine": ["Italian", "Pizza"],
    "address": {
      "line1": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "lat": 19.0760,
      "lng": 72.8777
    }
  }'
```

### Option 2: Through Admin Panel

If you have admin access, you can:
1. Go to Admin Panel → Manage Restaurants
2. Create a new restaurant
3. Assign it to the restaurant owner

### Option 3: Direct Database (for testing)

You can also create a restaurant directly in MongoDB, but it's recommended to use the API.

## Complete Workflow

1. **Create Restaurant Owner Account**
   ```bash
   cd backend
   npm run create-owner
   ```

2. **Login as Restaurant Owner**
   - Go to `http://localhost:5000/login.html`
   - Use credentials: `owner@restaurant.com` / `owner123`

3. **Create Your Restaurant**
   - Use the API endpoint: `POST /api/restaurants`
   - Or have an admin create it for you

4. **Add Menu Items**
   - Go to Restaurant Panel → Menu Items
   - Click "Add Menu Item"
   - Fill in details (name, description, price, category)
   - Save

5. **Manage Orders**
   - Go to Restaurant Panel → Orders
   - View incoming orders
   - Update order status as you prepare and deliver

## Security Notes

⚠️ **Important Security Reminders:**

1. **Change the default password** immediately after first login
2. **Use a strong password** for production environments
3. **Keep credentials secure** - never commit them to version control
4. **Use environment variables** for sensitive information

## Troubleshooting

### "Restaurant owner user already exists"
- The script detected an existing owner user
- You can either:
  - Use the existing owner account
  - Update the existing user's role through the admin panel
  - Delete the existing user and run the script again

### "Cannot access restaurant panel"
- Make sure you're logged in with an account that has `role: 'restaurant_owner'`
- Check the browser console for errors
- Verify the token is stored in localStorage

### "No restaurants found"
- You need to create at least one restaurant first
- Use the API endpoint `POST /api/restaurants` to create a restaurant
- Or have an admin create a restaurant and assign it to you

### "Permission denied when creating restaurant"
- Ensure you're logged in as `restaurant_owner` or `admin`
- Check that your authentication token is valid
- Verify your account is active (`isActive: true`)

### "Cannot add menu items"
- Make sure you have at least one restaurant created
- Verify the restaurant belongs to your account
- Check that you're logged in with the correct account

## Creating Additional Restaurant Owner Accounts

You can create additional restaurant owner accounts through:

1. **Script** - Run `npm run create-owner` with different environment variables
2. **API** - Use the registration endpoint with `role: 'restaurant_owner'`
3. **Admin Panel** - Use the "Manage Users" section to:
   - Create a new user (as customer)
   - Edit the user and change their role to "restaurant_owner"
4. **Database** - Directly update the user document in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { role: "restaurant_owner" } }
   )
   ```

## Quick Reference

**Default Credentials:**
- Email: `owner@restaurant.com`
- Password: `owner123`

**Panel URLs:**
- Dashboard: `http://localhost:5000/restaurant-dashboard.html`
- Orders: `http://localhost:5000/restaurant-orders.html`
- Menu Items: `http://localhost:5000/restaurant-menu.html`

**API Endpoints:**
- Get Dashboard Stats: `GET /api/restaurant-owner/dashboard/stats`
- Get Orders: `GET /api/restaurant-owner/orders`
- Get Menu Items: `GET /api/restaurant-owner/menu-items`
- Create Menu Item: `POST /api/restaurant-owner/menu-items`
- Update Order Status: `PUT /api/restaurant-owner/orders/:id/status`

