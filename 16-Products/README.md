# Глава 16: Модуль товаров — Home и ProductList

## Введение

В этой главе мы создадим **главный экран приложения** — модуль Home, который показывает:
- Поиск товаров
- Категории товаров (горизонтальный список)
- Сетку товаров с возможностью добавления в избранное

Это центральный модуль приложения, с которого начинается пользовательский путь.

### Что мы создадим

```
┌─────────────────────────────────────────────────────┐
│                     Home Screen                      │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐    │
│  │ 🔍 Search products...                       │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  Categories:                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ All  │ │Electr│ │Jewel │ │Men's │ →             │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│                                                      │
│  ┌───────────┐  ┌───────────┐                       │
│  │  [Image]  │  │  [Image]  │                       │
│  │  ♡        │  │  ♡        │                       │
│  │ Product 1 │  │ Product 2 │                       │
│  │  $99.99   │  │  $149.99  │                       │
│  │  ⭐ 4.5   │  │  ⭐ 4.2   │                       │
│  └───────────┘  └───────────┘                       │
│                                                      │
│  ┌───────────┐  ┌───────────┐                       │
│  │  [Image]  │  │  [Image]  │                       │
│  │  ♡        │  │  ♡        │                       │
│  │ Product 3 │  │ Product 4 │                       │
│  │  $29.99   │  │  $199.99  │                       │
│  │  ⭐ 4.8   │  │  ⭐ 3.9   │                       │
│  └───────────┘  └───────────┘                       │
└─────────────────────────────────────────────────────┘
```

---

## 16.1 Product Entity — модель товара

Создадим модель данных для товара. Это **struct**, потому что это просто данные.

```swift
// ECommerce/Entities/Models/Product.swift

import Foundation

/// Модель товара из FakeStore API
/// https://fakestoreapi.com/docs
///
/// Пример JSON ответа:
/// {
///     "id": 1,
///     "title": "Fjallraven - Foldsack No. 1 Backpack",
///     "price": 109.95,
///     "description": "Your perfect pack...",
///     "category": "men's clothing",
///     "image": "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
///     "rating": {
///         "rate": 3.9,
///         "count": 120
///     }
/// }
struct Product: Codable, Equatable {
    let id: Int              // Уникальный идентификатор товара
    let title: String        // Название товара
    let price: Double        // Цена в долларах
    let description: String  // Описание товара
    let category: String     // Категория (electronics, jewelery, men's clothing, women's clothing)
    let image: String        // URL изображения товара
    let rating: Rating       // Рейтинг и количество отзывов

    /// Вложенная структура для рейтинга
    struct Rating: Codable, Equatable {
        let rate: Double     // Средний рейтинг (0.0 - 5.0)
        let count: Int       // Количество отзывов
    }
}

// MARK: - Computed Properties

extension Product {
    /// Форматированная цена с символом доллара
    /// Пример: "$109.95"
    var formattedPrice: String {
        return String(format: "$%.2f", price)
    }

    /// Форматированный рейтинг со звездой
    /// Пример: "⭐ 3.9 (120)"
    var formattedRating: String {
        return String(format: "⭐ %.1f (%d)", rating.rate, rating.count)
    }

    /// Категория с заглавной буквы
    /// Пример: "Men's Clothing"
    var formattedCategory: String {
        return category.capitalized
    }
}
```

**Почему struct, а не class?**
- Product — это просто данные (данные из API)
- Нам не нужно наследование
- Нам нужна независимость копий (value type)
- Codable работает автоматически со struct

---

## 16.2 Products Service — работа с API

Создадим сервис для загрузки товаров из FakeStore API.

```swift
// ECommerce/Services/ProductsService.swift

import Foundation

// MARK: - Protocol

/// Протокол сервиса товаров
/// Определяет контракт для работы с API товаров
protocol ProductsServiceProtocol {
    /// Загружает все товары
    func getProducts(completion: @escaping (Result<[Product], NetworkError>) -> Void)

    /// Загружает товары по категории
    func getProductsByCategory(
        _ category: String,
        completion: @escaping (Result<[Product], NetworkError>) -> Void
    )

    /// Загружает список всех категорий
    func getCategories(completion: @escaping (Result<[String], NetworkError>) -> Void)

    /// Загружает один товар по ID
    func getProduct(
        by id: Int,
        completion: @escaping (Result<Product, NetworkError>) -> Void
    )
}

// MARK: - Implementation

/// Реализация сервиса товаров
/// Использует FakeStore API: https://fakestoreapi.com
final class ProductsService: ProductsServiceProtocol {

    // MARK: - Properties

    /// Зависимость от NetworkManager (Dependency Injection)
    private let networkManager: NetworkManagerProtocol

    // MARK: - Init

    /// Инициализатор с внедрением зависимости
    /// - Parameter networkManager: Менеджер сети (по умолчанию shared)
    init(networkManager: NetworkManagerProtocol = NetworkManager.shared) {
        self.networkManager = networkManager
    }

    // MARK: - Products

    /// Загружает все товары
    /// Endpoint: GET /products
    func getProducts(completion: @escaping (Result<[Product], NetworkError>) -> Void) {
        // Создаём endpoint для запроса всех товаров
        let endpoint = ProductsEndpoint.products

        // Выполняем запрос через NetworkManager
        networkManager.request(
            type: [Product].self,  // Ожидаем массив Product
            url: endpoint.url,
            method: endpoint.method
        ) { result in
            // Передаём результат в completion
            // NetworkManager уже вызывает completion на main queue
            completion(result)
        }
    }

    /// Загружает товары по категории
    /// Endpoint: GET /products/category/{category}
    func getProductsByCategory(
        _ category: String,
        completion: @escaping (Result<[Product], NetworkError>) -> Void
    ) {
        let endpoint = ProductsEndpoint.productsByCategory(category)

        networkManager.request(
            type: [Product].self,
            url: endpoint.url,
            method: endpoint.method,
            completion: completion
        )
    }

    // MARK: - Categories

    /// Загружает список всех категорий
    /// Endpoint: GET /products/categories
    /// Возвращает: ["electronics", "jewelery", "men's clothing", "women's clothing"]
    func getCategories(completion: @escaping (Result<[String], NetworkError>) -> Void) {
        let endpoint = ProductsEndpoint.categories

        networkManager.request(
            type: [String].self,  // API возвращает массив строк
            url: endpoint.url,
            method: endpoint.method,
            completion: completion
        )
    }

    // MARK: - Single Product

    /// Загружает один товар по ID
    /// Endpoint: GET /products/{id}
    func getProduct(
        by id: Int,
        completion: @escaping (Result<Product, NetworkError>) -> Void
    ) {
        let endpoint = ProductsEndpoint.product(id)

        networkManager.request(
            type: Product.self,  // Ожидаем один Product
            url: endpoint.url,
            method: endpoint.method,
            completion: completion
        )
    }
}
```

### Products Endpoint — определение URL

```swift
// ECommerce/Services/ProductsEndpoint.swift

import Foundation

/// Endpoints для FakeStore API
/// Base URL: https://fakestoreapi.com
enum ProductsEndpoint: EndpointProtocol {

    /// GET /products — все товары
    case products

    /// GET /products/{id} — товар по ID
    case product(Int)

    /// GET /products/categories — список категорий
    case categories

    /// GET /products/category/{name} — товары по категории
    case productsByCategory(String)

    // MARK: - EndpointProtocol

    /// Базовый URL API
    var baseURL: String {
        return "https://fakestoreapi.com"
    }

    /// Путь к endpoint
    var path: String {
        switch self {
        case .products:
            return "/products"
        case .product(let id):
            return "/products/\(id)"
        case .categories:
            return "/products/categories"
        case .productsByCategory(let category):
            // URL encode для категорий с пробелами ("men's clothing")
            let encodedCategory = category.addingPercentEncoding(
                withAllowedCharacters: .urlPathAllowed
            ) ?? category
            return "/products/category/\(encodedCategory)"
        }
    }

    /// HTTP метод
    var method: HTTPMethods {
        return .get  // Все endpoints используют GET
    }

    /// Полный URL
    var url: String {
        return baseURL + path
    }
}
```

---

## 16.3 Home Module — VIPER архитектура

Теперь создадим полный VIPER модуль для главного экрана.

### VIPER диаграмма Home Module

```
┌─────────────────────────────────────────────────────────────────────┐
│                          HOME MODULE                                 │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│                  │ creates │                  │
│  HomeRouter      │────────►│ HomeViewController│
│                  │         │     (View)       │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │ navigates                  │ user actions
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│                  │◄────────│                  │
│  Detail/Basket   │ presents│  HomePresenter   │
│                  │         │                  │
└──────────────────┘         └────────┬─────────┘
                                      │
                             data     │ business logic
                             binding  │
                                      ▼
                             ┌──────────────────┐
                             │                  │
                             │  HomeInteractor  │
                             │                  │
                             └────────┬─────────┘
                                      │
                                      │ API calls
                                      ▼
                             ┌──────────────────┐
                             │                  │
                             │ ProductsService  │
                             │                  │
                             └──────────────────┘
```

### 16.3.1 Protocols — контракты модуля

```swift
// ECommerce/Modules/Home/HomeProtocols.swift

import UIKit

// MARK: - View Protocol

/// Протокол View для Home модуля
/// View отвечает ТОЛЬКО за отображение данных
/// Presenter говорит View ЧТО показать
protocol HomeViewProtocol: AnyObject {
    /// Ссылка на Presenter
    var presenter: HomePresenterProtocol? { get set }

    /// Показать загрузку
    func showLoading()

    /// Скрыть загрузку
    func hideLoading()

    /// Показать товары в коллекции
    /// - Parameter products: Массив товаров для отображения
    func showProducts(_ products: [Product])

    /// Показать категории
    /// - Parameter categories: Массив категорий (первая — "All")
    func showCategories(_ categories: [String])

    /// Показать сообщение об ошибке
    /// - Parameter error: Объект ошибки
    func showError(_ error: Error)

    /// Перезагрузить данные в коллекции
    func reloadData()
}

// MARK: - Presenter Protocol

/// Протокол Presenter для Home модуля
/// Presenter — связующее звено между View и Interactor
/// Получает действия от View, запрашивает данные у Interactor
protocol HomePresenterProtocol: AnyObject {
    /// Ссылки на другие компоненты VIPER
    var view: HomeViewProtocol? { get set }
    var interactor: HomeInteractorProtocol? { get set }
    var router: HomeRouterProtocol? { get set }

    /// View загрузился — начинаем загрузку данных
    func viewDidLoad()

    /// View появится на экране
    func viewWillAppear()

    /// Получить количество товаров для отображения
    func numberOfProducts() -> Int

    /// Получить товар по индексу
    func product(at index: Int) -> Product?

    /// Пользователь выбрал товар — переход на детали
    func didSelectProduct(at index: Int)

    /// Пользователь нажал на избранное
    func didTapFavorite(at index: Int)

    /// Пользователь выбрал категорию
    func didSelectCategory(_ category: String)

    /// Пользователь ввёл поисковый запрос
    func didSearch(with query: String)

    /// Получить количество товаров в корзине (для badge)
    func getBasketCount() -> Int
}

// MARK: - Interactor Protocol

/// Протокол Interactor для Home модуля
/// Interactor содержит бизнес-логику
/// Работает с сервисами, обрабатывает данные
protocol HomeInteractorProtocol: AnyObject {
    /// Ссылка на output (обычно Presenter)
    var output: HomeInteractorOutputProtocol? { get set }

    /// Загрузить все товары
    func fetchProducts()

    /// Загрузить товары по категории
    func fetchProductsByCategory(_ category: String)

    /// Загрузить список категорий
    func fetchCategories()

    /// Добавить/удалить товар из избранного
    func toggleFavorite(product: Product)

    /// Проверить, в избранном ли товар
    func isFavorite(productId: Int) -> Bool

    /// Получить количество товаров в корзине
    func getBasketCount() -> Int
}

// MARK: - Interactor Output Protocol

/// Протокол для передачи данных из Interactor в Presenter
/// Interactor вызывает эти методы когда данные готовы
protocol HomeInteractorOutputProtocol: AnyObject {
    /// Товары успешно загружены
    func didFetchProducts(_ products: [Product])

    /// Ошибка при загрузке товаров
    func didFailFetchProducts(_ error: Error)

    /// Категории успешно загружены
    func didFetchCategories(_ categories: [String])

    /// Ошибка при загрузке категорий
    func didFailFetchCategories(_ error: Error)
}

// MARK: - Router Protocol

/// Протокол Router для Home модуля
/// Router отвечает за навигацию
protocol HomeRouterProtocol: AnyObject {
    /// Создать модуль Home
    static func createModule() -> UIViewController

    /// Перейти на экран деталей товара
    func navigateToProductDetail(from view: HomeViewProtocol?, product: Product)

    /// Перейти в корзину
    func navigateToBasket(from view: HomeViewProtocol?)
}
```

### 16.3.2 Router — создание модуля и навигация

```swift
// ECommerce/Modules/Home/HomeRouter.swift

import UIKit

/// Router модуля Home
/// Отвечает за:
/// 1. Сборку VIPER модуля (dependency injection)
/// 2. Навигацию на другие экраны
final class HomeRouter: HomeRouterProtocol {

    // MARK: - Properties

    /// Слабая ссылка на ViewController для навигации
    weak var viewController: UIViewController?

    // MARK: - Module Creation

    /// Создаёт и собирает VIPER модуль Home
    /// Это точка входа в модуль
    ///
    /// Паттерн: Factory Method + Dependency Injection
    ///
    /// - Returns: Готовый UIViewController с настроенным VIPER
    static func createModule() -> UIViewController {
        // 1. Создаём View
        let view = HomeViewController()

        // 2. Создаём остальные компоненты
        let presenter = HomePresenter()
        let interactor = HomeInteractor()
        let router = HomeRouter()

        // 3. Связываем компоненты (Dependency Injection)
        view.presenter = presenter

        presenter.view = view
        presenter.interactor = interactor
        presenter.router = router

        interactor.output = presenter

        router.viewController = view

        // 4. Возвращаем готовый View
        return view
    }

    // MARK: - Navigation

    /// Переход на экран деталей товара
    /// - Parameters:
    ///   - view: Текущий View (для получения navigation controller)
    ///   - product: Товар для отображения
    func navigateToProductDetail(from view: HomeViewProtocol?, product: Product) {
        // Создаём модуль деталей товара
        let detailVC = ProductDetailRouter.createModule(with: product)

        // Получаем navigation controller и делаем push
        if let sourceView = view as? UIViewController {
            sourceView.navigationController?.pushViewController(detailVC, animated: true)
        }
    }

    /// Переход в корзину
    func navigateToBasket(from view: HomeViewProtocol?) {
        let basketVC = BasketRouter.createModule()

        if let sourceView = view as? UIViewController {
            sourceView.navigationController?.pushViewController(basketVC, animated: true)
        }
    }
}
```

### 16.3.3 Interactor — бизнес-логика

```swift
// ECommerce/Modules/Home/HomeInteractor.swift

import Foundation

/// Interactor модуля Home
/// Содержит всю бизнес-логику:
/// - Загрузка товаров из API
/// - Работа с избранным (Realm)
/// - Фильтрация и поиск
final class HomeInteractor: HomeInteractorProtocol {

    // MARK: - Properties

    /// Output для передачи данных в Presenter
    weak var output: HomeInteractorOutputProtocol?

    /// Сервис для работы с API товаров
    private let productsService: ProductsServiceProtocol

    /// Менеджер для работы с Realm (избранное)
    private let realmManager: RealmManagerProtocol

    /// Менеджер корзины
    private let basketManager: BasketManagerProtocol

    /// Кэш загруженных товаров (для поиска и фильтрации)
    private var cachedProducts: [Product] = []

    // MARK: - Init

    /// Инициализатор с внедрением зависимостей
    /// - Parameters:
    ///   - productsService: Сервис товаров (по умолчанию ProductsService)
    ///   - realmManager: Менеджер Realm (по умолчанию shared)
    ///   - basketManager: Менеджер корзины (по умолчанию shared)
    init(
        productsService: ProductsServiceProtocol = ProductsService(),
        realmManager: RealmManagerProtocol = RealmManager.shared,
        basketManager: BasketManagerProtocol = BasketManager.shared
    ) {
        self.productsService = productsService
        self.realmManager = realmManager
        self.basketManager = basketManager
    }

    // MARK: - Fetch Products

    /// Загружает все товары из API
    func fetchProducts() {
        productsService.getProducts { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .success(let products):
                // Сохраняем в кэш для поиска
                self.cachedProducts = products
                // Передаём в Presenter
                self.output?.didFetchProducts(products)

            case .failure(let error):
                self.output?.didFailFetchProducts(error)
            }
        }
    }

    /// Загружает товары по категории
    /// - Parameter category: Название категории
    func fetchProductsByCategory(_ category: String) {
        // Если "All" — загружаем все товары
        if category.lowercased() == "all" {
            fetchProducts()
            return
        }

        productsService.getProductsByCategory(category) { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .success(let products):
                self.cachedProducts = products
                self.output?.didFetchProducts(products)

            case .failure(let error):
                self.output?.didFailFetchProducts(error)
            }
        }
    }

    // MARK: - Fetch Categories

    /// Загружает список категорий из API
    func fetchCategories() {
        productsService.getCategories { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .success(var categories):
                // Добавляем "All" в начало списка
                categories.insert("all", at: 0)
                // Делаем первую букву заглавной
                let formattedCategories = categories.map { $0.capitalized }
                self.output?.didFetchCategories(formattedCategories)

            case .failure(let error):
                self.output?.didFailFetchCategories(error)
            }
        }
    }

    // MARK: - Favorites

    /// Добавляет или удаляет товар из избранного
    /// - Parameter product: Товар для добавления/удаления
    func toggleFavorite(product: Product) {
        // Конвертируем Product в FavoriteProduct (Realm object)
        let favoriteProduct = FavoriteProduct(from: product)

        // Проверяем, есть ли уже в избранном
        if isFavorite(productId: product.id) {
            // Удаляем из избранного
            realmManager.delete(favoriteProduct) { result in
                switch result {
                case .success:
                    print("✅ Removed from favorites: \(product.title)")
                case .failure(let error):
                    print("❌ Failed to remove from favorites: \(error)")
                }
            }
        } else {
            // Добавляем в избранное
            realmManager.add(favoriteProduct) { result in
                switch result {
                case .success:
                    print("✅ Added to favorites: \(product.title)")
                case .failure(let error):
                    print("❌ Failed to add to favorites: \(error)")
                }
            }
        }
    }

    /// Проверяет, находится ли товар в избранном
    /// - Parameter productId: ID товара
    /// - Returns: true если товар в избранном
    func isFavorite(productId: Int) -> Bool {
        let favorites: [FavoriteProduct] = realmManager.fetch()
        return favorites.contains { $0.id == productId }
    }

    // MARK: - Basket

    /// Получает количество товаров в корзине
    /// - Returns: Количество позиций в корзине
    func getBasketCount() -> Int {
        return basketManager.getBasketItems().count
    }
}
```

### 16.3.4 Presenter — связующее звено

```swift
// ECommerce/Modules/Home/HomePresenter.swift

import Foundation

/// Presenter модуля Home
/// Связывает View и Interactor
/// Обрабатывает действия пользователя
/// Форматирует данные для отображения
final class HomePresenter: HomePresenterProtocol {

    // MARK: - VIPER References

    /// Слабая ссылка на View (избегаем retain cycle)
    weak var view: HomeViewProtocol?

    /// Сильная ссылка на Interactor (Presenter владеет Interactor)
    var interactor: HomeInteractorProtocol?

    /// Сильная ссылка на Router
    var router: HomeRouterProtocol?

    // MARK: - Properties

    /// Текущие отображаемые товары
    private var products: [Product] = []

    /// Все загруженные товары (для поиска)
    private var allProducts: [Product] = []

    /// Текущая выбранная категория
    private var selectedCategory: String = "All"

    /// Текущий поисковый запрос
    private var currentSearchQuery: String = ""

    // MARK: - Lifecycle

    /// Вызывается когда View загружен
    /// Начинаем загрузку данных
    func viewDidLoad() {
        // Показываем индикатор загрузки
        view?.showLoading()

        // Загружаем категории и товары параллельно
        interactor?.fetchCategories()
        interactor?.fetchProducts()
    }

    /// Вызывается когда View появится на экране
    /// Обновляем данные (например, badge корзины)
    func viewWillAppear() {
        // Обновляем View (например, состояние избранного могло измениться)
        view?.reloadData()
    }

    // MARK: - Data Source

    /// Возвращает количество товаров для отображения
    func numberOfProducts() -> Int {
        return products.count
    }

    /// Возвращает товар по индексу
    /// - Parameter index: Индекс в массиве
    /// - Returns: Товар или nil
    func product(at index: Int) -> Product? {
        guard index >= 0 && index < products.count else { return nil }
        return products[index]
    }

    // MARK: - User Actions

    /// Пользователь выбрал товар
    /// - Parameter index: Индекс выбранного товара
    func didSelectProduct(at index: Int) {
        guard let product = product(at: index) else { return }
        // Переходим на экран деталей
        router?.navigateToProductDetail(from: view, product: product)
    }

    /// Пользователь нажал на кнопку избранного
    /// - Parameter index: Индекс товара
    func didTapFavorite(at index: Int) {
        guard let product = product(at: index) else { return }
        // Переключаем состояние избранного
        interactor?.toggleFavorite(product: product)
        // Обновляем UI
        view?.reloadData()
    }

    /// Пользователь выбрал категорию
    /// - Parameter category: Название категории
    func didSelectCategory(_ category: String) {
        selectedCategory = category
        view?.showLoading()

        if category.lowercased() == "all" {
            // Если выбрали "All" — показываем все товары
            interactor?.fetchProducts()
        } else {
            // Иначе — фильтруем по категории
            interactor?.fetchProductsByCategory(category.lowercased())
        }
    }

    /// Пользователь ввёл поисковый запрос
    /// - Parameter query: Текст поиска
    func didSearch(with query: String) {
        currentSearchQuery = query

        if query.isEmpty {
            // Если запрос пустой — показываем все товары текущей категории
            products = allProducts
        } else {
            // Фильтруем по названию (case-insensitive)
            products = allProducts.filter { product in
                product.title.lowercased().contains(query.lowercased())
            }
        }

        view?.showProducts(products)
    }

    /// Получает количество товаров в корзине
    func getBasketCount() -> Int {
        return interactor?.getBasketCount() ?? 0
    }
}

// MARK: - InteractorOutput

extension HomePresenter: HomeInteractorOutputProtocol {

    /// Товары успешно загружены
    func didFetchProducts(_ products: [Product]) {
        // Сохраняем все товары для поиска
        self.allProducts = products

        // Применяем текущий поисковый запрос
        if currentSearchQuery.isEmpty {
            self.products = products
        } else {
            self.products = products.filter { product in
                product.title.lowercased().contains(currentSearchQuery.lowercased())
            }
        }

        // Обновляем View
        view?.hideLoading()
        view?.showProducts(self.products)
    }

    /// Ошибка при загрузке товаров
    func didFailFetchProducts(_ error: Error) {
        view?.hideLoading()
        view?.showError(error)
    }

    /// Категории успешно загружены
    func didFetchCategories(_ categories: [String]) {
        view?.showCategories(categories)
    }

    /// Ошибка при загрузке категорий
    func didFailFetchCategories(_ error: Error) {
        // Если не удалось загрузить категории — показываем только "All"
        view?.showCategories(["All"])
    }
}
```

### 16.3.5 View — HomeViewController

```swift
// ECommerce/Modules/Home/HomeViewController.swift

import UIKit
import SnapKit

/// ViewController главного экрана
/// Отображает:
/// - Search bar для поиска
/// - Горизонтальный список категорий
/// - Сетку товаров (2 колонки)
final class HomeViewController: UIViewController {

    // MARK: - VIPER

    var presenter: HomePresenterProtocol?

    // MARK: - UI Elements

    /// Поле поиска
    private let searchBar: UISearchBar = {
        let searchBar = UISearchBar()
        searchBar.placeholder = "Search products..."
        searchBar.searchBarStyle = .minimal
        searchBar.backgroundColor = .clear
        return searchBar
    }()

    /// Коллекция категорий (горизонтальная)
    private lazy var categoriesCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .horizontal
        layout.estimatedItemSize = UICollectionViewFlowLayout.automaticSize
        layout.minimumInteritemSpacing = 8
        layout.sectionInset = UIEdgeInsets(top: 0, left: 16, bottom: 0, right: 16)

        let cv = UICollectionView(frame: .zero, collectionViewLayout: layout)
        cv.backgroundColor = .clear
        cv.showsHorizontalScrollIndicator = false
        cv.delegate = self
        cv.dataSource = self
        cv.register(CategoryCell.self, forCellWithReuseIdentifier: CategoryCell.identifier)
        return cv
    }()

    /// Коллекция товаров (сетка 2 колонки)
    private lazy var productsCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .vertical
        layout.minimumLineSpacing = 16
        layout.minimumInteritemSpacing = 16
        layout.sectionInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)

        let cv = UICollectionView(frame: .zero, collectionViewLayout: layout)
        cv.backgroundColor = .clear
        cv.showsVerticalScrollIndicator = true
        cv.delegate = self
        cv.dataSource = self
        cv.register(ProductCell.self, forCellWithReuseIdentifier: ProductCell.identifier)
        return cv
    }()

    /// Индикатор загрузки
    private let activityIndicator: UIActivityIndicatorView = {
        let indicator = UIActivityIndicatorView(style: .large)
        indicator.hidesWhenStopped = true
        return indicator
    }()

    // MARK: - Data

    /// Массив категорий для отображения
    private var categories: [String] = []

    /// Индекс выбранной категории
    private var selectedCategoryIndex: Int = 0

    /// Массив товаров для отображения
    private var products: [Product] = []

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupDelegates()
        presenter?.viewDidLoad()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        presenter?.viewWillAppear()
        updateBasketBadge()
    }

    // MARK: - Setup UI

    private func setupUI() {
        view.backgroundColor = .systemBackground
        title = "Shop"

        // Navigation bar
        navigationController?.navigationBar.prefersLargeTitles = true

        // Кнопка корзины в навигации
        let basketButton = UIBarButtonItem(
            image: UIImage(systemName: "cart"),
            style: .plain,
            target: self,
            action: #selector(basketButtonTapped)
        )
        navigationItem.rightBarButtonItem = basketButton

        // Добавляем subviews
        view.addSubview(searchBar)
        view.addSubview(categoriesCollectionView)
        view.addSubview(productsCollectionView)
        view.addSubview(activityIndicator)

        // Layout
        searchBar.snp.makeConstraints { make in
            make.top.equalTo(view.safeAreaLayoutGuide).offset(8)
            make.leading.trailing.equalToSuperview().inset(8)
            make.height.equalTo(44)
        }

        categoriesCollectionView.snp.makeConstraints { make in
            make.top.equalTo(searchBar.snp.bottom).offset(8)
            make.leading.trailing.equalToSuperview()
            make.height.equalTo(44)
        }

        productsCollectionView.snp.makeConstraints { make in
            make.top.equalTo(categoriesCollectionView.snp.bottom).offset(8)
            make.leading.trailing.bottom.equalToSuperview()
        }

        activityIndicator.snp.makeConstraints { make in
            make.center.equalToSuperview()
        }
    }

    private func setupDelegates() {
        searchBar.delegate = self
    }

    // MARK: - Actions

    @objc private func basketButtonTapped() {
        // Переход в корзину через Router
        if let router = presenter?.router as? HomeRouter {
            router.navigateToBasket(from: self)
        }
    }

    /// Обновляет badge на кнопке корзины
    private func updateBasketBadge() {
        let count = presenter?.getBasketCount() ?? 0
        if count > 0 {
            navigationItem.rightBarButtonItem?.setBadge(text: "\(count)")
        } else {
            navigationItem.rightBarButtonItem?.setBadge(text: nil)
        }
    }
}

// MARK: - HomeViewProtocol

extension HomeViewController: HomeViewProtocol {

    func showLoading() {
        activityIndicator.startAnimating()
    }

    func hideLoading() {
        activityIndicator.stopAnimating()
    }

    func showProducts(_ products: [Product]) {
        self.products = products
        productsCollectionView.reloadData()
    }

    func showCategories(_ categories: [String]) {
        self.categories = categories
        categoriesCollectionView.reloadData()
    }

    func showError(_ error: Error) {
        let alert = UIAlertController(
            title: "Error",
            message: error.localizedDescription,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    func reloadData() {
        productsCollectionView.reloadData()
        updateBasketBadge()
    }
}

// MARK: - UISearchBarDelegate

extension HomeViewController: UISearchBarDelegate {

    func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
        presenter?.didSearch(with: searchText)
    }

    func searchBarSearchButtonClicked(_ searchBar: UISearchBar) {
        searchBar.resignFirstResponder()
    }
}

// MARK: - UICollectionViewDataSource

extension HomeViewController: UICollectionViewDataSource {

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        if collectionView == categoriesCollectionView {
            return categories.count
        } else {
            return products.count
        }
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        if collectionView == categoriesCollectionView {
            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: CategoryCell.identifier,
                for: indexPath
            ) as! CategoryCell

            let isSelected = indexPath.item == selectedCategoryIndex
            cell.configure(with: categories[indexPath.item], isSelected: isSelected)
            return cell
        } else {
            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: ProductCell.identifier,
                for: indexPath
            ) as! ProductCell

            let product = products[indexPath.item]
            let isFavorite = presenter?.interactor?.isFavorite(productId: product.id) ?? false
            cell.configure(with: product, isFavorite: isFavorite)
            cell.onFavoriteTapped = { [weak self] in
                self?.presenter?.didTapFavorite(at: indexPath.item)
            }
            return cell
        }
    }
}

// MARK: - UICollectionViewDelegate

extension HomeViewController: UICollectionViewDelegate {

    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        if collectionView == categoriesCollectionView {
            selectedCategoryIndex = indexPath.item
            categoriesCollectionView.reloadData()
            presenter?.didSelectCategory(categories[indexPath.item])
        } else {
            presenter?.didSelectProduct(at: indexPath.item)
        }
    }
}

// MARK: - UICollectionViewDelegateFlowLayout

extension HomeViewController: UICollectionViewDelegateFlowLayout {

    func collectionView(
        _ collectionView: UICollectionView,
        layout collectionViewLayout: UICollectionViewLayout,
        sizeForItemAt indexPath: IndexPath
    ) -> CGSize {
        if collectionView == productsCollectionView {
            // Размер ячейки товара: 2 колонки с отступами
            let padding: CGFloat = 16
            let spacing: CGFloat = 16
            let availableWidth = collectionView.bounds.width - (padding * 2) - spacing
            let itemWidth = availableWidth / 2
            let itemHeight = itemWidth * 1.5  // Соотношение сторон
            return CGSize(width: itemWidth, height: itemHeight)
        }
        // Для категорий — автоматический размер
        return CGSize(width: 100, height: 36)
    }
}
```

---

## 16.4 Ячейки — ProductCell и CategoryCell

### ProductCell — ячейка товара

```swift
// ECommerce/Modules/Home/Cells/ProductCell.swift

import UIKit
import SnapKit
import SDWebImage

/// Ячейка для отображения товара в сетке
final class ProductCell: UICollectionViewCell {

    // MARK: - Static

    static let identifier = "ProductCell"

    // MARK: - Callback

    /// Вызывается при нажатии на кнопку избранного
    var onFavoriteTapped: (() -> Void)?

    // MARK: - UI Elements

    /// Изображение товара
    private let productImageView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode = .scaleAspectFit
        iv.clipsToBounds = true
        iv.backgroundColor = .systemGray6
        return iv
    }()

    /// Кнопка добавления в избранное
    private let favoriteButton: UIButton = {
        let button = UIButton(type: .system)
        button.setImage(UIImage(systemName: "heart"), for: .normal)
        button.tintColor = .systemGray
        return button
    }()

    /// Название товара
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 14, weight: .medium)
        label.textColor = .label
        label.numberOfLines = 2
        return label
    }()

    /// Цена товара
    private let priceLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 16, weight: .bold)
        label.textColor = .systemBlue
        return label
    }()

    /// Рейтинг товара
    private let ratingLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 12)
        label.textColor = .secondaryLabel
        return label
    }()

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
        setupActions()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupUI() {
        // Стиль ячейки
        contentView.backgroundColor = .systemBackground
        contentView.layer.cornerRadius = 12
        contentView.layer.shadowColor = UIColor.black.cgColor
        contentView.layer.shadowOpacity = 0.1
        contentView.layer.shadowOffset = CGSize(width: 0, height: 2)
        contentView.layer.shadowRadius = 4

        // Добавляем subviews
        contentView.addSubview(productImageView)
        contentView.addSubview(favoriteButton)
        contentView.addSubview(titleLabel)
        contentView.addSubview(priceLabel)
        contentView.addSubview(ratingLabel)

        // Layout
        productImageView.snp.makeConstraints { make in
            make.top.leading.trailing.equalToSuperview().inset(8)
            make.height.equalTo(contentView.snp.width).multipliedBy(0.6)
        }

        favoriteButton.snp.makeConstraints { make in
            make.top.trailing.equalToSuperview().inset(8)
            make.size.equalTo(32)
        }

        titleLabel.snp.makeConstraints { make in
            make.top.equalTo(productImageView.snp.bottom).offset(8)
            make.leading.trailing.equalToSuperview().inset(8)
        }

        priceLabel.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(4)
            make.leading.equalToSuperview().inset(8)
        }

        ratingLabel.snp.makeConstraints { make in
            make.top.equalTo(priceLabel.snp.bottom).offset(4)
            make.leading.equalToSuperview().inset(8)
            make.bottom.lessThanOrEqualToSuperview().inset(8)
        }
    }

    private func setupActions() {
        favoriteButton.addTarget(self, action: #selector(favoriteButtonTapped), for: .touchUpInside)
    }

    // MARK: - Actions

    @objc private func favoriteButtonTapped() {
        onFavoriteTapped?()
    }

    // MARK: - Configure

    /// Настраивает ячейку данными товара
    /// - Parameters:
    ///   - product: Товар для отображения
    ///   - isFavorite: Находится ли товар в избранном
    func configure(with product: Product, isFavorite: Bool) {
        titleLabel.text = product.title
        priceLabel.text = product.formattedPrice
        ratingLabel.text = product.formattedRating

        // Загружаем изображение с помощью SDWebImage
        if let url = URL(string: product.image) {
            productImageView.sd_setImage(
                with: url,
                placeholderImage: UIImage(systemName: "photo")
            )
        }

        // Обновляем кнопку избранного
        let heartImage = isFavorite ? "heart.fill" : "heart"
        let heartColor: UIColor = isFavorite ? .systemRed : .systemGray
        favoriteButton.setImage(UIImage(systemName: heartImage), for: .normal)
        favoriteButton.tintColor = heartColor
    }

    // MARK: - Reuse

    override func prepareForReuse() {
        super.prepareForReuse()
        productImageView.image = nil
        titleLabel.text = nil
        priceLabel.text = nil
        ratingLabel.text = nil
        favoriteButton.setImage(UIImage(systemName: "heart"), for: .normal)
        favoriteButton.tintColor = .systemGray
        onFavoriteTapped = nil
    }
}
```

### CategoryCell — ячейка категории

```swift
// ECommerce/Modules/Home/Cells/CategoryCell.swift

import UIKit
import SnapKit

/// Ячейка для отображения категории
final class CategoryCell: UICollectionViewCell {

    // MARK: - Static

    static let identifier = "CategoryCell"

    // MARK: - UI Elements

    /// Label с названием категории
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 14, weight: .medium)
        label.textAlignment = .center
        return label
    }()

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupUI() {
        contentView.layer.cornerRadius = 18
        contentView.layer.borderWidth = 1

        contentView.addSubview(titleLabel)

        titleLabel.snp.makeConstraints { make in
            make.edges.equalToSuperview().inset(UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 16))
        }
    }

    // MARK: - Configure

    /// Настраивает ячейку категории
    /// - Parameters:
    ///   - category: Название категории
    ///   - isSelected: Выбрана ли категория
    func configure(with category: String, isSelected: Bool) {
        titleLabel.text = category

        if isSelected {
            // Выбранная категория — синий фон
            contentView.backgroundColor = .systemBlue
            contentView.layer.borderColor = UIColor.systemBlue.cgColor
            titleLabel.textColor = .white
        } else {
            // Невыбранная — прозрачный фон с рамкой
            contentView.backgroundColor = .clear
            contentView.layer.borderColor = UIColor.systemGray3.cgColor
            titleLabel.textColor = .label
        }
    }

    // MARK: - Reuse

    override func prepareForReuse() {
        super.prepareForReuse()
        titleLabel.text = nil
        contentView.backgroundColor = .clear
    }
}
```

---

## 16.5 FavoriteProduct — модель для Realm

```swift
// ECommerce/Entities/RealmObjects/FavoriteProduct.swift

import Foundation
import RealmSwift

/// Модель избранного товара для хранения в Realm
/// Realm требует class, наследующийся от Object
final class FavoriteProduct: Object {

    // MARK: - Properties

    /// Первичный ключ — ID товара
    @Persisted(primaryKey: true) var id: Int = 0

    /// Название товара
    @Persisted var title: String = ""

    /// Цена товара
    @Persisted var price: Double = 0.0

    /// Описание товара
    @Persisted var productDescription: String = ""

    /// Категория товара
    @Persisted var category: String = ""

    /// URL изображения
    @Persisted var image: String = ""

    /// Рейтинг товара
    @Persisted var ratingRate: Double = 0.0

    /// Количество отзывов
    @Persisted var ratingCount: Int = 0

    // MARK: - Init

    /// Пустой инициализатор (требуется Realm)
    convenience override init() {
        self.init()
    }

    /// Инициализатор из Product
    /// - Parameter product: Товар для сохранения
    convenience init(from product: Product) {
        self.init()
        self.id = product.id
        self.title = product.title
        self.price = product.price
        self.productDescription = product.description
        self.category = product.category
        self.image = product.image
        self.ratingRate = product.rating.rate
        self.ratingCount = product.rating.count
    }

    // MARK: - Conversion

    /// Конвертирует обратно в Product
    /// - Returns: Product структура
    func toProduct() -> Product {
        return Product(
            id: id,
            title: title,
            price: price,
            description: productDescription,
            category: category,
            image: image,
            rating: Product.Rating(
                rate: ratingRate,
                count: ratingCount
            )
        )
    }
}
```

---

## 16.6 Итоги главы

В этой главе мы создали полный **Home Module** по архитектуре VIPER:

✅ **Product Entity** — модель товара с Codable и computed properties

✅ **ProductsService** — сервис для работы с FakeStore API

✅ **ProductsEndpoint** — определение URL endpoints

✅ **HomeProtocols** — контракты для всех компонентов VIPER

✅ **HomeRouter** — сборка модуля и навигация

✅ **HomeInteractor** — бизнес-логика, работа с API и Realm

✅ **HomePresenter** — связующее звено, форматирование данных

✅ **HomeViewController** — отображение UI

✅ **ProductCell** — ячейка товара с кнопкой избранного

✅ **CategoryCell** — ячейка категории

✅ **FavoriteProduct** — модель Realm для избранного

### Ключевые концепции

1. **VIPER разделение** — каждый компонент отвечает за своё:
   - View → только отображение
   - Presenter → связь и форматирование
   - Interactor → бизнес-логика
   - Router → навигация

2. **Dependency Injection** — зависимости передаются через init

3. **Protocols** — все компоненты общаются через протоколы

4. **Weak references** — View и Output всегда weak

---

## Следующая глава

В [Главе 17](../17-Cart/README.md) мы создадим экран деталей товара и модуль корзины.
