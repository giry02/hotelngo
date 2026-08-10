(() => {
  const page = document.querySelector('.concept-page');
  if (!page) return;
  if (new URLSearchParams(window.location.search).get('capture') === '1') page.classList.add('is-capture');

  const toast = (message) => {
    const target = document.querySelector('[data-toast]');
    if (!target) return;
    target.textContent = message;
    target.classList.add('is-visible');
    window.clearTimeout(window.__conceptToast);
    window.__conceptToast = window.setTimeout(() => target.classList.remove('is-visible'), 2200);
  };

  document.querySelectorAll('[data-concept-search]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const query = new URLSearchParams({
        destination: data.get('destination') || '',
        checkIn: data.get('checkIn') || '',
        checkOut: data.get('checkOut') || '',
        guests: data.get('guests') || ''
      });
      window.location.href = `hotels.html?${query.toString()}`;
    });
  });

  document.querySelectorAll('[data-keyword]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = page.querySelector('[data-concept-search] [name="destination"]');
      if (input) input.value = button.dataset.keyword;
      button.parentElement?.querySelectorAll('[data-keyword]').forEach((item) => item.classList.toggle('is-active', item === button));
    });
  });

  const slides = [...document.querySelectorAll('[data-concept-slide]')];
  let slideIndex = 0;
  const showSlide = (next) => {
    if (!slides.length) return;
    slideIndex = (next + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const active = index === slideIndex;
      slide.classList.toggle('is-active', active);
      slide.hidden = !active;
    });
    const current = document.querySelector('[data-concept-current]');
    if (current) current.textContent = String(slideIndex + 1).padStart(2, '0');
  };
  document.querySelector('[data-concept-prev]')?.addEventListener('click', () => showSlide(slideIndex - 1));
  document.querySelector('[data-concept-next]')?.addEventListener('click', () => showSlide(slideIndex + 1));

  document.querySelectorAll('[data-city-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-city-tab]').forEach((item) => item.classList.toggle('is-active', item === button));
      document.querySelectorAll('[data-city-panel]').forEach((panel) => { panel.hidden = panel.dataset.cityPanel !== button.dataset.cityTab; });
    });
  });

  document.querySelectorAll('[data-market-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-market-tab]').forEach((item) => item.classList.toggle('is-active', item === button));
      document.querySelectorAll('[data-market-panel]').forEach((panel) => { panel.hidden = panel.dataset.marketPanel !== button.dataset.marketTab; });
    });
  });

  document.querySelectorAll('[data-concept-save]').forEach((button) => {
    button.addEventListener('click', () => {
      const saved = button.classList.toggle('is-saved');
      button.textContent = saved ? '♥' : '♡';
      toast(saved ? '저장 목록에 담았습니다.' : '저장을 취소했습니다.');
    });
  });

  const rail = document.querySelector('[data-card-rail]');
  document.querySelector('[data-rail-prev]')?.addEventListener('click', () => rail?.scrollBy({ left: -420, behavior: 'smooth' }));
  document.querySelector('[data-rail-next]')?.addEventListener('click', () => rail?.scrollBy({ left: 420, behavior: 'smooth' }));

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
