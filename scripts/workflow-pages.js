(() => {
  const root = document.querySelector('[data-workflow-root]');
  if (!root) return;

  const route = location.pathname.split('/').pop() || document.body.dataset.workflowRoute || '';
  const storageKey = `hotelngo.workflow.${route}.v1`;
  const state = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  })();
  let toastTimer;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const readEmbeddedConfig = () => {
    const source = document.querySelector('[data-workflow-config]');
    if (!source) return null;
    try { return JSON.parse(source.textContent); } catch { return null; }
  };

  const loadConfig = async () => {
    const embedded = readEmbeddedConfig();
    try {
      const response = await fetch(new URL('data/mock/workflow-pages.json', document.baseURI));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      return payload.pages?.[route] || embedded;
    } catch {
      return embedded;
    }
  };

  const showToast = (message) => {
    let toast = document.querySelector('[data-workflow-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'workflow-toast';
      toast.dataset.workflowToast = '';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.append(toast);
    }
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  };

  const saveState = (patch) => {
    Object.assign(state, patch, { updatedAt: new Date().toISOString() });
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const realmLabel = (realm) => ({
    HOTELNGO_B2C: '회원 서비스',
    B2C_PUBLIC: '여행 서비스',
    'B2C/BOOKING': '예약·결제',
    HOTELNGO_PARTNER: '파트너센터',
    HOTELNGO_ADMIN: '플랫폼 관리자',
    HOTELNGO_CHANNEL: 'PMS 채널'
  }[realm] || 'HotelnGo');

  const statusTone = (status = '') => {
    if (/완료|정상|승인|확정|발행|사용 가능|연결/.test(status)) return 'success';
    if (/실패|반려|오류|만료|차단|취소/.test(status)) return 'danger';
    if (/대기|검토|진행|주의|임시|확인/.test(status)) return 'warn';
    return '';
  };

  const badge = (status) => `<span class="workflow-badge ${statusTone(status)}">${escapeHtml(status)}</span>`;

  const fieldHtml = (field) => {
    const value = state.form?.[field.name] ?? field.value ?? '';
    const required = field.required ? ' required' : '';
    const full = field.full || field.type === 'textarea' || field.type === 'file' || field.type === 'checkbox' ? ' full' : '';
    if (field.type === 'checkbox') {
      return `<label class="workflow-field${full}"><span>${escapeHtml(field.label)}</span><span class="workflow-check"><input type="checkbox" name="${escapeHtml(field.name)}" value="yes"${value === 'yes' || value === true ? ' checked' : ''}${required}><span>${escapeHtml(field.help || '내용을 확인했으며 동의합니다.')}</span></span></label>`;
    }
    if (field.type === 'select') {
      return `<label class="workflow-field${full}"><span>${escapeHtml(field.label)}</span><select class="workflow-select" name="${escapeHtml(field.name)}"${required}>${(field.options || []).map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        return `<option value="${escapeHtml(optionValue)}"${String(value) === String(optionValue) ? ' selected' : ''}>${escapeHtml(label)}</option>`;
      }).join('')}</select>${field.help ? `<small>${escapeHtml(field.help)}</small>` : ''}</label>`;
    }
    if (field.type === 'textarea') {
      return `<label class="workflow-field${full}"><span>${escapeHtml(field.label)}</span><textarea class="workflow-textarea" name="${escapeHtml(field.name)}" placeholder="${escapeHtml(field.placeholder || '')}"${required}>${escapeHtml(value)}</textarea>${field.help ? `<small>${escapeHtml(field.help)}</small>` : ''}</label>`;
    }
    if (field.type === 'file') {
      return `<label class="workflow-field${full}"><span>${escapeHtml(field.label)}</span><input class="workflow-input" type="file" name="${escapeHtml(field.name)}"${field.accept ? ` accept="${escapeHtml(field.accept)}"` : ''}${required}><small>${escapeHtml(field.help || '선택한 파일명만 Mock 상태에 기록하며 서버로 전송하지 않습니다.')}</small></label>`;
    }
    return `<label class="workflow-field${full}"><span>${escapeHtml(field.label)}</span><input class="workflow-input" type="${escapeHtml(field.type || 'text')}" name="${escapeHtml(field.name)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || '')}"${required}>${field.help ? `<small>${escapeHtml(field.help)}</small>` : ''}</label>`;
  };

  const actionsHtml = (config, position = 'head') => {
    const actions = (config.actions || []).filter((action) => (action.position || 'head') === position);
    return actions.map((action) => {
      const className = `workflow-button ${action.tone || ''}`.trim();
      if (action.href) return `<a class="${className}" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`;
      return `<button class="${className}" type="${action.submit ? 'submit' : 'button'}" data-workflow-action="${escapeHtml(action.action || action.label)}"${action.confirm ? ` data-confirm="${escapeHtml(action.confirm)}"` : ''}>${escapeHtml(action.label)}</button>`;
    }).join('');
  };

  const breadcrumbHtml = (config) => {
    const home = config.realm === 'HOTELNGO_PARTNER'
      ? ['partner-dashboard.html', '파트너센터']
      : config.realm === 'HOTELNGO_ADMIN'
        ? ['admin-dashboard.html', '플랫폼 관리자']
        : config.realm === 'HOTELNGO_CHANNEL'
          ? ['channel-dashboard.html', 'PMS 채널']
          : ['index.html', '홈'];
    return `<nav class="workflow-breadcrumb" aria-label="현재 위치"><a href="${home[0]}">${home[1]}</a><span>›</span>${config.parent ? `<a href="${escapeHtml(config.parent)}">${escapeHtml(config.group)}</a><span>›</span>` : ''}<strong>${escapeHtml(config.title)}</strong></nav>`;
  };

  const headHtml = (config) => `
    ${breadcrumbHtml(config)}
    <header class="workflow-head">
      <div class="workflow-head-copy">
        <span class="workflow-eyebrow">${escapeHtml(realmLabel(config.realm))} · ${escapeHtml(config.group)}</span>
        <h1>${escapeHtml(config.title)}</h1>
        <p>${escapeHtml(config.description || config.purpose)}</p>
      </div>
      <div class="workflow-head-actions">${actionsHtml(config, 'head')}</div>
    </header>
    <div class="workflow-status-strip">
      <p><strong>JSON Mock</strong> · 입력과 상태 변경은 이 브라우저에 저장되며, 실제 결제·PMS·외부 시스템에는 쓰지 않습니다.</p>
      ${badge(state.status || config.status || 'Mock 동작')}
    </div>`;

  const summaryHtml = (config) => {
    const summaries = config.summary || [
      ['현재 상태', state.status || config.status || '정상'],
      ['데이터 기준', 'JSON Fixture'],
      ['최근 변경', state.updatedAt ? new Date(state.updatedAt).toLocaleString('ko-KR') : '오늘 10:20'],
      ['다음 단계', config.nextLabel || '검토 후 저장']
    ];
    return `<section class="workflow-summary-grid">${summaries.map(([label, value, note]) => `<article class="workflow-summary"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong>${note ? `<span>${escapeHtml(note)}</span>` : ''}</article>`).join('')}</section>`;
  };

  const tabsHtml = (config) => {
    if (!config.tabs?.length) return '';
    return `<div class="workflow-tabs" role="tablist">${config.tabs.map((tab, index) => `<button class="workflow-tab${index === 0 ? ' is-active' : ''}" type="button" role="tab" aria-selected="${index === 0}" data-workflow-tab="${escapeHtml(tab)}">${escapeHtml(tab)}</button>`).join('')}</div>`;
  };

  const listRowsHtml = (config) => (config.items || []).map((item, index) => {
    const columns = item.columns || [
      [item.title || `${config.title} ${index + 1}`, item.subtitle || item.id || `HNG-${String(index + 1).padStart(4, '0')}`],
      item.owner || item.category || config.group,
      item.updated || item.date || '오늘',
      badge(state.rows?.[item.id]?.status || item.status || '정상')
    ];
    return `<tr data-workflow-row data-search-text="${escapeHtml(columns.map((cell) => Array.isArray(cell) ? cell.join(' ') : String(cell).replace(/<[^>]+>/g, '')).join(' ').toLowerCase())}">
      <td><input type="checkbox" aria-label="${escapeHtml(item.title || `항목 ${index + 1}`)} 선택" data-row-select></td>
      ${columns.map((cell, cellIndex) => `<td>${Array.isArray(cell) ? `<strong>${escapeHtml(cell[0])}</strong><small>${escapeHtml(cell[1] || '')}</small>` : cellIndex === columns.length - 1 ? cell : escapeHtml(cell)}</td>`).join('')}
      <td>${item.href ? `<a class="workflow-button" href="${escapeHtml(item.href)}">상세</a>` : `<button class="workflow-button" type="button" data-row-detail="${index}">상세</button>`}</td>
    </tr>`;
  }).join('');

  const renderList = (config) => `${headHtml(config)}${summaryHtml(config)}${tabsHtml(config)}
    <section class="workflow-card">
      <div class="workflow-card-head"><div><h2>${escapeHtml(config.listTitle || config.title)}</h2><p>${escapeHtml(config.listDescription || '검색·상태 필터와 일괄 작업을 사용할 수 있습니다.')}</p></div><div class="workflow-inline-actions">${actionsHtml(config, 'card')}</div></div>
      <div class="workflow-card-body">
        <div class="workflow-filter">
          <input class="workflow-input" type="search" placeholder="이름, 번호, 상태 검색" aria-label="${escapeHtml(config.title)} 검색" data-workflow-search>
          <select class="workflow-select" aria-label="상태 필터" data-workflow-status-filter><option value="">전체 상태</option><option>정상</option><option>대기</option><option>검토 중</option><option>완료</option><option>실패</option></select>
          <button class="workflow-button" type="button" data-workflow-bulk>선택 항목 처리</button>
        </div>
      </div>
      <div class="workflow-table-wrap"><table class="workflow-table"><thead><tr><th><input type="checkbox" aria-label="전체 선택" data-select-all></th>${(config.columns || ['항목','구분','최근 변경','상태']).map((column) => `<th>${escapeHtml(column)}</th>`).join('')}<th>작업</th></tr></thead><tbody data-workflow-tbody>${listRowsHtml(config)}</tbody></table></div>
      <div class="workflow-empty" data-workflow-empty hidden>조건에 맞는 항목이 없습니다. 검색어 또는 상태 필터를 바꿔보세요.</div>
    </section>`;

  const renderForm = (config, editor = false) => `${headHtml(config)}${tabsHtml(config)}
    <div class="workflow-grid">
      <section class="workflow-card">
        <div class="workflow-card-head"><div><h2>${escapeHtml(config.formTitle || '필수 정보를 입력해 주세요')}</h2><p>필수 항목을 확인한 뒤 임시 저장하거나 다음 단계로 진행할 수 있습니다.</p></div>${badge(state.status || '작성 중')}</div>
        <div class="workflow-card-body">
          <form class="workflow-form" data-workflow-form>
            <fieldset class="workflow-form-section"><legend>${escapeHtml(config.sectionTitle || config.group)}</legend><div class="workflow-fields">${(config.fields || []).map(fieldHtml).join('')}</div></fieldset>
            ${editor ? `<fieldset class="workflow-form-section"><legend>발행 설정</legend><div class="workflow-fields"><label class="workflow-field"><span>공개 범위</span><select class="workflow-select" name="visibility"><option>나만 보기</option><option>링크 공유</option><option>전체 공개</option></select></label><label class="workflow-field"><span>발행 시점</span><input class="workflow-input" type="datetime-local" name="publishAt"></label></div></fieldset>` : ''}
            <div class="workflow-actions"><button class="workflow-button" type="button" data-workflow-save-draft>임시 저장</button>${actionsHtml(config, 'form') || '<button class="workflow-button primary" type="submit">저장하고 계속</button>'}</div>
          </form>
        </div>
      </section>
      <aside class="workflow-stack">
        <section class="workflow-card"><div class="workflow-card-head"><h3>진행 상태</h3></div><div class="workflow-card-body"><ol class="workflow-timeline">${(config.steps || ['정보 입력','내용 확인','저장 완료']).map((step, index) => `<li><strong>${escapeHtml(step)}</strong><span>${index === 0 ? '현재 단계' : '저장 후 진행'}</span></li>`).join('')}</ol></div></section>
        <section class="workflow-card"><div class="workflow-card-head"><h3>입력 안내</h3></div><div class="workflow-card-body"><div class="workflow-list"><div class="workflow-list-item"><div><strong>독립 데이터</strong><span>다른 솔루션 회원·직원 정보와 합치지 않습니다.</span></div></div><div class="workflow-list-item"><div><strong>저장 위치</strong><span>브라우저 Local Storage의 Mock 레코드입니다.</span></div></div></div></div></section>
      </aside>
    </div>`;

  const detailPairsHtml = (config) => (config.details || []).map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(state.details?.[label] || value)}</dd></div>`).join('');

  const renderDetail = (config) => `${headHtml(config)}${summaryHtml(config)}${tabsHtml(config)}
    <div class="workflow-grid">
      <div class="workflow-stack">
        <section class="workflow-card"><div class="workflow-card-head"><div><h2>${escapeHtml(config.detailTitle || '기본 정보')}</h2><p>${escapeHtml(config.purpose)}</p></div>${badge(state.status || config.status || '확인 완료')}</div><div class="workflow-card-body"><dl class="workflow-dl">${detailPairsHtml(config)}</dl></div></section>
        <section class="workflow-card"><div class="workflow-card-head"><h2>처리 메모</h2></div><div class="workflow-card-body"><form class="workflow-form" data-workflow-note-form><label class="workflow-field full"><span>내부 메모</span><textarea class="workflow-textarea" name="note" placeholder="판단 근거와 후속 작업을 기록하세요.">${escapeHtml(state.note || '')}</textarea></label><div class="workflow-actions"><button class="workflow-button primary" type="submit">메모 저장</button>${actionsHtml(config, 'detail')}</div></form></div></section>
      </div>
      <aside class="workflow-card"><div class="workflow-card-head"><h3>상태 이력</h3></div><div class="workflow-card-body"><ol class="workflow-timeline" data-workflow-timeline>${(state.timeline || config.timeline || []).map((item) => `<li><strong>${escapeHtml(item.title || item[0])}</strong><span>${escapeHtml(item.date || item[1] || '오늘')}</span></li>`).join('')}</ol></div></aside>
    </div>`;

  const renderState = (config) => {
    const tone = config.tone || statusTone(config.status);
    return `<section class="workflow-card workflow-state">
      <div class="workflow-state-icon ${tone}">${escapeHtml(config.icon || (tone === 'success' ? '✓' : tone === 'danger' ? '!' : '…'))}</div>
      <span class="workflow-eyebrow">${escapeHtml(realmLabel(config.realm))} · ${escapeHtml(config.group)}</span>
      <h1>${escapeHtml(config.title)}</h1>
      <p>${escapeHtml(config.description || config.purpose)}</p>
      <div class="workflow-state-details">${(config.details || []).slice(0, 4).map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>
      <div class="workflow-actions">${actionsHtml(config, 'head')}${actionsHtml(config, 'state')}</div>
    </section>`;
  };

  const renderMap = (config) => `${headHtml(config)}
    <div class="workflow-grid">
      <section class="workflow-map" aria-label="여행 장소 지도">${(config.items || []).map((item, index) => `<a class="workflow-map-pin" style="--pin-x:${item.x || 18 + index * 19}%;--pin-y:${item.y || 30 + (index % 3) * 19}%" href="${escapeHtml(item.href || 'place-detail.html')}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.subtitle || '상세 보기')}</span></a>`).join('')}</section>
      <aside class="workflow-card"><div class="workflow-card-head"><div><h2>지도에 표시된 장소</h2><p>목록 선택 시 해당 상세 화면으로 이동합니다.</p></div></div><div class="workflow-card-body"><div class="workflow-list">${(config.items || []).map((item) => `<a class="workflow-list-item" href="${escapeHtml(item.href || 'place-detail.html')}"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.subtitle || '')}</span><small>${escapeHtml(item.meta || '최근 확인')}</small></div><span aria-hidden="true">›</span></a>`).join('')}</div></div></aside>
    </div>`;

  const renderSupport = (config) => `${headHtml(config)}${summaryHtml(config)}
    <div class="workflow-grid">
      <section class="workflow-card"><div class="workflow-card-head"><div><h2>도움이 필요한 항목을 선택하세요</h2><p>예약·결제·회원·파트너 이용 절차를 단계별로 안내합니다.</p></div></div><div class="workflow-card-body"><div class="workflow-list">${(config.items || []).map((item) => `<a class="workflow-list-item" href="${escapeHtml(item.href)}"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.subtitle)}</span></div><span aria-hidden="true">›</span></a>`).join('')}</div></div></section>
      <aside class="workflow-card"><div class="workflow-card-head"><h3>빠른 문의</h3></div><div class="workflow-card-body"><p>FAQ로 해결되지 않았다면 로그인 후 문의를 남겨 주세요.</p><div class="workflow-actions"><a class="workflow-button primary" href="inquiry-create.html">1:1 문의 작성</a><a class="workflow-button" href="bookings.html">예약 조회</a></div></div></aside>
    </div>`;

  const render = (config) => {
    root.classList.add('workflow-page');
    const renderer = {
      list: renderList,
      form: renderForm,
      editor: (item) => renderForm(item, true),
      detail: renderDetail,
      state: renderState,
      map: renderMap,
      support: renderSupport
    }[config.kind] || renderDetail;
    root.innerHTML = renderer(config);
    document.title = `${config.title} · HotelnGo`;
    bind(config);
  };

  const openConfirm = (message, onConfirm) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'workflow-dialog';
    dialog.innerHTML = `<header><div><small>HOTELNGO CONFIRM</small><strong>작업을 진행할까요?</strong></div><button type="button" aria-label="닫기">×</button></header><div class="workflow-dialog-body">${escapeHtml(message)}</div><footer><button class="workflow-button" type="button" data-dialog-cancel>취소</button><button class="workflow-button primary" type="button" data-dialog-confirm>확인</button></footer>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('header button').addEventListener('click', close);
    dialog.querySelector('[data-dialog-cancel]').addEventListener('click', close);
    dialog.querySelector('[data-dialog-confirm]').addEventListener('click', () => { onConfirm(); close(); });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  };

  const performAction = (config, action, button) => {
    const nextStatus = button.dataset.nextStatus || ({
      승인: '승인 완료',
      반려: '반려',
      재시도: '재처리 대기',
      발행: '발행 완료',
      인증: '인증 완료',
      제출: '검토 대기',
      저장: '저장 완료',
      초대: '초대 발송'
    }[Object.keys({ 승인:1, 반려:1, 재시도:1, 발행:1, 인증:1, 제출:1, 저장:1, 초대:1 }).find((key) => action.includes(key))] || '처리 완료');
    saveState({ status: nextStatus, lastAction: action });
    button.textContent = nextStatus;
    button.classList.add('primary');
    showToast(`${action} 작업을 Mock 상태에 반영했습니다.`);
    const destination = button.dataset.href || config.actionRedirects?.[action];
    if (destination) setTimeout(() => { location.href = destination; }, 450);
  };

  const bind = (config) => {
    document.querySelectorAll('[data-workflow-tab]').forEach((tab) => tab.addEventListener('click', () => {
      document.querySelectorAll('[data-workflow-tab]').forEach((item) => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      showToast(`${tab.textContent.trim()} 기준으로 화면을 전환했습니다.`);
    }));

    const search = document.querySelector('[data-workflow-search]');
    const statusFilter = document.querySelector('[data-workflow-status-filter]');
    const filterRows = () => {
      const query = search?.value.trim().toLowerCase() || '';
      const status = statusFilter?.value.trim().toLowerCase() || '';
      let visible = 0;
      document.querySelectorAll('[data-workflow-row]').forEach((row) => {
        const text = row.dataset.searchText || row.textContent.toLowerCase();
        const show = (!query || text.includes(query)) && (!status || text.includes(status));
        row.hidden = !show;
        if (show) visible += 1;
      });
      const empty = document.querySelector('[data-workflow-empty]');
      if (empty) empty.hidden = visible > 0;
    };
    search?.addEventListener('input', filterRows);
    statusFilter?.addEventListener('change', filterRows);

    document.querySelector('[data-select-all]')?.addEventListener('change', (event) => {
      document.querySelectorAll('[data-row-select]').forEach((checkbox) => { if (!checkbox.closest('tr').hidden) checkbox.checked = event.target.checked; });
    });
    document.querySelector('[data-workflow-bulk]')?.addEventListener('click', () => {
      const selected = [...document.querySelectorAll('[data-row-select]:checked')];
      if (!selected.length) return showToast('먼저 처리할 항목을 선택해 주세요.');
      openConfirm(`${selected.length}개 항목을 일괄 처리 상태로 변경합니다.`, () => {
        selected.forEach((checkbox) => checkbox.closest('tr').querySelector('.workflow-badge')?.classList.add('success'));
        saveState({ bulkProcessed: selected.length });
        showToast(`${selected.length}개 항목을 처리했습니다.`);
      });
    });
    document.querySelectorAll('[data-row-detail]').forEach((button) => button.addEventListener('click', () => {
      const item = config.items?.[Number(button.dataset.rowDetail)];
      openConfirm(`${item?.title || '선택한 항목'}의 상세 데이터를 읽기 전용으로 확인합니다.`, () => showToast('상세 레코드를 확인했습니다.'));
    }));

    const form = document.querySelector('[data-workflow-form]');
    const persistForm = (status) => {
      if (!form?.reportValidity()) return false;
      const values = Object.fromEntries(new FormData(form).entries());
      form.querySelectorAll('input[type="file"]').forEach((input) => {
        if (input.files?.[0]) values[input.name] = input.files[0].name;
      });
      saveState({ form: values, status });
      showToast(status === '임시 저장' ? '작성 내용을 이 브라우저에 임시 저장했습니다.' : '입력 내용을 저장했습니다.');
      return true;
    };
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!persistForm(config.submitStatus || '저장 완료')) return;
      if (config.successUrl) setTimeout(() => { location.href = config.successUrl; }, 450);
    });
    document.querySelector('[data-workflow-save-draft]')?.addEventListener('click', () => persistForm('임시 저장'));

    document.querySelector('[data-workflow-note-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const note = new FormData(event.currentTarget).get('note');
      saveState({ note, status: state.status || config.status || '확인 완료' });
      showToast('내부 메모를 저장했습니다.');
    });

    document.querySelectorAll('[data-workflow-action]').forEach((button) => button.addEventListener('click', () => {
      if (button.type === 'submit') return;
      const action = button.dataset.workflowAction;
      const run = () => performAction(config, action, button);
      if (button.dataset.confirm) openConfirm(button.dataset.confirm, run); else run();
    }));
  };

  loadConfig().then((config) => {
    if (!config) {
      root.innerHTML = '<section class="workflow-card workflow-empty"><h1>화면 구성을 불러오지 못했습니다.</h1><p>JSON Mock 파일과 페이지 식별자를 확인해 주세요.</p></section>';
      return;
    }
    render(config);
  });
})();
