(() => {
  if (!document.querySelector('script[data-hotelngo-ui]')) {
    const uiScript = document.createElement('script');
    uiScript.src = 'scripts/ui-components.js?v=1';
    uiScript.dataset.hotelngoUi = '';
    document.head.append(uiScript);
  }

  const SESSION_KEY = 'hotelngo.mock.session.v1';
  const REGISTERED_KEY = 'hotelngo.mock.registered-users.v1';
  const MEMBER_PROFILES_KEY = 'hotelngo.mock.member-profiles.v1';
  const PASSWORD_OVERRIDES_KEY = 'hotelngo.mock.password-overrides.v1';
  const RESET_REQUEST_KEY = 'hotelngo.mock.password-reset.v1';

  const readSession = () => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  };
  const writeSession = (user) => {
    const session = { user: { id: user.id, email: user.email, name: user.name, displayName: user.displayName || user.name, roles: user.roles || ['TRAVELER'] }, issuedAt: new Date().toISOString() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  };
  const hash = async (value) => {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };
  const safeReturnUrl = () => {
    const requested = new URLSearchParams(location.search).get('returnUrl');
    if (!requested || requested.includes('://') || requested.startsWith('//')) return 'my.html';
    return requested;
  };
  const showMessage = (form, message, type = 'error') => {
    const target = form.querySelector('[data-auth-feedback]');
    if (!target) return;
    target.textContent = message;
    target.dataset.type = type;
    target.hidden = false;
  };
  const getRegisteredUsers = () => {
    try { return JSON.parse(localStorage.getItem(REGISTERED_KEY) || '[]'); } catch { return []; }
  };
  const getPasswordOverrides = () => {
    try { return JSON.parse(localStorage.getItem(PASSWORD_OVERRIDES_KEY) || '{}'); } catch { return {}; }
  };
  const getUsers = async () => {
    const fixture = await window.HotelNGoMockAPI.get('users.json');
    return [...fixture.users, ...getRegisteredUsers()];
  };
  const effectivePasswordHash = (user) => getPasswordOverrides()[user.id] || user.passwordHash;
  const savePassword = (user, passwordHash) => {
    const registered = getRegisteredUsers();
    const index = registered.findIndex((item) => item.id === user.id);
    if (index >= 0) {
      registered[index] = { ...registered[index], passwordHash };
      localStorage.setItem(REGISTERED_KEY, JSON.stringify(registered));
      return;
    }
    const overrides = getPasswordOverrides();
    overrides[user.id] = passwordHash;
    localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify(overrides));
  };

  let session = readSession();
  if (document.body.hasAttribute('data-auth-required') && !session) {
    const returnUrl = `${location.pathname.split('/').pop() || 'my.html'}${location.search}${location.hash}`;
    location.replace(`login.html?returnUrl=${encodeURIComponent(returnUrl)}`);
    return;
  }

  const paintSession = () => {
    session = readSession();
    document.documentElement.dataset.authState = session ? 'authenticated' : 'guest';
    document.querySelectorAll('.login-button').forEach((link) => {
      link.href = session ? 'my.html' : 'login.html';
      link.textContent = session ? `${session.user.displayName}님` : '로그인';
      link.setAttribute('aria-label', session ? `${session.user.name} 마이페이지` : '로그인');
    });
    document.querySelectorAll('.mobile-menu-actions .primary').forEach((link) => {
      link.href = session ? 'my.html' : 'login.html';
      link.textContent = session ? `${session.user.displayName}님의 마이페이지` : '로그인·회원가입';
    });
    document.querySelectorAll('[data-member-name]').forEach((target) => { target.textContent = session?.user.displayName || ''; });
    if (session) {
      document.querySelectorAll('.account-nav').forEach((nav) => {
        if (!nav.querySelector('[data-auth-logout]')) nav.insertAdjacentHTML('beforeend', '<button class="account-logout" type="button" data-auth-logout>로그아웃</button>');
      });
    }
  };

  const loginForm = document.querySelector('[data-login-form]');
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    const formData = new FormData(loginForm);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const passwordHash = await hash(String(formData.get('password') || ''));
    try {
      const users = await getUsers();
      const user = users.find((item) => item.email.toLowerCase() === email && effectivePasswordHash(item) === passwordHash);
      if (!user) return showMessage(loginForm, '이메일 또는 비밀번호가 일치하지 않습니다. 데모 계정을 확인해 주세요.');
      writeSession(user);
      showMessage(loginForm, `${user.displayName || user.name}님, 로그인했습니다.`, 'success');
      setTimeout(() => { location.href = safeReturnUrl(); }, 180);
    } catch {
      showMessage(loginForm, '계정 JSON을 불러오지 못했습니다. 로컬 서버에서 다시 실행해 주세요.');
    }
  });

  document.querySelector('[data-fill-demo]')?.addEventListener('click', () => {
    if (!loginForm) return;
    loginForm.elements.email.value = 'demo@hotelngo.test';
    loginForm.elements.password.value = 'Hotelngo!2026';
    showMessage(loginForm, '데모 계정을 입력했습니다. 로그인 버튼을 눌러 주세요.', 'success');
  });

  const signupForm = document.querySelector('[data-signup-form]');
  signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!signupForm.reportValidity()) return;
    const formData = new FormData(signupForm);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const registered = getRegisteredUsers();
    const fixture = await window.HotelNGoMockAPI.get('users.json');
    if ([...fixture.users, ...registered].some((item) => item.email.toLowerCase() === email)) return showMessage(signupForm, '이미 등록된 이메일입니다. 로그인해 주세요.');
    const name = String(formData.get('name') || '').trim();
    const displayName = name.length <= 3 ? (name.slice(1) || name) : name;
    const user = { id: `usr_local_${Date.now()}`, email, passwordHash: await hash(String(formData.get('password') || '')), name, displayName, locale: 'ko-KR', residenceCountry: String(formData.get('residenceCountry') || 'KR'), nationality: String(formData.get('nationality') || 'KR'), roles: ['TRAVELER'] };
    registered.push(user);
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(registered));
    const profiles = JSON.parse(localStorage.getItem(MEMBER_PROFILES_KEY) || '{}');
    profiles[user.id] = { member: { id: user.id, email, name, locale: user.locale, currency: 'KRW', residenceCountry: user.residenceCountry, nationality: user.nationality }, travelerProfiles: [] };
    localStorage.setItem(MEMBER_PROFILES_KEY, JSON.stringify(profiles));
    writeSession(user);
    showMessage(signupForm, 'Mock 계정을 만들었습니다. 마이페이지로 이동합니다.', 'success');
    setTimeout(() => { location.href = 'my.html'; }, 180);
  });

  const resetRequestForm = document.querySelector('[data-password-reset-request]');
  resetRequestForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!resetRequestForm.reportValidity()) return;
    const email = String(new FormData(resetRequestForm).get('email') || '').trim().toLowerCase();
    try {
      const user = (await getUsers()).find((item) => item.email.toLowerCase() === email);
      if (!user) return showMessage(resetRequestForm, '등록된 HotelnGo 계정을 찾지 못했습니다. PMS 고객 계정은 여기에서 사용할 수 없습니다.');
      const request = { userId: user.id, email: user.email, code: '628314', expiresAt: Date.now() + (10 * 60 * 1000) };
      sessionStorage.setItem(RESET_REQUEST_KEY, JSON.stringify(request));
      showMessage(resetRequestForm, 'Mock 인증번호 628314를 발급했습니다. 실제 이메일은 전송하지 않습니다.', 'success');
      const continueLink = document.querySelector('[data-reset-continue]');
      if (continueLink) {
        continueLink.href = `password-reset-confirm.html?email=${encodeURIComponent(user.email)}`;
        continueLink.hidden = false;
      }
    } catch {
      showMessage(resetRequestForm, '계정 JSON을 읽지 못했습니다. 로컬 서버에서 다시 시도해 주세요.');
    }
  });

  const resetConfirmForm = document.querySelector('[data-password-reset-confirm]');
  if (resetConfirmForm) {
    const requestedEmail = new URLSearchParams(location.search).get('email');
    if (requestedEmail && resetConfirmForm.elements.email) resetConfirmForm.elements.email.value = requestedEmail;
    resetConfirmForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!resetConfirmForm.reportValidity()) return;
      const formData = new FormData(resetConfirmForm);
      const email = String(formData.get('email') || '').trim().toLowerCase();
      const code = String(formData.get('code') || '').trim();
      const password = String(formData.get('password') || '');
      const confirmation = String(formData.get('passwordConfirmation') || '');
      let request;
      try { request = JSON.parse(sessionStorage.getItem(RESET_REQUEST_KEY) || 'null'); } catch { request = null; }
      if (!request || request.email.toLowerCase() !== email || request.code !== code || request.expiresAt < Date.now()) return showMessage(resetConfirmForm, '인증번호가 일치하지 않거나 만료되었습니다. 다시 발급해 주세요.');
      if (password !== confirmation) return showMessage(resetConfirmForm, '새 비밀번호 확인이 일치하지 않습니다.');
      const user = (await getUsers()).find((item) => item.id === request.userId);
      if (!user) return showMessage(resetConfirmForm, '계정을 찾지 못했습니다.');
      savePassword(user, await hash(password));
      sessionStorage.removeItem(RESET_REQUEST_KEY);
      showMessage(resetConfirmForm, '비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.', 'success');
      setTimeout(() => { location.href = 'login.html'; }, 400);
    });
  }

  const passwordChangeForm = document.querySelector('[data-password-change]');
  passwordChangeForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!passwordChangeForm.reportValidity()) return;
    const formData = new FormData(passwordChangeForm);
    const currentPassword = String(formData.get('currentPassword') || '');
    const password = String(formData.get('password') || '');
    const confirmation = String(formData.get('passwordConfirmation') || '');
    const currentSession = readSession();
    const user = (await getUsers()).find((item) => item.id === currentSession?.user.id);
    if (!user || effectivePasswordHash(user) !== await hash(currentPassword)) return showMessage(passwordChangeForm, '현재 비밀번호가 일치하지 않습니다.');
    if (password !== confirmation) return showMessage(passwordChangeForm, '새 비밀번호 확인이 일치하지 않습니다.');
    if (effectivePasswordHash(user) === await hash(password)) return showMessage(passwordChangeForm, '현재 비밀번호와 다른 비밀번호를 입력해 주세요.');
    savePassword(user, await hash(password));
    showMessage(passwordChangeForm, '비밀번호를 변경했습니다. 현재 세션은 유지됩니다.', 'success');
    passwordChangeForm.reset();
  });

  document.addEventListener('click', (event) => {
    const logout = event.target.closest('[data-auth-logout]');
    if (!logout) return;
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'index.html';
  });

  window.HotelNGoAuth = { getSession: readSession, isAuthenticated: () => Boolean(readSession()), login: writeSession, getUsers };
  paintSession();
})();
