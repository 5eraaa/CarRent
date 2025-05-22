/**
 * CarRent - Main JavaScript File
 * This file handles all frontend functionality including:
 * - Authentication (login, signup, logout)
 * - UI interactions (dark mode, language/currency)
 * - Car filtering and search
 * - Form validation and submission
 */

// API Base URL - Change this if your backend is hosted elsewhere
const API_BASE_URL = "http://localhost:3000/api"

// Global variable to store fetched car data
let carData = []

// Function to fetch all cars from the API
async function fetchAllCars(filters = {}) {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams()

    // Add available filter if specified
    if (filters.available === true) {
      queryParams.append("available", "true")
    }

    // Add sort parameter if specified
    if (filters.sort) {
      queryParams.append("sort", filters.sort)
    }

    // Make the API request with query parameters
    const url = `${API_BASE_URL}/cars${queryParams.toString() ? "?" + queryParams.toString() : ""}`
    console.log(`Fetching cars from: ${url}`)

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error("Failed to fetch cars")
    }

    const data = await response.json()
    carData = data // Store the fetched data
    return data
  } catch (error) {
    console.error("Error fetching cars:", error)
    showToast("Failed to load cars. Please try again.", "error")
    return []
  }
}

// Function to fetch a specific car by ID
async function fetchCarById(carId) {
  try {
    console.log(`Making API request to: ${API_BASE_URL}/cars/${carId}`)
    const response = await fetch(`${API_BASE_URL}/cars/${carId}`)

    console.log("API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response:", errorText)
      throw new Error(`Failed to fetch car details: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Car data from API:", data)
    return data
  } catch (error) {
    console.error("Error fetching car details:", error)
    showToast(`Failed to load car details: ${error.message}`, "error")
    return null
  }
}

// Function to submit a review
async function submitReview(carId, reviewData) {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("You must be logged in to submit a review")
    }

    const response = await fetch(`${API_BASE_URL}/cars/${carId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to submit review")
    }

    return await response.json()
  } catch (error) {
    console.error("Error submitting review:", error)
    throw error
  }
}

// Update the reserveCar function to include reservation details
async function reserveCar(carId) {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("You must be logged in to reserve a car")
    }

    // First, get the user profile to get the user ID
    const userProfile = await fetchUserProfile()
    if (!userProfile || !userProfile._id) {
      throw new Error("Could not retrieve user information")
    }

    const userId = userProfile._id

    // Get reservation details from the form
    const hours = Number.parseInt(document.getElementById("hours").value) || 1
    const minutes = Number.parseInt(document.getElementById("minutes").value) || 0

    // Get car details to calculate price
    const car = await fetchCarById(carId)
    if (!car) {
      throw new Error("Could not retrieve car information")
    }

    // Calculate total price
    const totalHours = hours + minutes / 60
    const totalPrice = car.price_per_hour * totalHours

    console.log("Sending reservation request:", {
      userId,
      hours,
      minutes,
      totalPrice,
    })

    // Make the reservation request with details
    const response = await fetch(`${API_BASE_URL}/cars/${carId}/reserve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        hours,
        minutes,
        totalPrice,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to reserve car")
    }

    return await response.json()
  } catch (error) {
    console.error("Error reserving car:", error)
    throw error
  }
}

// Currency conversion rates
const currencyRates = {
  usd: 1,
  egp: 31.15, // 1 USD = 31.15 EGP
}

// Initialize the application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded, initializing app...")

  // Check authentication status
  checkLoginStatus()

  // Setup form validation and submission
  setupForms()

  // Setup UI interactions
  setupUIInteractions()

  // Setup car-related functionality
  setupCarFunctionality()

  // Load car details if on car details page
  loadCarDetails()
})

/**
 * AUTHENTICATION FUNCTIONS
 */

// Check if user is logged in and update UI accordingly
function checkLoginStatus() {
  const token = localStorage.getItem("token")
  const username = localStorage.getItem("username")
  const authButtons = document.querySelector(".auth-buttons")

  console.log("Checking login status:", !!token)

  if (token && username && authButtons) {
    // User is logged in, show user menu
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
    `

    // Add logout event listener
    document.getElementById("logout-btn")?.addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })

    // Setup user menu dropdown toggle
    const userMenuButton = document.querySelector(".user-menu-button")
    const userMenuDropdown = document.querySelector(".user-menu-dropdown")

    if (userMenuButton && userMenuDropdown) {
      userMenuButton.addEventListener("click", (e) => {
        e.stopPropagation()
        userMenuDropdown.classList.toggle("active")
      })

      // Close dropdown when clicking outside
      document.addEventListener("click", () => {
        userMenuDropdown.classList.remove("active")
      })
    }

    // Load profile data if on profile page
    if (window.location.pathname.includes("profile.html")) {
      loadUserProfile()
    }
  }

  // Protect routes that require authentication
  const protectedPages = ["profile.html", "bookings.html"]
  const currentPage = window.location.pathname.split("/").pop()

  if (protectedPages.includes(currentPage) && !token) {
    showToast("Please login to access this page", "error")
    setTimeout(() => {
      window.location.href = "login.html"
    }, 1500)
  }
}

// Handle login form submission
async function handleLogin(email, password) {
  try {
    showToast("Logging in...", "info")

    const response = await fetch(`${API_BASE_URL}/users/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      // Store auth data
      localStorage.setItem("token", data.token)
      localStorage.setItem("username", email.split("@")[0])

      showToast("Login successful!", "success")

      // Redirect to home page
      setTimeout(() => {
        window.location.href = "index.html"
      }, 1500)
    } else {
      showError(data.error || "Login failed. Please check your credentials.")
    }
  } catch (error) {
    console.error("Login error:", error)
    showError("Connection error. Please check if the server is running.")
  }
}

// Handle signup form submission
async function handleSignup(formData) {
  try {
    showToast("Creating your account...", "info")

    console.log("Signup data:", formData)

    const response = await fetch(`${API_BASE_URL}/users/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    console.log("Signup response status:", response.status)

    const data = await response.json()
    console.log("Signup response data:", data)

    if (response.ok) {
      showToast("Account created successfully!", "success")

      // Redirect to login page
      setTimeout(() => {
        window.location.href = "login.html"
      }, 1500)
    } else {
      showError(data.error || "Signup failed. Please try again.")
    }
  } catch (error) {
    console.error("Signup error:", error)
    showError("Connection error. Please check if the server is running.")
  }
}

// Fetch user profile data
async function fetchUserProfile() {
  const token = localStorage.getItem("token")

  if (!token) {
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      return await response.json()
    } else if (response.status === 401) {
      // Token expired or invalid
      logout()
      return null
    } else {
      console.error("Profile fetch error:", await response.text())
      return null
    }
  } catch (error) {
    console.error("Profile fetch error:", error)
    return null
  }
}

// Add this function after the loadUserProfile function if it doesn't exist

// Function to show success message
function showSuccess(message) {
  // Find success message element or create one
  let successElement = document.querySelector(".success-message")
  if (!successElement) {
    successElement = document.createElement("div")
    successElement.className = "success-message"

    // Find a suitable parent element
    const form = document.querySelector(".auth-form")
    if (form) {
      form.appendChild(successElement)
    } else {
      // If no form is found, add to body with fixed positioning
      successElement.style.position = "fixed"
      successElement.style.top = "20px"
      successElement.style.left = "50%"
      successElement.style.transform = "translateX(-50%)"
      successElement.style.zIndex = "1000"
      document.body.appendChild(successElement)
    }
  }

  successElement.textContent = message
  successElement.classList.add("active")

  // Hide success after 3 seconds
  setTimeout(() => {
    successElement.classList.remove("active")
  }, 3000)
}

// Load user profile data
async function loadUserProfile() {
  const profileData = await fetchUserProfile()

  if (profileData) {
    // Update profile page with user data
    const profileNameElement = document.getElementById("profile-name")
    const profileEmailElement = document.getElementById("profile-email")
    const profilePhoneElement = document.getElementById("profile-phone")
    const profileIdElement = document.getElementById("profile-id")

    if (profileNameElement) {
      profileNameElement.textContent = profileData.name || "N/A"
    }
    if (profileEmailElement) {
      profileEmailElement.textContent = profileData.email || "N/A"
    }
    if (profilePhoneElement) {
      profilePhoneElement.textContent = profileData.phone || "N/A"
    }
    if (profileIdElement) {
      profileIdElement.textContent = profileData.idNumber || "N/A"
    }
  } else {
    showToast("Could not load profile data", "error")
  }
}

// Logout user
function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("username")

  showToast("Logged out successfully!", "success")

  // Redirect to home page
  setTimeout(() => {
    window.location.href = "index.html"
  }, 1500)
}

/**
 * FORM SETUP AND VALIDATION
 */

// Setup all forms in the application
function setupForms() {
  // Login form
  const loginForm = document.querySelector(".auth-form")
  if (loginForm && window.location.pathname.includes("login.html")) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const email = document.getElementById("email-phone").value
      const password = document.getElementById("password").value

      if (!email || !password) {
        showError("Please fill in all fields")
        return
      }

      handleLogin(email, password)
    })
  }

  // Signup form
  const signupForm = document.querySelector(".auth-form")
  if (signupForm && window.location.pathname.includes("signup.html")) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const email = document.getElementById("email").value
      const name = document.getElementById("name").value
      const password = document.getElementById("password").value
      const confirmPassword = document.getElementById("confirm-password").value
      const phone = document.getElementById("phone").value
      const id = document.getElementById("id").value

      // Basic validation
      if (!email || !name || !password || !confirmPassword || !phone || !id) {
        showError("Please fill in all fields")
        return
      }

      if (password !== confirmPassword) {
        showError("Passwords do not match")
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        showError("Please enter a valid email address")
        return
      }

      // Phone validation - basic check for length
      if (phone.length < 8) {
        showError("Please enter a valid phone number")
        return
      }

      const formData = {
        email,
        name,
        password,
        confirmPassword,
        phone,
        idNumber: id,
      }

      handleSignup(formData)
    })
  }

  // Contact form
  const contactForm = document.getElementById("contact-form")
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const name = document.getElementById("contact-name").value
      const email = document.getElementById("contact-email").value
      const subject = document.getElementById("contact-subject").value
      const message = document.getElementById("contact-message").value

      if (!name || !email || !subject || !message) {
        showError("Please fill in all fields")
        return
      }

      // In a real app, this would send the form data to a server
      showToast("Your message has been sent successfully!", "success")
      contactForm.reset()
    })
  }
}

/**
 * UI INTERACTION FUNCTIONS
 */

// Setup all UI interactions
function setupUIInteractions() {
  setupDarkMode()
  setupLanguageCurrencySelectors()
  setupTimeInputs()
}

// Setup dark mode toggle
function setupDarkMode() {
  const darkModeToggle = document.getElementById("dark-mode-toggle")

  if (darkModeToggle) {
    // Check if dark mode is enabled in localStorage
    const isDarkMode = localStorage.getItem("darkMode") === "true"

    // Apply dark mode if enabled
    if (isDarkMode) {
      document.body.classList.add("dark-mode")
      darkModeToggle.checked = true
    }

    // Add event listener to toggle dark mode
    darkModeToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("dark-mode")
        localStorage.setItem("darkMode", "true")
      } else {
        document.body.classList.remove("dark-mode")
        localStorage.setItem("darkMode", "false")
      }
    })
  }
}

// Setup language and currency selectors
function setupLanguageCurrencySelectors() {
  // Language selector
  const languageBtn = document.getElementById("language-btn")
  const languageDropdown = document.getElementById("language-dropdown")

  if (languageBtn && languageDropdown) {
    languageBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      languageDropdown.classList.toggle("active")

      // Close currency dropdown if open
      const currencyDropdown = document.getElementById("currency-dropdown")
      if (currencyDropdown && currencyDropdown.classList.contains("active")) {
        currencyDropdown.classList.remove("active")
      }
    })

    // Language selection
    const languageOptions = languageDropdown.querySelectorAll("a")
    languageOptions.forEach((option) => {
      option.addEventListener("click", function (e) {
        e.preventDefault()
        const lang = this.getAttribute("data-lang")
        const langText = lang.toUpperCase()

        // Update button text
        languageBtn.querySelector("span").textContent = langText

        // Close dropdown
        languageDropdown.classList.remove("active")

        // Save to localStorage
        localStorage.setItem("language", lang)

        // Show toast
        showToast(`Language changed to ${this.textContent}`, "success")

        // Apply language change
        applyLanguageChange(lang)
      })
    })
  }

  // Currency selector
  const currencyBtn = document.getElementById("currency-btn")
  const currencyDropdown = document.getElementById("currency-dropdown")

  if (currencyBtn && currencyDropdown) {
    currencyBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      currencyDropdown.classList.toggle("active")

      // Close language dropdown if open
      const languageDropdown = document.getElementById("language-dropdown")
      if (languageDropdown && languageDropdown.classList.contains("active")) {
        languageDropdown.classList.remove("active")
      }
    })

    // Currency selection
    const currencyOptions = currencyDropdown.querySelectorAll("a")
    currencyOptions.forEach((option) => {
      option.addEventListener("click", function (e) {
        e.preventDefault()
        const currency = this.getAttribute("data-currency")
        const currencyText = currency.toUpperCase()

        // Update button text
        currencyBtn.querySelector("span").textContent = currencyText

        // Close dropdown
        currencyDropdown.classList.remove("active")

        // Save to localStorage
        localStorage.setItem("currency", currency)

        // Apply currency change
        applyCurrencyChange(currency)

        // Show toast
        showToast(`Currency changed to ${currencyText}`, "success")
      })
    })
  }

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    const dropdowns = document.querySelectorAll(".selector-dropdown")
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("active")
    })
  })

  // Load saved preferences
  loadSavedPreferences()
}

// Setup time inputs on car details page
function setupTimeInputs() {
  const hoursInput = document.getElementById("hours")
  const minutesInput = document.getElementById("minutes")
  const totalPriceElement = document.getElementById("total-price")

  if (hoursInput && minutesInput && totalPriceElement) {
    const updateTotalPrice = () => {
      const hours = Number.parseInt(hoursInput.value) || 0
      const minutes = Number.parseInt(minutesInput.value) || 0

      // Ensure hours is at least 1
      if (hours < 1 && minutes === 0) {
        hoursInput.value = 1
        return
      }

      // Calculate total time in hours
      const totalHours = hours + minutes / 60

      // Get base price per hour (assuming $10/hour for this example)
      const basePrice = 10

      // Calculate total price
      const totalPrice = basePrice * totalHours

      // Get current currency
      const currency = localStorage.getItem("currency") || "usd"
      const rate = currencyRates[currency] || 1
      const symbol = currency === "usd" ? "$" : "E£"

      // Update total price display
      totalPriceElement.textContent = `${symbol}${(totalPrice * rate).toFixed(2)}`
    }

    // Add event listeners to update price when time changes
    hoursInput.addEventListener("input", updateTotalPrice)
    minutesInput.addEventListener("input", updateTotalPrice)

    // Set initial values
    hoursInput.value = 1
    minutesInput.value = 0

    // Calculate initial price
    updateTotalPrice()
  }
}

// Load saved preferences
function loadSavedPreferences() {
  // Load language
  const savedLanguage = localStorage.getItem("language")
  if (savedLanguage) {
    const languageBtn = document.getElementById("language-btn")
    if (languageBtn) {
      languageBtn.querySelector("span").textContent = savedLanguage.toUpperCase()
    }

    // Apply language change
    applyLanguageChange(savedLanguage)
  }

  // Load currency
  const savedCurrency = localStorage.getItem("currency")
  if (savedCurrency) {
    const currencyBtn = document.getElementById("currency-btn")
    if (currencyBtn) {
      currencyBtn.querySelector("span").textContent = savedCurrency.toUpperCase()
    }

    // Apply currency change
    applyCurrencyChange(savedCurrency)
  }
}

// Apply language change
function applyLanguageChange(lang) {
  // This is a simplified implementation
  // In a real app, you would load language files or use a translation library

  // Apply RTL for Arabic
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"

  // You would implement actual text translations here
  console.log(`Language changed to ${lang}`)
}

// Apply currency change
function applyCurrencyChange(currency) {
  const rate = currencyRates[currency] || 1
  const symbol = currency === "usd" ? "$" : "E£"

  // Update all price displays
  document.querySelectorAll(".car-price").forEach((element) => {
    const priceText = element.textContent
    const match = priceText.match(/\d+(\.\d+)?/)

    if (match) {
      const basePrice = Number.parseFloat(match[0])
      const convertedPrice = (basePrice * rate).toFixed(1)
      const hour = localStorage.getItem("language") === "ar" ? "ساعة" : "hour"
      element.textContent = `${symbol}${convertedPrice}/${hour}`
    }
  })

  // Update price display in car details page if it exists
  const totalPriceElement = document.getElementById("total-price")
  if (totalPriceElement) {
    const priceText = totalPriceElement.textContent
    const match = priceText.match(/\d+(\.\d+)?/)

    if (match) {
      const basePrice = Number.parseFloat(match[0])
      const convertedPrice = (basePrice * rate).toFixed(2)
      totalPriceElement.textContent = `${symbol}${convertedPrice}`
    }
  }
}

/**
 * CAR FUNCTIONALITY
 */

// Setup car-related functionality
function setupCarFunctionality() {
  // Load cars from API first
  loadCarsFromAPI()

  // Then setup the UI interactions
  setupCarFilters()
  setupCarSearch()
  setupPriceFilter()
  setupRentButtons()
}

// Function to load cars from API and render them
async function loadCarsFromAPI(filters = {}) {
  const carsContainer = document.getElementById("cars-container")
  if (!carsContainer) return

  // Show loading state
  carsContainer.innerHTML = '<div class="loading">Loading cars...</div>'

  // Fetch cars from API with filters
  const cars = await fetchAllCars(filters)

  // Render cars
  if (cars.length > 0) {
    renderCars(cars)
  } else {
    carsContainer.innerHTML = '<div class="no-cars">No cars available with the selected filters.</div>'
  }
}

// Render cars
function renderCars(cars) {
  const carsContainer = document.getElementById("cars-container")
  if (!carsContainer) return

  // Get current currency and language
  const currency = localStorage.getItem("currency") || "usd"
  const lang = localStorage.getItem("language") || "en"
  const rate = currencyRates[currency] || 1
  const symbol = getCurrencySymbol()
  const hour = lang === "ar" ? "ساعة" : "hour"

  // Clear container
  carsContainer.innerHTML = ""

  // Add cars to container
  cars.forEach((car) => {
    const convertedPrice = (car.price_per_hour * rate).toFixed(1)

    const carCard = document.createElement("div")
    carCard.className = "car-card"
    carCard.onclick = () => {
      window.location.href = `car-details.html?id=${car._id}`
    }

    // Use actual image if available, otherwise use placeholder
    const imageHtml = car.image
      ? `<img src="${car.image}" alt="${car.name}" class="car-image-img">`
      : `<div class="car-image-placeholder">${car.name}</div>`

    carCard.innerHTML = `
      <div class="car-image">
        ${imageHtml}
      </div>
      <div class="car-info">
        <div class="car-name">${car.name}</div>
        <div class="car-price">${symbol}${convertedPrice}/${hour}</div>
      </div>
    `

    carsContainer.appendChild(carCard)
  })
}

// Update the searchCars function to use the backend API
async function searchCars(searchTerm) {
  const carsContainer = document.getElementById("cars-container")
  if (!carsContainer) return

  // Show loading state
  carsContainer.innerHTML = '<div class="loading">Searching cars...</div>'

  try {
    // Get other active filters
    const availableFilter = document.getElementById("available-filter")
    const availableOnly = availableFilter && availableFilter.classList.contains("active")

    const activeSort = document.querySelector(".sort-btn.active")
    const sortValue = activeSort ? activeSort.getAttribute("data-sort") : "new"

    // Build query parameters
    const queryParams = new URLSearchParams()
    if (availableOnly) {
      queryParams.append("available", "true")
    }

    // Map frontend sort values to backend sort values
    let backendSort = sortValue
    if (sortValue === "new") {
      // Backend uses createdAt for newest, which is the default
      backendSort = null
    } else {
      queryParams.append("sort", sortValue)
    }

    // Add search parameter - note: we're doing client-side filtering for search
    // since the backend doesn't directly support name search yet

    // Make the API request
    const url = `${API_BASE_URL}/cars${queryParams.toString() ? "?" + queryParams.toString() : ""}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error("Failed to fetch cars")
    }

    const cars = await response.json()

    // Filter by search term client-side
    const filteredCars = cars.filter((car) => car.name.toLowerCase().includes(searchTerm.toLowerCase()))

    // Apply recommended filter if active
    const recommendedFilter = document.getElementById("recommended-filter")
    if (recommendedFilter && recommendedFilter.classList.contains("active")) {
      const recommendedCars = filteredCars.filter((car) => {
        if (car.reviews.length === 0) return false
        const avgRating = car.reviews.reduce((sum, review) => sum + review.rating, 0) / car.reviews.length
        return avgRating >= 4.5
      })

      renderCars(recommendedCars)

      if (recommendedCars.length === 0) {
        carsContainer.innerHTML = '<div class="no-cars">No recommended cars found matching your search.</div>'
      }
    } else {
      renderCars(filteredCars)

      if (filteredCars.length === 0) {
        carsContainer.innerHTML = '<div class="no-cars">No cars found matching your search.</div>'
      }
    }

    if (filteredCars.length > 0) {
      showToast(`Found ${filteredCars.length} cars matching "${searchTerm}"`, "success")
    } else {
      showToast("No cars found matching your search", "info")
    }
  } catch (error) {
    console.error("Error searching cars:", error)
    carsContainer.innerHTML = `<div class="error">Error searching cars: ${error.message}</div>`
    showToast("Failed to search cars. Please try again.", "error")
  }
}

// Filter cars by price
function filterCarsByPrice(min, max) {
  const carsContainer = document.getElementById("cars-container")
  if (!carsContainer) return

  // Get currency info for conversion
  const currency = localStorage.getItem("currency") || "usd"
  const rate = currencyRates[currency] || 1

  // Convert to USD for internal filtering
  const minUSD = Math.floor(min / rate)
  const maxUSD = Math.floor(max / rate)

  // Filter cars by price range
  const filteredCars = carData.filter((car) => car.price_per_hour >= minUSD && car.price_per_hour <= maxUSD)

  if (filteredCars.length === 0) {
    showToast("No cars found in this price range", "error")
    return
  }

  // Render filtered cars
  renderCars(filteredCars)
}

// Sort cars
function sortCars(sortType) {
  const sortedCars = [...carData]

  switch (sortType) {
    case "new":
      // Since we don't have an isNew field in the database, we'll sort by _id (newer documents have larger ObjectIDs)
      sortedCars.sort((a, b) => (b._id > a._id ? 1 : -1))
      break
    case "price-desc":
      sortedCars.sort((a, b) => b.price_per_hour - a.price_per_hour)
      break
    case "price-asc":
      sortedCars.sort((a, b) => a.price_per_hour - b.price_per_hour)
      break
    case "rating":
      // Calculate average rating from reviews
      sortedCars.sort((a, b) => {
        const aRating =
          a.reviews.length > 0 ? a.reviews.reduce((sum, review) => sum + review.rating, 0) / a.reviews.length : 0
        const bRating =
          b.reviews.length > 0 ? b.reviews.reduce((sum, review) => sum + review.rating, 0) / b.reviews.length : 0
        return bRating - aRating
      })
      break
  }

  // Apply any active filters
  applyFilters(sortedCars)
}

// Apply filters
function applyFilters(cars = [...carData]) {
  const recommendedFilter = document.getElementById("recommended-filter")
  const availableFilter = document.getElementById("available-filter")

  let filteredCars = cars

  // Apply recommended filter - cars with high ratings
  if (recommendedFilter && recommendedFilter.classList.contains("active")) {
    filteredCars = filteredCars.filter((car) => {
      if (car.reviews.length === 0) return false
      const avgRating = car.reviews.reduce((sum, review) => sum + review.rating, 0) / car.reviews.length
      return avgRating >= 4.5
    })
  }

  // Apply available filter - cars that are not reserved
  if (availableFilter && availableFilter.classList.contains("active")) {
    filteredCars = filteredCars.filter((car) => !car.reserved)
  }

  // Render filtered cars
  renderCars(filteredCars)
}

// Add a function to load car details on the car details page
async function loadCarDetails() {
  // Check if we're on the car details page
  if (!window.location.pathname.includes("car-details.html")) return

  // Get car ID from URL
  const urlParams = new URLSearchParams(window.location.search)
  const carId = urlParams.get("id")

  console.log("Loading car details for ID:", carId)

  if (!carId) {
    showToast("Car ID not found", "error")
    setTimeout(() => {
      window.location.href = "index.html"
    }, 1500)
    return
  }

  // Show loading state
  const carDetailsContainer = document.querySelector(".car-details-container")
  if (carDetailsContainer) {
    carDetailsContainer.innerHTML = '<div class="loading">Loading car details...</div>'
  }

  try {
    // Fetch car details
    console.log("Fetching car with ID:", carId)
    const car = await fetchCarById(carId)
    console.log("Car data received:", car)

    if (!car) {
      if (carDetailsContainer) {
        carDetailsContainer.innerHTML = '<div class="error">Failed to load car details.</div>'
      }
      return
    }

    // Update the page with car details
    updateCarDetailsPage(car)
  } catch (error) {
    console.error("Error in loadCarDetails:", error)
    if (carDetailsContainer) {
      carDetailsContainer.innerHTML = `<div class="error">Error loading car details: ${error.message}</div>`
    }
  }
}

// Function to update the car details page with the fetched car data
function updateCarDetailsPage(car) {
  if (!car) {
    console.error("No car data provided to updateCarDetailsPage")
    return
  }

  console.log("Updating car details page with data:", car)

  // Get currency info
  const currency = localStorage.getItem("currency") || "usd"
  const symbol = getCurrencySymbol()
  const rate = currencyRates[currency] || 1

  // Create the car details HTML structure
  const carDetailsContainer = document.querySelector(".car-details-container")
  if (!carDetailsContainer) {
    console.error("Car details container not found")
    return
  }

  // Rebuild the entire car details container with the car data
  carDetailsContainer.innerHTML = `
    <div class="car-image-large">
      ${
        car.image
          ? `<img src="${car.image}" alt="${car.name}" class="car-image-large-img">`
          : `<div class="placeholder-image">${car.name || "Car Image"}</div>`
      }
    </div>
    <div class="car-info-details">
      <h1>${car.name || "Car Details"}</h1>
      <div class="car-specs">
        <div class="spec">
          <i class="fas fa-user"></i>
          <span>${car.seats || "N/A"} Seats</span>
        </div>
        <div class="spec">
          <i class="fas fa-cog"></i>
          <span>${car.transmission ? car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1) : "N/A"}</span>
        </div>
        <div class="spec">
          <i class="fas fa-gas-pump"></i>
          <span>${car.fuel_type ? car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1) : "N/A"}</span>
        </div>
      </div>
      <div class="rental-details">
        <div class="time-selector">
          <label for="hours">Rental Time:</label>
          <input type="number" id="hours" class="time-input" min="1" value="1" placeholder="Hours">
          <span>hours</span>
          <input type="number" id="minutes" class="time-input" min="0" max="59" value="0" placeholder="Minutes">
          <span>minutes</span>
        </div>
        <div class="price-display" id="total-price">${symbol}${((car.price_per_hour || 0) * rate).toFixed(2)}</div>
      </div>
      <a href="#" class="btn-primary" data-car-id="${car._id}">Rent Now</a>
      
      <div class="car-description">
        <h2>Description</h2>
        <p>${car.description || "No description available."}</p>
      </div>
    </div>
  `

  // Setup time inputs for price calculation
  const hoursInput = document.getElementById("hours")
  const minutesInput = document.getElementById("minutes")
  const priceElement = document.getElementById("total-price")

  if (hoursInput && minutesInput && priceElement) {
    const basePrice = car.price_per_hour || 0

    const updateTotalPrice = () => {
      const hours = Number.parseInt(hoursInput.value) || 0
      const minutes = Number.parseInt(minutesInput.value) || 0

      // Ensure hours is at least 1
      if (hours < 1 && minutes === 0) {
        hoursInput.value = 1
        return
      }

      // Calculate total time in hours
      const totalHours = hours + minutes / 60

      // Calculate total price
      const totalPrice = basePrice * totalHours

      // Update total price display
      priceElement.textContent = `${symbol}${(totalPrice * rate).toFixed(2)}`
    }

    // Add event listeners
    hoursInput.addEventListener("input", updateTotalPrice)
    minutesInput.addEventListener("input", updateTotalPrice)
  }

  // Update reviews section
  updateReviewsSection(car)

  // Update rent button click handler
  const rentButton = document.querySelector(".rental-details + .btn-primary")
  if (rentButton) {
    rentButton.addEventListener("click", async (e) => {
      e.preventDefault()

      // Check if user is logged in
      const token = localStorage.getItem("token")
      if (!token) {
        showToast("Please login to rent a car", "error")
        setTimeout(() => {
          window.location.href = "login.html"
        }, 1500)
        return
      }

      const hours = document.getElementById("hours").value
      const minutes = document.getElementById("minutes").value

      if (!hours || hours < 1) {
        showToast("Please select at least 1 hour for rental", "error")
        return
      }

      try {
        // Show loading toast
        showToast("Processing your reservation...", "info")

        // Get car ID from button data attribute
        const carId = rentButton.getAttribute("data-car-id")

        // Make the reservation
        await reserveCar(carId)

        // Show success message
        showToast("Car reserved successfully!", "success")

        // Redirect to bookings page
        setTimeout(() => {
          window.location.href = "bookings.html"
        }, 1500)
      } catch (error) {
        showToast(`Reservation failed: ${error.message}`, "error")
      }
    })
  }

  console.log("Car details page updated successfully")
}

// Function to update the reviews section
function updateReviewsSection(car) {
  // Get the reviews container
  const reviewsSection = document.querySelector("section")
  if (!reviewsSection) return

  // Check if the reviews heading exists, if not create it
  let reviewsHeading = reviewsSection.querySelector("h2:last-of-type")
  if (!reviewsHeading) {
    reviewsHeading = document.createElement("h2")
    reviewsHeading.textContent = "Reviews"
    reviewsSection.appendChild(reviewsHeading)
  }

  // Get or create the reviews container
  let reviewsContainer = reviewsSection.querySelector(".reviews-container")
  if (!reviewsContainer) {
    reviewsContainer = document.createElement("div")
    reviewsContainer.className = "reviews-container"
    reviewsSection.appendChild(reviewsContainer)
  }

  // Clear existing reviews
  reviewsContainer.innerHTML = ""

  // Add review form for logged-in users
  const isLoggedIn = !!localStorage.getItem("token")
  const username = localStorage.getItem("username")

  if (isLoggedIn) {
    const reviewFormContainer = document.createElement("div")
    reviewFormContainer.className = "review-form-container"
    reviewFormContainer.innerHTML = `
      <h3>Write a Review</h3>
      <form id="review-form" class="review-form">
        <div class="form-group">
          <label for="review-rating">Rating:</label>
          <div class="rating-input">
            <input type="number" id="review-rating" min="1" max="5" value="5" required>
            <span class="rating-stars">★★★★★</span>
          </div>
        </div>
        <div class="form-group">
          <label for="review-comment">Your Review:</label>
          <textarea id="review-comment" rows="4" placeholder="Share your experience with this car..." required></textarea>
        </div>
        <button type="submit" class="btn-primary">Submit Review</button>
      </form>
    `
    reviewsContainer.appendChild(reviewFormContainer)

    // Setup rating input to update stars
    const ratingInput = document.getElementById("review-rating")
    const ratingStars = document.querySelector(".rating-stars")

    if (ratingInput && ratingStars) {
      ratingInput.addEventListener("input", () => {
        const rating = Number.parseInt(ratingInput.value) || 5
        const validRating = Math.min(Math.max(rating, 1), 5) // Ensure rating is between 1-5
        ratingStars.textContent = "★".repeat(validRating) + "☆".repeat(5 - validRating)
      })
    }

    // Setup review form submission
    const reviewForm = document.getElementById("review-form")
    if (reviewForm) {
      reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault()

        const rating = Number.parseInt(document.getElementById("review-rating").value)
        const comment = document.getElementById("review-comment").value

        if (isNaN(rating) || rating < 1 || rating > 5) {
          showToast("Please provide a valid rating between 1 and 5", "error")
          return
        }

        if (!comment.trim()) {
          showToast("Please provide a review comment", "error")
          return
        }

        try {
          const reviewData = {
            user: username,
            rating,
            comment,
          }

          showToast("Submitting your review...", "info")

          await submitReview(car._id, reviewData)

          showToast("Review submitted successfully!", "success")

          // Refresh the car details to show the new review
          const updatedCar = await fetchCarById(car._id)
          if (updatedCar) {
            // Only update the reviews section, not the entire page
            displayReviews(updatedCar)
          }

          // Reset the form
          reviewForm.reset()
          ratingStars.textContent = "★★★★★"
        } catch (error) {
          showToast(`Failed to submit review: ${error.message}`, "error")
        }
      })
    }
  } else {
    // Show login prompt for non-logged in users
    const loginPrompt = document.createElement("div")
    loginPrompt.className = "login-prompt"
    loginPrompt.innerHTML = `
      <p>Please <a href="login.html">login</a> to leave a review.</p>
    `
    reviewsContainer.appendChild(loginPrompt)
  }

  // Display existing reviews
  displayReviews(car)
}

// Function to display reviews
function displayReviews(car) {
  const reviewsContainer = document.querySelector(".reviews-container")
  if (!reviewsContainer) return

  // Find the reviews list or create it
  let reviewsList = reviewsContainer.querySelector(".reviews-list")
  if (!reviewsList) {
    reviewsList = document.createElement("div")
    reviewsList.className = "reviews-list"

    // Insert after the review form or login prompt
    const formOrPrompt = reviewsContainer.querySelector(".review-form-container, .login-prompt")
    if (formOrPrompt) {
      reviewsContainer.insertBefore(reviewsList, formOrPrompt.nextSibling)
    } else {
      reviewsContainer.appendChild(reviewsList)
    }
  } else {
    // Clear existing reviews
    reviewsList.innerHTML = ""
  }

  // Check if there are reviews
  if (!car.reviews || car.reviews.length === 0) {
    reviewsList.innerHTML = "<p class='no-reviews'>No reviews yet for this car.</p>"
    return
  }

  // Add reviews heading
  const reviewsHeading = document.createElement("h3")
  reviewsHeading.textContent = "Customer Reviews"
  reviewsList.appendChild(reviewsHeading)

  // Add reviews
  car.reviews.forEach((review) => {
    const reviewCard = document.createElement("div")
    reviewCard.className = "review-card"

    // Create stars based on rating
    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating)

    // Format date
    const reviewDate = new Date(review.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    reviewCard.innerHTML = `
      <div class="stars">${stars}</div>
      <p>${review.comment || "No comment provided."}</p>
      <div class="review-meta">
        <span>${review.user || "Anonymous"}</span>
        <span>${reviewDate}</span>
      </div>
    `

    reviewsList.appendChild(reviewCard)
  })
}

/**
 * UTILITY FUNCTIONS
 */

// Get currency symbol
function getCurrencySymbol() {
  const currency = localStorage.getItem("currency") || "usd"
  return currency === "usd" ? "$" : "E£"
}

// Show error message
function showError(message) {
  // Find error message element or create one
  let errorElement = document.querySelector(".error-message")
  if (!errorElement) {
    errorElement = document.createElement("div")
    errorElement.className = "error-message"

    // Find a suitable parent element
    const form = document.querySelector(".auth-form")
    if (form) {
      form.appendChild(errorElement)
    } else {
      // If no form is found, add to body with fixed positioning
      errorElement.style.position = "fixed"
      errorElement.style.top = "20px"
      errorElement.style.left = "50%"
      errorElement.style.transform = "translateX(-50%)"
      errorElement.style.zIndex = "1000"
      document.body.appendChild(errorElement)
    }
  }

  errorElement.textContent = message
  errorElement.classList.add("active")

  // Hide error after 3 seconds
  setTimeout(() => {
    errorElement.classList.remove("active")
  }, 3000)
}

// Show toast notification
function showToast(message, type = "info") {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.className = "toast-container"
    document.body.appendChild(toastContainer)
  }

  // Create toast element
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.innerHTML = `
    <div>${message}</div>
    <button class="toast-close">&times;</button>
  `

  // Add toast to container
  toastContainer.appendChild(toast)

  // Add close event listener
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.remove()
  })

  // Auto-remove toast after 3 seconds
  setTimeout(() => {
    toast.remove()
  }, 3000)
}

// Setup car filters
function setupCarFilters() {
  // Get filter elements
  const recommendedFilter = document.getElementById("recommended-filter")
  const availableFilter = document.getElementById("available-filter")
  const sortButtons = document.querySelectorAll(".sort-btn")

  // Set up filter button click handlers
  if (recommendedFilter) {
    recommendedFilter.addEventListener("click", function () {
      // Toggle active class
      this.classList.toggle("active")

      // If recommended is active, we'll need to do client-side filtering
      // since the backend doesn't have a direct "recommended" filter
      if (this.classList.contains("active")) {
        // First get all cars with backend filtering for other active filters
        const availableOnly = availableFilter && availableFilter.classList.contains("active")

        // Get the current sort option
        const activeSort = document.querySelector(".sort-btn.active")
        const sortValue = activeSort ? activeSort.getAttribute("data-sort") : "new"

        // Fetch cars with backend filters
        fetchAllCars({ available: availableOnly, sort: sortValue }).then((cars) => {
          // Then filter for recommended (high rated) cars client-side
          const recommendedCars = cars.filter((car) => {
            if (car.reviews.length === 0) return false
            const avgRating = car.reviews.reduce((sum, review) => sum + review.rating, 0) / car.reviews.length
            return avgRating >= 4.5
          })

          // Render the filtered cars
          renderCars(recommendedCars)
        })
      } else {
        // If recommended is not active, just use other filters
        const availableOnly = availableFilter && availableFilter.classList.contains("active")

        // Get the current sort option
        const activeSort = document.querySelector(".sort-btn.active")
        const sortValue = activeSort ? activeSort.getAttribute("data-sort") : "new"

        // Load cars with backend filters
        loadCarsFromAPI({ available: availableOnly, sort: sortValue })
      }
    })
  }

  // Set up available filter
  if (availableFilter) {
    availableFilter.addEventListener("click", function () {
      // Toggle active class
      this.classList.toggle("active")

      // Get filter state
      const availableOnly = this.classList.contains("active")

      // Get the current sort option
      const activeSort = document.querySelector(".sort-btn.active")
      const sortValue = activeSort ? activeSort.getAttribute("data-sort") : "new"

      // If recommended filter is active, we need to apply that filter client-side
      if (recommendedFilter && recommendedFilter.classList.contains("active")) {
        fetchAllCars({ available: availableOnly, sort: sortValue }).then((cars) => {
          // Filter for recommended cars
          const recommendedCars = cars.filter((car) => {
            if (car.reviews.length === 0) return false
            const avgRating = car.reviews.reduce((sum, review) => sum + review.rating, 0) / car.reviews.length
            return avgRating >= 4.5
          })

          // Render the filtered cars
          renderCars(recommendedCars)
        })
      } else {
        // Just use backend filtering
        loadCarsFromAPI({ available: availableOnly, sort: sortValue })
      }
    })
  }

  // Set up sort buttons
  if (sortButtons) {
    sortButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Remove active class from all sort buttons
        sortButtons.forEach((btn) => btn.classList.remove("active"))

        // Add active class to clicked button
        this.classList.add("active")

        // Get sort value
        const sortValue = this.getAttribute("data-sort")

        // Map frontend sort values to backend sort values
        let backendSort = sortValue
        if (sortValue === "new") {
          // Backend uses createdAt for newest, which is the default
          backendSort = null
        }

        // Get other filter states
        const availableOnly = availableFilter && availableFilter.classList.contains("active")

        // If recommended filter is active, we need to apply that filter client-side
        if (recommendedFilter && recommendedFilter.classList.contains("active")) {
          fetchAllCars({ available: availableOnly, sort: backendSort }).then((cars) => {
            // Filter for recommended cars
            const recommendedCars = cars.filter((car) => {
              if (car.reviews.length === 0) return false
              const avgRating = car.reviews.reduce((sum, review) => sum + review.rating, 0) / car.reviews.length
              return avgRating >= 4.5
            })

            // Render the filtered cars
            renderCars(recommendedCars)
          })
        } else {
          // Just use backend filtering
          loadCarsFromAPI({ available: availableOnly, sort: backendSort })
        }
      })
    })
  }
}

// Update the setupCarSearch function to use backend filtering when possible
function setupCarSearch() {
  const searchInput = document.getElementById("car-search")
  const searchButton = document.getElementById("search-btn")

  if (searchInput && searchButton) {
    searchButton.addEventListener("click", () => {
      const searchTerm = searchInput.value.trim().toLowerCase()

      if (!searchTerm) {
        // If search is empty, just load all cars with current filters
        const availableFilter = document.getElementById("available-filter")
        const availableOnly = availableFilter && availableFilter.classList.contains("active")

        const activeSort = document.querySelector(".sort-btn.active")
        const sortValue = activeSort ? activeSort.getAttribute("data-sort") : "new"

        loadCarsFromAPI({ available: availableOnly, sort: sortValue })
        return
      }

      // For search, we need to do client-side filtering since the backend doesn't support name search
      // First get all cars with other filters
      const availableFilter = document.getElementById("available-filter")
      const availableOnly = availableFilter && availableFilter.classList.contains("active")

      const activeSort = document.querySelector(".sort-btn.active")
      const sortValue = activeSort ? activeSort.getAttribute("data-sort") : "new"

      fetchAllCars({ available: availableOnly, sort: sortValue }).then((cars) => {
        // Filter by search term
        const filteredCars = cars.filter((car) => car.name.toLowerCase().includes(searchTerm))

        // Apply recommended filter if active
        const recommendedFilter = document.getElementById("recommended-filter")
        if (recommendedFilter && recommendedFilter.classList.contains("active")) {
          const recommendedCars = filteredCars.filter((car) => {
            if (car.reviews.length === 0) return false
            const avgRating = car.reviews.reduce((sum, review) => sum + review.rating, 0) / car.reviews.length
            return avgRating >= 4.5
          })

          renderCars(recommendedCars)
        } else {
          renderCars(filteredCars)
        }

        if (filteredCars.length === 0) {
          showToast("No cars found matching your search", "error")
        } else {
          showToast(`Found ${filteredCars.length} cars matching "${searchTerm}"`, "success")
        }
      })
    })

    // Add event listener for Enter key
    searchInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        searchButton.click()
      }
    })
  }
}

// Update the setupPriceFilter function to use backend filtering when possible
function setupPriceFilter() {
  const minPriceInput = document.getElementById("min-price-input")
  const maxPriceInput = document.getElementById("max-price-input")
  const applyPriceFilterBtn = document.getElementById("apply-price-filter")

  if (minPriceInput && maxPriceInput && applyPriceFilterBtn) {
    applyPriceFilterBtn.addEventListener("click", () => {
      const minPrice = Number(minPriceInput.value) || 0
      const maxPrice = Number(maxPriceInput.value) || 5000

      // Update price display
      const minPriceDisplay = document.getElementById("min-price-display")
      const maxPriceDisplay = document.getElementById("max-price-display")

      if (minPriceDisplay && maxPriceDisplay) {
        const symbol = getCurrencySymbol()
        minPriceDisplay.textContent = `${symbol}${minPrice}`
        maxPriceDisplay.textContent = `${symbol}${maxPrice}`
      }

      // For price filtering, we need to do client-side filtering since the backend doesn't support price range
      // First get all cars with other filters
      const availableFilter = document.getElementById("available-filter")
      const availableOnly = availableFilter && availableFilter.classList.contains("active")

      const activeSort = document.querySelector(".sort-btn.active")
      const sortValue = activeSort ? activeSort.getAttribute("data-sort") : "new"

      // Get currency info for conversion
      const currency = localStorage.getItem("currency") || "usd"
      const rate = currencyRates[currency] || 1

      // Convert to USD for internal filtering (since backend stores prices in USD)
      const minUSD = Math.floor(minPrice / rate)
      const maxUSD = Math.ceil(maxPrice / rate)

      fetchAllCars({ available: availableOnly, sort: sortValue }).then((cars) => {
        // Filter by price range
        const filteredCars = cars.filter((car) => car.price_per_hour >= minUSD && car.price_per_hour <= maxUSD)

        // Apply recommended filter if active
        const recommendedFilter = document.getElementById("recommended-filter")
        if (recommendedFilter && recommendedFilter.classList.contains("active")) {
          const recommendedCars = filteredCars.filter((car) => {
            if (car.reviews.length === 0) return false
            const avgRating = car.reviews.reduce((sum, review) => sum + review.rating, 0) / car.reviews.length
            return avgRating >= 4.5
          })

          renderCars(recommendedCars)
        } else {
          renderCars(filteredCars)
        }

        if (filteredCars.length === 0) {
          showToast("No cars found in this price range", "error")
        } else {
          showToast(`Found ${filteredCars.length} cars in the selected price range`, "success")
        }
      })
    })
  }
}

// Setup rent buttons
function setupRentButtons() {
  // Placeholder for rent button setup logic
  console.log("Rent buttons setup")
}
