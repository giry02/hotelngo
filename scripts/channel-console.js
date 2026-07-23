(() => {
  if (!document.querySelector('script[data-hotelngo-ui]')) {
    const uiScript = document.createElement('script');
    uiScript.src = 'scripts/ui-components.js?v=1';
    uiScript.dataset.hotelngoUi = '';
    document.head.append(uiScript);
  }

  const statusLabel = (status) => ({ PASS: '정상', HEALTHY: '정상', MAPPED: '매핑됨', SOLD_OUT: '매진', UNSUPPORTED: '미지원' }[status] || status);
  const chipClass = (status) => ['PASS', 'HEALTHY', 'MAPPED'].includes(status) ? '' : status === 'UNSUPPORTED' ? 'danger' : 'warn';
  const render = async () => {
    const data = await window.HotelNGoMockAPI.get('supply/internal-pms.json');
    document.querySelectorAll('[data-channel-mode]').forEach((target) => { target.textContent = data.connection.mode; });
    document.querySelectorAll('[data-channel-trust]').forEach((target) => { target.textContent = data.connection.trust; });
    document.querySelectorAll('[data-channel-checked]').forEach((target) => { target.textContent = new Date(data.connection.lastCheckedAt).toLocaleString('ko-KR'); });
    const mappingBody = document.querySelector('[data-channel-mappings]');
    if (mappingBody) mappingBody.innerHTML = data.roomTypeMappings.map((item) => `<tr><td><strong>${item.name}</strong><small>${item.pmsRoomTypeId}</small></td><td>${item.productId}</td><td>${item.available}실</td><td>${item.rate.toLocaleString('ko-KR')} ${item.currency}</td><td><span class="bo-status ${chipClass(item.status)}">${statusLabel(item.status)}</span></td></tr>`).join('');
    const checks = document.querySelector('[data-channel-checks]');
    if (checks) checks.innerHTML = data.checks.map((item) => `<div class="bo-list-row"><div><strong>${item.label}</strong><small>${new Date(item.checkedAt).toLocaleTimeString('ko-KR')}</small></div><span class="bo-status ${chipClass(item.status)}">${statusLabel(item.status)}</span></div>`).join('');
  };
  render().catch((error) => {
    document.querySelectorAll('[data-channel-error]').forEach((target) => { target.hidden = false; target.textContent = `Fixture 로드 실패: ${error.message}`; });
  });
})();
