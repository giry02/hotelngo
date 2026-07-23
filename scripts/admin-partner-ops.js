(() => {
  const APP_KEY = 'hotelngo.partner.mock.applications.v1';
  const CLAIM_KEY = 'hotelngo.partner.mock.claims.v1';
  const PROVIDER_KEY = 'hotelngo.admin.mock.providers.v1';
  const USER_KEY = 'hotelngo.partner.mock.registered-users.v1';
  const OVERRIDE_KEY = 'hotelngo.admin.mock.partner-status-overrides.v1';
  const CLAIM_OVERRIDE_KEY = 'hotelngo.admin.mock.claim-status-overrides.v1';
  const OWNERSHIP_KEY = 'hotelngo.admin.mock.provider-ownership-overrides.v1';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const h = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const typeLabel = { HOTEL: '호텔', GOLF: '골프장', VEHICLE: '차량', RESTAURANT: '음식점·카페', SPA: '마사지·스파', TOUR: '투어·체험' };
  const load = async () => {
    const fixture = await window.HotelNGoMockAPI.get('partner-platform.json');
    const overrides = read(OVERRIDE_KEY, {});
    const applications = [...fixture.applications, ...read(APP_KEY, [])].map((item) => ({ ...item, status: overrides[item.id] || item.status }));
    const appBody = document.querySelector('[data-admin-partner-applications]');
    if (appBody) appBody.innerHTML = applications.map((item) => `<tr data-application-id="${h(item.id)}"><td><strong>${h(item.legalName)}</strong><small>${h(item.id)}</small></td><td>${h(typeLabel[item.businessType])}</td><td>${h(item.contactName)}<small>${h(item.email)}</small></td><td>${h((item.documents || []).join(' · ') || '미제출')}</td><td><span class="bo-status ${item.status === 'APPROVED' ? '' : 'warn'}">${h(item.status)}</span></td><td><button class="bo-button" type="button" data-admin-app-action="UNDER_REVIEW">검토</button> <button class="bo-button primary" type="button" data-admin-app-action="APPROVED">승인</button></td></tr>`).join('');
    document.querySelectorAll('[data-admin-application-count]').forEach((target) => { target.textContent = String(applications.filter((item) => item.status !== 'APPROVED').length); });

    const ownershipOverrides = read(OWNERSHIP_KEY, {});
    const providers = [...fixture.providers, ...read(PROVIDER_KEY, [])].map((item) => ({ ...item, ownershipStatus: ownershipOverrides[item.id] || item.ownershipStatus }));
    const providerBody = document.querySelector('[data-admin-provider-rows]');
    if (providerBody) providerBody.innerHTML = providers.map((item) => `<tr><td><strong>${h(item.name)}</strong><small>${h(item.id)}</small></td><td>${h(typeLabel[item.businessType])}</td><td>${h(item.city)} · ${h(item.country)}</td><td>${h(item.managementType)}</td><td><span class="bo-status ${item.ownershipStatus === 'UNCLAIMED' ? 'muted' : ''}">${h(item.ownershipStatus)}</span></td><td>${h(item.bookingMode)}</td><td>${h(item.lastVerifiedAt || '미검수')}</td></tr>`).join('');
    document.querySelectorAll('[data-admin-provider-count]').forEach((target) => { target.textContent = String(providers.length); });

    const claimOverrides = read(CLAIM_OVERRIDE_KEY, {});
    const claims = [...fixture.claims, ...read(CLAIM_KEY, [])].map((item) => ({ ...item, status: claimOverrides[item.id] || item.status }));
    const claimBody = document.querySelector('[data-admin-claim-rows]');
    if (claimBody) claimBody.innerHTML = claims.map((item) => `<tr data-claim-id="${h(item.id)}"><td><strong>${h(item.providerName)}</strong><small>${h(item.providerId)}</small></td><td>${h(item.requester)}</td><td>${h((item.evidence || []).join(' · '))}</td><td><span class="bo-status ${item.status === 'CLAIMED' ? '' : item.status === 'REJECTED' ? 'danger' : 'warn'}">${h(item.status)}</span></td><td><button class="bo-button" type="button" data-admin-claim-action="REJECTED">반려</button> <button class="bo-button primary" type="button" data-admin-claim-action="CLAIMED">승인</button></td></tr>`).join('');
  };

  document.addEventListener('click', (event) => {
    const appButton = event.target.closest('[data-admin-app-action]');
    if (appButton) {
      const row = appButton.closest('[data-application-id]');
      const id = row.dataset.applicationId;
      const status = appButton.dataset.adminAppAction;
      const overrides = read(OVERRIDE_KEY, {}); overrides[id] = status; localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
      row.querySelector('.bo-status').textContent = status;
      const localApps = read(APP_KEY, []); const app = localApps.find((item) => item.id === id);
      if (app) {
        app.status = status; localStorage.setItem(APP_KEY, JSON.stringify(localApps));
        const users = read(USER_KEY, []); const user = users.find((item) => item.partnerId === app.partnerId); if (user) { user.partnerStatus = status; if (status === 'APPROVED') user.providerId = `prv_partner_${Date.now()}`; localStorage.setItem(USER_KEY, JSON.stringify(users)); }
      }
      return;
    }
    const claimButton = event.target.closest('[data-admin-claim-action]');
    if (claimButton) {
      const row = claimButton.closest('[data-claim-id]');
      const claimId = row.dataset.claimId;
      const status = claimButton.dataset.adminClaimAction;
      row.querySelector('.bo-status').textContent = status;
      const claimOverrides = read(CLAIM_OVERRIDE_KEY, {}); claimOverrides[claimId] = status; localStorage.setItem(CLAIM_OVERRIDE_KEY, JSON.stringify(claimOverrides));
      const fixtureClaimName = row.querySelector('small')?.textContent;
      if (fixtureClaimName) { const ownership = read(OWNERSHIP_KEY, {}); ownership[fixtureClaimName] = status === 'CLAIMED' ? 'CLAIMED' : 'UNCLAIMED'; localStorage.setItem(OWNERSHIP_KEY, JSON.stringify(ownership)); }
      const localClaims = read(CLAIM_KEY, []); const localClaim = localClaims.find((item) => item.id === claimId); if (localClaim) { localClaim.status = status; localStorage.setItem(CLAIM_KEY, JSON.stringify(localClaims)); }
      if (localClaim && status === 'CLAIMED') {
        const localProviders = read(PROVIDER_KEY, []);
        const provider = localProviders.find((item) => item.id === localClaim.providerId);
        if (provider) {
          provider.partnerId = localClaim.partnerId;
          provider.managementType = 'PARTNER_MANAGED';
          provider.ownershipStatus = 'CLAIMED';
          provider.verificationStatus = 'PARTNER_VERIFIED';
          provider.lastVerifiedAt = new Date().toISOString().slice(0, 10);
          localStorage.setItem(PROVIDER_KEY, JSON.stringify(localProviders));
        }
      }
    }
  });

  const providerForm = document.querySelector('[data-admin-provider-form]');
  providerForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!providerForm.reportValidity()) return;
    const data = Object.fromEntries(new FormData(providerForm).entries());
    const providers = read(PROVIDER_KEY, []);
    providers.push({ ...data, id: `prv_curated_${Date.now()}`, placeId: `plc_curated_${Date.now()}`, managementType: 'PLATFORM_CURATED', ownershipStatus: 'UNCLAIMED', verificationStatus: 'UNVERIFIED', lastVerifiedAt: '', partnerId: null });
    localStorage.setItem(PROVIDER_KEY, JSON.stringify(providers));
    const feedback = providerForm.querySelector('[data-admin-feedback]');
    feedback.textContent = '미입점 Provider·Place를 선등록했습니다. 즉시예약은 활성화되지 않습니다.'; feedback.dataset.type = 'success'; feedback.hidden = false;
    providerForm.reset();
    load();
  });
  load();
})();
