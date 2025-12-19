// Search functionality for SwiftUI E-Commerce Book

const searchIndex = [
    // Главы книги
    { title: "Введение", url: "chapters/00-introduction.html", keywords: "введение о книге начало старт требования" },
    { title: "Swift для JS/PHP разработчиков", url: "chapters/00a-swift-for-developers.html", keywords: "javascript php typescript react vue optional типизация state binding observable property wrapper closure async await struct class" },
    { title: "Глава 1: Основы SwiftUI", url: "chapters/01-swiftui-basics.html", keywords: "swiftui view state binding модификаторы vstack hstack zstack" },
    { title: "Глава 2: MVVM архитектура", url: "chapters/02-mvvm.html", keywords: "mvvm model view viewmodel observable observedobject архитектура" },
    { title: "Глава 3: Настройка проекта", url: "chapters/03-project-setup.html", keywords: "xcode проект spm swift package manager структура" },
    { title: "Глава 4: API Layer", url: "chapters/04-api-layer.html", keywords: "api network urlsession async await json codable dummyjson" },
    { title: "Глава 5: Список товаров", url: "chapters/05-product-list.html", keywords: "lazyvgrid asyncimage список товары product grid" },
    { title: "Глава 6: Детали товара", url: "chapters/06-product-detail.html", keywords: "detail tabview slider изображения галерея" },
    { title: "Глава 7: Поиск", url: "chapters/07-search.html", keywords: "search searchable поиск фильтрация debounce" },
    { title: "Глава 8: Избранное", url: "chapters/08-favorites.html", keywords: "favorites избранное userdefaults appstorage сердце" },
    { title: "Глава 9: Корзина", url: "chapters/09-cart.html", keywords: "cart корзина badge количество checkout оформление" },
    { title: "Глава 10: Навигация", url: "chapters/10-navigation.html", keywords: "navigation navigationstack tabview router deep linking" },
    { title: "Глава 11: Тестирование", url: "chapters/11-testing.html", keywords: "testing unit ui tests xctest mock" },
    { title: "Глава 12: Финал", url: "chapters/12-final.html", keywords: "финал анимации app store публикация итог" },
    // Дополнительные материалы
    { title: "Шпаргалка Swift vs JS", url: "chapters/cheatsheet.html", keywords: "шпаргалка cheatsheet справка swift javascript php типы массивы функции closures" },
    { title: "Частые ошибки новичков", url: "chapters/common-mistakes.html", keywords: "ошибки mistakes let var optional unwrap state binding crash" },
    { title: "Практические задания", url: "chapters/exercises.html", keywords: "задания упражнения тесты quiz практика exercises" },
    { title: "Глоссарий терминов", url: "chapters/glossary.html", keywords: "глоссарий термины словарь optional struct class protocol enum closure state binding observable" },
    { title: "Советы по Xcode", url: "chapters/xcode-tips.html", keywords: "xcode горячие клавиши shortcuts preview debug навигация" },
    { title: "Визуальные схемы", url: "chapters/diagrams.html", keywords: "схемы диаграммы mvvm архитектура flow данные структура" },
    { title: "Отладка", url: "chapters/debugging.html", keywords: "отладка debug print breakpoint ошибки crash lldb консоль" },
];

function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');

    if (!query || query.length < 2) {
        resultsContainer.innerHTML = `
            <div class="p-8 text-center text-zinc-400">
                <p>Введите запрос для поиска</p>
                <p class="text-sm mt-1">Минимум 2 символа</p>
            </div>
        `;
        return;
    }

    const lowerQuery = query.toLowerCase();
    const results = searchIndex.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.keywords.toLowerCase().includes(lowerQuery)
    );

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="p-8 text-center text-zinc-400">
                <p>Ничего не найдено</p>
                <p class="text-sm mt-1">Попробуйте другой запрос</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = results.map(item => `
        <a href="${item.url}" class="block px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
            <div class="font-medium text-zinc-900 dark:text-white">${highlightMatch(item.title, query)}</div>
            <div class="text-sm text-zinc-500 mt-1">${item.keywords.split(' ').slice(0, 5).join(', ')}</div>
        </a>
    `).join('');
}

function highlightMatch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<span class="text-blue-500 font-semibold">$1</span>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
