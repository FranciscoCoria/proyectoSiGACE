function mostrarConfirm(texto, onConfirm, textoBoton) {
  document.getElementById('modalConfirmTexto').textContent = texto;
  document.getElementById('modalConfirmSi').textContent = textoBoton || 'Sí, eliminar';
  document.getElementById('modalConfirm').style.display = 'flex';
  document.getElementById('modalConfirmSi').onclick = () => {
    cerrarModalConfirm();
    onConfirm();
  };
}

function cerrarModalConfirm() {
  document.getElementById('modalConfirm').style.display = 'none';
}