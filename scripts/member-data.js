(() => {
  const getNested = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
  const loadMemberProfile = async () => {
    const session = window.HotelNGoAuth?.getSession();
    let localProfiles = {};
    try { localProfiles = JSON.parse(localStorage.getItem('hotelngo.mock.member-profiles.v1') || '{}'); } catch { localProfiles = {}; }
    if (session?.user.id && localProfiles[session.user.id]) return localProfiles[session.user.id];
    return window.HotelNGoMockAPI.get('member-profile.json');
  };
  const render = async () => {
    try {
      const data = await window.HotelNGoMockAPI.get('member-dashboard.json');
      const values = {
        'upcoming-trips': data.summary.upcomingTrips,
        'saved-places': data.summary.savedPlaces,
        'orders': data.summary.orders,
        'order-breakdown': data.summary.orderBreakdown
      };
      Object.entries(values).forEach(([key, value]) => {
        document.querySelectorAll(`[data-member-value="${key}"]`).forEach((target) => { target.textContent = String(value); });
      });
      document.querySelectorAll('[data-member-source]').forEach((target) => { target.textContent = 'JSON Mock API'; });
      const profile = await loadMemberProfile();
      const traveler = profile.travelerProfiles?.find((item) => item.isPrimary) || profile.travelerProfiles?.[0] || {};
      document.querySelectorAll('[data-profile-field]').forEach((field) => {
        const path = field.dataset.profileField;
        const value = getNested({ member: profile.member || {}, traveler }, path);
        if (value === undefined || value === null) return;
        field.value = String(value);
      });
      const links = traveler.pmsGuestLinks || [];
      document.querySelectorAll('[data-pms-link-state]').forEach((target) => {
        target.textContent = links.length
          ? `${links.length}개 호텔 PMS 고객 레코드와 연결됨 · 로그인 계정은 병합되지 않습니다.`
          : '연결 없음 · 예약 전송 후 호텔별 PmsGuestLink를 별도로 생성할 수 있습니다.';
      });
    } catch (error) {
      document.querySelectorAll('[data-member-source]').forEach((target) => { target.textContent = '데이터 로드 실패'; });
    }
  };
  const accountForm = document.querySelector('[data-persist-form="account"]');
  accountForm?.addEventListener('submit', async () => {
    const session = window.HotelNGoAuth?.getSession();
    if (!session?.user.id || !accountForm.reportValidity()) return;
    const formData = new FormData(accountForm);
    const current = await loadMemberProfile();
    const rawPassport = String(formData.get('passportNumber') || '').replace(/\s/g, '');
    const maskedNumber = rawPassport
      ? `${rawPassport.slice(0, 3)}••••${rawPassport.slice(-2)}`
      : current.travelerProfiles?.[0]?.passport?.maskedNumber;
    const profile = {
      member: {
        id: session.user.id,
        realm: 'HOTELNGO_B2C',
        name: String(formData.get('name') || ''),
        email: String(formData.get('email') || ''),
        locale: String(formData.get('locale') || 'ko-KR'),
        currency: String(formData.get('currency') || 'KRW'),
        residenceCountry: String(formData.get('residenceCountry') || ''),
        nationality: String(formData.get('nationality') || '')
      },
      travelerProfiles: [{
        id: current.travelerProfiles?.[0]?.id || `traveler_${session.user.id}`,
        memberId: session.user.id,
        isPrimary: true,
        passportName: String(formData.get('passportName') || ''),
        nationality: String(formData.get('travelerNationality') || ''),
        birthDate: String(formData.get('birthDate') || ''),
        passport: {
          maskedNumber,
          issuingCountry: String(formData.get('passportIssuingCountry') || ''),
          expiresOn: String(formData.get('passportExpiresOn') || '')
        },
        pmsGuestLinks: current.travelerProfiles?.[0]?.pmsGuestLinks || []
      }]
    };
    let profiles = {};
    try { profiles = JSON.parse(localStorage.getItem('hotelngo.mock.member-profiles.v1') || '{}'); } catch { profiles = {}; }
    profiles[session.user.id] = profile;
    localStorage.setItem('hotelngo.mock.member-profiles.v1', JSON.stringify(profiles));
    const passportField = accountForm.elements.passportNumber;
    if (passportField) {
      passportField.value = '';
      passportField.placeholder = maskedNumber ? `현재 저장값 ${maskedNumber} · 변경할 때만 입력` : '변경할 때만 입력';
    }
  });
  render();
})();
