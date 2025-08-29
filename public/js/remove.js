/*
 * Inizializza la modalità eliminazione per la mappa
 */

// Carica dinamicamente il modulo mappa
const script = document.createElement('script');
script.src = './js/map.js';
document.body.appendChild(script);

// Imposta il parametro URL per indicare la modalità delete
if (!window.location.search.includes('mode=delete')) 
{
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'delete');
    // Usa replaceState per non creare una nuova voce nella cronologia
    window.history.replaceState({}, '', url.toString());
}