function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    alert(`Attempting login with Username: ${username}`);
}

function socialLogin(platform) {
    alert(`Logging in with ${platform} is not yet implemented.`);
}

function handlePhoneLogin(event) {
    event.preventDefault();
    const phone = document.getElementById('phone').value;
    alert(`Attempting login with Phone Number: ${phone}`);
}

function redirectToSignUp() {
    window.location.href = 'create_account.html'; // Change to the actual path of your sign-up page
}

function forgotPassword() {
    const phone = prompt('Enter your phone number to receive an OTP for password reset:');
    if (phone) {
        alert(`An OTP has been sent to ${phone}. Use it to reset your password.`);
    } else {
        alert('Phone number is required for password reset.');
    }
}