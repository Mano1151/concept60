export function debounce(callback, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      callback(...args);
    }, delay);
  };
}
