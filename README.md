### **Project Overview:**

A modern, responsive car rental website with advanced filtering, search functionality, and multi-language support. The website allows users to browse, filter, and reserve cars with a user-friendly interface.

### **Key Features Implemented:**

1. **User Authentication** - Login and signup pages
2. **Currency Switching** - USD and EGP with real-time conversion
3. **Dark Mode** - Complete dark/light theme toggle
4. **Advanced Car Filtering** - By make, model, body type, fuel type, transmission, color
5. **Price Range Filtering** - Text input-based price filtering (removed slider)
6. **Search Functionality** - Real-time car search by name, make, or model
7. **Responsive Design** - Mobile-first approach with responsive layouts
8. **Multi-language Support** - English and Arabic with RTL support
9. **Car Details** - Individual car detail pages with hourly pricing
10. **Time Selection** - Hour and minute inputs for rental duration
11. **Contact System** - Contact us page with form
12. **User Dashboard** - Profile and bookings management
13. **Shopping Cart** - Add to cart, wishlist, and compare functionality


### **Technologies Used**

- **Backend:** Node.js (JavaScript runtime for building server-side logic)  
- **Framework:** Express.js (Handles routing, middleware, and APIs)
- **Database:** MongoDB Atlas (Cloud-hosted NoSQL database)  
- **ODM:** Mongoose (Schema-based MongoDB interaction through Node.js)
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)  
- **Styling:** Custom CSS with CSS Variables for theming  
- **Icons:** Font Awesome 6.0  
- **External Libraries:** Toastify for notifications  
- **Responsive Framework:** Custom CSS Grid and Flexbox

### **File Structure:**

```plaintext
├── index.html (Homepage with featured cars)
├── cars.html (Car listing with filters)
├── car-details.html (Individual car details)
├── login.html (User login)
├── signup.html (User registration)
├── profile.html (User profile)
├── bookings.html (User bookings)
├── about.html (About us page)
├── contact.html (Contact form)
├── styles.css (Main stylesheet with dark mode)
├── main.js (Core JavaScript functionality)
├── price-slider.css (Price slider styles - deprecated)
├── price-slider.html (Price slider component - deprecated)
└── price-slider.js (Price slider logic - deprecated)
```

### **Core Functionalities:**

**1. Car Management:**

- Display of 10+ sample cars with detailed information
- Horizontal featured cars section on homepage
- Car filtering by multiple criteria
- Real-time search functionality
- Price-based filtering with min/max inputs


**2. User Interface:**

- Clean, modern design with card-based layouts
- Responsive navigation with mobile support
- Language and currency selectors in header
- Dark mode toggle with persistent settings
- Toast notifications for user feedback


**3. Internationalization:**

- English/Arabic language switching
- RTL (Right-to-Left) layout support for Arabic
- Currency conversion between USD and EGP
- Localized text content


**4. User Experience:**

- Smooth transitions and hover effects
- Form validation and error handling
- Local storage for user preferences
- Intuitive filtering and search interface


### **Setup Instructions to run it:**

1. Clone the repository
``` git clone https://github.com/5eraaa/CarRent.git```
``` cd CarRent ```
2. Install Backend Dependencies
3. Ensure connecting to MonogoDB 
4. Run the server by typing server.js
6. Access the Frontend `index.html` in a web browser


### **Browser Compatibility:**
- Modern browsers (Chrome, Firefox, Safari, Edge)


