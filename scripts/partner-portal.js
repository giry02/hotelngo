(() => {
  const APPLICATIONS_KEY = 'hotelngo.partner.mock.applications.v1';
  const CLAIMS_KEY = 'hotelngo.partner.mock.claims.v1';
  const OPERATION_KEY = 'hotelngo.partner.mock.operations.v1';
  const PROVIDER_KEY = 'hotelngo.admin.mock.providers.v1';
  const OWNERSHIP_KEY = 'hotelngo.admin.mock.provider-ownership-overrides.v1';
  const readLocal = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
  };
  const h = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const labels = { HOTEL: '호텔·리조트', GOLF: '골프장', VEHICLE: '렌터카·기사 차량', RESTAURANT: '음식점·카페', SPA: '마사지·스파', TOUR: '투어·체험' };
  const session = window.HotelNGoPartnerAuth?.getSession();
  document.querySelectorAll('[data-partner-business-name]').forEach((target) => { target.textContent = session?.user.displayName || '파트너'; });
  document.querySelectorAll('[data-partner-business-type]').forEach((target) => { target.textContent = labels[session?.user.businessType] || session?.user.businessType || ''; });

  const applicationForm = document.querySelector('[data-partner-application-form]');
  if (applicationForm && session) {
    const applications = readLocal(APPLICATIONS_KEY, []);
    const current = applications.find((item) => item.partnerId === session.user.partnerId);
    if (current) Object.entries(current).forEach(([key, value]) => {
      const field = applicationForm.elements[key];
      if (field && typeof value !== 'object') field.value = value;
    });
    applicationForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!applicationForm.reportValidity()) return;
      const formData = new FormData(applicationForm);
      const documents = [...applicationForm.querySelectorAll('[data-document-reference]')].map((input) => input.value.trim()).filter(Boolean);
      const payload = Object.fromEntries([...formData.entries()].filter(([, value]) => typeof value === 'string'));
      const all = readLocal(APPLICATIONS_KEY, []);
      const index = all.findIndex((item) => item.partnerId === session.user.partnerId);
      const application = { ...(index >= 0 ? all[index] : {}), ...payload, id: current?.id || `app_local_${Date.now()}`, partnerId: session.user.partnerId, applicantUserId: session.user.id, businessType: session.user.businessType, documents, status: 'REVIEW_REQUESTED', submittedAt: new Date().toISOString() };
      if (index >= 0) all[index] = application; else all.push(application);
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(all));
      const registered = readLocal(window.HotelNGoPartnerAuth.keys.registered, []);
      const userIndex = registered.findIndex((item) => item.id === session.user.id);
      if (userIndex >= 0) {
        registered[userIndex].partnerStatus = 'REVIEW_REQUESTED';
        registered[userIndex].displayName = payload.legalName || registered[userIndex].displayName;
        localStorage.setItem(window.HotelNGoPartnerAuth.keys.registered, JSON.stringify(registered));
        window.HotelNGoPartnerAuth.writeSession(registered[userIndex]);
      }
      const feedback = applicationForm.querySelector('[data-partner-feedback]');
      if (feedback) { feedback.textContent = '입점 심사를 제출했습니다. 승인 전에는 운영정보를 직접 공개할 수 없습니다.'; feedback.dataset.type = 'success'; feedback.hidden = false; }
      setTimeout(() => { location.href = 'partner-application-status.html'; }, 300);
    });
  }

  const renderStatus = async () => {
    const target = document.querySelector('[data-application-status-view]');
    if (!target || !session) return;
    const fixture = await window.HotelNGoMockAPI.get('partner-platform.json');
    const local = readLocal(APPLICATIONS_KEY, []);
    const application = local.find((item) => item.partnerId === session.user.partnerId) || fixture.applications.find((item) => item.partnerId === session.user.partnerId);
    const status = application?.status || session.user.partnerStatus || 'DRAFT';
    if (status !== session.user.partnerStatus) {
      const registered = readLocal(window.HotelNGoPartnerAuth.keys.registered, []);
      const refreshedUser = registered.find((item) => item.id === session.user.id);
      if (refreshedUser) {
        refreshedUser.partnerStatus = status;
        localStorage.setItem(window.HotelNGoPartnerAuth.keys.registered, JSON.stringify(registered));
        const refreshedSession = window.HotelNGoPartnerAuth.writeSession(refreshedUser);
        session.user = refreshedSession.user;
      }
    }
    const statusLabel = { DRAFT: '작성 중', REVIEW_REQUESTED: '심사 요청', UNDER_REVIEW: '심사 중', APPROVED: '승인', REJECTED: '반려', SUSPENDED: '정지', CLOSED: '종료' }[status] || status;
    target.innerHTML = `<div class="bo-status-hero"><span class="bo-status ${status === 'APPROVED' ? '' : 'warn'}">${h(statusLabel)}</span><h2>${h(application?.legalName || session.user.displayName)}</h2><p>${status === 'APPROVED' ? '업체 운영 화면을 사용할 수 있습니다.' : '관리자 승인 전에는 상품·가격·재고를 공개 판매할 수 없습니다.'}</p></div><div class="bo-stage-list"><div class="is-done"><b>1</b><span><strong>파트너 계정</strong><small>HOTELNGO_PARTNER 독립 계정 생성</small></span></div><div class="${status !== 'DRAFT' ? 'is-done' : 'is-current'}"><b>2</b><span><strong>업체·증빙·정산 제출</strong><small>${application?.submittedAt ? h(new Date(application.submittedAt).toLocaleString('ko-KR')) : '입력 필요'}</small></span></div><div class="${['UNDER_REVIEW','APPROVED'].includes(status) ? 'is-current' : ''}"><b>3</b><span><strong>플랫폼 심사</strong><small>업종별 필수 문서와 소유권 검토</small></span></div><div class="${status === 'APPROVED' ? 'is-done' : ''}"><b>4</b><span><strong>업체·상품 활성화</strong><small>승인 후 검수된 상품만 판매 시작</small></span></div></div>`;
  };

  const renderClaim = async () => {
    const target = document.querySelector('[data-claim-provider-list]');
    if (!target) return;
    const fixture = await window.HotelNGoMockAPI.get('partner-platform.json');
    const ownership = readLocal(OWNERSHIP_KEY, {});
    const providers = [...fixture.providers, ...readLocal(PROVIDER_KEY, [])].map((item) => ({ ...item, ownershipStatus: ownership[item.id] || item.ownershipStatus }));
    const eligible = providers.filter((item) => !item.partnerId && ['UNCLAIMED','INVITED','CLAIM_REQUESTED'].includes(item.ownershipStatus));
    target.innerHTML = eligible.map((provider) => `<button class="bo-claim-option" type="button" data-claim-provider="${h(provider.id)}"><span><strong>${h(provider.name)}</strong><small>${h(labels[provider.businessType])} · ${h(provider.city)} · ${h(provider.managementType)}</small></span><span class="bo-status ${provider.ownershipStatus === 'CLAIM_REQUESTED' ? 'warn' : 'muted'}">${h(provider.ownershipStatus)}</span></button>`).join('');
    target.addEventListener('click', (event) => {
      const button = event.target.closest('[data-claim-provider]');
      if (!button) return;
      target.querySelectorAll('[data-claim-provider]').forEach((item) => item.classList.toggle('is-selected', item === button));
      const form = document.querySelector('[data-partner-claim-form]');
      form.elements.providerId.value = button.dataset.claimProvider;
      form.querySelector('[data-selected-provider]').textContent = button.querySelector('strong').textContent;
    });
  };
  const claimForm = document.querySelector('[data-partner-claim-form]');
  claimForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!claimForm.reportValidity()) return;
    const formData = new FormData(claimForm);
    if (!formData.get('providerId')) return;
    const claims = readLocal(CLAIMS_KEY, []);
    claims.push({ id: `clm_local_${Date.now()}`, providerId: String(formData.get('providerId')), providerName: claimForm.querySelector('[data-selected-provider]').textContent, partnerId: session?.user.partnerId, requester: session?.user.name, evidence: [String(formData.get('evidenceType')), String(formData.get('verificationChannel'))], status: 'CLAIM_REQUESTED', requestedAt: new Date().toISOString() });
    localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
    const feedback = claimForm.querySelector('[data-partner-feedback]');
    feedback.textContent = '소유권 요청을 접수했습니다. 승인 전에는 기존 업체 정보를 수정할 수 없습니다.';
    feedback.dataset.type = 'success'; feedback.hidden = false;
  });

  const renderBusiness = async () => {
    const target = document.querySelector('[data-partner-business-view]');
    if (!target) return;
    const type = document.body.dataset.businessType;
    const fixture = await window.HotelNGoMockAPI.get('partner-businesses.json');
    const data = fixture.businesses[type];
    if (!data) { target.innerHTML = '<div class="bo-error">업종 Mock 정의를 찾지 못했습니다.</div>'; return; }
    const previewOnly = Boolean(session?.user.businessType && session.user.businessType !== type);
    const preview = previewOnly ? `<div class="bo-notice bo-preview-notice"><span><b>업종 구조 미리보기</b> · 현재 계정은 ${h(labels[session.user.businessType])} 파트너입니다. ${h(data.label)} 데이터는 조회 예시이며 저장 권한이 없습니다.</span><span class="bo-status">READ ONLY</span></div>` : '';
    target.innerHTML = `${preview}<section class="bo-kpis">${data.metrics.map(([label,value]) => `<article class="bo-kpi"><small>${h(label)}</small><strong>${h(value)}</strong><span>${h(data.label)} Mock</span></article>`).join('')}</section><div class="bo-industry-grid">${data.sections.map((section) => `<section class="bo-card"><div class="bo-card-head"><h2>${h(section.title)}</h2><button class="bo-button" type="button" ${previewOnly ? 'disabled' : ''} data-bo-action="${h(section.title)} Mock 편집 상태를 저장했습니다.">편집</button></div><div class="bo-task-list">${section.items.map((item) => `<div class="bo-task"><strong>${h(item)}</strong><span>독립 ${h(data.label)} 공급 도메인 · PMS 데이터 미사용</span></div>`).join('')}</div></section>`).join('')}</div>`;
  };

  document.querySelectorAll('[data-partner-operation-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const state = readLocal(OPERATION_KEY, {});
    state[form.dataset.partnerOperationForm] = { value: Object.fromEntries(new FormData(form).entries()), savedAt: new Date().toISOString(), partnerId: session?.user.partnerId };
    localStorage.setItem(OPERATION_KEY, JSON.stringify(state));
    const feedback = form.querySelector('[data-partner-feedback]');
    if (feedback) { feedback.textContent = '파트너 범위의 Mock 운영 데이터로 저장했습니다.'; feedback.dataset.type = 'success'; feedback.hidden = false; }
  }));

  renderStatus();
  renderClaim();
  renderBusiness();
})();
