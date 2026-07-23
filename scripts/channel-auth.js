(() => {
  const SESSION_KEY = 'hotelngo.channel.mock.session.v1';
  const readSession = () => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  };
  const hash = async (value) => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };
  const safeReturnUrl = () => {
    const requested = new URLSearchParams(location.search).get('returnUrl');
    if (!requested || requested.includes('://') || requested.startsWith('//')) return 'channel-dashboard.html';
    return requested;
  };
  const feedback = (form, message, type = 'error') => {
    const target = form.querySelector('[data-channel-feedback]');
    if (!target) return;
    target.textContent = message;
    target.dataset.type = type;
    target.hidden = false;
  };

  const session = readSession();
  if (document.body.hasAttribute('data-channel-auth-required') && (!session || session.user.realm !== 'HOTELNGO_CHANNEL')) {
    const returnUrl = `${location.pathname.split('/').pop() || 'channel-dashboard.html'}${location.search}${location.hash}`;
    location.replace(`channel-login.html?returnUrl=${encodeURIComponent(returnUrl)}`);
    return;
  }

  const applySessionLabels = () => {
    document.querySelectorAll('[data-channel-name]').forEach((target) => {
      target.textContent = session?.user.displayName || '채널 운영자';
    });
  };
  applySessionLabels();
  document.addEventListener('DOMContentLoaded', applySessionLabels, { once: true });

  const form = document.querySelector('[data-channel-login-form]');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const passwordHash = await hash(String(formData.get('password') || ''));
    try {
      const fixture = await window.HotelNGoMockAPI.get('channel-users.json');
      const user = fixture.users.find((item) => item.realm === 'HOTELNGO_CHANNEL'
        && item.email.toLowerCase() === email
        && item.passwordHash === passwordHash);
      if (!user) {
        feedback(form, '채널 운영 계정을 확인하지 못했습니다. B2C·파트너·호텔·관리자 계정과 분리된 영역입니다.');
        return;
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          displayName: user.displayName,
          realm: user.realm,
          roles: user.roles,
          tenantScope: user.tenantScope
        },
        issuedAt: new Date().toISOString()
      }));
      feedback(form, `${user.displayName} 채널 운영자로 로그인했습니다.`, 'success');
      setTimeout(() => { location.href = safeReturnUrl(); }, 180);
    } catch {
      feedback(form, '채널 계정 JSON을 읽지 못했습니다. 로컬 서버에서 다시 시도해 주세요.');
    }
  });

  document.querySelector('[data-fill-channel-demo]')?.addEventListener('click', () => {
    if (!form) return;
    form.elements.email.value = 'channel.ops@hotelngo.test';
    form.elements.password.value = 'Channel!2026';
    feedback(form, '채널 운영 Mock 계정을 입력했습니다.', 'success');
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-channel-logout]')) return;
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'channel-login.html';
  });

  window.HotelNGoChannelAuth = {
    getSession: readSession,
    isAuthenticated: () => Boolean(readSession()?.user?.realm === 'HOTELNGO_CHANNEL')
  };
})();
