(() => {
  if (!document.querySelector('script[data-hotelngo-ui]')) {
    const uiScript = document.createElement('script');
    uiScript.src = 'scripts/ui-components.js?v=1';
    uiScript.dataset.hotelngoUi = '';
    document.head.append(uiScript);
  }

  const SESSION_KEY = 'hotelngo.partner.mock.session.v1';
  const REGISTERED_KEY = 'hotelngo.partner.mock.registered-users.v1';
  const APPLICATIONS_KEY = 'hotelngo.partner.mock.applications.v1';
  const readJson = (storage, key, fallback) => {
    try { return JSON.parse(storage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
  };
  const readSession = () => readJson(sessionStorage, SESSION_KEY, null);
  const writeSession = (user) => {
    const session = { user: { id: user.id, realm: 'HOTELNGO_PARTNER', email: user.email, name: user.name, displayName: user.displayName || user.legalName || user.name, partnerId: user.partnerId, providerId: user.providerId || null, businessType: user.businessType, partnerStatus: user.partnerStatus, roles: user.roles || ['PARTNER_OWNER'] }, issuedAt: new Date().toISOString() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  };
  const hash = async (value) => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };
  const getRegistered = () => readJson(localStorage, REGISTERED_KEY, []);
  const getUsers = async () => {
    const fixture = await window.HotelNGoMockAPI.get('partner-users.json');
    return [...getRegistered(), ...fixture.users];
  };
  const safeReturnUrl = () => {
    const requested = new URLSearchParams(location.search).get('returnUrl');
    if (!requested || requested.includes('://') || requested.startsWith('//')) return 'partner-dashboard.html';
    return requested;
  };
  const feedback = (form, message, type = 'error') => {
    const target = form.querySelector('[data-partner-feedback]');
    if (!target) return;
    target.textContent = message;
    target.dataset.type = type;
    target.hidden = false;
  };
  const session = readSession();
  if (document.body.hasAttribute('data-partner-auth-required') && (!session || session.user.realm !== 'HOTELNGO_PARTNER')) {
    const returnUrl = `${location.pathname.split('/').pop() || 'partner-dashboard.html'}${location.search}${location.hash}`;
    location.replace(`partner-login.html?returnUrl=${encodeURIComponent(returnUrl)}`);
    return;
  }
  if (document.body.hasAttribute('data-partner-approved-required') && session?.user.partnerStatus !== 'APPROVED') {
    location.replace('partner-application-status.html');
    return;
  }

  document.querySelectorAll('[data-partner-name]').forEach((target) => { target.textContent = session?.user.displayName || ''; });
  document.querySelectorAll('[data-partner-status]').forEach((target) => { target.textContent = session?.user.partnerStatus || ''; });

  const loginForm = document.querySelector('[data-partner-login-form]');
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    const formData = new FormData(loginForm);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const passwordHash = await hash(String(formData.get('password') || ''));
    const user = (await getUsers()).find((item) => item.realm === 'HOTELNGO_PARTNER' && item.email.toLowerCase() === email && item.passwordHash === passwordHash);
    if (!user) return feedback(loginForm, '파트너 계정을 확인하지 못했습니다. B2C 회원·관리자·PMS 직원 계정은 사용할 수 없습니다.');
    writeSession(user);
    feedback(loginForm, `${user.displayName || user.name} 파트너로 로그인했습니다.`, 'success');
    const destination = user.partnerStatus === 'APPROVED' ? safeReturnUrl() : 'partner-application-status.html';
    setTimeout(() => { location.href = destination; }, 180);
  });
  document.querySelector('[data-fill-partner-demo]')?.addEventListener('click', () => {
    if (!loginForm) return;
    loginForm.elements.email.value = 'ops@dananghillsgolf.test';
    loginForm.elements.password.value = 'Partner!2026';
    feedback(loginForm, '승인된 골프장 파트너 Mock 계정을 입력했습니다.', 'success');
  });
  if (loginForm) {
    const links = document.querySelector('.bo-auth-links');
    if (links && !links.querySelector('[data-partner-reset-link]')) links.insertAdjacentHTML('afterbegin', '<a href="partner-password-reset.html" data-partner-reset-link>비밀번호 재설정</a>');
  }

  const resetForm = document.querySelector('[data-partner-reset-form]');
  resetForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!resetForm.reportValidity()) return;
    const formData = new FormData(resetForm);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const confirmation = String(formData.get('passwordConfirmation') || '');
    if (password !== confirmation) return feedback(resetForm, '새 비밀번호와 확인 값이 일치하지 않습니다.');
    const source = (await getUsers()).find((item) => item.email.toLowerCase() === email && item.realm === 'HOTELNGO_PARTNER');
    if (!source) return feedback(resetForm, '등록된 파트너 업무 이메일을 찾지 못했습니다.');
    const users = getRegistered();
    const resetUser = { ...source, passwordHash: await hash(password), passwordUpdatedAt: new Date().toISOString() };
    const index = users.findIndex((item) => item.email.toLowerCase() === email);
    if (index >= 0) users[index] = resetUser; else users.unshift(resetUser);
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(users));
    feedback(resetForm, 'Mock 파트너 비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.', 'success');
    setTimeout(() => { location.href = 'partner-login.html'; }, 450);
  });

  const signupForm = document.querySelector('[data-partner-signup-form]');
  signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!signupForm.reportValidity()) return;
    const formData = new FormData(signupForm);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    if ((await getUsers()).some((item) => item.email.toLowerCase() === email)) return feedback(signupForm, '이미 등록된 파트너 업무 이메일입니다. 로그인하거나 계정 복구를 이용해 주세요.');
    const id = `pusr_local_${Date.now()}`;
    const partnerId = `ptn_draft_${Date.now()}`;
    const user = { id, realm: 'HOTELNGO_PARTNER', email, passwordHash: await hash(String(formData.get('password') || '')), name: String(formData.get('name') || '').trim(), displayName: String(formData.get('businessName') || '').trim(), partnerId, providerId: null, businessType: String(formData.get('businessType') || ''), partnerStatus: 'DRAFT', roles: ['PARTNER_OWNER'] };
    const users = getRegistered();
    users.push(user);
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(users));
    const applications = readJson(localStorage, APPLICATIONS_KEY, []);
    applications.push({ id: `app_local_${Date.now()}`, partnerId, applicantUserId: id, businessType: user.businessType, legalName: user.displayName, contactName: user.name, email, phone: String(formData.get('phone') || ''), status: 'DRAFT', createdAt: new Date().toISOString() });
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
    writeSession(user);
    feedback(signupForm, '파트너 계정을 만들었습니다. 업체·증빙·정산 정보를 이어서 입력해 주세요.', 'success');
    setTimeout(() => { location.href = 'partner-application.html'; }, 220);
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-partner-logout]')) return;
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'partner-login.html';
  });
  window.HotelNGoPartnerAuth = { getSession: readSession, getUsers, writeSession, keys: { registered: REGISTERED_KEY, applications: APPLICATIONS_KEY } };
})();
