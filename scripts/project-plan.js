(() => {
  const sourceUrl = 'docs/hotelngo/27-integrated-project-plan-draft.md';
  const target = document.querySelector('[data-plan-document]');
  const toc = document.querySelector('[data-plan-toc]');
  const progress = document.querySelector('[data-reading-progress]');
  const backToTop = document.querySelector('[data-back-to-top]');

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const inline = (value) => {
    let text = escapeHtml(value);
    const codeTokens = [];
    text = text.replace(/`([^`]+)`/g, (_, code) => {
      const token = `%%INLINE_CODE_${codeTokens.length}%%`;
      codeTokens.push(`<code>${code}</code>`);
      return token;
    });
    text = text
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    codeTokens.forEach((code, index) => {
      text = text.replace(`%%INLINE_CODE_${index}%%`, code);
    });
    return text;
  };

  const isTableSeparator = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const isBlockStart = (line, nextLine = '') =>
    /^#{1,6}\s/.test(line) ||
    /^```/.test(line) ||
    /^>\s?/.test(line) ||
    /^(\s*)[-*+]\s+/.test(line) ||
    /^(\s*)\d+\.\s+/.test(line) ||
    /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
    (line.includes('|') && isTableSeparator(nextLine));

  const splitTableRow = (line) => line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

  const renderMarkdown = (markdown) => {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const output = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      const nextLine = lines[index + 1] || '';

      if (!line.trim()) {
        index += 1;
        continue;
      }

      if (/^```/.test(line)) {
        const language = line.slice(3).trim();
        const codeLines = [];
        index += 1;
        while (index < lines.length && !/^```/.test(lines[index])) {
          codeLines.push(lines[index]);
          index += 1;
        }
        index += 1;
        output.push(`<pre${language ? ` data-language="${escapeHtml(language)}"` : ''}><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        output.push(`<h${level}>${inline(heading[2])}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        output.push('<hr>');
        index += 1;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quoteLines = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) {
          quoteLines.push(lines[index].replace(/^>\s?/, ''));
          index += 1;
        }
        output.push(`<blockquote><p>${inline(quoteLines.join(' '))}</p></blockquote>`);
        continue;
      }

      if (line.includes('|') && isTableSeparator(nextLine)) {
        const headers = splitTableRow(line);
        const rows = [];
        index += 2;
        while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
          rows.push(splitTableRow(lines[index]));
          index += 1;
        }
        output.push(
          `<div class="table-frame"><table><thead><tr>${headers.map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr></thead>` +
          `<tbody>${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${inline(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
        );
        continue;
      }

      const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
      const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        const tag = unordered ? 'ul' : 'ol';
        const matcher = unordered ? /^\s*[-*+]\s+(.+)$/ : /^\s*\d+\.\s+(.+)$/;
        const items = [];
        while (index < lines.length) {
          const match = lines[index].match(matcher);
          if (!match) break;
          items.push(match[1]);
          index += 1;
        }
        output.push(`<${tag}>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</${tag}>`);
        continue;
      }

      const paragraph = [line.trim()];
      index += 1;
      while (
        index < lines.length &&
        lines[index].trim() &&
        !isBlockStart(lines[index], lines[index + 1] || '')
      ) {
        paragraph.push(lines[index].trim());
        index += 1;
      }
      output.push(`<p>${inline(paragraph.join(' '))}</p>`);
    }

    return output.join('');
  };

  const slugify = (text, index) => {
    const base = text
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-');
    return base || `section-${index + 1}`;
  };

  const structureDocument = () => {
    const title = target.querySelector('h1');
    if (title) title.remove();

    const nodes = [...target.childNodes];
    const fragment = document.createDocumentFragment();
    let container = document.createElement('section');
    container.className = 'document-intro';
    fragment.append(container);

    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H1') {
        container = document.createElement('section');
        container.className = 'plan-section';
        fragment.append(container);
      }
      container.append(node);
    });

    target.replaceChildren(fragment);
  };

  const buildToc = () => {
    const headings = [...target.querySelectorAll('.plan-section > h1')];
    const usedIds = new Set();
    toc.innerHTML = headings.map((heading, index) => {
      let id = slugify(heading.textContent, index);
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${id}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(id);
      heading.id = id;
      const number = heading.textContent.match(/^(\d+)/)?.[1] || String(index + 1);
      return `<a href="#${id}"><span>${String(number).padStart(2, '0')}</span><b>${escapeHtml(heading.textContent.replace(/^\d+\.\s*/, ''))}</b></a>`;
    }).join('');
  };

  const setupScrollState = () => {
    const tocLinks = [...toc.querySelectorAll('a')];
    const headings = [...target.querySelectorAll('.plan-section > h1')];

    const update = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = documentHeight > 0 ? Math.min(1, window.scrollY / documentHeight) : 0;
      progress.style.width = `${ratio * 100}%`;
      backToTop.classList.toggle('is-visible', window.scrollY > 700);

      let activeIndex = 0;
      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= 150) activeIndex = index;
      });
      tocLinks.forEach((link, index) => link.classList.toggle('is-active', index === activeIndex));
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  };

  const loadPlan = async () => {
    try {
      const response = await fetch(sourceUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const markdown = await response.text();
      target.innerHTML = renderMarkdown(markdown);
      structureDocument();
      buildToc();
      setupScrollState();
      document.body.classList.add('is-plan-ready');
      if (window.location.hash) {
        const requestedNumber = window.location.hash.match(/^#(\d+)-/)?.[1];
        const requestedHeading = [...target.querySelectorAll('.plan-section > h1')]
          .find((heading) => heading.textContent.startsWith(`${requestedNumber}.`));
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            requestedHeading?.scrollIntoView({ block: 'start' });
          });
        });
      }
    } catch (error) {
      target.innerHTML = `
        <div class="plan-error">
          <strong>계획서를 불러오지 못했습니다</strong>
          <p>정적 서버에서 project-plan.html을 열어주세요. (${escapeHtml(error.message)})</p>
        </div>`;
    }
  };

  document.querySelector('[data-print-plan]')?.addEventListener('click', () => window.print());
  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  loadPlan();
})();
