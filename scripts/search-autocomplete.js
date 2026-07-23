(() => {
  const init = async () => {
    const inputs = [...document.querySelectorAll('[data-search-form] input[name="destination"], input[data-unified-search]')];
    if (!inputs.length) return;

    const fallback = {
      destinations: [
        { id: 'dst_danang', type: 'DESTINATION', name: '다낭', country: '베트남', keywords: ['danang','미케비치'], href: 'hotels.html?destination=다낭' },
        { id: 'dst_kyoto', type: 'DESTINATION', name: '교토', country: '일본', keywords: ['kyoto','기온'], href: 'hotels.html?destination=교토' },
        { id: 'dst_bangkok', type: 'DESTINATION', name: '방콕', country: '태국', keywords: ['bangkok','짜오프라야'], href: 'hotels.html?destination=방콕' }
      ],
      hotels: [
        { id: 'htl_danang_ocean', type: 'HOTEL', name: '다낭 오션 리조트', location: '다낭 · 미케비치', rating: 4.8, keywords: ['ocean resort','오션리조트','다낭'], href: 'hotel-detail.html?hotelId=htl_danang_ocean' },
        { id: 'htl_kyoto_gion', type: 'HOTEL', name: '교토 기온 호텔', location: '교토 · 기온', rating: 4.7, keywords: ['kyoto gion','교토','기온'], href: 'hotel-detail.html?hotelId=htl_kyoto_gion' }
      ],
      stayHistory: [
        { userId: 'usr_demo_jiho', hotelId: 'htl_kyoto_gion', hotelName: '교토 기온 호텔', location: '교토 · 기온', stayedAt: '2026.03.12–03.14', bookingId: 'HNG-B-2026-00912', href: 'hotel-detail.html?hotelId=htl_kyoto_gion&from=stay-history' }
      ]
    };
    let catalog = fallback;
    try {
      const response = await fetch(new URL('data/mock/search-catalog.json', document.baseURI));
      if (response.ok) catalog = await response.json();
    } catch {}

    const session = (() => {
      try { return JSON.parse(sessionStorage.getItem('hotelngo.mock.session.v1') || 'null'); } catch { return null; }
    })();
    const memberHistory = session ? (catalog.stayHistory || []).filter((item) => item.userId === session.user.id) : [];
    const normalize = (value) => String(value || '').toLocaleLowerCase('ko-KR').replace(/\s+/g, '');
    const matches = (item, query) => {
      if (!query) return true;
      const haystack = normalize([item.name, item.hotelName, item.country, item.location, ...(item.keywords || [])].join(' '));
      return haystack.includes(normalize(query));
    };
    const icon = (type) => type === 'HISTORY' ? '↺' : type === 'HOTEL' ? '▣' : '⌖';
    const label = (type) => type === 'HISTORY' ? '내가 묵었던 숙소' : type === 'HOTEL' ? '호텔' : '여행지';

    inputs.forEach((input, inputIndex) => {
      if (input.dataset.autocompleteReady) return;
      input.dataset.autocompleteReady = 'true';
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-expanded', 'false');
      const host = input.closest('label') || input.parentElement;
      host.classList.add('unified-search-host');
      const panel = document.createElement('div');
      panel.className = 'unified-search-panel';
      panel.id = `unified-search-panel-${inputIndex}`;
      panel.setAttribute('role', 'listbox');
      panel.hidden = true;
      host.append(panel);
      input.setAttribute('aria-controls', panel.id);
      let activeIndex = -1;
      let options = [];

      const close = () => {
        panel.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        activeIndex = -1;
      };
      const select = (item) => {
        input.value = item.name || item.hotelName;
        input.dataset.searchKind = item.type;
        input.dataset.searchId = item.id || item.hotelId;
        input.dataset.searchHref = item.href || '';
        input.dispatchEvent(new Event('change', { bubbles: true }));
        close();
      };
      const paintActive = () => {
        options.forEach((option, index) => {
          option.classList.toggle('is-active', index === activeIndex);
          option.setAttribute('aria-selected', String(index === activeIndex));
        });
        if (options[activeIndex]) {
          input.setAttribute('aria-activedescendant', options[activeIndex].id);
          options[activeIndex].scrollIntoView({ block: 'nearest' });
        }
      };
      const render = () => {
        const query = input.value.trim();
        const history = memberHistory.filter((item) => matches({ ...item, name: item.hotelName }, query)).slice(0, query ? 2 : 3).map((item) => ({ ...item, id: item.hotelId, name: item.hotelName, type: 'HISTORY' }));
        const destinations = (catalog.destinations || []).filter((item) => matches(item, query)).slice(0, query ? 4 : 3);
        const hotels = (catalog.hotels || []).filter((item) => matches(item, query)).slice(0, query ? 5 : 4);
        const groups = [
          history.length ? ['내 숙박내역', history] : null,
          destinations.length ? ['여행지', destinations] : null,
          hotels.length ? ['호텔명', hotels] : null
        ].filter(Boolean);
        if (!groups.length) {
          panel.innerHTML = '<div class="unified-search-empty"><strong>검색 결과가 없습니다.</strong><span>도시나 호텔 이름을 다른 단어로 입력해 보세요.</span></div>';
        } else {
          let optionIndex = 0;
          panel.innerHTML = groups.map(([groupName, items]) => `<section><h3>${groupName}</h3>${items.map((item) => {
            const id = `${panel.id}-option-${optionIndex++}`;
            const meta = item.type === 'HISTORY' ? `${item.location} · ${item.stayedAt}` : item.type === 'HOTEL' ? `${item.location} · 평점 ${item.rating}` : `${item.country} · 숙소와 여행지 보기`;
            return `<button type="button" id="${id}" role="option" aria-selected="false" data-search-option="${encodeURIComponent(JSON.stringify(item))}"><span class="unified-search-icon" aria-hidden="true">${icon(item.type)}</span><span class="unified-search-copy"><strong>${item.name || item.hotelName}</strong><small>${meta}</small></span><span class="unified-search-type">${label(item.type)}</span></button>`;
          }).join('')}</section>`).join('');
        }
        panel.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        options = [...panel.querySelectorAll('[data-search-option]')];
        options.forEach((option) => option.addEventListener('mousedown', (event) => {
          event.preventDefault();
          select(JSON.parse(decodeURIComponent(option.dataset.searchOption)));
        }));
        activeIndex = -1;
      };

      input.addEventListener('focus', render);
      input.addEventListener('input', () => {
        delete input.dataset.searchKind;
        delete input.dataset.searchId;
        delete input.dataset.searchHref;
        render();
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') return close();
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (panel.hidden) render();
          if (!options.length) return;
          activeIndex = event.key === 'ArrowDown' ? (activeIndex + 1) % options.length : (activeIndex - 1 + options.length) % options.length;
          paintActive();
        }
        if (event.key === 'Enter' && activeIndex >= 0) {
          event.preventDefault();
          options[activeIndex].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        }
      });
      input.addEventListener('blur', () => setTimeout(close, 120));
      input.form?.addEventListener('submit', (event) => {
        if (!input.dataset.searchHref) {
          const query = normalize(input.value);
          const historyMatch = memberHistory.find((item) => normalize(item.hotelName) === query);
          const hotelMatch = (catalog.hotels || []).find((item) => {
            const candidates = [item.name, ...(item.keywords || [])].map(normalize);
            return candidates.includes(query);
          });
          const match = historyMatch ? { ...historyMatch, type: 'HISTORY' } : hotelMatch;
          if (match) {
            input.dataset.searchKind = match.type;
            input.dataset.searchHref = match.href;
          }
        }
        if (!input.dataset.searchHref || !['HOTEL','HISTORY'].includes(input.dataset.searchKind)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const params = new URLSearchParams();
        ['checkIn','checkOut','guests'].forEach((name) => {
          const value = input.form.elements[name]?.value;
          if (value) params.set(name, value);
        });
        const separator = input.dataset.searchHref.includes('?') ? '&' : '?';
        location.href = `${input.dataset.searchHref}${params.toString() ? separator + params : ''}`;
      }, true);
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
