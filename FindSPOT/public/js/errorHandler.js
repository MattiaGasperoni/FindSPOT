/*
 * Sistema visualizzazione degli errori
 */

function showError(message, timeout = 5000) 
{
  const container = document.getElementById('error-container');
  const messageEl = document.getElementById('error-message');
  
  // Imposta il messaggio di errore
  messageEl.textContent = message;

  // Mostra il container dell'errore
  container.classList.remove('error-hidden');
  container.classList.add('error-visible');

  // Auto-nasconde l'errore dopo il timeout specificato
  if (timeout > 0) 
  {
    setTimeout(() => hideError(), timeout);
  }
}

function hideError() 
{
  const container = document.getElementById('error-container');
  
  // Nasconde il container dell'errore
  container.classList.remove('error-visible');
  container.classList.add('error-hidden');
}