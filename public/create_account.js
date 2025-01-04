document.getElementById("signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  // Disable the submit button to prevent double submission
  const submitButton = document.getElementById("submit-btn");
  submitButton.disabled = true;

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const phoneNumber = document.getElementById("phone").value;

  const payload = {
    username,
    password,
    phone_number: phoneNumber,
    login_type: 'manual'
  };

  try {
    const response = await fetch('http://localhost:3000/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      jsonData = { message: data };
    }

    if (response.ok) {
      alert(jsonData.message || 'Account created successfully!');
      window.location.href = '/login.html';
    } else {
      alert(jsonData.message || jsonData.error || 'Error creating account');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error connecting to server. Please try again.');
  } finally {
    submitButton.disabled = false;
  }
});