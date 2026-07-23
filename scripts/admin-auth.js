(() => {
  if (!document.querySelector('script[data-hotelngo-ui]')) {
    const uiScript = document.createElement('script');
    uiScript.src = 'scripts/ui-components.js?v=1';
    uiScript.dataset.hotelngoUi = '';
    document.head.append(uiScript);
  }

  const SESSION_KEY = 'hotelngo.admin.mock.session.v1';
  const readSession = () => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  };
  const hash = async (value) => {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };
  const safeReturnUrl = () => {
    const requested = new URLSearchParams(location.search).get('returnUrl');
    if (!requested || requested.includes('://') || requested.startsWith('//')) return 'admin-dashboard.html';
    return requested;
  };
  const showMessage = (form, message, type = 'error') => {
    const target = form.querySelector('[data-admin-feedback]');
    if (!target) return;
    target.textContent = message;
    target.dataset.type = type;
    target.hidden = false;
  };
  const session = readSession();
  if (document.body.hasAttribute('data-admin-auth-required') && (!session || session.user.realm !== 'HOTELNGO_ADMIN')) {
    const returnUrl = `${location.pathname.split('/').pop() || 'admin-dashboard.html'}${location.search}${location.hash}`;
    location.replace(`admin-login.html?returnUrl=${encodeURIComponent(returnUrl)}`);
    return;
  }
  document.querySelectorAll('[data-admin-name]').forEach((target) => { target.textContent = session?.user.displayName || ''; });

  const form = document.querySelector('[data-admin-login-form]');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const passwordHash = await hash(String(formData.get('password') || ''));
    try {
      const fixture = await window.HotelNGoMockAPI.get('admin-users.json');
      const user = fixture.users.find((item) => item.realm === 'HOTELNGO_ADMIN' && item.email.toLowerCase() === email && item.passwordHash === passwordHash);
      if (!user) return showMessage(form, '관리자 계정을 확인하지 못했습니다. B2C 회원 또는 PMS 직원 계정으로는 로그인할 수 없습니다.');
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: { id: user.id, email: user.email, name: user.name, displayName: user.displayName, realm: user.realm, roles: user.roles }, issuedAt: new Date().toISOString() }));
      showMessage(form, `${user.displayName} 관리자로 로그인했습니다.`, 'success');
      setTimeout(() => { location.href = safeReturnUrl(); }, 180);
    } catch {
      showMessage(form, '관리자 계정 JSON을 읽지 못했습니다. 로컬 서버에서 다시 시도해 주세요.');
    }
  });
  document.querySelector('[data-fill-admin-demo]')?.addEventListener('click', () => {
    if (!form) return;
    form.elements.email.value = 'admin.ops@hotelngo.test';
    form.elements.password.value = 'Admin!2026';
    showMessage(form, '관리자 Mock 계정을 입력했습니다.', 'success');
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-admin-logout]')) return;
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'admin-login.html';
  });
  window.HotelNGoAdminAuth = { getSession: readSession, isAuthenticated: () => Boolean(readSession()) };
})();
