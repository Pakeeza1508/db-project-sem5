# Test User Credentials

## Database Seeded Successfully! ✅

Your database has been populated with **5 complete user profiles** including their search history, saved trips, and testimonials.

---

## Total Data Created:
- **Users:** 5
- **Total Searches:** 59
- **Total Trips:** 25  
- **Total Testimonials:** 16

---

## Test User Accounts

You can login with any of these accounts to see their complete profiles:

### User 1: Ahmed Khan
- **Email:** `ahmed.khan@example.com`
- **Password:** `password123`
- **User ID:** `69551bdb35bc47c579556e81`

### User 2: Sara Ali
- **Email:** `sara.ali@example.com`
- **Password:** `password123`
- **User ID:** `69551bdb35bc47c579556e82`

### User 3: Hassan Raza
- **Email:** `hassan.raza@example.com`
- **Password:** `password123`
- **User ID:** `69551bdc35bc47c579556e83`

### User 4: Fatima Malik
- **Email:** `fatima.malik@example.com`
- **Password:** `password123`
- **User ID:** `69551bdd35bc47c579556e84`

### User 5: Usman Sheikh
- **Email:** `usman.sheikh@example.com`
- **Password:** `password123`
- **User ID:** `69551bdd35bc47c579556e85`

---

## What Each User Has:

Each user profile contains:

✅ **5-20 Search History entries** with:
- Destination searched
- Budget (20,000 - 170,000 PKR)
- Number of days (2-12 days)
- Travel type (Solo/Couple/Family/Group)
- Timestamps (random within last 60 days)

✅ **2-10 Saved Trips** with:
- Destination
- Budget & days
- Activities (Hiking, Sightseeing, Photography, etc.)
- Hotel information
- Weather data
- Timestamps (random within last 45 days)

✅ **1-5 Testimonials** with:
- Destination reviewed
- Rating (4-5 stars)
- Title and detailed review
- Approval status (80% approved)
- Featured status (15% featured)
- Timestamps (random within last 90 days)

---

## How to Test:

1. Go to: https://budget-friendly.netlify.app/login.html
2. Use any email/password combination from above
3. After login, go to: https://budget-friendly.netlify.app/profile.html
4. You'll see:
   - Complete profile header with stats
   - Search history section
   - Activity timeline
   - Trip analytics with graphs
   - Saved trips
   - Testimonials

---

## Destinations Included:

- Hunza Valley, Murree, Naran, Kaghan, Swat Valley
- Skardu, Fairy Meadows, Neelum Valley, Chitral, Kalash Valley
- Gilgit, Naltar Valley, Astore Valley, Kumrat Valley, Shogran
- Nathia Gali, Ayubia, Bhurban, Patriata, Malam Jabba

---

## Note:
All data is stored in your MongoDB Atlas database in these collections:
- `users` - User accounts
- `searchHistory` - Search history records
- `plans` - Saved trips
- `testimonials` - User testimonials

The data is randomized to simulate real user behavior over the past 90 days!
