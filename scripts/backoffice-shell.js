(() => {
  const root = document.querySelector('.bo-app');
  const target = document.querySelector('[data-backoffice-shell]');
  if (!root || !target) return;
  const app = document.body.dataset.app === 'admin' ? 'admin' : 'partner';
  const active = document.body.dataset.section || 'dashboard';
  const configs = {
    partner: {
      label: '파트너센터', context: '다낭 오션 리조트',
      groups: [
        ['시작', [['dashboard','대시보드','partner-dashboard.html']]],
        ['사업장', [['property','업체·공개정보','partner-property.html']]],
        ['판매', [['inventory','상품·가격·재고','partner-inventory.html']]],
        ['운영', [['bookings','예약·변경·취소','partner-bookings.html']]],
        ['관리', [['finance','정산·통계','#'],['members','직원·권한','#'],['settings','연동·설정','#']]]
      ]
    },
    admin: {
      label: '플랫폼 관리자', context: 'Operations · Mock',
      groups: [
        ['운영', [['dashboard','대시보드','admin-dashboard.html']]],
        ['카탈로그', [['catalog','Provider · Place','admin-catalog.html'],['review','심사·클레임','admin-review.html']]],
        ['콘텐츠', [['content','스토리·랜드마크','admin-content.html']]],
        ['플랫폼', [['commerce','예약·거래','#'],['ai','AI·RAG','#'],['system','감사·시스템','#']]]
      ]
    }
  };
  const config = configs[app];
  const nav = config.groups.map(([label,items]) => `<div class="bo-nav-label">${label}</div><nav class="bo-nav">${items.map(([key,text,href]) => `<a class="${active === key ? 'is-active' : ''}" href="${href}">${text}</a>`).join('')}</nav>`).join('');
  target.outerHTML = `<aside class="bo-sidebar"><a class="bo-brand" href="index.html"><img src="assets/brand/official/hotelngo-logo-primary.png" alt="HotelnGo"><span>${config.label}</span></a>${nav}</aside><header class="bo-topbar"><div class="bo-topbar-left"><button class="bo-button bo-menu" type="button" data-bo-menu>메뉴</button><strong>${config.context}</strong><span>정적 UI</span></div><div class="bo-topbar-actions"><a href="index.html">B2C 바로가기</a><button type="button">도움말</button><button type="button">프로토타입 계정</button></div></header>`;
  document.querySelector('[data-bo-menu]')?.addEventListener('click', () => root.classList.toggle('is-menu-open'));
  const main = document.querySelector('.bo-main');
  if (main) main.insertAdjacentHTML('beforeend', `<footer class="bo-footer">HotelnGo ${config.label} · 화면 구조 검증용 정적 프로토타입 · 실제 계정, 고객, 예약, 정산 데이터를 저장하지 않습니다.</footer>`);
})();
