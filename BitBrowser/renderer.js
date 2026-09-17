// ============================================================
//  Bit Browser - Renderer Process
//  Uses <webview> (Chromium engine) - NO iframe
// ============================================================

class BitBrowser {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
        this.tabCounter = 0;
        this.bookmarks = this.loadFromStorage('bit_bookmarks', []);
        this.history = this.loadFromStorage('bit_history', []);
        this.zoomLevel = 1.0;

        this.init();
    }

    init() {
        this.bindUI();
        this.newTab();
        this.renderBookmarksBar();
    }

    // ---- STORAGE ----
    loadFromStorage(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch { return fallback; }
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // ---- UI BINDING ----
    bindUI() {
        document.getElementById('btn-newtab').addEventListener('click', () => this.newTab());
        document.getElementById('btn-back').addEventListener('click', () => this.goBack());
        document.getElementById('btn-forward').addEventListener('click', () => this.goForward());
        document.getElementById('btn-refresh').addEventListener('click', () => this.refresh());
        document.getElementById('btn-home').addEventListener('click', () => this.goHome());
        document.getElementById('btn-bookmark').addEventListener('click', () => this.toggleBookmark());
        document.getElementById('btn-menu').addEventListener('click', (e) => this.toggleMenu(e));
        document.getElementById('btn-devtools').addEventListener('click', () => this.toggleDevTools());

        document.getElementById('url-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.navigate(e.target.value);
        });

        document.getElementById('url-input').addEventListener('focus', () => {
            document.getElementById('url-input').select();
        });

        // Window controls
        document.getElementById('wc-close').addEventListener('click', () => window.electronAPI.close());
        document.getElementById('wc-minimize').addEventListener('click', () => window.electronAPI.minimize());
        document.getElementById('wc-maximize').addEventListener('click', () => window.electronAPI.maximize());

        // Menu actions
        document.getElementById('menu-dropdown').addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (item) this.handleMenuAction(item.dataset.action);
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#btn-menu') && !e.target.closest('#menu-dropdown')) {
                document.getElementById('menu-dropdown').classList.add('hidden');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 't') { e.preventDefault(); this.newTab(); }
            if (e.ctrlKey && e.key === 'w') { e.preventDefault(); this.closeTab(this.activeTabId); }
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                const inp = document.getElementById('url-input');
                inp.focus();
                inp.select();
            }
            if (e.ctrlKey && e.key === 'f') { e.preventDefault(); this.toggleFind(); }
            if (e.key === 'F5') { e.preventDefault(); this.refresh(); }
            if (e.key === 'F11') { e.preventDefault(); this.toggleFullscreen(); }
            if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); this.goBack(); }
            if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); this.goForward(); }
        });

        // Tab bar scrolling
        document.querySelector('.tabbar').addEventListener('wheel', (e) => {
            e.preventDefault();
            document.querySelector('.tabs').scrollLeft += e.deltaY;
        }, { passive: false });
    }

    // ---- TAB MANAGEMENT ----
    newTab(url = null) {
        const id = ++this.tabCounter;
        const tabData = {
            id,
            title: 'New Tab',
            url: '',
            favicon: '',
            history: [],
            historyIndex: -1,
            webview: null,
            isNewTab: true
        };

        this.tabs.set(id, tabData);

        // Create tab page container
        const container = document.getElementById('content-area');
        const page = document.createElement('div');
        page.className = 'tab-page';
        page.id = `tab-page-${id}`;
        container.appendChild(page);

        this.renderTabBar();
        this.switchTab(id);

        if (url) {
            this.navigate(url);
        } else {
            this.showNewTabPage(id);
        }
    }

    switchTab(id) {
        this.activeTabId = id;
        const tab = this.tabs.get(id);

        // Hide all tab pages
        document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));

        // Show active tab page
        const page = document.getElementById(`tab-page-${id}`);
        if (page) page.classList.add('active');

        // Update address bar
        document.getElementById('url-input').value = tab.url || '';
        this.updateBookmarkIcon();

        // Update nav button states
        this.updateNavButtons();

        // Update status
        this.setStatus(tab.url ? tab.url : 'Ready');

        // Render tab bar
        this.renderTabBar();
    }

    closeTab(id, e) {
        if (e) e.stopPropagation();
        if (this.tabs.size <= 1) return;

        const tab = this.tabs.get(id);
        if (!tab) return;

        // Destroy webview if exists
        if (tab.webview) {
            tab.webview.remove();
            tab.webview = null;
        }

        // Remove tab page
        const page = document.getElementById(`tab-page-${id}`);
        if (page) page.remove();

        this.tabs.delete(id);

        // Switch to another tab if closing active
        if (this.activeTabId === id) {
            const remaining = Array.from(this.tabs.keys());
            this.switchTab(remaining[remaining.length - 1]);
        } else {
            this.renderTabBar();
        }
    }

    renderTabBar() {
        const container = document.getElementById('tabs-container');
        container.innerHTML = '';

        this.tabs.forEach((tab, id) => {
            const el = document.createElement('div');
            el.className = `tab ${id === this.activeTabId ? 'active' : ''}`;
            el.addEventListener('click', () => this.switchTab(id));

            const favicon = tab.favicon
                ? `<img class="tab-favicon" src="${tab.favicon}" onerror="this.style.display='none'">`
                : `<svg class="tab-favicon" viewBox="0 0 24 24" width="14" height="14" style="color:var(--text-muted)"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;

            el.innerHTML = `
                ${favicon}
                <span class="tab-title">${this.escapeHtml(tab.title)}</span>
                <button class="tab-close" onclick="browser.closeTab(${id}, event)">✕</button>
            `;
            container.appendChild(el);
        });
    }

    // ---- NAVIGATION ----
    navigate(input) {
        if (!input || !input.trim()) return;
        input = input.trim();

        let url = input;
        let isUrl = false;

        if (/^https?:\/\//i.test(input)) {
            isUrl = true;
            url = input;
        } else if (/^[\w-]+(\.[\w-]+)+/.test(input) && !input.includes(' ')) {
            isUrl = true;
            url = 'https://' + input;
        } else if (/^(localhost|127\.0\.0\.1|192\.168\.)/.test(input)) {
            isUrl = true;
            url = 'http://' + input;
        }

        if (isUrl) {
            this.loadURL(url);
        } else {
            this.searchGoogle(input);
        }
    }

    loadURL(url) {
        const tab = this.tabs.get(this.activeTabId);
        if (!tab) return;

        tab.url = url;
        tab.isNewTab = false;

        // Hide new tab page, show/prepare webview
        const page = document.getElementById(`tab-page-${this.activeTabId}`);

        // Get or create webview
        if (!tab.webview) {
            const wv = document.createElement('webview');
            wv.setAttribute('allowpopups', '');
            wv.addEventListener('did-start-loading', () => {
                this.setStatus(`Loading: ${url}`);
                this.showLoadingBar();
            });
            wv.addEventListener('did-stop-loading', () => {
                this.setStatus(url);
                this.hideLoadingBar();
                this.updateNavButtons();
            });
            wv.addEventListener('page-title-updated', (e) => {
                tab.title = e.title || url;
                this.renderTabBar();
            });
            wv.addEventListener('page-favicon-updated', (e) => {
                if (e.favicons && e.favicons.length > 0) {
                    tab.favicon = e.favicons[0];
                    this.renderTabBar();
                }
            });
            wv.addEventListener('did-navigate', (e) => {
                tab.url = e.url;
                document.getElementById('url-input').value = e.url;
                this.addToHistory(e.title || e.url, e.url);
            });
            wv.addEventListener('did-navigate-in-page', (e) => {
                if (e.isMainFrame) {
                    tab.url = e.url;
                    document.getElementById('url-input').value = e.url;
                }
            });
            wv.addEventListener('did-fail-load', (e) => {
                if (e.errorCode !== -3) {
                    this.showLoadError(url, e.errorDescription);
                }
            });

            page.innerHTML = '';
            page.appendChild(wv);
            tab.webview = wv;
        }

        tab.webview.loadURL(url);
        document.getElementById('url-input').value = url;
        this.setStatus(`Loading: ${url}`);
    }

    searchGoogle(query) {
        this.loadURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    }

    goBack() {
        const tab = this.tabs.get(this.activeTabId);
        if (tab?.webview && tab.webview.canGoBack()) {
            tab.webview.goBack();
        }
    }

    goForward() {
        const tab = this.tabs.get(this.activeTabId);
        if (tab?.webview && tab.webview.canGoForward()) {
            tab.webview.goForward();
        }
    }

    refresh() {
        const tab = this.tabs.get(this.activeTabId);
        if (tab?.webview) {
            tab.webview.reload();
        }
    }

    goHome() {
        const tab = this.tabs.get(this.activeTabId);
        if (tab?.webview) {
            tab.webview.remove();
            tab.webview = null;
        }
        tab.url = '';
        tab.isNewTab = true;
        this.showNewTabPage(this.activeTabId);
        document.getElementById('url-input').value = '';
    }

    updateNavButtons() {
        const tab = this.tabs.get(this.activeTabId);
        const canGoBack = tab?.webview?.canGoBack() || false;
        const canGoForward = tab?.webview?.canGoForward() || false;

        document.getElementById('btn-back').disabled = !canGoBack;
        document.getElementById('btn-forward').disabled = !canGoForward;
    }

    // ---- NEW TAB PAGE ----
    showNewTabPage(tabId) {
        const page = document.getElementById(`tab-page-${tabId}`);
        this.tabs.get(tabId).title = 'New Tab';
        this.renderTabBar();

        page.innerHTML = `
            <div class="newtab-page">
                <div class="newtab-logo">
                    <svg viewBox="0 0 80 80" width="80" height="80">
                        <defs>
                            <linearGradient id="bitGradBig" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#60a5fa"/>
                                <stop offset="100%" style="stop-color:#a78bfa"/>
                            </linearGradient>
                        </defs>
                        <rect x="4" y="4" width="72" height="72" rx="16" fill="url(#bitGradBig)"/>
                        <text x="40" y="55" text-anchor="middle" fill="white" font-size="44" font-weight="700" font-family="Inter,sans-serif">B</text>
                    </svg>
                </div>
                <div class="newtab-title">Bit Browser</div>
                <div class="newtab-sub">Fast. Clean. Chromium-powered.</div>
                <div class="newtab-search">
                    <div class="newtab-search-box">
                        <input type="text" id="newtab-input" placeholder="Search with Google or enter URL" autocomplete="off" spellcheck="false">
                        <button class="newtab-go" onclick="browser.newTabSearch()">Go</button>
                    </div>
                </div>
                <div class="newtab-grid">
                    <a class="newtab-card" onclick="browser.navigate('https://www.google.com')">
                        <span class="newtab-card-icon">🔍</span>
                        <span class="newtab-card-label">Google</span>
                    </a>
                    <a class="newtab-card" onclick="browser.navigate('https://www.youtube.com')">
                        <span class="newtab-card-icon">▶️</span>
                        <span class="newtab-card-label">YouTube</span>
                    </a>
                    <a class="newtab-card" onclick="browser.navigate('https://github.com')">
                        <span class="newtab-card-icon">🐙</span>
                        <span class="newtab-card-label">GitHub</span>
                    </a>
                    <a class="newtab-card" onclick="browser.navigate('https://www.wikipedia.org')">
                        <span class="newtab-card-icon">📚</span>
                        <span class="newtab-card-label">Wikipedia</span>
                    </a>
                    <a class="newtab-card" onclick="browser.navigate('https://twitter.com')">
                        <span class="newtab-card-icon">🐦</span>
                        <span class="newtab-card-label">X / Twitter</span>
                    </a>
                    <a class="newtab-card" onclick="browser.navigate('https://www.reddit.com')">
                        <span class="newtab-card-icon">🤖</span>
                        <span class="newtab-card-label">Reddit</span>
                    </a>
                    <a class="newtab-card" onclick="browser.navigate('https://www.twitch.tv')">
                        <span class="newtab-card-icon">🎮</span>
                        <span class="newtab-card-label">Twitch</span>
                    </a>
                    <a class="newtab-card" onclick="browser.navigate('https://news.ycombinator.com')">
                        <span class="newtab-card-icon">📰</span>
                        <span class="newtab-card-label">Hacker News</span>
                    </a>
                </div>
                <div class="newtab-shortcuts">
                    <div class="newtab-shortcut" onclick="browser.navigate('https://mail.google.com')">📧 Gmail</div>
                    <div class="newtab-shortcut" onclick="browser.navigate('https://drive.google.com')">☁️ Drive</div>
                    <div class="newtab-shortcut" onclick="browser.navigate('https://translate.google.com')">🌐 Translate</div>
                    <div class="newtab-shortcut" onclick="browser.navigate('https://www.facebook.com')">👥 Facebook</div>
                    <div class="newtab-shortcut" onclick="browser.navigate('https://www.instagram.com')">📷 Instagram</div>
                    <div class="newtab-shortcut" onclick="browser.navigate('https://www.tiktok.com')">🎵 TikTok</div>
                    <div class="newtab-shortcut" onclick="browser.navigate('https://stackoverflow.com')">📝 Stack Overflow</div>
                    <div class="newtab-shortcut" onclick="browser.navigate('https://www.amazon.com')">📦 Amazon</div>
                    <div class="newtab-shortcut" onclick="browser.navigate('https://www.netflix.com')">🎬 Netflix</div>
                    <div class="newtab-shortcut" onclick="browser.navigate('https://medium.com')">✍️ Medium</div>
                </div>
            </div>
        `;

        // Bind search input
        const input = document.getElementById('newtab-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.newTabSearch();
            });
            setTimeout(() => input.focus(), 50);
        }
    }

    newTabSearch() {
        const input = document.getElementById('newtab-input');
        if (input) this.navigate(input.value);
    }

    // ---- LOADING BAR ----
    showLoadingBar() {
        let bar = document.querySelector('.loading-overlay');
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'loading-overlay';
            bar.innerHTML = '<div class="loading-bar"></div>';
            document.getElementById('content-area').appendChild(bar);
        }
        bar.style.display = 'block';
    }

    hideLoadingBar() {
        const bar = document.querySelector('.loading-overlay');
        if (bar) bar.style.display = 'none';
    }

    // ---- LOAD ERROR ----
    showLoadError(url, error) {
        const page = document.getElementById(`tab-page-${this.activeTabId}`);
        page.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;padding:40px;text-align:center;background:var(--bg-base)">
                <svg viewBox="0 0 24 24" width="48" height="48" style="color:var(--red)">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <div style="font-size:18px;font-weight:600">Unable to load this page</div>
                <div style="color:var(--text-secondary);font-size:13px;max-width:500px">${error || 'This site can\'t be reached'}</div>
                <div style="color:var(--text-muted);font-size:12px;margin-top:4px">${url}</div>
                <div style="display:flex;gap:8px;margin-top:16px">
                    <button onclick="browser.refresh()" style="padding:8px 20px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);border-radius:var(--radius);cursor:pointer;font-size:13px;font-family:inherit">Retry</button>
                    <button onclick="browser.goHome()" style="padding:8px 20px;border:none;background:var(--accent);color:white;border-radius:var(--radius);cursor:pointer;font-size:13px;font-family:inherit">Home</button>
                </div>
            </div>
        `;
    }

    // ---- BOOKMARKS ----
    toggleBookmark() {
        const tab = this.tabs.get(this.activeTabId);
        if (!tab?.url) return;

        const idx = this.bookmarks.findIndex(b => b.url === tab.url);
        if (idx >= 0) {
            this.bookmarks.splice(idx, 1);
        } else {
            this.bookmarks.push({ url: tab.url, title: tab.title });
        }
        this.saveToStorage('bit_bookmarks', this.bookmarks);
        this.updateBookmarkIcon();
        this.renderBookmarksBar();
    }

    updateBookmarkIcon() {
        const tab = this.tabs.get(this.activeTabId);
        const isBookmarked = tab?.url && this.bookmarks.some(b => b.url === tab.url);
        const btn = document.getElementById('btn-bookmark');
        if (isBookmarked) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    renderBookmarksBar() {
        const bar = document.getElementById('bookmarks-bar');
        if (this.bookmarks.length === 0) {
            bar.innerHTML = '';
            bar.style.display = 'none';
            return;
        }
        bar.style.display = 'flex';
        bar.innerHTML = this.bookmarks.map(b => `
            <div class="bm-item" onclick="browser.navigate('${this.escapeHtml(b.url)}')">
                <img src="https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=32" onerror="this.style.display='none'">
                <span>${this.escapeHtml(b.title)}</span>
            </div>
        `).join('');
    }

    // ---- HISTORY ----
    addToHistory(title, url) {
        if (!url || url.startsWith('bit://')) return;
        this.history.unshift({ title: title || url, url, time: Date.now() });
        if (this.history.length > 500) this.history.pop();
        this.saveToStorage('bit_history', this.history);
    }

    // ---- MENU ----
    toggleMenu(e) {
        e.stopPropagation();
        const menu = document.getElementById('menu-dropdown');
        menu.classList.toggle('hidden');
    }

    handleMenuAction(action) {
        document.getElementById('menu-dropdown').classList.add('hidden');
        switch (action) {
            case 'newtab': this.newTab(); break;
            case 'newwindow': window.open(window.location.href); break;
            case 'zoomin': this.setZoom(this.zoomLevel + 0.1); break;
            case 'zoomout': this.setZoom(this.zoomLevel - 0.1); break;
            case 'print':
                const tab = this.tabs.get(this.activeTabId);
                if (tab?.webview) tab.webview.print();
                break;
            case 'find': this.toggleFind(); break;
            case 'settings': this.navigate('chrome://settings'); break;
            case 'about':
                alert('Bit Browser v1.0.0\nPowered by Chromium (Electron)\nFast. Clean. Powerful.');
                break;
        }
    }

    setZoom(level) {
        this.zoomLevel = Math.min(Math.max(level, 0.25), 5);
        const tab = this.tabs.get(this.activeTabId);
        if (tab?.webview) {
            tab.webview.setZoomFactor(this.zoomLevel);
        }
        this.showZoomIndicator();
    }

    showZoomIndicator() {
        let indicator = document.querySelector('.zoom-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'zoom-indicator';
            document.body.appendChild(indicator);
        }
        indicator.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        indicator.classList.add('visible');
        clearTimeout(this._zoomTimer);
        this._zoomTimer = setTimeout(() => indicator.classList.remove('visible'), 1500);
    }

    // ---- FIND IN PAGE ----
    toggleFind() {
        let findBar = document.querySelector('.find-bar');
        if (findBar) {
            findBar.classList.toggle('hidden');
            if (!findBar.classList.contains('hidden')) {
                findBar.querySelector('input').focus();
            }
            return;
        }

        findBar = document.createElement('div');
        findBar.className = 'find-bar';
        findBar.innerHTML = `
            <input type="text" placeholder="Find in page" id="find-input">
            <span class="find-count" id="find-count"></span>
            <button onclick="browser.findPrev()" title="Previous">◀</button>
            <button onclick="browser.findNext()" title="Next">▶</button>
            <button onclick="browser.closeFind()" title="Close">✕</button>
        `;
        document.body.appendChild(findBar);
        findBar.querySelector('input').focus();

        findBar.querySelector('input').addEventListener('input', (e) => {
            this.findText(e.target.value);
        });

        findBar.querySelector('input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) this.findPrev();
                else this.findNext();
            }
            if (e.key === 'Escape') this.closeFind();
        });
    }

    findText(text) {
        const tab = this.tabs.get(this.activeTabId);
        if (tab?.webview && text) {
            tab.webview.stopFindInPage('clearSelection');
            tab.webview.findInPage(text);
        }
    }

    findNext() {
        const input = document.getElementById('find-input');
        if (input?.value) {
            const tab = this.tabs.get(this.activeTabId);
            if (tab?.webview) tab.webview.findInPage(input.value);
        }
    }

    findPrev() {
        const input = document.getElementById('find-input');
        if (input?.value) {
            const tab = this.tabs.get(this.activeTabId);
            if (tab?.webview) tab.webview.findInPage(input.value, { forward: false });
        }
    }

    closeFind() {
        const tab = this.tabs.get(this.activeTabId);
        if (tab?.webview) tab.webview.stopFindInPage('clearSelection');
        document.querySelector('.find-bar')?.remove();
    }

    // ---- DEVTOOLS ----
    toggleDevTools() {
        const tab = this.tabs.get(this.activeTabId);
        if (tab?.webview) {
            tab.webview.openDevTools();
        }
    }

    // ---- FULLSCREEN ----
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    // ---- STATUS ----
    setStatus(text) {
        document.getElementById('status-text').textContent = text;
    }

    // ---- UTILS ----
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

const browser = new BitBrowser();
