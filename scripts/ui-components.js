(() => {
  if (window.HotelnGoUI?.selectsReady) {
    window.HotelnGoUI.refreshSelects?.();
    return;
  }

  const ensureStyles = () => {
    if (document.querySelector('link[data-hotelngo-components]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/components.css?v=1';
    link.dataset.hotelngoComponents = '';
    document.head.append(link);
  };

  const closeAll = (except = null) => {
    document.querySelectorAll('.ui-select.is-open').forEach((root) => {
      if (root === except) return;
      root._closeUiSelect?.();
    });
  };

  const enhanceSelect = (select) => {
    if (!(select instanceof HTMLSelectElement) || select.multiple || select.dataset.nativeSelect !== undefined || select.dataset.uiSelectReady !== undefined) return;
    select.dataset.uiSelectReady = '';

    const root = document.createElement('div');
    root.className = 'ui-select';
    select.parentNode.insertBefore(root, select);
    root.append(select);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'ui-select__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.disabled = select.disabled;

    const menu = document.createElement('ul');
    menu.className = 'ui-select__menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    const listboxId = `ui-select-${Math.random().toString(36).slice(2, 9)}`;
    menu.id = listboxId;
    trigger.setAttribute('aria-controls', listboxId);
    if (select.getAttribute('aria-label')) trigger.setAttribute('aria-label', select.getAttribute('aria-label'));

    let focusedIndex = Math.max(0, select.selectedIndex);
    let repositionMenu = null;
    let closeOnViewportChange = null;

    const sync = () => {
      const options = [...select.options];
      const selected = options[select.selectedIndex] || options[0];
      trigger.textContent = selected?.textContent?.trim() || '선택';
      trigger.disabled = select.disabled;
      menu.replaceChildren(...options.map((option, index) => {
        const item = document.createElement('li');
        item.className = 'ui-select__option';
        item.textContent = option.textContent;
        item.dataset.index = String(index);
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(index === select.selectedIndex));
        if (option.disabled) item.setAttribute('aria-disabled', 'true');
        return item;
      }));
      focusedIndex = Math.max(0, select.selectedIndex);
    };

    const focusOption = (index) => {
      const options = [...select.options];
      if (!options.length) return;
      let next = (index + options.length) % options.length;
      let guard = options.length;
      while (options[next]?.disabled && guard > 0) {
        next = (next + 1) % options.length;
        guard -= 1;
      }
      focusedIndex = next;
      menu.querySelectorAll('.ui-select__option').forEach((item, itemIndex) => item.classList.toggle('is-focused', itemIndex === focusedIndex));
      menu.querySelector(`[data-index="${focusedIndex}"]`)?.scrollIntoView({ block: 'nearest' });
    };

    const open = () => {
      if (trigger.disabled) return;
      closeAll(root);
      root.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      document.body.append(menu);
      menu.classList.add('ui-select__menu--portal');
      menu.hidden = false;
      repositionMenu = () => {
        const triggerRect = trigger.getBoundingClientRect();
        const viewportPadding = 10;
        const menuWidth = Math.min(
          Math.max(triggerRect.width, 140),
          document.documentElement.clientWidth - viewportPadding * 2
        );
        menu.style.width = `${menuWidth}px`;
        menu.style.left = `${Math.max(
          viewportPadding,
          Math.min(triggerRect.left, document.documentElement.clientWidth - menuWidth - viewportPadding)
        )}px`;
        const availableBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
        const availableAbove = triggerRect.top - viewportPadding;
        const preferredHeight = Math.min(menu.scrollHeight || 252, 252);
        const dropUp = availableBelow < Math.min(preferredHeight, 180) && availableAbove > availableBelow;
        const available = Math.max(120, dropUp ? availableAbove - 7 : availableBelow - 7);
        menu.style.maxHeight = `${Math.min(252, available)}px`;
        const measuredHeight = Math.min(menu.scrollHeight, parseFloat(menu.style.maxHeight));
        menu.style.top = `${dropUp
          ? Math.max(viewportPadding, triggerRect.top - measuredHeight - 7)
          : triggerRect.bottom + 7}px`;
        root.classList.toggle('is-dropup', dropUp);
      };
      repositionMenu();
      closeOnViewportChange = () => close();
      window.addEventListener('resize', repositionMenu);
      document.addEventListener('scroll', closeOnViewportChange, true);
      focusOption(select.selectedIndex);
    };

    const close = (restoreFocus = false) => {
      root.classList.remove('is-open');
      root.classList.remove('is-dropup');
      trigger.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      menu.classList.remove('ui-select__menu--portal');
      menu.removeAttribute('style');
      root.append(menu);
      if (repositionMenu) window.removeEventListener('resize', repositionMenu);
      if (closeOnViewportChange) document.removeEventListener('scroll', closeOnViewportChange, true);
      repositionMenu = null;
      closeOnViewportChange = null;
      if (restoreFocus) trigger.focus();
    };
    root._closeUiSelect = close;

    const choose = (index) => {
      const option = select.options[index];
      if (!option || option.disabled) return;
      select.selectedIndex = index;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
      close(true);
    };

    trigger.addEventListener('click', () => root.classList.contains('is-open') ? close() : open());
    trigger.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        if (!root.classList.contains('is-open')) open();
        const last = select.options.length - 1;
        focusOption(event.key === 'Home' ? 0 : event.key === 'End' ? last : focusedIndex + (event.key === 'ArrowDown' ? 1 : -1));
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (root.classList.contains('is-open')) choose(focusedIndex);
        else open();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    });

    menu.addEventListener('mousemove', (event) => {
      const option = event.target.closest('.ui-select__option');
      if (option) focusOption(Number(option.dataset.index));
    });
    menu.addEventListener('click', (event) => {
      const option = event.target.closest('.ui-select__option');
      if (option) choose(Number(option.dataset.index));
    });
    select.addEventListener('change', sync);

    root.append(trigger, menu);
    sync();
  };

  const refreshSelects = (scope = document) => scope.querySelectorAll('select').forEach(enhanceSelect);

  ensureStyles();
  refreshSelects();
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.ui-select')) closeAll();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      if (node.matches('select')) enhanceSelect(node);
      refreshSelects(node);
    }));
  }).observe(document.body, { childList: true, subtree: true });

  window.HotelnGoUI = {
    ...(window.HotelnGoUI || {}),
    selectsReady: true,
    refreshSelects,
    closeSelects: closeAll
  };
})();
