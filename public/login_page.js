// Base URL for API calls
const API_BASE_URL = 'http://localhost:3000';

// Show message function
function showMessage(message, isError = false) {
    const messageContainer = document.getElementById('messageContainer');
    const messageText = document.getElementById('messageText');

    if (!messageContainer || !messageText) {
        alert(message); // Fallback to alert if elements not found
        return;
    }

    messageContainer.style.display = 'block';
    messageContainer.className = `message-container ${isError ? 'error' : 'success'}`;
    messageText.textContent = message;

    messageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Hide message after 5 seconds
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000);
}
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("Login button clicked");
            
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!username || !password) {
                showMessage("Please enter both username and password", true);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // Important for sending cookies
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (data.success) {
                    // Store token and user info
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    showMessage("Login successful! Redirecting...");
                    
                    // Use redirectUrl from server response
                    setTimeout(() => {
                        window.location.href = data.redirectUrl || 'Luchkee Dashboard.html';
                    }, 1500);
                } else {
                    showMessage(data.error || "Login failed", true);
                }
            } catch (error) {
                console.error("Login error:", error);
                showMessage("Connection error. Please try again", true);
            }
        });
    }
});

// Email Login Form Handler
document.addEventListener("DOMContentLoaded", () => {
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Login button clicked");
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        showMessage("Please enter both username and password", true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            showMessage("Login successful! Redirecting...");
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => {
                window.location.href = 'Luchkee Dashboard.html';
            }, 1500);
        } else {
            const errorData = await response.json();
            showMessage(errorData.error || "Login failed", true);
        }
    } catch (error) {
        console.error("Login error:", error);
        showMessage("Connection error. Please try again", true);
    }
});
// Phone Login Form Handler
document.getElementById("phoneLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const phone = document.getElementById("phone")?.value.trim();
  if (!phone || !phone.match(/^\d{10}$/)) {
      showMessage("Please enter a valid 10-digit phone number", true);
      return;
  }

  console.log("Sending request to /request-otp with phone:", phone);

  try {
      const response = await fetch(`${API_BASE_URL}/request-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phone }),
      });

      if (response.ok) {
          const data = await response.json();
          console.log("Response data:", data);
          showMessage("OTP sent successfully!");
          showOTPInput(phone);
      } else {
          const errorData = await response.json();
          console.error("Server returned an error:", errorData);
          showMessage(errorData.error || "Failed to send OTP. Try again.", true);
      }
  } catch (error) {
      console.error("Network error:", error);
      showMessage("Connection error. Please try again.", true);
  }
});

    });

// Show OTP input field
function showOTPInput(phone) {
  const phoneForm = document.getElementById("phoneLoginForm");
  const existingOtpDiv = document.getElementById("otpDiv");

  // Avoid adding multiple OTP fields
  if (!existingOtpDiv) {
      phoneForm.insertAdjacentHTML('beforeend', `
          <div id="otpDiv" class="form-group">
              <label for="otp">Enter OTP:</label>
              <input 
                  type="text" 
                  id="otp" 
                  required 
                  placeholder="Enter 6-digit OTP"
                  pattern="[0-9]{6}" 
                  maxlength="6"
              >
              <button type="button" onclick="verifyOTP('${phone}')" class="login-button">
                  Verify OTP
              </button>
          </div>
      `);
  }
}


// Verify OTP
async function verifyOTP(phone) {
  const otpInput = document.getElementById("otp");
  const otp = otpInput ? otpInput.value.trim() : null;

  if (!otp || !otp.match(/^\d{6}$/)) {
      showMessage("Please enter a valid 6-digit OTP", true);
      return;
  }

  console.log("Verifying OTP for phone:", phone, "OTP:", otp);

  try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phone, otp }),
      });

      if (response.ok) {
          const data = await response.json();
          console.log("OTP Verified:", data);

          showMessage("Login successful! Redirecting...");
          localStorage.setItem('user', JSON.stringify(data.user));
          setTimeout(() => {
              window.location.href = 'Luchkee Dashboard.html';
          }, 1500);
      } else {
          const errorData = await response.json();
          console.error("Verification Error:", errorData);
          showMessage(errorData.error || "Invalid OTP. Please try again.", true);
      }
  } catch (error) {
      console.error("OTP verification error:", error);
      showMessage("Connection error. Please try again later.", true);
  }
}

