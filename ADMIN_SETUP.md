# Admin Panel Setup Guide

## Creating an Admin User

There are **three ways** to create an admin user:

### Method 1: Using the Script (Recommended)

Run the admin creation script:

```bash
cd backend
npm run create-admin
```

**Default Admin Credentials:**
- **Email:** `admin@foody.com`
- **Password:** `admin123`

### Method 2: Custom Admin via Environment Variables

Create a `.env` file in the `backend` folder (if you don't have one) and add:

```env
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin Name
ADMIN_PHONE=1234567890
```

Then run:
```bash
cd backend
npm run create-admin
```

### Method 3: Register via API

You can register an admin user directly through the API:

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@foody.com",
    "password": "admin123",
    "phone": "1234567890",
    "role": "admin"
  }'
```

**Using the frontend:**
1. Go to the signup page
2. Fill in the registration form
3. In the browser console, run:
   ```javascript
   // Register as admin
   fetch('http://localhost:5000/api/auth/register', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       name: 'Admin User',
       email: 'admin@foody.com',
       password: 'admin123',
       phone: '1234567890',
       role: 'admin'
     })
   }).then(r => r.json()).then(console.log);
   ```

## Accessing the Admin Panel

1. **Start your server:**
   ```bash
   npm start
   ```

2. **Navigate to the login page:**
   - Open `http://localhost:5000/login.html` in your browser

3. **Login with admin credentials:**
   - Email: `admin@foody.com` (or your custom email)
   - Password: `admin123` (or your custom password)

4. **Access Admin Panel:**
   - After login, navigate to `http://localhost:5000/admin-dashboard.html`
   - Or the system will automatically redirect you based on your role

## Admin Panel Features

Once logged in as admin, you can:

- **Dashboard** (`admin-dashboard.html`)
  - View platform statistics
  - Quick access to all management sections

- **Manage Users** (`admin-users.html`)
  - View all users
  - Search and filter users
  - Edit user details
  - Activate/deactivate users
  - Change user roles

- **Manage Restaurants** (`admin-restaurants.html`)
  - View all restaurants
  - Search and filter restaurants
  - Edit restaurant details
  - Activate/deactivate restaurants

- **View Orders** (`admin-orders.html`)
  - View all orders across the platform
  - Filter by status
  - Monitor order activity

## Security Notes

⚠️ **Important Security Reminders:**

1. **Change the default password** immediately after first login
2. **Use a strong password** for production environments
3. **Keep admin credentials secure** - never commit them to version control
4. **Use environment variables** for sensitive information

## Troubleshooting

### "Admin user already exists"
- The script detected an existing admin user
- You can either:
  - Use the existing admin account
  - Update the existing user's role through the admin panel
  - Delete the existing user and run the script again

### "Cannot access admin panel"
- Make sure you're logged in with an account that has `role: 'admin'`
- Check the browser console for errors
- Verify the token is stored in localStorage

### "Permission denied"
- Ensure your user account has `role: 'admin'` in the database
- You can verify this by checking the user in the database or through the admin panel (if you have another admin account)

## Creating Additional Admin Users

You can create additional admin users through:

1. **Admin Panel** - Use the "Manage Users" section to:
   - Create a new user (as customer)
   - Edit the user and change their role to "admin"

2. **API** - Use the registration endpoint with `role: 'admin'`

3. **Database** - Directly update the user document in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { role: "admin" } }
   )
   ```

