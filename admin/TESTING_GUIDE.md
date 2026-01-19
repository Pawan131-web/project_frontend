# 🧪 Admin Panel Testing Guide

## Quick Test Steps

### 1. Start Backend Server
```bash
cd c:/Users/rimal_4r/OneDrive/Desktop/backend_p
node server.js
```

**Expected Output:**
```
✅ MongoDB Connected Successfully
✅ Admin already exists
🚀 Server started on http://localhost:5000
```

### 2. Open Admin Panel
Open in browser:
```
file:///c:/Users/rimal_4r/OneDrive/Desktop/project_frontend/admin/login-admin.html
```

### 3. Login
- **Email:** `admin@skilllaunch.com`
- **Password:** `admin123`

**Expected:** Redirect to dashboard

### 4. Test Organization Verification

#### A. Check Browser Console
Press `F12` to open Developer Tools, go to Console tab.

You should see:
```
✅ Admin API Service Loaded
🚀 Admin Dashboard Initialized
```

#### B. Click "Organizations" in Sidebar
You should see:
- Loading spinner
- Then organization list loads from database

#### C. Check Console for API Call
You should see something like:
```
Loading section: organizations
```

#### D. If You See Your New Organization
- It should appear in the "Pending Verification" section
- Click "Verify" button
- Should see success notification
- Organization should disappear from pending list

### 5. Troubleshooting

#### Issue: "Failed to load organizations"
**Check:**
1. Is backend server running? (`http://localhost:5000`)
2. Open browser console (F12) - any errors?
3. Check Network tab - is API call being made?

#### Issue: "AdminAPIs is not defined"
**Solution:** Make sure `admin-api.js` is loaded before `admin-dashboard.js` in HTML

#### Issue: Organization not showing
**Possible reasons:**
1. Organization is already verified (`isVerified: true`)
2. Organization is blocked (`isActive: false`)
3. Check MongoDB directly:
   ```bash
   mongosh
   use skilllaunch
   db.users.find({ userType: 'organization', isVerified: false })
   ```

### 6. Test API Directly in Console

Open browser console and try:

```javascript
// Test if API is loaded
console.log(window.AdminAPIs);

// Get pending organizations
window.AdminAPIs.Organization.getPending()
  .then(result => console.log('Pending orgs:', result))
  .catch(err => console.error('Error:', err));

// Get all organizations
window.AdminAPIs.Organization.getAll()
  .then(result => console.log('All orgs:', result))
  .catch(err => console.error('Error:', err));

// Get organization stats
window.AdminAPIs.Organization.getStats()
  .then(result => console.log('Stats:', result))
  .catch(err => console.error('Error:', err));
```

### 7. Create Test Organization

If you don't have any pending organizations, create one:

**Option A: Using Organization Signup Page**
1. Open: `file:///c:/Users/rimal_4r/OneDrive/Desktop/project_frontend/organization/signup-org.html`
2. Fill in the form
3. Submit
4. Go back to admin panel
5. Click "Organizations"
6. Your new organization should appear

**Option B: Using MongoDB Directly**
```bash
mongosh
use skilllaunch
db.users.insertOne({
  fullName: "Test Company",
  username: "testcompany",
  email: "test@company.com",
  password: "$2a$10$abcdefghijklmnopqrstuvwxyz", // hashed password
  userType: "organization",
  isVerified: false,
  isActive: true,
  createdAt: new Date()
})
```

### 8. Expected Behavior

✅ **When Everything Works:**
1. Login redirects to dashboard
2. Click "Organizations" → Shows loading spinner
3. API call to backend succeeds
4. Organizations list displays
5. Click "Verify" → Success notification
6. Organization disappears from pending list
7. Click "Refresh" → Updated list loads

❌ **Common Errors:**
- "Network error" → Backend not running
- "401 Unauthorized" → Token expired, logout and login again
- "AdminAPIs is not defined" → Check script loading order
- Empty list → No pending organizations in database

### 9. Check Backend Logs

In the terminal where backend is running, you should see:
```
🔍 Fetching pending organizations...
📊 Found X pending organizations
```

When you verify:
```
✅ Verifying organization ID: xxxxx
🎉 Organization verified: Company Name (username)
```

### 10. Success Indicators

✅ No errors in browser console
✅ API calls visible in Network tab
✅ Backend logs show requests
✅ Organizations load from database
✅ Verify/Reject buttons work
✅ UI updates after actions

---

## Quick Debug Checklist

- [ ] Backend server running on port 5000
- [ ] MongoDB connected
- [ ] Admin logged in (check localStorage for 'adminToken')
- [ ] `admin-api.js` loaded (check console for "Admin API Service Loaded")
- [ ] No CORS errors in console
- [ ] Network tab shows API calls to `http://localhost:5000/api/admin/organizations/pending`
- [ ] Response status is 200 OK
- [ ] Response has `success: true` and `organizations` array

---

## Still Not Working?

### Check These Files:
1. `admin/admin-api.js` - API service
2. `admin/admin-dashboard.js` - Dashboard logic
3. `admin/admin-dashboard.html` - Script loading order

### Verify Script Order in HTML:
```html
<!-- This order is CRITICAL -->
<script src="admin-api.js"></script>  <!-- FIRST -->
<script src="admin-dashboard.js"></script>  <!-- SECOND -->
```

### Check Token:
```javascript
// In browser console
console.log('Token:', localStorage.getItem('adminToken'));
console.log('Admin:', localStorage.getItem('adminData'));
```

If token is missing, logout and login again.

---

## Contact Points

If you're still having issues, check:
1. Browser console for errors
2. Network tab for failed requests
3. Backend terminal for error logs
4. MongoDB connection status

The integration is complete - if something's not working, it's likely a configuration issue, not a code issue!
