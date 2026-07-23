(() => {
  const getToast = () => {
    let toast = document.querySelector('[data-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.dataset.toast = '';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.append(toast);
    }
    return toast;
  };
  let toastTimer;
  const showToast = (message) => {
    const toast = getToast();
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  };
  const openConfirm = ({ title = '작업을 확인해주세요', message, confirmLabel = '확인', onConfirm }) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'page-confirm-dialog';
    dialog.innerHTML = `<header><div><small>HOTELNGO</small><strong>${title}</strong></div><button type="button" aria-label="닫기">×</button></header><div class="page-confirm-body">${message}</div><footer><button class="ui-button" type="button" data-dialog-cancel>취소</button><button class="ui-button primary" type="button" data-dialog-confirm>${confirmLabel}</button></footer>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('header button').addEventListener('click', close);
    dialog.querySelector('[data-dialog-cancel]').addEventListener('click', close);
    dialog.querySelector('[data-dialog-confirm]').addEventListener('click', () => {
      onConfirm();
      close();
    });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  };

  const cart = document.querySelector('[data-cart-form]');
  const cartTotals = [...document.querySelectorAll('[data-cart-total]')];
  const cartCounts = [...document.querySelectorAll('[data-cart-count]')];
  const cartCheckout = document.querySelector('[data-cart-checkout]');
  if (cart) {
    let marketplaceItems = [];
    try { marketplaceItems = JSON.parse(localStorage.getItem('hotelngo.marketplace.cart.v1') || '[]'); } catch {}
    const list = cart.querySelector('.cart-list');
    const imageByType = { GOLF:'assets/images/landmark-bali.jpg', VEHICLE:'assets/images/landmark-bangkok.jpg', RESTAURANT:'assets/images/stay-jeju.jpg', SPA:'assets/images/stay-gangneung.jpg', TOUR:'assets/images/landmark-kyoto.jpg' };
    marketplaceItems.forEach((item, index) => {
      list?.insertAdjacentHTML('beforeend', `<article class="cart-item" data-marketplace-cart-index="${index}"><input type="checkbox" checked data-cart-select data-price="${item.price || 0}" aria-label="${item.name} 선택"><img src="${imageByType[item.type] || imageByType.TOUR}" alt="${item.name}"><div class="cart-copy"><strong>${item.name}</strong><small>${item.slot} · ${item.extras?.join(' · ') || '추가 옵션 없음'}</small><span>${item.price ? '업체 슬롯 재확인 후 결제' : '견적·요청 확정 후 금액 반영'} · ${item.type}</span></div><div class="cart-price"><strong>${item.price ? `${Number(item.price).toLocaleString('ko-KR')}원` : '견적 요청'}</strong><small>${item.price ? '기본가 · 옵션 별도' : '아직 결제되지 않음'}</small><button type="button" data-cart-remove>삭제</button></div></article>`);
    });
  }
  const updateCart = () => {
    if (!cart) return;
    const selected = [...cart.querySelectorAll('[data-cart-select]:checked')];
    const total = selected.reduce((sum, input) => sum + Number(input.dataset.price || 0), 0);
    cartTotals.forEach((element) => { element.textContent = `${total.toLocaleString('ko-KR')}원`; });
    cartCounts.forEach((element) => { element.textContent = String(selected.length); });
    cartCheckout?.toggleAttribute('aria-disabled', selected.length === 0);
    cartCheckout?.classList.toggle('is-disabled', selected.length === 0);
  };
  cart?.querySelectorAll('[data-cart-select]').forEach((input) => input.addEventListener('change', updateCart));
  cart?.querySelectorAll('[data-cart-remove]').forEach((button) => button.addEventListener('click', () => {
    const item = button.closest('.cart-item');
    const name = item?.querySelector('.cart-copy strong')?.textContent.trim() || '선택한 상품';
    const price = item?.querySelector('.cart-price strong')?.textContent.trim() || '';
    openConfirm({
      title: '여행 카트에서 삭제할까요?',
      message: `<strong>${name}</strong><span>${price} 항목이 카트 합계와 예약 진행 대상에서 제외됩니다.</span>`,
      confirmLabel: '삭제',
      onConfirm: () => {
        const marketplaceIndex = item?.dataset.marketplaceCartIndex;
        if (marketplaceIndex !== undefined) {
          let items = [];
          try { items = JSON.parse(localStorage.getItem('hotelngo.marketplace.cart.v1') || '[]'); } catch {}
          items.splice(Number(marketplaceIndex), 1);
          localStorage.setItem('hotelngo.marketplace.cart.v1', JSON.stringify(items));
        }
        item?.remove();
        updateCart();
        showToast('여행 카트에서 항목을 제외했습니다.');
      }
    });
  }));
  cartCheckout?.addEventListener('click', (event) => {
    if (cartCheckout.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      showToast('예약할 항목을 하나 이상 선택해주세요.');
    }
  });
  updateCart();

  document.querySelectorAll('[data-flow-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const requiredAgreement = form.querySelector('[data-required-agreement]');
    if (requiredAgreement && !requiredAgreement.checked) {
      showToast('필수 약관에 동의해주세요.');
      requiredAgreement.focus();
      return;
    }
    const destination = form.getAttribute('action');
    showToast(form.dataset.flowMessage || '입력 내용을 확인했습니다.');
    if (destination) setTimeout(() => { window.location.href = destination; }, 220);
  }));

  document.querySelectorAll('[data-auth-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const destination = form.getAttribute('action') || 'my.html';
    showToast(form.dataset.authMessage || '프로토타입 계정 흐름을 확인했습니다.');
    setTimeout(() => { window.location.href = destination; }, 220);
  }));

  document.querySelectorAll('[data-demo-action]').forEach((button) => button.addEventListener('click', () => {
    const nextLabel = button.dataset.doneLabel;
    if (nextLabel) button.textContent = nextLabel;
    button.setAttribute('aria-pressed', 'true');
    showToast(button.dataset.demoAction || '화면 검토용 동작입니다. 실제 저장은 API 연결 후 제공됩니다.');
  }));

  document.querySelectorAll('[data-copy-booking]').forEach((button) => button.addEventListener('click', async () => {
    const value = button.dataset.copyBooking || '';
    try { await navigator.clipboard.writeText(value); } catch { /* clipboard may be unavailable on file URLs */ }
    showToast('예약번호를 복사했습니다.');
  }));
})();
