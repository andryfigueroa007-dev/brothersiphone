import { getUser, login, signup, logout, handleAuthCallback, updateUser, requestPasswordRecovery, acceptInvite } from 'https://esm.sh/@netlify/identity@2.0.1';
window.refreshAdminSession = () => getUser();
const dialog = document.getElementById('admin-login');
const form = document.getElementById('admin-login-form');
const message = document.getElementById('auth-status');
const email = document.getElementById('admin-email');
const password = document.getElementById('admin-password');
const submit = document.getElementById('auth-submit');
const ownerEmail = 'andryfigueroa007@gmail.com';
let mode = 'login', inviteToken;
window.showAdminLogin = () => { email.value = ownerEmail; dialog.showModal(); email.focus(); };
document.getElementById('close-login').onclick = () => dialog.close();
async function run(action) {
  submit.disabled = true; message.textContent = 'Procesando…';
  try { await action(); } catch { message.textContent = 'No se pudo completar. Revisa tus datos o solicita recuperar tu contraseña.'; }
  finally { submit.disabled = false; }
}
form.onsubmit = event => {
  event.preventDefault();
  run(async () => {
    if (email.value.trim().toLowerCase() !== ownerEmail) { message.textContent='Usa el correo del propietario.'; return; }
    if (mode === 'recovery') { await updateUser({password:password.value}); mode='login'; }
    else if (mode === 'invite') { await acceptInvite(inviteToken,password.value); mode='login'; }
    else await login(email.value.trim(),password.value);
    const response = await fetch('/api/admin', {cache:'no-store'});
    if (!(await response.json()).authorized) { message.textContent='Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.'; return; }
    password.value=''; dialog.close(); window.toggleAdminMode();
  });
};
document.getElementById('auth-signup').onclick = () => {
  if(!form.reportValidity()) return;
  run(async () => {
    if(email.value.trim().toLowerCase()!==ownerEmail) { message.textContent='Usa el correo del propietario.'; return; }
    await signup(email.value.trim(),password.value);
    message.textContent='Revisa tu correo y confirma tu cuenta. Después podrás entrar para administrar.';
  });
};
document.getElementById('auth-recover').onclick = () => run(async () => {
  if(!email.reportValidity()) return;
  await requestPasswordRecovery(email.value.trim());
  message.textContent='Revisa tu correo para recuperar el acceso.';
});
window.logoutAdmin = async () => {
  if (window.hasUnsavedCatalogChanges?.()) { alert('Guarda tus cambios antes de cerrar sesión.'); return; }
  await logout();
  location.reload();
};
try {
  const result = await handleAuthCallback();
  if(result) {
    window.showAdminLogin();
    if(result.type==='recovery' || result.type==='invite') {
      mode=result.type; inviteToken=result.token;
      password.value=''; password.autocomplete='new-password'; password.focus();
      submit.textContent='Guardar contraseña'; message.textContent='Elige tu contraseña para acceder al catálogo.';
    } else message.textContent='Correo confirmado. Ya puedes entrar con tu contraseña.';
  }
} catch { window.showAdminLogin(); message.textContent='El enlace venció o no es válido. Solicita recuperar tu contraseña.'; }
