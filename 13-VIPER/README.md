# Глава 13: Архитектура VIPER

## Введение

Архитектура — это способ организации кода. Хорошая архитектура делает код:
- Понятным и читаемым
- Легко тестируемым
- Простым для расширения
- Удобным для командной работы

VIPER — это архитектурный паттерн, разделяющий код на 5 компонентов с чёткими обязанностями.

---

## 13.1 Зачем нужна архитектура

### Проблема "Massive View Controller"

Без архитектуры весь код оказывается в ViewController:

```swift
// ❌ ПЛОХО: 1000+ строк в одном файле
class ProductViewController: UIViewController {
    // UI элементы
    // Сетевые запросы
    // Бизнес-логика
    // Навигация
    // Работа с БД
    // ...
}
```

**Проблемы:**
- Сложно найти нужный код
- Невозможно тестировать
- Трудно работать в команде
- Сложно вносить изменения

### Решение: разделение ответственности

```swift
// ✅ ХОРОШО: каждый файл отвечает за одно
View        // Только отображение
Interactor  // Только бизнес-логика
Presenter   // Только подготовка данных
Entity      // Только модели данных
Router      // Только навигация
```

---

## 13.2 Обзор архитектур

### MVC (Model-View-Controller)

```
┌─────────┐     ┌────────────┐     ┌───────┐
│  Model  │◄────│ Controller │────►│ View  │
└─────────┘     └────────────┘     └───────┘
```

**Минусы:** Controller становится огромным

### MVP (Model-View-Presenter)

```
┌─────────┐     ┌───────────┐     ┌───────┐
│  Model  │◄────│ Presenter │◄────│ View  │
└─────────┘     └───────────┘     └───────┘
```

**Лучше:** Presenter можно тестировать

### MVVM (Model-View-ViewModel)

```
┌─────────┐     ┌───────────┐     ┌───────┐
│  Model  │◄────│ ViewModel │◄───►│ View  │
└─────────┘     └───────────┘     └───────┘
                     ▲ binding
```

**Популярен:** Особенно со SwiftUI и Combine

### VIPER

```
┌──────────┐   ┌───────────┐   ┌────────┐
│  Entity  │◄──│ Interactor│◄──│Presenter│
└──────────┘   └───────────┘   └────┬───┘
                                    │
                               ┌────▼───┐
┌──────────┐                   │  View  │
│  Router  │◄──────────────────┤        │
└──────────┘                   └────────┘
```

---

## 13.3 Компоненты VIPER

| Компонент | Ответственность | Аналогия |
|-----------|-----------------|----------|
| **V**iew | Отображение UI, получение ввода | Официант — принимает заказы, приносит еду |
| **I**nteractor | Бизнес-логика, работа с данными | Повар — готовит блюда |
| **P**resenter | Связь View и Interactor | Менеджер зала — координирует |
| **E**ntity | Модели данных | Ингредиенты |
| **R**outer | Навигация | Хостес — провожает к столику |

---

## 13.4 View

View отвечает **только** за отображение. Не содержит логики.

```swift
// MARK: - Protocol
protocol ProductListViewProtocol: AnyObject {
    func showProducts(_ products: [ProductViewModel])
    func showLoading()
    func hideLoading()
    func showError(_ message: String)
}

// MARK: - View Controller
final class ProductListViewController: UIViewController {

    // MARK: - Properties
    var presenter: ProductListPresenterProtocol!

    private let tableView = UITableView()
    private let activityIndicator = UIActivityIndicatorView(style: .large)
    private var products: [ProductViewModel] = []

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        presenter.viewDidLoad()  // Сообщаем Presenter
    }

    // MARK: - Setup
    private func setupUI() {
        title = "Товары"
        view.backgroundColor = .systemBackground

        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(ProductCell.self, forCellReuseIdentifier: "ProductCell")

        view.addSubview(tableView)
        view.addSubview(activityIndicator)

        tableView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }

        activityIndicator.snp.makeConstraints { make in
            make.center.equalToSuperview()
        }
    }
}

// MARK: - ProductListViewProtocol
extension ProductListViewController: ProductListViewProtocol {

    func showProducts(_ products: [ProductViewModel]) {
        self.products = products
        tableView.reloadData()
    }

    func showLoading() {
        activityIndicator.startAnimating()
        tableView.isHidden = true
    }

    func hideLoading() {
        activityIndicator.stopAnimating()
        tableView.isHidden = false
    }

    func showError(_ message: String) {
        let alert = UIAlertController(title: "Ошибка", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - UITableViewDataSource
extension ProductListViewController: UITableViewDataSource {

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        products.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "ProductCell", for: indexPath) as! ProductCell
        cell.configure(with: products[indexPath.row])
        return cell
    }
}

// MARK: - UITableViewDelegate
extension ProductListViewController: UITableViewDelegate {

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        presenter.didSelectProduct(at: indexPath.row)  // Делегируем Presenter'у
    }
}
```

---

## 13.5 Interactor

Interactor содержит **бизнес-логику** и работу с данными.

```swift
// MARK: - Protocol
protocol ProductListInteractorProtocol {
    func fetchProducts()
    func getProduct(at index: Int) -> Product?
}

protocol ProductListInteractorOutputProtocol: AnyObject {
    func didFetchProducts(_ products: [Product])
    func didFailFetchProducts(_ error: Error)
}

// MARK: - Interactor
final class ProductListInteractor {

    // MARK: - Properties
    weak var presenter: ProductListInteractorOutputProtocol?

    private let networkService: NetworkServiceProtocol
    private let cacheService: CacheServiceProtocol
    private var products: [Product] = []

    // MARK: - Init
    init(networkService: NetworkServiceProtocol, cacheService: CacheServiceProtocol) {
        self.networkService = networkService
        self.cacheService = cacheService
    }
}

// MARK: - ProductListInteractorProtocol
extension ProductListInteractor: ProductListInteractorProtocol {

    func fetchProducts() {
        // Сначала пробуем из кэша
        if let cached = cacheService.getProducts(), !cached.isEmpty {
            self.products = cached
            presenter?.didFetchProducts(cached)
        }

        // Затем загружаем из сети
        networkService.fetchProducts { [weak self] result in
            switch result {
            case .success(let products):
                self?.products = products
                self?.cacheService.saveProducts(products)
                self?.presenter?.didFetchProducts(products)

            case .failure(let error):
                self?.presenter?.didFailFetchProducts(error)
            }
        }
    }

    func getProduct(at index: Int) -> Product? {
        guard products.indices.contains(index) else { return nil }
        return products[index]
    }
}
```

---

## 13.6 Presenter

Presenter — **связующее звено** между View и Interactor.

```swift
// MARK: - Protocol
protocol ProductListPresenterProtocol {
    func viewDidLoad()
    func didSelectProduct(at index: Int)
    func didTapRefresh()
}

// MARK: - Presenter
final class ProductListPresenter {

    // MARK: - Properties
    weak var view: ProductListViewProtocol?
    var interactor: ProductListInteractorProtocol!
    var router: ProductListRouterProtocol!
}

// MARK: - ProductListPresenterProtocol
extension ProductListPresenter: ProductListPresenterProtocol {

    func viewDidLoad() {
        view?.showLoading()
        interactor.fetchProducts()
    }

    func didSelectProduct(at index: Int) {
        guard let product = interactor.getProduct(at: index) else { return }
        router.navigateToProductDetail(product)
    }

    func didTapRefresh() {
        view?.showLoading()
        interactor.fetchProducts()
    }
}

// MARK: - ProductListInteractorOutputProtocol
extension ProductListPresenter: ProductListInteractorOutputProtocol {

    func didFetchProducts(_ products: [Product]) {
        view?.hideLoading()

        // Преобразуем Entity в ViewModel для View
        let viewModels = products.map { product in
            ProductViewModel(
                id: product.id,
                title: product.name,
                price: String(format: "$%.2f", product.price),
                imageURL: product.imageURL
            )
        }

        view?.showProducts(viewModels)
    }

    func didFailFetchProducts(_ error: Error) {
        view?.hideLoading()
        view?.showError(error.localizedDescription)
    }
}
```

---

## 13.7 Entity

Entity — это **модели данных**.

```swift
// MARK: - Domain Entity (для бизнес-логики)
struct Product: Codable {
    let id: Int
    let name: String
    let price: Double
    let description: String
    let imageURL: String
    let category: String
    let inStock: Bool
}

// MARK: - ViewModel (для отображения)
struct ProductViewModel {
    let id: Int
    let title: String
    let price: String  // Уже отформатированная цена
    let imageURL: String
}

// MARK: - API Response
struct ProductsResponse: Codable {
    let products: [Product]
    let total: Int
    let page: Int
}
```

---

## 13.8 Router

Router отвечает за **навигацию**.

```swift
// MARK: - Protocol
protocol ProductListRouterProtocol {
    func navigateToProductDetail(_ product: Product)
    func navigateToCart()
    func navigateToSearch()
}

// MARK: - Router
final class ProductListRouter {

    // MARK: - Properties
    weak var viewController: UIViewController?

    // MARK: - Static Builder
    static func createModule() -> UIViewController {
        let view = ProductListViewController()
        let presenter = ProductListPresenter()
        let interactor = ProductListInteractor(
            networkService: NetworkService(),
            cacheService: CacheService()
        )
        let router = ProductListRouter()

        // Связываем компоненты
        view.presenter = presenter
        presenter.view = view
        presenter.interactor = interactor
        presenter.router = router
        interactor.presenter = presenter
        router.viewController = view

        return view
    }
}

// MARK: - ProductListRouterProtocol
extension ProductListRouter: ProductListRouterProtocol {

    func navigateToProductDetail(_ product: Product) {
        let detailVC = ProductDetailRouter.createModule(with: product)
        viewController?.navigationController?.pushViewController(detailVC, animated: true)
    }

    func navigateToCart() {
        let cartVC = CartRouter.createModule()
        viewController?.navigationController?.pushViewController(cartVC, animated: true)
    }

    func navigateToSearch() {
        let searchVC = SearchRouter.createModule()
        viewController?.present(searchVC, animated: true)
    }
}
```

---

## 13.9 Взаимодействие компонентов

### Диаграмма потока данных

```
Пользователь нажимает на товар
         │
         ▼
    ┌─────────┐
    │  View   │ didSelectProduct(at: 0)
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │Presenter│ → получает товар от Interactor
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ Router  │ navigateToProductDetail(product)
    └────┬────┘
         │
         ▼
    Открывается экран товара
```

### Диаграмма загрузки данных

```
View.viewDidLoad()
         │
         ▼
Presenter.viewDidLoad()
    │    └──► View.showLoading()
    │
    ▼
Interactor.fetchProducts()
    │
    ▼
Network Request
    │
    ▼
Interactor.didFetchProducts()
         │
         ▼
Presenter.didFetchProducts()
    │    └──► преобразование в ViewModel
    │
    ▼
View.showProducts(viewModels)
    └──► View.hideLoading()
```

---

## 13.10 Создание VIPER модуля с нуля

### Структура файлов

```
ProductList/
├── ProductListViewController.swift   (View)
├── ProductListPresenter.swift
├── ProductListInteractor.swift
├── ProductListRouter.swift
├── ProductListProtocols.swift        (Все протоколы)
├── ProductListEntity.swift           (ViewModel)
└── Views/
    └── ProductCell.swift
```

### Файл протоколов

```swift
// ProductListProtocols.swift

import UIKit

// MARK: - View
protocol ProductListViewProtocol: AnyObject {
    var presenter: ProductListPresenterProtocol! { get set }

    func showProducts(_ products: [ProductViewModel])
    func showLoading()
    func hideLoading()
    func showError(_ message: String)
}

// MARK: - Presenter
protocol ProductListPresenterProtocol: AnyObject {
    var view: ProductListViewProtocol? { get set }
    var interactor: ProductListInteractorProtocol! { get set }
    var router: ProductListRouterProtocol! { get set }

    func viewDidLoad()
    func didSelectProduct(at index: Int)
}

// MARK: - Interactor Input
protocol ProductListInteractorProtocol: AnyObject {
    var presenter: ProductListInteractorOutputProtocol? { get set }

    func fetchProducts()
    func getProduct(at index: Int) -> Product?
}

// MARK: - Interactor Output
protocol ProductListInteractorOutputProtocol: AnyObject {
    func didFetchProducts(_ products: [Product])
    func didFailFetchProducts(_ error: Error)
}

// MARK: - Router
protocol ProductListRouterProtocol: AnyObject {
    var viewController: UIViewController? { get set }

    static func createModule() -> UIViewController
    func navigateToProductDetail(_ product: Product)
}
```

---

## 13.11 Упражнения

### Упражнение 13.1: Модуль корзины

Создайте VIPER модуль для корзины с функциями:
- Отображение товаров в корзине
- Изменение количества
- Удаление товара
- Расчёт итоговой суммы

### Упражнение 13.2: Модуль авторизации

Создайте VIPER модуль для входа с:
- Полями email и пароль
- Валидацией ввода
- Авторизацией через сервис
- Переходом на главный экран

---

## Итоги главы

В этой главе вы узнали:

✅ Зачем нужна архитектура и проблема "Massive VC"

✅ Обзор архитектур: MVC, MVP, MVVM, VIPER

✅ 5 компонентов VIPER: View, Interactor, Presenter, Entity, Router

✅ Ответственность каждого компонента

✅ Как компоненты взаимодействуют

✅ Как создать VIPER модуль с нуля

---

## Следующая глава

В [Главе 14](../14-Project-Setup/README.md) мы начнём создавать наше приложение интернет-магазина с нуля!

---

> **Совет:** VIPER кажется сложным на первый взгляд, но после создания 2-3 модулей вы оцените его преимущества. Код становится предсказуемым, легко тестируемым и масштабируемым.
