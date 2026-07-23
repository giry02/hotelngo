(() => {
  const SESSION_KEY = 'hotelngo.hotel.mock.session.v1';
  const REGISTERED_KEY = 'hotelngo.hotel.mock.registered-users.v1';
  const APPLICATION_KEY = 'hotelngo.hotel.mock.applications.v1';
  const readJson = (storage, key, fallback) => {
    try { return JSON.parse(storage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
  };
  const hash = async (value) => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };
  const getRegistered = () => readJson(localStorage, REGISTERED_KEY, []);
  const getUsers = async () => {
    const fixture = await window.HotelNGoMockAPI.get('hotel-users.json');
    return [...getRegistered(), ...fixture.users];
  };
  const getSession = () => readJson(sessionStorage, SESSION_KEY, null);
  const writeSession = (user) => {
    const session = { user: { id:user.id, realm:'HOTELNGO_HOTEL', email:user.email, name:user.name, displayName:user.displayName, hotelId:user.hotelId || null, tenantId:user.tenantId || null, status:user.status, roles:user.roles || ['HOTEL_CONTENT_OWNER'] }, issuedAt:new Date().toISOString() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  };
  const showFeedback = (form, message, type = 'error') => {
    const target = form.querySelector('[data-hotel-feedback]');
    if (!target) return;
    target.hidden = false;
    target.dataset.type = type;
    target.textContent = message;
  };
  const safeReturnUrl = () => {
    const requested = new URLSearchParams(location.search).get('returnUrl');
    return requested && !requested.includes('://') && !requested.startsWith('//') ? requested : 'hotel-dashboard.html';
  };

  const session = getSession();
  if (document.body.hasAttribute('data-hotel-auth-required') && session?.user?.realm !== 'HOTELNGO_HOTEL') {
    const returnUrl = `${location.pathname.split('/').pop() || 'hotel-dashboard.html'}${location.search}${location.hash}`;
    location.replace(`hotel-login.html?returnUrl=${encodeURIComponent(returnUrl)}`);
    return;
  }

  document.querySelectorAll('[data-hotel-account-name]').forEach((target) => { target.textContent = session?.user?.displayName || '호텔 담당자'; });

  const loginForm = document.querySelector('[data-hotel-login-form]');
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    const form = new FormData(loginForm);
    const email = String(form.get('email') || '').trim().toLowerCase();
    const passwordHash = await hash(String(form.get('password') || ''));
    const user = (await getUsers()).find((item) => item.realm === 'HOTELNGO_HOTEL' && item.email.toLowerCase() === email && item.passwordHash === passwordHash);
    if (!user) return showFeedback(loginForm, '호텔 콘텐츠 계정을 확인하지 못했습니다. PMS 직원·B2C 회원·파트너 계정은 사용할 수 없습니다.');
    writeSession(user);
    showFeedback(loginForm, `${user.displayName} 계정으로 로그인했습니다.`, 'success');
    setTimeout(() => { location.href = user.status === 'APPROVED' ? safeReturnUrl() : 'hotel-application-status.html'; }, 180);
  });
  document.querySelector('[data-fill-hotel-demo]')?.addEventListener('click', () => {
    if (!loginForm) return;
    loginForm.elements.email.value = 'content@dananghotel.test';
    loginForm.elements.password.value = 'Hotel!2026';
    showFeedback(loginForm, '승인된 호텔 콘텐츠 Mock 계정을 입력했습니다.', 'success');
  });

  const signupForm = document.querySelector('[data-hotel-signup-form]');
  signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!signupForm.reportValidity()) return;
    const form = new FormData(signupForm);
    const email = String(form.get('email') || '').trim().toLowerCase();
    if ((await getUsers()).some((item) => item.email.toLowerCase() === email)) return showFeedback(signupForm, '이미 등록된 업무 이메일입니다.');
    const id = `husr_local_${Date.now()}`;
    const user = {
      id, realm:'HOTELNGO_HOTEL', email,
      passwordHash:await hash(String(form.get('password') || '')),
      name:String(form.get('name') || '').trim(),
      displayName:String(form.get('hotelName') || '').trim(),
      hotelId:null, tenantId:String(form.get('tenantId') || '').trim() || null,
      status:'UNDER_REVIEW', roles:['HOTEL_CONTENT_OWNER']
    };
    const registered = getRegistered();
    registered.unshift(user);
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(registered));
    const applications = readJson(localStorage, APPLICATION_KEY, []);
    applications.unshift({ id:`happ_${Date.now()}`, userId:id, hotelName:user.displayName, tenantId:user.tenantId, country:String(form.get('country') || ''), city:String(form.get('city') || ''), proof:String(form.get('proof') || ''), status:'UNDER_REVIEW', submittedAt:new Date().toISOString() });
    localStorage.setItem(APPLICATION_KEY, JSON.stringify(applications));
    writeSession(user);
    showFeedback(signupForm, '호텔 소유권 확인 요청을 접수했습니다.', 'success');
    setTimeout(() => { location.href = 'hotel-application-status.html'; }, 250);
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-hotel-logout]')) return;
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'hotel-login.html';
  });

  window.HotelNGoHotelAuth = { getSession, writeSession, getUsers, keys:{ applications:APPLICATION_KEY } };
})();
