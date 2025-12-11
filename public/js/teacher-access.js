document.getElementById('teacherAccessForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const teacherName = document.getElementById('teacherName').value;
    const teacherEmail = document.getElementById('teacherEmail').value;
    const studentId = document.getElementById('studentId').value;
    const reason = document.getElementById('reason').value;

    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Clear previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    try {
        const response = await fetch('/api/teacher-access', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teacherName,
                teacherEmail,
                studentId,
                reason
            })
        });

        const data = await response.json();

        if (response.ok) {
            successMessage.textContent = data.message || 'Request submitted successfully. You will be notified once it is reviewed.';
            successMessage.style.display = 'block';
            
            // Clear form
            document.getElementById('teacherAccessForm').reset();
        } else {
            errorMessage.textContent = data.error || 'Failed to submit request';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = 'An error occurred. Please try again.';
        errorMessage.style.display = 'block';
    }
});
