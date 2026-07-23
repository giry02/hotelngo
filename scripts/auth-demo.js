(() => {
  const toast = document.querySelector('[data-bo-toast]');
  let timer;
  const showToast = (message) => {
    if (!toast) return;
    clearTimeout(timer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    timer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };
  document.querySelectorAll('[data-static-auth]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    showToast('정적 인증 화면을 통과했습니다. 실제 세션은 생성하지 않습니다.');
    const destination = form.dataset.authDestination;
    if (destination) setTimeout(() => { window.location.href = destination; }, 220);
  }));
})();
