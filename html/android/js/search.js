// Search functionality for Android E-Commerce Book

const searchIndex = [
    // Введение
    { title: "Введение", url: "chapters/00-introduction.html", keywords: "введение о книге начало старт требования android kotlin" },
    { title: "Kotlin для JS/PHP разработчиков", url: "chapters/00a-kotlin-for-developers.html", keywords: "javascript php typescript react vue nullable data class coroutines flow suspend async" },
    // Основы
    { title: "Глава 1: Основы Compose", url: "chapters/01-compose-basics.html", keywords: "jetpack compose composable state remember modifier column row box" },
    { title: "Глава 2: MVVM + Clean Architecture", url: "chapters/02-mvvm.html", keywords: "mvvm model view viewmodel usecase repository clean architecture" },
    // Приложение
    { title: "Глава 3: Настройка проекта", url: "chapters/03-project-setup.html", keywords: "android studio gradle проект структура модули" },
    { title: "Глава 4: Retrofit + API", url: "chapters/04-api-layer.html", keywords: "retrofit okhttp moshi network api dummyjson" },
    { title: "Парсинг JSON", url: "chapters/json-parsing.html", keywords: "json parsing moshi gson retrofit модели массив объект nested вложенный annotation nullable упражнения" },
    { title: "Глава 5: Список товаров", url: "chapters/05-product-list.html", keywords: "lazycolumn lazygrid coil список товары product grid" },
    { title: "Глава 6: Детали товара", url: "chapters/06-product-detail.html", keywords: "detail screen pager изображения галерея" },
    { title: "Глава 7: Поиск", url: "chapters/07-search.html", keywords: "search searchbar поиск фильтрация flow debounce" },
    { title: "Глава 8: Избранное", url: "chapters/08-favorites.html", keywords: "favorites избранное room database datastore" },
    { title: "Глава 9: Корзина", url: "chapters/09-cart.html", keywords: "cart корзина badge количество checkout оформление" },
    { title: "Глава 10: Навигация", url: "chapters/10-navigation.html", keywords: "navigation navhost navcontroller routes deep linking" },
    // Финализация
    { title: "Глава 11: Hilt DI", url: "chapters/11-di-hilt.html", keywords: "hilt dagger dependency injection modules provides binds" },
    { title: "Глава 12: Тестирование", url: "chapters/12-testing.html", keywords: "testing junit mockito ui tests espresso" },
    { title: "Глава 13: Финал", url: "chapters/13-final.html", keywords: "финал proguard play store публикация release" },
    // Дополнительно
    { title: "Шпаргалка Kotlin vs JS", url: "chapters/cheatsheet.html", keywords: "шпаргалка cheatsheet справка kotlin javascript php типы" },
    { title: "Частые ошибки новичков", url: "chapters/common-mistakes.html", keywords: "ошибки mistakes nullable npe coroutines crash" },
    { title: "Глоссарий терминов", url: "chapters/glossary.html", keywords: "глоссарий термины словарь compose viewmodel flow coroutines" },
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
    return text.replace(regex, '<span class="text-green-500 font-semibold">$1</span>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
