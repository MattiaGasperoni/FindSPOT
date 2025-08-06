function showError(message, timeout = 5000) 
{
  const container = document.getElementById('error-container');
  const messageEl = document.getElementById('error-message');
  messageEl.textContent = message;

  container.classList.remove('error-hidden');
  container.classList.add('error-visible');

  if (timeout > 0) 
    {
    setTimeout(() => hideError(), timeout);
  }
}

function hideError() 
{
  const container = document.getElementById('error-container');
  container.classList.remove('error-visible');
  container.classList.add('error-hidden');
}
