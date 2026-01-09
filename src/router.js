// 간단한 해시 기반 SPA 라우터

let currentRoute = null;
let routes = {};

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return currentRoute;
}

function handleRouteChange() {
  const hash = window.location.hash.slice(1) || '/';
  currentRoute = hash;

  const handler = routes[hash];
  if (handler) {
    handler();
  } else {
    // 기본 라우트로 리다이렉트
    navigate('/');
  }
}

export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}
