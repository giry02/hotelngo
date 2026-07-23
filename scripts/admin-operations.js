(() => {
  const api = window.HotelNGoMockAPI;
  if (!api?.list) return;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const money = (value) => `${Number(value || 0).toLocaleString('ko-KR')}원`;
  const percent = (value, total) => total ? `${Math.round((value / total) * 100)}%` : '0%';
  let seed;

  const initState = async () => {
    seed ||= await api.get('platform-state.json');
    ['bookings', 'settlements', 'inquiries', 'stories', 'trips'].forEach((domain) => api.list(domain, seed[domain] || []));
  };

  const renderAnalytics = async () => {
    const root = document.querySelector('[data-admin-analytics]');
    if (!root) return;
    await initState();
    const bookings = api.list('bookings');
    const settlements = api.list('settlements');
    const inquiries = api.list('inquiries');
    const stories = api.list('stories');
    const trips = api.list('trips');
    const events = api.list('audit-events');
    const confirmed = bookings.filter((item) => item.status === 'CONFIRMED').length;
    const unavailable = bookings.filter((item) => item.status === 'UNAVAILABLE').length;
    const cancelled = bookings.filter((item) => String(item.status).includes('CANCEL')).length;
    const openInquiries = inquiries.filter((item) => item.status !== 'ANSWERED').length;
    const overdue = inquiries.filter((item) => item.status !== 'ANSWERED' && item.slaDueAt && new Date(item.slaDueAt) < new Date()).length;
    const gross = settlements.reduce((sum, item) => sum + Number(item.gross || 0), 0);
    const net = settlements.reduce((sum, item) => sum + Number(item.net || 0), 0);
    const reviewAmount = settlements.filter((item) => item.status === 'REVIEW_REQUIRED').reduce((sum, item) => sum + Number(item.net || 0), 0);
    const aiCopies = events.filter((item) => item.action === 'AI_PLAN_COPIED_TO_TRIP').length;
    const communityCopies = events.filter((item) => item.action === 'COMMUNITY_TRIP_COPIED').length;
    root.innerHTML = `
      <section class="ops-kpi-grid">
        <article><small>예약 확정률</small><strong>${percent(confirmed, bookings.length)}</strong><span>${confirmed}/${bookings.length}건</span></article>
        <article><small>예약 불가</small><strong>${unavailable}</strong><span>대안 제시 대상</span></article>
        <article><small>취소·취소 요청</small><strong>${cancelled}</strong><span>수수료·환불 확인</span></article>
        <article><small>미답변 문의</small><strong>${openInquiries}</strong><span>SLA 초과 ${overdue}건</span></article>
        <article><small>정산 순지급</small><strong>${money(net)}</strong><span>총매출 ${money(gross)}</span></article>
        <article><small>정산 검토 금액</small><strong>${money(reviewAmount)}</strong><span>조정·환불 대사</span></article>
        <article><small>스토리·여행</small><strong>${stories.length} / ${trips.length}</strong><span>공개 콘텐츠 / 내 여행</span></article>
        <article><small>일정 복사 이벤트</small><strong>${aiCopies + communityCopies}</strong><span>AI ${aiCopies} · 커뮤니티 ${communityCopies}</span></article>
      </section>
      <section class="ops-grid">
        <article class="ops-card">
          <header><div><small>BOOKING STATE</small><h2>예약 상태 분포</h2></div><a class="bo-button" href="admin-commerce.html">예약 관리</a></header>
          <div class="ops-bars">${['CONFIRMED', 'PENDING_SUPPLIER', 'UNAVAILABLE', 'CHANGE_REQUESTED', 'CANCEL_REQUESTED'].map((status) => {
            const count = bookings.filter((item) => item.status === status).length;
            return `<div><span>${status}</span><i><b style="width:${percent(count, bookings.length)}"></b></i><strong>${count}</strong></div>`;
          }).join('')}</div>
        </article>
        <article class="ops-card">
          <header><div><small>SUPPORT SLA</small><h2>문의 처리</h2></div><a class="bo-button" href="admin-support.html">문의 작업함</a></header>
          <table class="ops-table"><thead><tr><th>문의</th><th>예약</th><th>상태</th></tr></thead><tbody>${inquiries.map((item) => `<tr><td><a href="admin-inquiry-detail.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.subject)}</a><small>${escapeHtml(item.id)}</small></td><td>${escapeHtml(item.bookingId || '-')}</td><td>${escapeHtml(item.status)}</td></tr>`).join('')}</tbody></table>
        </article>
      </section>
      <section class="ops-card">
        <header><div><small>SETTLEMENT</small><h2>업체별 정산 대사</h2></div><a class="bo-button" href="admin-settlements.html">정산 목록</a></header>
        <table class="ops-table"><thead><tr><th>업체</th><th>기간</th><th>총매출</th><th>수수료</th><th>환불·조정</th><th>순지급</th><th>상태</th></tr></thead><tbody>${settlements.map((item) => `<tr><td>${escapeHtml(item.providerId)}<small>${escapeHtml(item.providerType)}</small></td><td>${escapeHtml(item.period)}</td><td>${money(item.gross)}</td><td>${money(item.commission)}</td><td>${money(Number(item.refunds || 0) - Number(item.adjustments || 0))}</td><td><strong>${money(item.net)}</strong></td><td>${escapeHtml(item.status)}</td></tr>`).join('')}</tbody></table>
      </section>`;
  };

  const renderProcessTests = async () => {
    const root = document.querySelector('[data-admin-process-tests]');
    if (!root) return;
    const payload = await api.get('process-use-cases.json');
    const cases = payload.useCases;
    const roles = [...new Set(cases.map((item) => item.role))];
    const pass = cases.filter((item) => item.test === 'LOCAL_PASS').length;
    const external = cases.filter((item) => item.test === 'EXTERNAL_DEPENDENCY').length;
    root.innerHTML = `
      <section class="ops-kpi-grid compact">
        <article><small>전체 유스케이스</small><strong>${cases.length}</strong><span>${roles.length}개 역할</span></article>
        <article><small>로컬 Mock 통과</small><strong>${pass}</strong><span>${percent(pass, cases.length)}</span></article>
        <article><small>외부 연동 필요</small><strong>${external}</strong><span>PMS·PG·LLM·지도·알림</span></article>
        <article><small>명시되지 않은 차단</small><strong>0</strong><span>외부 의존성으로 분리</span></article>
      </section>
      <section class="ops-card">
        <header><div><small>ROLE COVERAGE</small><h2>역할별 커버리지</h2></div><label class="ops-filter">역할<select data-process-role><option value="">전체 역할</option>${roles.map((role) => `<option>${escapeHtml(role)}</option>`).join('')}</select></label></header>
        <div class="ops-process-list" data-process-list>${cases.map((item) => `
          <article data-role="${escapeHtml(item.role)}">
            <div><span>${escapeHtml(item.id)} · ${escapeHtml(item.role)}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.expected)}</small></div>
            <div class="ops-process-pages">${item.pages.map((page) => `<a href="${escapeHtml(page)}">${escapeHtml(page)}</a>`).join('')}</div>
            <div><span class="ops-status ${item.test === 'LOCAL_PASS' ? 'success' : 'warn'}">${escapeHtml(item.test)}</span><small>${escapeHtml(item.externalGap)}</small></div>
          </article>`).join('')}</div>
      </section>`;
    root.querySelector('[data-process-role]')?.addEventListener('change', (event) => {
      root.querySelectorAll('[data-role]').forEach((item) => {
        item.hidden = Boolean(event.target.value) && item.dataset.role !== event.target.value;
      });
    });
    document.querySelector('[data-process-export]')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'hotelngo-process-use-cases.json' });
      link.click();
      URL.revokeObjectURL(link.href);
    });
  };

  const renderInquiry = async () => {
    const root = document.querySelector('[data-admin-inquiry-detail]');
    if (!root) return;
    await initState();
    const id = new URLSearchParams(location.search).get('id') || api.list('inquiries')[0]?.id;
    const inquiry = api.list('inquiries').find((item) => item.id === id);
    if (!inquiry) {
      root.innerHTML = '<section class="ops-card"><h2>문의를 찾을 수 없습니다.</h2><a class="bo-button" href="admin-support.html">목록으로</a></section>';
      return;
    }
    const booking = api.list('bookings').find((item) => item.id === inquiry.bookingId);
    root.innerHTML = `
      <div class="ops-grid">
        <section class="ops-card">
          <header><div><small>${escapeHtml(inquiry.id)}</small><h2>${escapeHtml(inquiry.subject)}</h2></div><span class="ops-status ${inquiry.status === 'ANSWERED' ? 'success' : 'warn'}">${escapeHtml(inquiry.status)}</span></header>
          <dl class="ops-detail"><div><dt>카테고리</dt><dd>${escapeHtml(inquiry.category)}</dd></div><div><dt>문의 내용</dt><dd>${escapeHtml(inquiry.message)}</dd></div><div><dt>접수 시각</dt><dd>${escapeHtml(new Date(inquiry.createdAt).toLocaleString('ko-KR'))}</dd></div><div><dt>SLA</dt><dd>${escapeHtml(new Date(inquiry.slaDueAt).toLocaleString('ko-KR'))}</dd></div></dl>
          <form class="ops-reply-form" data-admin-inquiry-reply>
            <label>고객 답변<textarea name="reply" required>${escapeHtml(inquiry.reply || '')}</textarea></label>
            <label>처리 상태<select name="status"><option value="ANSWERED">답변 완료</option><option value="OPEN">추가 확인</option><option value="ESCALATED">분쟁·상위 검토</option></select></label>
            <button class="bo-button primary" type="submit">답변 저장</button>
          </form>
        </section>
        <aside class="ops-card">
          <header><div><small>BOOKING CONTEXT</small><h2>연결 예약</h2></div>${booking ? `<a class="bo-button" href="admin-booking-detail.html?id=${encodeURIComponent(booking.id)}">예약 관리</a>` : ''}</header>
          ${booking ? `<dl class="ops-detail"><div><dt>예약번호</dt><dd>${escapeHtml(booking.id)}</dd></div><div><dt>상품</dt><dd>${escapeHtml(booking.title)}<br>${escapeHtml(booking.product || '')}</dd></div><div><dt>예약 상태</dt><dd>${escapeHtml(booking.status)}</dd></div><div><dt>공급자 번호</dt><dd>${escapeHtml(booking.supplierBookingId || '미수신')}</dd></div><div><dt>결제·정산</dt><dd>${escapeHtml(booking.paymentStatus)} · ${escapeHtml(booking.settlementStatus)}</dd></div></dl>` : '<div class="empty-state"><strong>연결된 예약이 없습니다.</strong></div>'}
        </aside>
      </div>`;
    root.querySelector('[data-admin-inquiry-reply]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity()) return;
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      api.upsert('inquiries', {
        ...inquiry,
        reply: values.reply,
        status: values.status,
        answeredAt: values.status === 'ANSWERED' ? new Date().toISOString() : inquiry.answeredAt
      });
      api.appendAudit({ actor: 'HOTELNGO_ADMIN', action: 'INQUIRY_REPLIED', entityType: 'INQUIRY', entityId: inquiry.id, payload: { status: values.status } });
      location.href = `admin-inquiry-detail.html?id=${encodeURIComponent(inquiry.id)}&saved=1`;
    });
  };

  document.querySelector('[data-admin-refresh]')?.addEventListener('click', () => location.reload());
  renderAnalytics();
  renderProcessTests();
  renderInquiry();
})();
