/**
 * Bookmark Dashboard - Core Logic (ES6+ Vanilla JS)
 * Enhanced with: Pinning, Inline Editing, Stats, Backup, and UX Improvements.
 */

// --- Initial State & Storage ---
const STORAGE_KEY = 'bookmark_dashboard_data';
const BACKUP_KEY = 'bookmark_dashboard_backup'; // Local auto-backup

const defaultData = {
    categories: {
        'general': {
            title: 'عام',
            items: [
                { id: crypto.randomUUID(), name: 'Google', url: 'https://google.com', isPinned: false },
                { id: crypto.randomUUID(), name: 'GitHub', url: 'https://github.com', isPinned: true }
            ],
            isCollapsed: false
        }
    },
    settings: {
        darkMode: false
    }
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData;

// --- Helper Functions ---
const saveToStorage = (isAutoBackup = true) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (isAutoBackup) {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(state));
    }
    updateStats();
};

const getFavicon = (url) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
    } catch (e) {
        return 'https://www.google.com/s2/favicons?sz=128&domain=example.com';
    }
};

const updateStats = () => {
    const totalBookmarksEl = document.getElementById('totalBookmarks');
    const totalCategoriesEl = document.getElementById('totalCategories');
    if (!totalBookmarksEl || !totalCategoriesEl) return;

    let totalB = 0;
    const totalC = Object.keys(state.categories).length;

    Object.values(state.categories).forEach(cat => {
        totalB += cat.items.length;
    });

    totalBookmarksEl.textContent = totalB;
    totalCategoriesEl.textContent = totalC;
};

// --- Inline Editing Functionality ---
const enableInlineEdit = (element, onSave) => {
    element.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const currentText = element.textContent.trim();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'inline-edit-input';

        const save = () => {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                onSave(newText);
            } else {
                element.textContent = currentText;
            }
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') {
                input.removeEventListener('blur', save);
                element.textContent = currentText;
            }
        });

        element.textContent = '';
        element.appendChild(input);
        input.focus();
    });
};

// --- Rendering Engine ---
const renderDashboard = (filter = '') => {
    const dashboard = document.getElementById('dashboard');
    const categoryList = document.getElementById('categoryList');
    if (!dashboard) return;

    dashboard.innerHTML = '';
    if (categoryList) categoryList.innerHTML = '';

    const categories = Object.keys(state.categories);

    // Update datalist for categories auto-complete
    if (categoryList) {
        categories.forEach(catId => {
            const option = document.createElement('option');
            option.value = state.categories[catId].title;
            categoryList.appendChild(option);
        });
    }

    let hasVisibleBookmarks = false;

    categories.forEach(catId => {
        const category = state.categories[catId];
        const filteredItems = category.items.filter(item =>
            item.name.toLowerCase().includes(filter.toLowerCase()) ||
            category.title.toLowerCase().includes(filter.toLowerCase())
        );

        // Sort items: Pinned first
        filteredItems.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

        if (filteredItems.length > 0 || (filter === '' && category.items.length >= 0)) {
            hasVisibleBookmarks = true;
            const section = document.createElement('section');
            section.className = `category-section ${category.isCollapsed ? 'collapsed' : ''}`;
            section.dataset.id = catId;

            section.innerHTML = `
                <div class="category-header">
                    <div class="category-title-container" onclick="toggleCategory('${catId}')">
                        <svg class="collapse-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        <h2 class="category-title" data-catid="${catId}">${category.title}</h2>
                    </div>
                    <div class="category-actions">
                        <button class="btn btn-icon delete-category" data-id="${catId}" title="حذف الفئة">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="bookmark-grid" data-cat="${catId}">
                    ${category.items.length === 0 ? `
                        <div class="empty-state-small" style="grid-column: 1/-1; padding: 2rem; color: var(--text-muted); text-align: center;">لا يوجد روابط في هذه الفئة</div>
                    ` : ''}
                    ${filteredItems.map(item => `
                        <a href="${item.url}" target="_blank" class="bookmark-card ${item.isPinned ? 'pinned' : ''}" data-id="${item.id}" draggable="true">
                            <button class="bookmark-pin" title="${item.isPinned ? 'الغاء التثبيت' : 'تثبيت'}" onclick="event.preventDefault(); togglePin('${catId}', '${item.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"></path><path d="M16.5 9.4 7.55 4.24"></path></svg>
                            </button>
                            <img src="${getFavicon(item.url)}" alt="${item.name}" class="bookmark-favicon">
                            <span class="bookmark-name" data-itemid="${item.id}" data-catid="${catId}">${item.name}</span>
                            <button class="bookmark-delete" data-id="${item.id}" data-cat="${catId}" onclick="event.preventDefault(); deleteBookmark('${catId}', '${item.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </a>
                    `).join('')}
                </div>
            `;
            dashboard.appendChild(section);
        }
    });

    if (!hasVisibleBookmarks) {
        dashboard.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">🔍</span>
                <p>لا توجد تصنيفات حالياً، ابدأ بإضافة رابط جديد</p>
            </div>
        `;
    }

    // Initialize listeners for new elements
    initDragAndDrop();
    initInlineEditing();
    updateStats();
};

const initInlineEditing = () => {
    document.querySelectorAll('.bookmark-name').forEach(el => {
        enableInlineEdit(el, (newName) => {
            const catId = el.dataset.catid;
            const itemId = el.dataset.itemid;
            const item = state.categories[catId].items.find(i => i.id === itemId);
            if (item) {
                item.name = newName;
                saveToStorage();
                renderDashboard(document.getElementById('searchInput').value);
            }
        });
    });

    document.querySelectorAll('.category-title').forEach(el => {
        enableInlineEdit(el, (newTitle) => {
            const catId = el.dataset.catid;
            state.categories[catId].title = newTitle;
            saveToStorage();
            renderDashboard(document.getElementById('searchInput').value);
        });
    });
};

// --- Actions ---
const addBookmark = (name, url, categoryTitle) => {
    if (!url.startsWith('http')) url = 'https://' + url;

    let catId = Object.keys(state.categories).find(id => state.categories[id].title === categoryTitle);
    if (!catId) {
        catId = 'cat_' + Date.now();
        state.categories[catId] = { title: categoryTitle, items: [], isCollapsed: false };
    }

    state.categories[catId].items.push({
        id: crypto.randomUUID(),
        name,
        url,
        isPinned: false
    });

    saveToStorage();
    renderDashboard();
};

window.deleteBookmark = (catId, itemId) => {
    if (confirm('هل أنت متأكد من حذف هذا الرابط؟')) {
        state.categories[catId].items = state.categories[catId].items.filter(item => item.id !== itemId);
        saveToStorage();
        renderDashboard();
    }
};

const deleteCategory = (catId) => {
    if (confirm(`هل أنت متأكد من حذف فئة "${state.categories[catId].title}"؟`)) {
        delete state.categories[catId];
        saveToStorage();
        renderDashboard();
    }
};

const togglePin = (catId, itemId) => {
    const item = state.categories[catId].items.find(i => i.id === itemId);
    if (item) {
        item.isPinned = !item.isPinned;
        saveToStorage();
        renderDashboard(document.getElementById('searchInput').value);
    }
};

const toggleCategory = (catId) => {
    state.categories[catId].isCollapsed = !state.categories[catId].isCollapsed;
    saveToStorage();
    renderDashboard(document.getElementById('searchInput').value);
};

// --- Backup Management ---
const restoreLocalBackup = () => {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup && confirm('هل تريد استعادة آخر نسخة احتياطية محلية؟')) {
        state = JSON.parse(backup);
        saveToStorage(false);
        renderDashboard();
        toggleDarkMode(state.settings.darkMode);
        alert('تمت الاستعادة بنجاح');
    } else if (!backup) {
        alert('لا توجد نسخة احتياطية متاحة');
    }
};

// --- Drag & Drop ---
let draggedElement = null;
let sourceCategoryId = null;

const initDragAndDrop = () => {
    document.querySelectorAll('.bookmark-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedElement = card;
            sourceCategoryId = card.closest('.bookmark-grid').dataset.cat;
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.dataset.id);
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            draggedElement = null;
        });
    });

    document.querySelectorAll('.bookmark-grid').forEach(grid => {
        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(grid, e.clientX);
            if (afterElement == null) grid.appendChild(draggedElement);
            else grid.insertBefore(draggedElement, afterElement);
        });

        grid.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetCategoryId = grid.dataset.cat;
            const itemId = e.dataTransfer.getData('text/plain');
            reorderState(sourceCategoryId, targetCategoryId, itemId, grid);
        });
    });
};

const getDragAfterElement = (container, x) => {
    const draggables = [...container.querySelectorAll('.bookmark-card:not(.dragging)')];
    return draggables.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
};

const reorderState = (sourceCat, targetCat, itemId, gridElement) => {
    if (sourceCat === targetCat) {
        const itemElements = [...gridElement.querySelectorAll('.bookmark-card')];
        const newItems = itemElements.map(el => state.categories[sourceCat].items.find(item => item.id === el.dataset.id));
        state.categories[sourceCat].items = newItems;
    } else {
        const item = state.categories[sourceCat].items.find(i => i.id === itemId);
        state.categories[sourceCat].items = state.categories[sourceCat].items.filter(i => i.id !== itemId);
        const itemElements = [...gridElement.querySelectorAll('.bookmark-card')];
        const dropIndex = itemElements.indexOf(draggedElement);
        state.categories[targetCat].items.splice(dropIndex, 0, item);
    }
    saveToStorage();
    renderDashboard();
};

// --- Dark Mode ---
const toggleDarkMode = (force) => {
    const isDark = force !== undefined ? force : !document.documentElement.hasAttribute('data-theme');
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('sunIcon').style.display = 'block';
        document.getElementById('moonIcon').style.display = 'none';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('sunIcon').style.display = 'none';
        document.getElementById('moonIcon').style.display = 'block';
    }
    state.settings.darkMode = isDark;
    saveToStorage();
};

// --- Storage Utilities ---
const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `bookmarks_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
};

const importData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.categories) {
                state = data;
                saveToStorage();
                renderDashboard();
                toggleDarkMode(state.settings.darkMode);
                alert('تم الاستيراد بنجاح');
            }
        } catch (err) { alert('ملف غير صالح'); }
    };
    reader.readAsText(file);
};

// --- Main Init ---
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    toggleDarkMode(state.settings.darkMode);

    const modal = document.getElementById('bookmarkModal');
    const addBtn = document.getElementById('addBookmarkBtn');
    const closeBtn = document.getElementById('closeModal');
    const form = document.getElementById('bookmarkForm');

    if (addBtn) addBtn.onclick = () => modal.classList.add('active');
    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
    window.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            addBookmark(document.getElementById('siteName').value, document.getElementById('siteUrl').value, document.getElementById('siteCategory').value);
            form.reset();
            modal.classList.remove('active');
        };
    }

    // Search & Keyboard Shortcuts
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.oninput = (e) => renderDashboard(e.target.value);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.value = '';
            renderDashboard('');
            searchInput.blur();
        }
    });

    document.getElementById('themeToggle').onclick = () => toggleDarkMode();
    document.getElementById('exportData').onclick = exportData;
    document.getElementById('importData').onclick = () => document.getElementById('importInput').click();
    document.getElementById('importInput').onchange = (e) => e.target.files.length > 0 && importData(e.target.files[0]);

    // Local Backup Restore via contextual action (or just a shortcut/button if we add one in HTML)
    // We'll add a simple double-click on logo for restore as a "safe" entry point or just expose it.
    document.querySelector('.logo-section h1').ondblclick = restoreLocalBackup;

    document.getElementById('dashboard').onclick = (e) => {
        const btn = e.target.closest('.delete-category');
        if (btn) deleteCategory(btn.dataset.id);
    };
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => { });
    });
}
