const nodemailer = require("nodemailer")

// Replace the entire transporter creation with this more robust version
// Create a transporter using environment variables with fallback
let transporter
let emailConfigured = false

// Check if email credentials are available
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
    emailConfigured = true
    console.log("Email transport configured successfully")
  } catch (error) {
    console.error("Failed to configure email transport:", error)
  }
} else {
  console.warn("Email credentials not found in environment variables. Email sending will be simulated.")
}

// Update the sendEmail function to handle missing credentials
const sendEmail = async (to, subject, html) => {
  try {
    // If email is not configured, log the email content instead of sending
    if (!emailConfigured) {
      console.log("=== EMAIL WOULD BE SENT (SIMULATION MODE) ===")
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`Content: ${html.substring(0, 100)}...`)
      console.log("=== END OF SIMULATED EMAIL ===")
      return { simulated: true, message: "Email sending simulated (credentials not configured)" }
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    }

    console.log(`Sending email to ${to} with subject: ${subject}`)
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.response)
    return info
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

// Update the sendReservationEmail function to handle errors better
const sendReservationEmail = async (userEmail, car, reservationTime) => {
  const subject = `CarRent: Your Car Reservation Confirmation`

  // Format the reservation time
  const formattedTime = new Date(reservationTime).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #0066cc; text-align: center;">Car Reservation Confirmation</h2>
      
      <p>Thank you for choosing CarRent for your transportation needs!</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Reservation Details:</h3>
        <p><strong>Car:</strong> ${car.name}</p>
        <p><strong>Reservation Time:</strong> ${formattedTime}</p>
        <p><strong>Price:</strong> $${car.price_per_hour}/hour</p>
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 0; color: #856404;"><strong>Important:</strong> Payment must be completed within 30 minutes to confirm your reservation.</p>
      </div>
      
      <p>If you have any questions or need assistance, please contact our customer support team.</p>
      
      <p style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `

  try {
    return await sendEmail(userEmail, subject, html)
  } catch (error) {
    console.error("Failed to send reservation email:", error)
    // Return an object indicating the email failed but with the content that would have been sent
    return {
      error: true,
      message: error.message,
      emailContent: {
        to: userEmail,
        subject,
        html,
      },
    }
  }
}

module.exports = {
  sendEmail,
  sendReservationEmail,
}
