// Forza modalità eliminazione
const script = document.createElement('script');
script.src = './js/map.js';
document.body.appendChild(script);

// Appende ?mode=delete all'URL (solo per farlo leggere nel JS)
if (!window.location.search.includes('mode=delete')) 
{
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'delete');
    window.history.replaceState({}, '', url.toString());
}