// server-connection.js

// Base URL for API calls
const API_BASE_URL = 'http://localhost:3000';

// Message display functionality
function showMessage(message, isError = false) {
    console.log('Message function called:', message); // Debug log
    alert(message); // Simplified message display for testing
}

// Form handling functions
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded'); // Debug log to confirm script is running

    // Contact form submission
    const contactForm = document.querySelector('.contact_section form');
    console.log('Contact form found:', !!contactForm); // Debug log

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Contact form submitted'); // Debug log

            const formData = {
                fullName: contactForm.querySelector('input[placeholder="Full Name"]')?.value,
                email: contactForm.querySelector('input[placeholder="Email"]')?.value,
                phoneNumber: contactForm.querySelector('input[placeholder="Phone Number"]')?.value,
                message: contactForm.querySelector('textarea[placeholder="Message"]')?.value
            };

            console.log('Form data:', formData); // Debug log

            try {
                const response = await fetch(`${API_BASE_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
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

    // Handle search form
    const searchForm = document.querySelector('form.form-inline');
    console.log('Search form found:', !!searchForm); // Debug log

    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Search form submitted'); // Debug log

            const searchInput = searchForm.querySelector('input[type="search"]');
            if (searchInput) {
                const query = searchInput.value;
                console.log('Search query:', query); // Debug log
                
                try {
                    const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
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