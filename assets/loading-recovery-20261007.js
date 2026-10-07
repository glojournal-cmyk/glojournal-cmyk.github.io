// Independent of the module graph: a failed download must not leave a permanent spinner.
(function () {
 let ready = false, timer;
 function showReady() {
  ready = true;
  clearTimeout(timer);
  document.documentElement.setAttribute('data-lux-ready', '');
  document.documentElement.removeAttribute('data-lux-load-error');
  document.getElementById('lux-loading-recovery')?.remove();
 }
 window.addEventListener('lux:app-ready', showReady);
 new MutationObserver(function () {
  if (ready && !document.documentElement.hasAttribute('data-lux-ready')) showReady();
 }).observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['data-lux-ready']});
 timer = setTimeout(function () {
  if (ready || document.documentElement.hasAttribute('data-lux-ready')) return;
  document.documentElement.setAttribute('data-lux-load-error', '');
  const panel = document.createElement('section');
  panel.id = 'lux-loading-recovery';
  panel.setAttribute('role', 'alert');
  panel.style.cssText = 'position:fixed;inset:0;z-index:1001;display:grid;place-content:center;gap:16px;padding:28px;background:#f4f0e5;color:#1a3148;text-align:center;font:18px system-ui';
  const title = document.createElement('h1');title.textContent = 'The app could not finish loading.';
  const copy = document.createElement('p');copy.textContent = 'Your saved progress has not been cleared. Please retry the connection.';
  const button = document.createElement('button');button.textContent = 'Retry loading';button.type = 'button';
  button.style.cssText = 'min-height:48px;border:0;border-radius:12px;background:#1a3148;color:white;padding:12px 24px;font:inherit;cursor:pointer';
  button.addEventListener('click', function () { const url = new URL(location.href);url.searchParams.set('reload', Date.now());location.replace(url.href); });
  panel.append(title, copy, button);document.body.append(panel);
 }, 12000);
}());
