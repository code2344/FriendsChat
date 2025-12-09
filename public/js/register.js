document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const accountType = document.getElementById('accountType').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const studentId = document.getElementById('studentId').value;
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Clear previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Validate passwords match
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        errorMessage.style.display = 'block';
        return;
    }

    // Validate ID format
    if (!/^\d{5}$/.test(studentId)) {
        errorMessage.textContent = 'ID number must be exactly 5 digits';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName,
                lastName,
                studentId,
                email,
                username,
                password,
                accountType
            })
        });

        const data = await response.json();

        if (response.ok) {
            successMessage.textContent = data.message || `Registration successful as ${accountType}! Your account is pending approval.`;
            successMessage.style.display = 'block';
            
            // Clear form
            document.getElementById('registerForm').reset();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } else {
            errorMessage.textContent = data.error || 'Registration failed';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = 'An error occurred. Please try again.';
        errorMessage.style.display = 'block';
    }
});
