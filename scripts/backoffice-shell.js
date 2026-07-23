(() => {
  if (!document.querySelector('link[data-hotelngo-components]')) {
    const componentStyles = document.createElement('link');
    componentStyles.rel = 'stylesheet';
    componentStyles.href = 'styles/components.css?v=2';
    componentStyles.dataset.hotelngoComponents = '';
    document.head.append(componentStyles);
  }
  if (!document.querySelector('script[data-hotelngo-ui]')) {
    const uiScript = document.createElement('script');
    uiScript.src = 'scripts/ui-components.js?v=1';
    uiScript.dataset.hotelngoUi = '';
    document.head.append(uiScript);
  }

  const root = document.querySelector('.bo-app');
  const target = document.querySelector('[data-backoffice-shell]');
  if (!root || !target) return;
  const requestedApp = document.body.dataset.app;
  const app = ['admin', 'partner', 'hotel', 'channel'].includes(requestedApp) ? requestedApp : 'partner';
  const active = document.body.dataset.section || 'dashboard';
  const configs = {
    partner: {
      label: '액티비티 파트너센터', context: '<span data-partner-business-name>비호텔 파트너</span>',
      groups: [
        ['시작', [['dashboard','대시보드','partner-dashboard.html'],['application','가입·심사 상태','partner-application-status.html'],['claim','업체 페이지 인수','partner-claim.html']]],
        ['사업장', [['properties','사업장 목록','partner-properties.html'],['property','업체·공개정보','partner-property.html'],['golf','골프장','partner-golf.html'],['vehicle','차량·픽업','partner-vehicle.html'],['restaurant','음식점·카페','partner-restaurant.html'],['spa','마사지·스파','partner-spa.html'],['tour','투어·체험','partner-tour.html']]],
        ['판매', [['products','업종별 상품','partner-products.html'],['resources','자원·수용량','partner-resources.html'],['schedules','운영시간·슬롯','partner-schedules.html'],['bundles','호텔 결합 혜택','partner-bundles.html'],['inventory','가격·재고 캘린더','partner-inventory.html']]],
        ['운영', [['bookings','예약·변경·취소','partner-bookings.html'],['inquiries','리뷰·문의','partner-inquiries.html'],['operations','프로모션·콘텐츠','partner-operations.html']]],
        ['관리', [['finance','정산·통계','partner-finance.html'],['members','직원·권한','partner-members.html'],['settings','연동·설정','partner-settings.html']]]
      ]
    },
    hotel: {
      label: '호텔 콘텐츠센터', context: '<span data-hotel-name>연결 호텔</span>',
      groups: [
        ['현황', [['dashboard','콘텐츠 대시보드','hotel-dashboard.html'],['application','소유권·승인 상태','hotel-application-status.html']]],
        ['공개 콘텐츠', [['content','호텔 소개·정책','hotel-content.html'],['rooms','PMS 객실 매핑','hotel-rooms.html'],['media','사진 라이브러리','hotel-media.html'],['amenities','편의시설','hotel-amenities.html']]],
        ['연동', [['mapping','PMS 연결 상태','hotel-pms-mapping.html'],['preview','B2C 미리보기','hotel-detail.html']]],
        ['계정', [['members','담당자·권한','hotel-members.html'],['settings','알림·설정','hotel-settings.html']]]
      ]
    },
    admin: {
      label: '플랫폼 관리자', context: 'Operations · Mock',
      groups: [
        ['운영', [['dashboard','대시보드','admin-dashboard.html'],['analytics','운영 통계','admin-analytics.html'],['process','프로세스 테스트','admin-process-tests.html'],['support','문의·분쟁','admin-support.html']]],
        ['회원', [['members','B2C 회원','admin-members.html']]],
        ['파트너', [['partners','가입 심사','admin-partners.html'],['providers','업체·장소 선등록','admin-providers.html'],['claims','소유권 요청','admin-provider-claims.html']]],
        ['카탈로그', [['catalog','Provider · Place','admin-catalog.html'],['duplicates','중복 후보','admin-duplicates.html'],['imports','가져오기 작업','admin-import-jobs.html'],['review','통합 심사 큐','admin-review.html']]],
        ['콘텐츠', [['content','공식 스토리·랜드마크','admin-content.html'],['community','회원 일정 심사','admin-community.html'],['media','미디어 라이브러리','admin-media.html']]],
        ['플랫폼', [['commerce','예약·거래','admin-commerce.html'],['settlements','정산','admin-settlements.html'],['ai','AI·RAG','admin-ai.html'],['roles','역할·권한','admin-roles.html'],['audit','감사 로그','admin-audit-log.html'],['system','시스템','admin-system.html']]]
      ]
    },
    channel: {
      label: 'PMS 채널 운영', context: 'INTERNAL_PMS · Hotel_PMS',
      groups: [
        ['현황', [['dashboard','연동 대시보드','channel-dashboard.html']]],
        ['조회', [['properties','호텔 공개정보','channel-properties.html'],['room-types','객실유형','channel-room-types.html'],['rates','요금','channel-rates.html'],['inventory','가용재고','channel-inventory.html']]],
        ['예약', [['reservations','예약 링크','channel-reservations.html'],['reconciliation','대사 작업','channel-reconciliation-detail.html']]],
        ['관제', [['mappings','호텔·객실 매핑','channel-mappings.html'],['monitor','동기화·대사','channel-monitor.html'],['logs','요청 추적 로그','channel-request-logs.html']]],
        ['경계', [['system','플랫폼 시스템','admin-system.html'],['pms','Hotel_PMS 원천 경로','channel-monitor.html#source']]]
      ]
    }
  };
  const config = configs[app];
  const nav = config.groups.map(([label,items]) => `<div class="bo-nav-label">${label}</div><nav class="bo-nav">${items.map(([key,text,href]) => `<a class="${active === key ? 'is-active' : ''}" href="${href}">${text}</a>`).join('')}</nav>`).join('');
  const accountActions = app === 'admin'
    ? '<span class="bo-admin-account" data-admin-name>관리자</span><button type="button" data-admin-logout>로그아웃</button>'
    : app === 'partner'
      ? '<span class="bo-admin-account" data-partner-name>파트너</span><button type="button" data-partner-logout>로그아웃</button>'
      : app === 'hotel'
        ? '<span class="bo-admin-account" data-hotel-account-name>호텔 담당자</span><button type="button" data-hotel-logout>로그아웃</button>'
        : '<span class="bo-admin-account" data-channel-name>채널 운영자</span><button type="button" data-channel-logout>로그아웃</button>';
  target.outerHTML = `<aside class="bo-sidebar"><a class="bo-brand" href="index.html"><img src="assets/brand/official/hotelngo-logo-primary.png" alt="HotelnGo"><span>${config.label}</span></a>${nav}</aside><header class="bo-topbar"><div class="bo-topbar-left"><button class="bo-button bo-menu" type="button" data-bo-menu>메뉴</button><strong>${config.context}</strong><span>${app === 'channel' ? 'JSON Fixture' : 'Mock 운영'}</span></div><div class="bo-topbar-actions"><a href="index.html">B2C 바로가기</a><a href="${app === 'hotel' ? 'hotel-detail.html' : app === 'channel' ? 'admin-system.html' : 'channel-dashboard.html'}">${app === 'hotel' ? '공개 미리보기' : app === 'channel' ? '플랫폼 관리자' : 'PMS 채널 운영'}</a>${accountActions}</div></header>`;
  document.querySelector('[data-bo-menu]')?.addEventListener('click', () => root.classList.toggle('is-menu-open'));
  document.querySelectorAll('.bo-nav a').forEach((link) => link.addEventListener('click', () => root.classList.remove('is-menu-open')));
  const main = document.querySelector('.bo-main');
  if (main) main.insertAdjacentHTML('beforeend', `<footer class="bo-footer">HotelnGo ${config.label} · ${app === 'channel' ? 'Hotel_PMS 원천을 변경하지 않는 조회·매핑·대사 콘솔' : '화면 구조 검증용 Mock 운영 콘솔'} · 실제 외부 시스템 쓰기는 수행하지 않습니다.</footer>`);
  document.body.insertAdjacentHTML('beforeend', '<div class="bo-toast" role="status" aria-live="polite" data-bo-toast></div>');
  const toast = document.querySelector('[data-bo-toast]');
  let toastTimer;
  const showToast = (message) => {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };
  const exportTable = (button) => {
    const table = button.closest('.bo-main')?.querySelector('.bo-table');
    if (!table) return false;
    const csv = [...table.rows].filter((row) => !row.hidden).map((row) => [...row.cells].map((cell) => `"${cell.textContent.trim().replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `hotelngo-${app}-${active}.csv` });
    link.click();
    URL.revokeObjectURL(link.href);
    return true;
  };
  const openRowDetail = (button) => {
    const row = button.closest('tr');
    if (!row) return false;
    const headers = [...row.closest('table').querySelectorAll('thead th')].map((item) => item.textContent.trim());
    const values = [...row.cells].map((cell) => cell.textContent.trim());
    const dialog = document.createElement('dialog');
    dialog.className = 'bo-detail-dialog';
    dialog.innerHTML = `<header><div><small>${config.label}</small><strong>행 상세 정보</strong></div><button type="button" aria-label="닫기">×</button></header><dl>${values.map((value, index) => `<div><dt>${headers[index] || `항목 ${index + 1}`}</dt><dd>${value}</dd></div>`).join('')}</dl><p>현재 화면의 Mock 행을 읽기 전용으로 표시합니다. 외부 시스템 데이터는 변경하지 않습니다.</p>`;
    document.body.append(dialog);
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
    return true;
  };
  const openActionDialog = (button) => {
    const label = button.textContent.trim();
    if (!/일괄 변경|변경사항 검증|판매 제한|승인|반려|등록|업로드|초대|저장|적용|재처리/.test(label)) return false;
    const inventoryFields = /일괄 변경|판매 제한/.test(label)
      ? '<label>적용 기간<input type="text" value="2026.08.10–2026.08.16"></label><label>판매 가능 수량<input type="number" value="4" min="0"></label><label>1박 요금<input type="text" value="198,000원"></label>'
      : '';
    const reasonFields = /승인|반려|재처리/.test(label)
      ? '<label>처리 사유<textarea required placeholder="감사 로그에 남길 사유를 입력하세요."></textarea></label>'
      : '';
    const generalFields = inventoryFields || reasonFields
      ? ''
      : '<label>작업 메모<textarea placeholder="변경 목적이나 확인 내용을 입력하세요."></textarea></label>';
    const dialog = document.createElement('dialog');
    dialog.className = 'bo-detail-dialog';
    dialog.innerHTML = `<header><div><small>${config.label} · MOCK ACTION</small><strong>${label}</strong></div><button type="button" aria-label="닫기">×</button></header><form class="bo-dialog-form">${inventoryFields}${reasonFields}${generalFields}<div class="bo-dialog-preview">외부 PMS·결제·정산 시스템에는 전송하지 않습니다. 입력값과 처리 시각만 브라우저 Mock 작업 이력에 저장합니다.</div></form><footer><button class="bo-button" type="button" data-dialog-cancel>취소</button><button class="bo-button primary" type="button" data-dialog-confirm>${label}</button></footer>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('header button').addEventListener('click', close);
    dialog.querySelector('[data-dialog-cancel]').addEventListener('click', close);
    dialog.querySelector('[data-dialog-confirm]').addEventListener('click', () => {
      const form = dialog.querySelector('form');
      if (!form.reportValidity()) return;
      const history = JSON.parse(localStorage.getItem('hotelngo.mock.backoffice.actions') || '[]');
      history.unshift({ app, action: label, at: new Date().toISOString() });
      localStorage.setItem('hotelngo.mock.backoffice.actions', JSON.stringify(history.slice(0, 30)));
      close();
      showToast(`${label} Mock 작업을 저장했습니다.`);
    });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
    return true;
  };
  document.querySelectorAll('button.bo-button:not([data-bo-menu]):not([type="submit"]):not([data-room-media-add]):not([data-resource-edit]):not([data-schedule-edit]), .bo-topbar-actions button:not([data-admin-logout]):not([data-partner-logout]):not([data-hotel-logout]):not([data-channel-logout])').forEach((button) => button.addEventListener('click', () => {
    if (/내보내기|다운로드|CSV|명세서/.test(button.textContent) && exportTable(button)) { showToast('현재 표를 CSV로 내보냈습니다.'); return; }
    if (/상세|검토|보기/.test(button.textContent) && openRowDetail(button)) return;
    if (openActionDialog(button)) return;
    const message = button.dataset.boAction || `${button.textContent.trim()} 작업의 프로토타입 상태를 확인했습니다.`;
    if (button.dataset.doneLabel) button.textContent = button.dataset.doneLabel;
    showToast(message);
  }));
  document.querySelectorAll('.bo-filterbar input').forEach((input) => input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    document.querySelectorAll('.bo-table tbody tr').forEach((row) => { row.hidden = query && !row.textContent.toLowerCase().includes(query); });
  }));
  document.querySelectorAll('.bo-filterbar select').forEach((select) => select.addEventListener('change', () => {
    const value = select.value.trim().toLowerCase();
    document.querySelectorAll('.bo-table tbody tr').forEach((row) => { row.hidden = value && !/전체/.test(value) && !row.textContent.toLowerCase().includes(value); });
  }));
})();
