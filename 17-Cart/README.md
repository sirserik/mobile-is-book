# Глава 17: Детали товара и корзина

## Введение

В этой главе мы создадим два важнейших модуля e-commerce приложения:

1. **ProductDetail** — экран детальной информации о товаре
2. **Basket** — корзина покупок с синхронизацией через Firebase

Оба модуля следуют архитектуре VIPER и взаимодействуют между собой: из деталей товара можно добавить товар в корзину.

```
┌─────────────────────────────────────────────────────────────────┐
│                    СХЕМА НАВИГАЦИИ                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Home ──────► ProductDetail ──────► Basket ──────► CompleteOrder
│    │              │                    │                │
│    │         [Add to Basket]      [Complete]         [Pay]
│    │              │                    │                │
│    ◄──────────────┘                    │                │
│    ◄───────────────────────────────────┘                │
│                                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 17.1 BasketModel — модель товара в корзине

Прежде чем создавать модули, определим модель данных для корзины.

### Почему это класс, а не структура?

```swift
// ❌ Структура — НЕ подходит для корзины
struct BasketModelStruct {
    var count: Int  // При изменении создаётся КОПИЯ
}

// ✅ Класс — подходит для корзины
class BasketModel {
    var count: Int  // Изменяем ОДИН объект во всех местах
}
```

**Причины использования класса:**
1. **Единственный источник правды** — все ссылки указывают на один объект
2. **Firebase синхронизация** — изменения в одном месте видны везде
3. **Stepper в ячейке** — изменяя `count`, обновляем данные напрямую

### Создание модели

```swift
// Entities/Models/StorageModels/BasketModel.swift
import Foundation

final class BasketModel {

    // MARK: - Properties

    /// ID пользователя (для фильтрации в Firebase)
    let userId: String

    /// Уникальный идентификатор записи в корзине
    let uuid: String

    /// ID товара из API
    let productId: Int

    /// Название товара
    let productTitle: String

    /// Цена за единицу товара
    var productPrice: Double

    /// URL изображения
    let imageURL: String

    /// Количество товара (изменяемое)
    var count: Int

    // MARK: - Computed Properties

    /// Общая стоимость позиции
    var totalPrice: Double {
        productPrice * Double(count)
    }

    /// Форматированная цена
    var formattedTotalPrice: String {
        String(format: "$%.2f", totalPrice)
    }

    // MARK: - Init

    init(
        userId: String,
        uuid: String,
        productId: Int,
        productTitle: String,
        productPrice: Double,
        imageURL: String,
        count: Int
    ) {
        self.userId = userId
        self.uuid = uuid
        self.productId = productId
        self.productTitle = productTitle
        self.productPrice = productPrice
        self.imageURL = imageURL
        self.count = count
    }
}
```

### Визуализация модели

```
┌─────────────────────────────────────────────────────────────┐
│                      BasketModel                            │
├─────────────────────────────────────────────────────────────┤
│  userId: "abc123"          ← Какой пользователь             │
│  uuid: "550e8400-..."      ← Уникальный ID записи           │
│  productId: 1              ← ID товара из API               │
│  productTitle: "iPhone"    ← Для отображения                │
│  productPrice: 999.99      ← Цена за штуку                  │
│  imageURL: "https://..."   ← Картинка                       │
│  count: 2                  ← Количество (изменяемое)        │
├─────────────────────────────────────────────────────────────┤
│  totalPrice → 1999.98      ← Computed: price × count        │
│  formattedTotalPrice → "$1999.98"                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 17.2 BasketManager — работа с Firebase

BasketManager отвечает за синхронизацию корзины с Firebase Firestore.

### Почему Firebase, а не Realm?

```
┌───────────────────────────────────────────────────────────────┐
│              СРАВНЕНИЕ: REALM vs FIREBASE                     │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│   REALM (локально)              FIREBASE (облако)             │
│   ├── Быстро                    ├── Синхронизация             │
│   ├── Оффлайн                   ├── Между устройствами        │
│   ├── Нет сервера               ├── Real-time updates         │
│   └── Только это устройство     └── Корзина везде одинаковая  │
│                                                               │
│   Используем для:               Используем для:               │
│   • Избранное                   • Корзина                     │
│   • Кэш                         • Заказы                      │
│   • Настройки                   • Данные профиля              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Протокол BasketManager

```swift
// Managers/BasketManager/BasketManager.swift
import Foundation
import FirebaseFirestore

// MARK: - Protocol

protocol BasketManagerProtocol {
    /// Добавить товар в корзину
    func addBasket(
        data: [String: Any],
        completion: @escaping (Result<Void, FirebaseError>) -> Void
    )

    /// Получить товары корзины (real-time)
    func getBasketItems(
        completion: @escaping (Result<[BasketModel], FirebaseError>) -> Void
    )

    /// Удалить товар из корзины
    func deleteBasketItem(
        item: BasketModel?,
        completion: @escaping (FirebaseError) -> Void
    )

    /// Обновить количество товара
    func update(item: BasketModel?)
}
```

### Реализация BasketManager

```swift
// MARK: - Implementation

final class BasketManager {

    // MARK: - Properties

    /// Ссылка на Firestore
    private let firestore = Firestore.firestore()

    /// Менеджер информации о пользователе
    private let userInfoManager = UserInfoManager()

    /// Локальный кэш товаров корзины
    private var basketItems: [BasketModel] = []

    /// Название коллекции в Firebase
    private let collectionName = "Basket"
}

// MARK: - BasketManagerProtocol

extension BasketManager: BasketManagerProtocol {

    // MARK: - Add to Basket

    func addBasket(
        data: [String: Any],
        completion: @escaping (Result<Void, FirebaseError>) -> Void
    ) {
        /*
         Структура документа в Firebase:
         {
             "userId": "abc123",
             "uuid": "550e8400-...",
             "productId": 1,
             "productTitle": "iPhone",
             "productPrice": 999.99,
             "imageURL": "https://...",
             "count": 1
         }
         */

        firestore.collection(collectionName).addDocument(data: data) { error in
            if let error {
                print("Error adding to basket: \(error.localizedDescription)")
                completion(.failure(.addProductToBasket))
            } else {
                completion(.success(()))
            }
        }
    }

    // MARK: - Get Basket Items (Real-time)

    func getBasketItems(
        completion: @escaping (Result<[BasketModel], FirebaseError>) -> Void
    ) {
        // Получаем ID текущего пользователя
        guard let userId = userInfoManager.getUserUid() else {
            completion(.failure(.getBasketItemsFailed))
            return
        }

        /*
         addSnapshotListener — REAL-TIME ОБНОВЛЕНИЯ

         Каждый раз когда данные изменяются в Firebase,
         этот callback вызывается автоматически.

         Это позволяет:
         • Видеть изменения с другого устройства
         • Мгновенно обновлять UI
         • Синхронизировать корзину
         */

        firestore.collection(collectionName)
            .whereField("userId", isEqualTo: userId)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }

                // Обработка ошибки
                if let error {
                    print("Failed to fetch basket: \(error.localizedDescription)")
                    completion(.failure(.getBasketItemsFailed))
                    return
                }

                // Получаем документы
                guard let documents = snapshot?.documents else {
                    completion(.success([]))
                    return
                }

                // Очищаем локальный кэш
                self.basketItems.removeAll()

                // Парсим каждый документ
                for document in documents {
                    if let basketItem = self.parseDocument(document) {
                        self.basketItems.append(basketItem)
                    }
                }

                completion(.success(self.basketItems))
            }
    }

    // MARK: - Parse Document

    private func parseDocument(_ document: DocumentSnapshot) -> BasketModel? {
        /*
         Безопасное извлечение данных из документа Firebase

         document.get("key") возвращает Any?,
         поэтому нужно приводить к нужному типу
         */

        guard
            let userId = document.get("userId") as? String,
            let uuid = document.get("uuid") as? String,
            let productId = document.get("productId") as? Int,
            let productTitle = document.get("productTitle") as? String,
            let productPrice = document.get("productPrice") as? Double,
            let imageURL = document.get("imageURL") as? String,
            let count = document.get("count") as? Int
        else {
            print("Failed to parse basket document: \(document.documentID)")
            return nil
        }

        return BasketModel(
            userId: userId,
            uuid: uuid,
            productId: productId,
            productTitle: productTitle,
            productPrice: productPrice,
            imageURL: imageURL,
            count: count
        )
    }

    // MARK: - Update Item

    func update(item: BasketModel?) {
        guard let item else { return }
        guard let userId = userInfoManager.getUserUid() else { return }

        /*
         Алгоритм обновления:
         1. Ищем документ по userId и uuid
         2. Обновляем только count и productPrice
         */

        firestore.collection(collectionName)
            .whereField("userId", isEqualTo: userId)
            .getDocuments { [weak self] snapshot, error in
                guard let self else { return }

                if let error {
                    print("Update error: \(error.localizedDescription)")
                    return
                }

                // Ищем нужный документ по uuid
                for document in snapshot?.documents ?? [] {
                    if document.get("uuid") as? String == item.uuid {
                        // Обновляем данные
                        let data: [String: Any] = [
                            "count": item.count,
                            "productPrice": item.productPrice
                        ]

                        self.firestore
                            .collection(self.collectionName)
                            .document(document.documentID)
                            .updateData(data)

                        break
                    }
                }
            }
    }

    // MARK: - Delete Item

    func deleteBasketItem(
        item: BasketModel?,
        completion: @escaping (FirebaseError) -> Void
    ) {
        guard let item else { return }
        guard let userId = userInfoManager.getUserUid() else { return }

        firestore.collection(collectionName)
            .whereField("userId", isEqualTo: userId)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }

                if let error {
                    print("Delete error: \(error.localizedDescription)")
                    return
                }

                // Ищем документ по uuid и удаляем
                for document in snapshot?.documents ?? [] {
                    let data = document.data()

                    if data["uuid"] as? String == item.uuid {
                        self.firestore
                            .collection(self.collectionName)
                            .document(document.documentID)
                            .delete { error in
                                if let error {
                                    print("Error removing: \(error)")
                                    completion(.itemCouldNotBeRemoved)
                                }
                            }
                        break
                    }
                }
            }
    }
}
```

### Схема работы BasketManager

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE BASKET FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   App                          Firebase Firestore               │
│    │                                │                           │
│    │  addBasket(data)              │                           │
│    ├──────────────────────────────►│                           │
│    │                               │  Basket/                  │
│    │                               │    ├── doc1               │
│    │  getBasketItems()             │    ├── doc2               │
│    ├──────────────────────────────►│    └── doc3               │
│    │                               │                           │
│    │  ◄────── Real-time Updates ───┤  (SnapshotListener)       │
│    │                               │                           │
│    │  update(item)                 │                           │
│    ├──────────────────────────────►│                           │
│    │                               │                           │
│    │  deleteBasketItem(item)       │                           │
│    ├──────────────────────────────►│                           │
│    │                               │                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 17.3 Модуль ProductDetail — детали товара

Теперь создадим VIPER модуль для экрана деталей товара.

### Структура файлов модуля

```
Modules/ProductDetail/
├── Base/
│   ├── ProductDetailViewController.swift   ← View
│   ├── ProductDetailInteractor.swift       ← Interactor
│   ├── ProductDetailPresenter.swift        ← Presenter
│   └── ProductDetailRouter.swift           ← Router
└── UIComponents/
    ├── Cells/
    │   └── ProductDetailCell.swift         ← Ячейка с информацией
    └── CustomViews/
        └── AddBasketView.swift             ← Кнопка "В корзину"
```

### 17.3.1 ProductDetailRouter

Router создаёт модуль и управляет навигацией.

```swift
// Modules/ProductDetail/Base/ProductDetailRouter.swift
import UIKit

// MARK: - Protocol

protocol ProductDetailRouterProtocol {
    /// Вернуться на главный экран
    func toHome()

    /// Перейти в корзину
    func toBasket()
}

// MARK: - Router

final class ProductDetailRouter {

    // MARK: - Properties

    private weak var view: UIViewController?

    // MARK: - Init

    init(view: UIViewController) {
        self.view = view
    }

    // MARK: - Module Creation

    /// Фабричный метод создания модуля
    /// - Parameter productID: ID товара для загрузки
    /// - Returns: Готовый ViewController
    static func startModule(productID: Int) -> UIViewController {
        // 1. Создаём View
        let view = ProductDetailViewController()

        // 2. Создаём Router
        let router = ProductDetailRouter(view: view)

        // 3. Создаём Interactor с зависимостями
        let interactor = ProductDetailInteractor(
            productID: productID,
            service: ProductsService(),
            storageManager: RealmManager.shared,
            userInfoManager: UserInfoManager(),
            basketManager: BasketManager()
        )

        // 4. Создаём Presenter и связываем компоненты
        let presenter = ProductDetailPresenter(
            view: view,
            interactor: interactor,
            router: router
        )

        // 5. Устанавливаем связи
        view.presenter = presenter
        interactor.presenter = presenter

        return view
    }
}

// MARK: - ProductDetailRouterProtocol

extension ProductDetailRouter: ProductDetailRouterProtocol {

    func toHome() {
        // Возвращаемся назад в навигации
        view?.navigationController?.popViewController(animated: true)
    }

    func toBasket() {
        /*
         После добавления в корзину:
         1. Возвращаемся на Home
         2. Переключаемся на вкладку Basket (индекс 2)
         */
        toHome()
        view?.tabBarController?.selectedIndex = 2
    }
}
```

### 17.3.2 ProductDetailInteractor

Interactor содержит бизнес-логику: загрузка товара, избранное, корзина.

```swift
// Modules/ProductDetail/Base/ProductDetailInteractor.swift
import Foundation

// MARK: - Input Protocol

protocol ProductDetailInteractorInputs {
    /// Загрузить товар по ID
    func getProduct()

    /// Обработать нажатие на кнопку избранного
    func favButtonTapped(model: ProductModel?)

    /// Проверить, находится ли товар в избранном
    func isFav(model: ProductModel?) -> Bool

    /// Добавить товар в корзину
    func addProductToBasket(product: ProductModel?)

    /// Загрузить текущие товары корзины
    func getBasketItems()
}

// MARK: - Output Protocol

protocol ProductDetailInteractorOutputs: AnyObject {
    func startLoading()
    func endLoading()
    func dataRefreshed()
    func onError(errorMessage: String)
    func showModel(model: ProductModel?)
    func addToBasketSucceed()
}

// MARK: - Interactor

final class ProductDetailInteractor {

    // MARK: - Properties

    /// Связь с Presenter (weak для избежания retain cycle)
    weak var presenter: ProductDetailInteractorOutputs?

    /// Сервис для работы с API
    private let service: ProductsServiceProtocol?

    /// Менеджер локального хранилища (Realm)
    private let storageManager: RealmManagerProtocol?

    /// Менеджер информации о пользователе
    private let userInfoManager: UserInfoManagerProtocol?

    /// Менеджер корзины (Firebase)
    private let basketManager: BasketManagerProtocol?

    /// ID товара для загрузки
    private let productID: Int

    /// Текущие товары в корзине (для проверки дубликатов)
    private var basketItems: [BasketModel] = []

    // MARK: - Init

    init(
        productID: Int,
        service: ProductsServiceProtocol,
        storageManager: RealmManagerProtocol,
        userInfoManager: UserInfoManagerProtocol,
        basketManager: BasketManagerProtocol
    ) {
        self.productID = productID
        self.service = service
        self.storageManager = storageManager
        self.userInfoManager = userInfoManager
        self.basketManager = basketManager
    }
}

// MARK: - ProductDetailInteractorInputs

extension ProductDetailInteractor: ProductDetailInteractorInputs {

    // MARK: - Get Product

    func getProduct() {
        Task {
            presenter?.startLoading()

            try await service?.fetchProduct(id: productID) { [weak self] result in
                guard let self else { return }

                presenter?.endLoading()

                switch result {
                case .success(let model):
                    DispatchQueue.main.async { [weak self] in
                        self?.presenter?.showModel(model: model)
                    }

                case .failure(let error):
                    presenter?.onError(errorMessage: error.localizedDescription)
                }
            }
        }
    }

    // MARK: - Favorites

    func isFav(model: ProductModel?) -> Bool {
        /*
         Проверяем, есть ли товар в избранном:
         1. Получаем все избранные товары текущего пользователя
         2. Фильтруем по названию товара
         3. Если найден — товар в избранном
         */

        let userId = userInfoManager?.getUserUid()

        let favorites = storageManager?
            .getAll(FavoriteProductModel.self)
            .filter { $0.userId == userId }

        let isFavorite = favorites?
            .contains { $0.productTitle == model?.title } ?? false

        return isFavorite
    }

    func favButtonTapped(model: ProductModel?) {
        guard let model else { return }

        if !isFav(model: model) {
            // Добавляем в избранное
            addToFavorites(model)
        } else {
            // Удаляем из избранного
            removeFromFavorites(model)
        }
    }

    private func addToFavorites(_ model: ProductModel) {
        let favModel = FavoriteProductModel(
            userId: userInfoManager?.getUserUid(),
            productId: model.id,
            productImage: model.image,
            productTitle: model.title
        )

        storageManager?.create(favModel) { [weak self] error in
            self?.presenter?.onError(errorMessage: error.localizedDescription)
        }
    }

    private func removeFromFavorites(_ model: ProductModel) {
        let userId = userInfoManager?.getUserUid()

        let favorites = storageManager?
            .getAll(FavoriteProductModel.self)
            .filter { $0.userId == userId }

        if let itemToRemove = favorites?.first(where: { $0.productId == model.id }) {
            storageManager?.delete(itemToRemove) { [weak self] error in
                self?.presenter?.onError(errorMessage: error.localizedDescription)
            }
        }
    }

    // MARK: - Basket

    func getBasketItems() {
        /*
         Загружаем текущие товары корзины,
         чтобы проверить, не добавлен ли уже этот товар
         */

        basketManager?.getBasketItems { [weak self] result in
            guard let self else { return }

            switch result {
            case .success(let items):
                self.basketItems = items

            case .failure(let error):
                print("Failed to load basket: \(error.localizedDescription)")
            }
        }
    }

    func addProductToBasket(product: ProductModel?) {
        guard let product else { return }

        presenter?.startLoading()

        // Проверяем, не добавлен ли уже товар
        if basketItems.contains(where: { $0.productId == product.id }) {
            presenter?.onError(errorMessage: "The product is already in basket.")
            presenter?.endLoading()
            return
        }

        // Подготавливаем данные для Firebase
        let data: [String: Any] = [
            "userId": userInfoManager?.getUserUid() ?? "",
            "uuid": UUID().uuidString,  // Уникальный ID записи
            "productId": product.id,
            "productTitle": product.title,
            "productPrice": product.price,
            "imageURL": product.image,
            "count": 1
        ]

        // Добавляем в Firebase
        basketManager?.addBasket(data: data) { [weak self] result in
            guard let self else { return }

            presenter?.endLoading()

            switch result {
            case .success:
                presenter?.addToBasketSucceed()

            case .failure(let error):
                presenter?.onError(errorMessage: error.localizedDescription)
            }
        }
    }
}
```

### Схема работы Interactor

```
┌─────────────────────────────────────────────────────────────────┐
│                PRODUCTDETAIL INTERACTOR FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Presenter                    Interactor                       │
│       │                           │                             │
│       │  getProduct()             │                             │
│       ├──────────────────────────►│                             │
│       │                           │  ProductsService            │
│       │                           ├───────────────────►         │
│       │                           │                    │        │
│       │  ◄── showModel(model) ────┤  ◄─── ProductModel ┘        │
│       │                           │                             │
│       │  isFav(model)             │                             │
│       ├──────────────────────────►│  RealmManager               │
│       │  ◄── true/false ──────────┤───────────────────►         │
│       │                           │                             │
│       │  addProductToBasket()     │                             │
│       ├──────────────────────────►│  BasketManager              │
│       │                           ├───────────────────►         │
│       │  ◄── addToBasketSucceed ──┤  ◄─── Firebase ────┘        │
│       │                           │                             │
└─────────────────────────────────────────────────────────────────┘
```

### 17.3.3 ProductDetailPresenter

Presenter связывает View и Interactor.

```swift
// Modules/ProductDetail/Base/ProductDetailPresenter.swift
import Foundation

// MARK: - Input Protocol

protocol ProductDetailPresenterInputs {
    func viewDidLoad()
    func viewWillAppear()

    /// Получить модель товара для отображения
    func showModel() -> ProductModel?

    /// Количество элементов (всегда 1)
    func numberOfItemsInSection() -> Int

    /// Размер ячейки
    func sizeForItemAt() -> CGSize

    /// Нажатие на кнопку избранного
    func favButtonTapped()

    /// Проверка избранного
    func isFav() -> Bool?

    /// Нажатие на кнопку "Назад"
    func backButtonTapped()

    /// Нажатие на "Добавить в корзину"
    func addBasketTapped()
}

// MARK: - Presenter

final class ProductDetailPresenter {

    // MARK: - Properties

    private weak var view: ProductDetailViewProtocol?
    private let interactor: ProductDetailInteractorInputs?
    private let router: ProductDetailRouterProtocol?

    /// Модель товара (обновляет UI при изменении)
    private var productModel: ProductModel? {
        didSet {
            // Обновляем цену в AddBasketView
            let price = "$\(productModel?.price ?? 0)"
            view?.setBasketViewPriceLabel(price: price)

            // Перезагружаем CollectionView
            dataRefreshed()
        }
    }

    // MARK: - Init

    init(
        view: ProductDetailViewProtocol,
        interactor: ProductDetailInteractorInputs,
        router: ProductDetailRouterProtocol
    ) {
        self.view = view
        self.interactor = interactor
        self.router = router
    }
}

// MARK: - ProductDetailPresenterInputs

extension ProductDetailPresenter: ProductDetailPresenterInputs {

    func viewDidLoad() {
        // Настраиваем UI
        view?.setNavBarAndTabBarVisibility()
        view?.setBackgroundColor(color: .systemBackground)
        view?.prepareAddBasketView()
        view?.prepareCollectionView()
        view?.prepareActivityIndicatorView()

        // Загружаем данные
        interactor?.getProduct()
        interactor?.getBasketItems()
    }

    func viewWillAppear() {
        // Можно обновлять данные при каждом появлении
    }

    func showModel() -> ProductModel? {
        return productModel
    }

    func numberOfItemsInSection() -> Int {
        return 1  // Всегда одна ячейка с информацией о товаре
    }

    func sizeForItemAt() -> CGSize {
        // Ячейка на всю ширину экрана
        return CGSize(
            width: UIScreenBounds.width - 32,
            height: UIScreenBounds.height
        )
    }

    func favButtonTapped() {
        interactor?.favButtonTapped(model: productModel)
    }

    func isFav() -> Bool? {
        return interactor?.isFav(model: productModel)
    }

    func backButtonTapped() {
        router?.toHome()
    }

    func addBasketTapped() {
        interactor?.addProductToBasket(product: productModel)
    }
}

// MARK: - ProductDetailInteractorOutputs

extension ProductDetailPresenter: ProductDetailInteractorOutputs {

    func startLoading() {
        DispatchQueue.main.async { [weak self] in
            self?.view?.startLoading()
        }
    }

    func endLoading() {
        DispatchQueue.main.async { [weak self] in
            self?.view?.endLoading()
        }
    }

    func dataRefreshed() {
        view?.dataRefreshed()
    }

    func onError(errorMessage: String) {
        view?.onError(message: errorMessage)
    }

    func showModel(model: ProductModel?) {
        self.productModel = model
    }

    func addToBasketSucceed() {
        // После успешного добавления — переходим в корзину
        router?.toBasket()
    }
}
```

### 17.3.4 ProductDetailViewController

View отображает информацию о товаре.

```swift
// Modules/ProductDetail/Base/ProductDetailViewController.swift
import UIKit

// MARK: - View Protocol

protocol ProductDetailViewProtocol: AnyObject {
    func setNavBarAndTabBarVisibility()
    func setBackgroundColor(color: UIColor)
    func prepareCollectionView()
    func prepareActivityIndicatorView()
    func prepareAddBasketView()
    func startLoading()
    func endLoading()
    func dataRefreshed()
    func onError(message: String)
    func setBasketViewPriceLabel(price: String)
}

// MARK: - ViewController

final class ProductDetailViewController: UIViewController {

    // MARK: - UI Components

    private lazy var detailCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.sectionInset = UIEdgeInsets(top: 0, left: 0, bottom: 20, right: 0)

        let collectionView = UICollectionView(
            frame: .zero,
            collectionViewLayout: layout
        )
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(
            ProductDetailCell.self,
            forCellWithReuseIdentifier: ProductDetailCell.identifier
        )
        collectionView.backgroundColor = .systemBackground
        return collectionView
    }()

    private lazy var activityIndicatorView: UIActivityIndicatorView = {
        let indicator = UIActivityIndicatorView(style: .large)
        indicator.hidesWhenStopped = true
        return indicator
    }()

    /// Кастомная View с ценой и кнопкой "В корзину"
    private lazy var customAddBasketView = AddBasketView()

    // MARK: - Properties

    var presenter: ProductDetailPresenterInputs!

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        presenter.viewDidLoad()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        presenter.viewWillAppear()
    }
}

// MARK: - ProductDetailViewProtocol

extension ProductDetailViewController: ProductDetailViewProtocol {

    func setBackgroundColor(color: UIColor) {
        view.backgroundColor = color
    }

    func setNavBarAndTabBarVisibility() {
        // Скрываем Navigation Bar (есть кастомная кнопка "Назад")
        navigationController?.navigationBar.isHidden = true
        navigationItem.hidesBackButton = true

        // Скрываем Tab Bar на этом экране
        tabBarController?.tabBar.isHidden = true
    }

    func prepareAddBasketView() {
        view.addSubview(customAddBasketView)
        customAddBasketView.layer.shadowOpacity = 1
        customAddBasketView.delegate = self

        customAddBasketView.snp.makeConstraints { make in
            make.height.equalTo(100)
            make.width.equalTo(view.frame.width)
            make.bottom.equalToSuperview().inset(20)
        }
    }

    func prepareCollectionView() {
        view.addSubview(detailCollectionView)

        detailCollectionView.snp.makeConstraints { make in
            make.top.left.right.equalToSuperview()
            make.bottom.equalTo(customAddBasketView.snp.top)
        }
    }

    func prepareActivityIndicatorView() {
        view.addSubview(activityIndicatorView)

        activityIndicatorView.snp.makeConstraints { make in
            make.centerX.centerY.equalToSuperview()
        }
    }

    func startLoading() {
        activityIndicatorView.startAnimating()
    }

    func endLoading() {
        activityIndicatorView.stopAnimating()
    }

    func dataRefreshed() {
        detailCollectionView.reloadData()
    }

    func onError(message: String) {
        showAlert(title: "", message: message)
    }

    func setBasketViewPriceLabel(price: String) {
        customAddBasketView.priceLabel.text = price
    }
}

// MARK: - ProductDetailCellButtonsDelegate

extension ProductDetailViewController: ProductDetailCellButtonsDelegate {

    func backTapped() {
        presenter.backButtonTapped()
    }

    func favButtonTapped() {
        presenter.favButtonTapped()
    }
}

// MARK: - AddBasketButtonDelegate

extension ProductDetailViewController: AddBasketButtonDelegate {

    func addBasketTapped() {
        presenter.addBasketTapped()
    }
}

// MARK: - UICollectionViewDelegate & DataSource

extension ProductDetailViewController: UICollectionViewDelegate,
                                       UICollectionViewDataSource,
                                       UICollectionViewDelegateFlowLayout {

    func collectionView(
        _ collectionView: UICollectionView,
        numberOfItemsInSection section: Int
    ) -> Int {
        return presenter.numberOfItemsInSection()
    }

    func collectionView(
        _ collectionView: UICollectionView,
        cellForItemAt indexPath: IndexPath
    ) -> UICollectionViewCell {
        guard let cell = detailCollectionView.dequeueReusableCell(
            withReuseIdentifier: ProductDetailCell.identifier,
            for: indexPath
        ) as? ProductDetailCell else {
            return UICollectionViewCell()
        }

        cell.showModel(
            model: presenter.showModel(),
            isFav: presenter.isFav()
        )
        cell.delegate = self

        return cell
    }

    func collectionView(
        _ collectionView: UICollectionView,
        layout collectionViewLayout: UICollectionViewLayout,
        sizeForItemAt indexPath: IndexPath
    ) -> CGSize {
        return presenter.sizeForItemAt()
    }
}
```

### 17.3.5 ProductDetailCell — ячейка с информацией

```swift
// Modules/ProductDetail/UIComponents/Cells/ProductDetailCell.swift
import UIKit
import SDWebImage

// MARK: - Delegate Protocol

protocol ProductDetailCellButtonsDelegate: AnyObject {
    func backTapped()
    func favButtonTapped()
}

// MARK: - Cell

final class ProductDetailCell: UICollectionViewCell {

    // MARK: - Identifier

    static let identifier = "ProductDetailCell"

    // MARK: - UI Components

    /// Изображение товара
    private lazy var productImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFit
        imageView.clipsToBounds = true
        return imageView
    }()

    /// Кнопка "Избранное"
    private lazy var productFavButton: UIButton = {
        let button = UIButton()
        button.tintColor = .systemRed
        button.layer.cornerRadius = 8

        // Обычное состояние — пустое сердце
        button.setImage(
            UIImage(
                systemName: "heart",
                withConfiguration: UIImage.SymbolConfiguration(pointSize: 44)
            ),
            for: .normal
        )

        // Выбранное состояние — заполненное сердце
        button.setImage(
            UIImage(
                systemName: "heart.fill",
                withConfiguration: UIImage.SymbolConfiguration(pointSize: 44)
            ),
            for: .selected
        )

        button.addTarget(self, action: #selector(favButtonTapped), for: .touchUpInside)
        return button
    }()

    /// Кнопка "Назад"
    private lazy var backButton: UIButton = {
        let button = UIButton()
        button.setImage(
            UIImage(
                systemName: "arrowshape.backward.fill",
                withConfiguration: UIImage.SymbolConfiguration(pointSize: 44)
            ),
            for: .normal
        )
        button.tintColor = .label
        button.addTarget(self, action: #selector(backTapped), for: .touchUpInside)
        button.layer.shadowOpacity = 1
        button.layer.shadowColor = UIColor.gray.cgColor
        return button
    }()

    /// Название товара
    private lazy var productTitleLabel: UILabel = {
        let label = UILabel()
        label.textColor = .label
        label.font = .systemFont(ofSize: 26)
        label.numberOfLines = 0
        label.textAlignment = .center
        return label
    }()

    /// Описание товара
    private lazy var productDescriptionLabel: UILabel = {
        let label = PaddingLabel(withInsets: 4, 4, 8, 8)
        label.textColor = .label
        label.font = .systemFont(ofSize: 20)
        label.numberOfLines = 0
        label.backgroundColor = .systemGray6
        label.layer.cornerRadius = 8
        label.clipsToBounds = true
        return label
    }()

    /// Рейтинг и количество отзывов
    private lazy var productRatingAndCountLabel: UILabel = {
        let label = UILabel()
        label.textColor = .label
        label.font = .systemFont(ofSize: 18)
        return label
    }()

    /// Спейсер для вертикального стека
    private lazy var customSpacerView: UIView = {
        let view = UIView()
        view.setContentHuggingPriority(.defaultLow, for: .vertical)
        view.setContentCompressionResistancePriority(.defaultLow, for: .vertical)
        return view
    }()

    /// Вертикальный стек с контентом
    private lazy var vStackView = VerticalStackView(
        arrangedSubviews: [
            productImageView,
            productTitleLabel,
            productRatingAndCountLabel,
            productDescriptionLabel,
            customSpacerView
        ],
        spacing: 16
    )

    // MARK: - Properties

    weak var delegate: ProductDetailCellButtonsDelegate?

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupConstraints() {
        addSubview(vStackView)
        contentView.addSubview(productFavButton)
        contentView.addSubview(backButton)

        // Изображение занимает верхнюю часть экрана
        productImageView.snp.makeConstraints { make in
            make.width.equalTo(snp.width)
            make.height.equalTo(UIScreenBounds.height / 2.5)
        }

        // Кнопка избранного справа вверху
        productFavButton.snp.makeConstraints { make in
            make.top.equalToSuperview().offset(20)
            make.right.equalToSuperview()
        }

        // Кнопка назад слева вверху
        backButton.snp.makeConstraints { make in
            make.top.equalTo(productFavButton)
            make.left.equalToSuperview()
        }

        // Стек на всю ячейку
        vStackView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }

    // MARK: - Configure

    func showModel(model: ProductModel?, isFav: Bool?) {
        productImageView.sd_setImage(with: URL(string: model?.image ?? ""))
        productTitleLabel.text = model?.title ?? ""
        productDescriptionLabel.text = model?.description ?? ""

        // Форматируем рейтинг
        let rate = model?.rating.rate ?? 0.0
        let count = model?.rating.count ?? 0
        productRatingAndCountLabel.text = "⭐️\(rate)⭐️\tCount: \(count)"

        // Устанавливаем состояние кнопки избранного
        productFavButton.isSelected = isFav ?? false
    }

    // MARK: - Actions

    @objc private func favButtonTapped(_ sender: UIButton) {
        sender.isSelected.toggle()
        delegate?.favButtonTapped()
    }

    @objc private func backTapped(_ sender: UIButton) {
        delegate?.backTapped()
    }
}
```

### 17.3.6 AddBasketView — кнопка добавления в корзину

```swift
// Modules/ProductDetail/UIComponents/CustomViews/AddBasketView.swift
import UIKit

// MARK: - Delegate Protocol

protocol AddBasketButtonDelegate: AnyObject {
    func addBasketTapped()
}

// MARK: - View

final class AddBasketView: UIView {

    // MARK: - UI Components

    /// Метка с ценой товара
    lazy var priceLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 24)
        label.backgroundColor = .label
        label.textColor = .secondarySystemBackground
        label.textAlignment = .center
        return label
    }()

    /// Кнопка "Добавить в корзину"
    private lazy var addButton: UIButton = {
        let button = UIButton()
        button.setTitle("Add to Basket", for: .normal)
        button.backgroundColor = .label
        button.setTitleColor(.secondarySystemBackground, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 24)

        // Иконка корзины
        let cartImage = UIImage(systemName: "cart")?
            .withTintColor(.secondarySystemBackground, renderingMode: .alwaysOriginal)
        button.setImage(cartImage, for: .normal)

        button.addTarget(self, action: #selector(addButtonTapped), for: .touchUpInside)
        return button
    }()

    /// Горизонтальный стек
    private lazy var stackView: UIStackView = {
        let stackView = UIStackView(arrangedSubviews: [priceLabel, addButton])
        stackView.spacing = 4
        stackView.alignment = .center
        return stackView
    }()

    // MARK: - Properties

    weak var delegate: AddBasketButtonDelegate?

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupConstraints() {
        addSubview(stackView)

        priceLabel.snp.makeConstraints { make in
            make.height.equalTo(addButton)
        }

        addButton.snp.makeConstraints { make in
            make.width.equalTo(UIScreenBounds.width / 2.1)
            make.height.equalTo(100)
        }

        stackView.snp.makeConstraints { make in
            make.top.bottom.equalToSuperview().inset(26)
            make.left.right.equalToSuperview().inset(26)
        }
    }

    // MARK: - Actions

    @objc private func addButtonTapped() {
        delegate?.addBasketTapped()
    }
}
```

### Визуализация экрана ProductDetail

```
┌─────────────────────────────────────────────┐
│  ◄──  [Back]              [♥]  Favorite     │
├─────────────────────────────────────────────┤
│                                             │
│              ┌───────────┐                  │
│              │           │                  │
│              │   IMAGE   │                  │
│              │           │                  │
│              └───────────┘                  │
│                                             │
│         Product Title Goes Here             │
│              Multi-line                     │
│                                             │
│          ⭐️ 4.5 ⭐️  Count: 120            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Product description goes here.     │   │
│  │  This can be multiple lines with    │   │
│  │  detailed information about the     │   │
│  │  product features and benefits.     │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌─────────────────────┐     │
│  │  $999.99 │  │  🛒 Add to Basket  │     │
│  └──────────┘  └─────────────────────┘     │
└─────────────────────────────────────────────┘
```

---

## 17.4 Модуль Basket — корзина

Теперь создадим модуль корзины покупок.

### Структура файлов модуля

```
Modules/Basket/
├── Base/
│   ├── BasketViewController.swift    ← View
│   ├── BasketInteractor.swift        ← Interactor
│   ├── BasketPresenter.swift         ← Presenter
│   └── BasketRouter.swift            ← Router
└── UIComponents/
    ├── Cells/
    │   └── BasketCell.swift          ← Ячейка товара
    └── CustomViews/
        ├── BasketBottomView.swift    ← Итого и кнопки
        └── EmptyBasketView.swift     ← Пустая корзина
```

### 17.4.1 BasketRouter

```swift
// Modules/Basket/Base/BasketRouter.swift
import UIKit

// MARK: - Protocol

protocol BasketRouterProtocol {
    /// Вернуться на главный экран
    func toHome()

    /// Перейти к оформлению заказа
    func toCompleteOrder(items: [BasketModel]?)
}

// MARK: - Router

final class BasketRouter {

    // MARK: - Properties

    private weak var view: UIViewController?

    // MARK: - Init

    init(view: UIViewController) {
        self.view = view
    }

    // MARK: - Module Creation

    static func startBasketModule() -> UIViewController {
        // 1. Создаём View
        let view = BasketViewController()

        // 2. Создаём Router
        let router = BasketRouter(view: view)

        // 3. Создаём Interactor
        let interactor = BasketInteractor(basketManager: BasketManager())

        // 4. Создаём Presenter
        let presenter = BasketPresenter(
            view: view,
            interactor: interactor,
            router: router
        )

        // 5. Связываем компоненты
        view.presenter = presenter
        interactor.presenter = presenter

        return view
    }
}

// MARK: - BasketRouterProtocol

extension BasketRouter: BasketRouterProtocol {

    func toHome() {
        // Переключаемся на вкладку Home (индекс 0)
        view?.tabBarController?.selectedIndex = 0
    }

    func toCompleteOrder(items: [BasketModel]?) {
        // Переходим на экран оформления заказа
        let completeModule = CompleteOrderRouter.startCompleteOrderModule(items: items)
        view?.navigationController?.pushViewController(completeModule, animated: true)
    }
}
```

### 17.4.2 BasketInteractor

```swift
// Modules/Basket/Base/BasketInteractor.swift
import Foundation

// MARK: - Input Protocol

protocol BasketInteractorInputs {
    /// Загрузить товары корзины
    func getItems()

    /// Получить товары для отображения
    func showItems() -> [BasketModel]?

    /// Обновить количество товара
    func updateItem(value: Double, item: BasketModel?)

    /// Удалить товар из корзины
    func deleteItem(item: BasketModel?)

    /// Подсчитать общую сумму
    func calculateTotal() -> Double
}

// MARK: - Output Protocol

protocol BasketInteractorOutputs: AnyObject {
    func onError(message: String)
    func startLoading()
    func endLoading()
    func dataRefreshed()
    func showTotal(price: Double)
}

// MARK: - Interactor

final class BasketInteractor {

    // MARK: - Properties

    weak var presenter: BasketInteractorOutputs?

    private let basketManager: BasketManagerProtocol?

    /// Товары в корзине
    private var basketItems: [BasketModel]? {
        didSet {
            // При изменении корзины — пересчитываем сумму
            presenter?.showTotal(price: calculateTotal())
        }
    }

    // MARK: - Init

    init(basketManager: BasketManagerProtocol) {
        self.basketManager = basketManager
    }
}

// MARK: - BasketInteractorInputs

extension BasketInteractor: BasketInteractorInputs {

    func getItems() {
        presenter?.startLoading()

        basketManager?.getBasketItems { [weak self] result in
            guard let self else { return }

            presenter?.endLoading()

            switch result {
            case .success(let items):
                DispatchQueue.main.async { [weak self] in
                    guard let self else { return }

                    self.basketItems = items
                    self.presenter?.dataRefreshed()
                    self.presenter?.showTotal(price: self.calculateTotal())
                }

            case .failure(let error):
                presenter?.onError(message: error.localizedDescription)
            }
        }
    }

    func showItems() -> [BasketModel]? {
        return basketItems
    }

    func updateItem(value: Double, item: BasketModel?) {
        /*
         Логика обновления количества:
         1. Находим товар по uuid
         2. Если value == 0 — удаляем товар
         3. Иначе — обновляем count
         */

        guard let index = basketItems?.firstIndex(where: { $0.uuid == item?.uuid }),
              let item = basketItems?[index] else {
            return
        }

        if value == 0 {
            // Удаляем товар при нулевом количестве
            deleteItem(item: item)
        } else {
            // Обновляем количество
            item.count = Int(value)
            basketManager?.update(item: item)
        }
    }

    func deleteItem(item: BasketModel?) {
        basketManager?.deleteBasketItem(item: item) { [weak self] error in
            self?.presenter?.onError(message: error.localizedDescription)
        }
    }

    func calculateTotal() -> Double {
        /*
         Формула: сумма (цена × количество) для всех товаров

         Используем reduce для суммирования:
         [item1, item2, item3].reduce(0) { total, item in
             total + item.price * item.count
         }
         */

        guard let items = basketItems else { return 0 }

        return items.reduce(0) { total, item in
            total + item.productPrice * Double(item.count)
        }
    }
}
```

### 17.4.3 BasketPresenter

```swift
// Modules/Basket/Base/BasketPresenter.swift
import Foundation

// MARK: - Input Protocol

protocol BasketPresenterInputs {
    func viewDidLoad()
    func viewWillAppear()

    /// Количество строк в таблице
    func numberOfRowsInSection(section: Int) -> Int

    /// Модель для ячейки
    func cellForRowAt(indexPath: IndexPath) -> BasketModel?

    /// Высота ячейки
    func heightForRowAt(indexPath: IndexPath) -> CGFloat

    /// Нажатие "Продолжить покупки"
    func continueShoppingTapped()

    /// Нажатие "Оформить заказ"
    func completePaymentTapped()

    /// Изменение количества через Stepper
    func stepperValueChanged(value: Double, item: BasketModel?)
}

// MARK: - Presenter

final class BasketPresenter {

    // MARK: - Properties

    private weak var view: BasketViewProtocol?
    private let interactor: BasketInteractorInputs?
    private let router: BasketRouterProtocol?

    // MARK: - Init

    init(
        view: BasketViewProtocol,
        interactor: BasketInteractorInputs,
        router: BasketRouterProtocol
    ) {
        self.view = view
        self.interactor = interactor
        self.router = router
    }
}

// MARK: - BasketPresenterInputs

extension BasketPresenter: BasketPresenterInputs {

    func viewDidLoad() {
        view?.setNavTitle(title: "My Basket")
        view?.setBackgroundColor(color: .systemBackground)
        view?.prepareCustomBottomView()
        view?.prepareBasketTableView()
        view?.prepareEmptyBasketView()
        view?.prepareActivityIndicatorView()

        interactor?.getItems()
    }

    func viewWillAppear() {
        // Обновляем данные при каждом появлении экрана
    }

    func numberOfRowsInSection(section: Int) -> Int {
        return interactor?.showItems()?.count ?? 0
    }

    func cellForRowAt(indexPath: IndexPath) -> BasketModel? {
        return interactor?.showItems()?[indexPath.row]
    }

    func heightForRowAt(indexPath: IndexPath) -> CGFloat {
        return 160  // Фиксированная высота ячейки
    }

    func continueShoppingTapped() {
        router?.toHome()
    }

    func completePaymentTapped() {
        let items = interactor?.showItems()

        // Проверяем, что корзина не пуста
        if items?.isEmpty ?? true {
            view?.onError(message: GeneralError.emptyBasketError.localizedDescription)
        } else {
            router?.toCompleteOrder(items: items)
        }
    }

    func stepperValueChanged(value: Double, item: BasketModel?) {
        interactor?.updateItem(value: value, item: item)
    }
}

// MARK: - BasketInteractorOutputs

extension BasketPresenter: BasketInteractorOutputs {

    func onError(message: String) {
        view?.onError(message: message)
    }

    func startLoading() {
        view?.startLoading()
    }

    func endLoading() {
        view?.endLoading()
    }

    func dataRefreshed() {
        view?.dataRefreshed()
    }

    func showTotal(price: Double) {
        view?.calculateTotalPrice(price: price)
    }
}
```

### 17.4.4 BasketViewController

```swift
// Modules/Basket/Base/BasketViewController.swift
import UIKit

// MARK: - View Protocol

protocol BasketViewProtocol: AnyObject {
    func setNavTitle(title: String)
    func setBackgroundColor(color: UIColor)
    func prepareBasketTableView()
    func prepareActivityIndicatorView()
    func prepareEmptyBasketView()
    func prepareCustomBottomView()
    func startLoading()
    func endLoading()
    func dataRefreshed()
    func onError(message: String)
    func calculateTotalPrice(price: Double)
}

// MARK: - ViewController

final class BasketViewController: UIViewController {

    // MARK: - UI Components

    private lazy var basketTableView: UITableView = {
        let tableView = UITableView()
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(
            BasketCell.self,
            forCellReuseIdentifier: BasketCell.identifier
        )
        tableView.separatorStyle = .singleLine
        return tableView
    }()

    /// Нижняя панель с итогом и кнопками
    private lazy var customBottomView = BasketBottomView()

    /// View для пустой корзины
    private lazy var customEmptyView = EmptyBasketView()

    private lazy var activityIndicatorView: UIActivityIndicatorView = {
        let indicator = UIActivityIndicatorView(style: .large)
        indicator.hidesWhenStopped = true
        return indicator
    }()

    // MARK: - Properties

    var presenter: BasketPresenterInputs!

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        presenter.viewDidLoad()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        presenter.viewWillAppear()
    }
}

// MARK: - BasketViewProtocol

extension BasketViewController: BasketViewProtocol {

    func setNavTitle(title: String) {
        self.title = title
    }

    func setBackgroundColor(color: UIColor) {
        view.backgroundColor = color
    }

    func prepareCustomBottomView() {
        view.addSubview(customBottomView)
        customBottomView.delegate = self

        customBottomView.snp.makeConstraints { make in
            make.width.equalTo(view.frame.width)
            make.height.equalTo(view.frame.height / 4.20)
            make.bottom.equalTo(view.safeAreaLayoutGuide.snp.bottom)
        }
    }

    func prepareBasketTableView() {
        view.addSubview(basketTableView)

        basketTableView.snp.makeConstraints { make in
            make.top.equalTo(view.safeAreaLayoutGuide)
            make.left.right.equalToSuperview()
            make.bottom.equalTo(customBottomView.snp.top)
        }
    }

    func prepareEmptyBasketView() {
        view.addSubview(customEmptyView)

        customEmptyView.snp.makeConstraints { make in
            make.centerX.equalToSuperview()
            make.centerY.equalToSuperview().offset(-50)
        }
    }

    func prepareActivityIndicatorView() {
        view.addSubview(activityIndicatorView)

        activityIndicatorView.snp.makeConstraints { make in
            make.centerX.centerY.equalToSuperview()
        }
    }

    func startLoading() {
        activityIndicatorView.startAnimating()
    }

    func endLoading() {
        activityIndicatorView.stopAnimating()
    }

    func dataRefreshed() {
        basketTableView.reloadData()
    }

    func onError(message: String) {
        showAlert(title: "", message: message)
    }

    func calculateTotalPrice(price: Double) {
        customBottomView.fixTotalPrice(price: price)
    }
}

// MARK: - BasketBottomViewButtonDelegate

extension BasketViewController: BasketBottomViewButtonDelegate {

    func continueShoppingTapped() {
        presenter.continueShoppingTapped()
    }

    func completePaymentTapped() {
        presenter.completePaymentTapped()
    }
}

// MARK: - BasketCellStepperCountDelegate

extension BasketViewController: BasketCellStepperCountDelegate {

    func stepperValueChanged(value: Double, item: BasketModel?) {
        presenter.stepperValueChanged(value: value, item: item)
    }
}

// MARK: - UITableViewDelegate & DataSource

extension BasketViewController: UITableViewDelegate, UITableViewDataSource {

    func tableView(
        _ tableView: UITableView,
        numberOfRowsInSection section: Int
    ) -> Int {
        let count = presenter.numberOfRowsInSection(section: section)

        // Показываем/скрываем EmptyView
        customEmptyView.isHidden = count != 0

        return count
    }

    func tableView(
        _ tableView: UITableView,
        cellForRowAt indexPath: IndexPath
    ) -> UITableViewCell {
        guard let cell = basketTableView.dequeueReusableCell(
            withIdentifier: BasketCell.identifier,
            for: indexPath
        ) as? BasketCell else {
            return UITableViewCell()
        }

        cell.selectionStyle = .none
        cell.showModel(model: presenter.cellForRowAt(indexPath: indexPath))
        cell.delegate = self

        return cell
    }

    func tableView(
        _ tableView: UITableView,
        heightForRowAt indexPath: IndexPath
    ) -> CGFloat {
        return presenter.heightForRowAt(indexPath: indexPath)
    }
}
```

### 17.4.5 BasketCell — ячейка товара в корзине

```swift
// Modules/Basket/UIComponents/Cells/BasketCell.swift
import UIKit
import SDWebImage

// MARK: - Delegate Protocol

protocol BasketCellStepperCountDelegate: AnyObject {
    func stepperValueChanged(value: Double, item: BasketModel?)
}

// MARK: - Cell

final class BasketCell: UITableViewCell {

    // MARK: - Identifier

    static let identifier = "BasketCell"

    // MARK: - UI Components

    /// Изображение товара
    private lazy var productImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.layer.cornerRadius = 8
        imageView.contentMode = .scaleAspectFit
        imageView.clipsToBounds = true
        return imageView
    }()

    /// Название товара
    private lazy var productTitleLabel: UILabel = {
        let label = UILabel()
        label.numberOfLines = 0
        label.textColor = .label
        label.font = .systemFont(ofSize: 18, weight: .light)
        label.textAlignment = .center
        return label
    }()

    /// Цена (общая за позицию)
    private lazy var productPriceLabel: UILabel = {
        let label = UILabel()
        label.textColor = .label
        label.font = .systemFont(ofSize: 20, weight: .thin)
        label.textAlignment = .center
        return label
    }()

    /// Метка с количеством
    private lazy var productCountLabel: UILabel = {
        let label = PaddingLabel(withInsets: 4, 4, 4, 4)
        label.textColor = .systemBackground
        label.backgroundColor = .label
        label.layer.cornerRadius = 8
        label.font = .systemFont(ofSize: 20)
        label.textAlignment = .center
        label.clipsToBounds = true
        return label
    }()

    /// Stepper для изменения количества
    private lazy var stepper: UIStepper = {
        let stepper = UIStepper()
        stepper.minimumValue = 0  // 0 = удаление товара
        stepper.value = 1
        stepper.maximumValue = 10
        stepper.addTarget(self, action: #selector(stepperValueChanged), for: .valueChanged)
        return stepper
    }()

    /// Горизонтальный стек
    private lazy var hStackView: UIStackView = {
        // Вертикальный стек для названия и цены
        let infoStack = VerticalStackView(
            arrangedSubviews: [productTitleLabel, productPriceLabel],
            spacing: 28
        )

        // Вертикальный стек для количества и степпера
        let countStack = VerticalStackView(
            arrangedSubviews: [productCountLabel, stepper],
            spacing: 4
        )

        let stackView = UIStackView(arrangedSubviews: [
            productImageView,
            infoStack,
            countStack
        ])
        stackView.alignment = .center
        stackView.spacing = 8
        return stackView
    }()

    // MARK: - Properties

    private var model: BasketModel?
    weak var delegate: BasketCellStepperCountDelegate?

    // MARK: - Init

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupConstraints() {
        contentView.addSubview(hStackView)

        productImageView.snp.makeConstraints { make in
            make.height.equalTo(120)
            make.width.equalTo(90)
        }

        productCountLabel.snp.makeConstraints { make in
            make.width.equalTo(94)
        }

        productPriceLabel.snp.makeConstraints { make in
            make.height.equalTo(20)
        }

        stepper.snp.makeConstraints { make in
            make.centerX.equalTo(productCountLabel.snp.centerX)
        }

        hStackView.snp.makeConstraints { make in
            make.edges.equalToSuperview().inset(16)
        }
    }

    // MARK: - Configure

    func showModel(model: BasketModel?) {
        self.model = model

        guard let model else { return }

        // Устанавливаем значение степпера
        stepper.value = Double(model.count)

        // Название товара
        productTitleLabel.text = model.productTitle

        // Общая цена позиции
        let totalPrice = model.productPrice * Double(model.count)
        let formattedPrice = String(format: "%.2f", totalPrice)
        productPriceLabel.text = "$ \(formattedPrice)"

        // Изображение
        productImageView.sd_setImage(with: URL(string: model.imageURL))

        // Количество
        productCountLabel.text = String(model.count)
    }

    // MARK: - Actions

    @objc private func stepperValueChanged() {
        delegate?.stepperValueChanged(value: stepper.value, item: model)
    }
}
```

### 17.4.6 BasketBottomView — нижняя панель

```swift
// Modules/Basket/UIComponents/CustomViews/BasketBottomView.swift
import UIKit

// MARK: - Delegate Protocol

protocol BasketBottomViewButtonDelegate: AnyObject {
    func continueShoppingTapped()
    func completePaymentTapped()
}

// MARK: - View

final class BasketBottomView: UIView {

    // MARK: - UI Components

    /// Заголовок "Total Price Payable"
    private lazy var totalPriceTitleLabel: UILabel = {
        let label = UILabel()
        label.textColor = .label
        label.font = .systemFont(ofSize: 16)
        label.text = "Total Price Payable"
        return label
    }()

    /// Сумма к оплате
    private lazy var totalDollarLabel: UILabel = {
        let label = UILabel()
        label.textColor = .label
        label.font = .systemFont(ofSize: 18, weight: .bold)
        return label
    }()

    /// Кнопка "Продолжить покупки"
    private lazy var continueShoppingButton: UIButton = {
        let button = UIButton()
        button.setTitle("Continue Shopping", for: .normal)
        button.backgroundColor = .systemBackground
        button.setTitleColor(.label, for: .normal)
        button.layer.cornerRadius = 8
        button.layer.borderWidth = 1
        button.layer.borderColor = UIColor.label.cgColor
        button.clipsToBounds = true
        button.addTarget(
            self,
            action: #selector(continueShoppingTapped),
            for: .touchUpInside
        )
        return button
    }()

    /// Кнопка "Оформить заказ"
    private lazy var completePaymentButton: UIButton = {
        let button = UIButton()
        button.setTitle("Complete the Payment", for: .normal)
        button.backgroundColor = .label
        button.setTitleColor(.systemBackground, for: .normal)
        button.layer.cornerRadius = 8
        button.clipsToBounds = true
        button.addTarget(
            self,
            action: #selector(completePaymentTapped),
            for: .touchUpInside
        )
        return button
    }()

    /// Вертикальный стек
    private lazy var vStackView: VerticalStackView = {
        let stackView = VerticalStackView(
            arrangedSubviews: [
                totalPriceTitleLabel,
                totalDollarLabel,
                continueShoppingButton,
                completePaymentButton
            ],
            spacing: 4
        )
        stackView.alignment = .leading
        return stackView
    }()

    // MARK: - Properties

    weak var delegate: BasketBottomViewButtonDelegate?

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupConstraints()
        backgroundColor = .systemBackground
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupConstraints() {
        addSubview(vStackView)

        continueShoppingButton.snp.makeConstraints { make in
            make.width.equalToSuperview()
            make.height.equalTo(40)
        }

        completePaymentButton.snp.makeConstraints { make in
            make.width.equalToSuperview()
            make.height.equalTo(40)
        }

        vStackView.snp.makeConstraints { make in
            make.edges.equalToSuperview().inset(16)
        }
    }

    // MARK: - Public Methods

    func fixTotalPrice(price: Double) {
        let formattedPrice = String(format: "%.2f", price)
        totalDollarLabel.text = price != 0 ? "$\(formattedPrice)" : "0"
    }

    // MARK: - Actions

    @objc private func continueShoppingTapped() {
        delegate?.continueShoppingTapped()
    }

    @objc private func completePaymentTapped() {
        delegate?.completePaymentTapped()
    }
}
```

### 17.4.7 EmptyBasketView — пустая корзина

```swift
// Modules/Basket/UIComponents/CustomViews/EmptyBasketView.swift
import UIKit

final class EmptyBasketView: UIView {

    // MARK: - UI Components

    /// Иконка корзины
    private lazy var basketImageView: UIImageView = {
        let image = UIImage(
            systemName: "basket",
            withConfiguration: UIImage.SymbolConfiguration(pointSize: 40)
        )
        let imageView = UIImageView(image: image)
        imageView.tintColor = .label
        return imageView
    }()

    /// Сообщение о пустой корзине
    private lazy var emptyMessageLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 26, weight: .thin)
        label.textColor = .label
        label.text = "Your basket is empty."
        return label
    }()

    /// Вертикальный стек
    private lazy var vStackView: VerticalStackView = {
        let stackView = VerticalStackView(
            arrangedSubviews: [emptyMessageLabel, basketImageView],
            spacing: 8
        )
        stackView.alignment = .center
        return stackView
    }()

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup

    private func setupConstraints() {
        addSubview(vStackView)

        vStackView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }
}
```

### Визуализация экрана Basket

```
┌─────────────────────────────────────────────┐
│              My Basket                       │
├─────────────────────────────────────────────┤
│  ┌─────┬───────────────────┬─────────┐      │
│  │     │  Product Title    │   2     │      │
│  │ IMG │  $ 1999.98        │  [-][+] │      │
│  └─────┴───────────────────┴─────────┘      │
│  ─────────────────────────────────────      │
│  ┌─────┬───────────────────┬─────────┐      │
│  │     │  Another Product  │   1     │      │
│  │ IMG │  $ 299.99         │  [-][+] │      │
│  └─────┴───────────────────┴─────────┘      │
│                                             │
│          (Если корзина пуста)               │
│                                             │
│         Your basket is empty.               │
│              🛒                              │
│                                             │
├─────────────────────────────────────────────┤
│  Total Price Payable                        │
│  $2299.97                                   │
│  ┌─────────────────────────────────────┐   │
│  │       Continue Shopping             │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │       Complete the Payment          │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 17.5 Интеграция модулей в MainTabBar

Добавим вкладку корзины в Tab Bar.

```swift
// Modules/MainTabBar/MainTabBarRouter.swift

static func startMainTabBar() -> UITabBarController {
    let tabBar = MainTabBarViewController()

    // Home — вкладка 0
    let homeVC = UINavigationController(
        rootViewController: HomeRouter.startHomeModule()
    )
    homeVC.tabBarItem = UITabBarItem(
        title: "Home",
        image: UIImage(systemName: "house"),
        selectedImage: UIImage(systemName: "house.fill")
    )

    // Favorites — вкладка 1
    let favoritesVC = UINavigationController(
        rootViewController: FavoritesRouter.startFavoritesModule()
    )
    favoritesVC.tabBarItem = UITabBarItem(
        title: "Favorites",
        image: UIImage(systemName: "heart"),
        selectedImage: UIImage(systemName: "heart.fill")
    )

    // Basket — вкладка 2
    let basketVC = UINavigationController(
        rootViewController: BasketRouter.startBasketModule()
    )
    basketVC.tabBarItem = UITabBarItem(
        title: "Basket",
        image: UIImage(systemName: "basket"),
        selectedImage: UIImage(systemName: "basket.fill")
    )

    // Profile — вкладка 3
    let profileVC = UINavigationController(
        rootViewController: ProfileRouter.startProfileModule()
    )
    profileVC.tabBarItem = UITabBarItem(
        title: "Profile",
        image: UIImage(systemName: "person"),
        selectedImage: UIImage(systemName: "person.fill")
    )

    tabBar.viewControllers = [homeVC, favoritesVC, basketVC, profileVC]

    return tabBar
}
```

---

## 17.6 Полная схема взаимодействия модулей

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ПОЛНАЯ СХЕМА МОДУЛЕЙ                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   HOME MODULE                    PRODUCTDETAIL MODULE                   │
│   ┌─────────────┐               ┌─────────────────────┐                │
│   │ HomeVC      │ ──tap───────► │ ProductDetailVC     │                │
│   │ [Products]  │               │ ┌─────────────────┐ │                │
│   └─────────────┘               │ │ Product Info    │ │                │
│         ▲                       │ │ ♥ Favorite      │ │                │
│         │                       │ │ [Add to Basket] │ │                │
│         │                       │ └─────────────────┘ │                │
│         │                       └──────────┬──────────┘                │
│         │                                  │                           │
│         │                                  │ addBasket()               │
│         │                                  ▼                           │
│         │                       ┌─────────────────────┐                │
│         │                       │   BASKET MODULE     │                │
│         │                       │ ┌─────────────────┐ │                │
│         │                       │ │ [Item 1] [-][+] │ │                │
│         └── Continue Shopping ──│ │ [Item 2] [-][+] │ │                │
│                                 │ │ Total: $999.99  │ │                │
│                                 │ │ [Complete]      │ │                │
│                                 │ └─────────────────┘ │                │
│                                 └──────────┬──────────┘                │
│                                            │                           │
│                                            │ completePayment()         │
│                                            ▼                           │
│                                 ┌─────────────────────┐                │
│                                 │  COMPLETEORDER      │                │
│                                 │  MODULE             │                │
│                                 └─────────────────────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 17.7 Вспомогательные компоненты

### UIScreenBounds — размеры экрана

```swift
// Core/Extensions/UIScreenBounds.swift

struct UIScreenBounds {
    static let width = UIScreen.main.bounds.width
    static let height = UIScreen.main.bounds.height
}
```

### VerticalStackView — удобный стек

```swift
// Core/Extensions/VerticalStackView.swift
import UIKit

final class VerticalStackView: UIStackView {

    init(
        arrangedSubviews: [UIView],
        spacing: CGFloat = 0,
        alignment: UIStackView.Alignment = .fill,
        distribution: UIStackView.Distribution = .fill
    ) {
        super.init(frame: .zero)

        arrangedSubviews.forEach { addArrangedSubview($0) }

        self.axis = .vertical
        self.spacing = spacing
        self.alignment = alignment
        self.distribution = distribution
    }

    required init(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
```

### PaddingLabel — метка с отступами

```swift
// Core/Extensions/PaddingLabel.swift
import UIKit

final class PaddingLabel: UILabel {

    var topInset: CGFloat
    var bottomInset: CGFloat
    var leftInset: CGFloat
    var rightInset: CGFloat

    init(
        withInsets top: CGFloat,
        _ bottom: CGFloat,
        _ left: CGFloat,
        _ right: CGFloat
    ) {
        self.topInset = top
        self.bottomInset = bottom
        self.leftInset = left
        self.rightInset = right
        super.init(frame: .zero)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func drawText(in rect: CGRect) {
        let insets = UIEdgeInsets(
            top: topInset,
            left: leftInset,
            bottom: bottomInset,
            right: rightInset
        )
        super.drawText(in: rect.inset(by: insets))
    }

    override var intrinsicContentSize: CGSize {
        let size = super.intrinsicContentSize
        return CGSize(
            width: size.width + leftInset + rightInset,
            height: size.height + topInset + bottomInset
        )
    }
}
```

### GeneralError — ошибки приложения

```swift
// Entities/Enums/GeneralError.swift

enum GeneralError: LocalizedError {
    case emptyBasketError
    case unknown

    var errorDescription: String? {
        switch self {
        case .emptyBasketError:
            return "Your basket is empty. Add some products first."
        case .unknown:
            return "An unknown error occurred."
        }
    }
}
```

---

## 17.8 Итоги главы

В этой главе мы создали два полноценных VIPER модуля:

### ProductDetail модуль:

| Компонент | Ответственность |
|-----------|-----------------|
| **Router** | Создание модуля, навигация (назад, в корзину) |
| **Interactor** | Загрузка товара, работа с избранным, добавление в корзину |
| **Presenter** | Связь View-Interactor, форматирование данных |
| **View** | Отображение информации, обработка нажатий |

### Basket модуль:

| Компонент | Ответственность |
|-----------|-----------------|
| **Router** | Создание модуля, переход к оформлению |
| **Interactor** | Работа с Firebase, подсчёт суммы, обновление количества |
| **Presenter** | Форматирование цен, управление состоянием |
| **View** | TableView с товарами, пустое состояние |

### Ключевые паттерны:

```
┌────────────────────────────────────────────────────────────────┐
│                  ИЗУЧЕННЫЕ КОНЦЕПЦИИ                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✅ Firebase Real-time Updates (SnapshotListener)              │
│  ✅ Делегирование (Delegate pattern) в ячейках                 │
│  ✅ UIStepper для изменения количества                         │
│  ✅ Класс vs Структура (когда использовать)                    │
│  ✅ Empty State UI (пустая корзина)                            │
│  ✅ Навигация между модулями через Router                      │
│  ✅ Dependency Injection в VIPER                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Следующая глава

В [Главе 18](../18-Favorites/README.md) мы создадим модуль избранного с сохранением в Realm.
