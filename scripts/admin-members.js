(() => {
  const REGISTERED_KEY = 'hotelngo.mock.registered-users.v1';
  const PROFILES_KEY = 'hotelngo.mock.member-profiles.v1';
  const getLocal = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
  };
  const countryName = (code) => ({ KR: '대한민국', JP: '일본', US: '미국', SG: '싱가포르', OTHER: '기타' }[code] || code || '미입력');
  const h = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const load = async () => {
    const [usersFixture, profileFixture] = await Promise.all([
      window.HotelNGoMockAPI.get('users.json'),
      window.HotelNGoMockAPI.get('member-profile.json')
    ]);
    const localUsers = getLocal(REGISTERED_KEY, []);
    const localProfiles = getLocal(PROFILES_KEY, {});
    const users = [...usersFixture.users, ...localUsers].map((user) => ({
      ...user,
      profile: localProfiles[user.id] || (user.id === profileFixture.member.id ? profileFixture : undefined)
    }));
    const body = document.querySelector('[data-admin-member-rows]');
    if (body) body.innerHTML = users.map((user) => {
      const primary = user.profile?.travelerProfiles?.find((item) => item.isPrimary) || user.profile?.travelerProfiles?.[0];
      return `<tr><td><strong>${h(user.name)}</strong><small>${h(user.id)}</small></td><td>${h(user.email)}</td><td><span class="bo-status">HOTELNGO_B2C</span></td><td>${h(countryName(user.profile?.member?.nationality || user.nationality))}</td><td>${h(primary?.passport?.maskedNumber || '미등록')}</td><td>${primary?.pmsGuestLinks?.length || 0}건</td><td><a class="bo-button" href="admin-member-detail.html?memberId=${encodeURIComponent(user.id)}">상세</a></td></tr>`;
    }).join('');
    document.querySelectorAll('[data-admin-member-count]').forEach((target) => { target.textContent = String(users.length); });

    const detail = document.querySelector('[data-admin-member-detail]');
    if (!detail) return;
    const memberId = new URLSearchParams(location.search).get('memberId') || users[0]?.id;
    const user = users.find((item) => item.id === memberId);
    if (!user) {
      detail.innerHTML = '<div class="bo-error">회원을 찾지 못했습니다.</div>';
      return;
    }
    const member = user.profile?.member || user;
    const primary = user.profile?.travelerProfiles?.find((item) => item.isPrimary) || user.profile?.travelerProfiles?.[0];
    const links = primary?.pmsGuestLinks || [];
    detail.innerHTML = `<div class="bo-detail-grid"><section class="bo-card"><div class="bo-card-head"><h2>HotelnGo 회원</h2><span class="bo-status">HOTELNGO_B2C</span></div><dl class="bo-definition-list"><div><dt>회원 ID</dt><dd>${h(user.id)}</dd></div><div><dt>이름</dt><dd>${h(user.name)}</dd></div><div><dt>이메일</dt><dd>${h(user.email)}</dd></div><div><dt>거주 국가</dt><dd>${h(countryName(member.residenceCountry))}</dd></div><div><dt>국적</dt><dd>${h(countryName(member.nationality))}</dd></div><div><dt>역할</dt><dd>${h((user.roles || []).join(', '))}</dd></div></dl></section><section class="bo-card"><div class="bo-card-head"><h2>대표 여행자 기본값</h2><span class="bo-status muted">민감정보 마스킹</span></div>${primary ? `<dl class="bo-definition-list"><div><dt>영문명</dt><dd>${h(primary.passportName || '미입력')}</dd></div><div><dt>생년월일</dt><dd>${h(primary.birthDate || '미입력')}</dd></div><div><dt>여권번호</dt><dd>${h(primary.passport?.maskedNumber || '미등록')}</dd></div><div><dt>발행국</dt><dd>${h(countryName(primary.passport?.issuingCountry))}</dd></div><div><dt>만료일</dt><dd>${h(primary.passport?.expiresOn || '미입력')}</dd></div></dl>` : '<p class="bo-empty">등록된 여행자 기본값이 없습니다.</p>'}</section></div><section class="bo-card"><div class="bo-card-head"><h2>PMS 고객 연결</h2><span class="bo-status ${links.length ? '' : 'muted'}">${links.length}건</span></div><div class="bo-notice"><span><b>계정 병합 금지</b> · 이 연결은 호텔별 PMS 고객 레코드를 참조할 뿐, 로그인·비밀번호·세션을 공유하지 않습니다.</span><span class="bo-status">PmsGuestLink</span></div>${links.length ? `<div class="bo-table-wrap"><table class="bo-table"><thead><tr><th>Provider</th><th>Tenant</th><th>PMS Guest</th><th>검증 방식</th></tr></thead><tbody>${links.map((link) => `<tr><td>${h(link.providerId)}</td><td>${h(link.tenantId)}</td><td>${h(link.pmsGuestId)}</td><td>${h(link.matchMethod)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="bo-empty">아직 연결된 PMS 고객 레코드가 없습니다. 최초 예약 전송 또는 명시적 확인 후 생성할 수 있습니다.</p>'}</section>`;
  };
  load().catch(() => {
    const target = document.querySelector('[data-admin-member-rows], [data-admin-member-detail]');
    if (target) target.innerHTML = '<div class="bo-error">회원 Mock 데이터를 불러오지 못했습니다.</div>';
  });
})();
