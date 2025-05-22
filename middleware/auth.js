const jwt = require("jsonwebtoken")

const authMiddleware = (req, res, next) => {
  console.log("Auth middleware called")
  const token = req.header("Authorization")?.split(" ")[1]

  console.log("Token received:", token ? "Token exists" : "No token")

  if (!token) {
    console.log("No token provided, returning 401")
    return res.status(401).json({ error: "No token provided" })
  }

  try {
    console.log("Verifying token...")
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("Token verified, user ID:", decoded.id)
    req.user = decoded // Attach user info to request object
    next()
  } catch (error) {
    console.error("Token verification failed:", error.message)
    return res.status(401).json({ error: "Invalid token" })
  }
}

module.exports = authMiddleware
