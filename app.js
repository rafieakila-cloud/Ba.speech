// ============================================================
//  Hubbase — Bicom Browser
//  Full-featured web browser with Wikipedia integration
// ============================================================

const PROXY_SERVICES = [
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

const WIKI_TOPICS = [
    'Indonesia','Teknologi','Sains','Sejarah','Matematika','Fisika','Kimia',
    'Biologi','Geografi','Astronomi','Seni','Musik','Film','Olahraga',
    'Ekonomi','Psikologi','Kedokteran','Lingkungan','Philosophy','Internet'
];

class BicomBrowser {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.tabCounter = 0;
        this.bookmarks = this.loadBookmarks();
        this.history = [];
        this.historyIndex = -1;
        this.galleryImages = [];
        this.galleryIndex = 0;
        this.sidebarOpen = false;

        this.init();
    }

    // ---- INIT ----
    init() {
        this.newTab();
        this.bindGlobalEvents();
        this.renderBookmarksBar();
        this.setStatus('Siap — Bicom Browser siap digunakan');
    }

    // ---- TAB MANAGEMENT ----
    newTab(url = null) {
        const id = ++this.tabCounter;
        const tab = {
            id,
            title: 'Tab Baru',
            url: '',
            page: 'home',
            icon: '🌐',
            history: [],
            historyIndex: -1
        };
        this.tabs.push(tab);
        this.createTabPage(id);
        this.switchTab(id);
        if (url) this.navigate(url);
    }

    createTabPage(id) {
        const area = document.getElementById('content-area');
        const div = document.createElement('div');
        div.className = 'tab-page';
        div.id = `tab-page-${id}`;
        area.appendChild(div);
    }

    switchTab(id) {
        this.activeTabId = id;
        document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById(`tab-page-${id}`);
        if (page) page.classList.add('active');

        const tab = this.getTab(id);
        document.getElementById('url-input').value = tab.url || '';
        document.getElementById('lock-icon').textContent = tab.url ? (tab.url.startsWith('https') ? '🔒' : '🌐') : '🔍';
        this.renderTabs();
        this.setStatus(tab.url ? tab.url : 'Halaman baru');
    }

    closeTab(id, e) {
        if (e) e.stopPropagation();
        if (this.tabs.length <= 1) return;
        const idx = this.tabs.findIndex(t => t.id === id);
        const page = document.getElementById(`tab-page-${id}`);
        if (page) page.remove();
        this.tabs.splice(idx, 1);
        if (this.activeTabId === id) {
            const newIdx = Math.min(idx, this.tabs.length - 1);
            this.switchTab(this.tabs[newIdx].id);
        }
    }

    getTab(id) {
        return this.tabs.find(t => t.id === id);
    }

    activeTab() {
        return this.getTab(this.activeTabId);
    }

    renderTabs() {
        const c = document.getElementById('tabs-container');
        c.innerHTML = this.tabs.map(t => `
            <div class="tab ${t.id === this.activeTabId ? 'active' : ''}" onclick="browser.switchTab(${t.id})">
                <span class="tab-icon">${t.icon}</span>
                <span class="tab-title">${t.title}</span>
                <button class="tab-close" onclick="browser.closeTab(${t.id}, event)">×</button>
            </div>
        `).join('');
    }

    setTabTitle(id, title, icon = '🌐') {
        const tab = this.getTab(id);
        if (tab) { tab.title = title; tab.icon = icon; }
        this.renderTabs();
    }

    // ---- NAVIGATION ----
    navigate(input) {
        if (!input || !input.trim()) return;
        input = input.trim();

        let url = input;
        let isUrl = false;

        // Check if it's already a URL
        if (/^https?:\/\//i.test(input)) {
            isUrl = true;
            url = input;
        } else if (/^[\w-]+(\.[\w-]+)+/.test(input) && !input.includes(' ')) {
            isUrl = true;
            url = 'https://' + input;
        }

        if (isUrl) {
            this.loadWebPage(url);
        } else {
            this.handleSearch(input);
        }

        const tab = this.activeTab();
        tab.url = url;
        document.getElementById('url-input').value = url;
        document.getElementById('lock-icon').textContent = url.startsWith('https') ? '🔒' : '🌐';
    }

    handleSearch(query) {
        // Always search Wikipedia + open Google for broader results
        this.loadWikiSearch(query);
    }

    goBack() {
        const tab = this.activeTab();
        if (tab.historyIndex > 0) {
            tab.historyIndex--;
            const entry = tab.history[tab.historyIndex];
            this.renderTabContent(entry);
        }
    }

    goForward() {
        const tab = this.activeTab();
        if (tab.historyIndex < tab.history.length - 1) {
            tab.historyIndex++;
            const entry = tab.history[tab.historyIndex];
            this.renderTabContent(entry);
        }
    }

    refresh() {
        const tab = this.activeTab();
        if (tab.url) this.navigate(tab.url);
    }

    goHome() {
        this.showHome();
    }

    pushHistory(entry) {
        const tab = this.activeTab();
        tab.history = tab.history.slice(0, tab.historyIndex + 1);
        tab.history.push(entry);
        tab.historyIndex = tab.history.length - 1;
    }

    renderTabContent(entry) {
        const container = document.getElementById(`tab-page-${this.activeTabId}`);
        container.innerHTML = entry.html;
        if (entry.onRender) entry.onRender(container);
    }

    // ---- HOME PAGE ----
    showHome() {
        const tab = this.activeTab();
        tab.url = '';
        tab.page = 'home';
        document.getElementById('url-input').value = '';
        document.getElementById('lock-icon').textContent = '🔍';

        const container = document.getElementById(`tab-page-${this.activeTabId}`);
        container.innerHTML = `
            <div class="home-page">
                <div class="home-logo">🌐</div>
                <div class="home-title">Hubbase</div>
                <div class="home-sub">Bicom Browser — Explore Everything</div>
                <div class="home-search">
                    <div class="home-search-box">
                        <input type="text" id="home-search-input" placeholder="Cari atau ketik URL..." autocomplete="off" spellcheck="false">
                        <button class="home-search-btn" onclick="browser.homeSearch()">🔍 Cari</button>
                    </div>
                    <div class="home-suggestions" id="home-suggestions"></div>
                </div>
                <div class="home-grid">
                    <div class="home-card" onclick="browser.navigate('https://www.google.com')">
                        <span class="home-card-icon">🔍</span>
                        <span class="home-card-label">Google</span>
                    </div>
                    <div class="home-card" onclick="browser.navigate('https://www.youtube.com')">
                        <span class="home-card-icon">▶️</span>
                        <span class="home-card-label">YouTube</span>
                    </div>
                    <div class="home-card" onclick="browser.navigate('https://www.wikipedia.org')">
                        <span class="home-card-icon">📚</span>
                        <span class="home-card-label">Wikipedia</span>
                    </div>
                    <div class="home-card" onclick="browser.navigate('https://github.com')">
                        <span class="home-card-icon">🐙</span>
                        <span class="home-card-label">GitHub</span>
                    </div>
                    <div class="home-card" onclick="browser.randomArticle()">
                        <span class="home-card-icon">🎲</span>
                        <span class="home-card-label">Artikel Acak</span>
                    </div>
                    <div class="home-card" onclick="browser.featuredArticles()">
                        <span class="home-card-icon">⭐</span>
                        <span class="home-card-label">Artikel Pilihan</span>
                    </div>
                    <div class="home-card" onclick="browser.navigate('https://news.ycombinator.com')">
                        <span class="home-card-icon">📰</span>
                        <span class="home-card-label">Hacker News</span>
                    </div>
                    <div class="home-card" onclick="browser.navigate('https://www.reddit.com')">
                        <span class="home-card-icon">🤖</span>
                        <span class="home-card-label">Reddit</span>
                    </div>
                </div>
                <div class="home-top-sites">
                    <div class="home-top-site" onclick="browser.navigate('https://www.facebook.com')">👥 Facebook</div>
                    <div class="home-top-site" onclick="browser.navigate('https://www.instagram.com')">📷 Instagram</div>
                    <div class="home-top-site" onclick="browser.navigate('https://twitter.com')">🐦 Twitter</div>
                    <div class="home-top-site" onclick="browser.navigate('https://www.tiktok.com')">🎵 TikTok</div>
                    <div class="home-top-site" onclick="browser.navigate('https://www.amazon.com')">📦 Amazon</div>
                    <div class="home-top-site" onclick="browser.navigate('https://www.netflix.com')">🎬 Netflix</div>
                    <div class="home-top-site" onclick="browser.navigate('https://www.twitch.tv')">🎮 Twitch</div>
                    <div class="home-top-site" onclick="browser.navigate('https://stackoverflow.com')">📝 StackOverflow</div>
                    <div class="home-top-site" onclick="browser.navigate('https://medium.com')">✍️ Medium</div>
                    <div class="home-top-site" onclick="browser.navigate('https://detik.com')">📰 Detik</div>
                    <div class="home-top-site" onclick="browser.navigate('https://kompas.com')">📰 Kompas</div>
                    <div class="home-top-site" onclick="browser.navigate('https://translate.google.com')">🌐 Translate</div>
                </div>
            </div>
        `;

        this.pushHistory({ type: 'home', html: container.innerHTML, onRender: null });

        // Bind search events
        const input = document.getElementById('home-search-input');
        if (input) {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') this.homeSearch();
            });
            let timeout;
            input.addEventListener('input', e => {
                clearTimeout(timeout);
                const q = e.target.value.trim();
                if (q.length > 1) {
                    timeout = setTimeout(() => this.getSearchSuggestions(q), 250);
                } else {
                    document.getElementById('home-suggestions').classList.remove('visible');
                }
            });
            setTimeout(() => input.focus(), 100);
        }

        this.setTabTitle(this.activeTabId, 'Beranda', '🏠');
        this.setStatus('Beranda — Hubbase Bicom Browser');
    }

    homeSearch() {
        const input = document.getElementById('home-search-input');
        if (input) this.navigate(input.value);
    }

    // ---- WEB PAGE LOADING ----
    async loadWebPage(url) {
        const tab = this.activeTab();
        tab.url = url;
        tab.page = 'web';

        let hostname = '';
        try { hostname = new URL(url).hostname; } catch(e) { hostname = url; }

        this.setTabTitle(this.activeTabId, hostname, '🌐');
        this.setStatus(`Memuat: ${url}...`);

        const container = document.getElementById(`tab-page-${this.activeTabId}`);

        // Show loading
        container.innerHTML = `
            <div class="web-loading">
                <div style="font-size:36px">🌐</div>
                <div>Memuat ${hostname}...</div>
                <div class="loading-bar"><div class="loading-bar-fill"></div></div>
            </div>
        `;

        // Try to fetch via proxy
        let content = null;
        for (const proxyFn of PROXY_SERVICES) {
            try {
                const proxyUrl = proxyFn(url);
                const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
                if (resp.ok) {
                    const text = await resp.text();
                    if (text && text.length > 100) {
                        content = text;
                        break;
                    }
                }
            } catch(e) { /* try next */ }
        }

        if (content) {
            this.renderFetchedPage(container, content, url, hostname);
            this.setStatus(`✓ ${hostname} dimuat`);
        } else {
            // Fallback: try iframe
            this.renderIframePage(container, url, hostname);
        }

        this.pushHistory({ type: 'web', url, html: container.innerHTML, onRender: null });
    }

    renderFetchedPage(container, html, url, hostname) {
        // Clean up the HTML
        let cleaned = this.cleanHTML(html, url);

        container.innerHTML = `
            <div class="web-content-frame">
                <div class="web-content-inner" id="web-content-${this.activeTabId}">
                    ${cleaned}
                </div>
            </div>
        `;

        // Fix relative links
        const inner = container.querySelector('.web-content-inner');
        if (inner) {
            inner.querySelectorAll('a[href]').forEach(a => {
                const href = a.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('javascript')) {
                    try {
                        a.href = new URL(href, url).href;
                        a.onclick = (e) => { e.preventDefault(); browser.navigate(a.href); };
                    } catch(e) {}
                } else if (href && (href.startsWith('http'))) {
                    a.onclick = (e) => { e.preventDefault(); browser.navigate(href); };
                }
            });

            // Fix images
            inner.querySelectorAll('img[src]').forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('http')) {
                    try { img.src = new URL(src, url).href; } catch(e) {}
                }
            });
        }
    }

    cleanHTML(html, baseUrl) {
        // Remove scripts, styles, and noisy elements
        let cleaned = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<link[^>]*>/gi, '')
            .replace(/<meta[^>]*>/gi, '')
            .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<svg[\s\S]*?<\/svg>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '');

        // Extract body content if possible
        const bodyMatch = cleaned.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i);
        if (bodyMatch) cleaned = bodyMatch[1];

        return cleaned;
    }

    renderIframePage(container, url, hostname) {
        container.innerHTML = `
            <iframe class="web-frame" id="web-frame-${this.activeTabId}" 
                src="${url}" 
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                loading="lazy">
            </iframe>
        `;

        const frame = document.getElementById(`web-frame-${this.activeTabId}`);
        if (frame) {
            frame.onerror = () => {
                container.innerHTML = `
                    <div class="web-loading">
                        <div style="font-size:48px">⚠️</div>
                        <div style="font-size:16px;font-weight:600">Gagal memuat ${hostname}</div>
                        <div style="color:var(--text-muted);font-size:13px;margin-top:8px">
                            Situs ini mungkin memblokir frame atau tidak tersedia.
                        </div>
                        <button class="home-search-btn" style="margin-top:16px" onclick="browser.openExternal('${url}')">
                            🔗 Buka di Tab Baru
                        </button>
                        <button class="home-search-btn" style="margin-top:8px;background:var(--bg-surface);color:var(--text)" onclick="browser.goHome()">
                            🏠 Kembali ke Beranda
                        </button>
                    </div>
                `;
            };
        }

        this.setStatus(`Memuat via iframe: ${hostname}`);
    }

    openExternal(url) {
        window.open(url, '_blank');
    }

    // ---- WIKIPEDIA ----
    async loadWikiSearch(query) {
        const tab = this.activeTab();
        tab.url = query;
        tab.page = 'wiki-search';

        this.setTabTitle(this.activeTabId, `Pencarian: ${query}`, '🔍');
        this.setStatus(`Mencari: ${query}...`);

        const container = document.getElementById(`tab-page-${this.activeTabId}`);

        container.innerHTML = `
            <div class="web-loading">
                <div style="font-size:36px">📚</div>
                <div>Mencari "${query}" di Wikipedia...</div>
                <div class="loading-bar"><div class="loading-bar-fill"></div></div>
            </div>
        `;

        try {
            const resp = await fetch(
                `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=15&format=json&origin=*`
            );
            const data = await resp.json();
            const results = data.query.search;

            container.innerHTML = `
                <div class="results-page">
                    <h2>Hasil Pencarian: <span>${query}</span></h2>
                    <div class="results-count">${results.length} hasil ditemukan di Wikipedia</div>
                    ${results.map(r => `
                        <div class="result-item" onclick="browser.loadWikiArticle('${r.title.replace(/'/g, "\\'")}')">
                            <div class="r-title">📖 ${r.title}</div>
                            <div class="r-snippet">${r.snippet.replace(/<[^>]*>/g, '')}</div>
                            <div class="r-url">id.wikipedia.org/wiki/${r.title.replace(/ /g, '_')}</div>
                        </div>
                    `).join('')}
                    <div style="text-align:center;padding:20px;margin-top:12px">
                        <button class="home-search-btn" style="background:var(--accent)" 
                            onclick="browser.navigate('https://www.google.com/search?q=${encodeURIComponent(query)}')">
                            🔍 Cari di Google juga
                        </button>
                    </div>
                </div>
            `;

            this.pushHistory({ type: 'wiki-search', query, html: container.innerHTML });
            this.setStatus(`${results.length} hasil untuk "${query}"`);
        } catch(e) {
            container.innerHTML = `
                <div class="results-page">
                    <h2>Hasil Pencarian: <span>${query}</span></h2>
                    <div style="text-align:center;padding:40px">
                        <div style="font-size:48px;margin-bottom:16px">⚠️</div>
                        <p>Gagal memuat hasil pencarian. Periksa koneksi internet.</p>
                        <button class="home-search-btn" style="margin-top:16px" onclick="browser.navigate('https://www.google.com/search?q=${encodeURIComponent(query)}')">
                            🔍 Cari di Google
                        </button>
                    </div>
                </div>
            `;
        }
    }

    async loadWikiArticle(title) {
        const tab = this.activeTab();
        const url = `https://id.wikipedia.org/wiki/${title.replace(/ /g, '_')}`;
        tab.url = url;
        tab.page = 'wiki-article';

        this.setTabTitle(this.activeTabId, title, '📚');
        this.setStatus(`Memuat artikel: ${title}...`);

        const container = document.getElementById(`tab-page-${this.activeTabId}`);

        container.innerHTML = `
            <div class="wiki-page">
                <div class="wiki-sidebar">
                    <h3>📌 Topik</h3>
                    ${WIKI_TOPICS.map(t => `
                        <div class="wiki-topic" onclick="browser.loadWikiSearch('${t}')">${t}</div>
                    `).join('')}
                </div>
                <div class="wiki-main" id="wiki-main-${this.activeTabId}">
                    <div class="web-loading">
                        <div class="loading-bar"><div class="loading-bar-fill"></div></div>
                        <div>Memuat ${title}...</div>
                    </div>
                </div>
                <div class="wiki-info-panel" id="wiki-info-${this.activeTabId}"></div>
            </div>
        `;

        const mainEl = document.getElementById(`wiki-main-${this.activeTabId}`);
        const infoEl = document.getElementById(`wiki-info-${this.activeTabId}`);

        try {
            // Fetch summary
            const resp = await fetch(
                `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
            );
            const article = await resp.json();

            if (article.type === 'standard' || article.type === 'disambiguation' || article.type === 'no-extract') {
                // Hero image
                let heroHTML = '';
                if (article.thumbnail && article.thumbnail.source) {
                    heroHTML = `
                        <div class="wiki-hero">
                            <img class="wiki-hero-img" src="${article.originalimage?.source || article.thumbnail.source}" alt="${title}"
                                onclick="browser.openImageModal('${(article.originalimage?.source || article.thumbnail.source).replace(/'/g, "\\'")}', '${title.replace(/'/g, "\\'")}')">
                            <div class="wiki-hero-cap">${article.description || title}</div>
                        </div>
                    `;
                }

                // Extract content
                const extract = article.extract || 'Tidak ada konten tersedia.';
                const formattedExtract = this.formatWikiExtract(extract);

                mainEl.innerHTML = `
                    <h1>${article.title}</h1>
                    <div class="wiki-meta">
                        <span>📖 Wikipedia Bahasa Indonesia</span>
                        ${article.description ? `<span>• ${article.description}</span>` : ''}
                    </div>
                    ${heroHTML}
                    <div class="wiki-extract">${formattedExtract}</div>
                    <div id="wiki-gallery-section-${this.activeTabId}"></div>
                `;

                // Info box
                infoEl.innerHTML = `
                    <h3>📋 Informasi</h3>
                    ${article.description ? `<div class="info-row"><span class="lbl">Deskripsi</span><span class="val">${article.description}</span></div>` : ''}
                    ${article.langviews ? `<div class="info-row"><span class="lbl">Bahasa</span><span class="val">${article.langviews} bahasa</span></div>` : ''}
                    <div class="info-row"><span class="lbl">Sumber</span><span class="val"><a href="${url}" target="_blank" style="color:var(--accent)">Wikipedia</a></span></div>
                    ${article.coordinates ? `<div class="info-row"><span class="lbl">Koordinat</span><span class="val">${article.coordinates.lat.toFixed(2)}, ${article.coordinates.lon.toFixed(2)}</span></div>` : ''}
                    <div style="margin-top:16px">
                        <h4 style="font-size:12px;color:var(--text-muted);margin-bottom:6px">🔗 Buka di Wikipedia</h4>
                        <a href="${url}" target="_blank" style="font-size:12px;color:var(--accent);text-decoration:none">${title.replace(/ /g, '_')}</a>
                    </div>
                `;

                // Load gallery
                await this.loadWikiGallery(title);

            } else {
                mainEl.innerHTML = `
                    <h1>${title}</h1>
                    <div class="wiki-extract">
                        <p>Artikel "${title}" tidak ditemukan atau belum tersedia dalam bahasa Indonesia.</p>
                        <p>Coba topik lain atau cari di Google:</p>
                        <div style="margin-top:16px">
                            <button class="home-search-btn" onclick="browser.navigate('https://www.google.com/search?q=${encodeURIComponent(title)}')">
                                🔍 Cari di Google
                            </button>
                        </div>
                    </div>
                `;
            }

            this.pushHistory({ type: 'wiki-article', title, html: container.innerHTML });
            this.setStatus(`✓ ${article.title || title}`);
        } catch(e) {
            mainEl.innerHTML = `
                <h1>${title}</h1>
                <div class="wiki-extract">
                    <p style="color:var(--accent-hot)">⚠️ Gagal memuat artikel: ${e.message}</p>
                    <button class="home-search-btn" style="margin-top:16px" onclick="browser.navigate('https://www.google.com/search?q=${encodeURIComponent(title)}')">
                        🔍 Cari di Google
                    </button>
                </div>
            `;
        }
    }

    formatWikiExtract(text) {
        let paragraphs = text.split('\n\n');
        return paragraphs.map(p => {
            if (p.startsWith('==') && p.endsWith('==')) {
                const heading = p.replace(/=/g, '').trim();
                return `<h2>${heading}</h2>`;
            }
            if (p.startsWith('=') && p.endsWith('=')) {
                const heading = p.replace(/=/g, '').trim();
                return `<h3>${heading}</h3>`;
            }
            return `<p>${p}</p>`;
        }).join('');
    }

    async loadWikiGallery(title) {
        try {
            const resp = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=16&format=json&origin=*`
            );
            const data = await resp.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];

            if (pageId === '-1' || !pages[pageId].images) return;

            const images = pages[pageId].images
                .filter(img => !/(?:Icon|Logo|Flag|OOjs|Wiktionary|Commons|Ambox|Crystal|Question|Edit-|Lock-|Symbol)/i.test(img.title))
                .slice(0, 12);

            this.galleryImages = [];

            for (const img of images) {
                try {
                    const infoResp = await fetch(
                        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=600&format=json&origin=*`
                    );
                    const infoData = await infoResp.json();
                    const infoPages = infoData.query.pages;
                    const infoPageId = Object.keys(infoPages)[0];

                    if (infoPageId !== '-1' && infoPages[infoPageId].imageinfo) {
                        const info = infoPages[infoPageId].imageinfo[0];
                        if (info.size > 1000) {
                            const desc = info.extmetadata?.ImageDescription?.value || '';
                            this.galleryImages.push({
                                src: info.thumburl || info.url,
                                fullSrc: info.url,
                                title: img.title.replace('File:', ''),
                                description: desc.replace(/<[^>]*>/g, '').substring(0, 120)
                            });
                        }
                    }
                } catch(e) {}
            }

            if (this.galleryImages.length > 0) {
                const section = document.getElementById(`wiki-gallery-section-${this.activeTabId}`);
                if (section) {
                    section.innerHTML = `
                        <div class="wiki-gallery">
                            <h2>🖼️ Galeri Gambar (${this.galleryImages.length})</h2>
                            <div class="wiki-gallery-grid">
                                ${this.galleryImages.map((img, i) => `
                                    <div class="wiki-gallery-item" onclick="browser.openImageModal('${img.fullSrc.replace(/'/g, "\\'")}', '${img.title.replace(/'/g, "\\'")}')">
                                        <img src="${img.src}" alt="${img.title}" loading="lazy">
                                        <div class="wiki-gallery-cap">${img.title}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            }
        } catch(e) {}
    }

    async randomArticle() {
        this.setStatus('Memuat artikel acak...');
        try {
            const resp = await fetch('https://id.wikipedia.org/api/rest_v1/page/random/summary');
            const article = await resp.json();
            this.loadWikiArticle(article.title);
        } catch(e) {
            this.setStatus('Error memuat artikel acak');
        }
    }

    async featuredArticles() {
        const tab = this.activeTab();
        tab.page = 'featured';

        const container = document.getElementById(`tab-page-${this.activeTabId}`);
        this.setTabTitle(this.activeTabId, 'Artikel Pilihan', '⭐');
        this.setStatus('Memuat artikel pilihan...');

        const topics = [
            'Indonesia','Gunung Merapi','Taman Nasional Komodo','Borobudur','Wayang',
            'Batik','Rendang','Tari Kecak','Candi Prambanan','Danau Toba',
            'Raden Saleh','Garuda Indonesia','Kereta api Indonesia','Pancasila'
        ];

        try {
            const results = await Promise.all(
                topics.slice(0, 10).map(async t => {
                    const r = await fetch(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`);
                    return r.json();
                })
            );

            container.innerHTML = `
                <div class="results-page">
                    <h2>⭐ <span>Artikel Pilihan Wikipedia</span></h2>
                    <div class="results-count">Artikel terbaik dan paling berpengaruh</div>
                    ${results.map(a => `
                        <div class="result-item" onclick="browser.loadWikiArticle('${a.title.replace(/'/g, "\\'")}')">
                            <div class="r-title">⭐ ${a.title}</div>
                            <div class="r-snippet">${(a.extract || '').substring(0, 200)}...</div>
                        </div>
                    `).join('')}
                </div>
            `;

            this.pushHistory({ type: 'featured', html: container.innerHTML });
            this.setStatus('Artikel pilihan berhasil dimuat');
        } catch(e) {
            this.setStatus('Error memuat artikel pilihan');
        }
    }

    // ---- SEARCH SUGGESTIONS ----
    async getSearchSuggestions(query) {
        try {
            const resp = await fetch(
                `https://id.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=8&format=json&origin=*`
            );
            const [term, titles, descs] = await resp.json();
            const el = document.getElementById('home-suggestions');
            if (!el) return;

            if (titles.length === 0) { el.classList.remove('visible'); return; }

            el.innerHTML = titles.map((t, i) => `
                <div class="suggestion-item" onclick="browser.loadWikiArticle('${t.replace(/'/g, "\\'")}')">
                    <span class="suggestion-icon">📖</span>
                    <div>
                        <div class="suggestion-title">${t}</div>
                        <div class="suggestion-desc">${descs[i] || ''}</div>
                    </div>
                </div>
            `).join('');
            el.classList.add('visible');
        } catch(e) {}
    }

    // ---- IMAGE MODAL ----
    openImageModal(src, caption) {
        document.getElementById('modal-image').src = src;
        document.getElementById('modal-caption').textContent = caption || '';
        document.getElementById('image-modal').classList.remove('hidden');
    }

    closeImageModal() {
        document.getElementById('image-modal').classList.add('hidden');
    }

    // ---- BOOKMARKS ----
    loadBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('bicom_bookmarks') || '[]');
        } catch(e) { return []; }
    }

    saveBookmarks() {
        localStorage.setItem('bicom_bookmarks', JSON.stringify(this.bookmarks));
    }

    toggleBookmark() {
        const tab = this.activeTab();
        if (!tab.url) return;

        const idx = this.bookmarks.findIndex(b => b.url === tab.url);
        if (idx >= 0) {
            this.bookmarks.splice(idx, 1);
        } else {
            this.bookmarks.push({ url: tab.url, title: tab.title });
        }
        this.saveBookmarks();
        this.updateBookmarkStar();
    }

    updateBookmarkStar() {
        const tab = this.activeTab();
        const star = document.getElementById('btn-bookmark-add');
        const isBookmarked = this.bookmarks.some(b => b.url === tab.url);
        star.textContent = isBookmarked ? '★' : '☆';
        star.classList.toggle('active', isBookmarked);
    }

    renderBookmarksBar() {
        const bar = document.getElementById('bookmarks-bar');
        const custom = this.bookmarks.map(b => `
            <div class="bookmark-item" onclick="browser.navigate('${b.url.replace(/'/g, "\\'")}')">
                <span class="bm-icon">⭐</span><span class="bm-label">${b.title}</span>
            </div>
        `).join('');

        // Keep the default ones + user bookmarks
        bar.innerHTML = `
            <div class="bookmark-item" onclick="browser.navigate('https://www.google.com')"><span class="bm-icon">🔍</span><span class="bm-label">Google</span></div>
            <div class="bookmark-item" onclick="browser.navigate('https://www.youtube.com')"><span class="bm-icon">▶️</span><span class="bm-label">YouTube</span></div>
            <div class="bookmark-item" onclick="browser.navigate('https://www.wikipedia.org')"><span class="bm-icon">📚</span><span class="bm-label">Wikipedia</span></div>
            <div class="bookmark-item" onclick="browser.navigate('https://github.com')"><span class="bm-icon">🐙</span><span class="bm-label">GitHub</span></div>
            <div class="bookmark-item" onclick="browser.navigate('https://twitter.com')"><span class="bm-icon">🐦</span><span class="bm-label">Twitter</span></div>
            <div class="bookmark-item" onclick="browser.navigate('https://www.reddit.com')"><span class="bm-icon">🤖</span><span class="bm-label">Reddit</span></div>
            <div class="bookmark-item" onclick="browser.navigate('https://id.wikipedia.org')"><span class="bm-icon">🇮🇩</span><span class="bm-label">Wiki ID</span></div>
            ${custom}
        `;
    }

    // ---- SIDEBAR ----
    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        document.getElementById('sidebar-panel').classList.toggle('hidden', !this.sidebarOpen);
    }

    closeSidebar() {
        this.sidebarOpen = false;
        document.getElementById('sidebar-panel').classList.add('hidden');
    }

    // ---- STATUS ----
    setStatus(text) {
        document.getElementById('status-text').textContent = text;
    }

    // ---- GLOBAL EVENTS ----
    bindGlobalEvents() {
        // Navigation buttons
        document.getElementById('btn-back').addEventListener('click', () => this.goBack());
        document.getElementById('btn-forward').addEventListener('click', () => this.goForward());
        document.getElementById('btn-refresh').addEventListener('click', () => this.refresh());
        document.getElementById('btn-home').addEventListener('click', () => this.goHome());
        document.getElementById('btn-new-tab').addEventListener('click', () => this.newTab());
        document.getElementById('btn-wiki-mode').addEventListener('click', () => this.navigate('https://www.wikipedia.org'));
        document.getElementById('btn-sidebar').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('sidebar-close').addEventListener('click', () => this.closeSidebar());
        document.getElementById('btn-bookmark-add').addEventListener('click', () => this.toggleBookmark());

        // Address bar
        document.getElementById('url-input').addEventListener('keydown', e => {
            if (e.key === 'Enter') this.navigate(e.target.value);
        });

        // Modal
        document.getElementById('modal-close').addEventListener('click', () => this.closeImageModal());
        document.getElementById('image-modal').addEventListener('click', e => {
            if (e.target.id === 'image-modal') this.closeImageModal();
        });

        // Sidebar links
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', () => {
                this.navigate(link.dataset.url);
                this.closeSidebar();
            });
        });

        // Bookmarks bar
        document.querySelectorAll('.bookmark-item').forEach(item => {
            if (item.dataset.url) {
                item.addEventListener('click', () => this.navigate(item.dataset.url));
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                this.closeImageModal();
                this.closeSidebar();
            }
            if (e.ctrlKey && e.key === 't') { e.preventDefault(); this.newTab(); }
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                document.getElementById('url-input').focus();
                document.getElementById('url-input').select();
            }
            if (e.ctrlKey && e.key === 'd') { e.preventDefault(); this.toggleBookmark(); }
            if (e.key === 'F5') { e.preventDefault(); this.refresh(); }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', e => {
            if (!e.target.closest('.home-search')) {
                const s = document.getElementById('home-suggestions');
                if (s) s.classList.remove('visible');
            }
        });
    }
}

// ===== LAUNCH =====
const browser = new BicomBrowser();
