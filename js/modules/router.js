const routes = {};
let currentPage = null;

function register(name, init) {
  routes[name] = init;
}

function navigate(page) {
  const isSame = currentPage === page;

  if (!isSame) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    const navEl = document.querySelector(`[data-nav="${page}"]`);
    if (navEl) navEl.classList.add('active');

    currentPage = page;
    window.location.hash = page;
  }

  if (routes[page]) routes[page]();
}

function initRouter(defaultPage = 'dashboard') {
  const hash = window.location.hash.slice(1);
  const page = hash && document.getElementById(`page-${hash}`) ? hash : defaultPage;
  navigate(page);

  window.addEventListener('hashchange', () => {
    const h = window.location.hash.slice(1);
    if (h && document.getElementById(`page-${h}`)) navigate(h);
  });
}

function getCurrentPage() {
  return currentPage;
}

export { register, navigate, initRouter, getCurrentPage };
