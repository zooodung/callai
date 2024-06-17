document.getElementById('login-button').addEventListener('click', () => {
    const username = document.getElementById('username').value;

    window.location.href = `main.html?username=${username}`; 
});