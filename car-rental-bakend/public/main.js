// Main JavaScript file for Car Reservation Website

// Car data for search and filtering
const carData = [
    { id: 1, name: 'Toyota Camry', price: 10, rating: 4.8, isNew: true, isAvailable: true },
    { id: 2, name: 'Honda Civic', price: 9, rating: 4.6, isNew: true, isAvailable: true },
    { id: 3, name: 'Ford Focus', price: 8, rating: 4.5, isNew: false, isAvailable: true },
    { id: 4, name: 'Nissan Altima', price: 11, rating: 4.7, isNew: false, isAvailable: true },
    { id: 5, name: 'Hyundai Elantra', price: 8.5, rating: 4.4, isNew: true, isAvailable: true },
    { id: 6, name: 'Chevrolet Malibu', price: 9.5, rating: 4.3, isNew: false, isAvailable: false },
    { id: 7, name: 'Kia Optima', price: 9, rating: 4.5, isNew: true, isAvailable: true },
    { id: 8, name: 'Mazda 6', price: 10.5, rating: 4.6, isNew: false, isAvailable: true },
    { id: 9, name: 'Subaru Legacy', price: 11, rating: 4.7, isNew: true, isAvailable: false },
    { id: 10, name: 'Volkswagen Passat', price: 11.5, rating: 4.4, isNew: false, isAvailable: true }
];

// Currency conversion rates
const currencyRates = {
    usd: 1,
    egp: 31.15 // 1 USD = 31.15 EGP (example rate)
};

// DOM Elements
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in (from localStorage)
    checkLoginStatus();

    // Setup form validation if forms exist
    setupFormValidation();

    // Setup car filtering and sorting if on cars page
    setupCarFilters();

    // Setup car card click events
    setupCarCardEvents();

    // Setup user menu dropdown
    setupUserMenu();

    // Setup language and currency selectors
    setupLanguageCurrencySelectors();

    // Load saved language and currency
    loadSavedPreferences();

    // Setup price range slider
    setupPriceRangeSlider();

    // Setup search functionality
    setupSearchFunctionality();

    // Setup dark mode toggle
    setupDarkMode();

    // Setup time inputs on car details page
    setupTimeInputs();

    // Setup contact form
    setupContactForm();
});

// Check if user is logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');
    const authButtons = document.querySelector('.auth-buttons');

    if (isLoggedIn && username && authButtons) {
        // Replace login/signup buttons with user menu
        authButtons.innerHTML = `
            <div class="user-menu" style="display: block;">
                <button class="user-menu-button">
                    <span>${username}</span>
                    <span>▼</span>
                </button>
                <div class="user-menu-dropdown">
                    <a href="profile.html">My Profile</a>
                    <a href="bookings.html">My Bookings</a>
                    <a href="#" id="logout-btn">Logout</a>
                </div>
            </div>
        `;

        // Add logout event listener
        document.getElementById('logout-btn').addEventListener('click', function (e) {
            e.preventDefault();
            logout();
        });
    }
}

// Setup dark mode toggle
function setupDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    if (darkModeToggle) {
        // Check if dark mode is enabled in localStorage
        const isDarkMode = localStorage.getItem('darkMode') === 'true';

        // Apply dark mode if enabled
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }

        // Add event listener to toggle dark mode
        darkModeToggle.addEventListener('change', function () {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }
}

// Setup time inputs on car details page
function setupTimeInputs() {
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const totalPriceElement = document.getElementById('total-price');

    if (hoursInput && minutesInput && totalPriceElement) {
        const updateTotalPrice = function () {
            const hours = parseInt(hoursInput.value) || 0;
            const minutes = parseInt(minutesInput.value) || 0;

            // Ensure hours is at least 1
            if (hours < 1 && minutes === 0) {
                hoursInput.value = 1;
                return;
            }

            // Calculate total time in hours
            const totalHours = hours + (minutes / 60);

            // Get base price per hour (assuming $10/hour for this example)
            const basePrice = 10;

            // Calculate total price
            const totalPrice = basePrice * totalHours;

            // Get current currency
            const currency = localStorage.getItem('currency') || 'usd';
            const rate = currencyRates[currency] || 1;
            const symbol = currency === 'usd' ? '$' : 'E£';

            // Update total price display
            totalPriceElement.textContent = `${symbol}${(totalPrice * rate).toFixed(2)}`;
        };

        // Add event listeners to update price when time changes
        hoursInput.addEventListener('input', updateTotalPrice);
        minutesInput.addEventListener('input', updateTotalPrice);

        // Set initial values
        hoursInput.value = 1;
        minutesInput.value = 0;

        // Calculate initial price
        updateTotalPrice();
    }
}

// Setup contact form
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;

            if (!name || !email || !subject || !message) {
                showError('Please fill in all fields');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showError('Please enter a valid email address');
                return;
            }

            // In a real app, this would send the form data to a server
            // For demo purposes, we'll just show a success message
            showToast('Your message has been sent successfully!', 'success');

            // Clear form
            contactForm.reset();
        });
    }
}

// Setup language and currency selectors
function setupLanguageCurrencySelectors() {
    // Language selector
    const languageBtn = document.getElementById('language-btn');
    const languageDropdown = document.getElementById('language-dropdown');

    if (languageBtn && languageDropdown) {
        languageBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            languageDropdown.classList.toggle('active');

            // Close currency dropdown if open
            const currencyDropdown = document.getElementById('currency-dropdown');
            if (currencyDropdown && currencyDropdown.classList.contains('active')) {
                currencyDropdown.classList.remove('active');
            }
        });

        // Language selection
        const languageOptions = languageDropdown.querySelectorAll('a');
        languageOptions.forEach(option => {
            option.addEventListener('click', function (e) {
                e.preventDefault();
                const lang = this.getAttribute('data-lang');
                const langText = lang.toUpperCase();

                // Update button text
                languageBtn.querySelector('span').textContent = langText;

                // Close dropdown
                languageDropdown.classList.remove('active');

                // Save to localStorage
                localStorage.setItem('language', lang);

                // Show toast
                showToast(`Language changed to ${this.textContent}. Refreshing page...`, 'success');

                // Refresh page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            });
        });
    }

    // Currency selector
    const currencyBtn = document.getElementById('currency-btn');
    const currencyDropdown = document.getElementById('currency-dropdown');

    if (currencyBtn && currencyDropdown) {
        currencyBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            currencyDropdown.classList.toggle('active');

            // Close language dropdown if open
            const languageDropdown = document.getElementById('language-dropdown');
            if (languageDropdown && languageDropdown.classList.contains('active')) {
                languageDropdown.classList.remove('active');
            }
        });

        // Currency selection
        const currencyOptions = currencyDropdown.querySelectorAll('a');
        currencyOptions.forEach(option => {
            option.addEventListener('click', function (e) {
                e.preventDefault();
                const currency = this.getAttribute('data-currency');
                const currencyText = currency.toUpperCase();

                // Update button text
                currencyBtn.querySelector('span').textContent = currencyText;

                // Close dropdown
                currencyDropdown.classList.remove('active');

                // Save to localStorage
                localStorage.setItem('currency', currency);

                // Apply currency change
                applyCurrencyChange(currency);

                // Show toast
                showToast(`Currency changed to ${currencyText}`, 'success');
            });
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function () {
        const dropdowns = document.querySelectorAll('.selector-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });
}

// Apply language change
function applyLanguageChange(lang) {
    // This is a simplified implementation
    // In a real app, you would load language files or use a translation library

    const translations = {
        en: {
            'Find Your Perfect Ride': 'Find Your Perfect Ride',
            'Explore our collection of premium cars for rent': 'Explore our collection of premium cars for rent',
            'Browse Cars': 'Browse Cars',
            'Featured Cars': 'Featured Cars',
            'Cars': 'Cars',
            'About us': 'About us',
            'Contact us': 'Contact us',
            'Login': 'Login',
            'Sign Up': 'Sign Up',
            'Search for cars...': 'Search for cars...',
            'Search': 'Search',
            'Loyalty points': 'Loyalty points',
            'Recommended': 'Recommended',
            'Available': 'Available',
            'Sorting': 'Sorting',
            'Newly Added': 'Newly Added',
            'Price Descending': 'Price Descending',
            'Price Ascending': 'Price Ascending',
            'Rating': 'Rating',
            'Price Range': 'Price Range',
            'to': 'to',
            'Apply': 'Apply',
            'Available Cars': 'Available Cars',
            'hour': 'hour',
            'hours': 'hours',
            'minutes': 'minutes',
            'Rental Time': 'Rental Time'
        },
        ar: {
            'Find Your Perfect Ride': 'ابحث عن سيارتك المثالية',
            'Explore our collection of premium cars for rent': 'استكشف مجموعتنا من السيارات الفاخرة للإيجار',
            'Browse Cars': 'تصفح السيارات',
            'Featured Cars': 'سيارات مميزة',
            'Cars': 'السيارات',
            'About us': 'من نحن',
            'Contact us': 'اتصل بنا',
            'Login': 'تسجيل الدخول',
            'Sign Up': 'إنشاء حساب',
            'Search for cars...': 'البحث عن سيارات...',
            'Search': 'بحث',
            'Loyalty points': 'نقاط الولاء',
            'Recommended': 'موصى به',
            'Available': 'متاح',
            'Sorting': 'الترتيب',
            'Newly Added': 'أضيف حديثًا',
            'Price Descending': 'السعر تنازلي',
            'Price Ascending': 'السعر تصاعدي',
            'Rating': 'التقييم',
            'Price Range': 'نطاق السعر',
            'to': 'إلى',
            'Apply': 'تطبيق',
            'Available Cars': 'السيارات المتاحة',
            'hour': 'ساعة',
            'hours': 'ساعات',
            'minutes': 'دقائق',
            'Rental Time': 'وقت الإيجار'
        }
    };

    // Apply translations to elements with text content
    if (translations[lang]) {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });

        // Apply translations to elements without data-translate attribute
        // This is a simplified approach - in a real app, you would use a more robust method
        document.querySelectorAll('h1, h2, p, button, a, label, span').forEach(element => {
            const text = element.textContent.trim();
            if (translations[lang][text]) {
                element.textContent = translations[lang][text];
            }
        });

        // Apply RTL for Arabic
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
}

// Apply currency change
function applyCurrencyChange(currency) {
    const rate = currencyRates[currency] || 1;
    const symbol = currency === 'usd' ? '$' : 'E£';

    // Update all price displays
    document.querySelectorAll('.car-price').forEach(element => {
        const priceText = element.textContent;
        const match = priceText.match(/\d+(\.\d+)?/);

        if (match) {
            const basePrice = parseFloat(match[0]);
            const convertedPrice = (basePrice * rate).toFixed(1);
            const hour = localStorage.getItem('language') === 'ar' ? 'ساعة' : 'hour';
            element.textContent = `${symbol}${convertedPrice}/${hour}`;
        }
    });

    // Update price slider values if they exist
    const minPriceInput = document.getElementById('min-price-input');
    const maxPriceInput = document.getElementById('max-price-input');

    if (minPriceInput && maxPriceInput) {
        const minValue = parseInt(minPriceInput.value);
        const maxValue = parseInt(maxPriceInput.value);

        minPriceInput.value = Math.round(minValue * rate);
        maxPriceInput.value = Math.round(maxValue * rate);
    }

    // Update price display in car details page if it exists
    const totalPriceElement = document.getElementById('total-price');
    if (totalPriceElement) {
        const priceText = totalPriceElement.textContent;
        const match = priceText.match(/\d+(\.\d+)?/);

        if (match) {
            const basePrice = parseFloat(match[0]);
            const convertedPrice = (basePrice * rate).toFixed(2);
            totalPriceElement.textContent = `${symbol}${convertedPrice}`;
        }
    }
}

// Setup price range slider
function setupPriceRangeSlider() {
    const minInput = document.getElementById("min-price-input");
    const maxInput = document.getElementById("max-price-input");
    const applyBtn = document.getElementById("apply-price-filter");

    if (!minInput || !maxInput || !applyBtn) return;

    minInput.value = 0;
    maxInput.value = 200;

    minInput.addEventListener("input", () => {
        if (parseInt(minInput.value) > parseInt(maxInput.value)) {
            minInput.value = maxInput.value;
        }
    });

    maxInput.addEventListener("input", () => {
        if (parseInt(maxInput.value) < parseInt(minInput.value)) {
            maxInput.value = minInput.value;
        }
    });

    applyBtn.addEventListener("click", () => {
        const min = parseInt(minInput.value);
        const max = parseInt(maxInput.value);
        filterCarsByPrice(min, max);
        showToast(`Filtering cars between ${getCurrencySymbol()}${min} and ${getCurrencySymbol()}${max}`, "success");
    });
}

// Setup search functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('car-search');
    const searchBtn = document.getElementById('search-btn');

    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function () {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm.length > 0) {
                searchCars(searchTerm);
            } else {
                showToast('Please enter a search term', 'error');
            }
        });

        // Also allow search on Enter key
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
}

// Search cars
function searchCars(searchTerm) {
    const carsContainer = document.getElementById('cars-container');
    if (!carsContainer) return;

    // Filter cars by search term
    const filteredCars = carData.filter(car =>
        car.name.toLowerCase().includes(searchTerm)
    );

    if (filteredCars.length === 0) {
        showToast('No cars found matching your search', 'error');
        return;
    }

    // Render filtered cars
    renderCars(filteredCars);
    showToast(`Found ${filteredCars.length} cars matching "${searchTerm}"`, 'success');
}

// Filter cars by price
function filterCarsByPrice(minPrice, maxPrice) {
    const carsContainer = document.getElementById('cars-container');
    if (!carsContainer) return;

    // Convert prices based on current currency
    const currency = localStorage.getItem('currency') || 'usd';
    const rate = currencyRates[currency] || 1;

    // Convert min and max prices to USD for comparison with data
    const minPriceUSD = Math.round(minPrice / rate);
    const maxPriceUSD = Math.round(maxPrice / rate);

    // Filter cars by price range
    const filteredCars = carData.filter(car =>
        car.price >= minPriceUSD && car.price <= maxPriceUSD
    );

    if (filteredCars.length === 0) {
        showToast('No cars found in this price range', 'error');
        return;
    }

    // Render filtered cars
    renderCars(filteredCars);
}

// Render cars
function renderCars(cars) {
    const carsContainer = document.getElementById('cars-container');
    if (!carsContainer) return;

    // Get current currency and language
    const currency = localStorage.getItem('currency') || 'usd';
    const lang = localStorage.getItem('language') || 'en';
    const rate = currencyRates[currency] || 1;
    const symbol = getCurrencySymbol();
    const hour = lang === 'ar' ? 'ساعة' : 'hour';

    // Clear container
    carsContainer.innerHTML = '';

    // Add cars to container
    cars.forEach(car => {
        const convertedPrice = (car.price * rate).toFixed(1);

        const carCard = document.createElement('div');
        carCard.className = 'car-card';
        carCard.onclick = function () {
            window.location.href = 'car-details.html';
        };

        carCard.innerHTML = `
            <div class="car-image">${car.name}</div>
            <div class="car-info">
                <div class="car-name">${car.name}</div>
                <div class="car-price">${symbol}${convertedPrice}/${hour}</div>
            </div>
        `;

        carsContainer.appendChild(carCard);
    });
}

// Get currency symbol
function getCurrencySymbol() {
    const currency = localStorage.getItem('currency') || 'usd';
    return currency === 'usd' ? '$' : 'E£';
}

// Setup form validation
function setupFormValidation() {
    // Login form validation
    const loginForm = document.querySelector('form.auth-form');
    if (loginForm && loginForm.closest('.auth-section').querySelector('h1').textContent.includes('Login')) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const emailPhone = document.getElementById('email-phone').value;
            const password = document.getElementById('password').value;

            if (!emailPhone || !password) {
                showError('Please fill in all fields');
                return;
            }

            // Simulate login (in a real app, this would be an API call)
            login(emailPhone, password);
        });
    }

    // Signup form validation
    const signupForm = document.querySelector('form.auth-form');
    if (signupForm && signupForm.closest('.auth-section').querySelector('h1').textContent.includes('Sign up')) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const name = document.getElementById('name').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const phone = document.getElementById('phone').value;
            const id = document.getElementById('id').value;

            if (!email || !name || !password || !confirmPassword || !phone || !id) {
                showError('Please fill in all fields');
                return;
            }

            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }

            // Simulate signup (in a real app, this would be an API call)
            signup(email, name, password, phone, id);
        });
    }

    // Car details form (rent button)
    const rentButton = document.querySelector('.rental-details + .btn-primary');
    if (rentButton && rentButton.textContent.includes('Rent')) {
        rentButton.addEventListener('click', function (e) {
            e.preventDefault();

            // Check if user is logged in
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (!isLoggedIn) {
                showToast('Please login to rent a car', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }

            const hours = document.getElementById('hours').value;
            const minutes = document.getElementById('minutes').value;

            if (!hours || hours < 1) {
                showToast('Please select at least 1 hour for rental', 'error');
                return;
            }

            // Simulate car rental (in a real app, this would be an API call)
            showToast('Car rented successfully!', 'success');
        });
    }
}

// Setup car filtering and sorting
function setupCarFilters() {
    // Sort buttons
    const sortButtons = document.querySelectorAll('.sort-btn');
    if (sortButtons.length > 0) {
        sortButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Remove active class from all buttons
                sortButtons.forEach(btn => btn.classList.remove('active'));

                // Add active class to clicked button
                this.classList.add('active');

                // Get sort type
                const sortType = this.getAttribute('data-sort');

                // Sort cars
                sortCars(sortType);

                // Show toast
                showToast(`Sorting by ${this.textContent}`, 'success');
            });
        });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Toggle active class on filter buttons
                this.classList.toggle('active');

                // Apply filters
                applyFilters();

                // Show toast
                const isActive = this.classList.contains('active');
                const filterType = this.textContent;

                if (isActive) {
                    showToast(`${filterType} filter applied`, 'success');
                } else {
                    showToast(`${filterType} filter removed`, 'success');
                }
            });
        });
    }
}

// Sort cars
function sortCars(sortType) {
    let sortedCars = [...carData];

    switch (sortType) {
        case 'new':
            sortedCars.sort((a, b) => b.isNew - a.isNew);
            break;
        case 'price-desc':
            sortedCars.sort((a, b) => b.price - a.price);
            break;
        case 'price-asc':
            sortedCars.sort((a, b) => a.price - b.price);
            break;
        case 'rating':
            sortedCars.sort((a, b) => b.rating - a.rating);
            break;
    }

    // Apply any active filters
    applyFilters(sortedCars);
}

// Apply filters
function applyFilters(cars = [...carData]) {
    const recommendedFilter = document.getElementById('recommended-filter');
    const availableFilter = document.getElementById('available-filter');

    let filteredCars = cars;

    // Apply recommended filter
    if (recommendedFilter && recommendedFilter.classList.contains('active')) {
        filteredCars = filteredCars.filter(car => car.rating >= 4.5);
    }

    // Apply available filter
    if (availableFilter && availableFilter.classList.contains('active')) {
        filteredCars = filteredCars.filter(car => car.isAvailable);
    }

    // Render filtered cars
    renderCars(filteredCars);
}

// Setup car card click events
function setupCarCardEvents() {
    const carCards = document.querySelectorAll('.car-card');
    carCards.forEach(card => {
        card.addEventListener('click', function () {
            window.location.href = 'car-details.html';
        });
    });
}

// Setup user menu dropdown
function setupUserMenu() {
    const userMenuButton = document.querySelector('.user-menu-button');
    if (userMenuButton) {
        userMenuButton.addEventListener('click', function (e) {
            e.stopPropagation();
            const dropdown = document.querySelector('.user-menu-dropdown');
            dropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            const userMenu = document.querySelector('.user-menu');
            if (userMenu && !userMenu.contains(e.target)) {
                document.querySelector('.user-menu-dropdown').classList.remove('active');
            }
        });
    }
}

// Login function
function login(emailPhone, password) {
    // In a real app, this would be an API call
    // For demo purposes, we'll just simulate a successful login
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', emailPhone.split('@')[0]);

    showToast('Login successful!', 'success');

    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Signup function
function signup(email, name, password, phone, id) {
    // In a real app, this would be an API call
    // For demo purposes, we'll just simulate a successful signup
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', name);

    showToast('Account created successfully!', 'success');

    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');

    showToast('Logged out successfully!', 'success');

    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Show error message
function showError(message) {
    // Find error message element or create one
    let errorElement = document.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        document.querySelector('.auth-form').appendChild(errorElement);
    }

    errorElement.textContent = message;
    errorElement.classList.add('active');

    // Hide error after 3 seconds
    setTimeout(() => {
        errorElement.classList.remove('active');
    }, 3000);
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div>${message}</div>
        <button class="toast-close">&times;</button>
    `;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Add close event listener
    toast.querySelector('.toast-close').addEventListener('click', function () {
        toast.remove();
    });

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Load saved language and currency from localStorage
function loadSavedPreferences() {
    // Load dark mode
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }

    // Load language
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        const languageBtn = document.getElementById('language-btn');
        if (languageBtn) {
            languageBtn.querySelector('span').textContent = savedLanguage.toUpperCase();
        }

        // Apply language change
        applyLanguageChange(savedLanguage);
    }

    // Load currency
    const savedCurrency = localStorage.getItem('currency');
    if (savedCurrency) {
        const currencyBtn = document.getElementById('currency-btn');
        if (currencyBtn) {
            currencyBtn.querySelector('span').textContent = savedCurrency.toUpperCase();
        }

        // Apply currency change
        applyCurrencyChange(savedCurrency);
    }
}
