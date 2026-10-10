function mostrarConfirm(texto, onConfirm) {
  document.getElementById('modalConfirmTexto').textContent = texto;
  document.getElementById('modalConfirm').style.display = 'flex';
  document.getElementById('modalConfirmSi').onclick = () => {
    cerrarModalConfirm();
    onConfirm();
  };
}

function cerrarModalConfirm() {
  document.getElementById('modalConfirm').style.display = 'none';
}