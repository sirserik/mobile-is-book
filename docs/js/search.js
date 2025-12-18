// Search Data - chapters with keywords
const searchData = [
    {
        title: "Введение",
        url: "chapters/00-introduction.html",
        chapter: "Введение",
        keywords: ["книга", "swift", "ios", "начало", "обзор", "введение", "ecommerce", "viper"]
    },
    {
        title: "Знакомство с Xcode",
        url: "chapters/01-xcode.html",
        chapter: "Глава 1",
        keywords: ["xcode", "ide", "установка", "симулятор", "проект", "playground", "interface builder", "apple"]
    },
    {
        title: "Основы Swift",
        url: "chapters/02-swift-basics.html",
        chapter: "Глава 2",
        keywords: ["swift", "переменные", "var", "let", "константы", "типы", "int", "string", "double", "bool", "интерполяция", "массивы", "словари", "array", "dictionary"]
    },
    {
        title: "Управление потоком",
        url: "chapters/03-control-flow.html",
        chapter: "Глава 3",
        keywords: ["if", "else", "switch", "case", "for", "while", "guard", "условия", "циклы", "control flow"]
    },
    {
        title: "Функции и Closures",
        url: "chapters/04-functions.html",
        chapter: "Глава 4",
        keywords: ["функции", "function", "closure", "замыкания", "параметры", "return", "inout", "escaping", "trailing"]
    },
    {
        title: "ООП в Swift",
        url: "chapters/05-oop.html",
        chapter: "Глава 5",
        keywords: ["ооп", "класс", "class", "struct", "структура", "наследование", "inheritance", "инициализатор", "init", "enum", "enumeration"]
    },
    {
        title: "Протоколы",
        url: "chapters/06-protocols.html",
        chapter: "Глава 6",
        keywords: ["protocol", "протокол", "extension", "расширение", "delegate", "делегат", "pop", "protocol oriented"]
    },
    {
        title: "Optionals",
        url: "chapters/07-optionals.html",
        chapter: "Глава 7",
        keywords: ["optional", "опциональ", "nil", "unwrap", "guard let", "if let", "optional chaining", "nil coalescing", "force unwrap"]
    },
    {
        title: "Управление памятью (ARC)",
        url: "chapters/08-memory.html",
        chapter: "Глава 8",
        keywords: ["память", "memory", "arc", "strong", "weak", "unowned", "retain cycle", "утечка памяти", "reference counting"]
    },
    {
        title: "Generics",
        url: "chapters/09-generics.html",
        chapter: "Глава 9",
        keywords: ["generics", "дженерики", "generic type", "where", "associated type", "type constraint"]
    },
    {
        title: "Concurrency",
        url: "chapters/10-concurrency.html",
        chapter: "Глава 10",
        keywords: ["concurrency", "async", "await", "task", "gcd", "dispatch", "многопоточность", "actor", "main thread"]
    },
    {
        title: "UIKit основы",
        url: "chapters/11-uikit-basics.html",
        chapter: "Глава 11",
        keywords: ["uikit", "uiview", "uiviewcontroller", "auto layout", "constraints", "storyboard", "uibutton", "uilabel", "uitableview"]
    },
    {
        title: "Программный UI",
        url: "chapters/12-programmatic-ui.html",
        chapter: "Глава 12",
        keywords: ["программный ui", "snapkit", "без storyboard", "scenedelegate", "nslayoutconstraint", "программные constraints"]
    },
    {
        title: "VIPER архитектура",
        url: "chapters/13-viper.html",
        chapter: "Глава 13",
        keywords: ["viper", "архитектура", "view", "interactor", "presenter", "entity", "router", "модуль", "clean architecture"]
    },
    {
        title: "Настройка проекта",
        url: "chapters/14-project-setup.html",
        chapter: "Глава 14",
        keywords: ["project setup", "spm", "swift package manager", "firebase", "cocoapods", "структура проекта"]
    },
    {
        title: "Authentication",
        url: "chapters/15-authentication.html",
        chapter: "Глава 15",
        keywords: ["authentication", "аутентификация", "firebase auth", "google sign in", "login", "register", "авторизация"]
    },
    {
        title: "Products",
        url: "chapters/16-products.html",
        chapter: "Глава 16",
        keywords: ["products", "товары", "каталог", "категории", "uicollectionview", "firestore", "product list"]
    },
    {
        title: "Cart",
        url: "chapters/17-cart.html",
        chapter: "Глава 17",
        keywords: ["cart", "корзина", "покупки", "firestore", "добавление", "удаление", "quantity"]
    },
    {
        title: "Favorites",
        url: "chapters/18-favorites.html",
        chapter: "Глава 18",
        keywords: ["favorites", "избранное", "realm", "локальная база", "wishlist", "сохранение"]
    },
    {
        title: "Orders",
        url: "chapters/19-orders.html",
        chapter: "Глава 19",
        keywords: ["orders", "заказы", "оформление", "checkout", "адреса", "история заказов"]
    },
    {
        title: "Profile",
        url: "chapters/20-profile.html",
        chapter: "Глава 20",
        keywords: ["profile", "профиль", "пользователь", "настройки", "logout", "user settings"]
    },
    {
        title: "Reusable Views",
        url: "chapters/21-reusable-views.html",
        chapter: "Глава 21",
        keywords: ["reusable", "dskit", "компоненты", "переиспользуемые", "ui components", "темизация", "theme"]
    }
];

// Determine base path based on current location
function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/chapters/')) {
        return '../';
    }
    return '';
}

// Open search modal
function openSearch() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    if (overlay && input) {
        overlay.classList.add('active');
        input.focus();
        document.body.style.overflow = 'hidden';
    }
}

// Close search modal
function closeSearch(event) {
    if (event) event.preventDefault();
    const overlay = document.getElementById('searchOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = `
            <div class="search-empty">
                <p>Введите запрос для поиска</p>
                <p class="search-hint">Поиск по названиям глав и ключевым словам</p>
            </div>
        `;
    }
}

// Perform search
function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    const basePath = getBasePath();

    if (!query || query.length < 2) {
        resultsContainer.innerHTML = `
            <div class="search-empty">
                <p>Введите запрос для поиска</p>
                <p class="search-hint">Минимум 2 символа</p>
            </div>
        `;
        return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results = searchData.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(normalizedQuery);
        const keywordMatch = item.keywords.some(kw => kw.includes(normalizedQuery));
        return titleMatch || keywordMatch;
    });

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-empty">
                <p>Ничего не найдено</p>
                <p class="search-hint">Попробуйте другой запрос</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = results.map(item => `
        <a href="${basePath}${item.url}" class="search-result-item">
            <span class="search-result-chapter">${item.chapter}</span>
            <span class="search-result-title">${highlightMatch(item.title, normalizedQuery)}</span>
            <span class="search-result-keywords">${item.keywords.slice(0, 5).join(', ')}</span>
        </a>
    `).join('');
}

// Highlight matching text
function highlightMatch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Cmd/Ctrl + K to open search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
    }
    // Escape to close search
    if (e.key === 'Escape') {
        closeSearch();
    }
    // Navigate results with arrow keys
    const overlay = document.getElementById('searchOverlay');
    if (overlay && overlay.classList.contains('active')) {
        const results = document.querySelectorAll('.search-result-item');
        const focused = document.querySelector('.search-result-item:focus');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!focused && results.length > 0) {
                results[0].focus();
            } else if (focused) {
                const index = Array.from(results).indexOf(focused);
                if (index < results.length - 1) {
                    results[index + 1].focus();
                }
            }
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (focused) {
                const index = Array.from(results).indexOf(focused);
                if (index > 0) {
                    results[index - 1].focus();
                } else {
                    document.getElementById('searchInput').focus();
                }
            }
        }
    }
});

// Create search overlay HTML if not exists
function initSearch() {
    if (!document.getElementById('searchOverlay')) {
        const searchHTML = `
            <div class="search-overlay" id="searchOverlay" onclick="closeSearch(event)">
                <div class="search-modal" onclick="event.stopPropagation()">
                    <div class="search-header">
                        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="M21 21l-4.35-4.35"></path>
                        </svg>
                        <input type="text" class="search-input" id="searchInput" placeholder="Поиск по книге..." autocomplete="off" oninput="performSearch(this.value)">
                        <button class="search-close" onclick="closeSearch(event)">
                            <kbd>Esc</kbd>
                        </button>
                    </div>
                    <div class="search-results" id="searchResults">
                        <div class="search-empty">
                            <p>Введите запрос для поиска</p>
                            <p class="search-hint">Поиск по названиям глав и ключевым словам</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', searchHTML);
    }
}

// Initialize search when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    initSearch();
}
