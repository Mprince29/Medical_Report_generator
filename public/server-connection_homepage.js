// server-connection.js

// Base URL for API calls
const API_BASE_URL = 'http://localhost:3000';

// Enhanced message display functionality
function showMessage(message, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translateX(-50%)';
    messageDiv.style.padding = '10px 20px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.backgroundColor = isError ? '#ff4444' : '#44ff44';
    messageDiv.style.color = 'white';
    messageDiv.style.zIndex = '1000';
    
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}

// Form handling functions
document.addEventListener('DOMContentLoaded', () => {
    // Login link handler - using correct selector
    const loginLink = document.querySelector('a[href*="login.html"]');
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login.html';
        });
    }

    // Create Account link handler - using correct selector
    const createAccountLink = document.querySelector('a[href*="create_account.html"]');
    if (createAccountLink) {
        createAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/create_account.html';
        });
    }

    // Enhanced contact form submission
    const contactForm = document.querySelector('.contact_section form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form fields with proper selectors
            const formData = {
                fullName: contactForm.querySelector('input[placeholder="Full Name"]')?.value?.trim(),
                email: contactForm.querySelector('input[placeholder="Email"]')?.value?.trim(),
                phoneNumber: contactForm.querySelector('input[placeholder="Phone Number"]')?.value?.trim(),
                message: contactForm.querySelector('.message-box')?.value?.trim()
            };

            // Validate all fields
            if (!formData.fullName || !formData.email || !formData.phoneNumber || !formData.message) {
                showMessage('Please fill in all fields', true);
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                showMessage('Please enter a valid email address', true);
                return;
            }

            // Validate phone number format
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(formData.phoneNumber)) {
                showMessage('Please enter a valid 10-digit phone number', true);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    showMessage('Message sent successfully!');
                    contactForm.reset();
                } else {
                    const errorData = await response.json();
                    showMessage(errorData.error || 'Failed to send message. Please try again.', true);
                }
            } catch (error) {
                console.error('Contact form error:', error);
                showMessage('Connection error. Please try again later.', true);
            }
        });
    }

    // Enhanced search functionality
    const searchForm = document.querySelector('form.form-inline');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const searchButton = searchForm.querySelector('.nav_search-btn');
            if (searchButton) {
                try {
                    const response = await fetch(`${API_BASE_URL}/search?query=general`);
                    if (response.ok) {
                        const data = await response.json();
                        showMessage(data.message);
                    } else {
                        showMessage('Search failed. Please try again.', true);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    showMessage('Connection error. Please try again later.', true);
                }
            }
        });
    }
});