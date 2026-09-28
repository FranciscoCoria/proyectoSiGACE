document.getElementById('loginForm').addEventListener('submit', async (e) => { //escucha cuando el usuario presiona "Ingresar" en el formulario.
  e.preventDefault();  //evita que el formulario recargue la página, que es el comportamiento por defecto de HTML.

  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');

  errorMsg.textContent = '';

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', { //es la función de JavaScript para hacer peticiones HTTP al backend. Es el equivalente de lo que hacías con Thunder Client pero desde el código.
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMsg.textContent = data.error;
      return;
    }

    localStorage.setItem('token', data.token);  //localstorage guarda el token y los datos del usuario en el navegador. Así el usuario no tiene que loguearse cada vez que cambia de pantalla.
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    if (data.usuario.rol === 'DIRECTORA') { //redirige al dashboard correspondiente según el rol.
      window.location.href = 'pages/dashboard-directora.html'; 
    } else if (data.usuario.rol === 'ECONOMA') {
      window.location.href = 'pages/dashboard-economa.html';
    } else if (data.usuario.rol === 'CELADORA') {
      window.location.href = 'pages/dashboard-celadora.html';
    }

  } catch (error) {
    errorMsg.textContent = 'Error de conexión con el servidor.';
  }
});