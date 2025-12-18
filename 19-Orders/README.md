# Глава 19: Оформление заказа

## Введение

В этой главе мы создадим финальный этап покупки — модуль оформления заказа (CompleteOrder). Пользователь выбирает адрес доставки, платёжную карту и подтверждает заказ.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ПРОЦЕСС ОФОРМЛЕНИЯ ЗАКАЗА                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Корзина → CompleteOrder → Выбор адреса → Выбор карты → Заказ │
│                                                                 │
│   ┌─────────┐    ┌─────────────┐    ┌─────────────┐            │
│   │ Basket  │───►│ CompleteOrder│───►│   Success   │            │
│   │ Module  │    │   Module    │    │   Alert     │            │
│   └─────────┘    └──────┬──────┘    └─────────────┘            │
│                         │                                       │
│              ┌──────────┴──────────┐                           │
│              │                     │                           │
│              ▼                     ▼                           │
│        ┌──────────┐         ┌──────────┐                       │
│        │ Addresses │         │ PaymentInfo│                     │
│        │  Module   │         │   Module   │                     │
│        └──────────┘         └──────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 19.1 Модели данных

### AddressModel — модель адреса

```swift
// Entities/Models/StorageModels/AddressModel.swift
import Foundation
import RealmSwift

/// Модель адреса доставки для хранения в Realm
final class AddressModel: Object {

    // MARK: - Persisted Properties

    /// ID пользователя
    @Persisted var userId: String?

    /// Уникальный идентификатор адреса
    @Persisted var uuid: UUID?

    /// Название адреса (например, "Дом", "Работа")
    @Persisted var name: String

    /// Страна
    @Persisted var country: String

    /// Город
    @Persisted var city: String

    /// Улица
    @Persisted var street: String

    /// Номер дома
    @Persisted var buildingNumber: Int

    /// Почтовый индекс
    @Persisted var zipCode: Int

    // MARK: - Computed Properties

    /// Полный адрес для отображения
    var fullAddress: String {
        "\(street), \(buildingNumber), \(city), \(country), \(zipCode)"
    }

    // MARK: - Convenience Init

    convenience init(
        userId: String?,
        uuid: UUID?,
        name: String,
        country: String,
        city: String,
        street: String,
        buildingNumber: Int,
        zipCode: Int
    ) {
        self.init()
        self.userId = userId
        self.uuid = uuid
        self.name = name
        self.country = country
        self.city = city
        self.street = street
        self.buildingNumber = buildingNumber
        self.zipCode = zipCode
    }
}
```

### CardModel — модель банковской карты

```swift
// Entities/Models/StorageModels/CardModel.swift
import Foundation
import RealmSwift

/// Модель банковской карты для хранения в Realm
final class CardModel: Object {

    // MARK: - Persisted Properties

    /// ID пользователя
    @Persisted var userId: String

    /// Уникальный идентификатор карты
    @Persisted var uuid: String

    /// Имя и фамилия владельца
    @Persisted var nameSurname: String

    /// Название карты (например, "Основная", "Visa")
    @Persisted var cardName: String

    /// Номер карты (маскированный для отображения)
    @Persisted var cardNumber: String

    /// Месяц истечения
    @Persisted var month: String

    /// Год истечения
    @Persisted var year: String

    /// CVV код (в реальном приложении НЕ хранить!)
    @Persisted var cvv: String

    // MARK: - Computed Properties

    /// Маскированный номер карты для отображения
    var maskedNumber: String {
        let lastFour = String(cardNumber.suffix(4))
        return "**** **** **** \(lastFour)"
    }

    /// Дата истечения
    var expiryDate: String {
        "\(month)/\(year)"
    }

    // MARK: - Convenience Init

    convenience init(
        userId: String,
        uuid: String,
        nameSurname: String,
        cardName: String,
        cardNumber: String,
        month: String,
        year: String,
        cvv: String
    ) {
        self.init()
        self.userId = userId
        self.uuid = uuid
        self.nameSurname = nameSurname
        self.cardName = cardName
        self.cardNumber = cardNumber
        self.month = month
        self.year = year
        self.cvv = cvv
    }
}
```

### Визуализация моделей

```
┌─────────────────────────────────────────────────────────────────┐
│                         AddressModel                            │
├─────────────────────────────────────────────────────────────────┤
│  userId: "abc123"                                               │
│  uuid: UUID()                                                   │
│  name: "Дом"          ← Для выбора из списка                    │
│  country: "Россия"                                              │
│  city: "Москва"                                                 │
│  street: "ул. Пушкина"                                          │
│  buildingNumber: 10                                             │
│  zipCode: 123456                                                │
│                                                                 │
│  fullAddress → "ул. Пушкина, 10, Москва, Россия, 123456"        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          CardModel                              │
├─────────────────────────────────────────────────────────────────┤
│  userId: "abc123"                                               │
│  uuid: "uuid-123"                                               │
│  nameSurname: "Ivan Ivanov"                                     │
│  cardName: "Visa Основная"   ← Для выбора из списка             │
│  cardNumber: "4111111111111111"                                 │
│  month: "12"                                                    │
│  year: "25"                                                     │
│  cvv: "123"  ← В реальном приложении НЕ хранить!               │
│                                                                 │
│  maskedNumber → "**** **** **** 1111"                           │
│  expiryDate → "12/25"                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 19.2 Структура VIPER модуля CompleteOrder

```
Modules/CompleteOrder/
├── Base/
│   ├── CompleteOrderViewController.swift    ← View
│   ├── CompleteOrderInteractor.swift        ← Interactor
│   ├── CompleteOrderPresenter.swift         ← Presenter
│   └── CompleteOrderRouter.swift            ← Router
└── UIComponents/
    └── Cells/
        ├── AddressInfoCell.swift            ← Выбор адреса
        ├── CardInfoCell.swift               ← Выбор карты
        └── TotalPriceCell.swift             ← Итоговая сумма
```

---

## 19.3 CompleteOrderRouter — создание модуля

```swift
// Modules/CompleteOrder/Base/CompleteOrderRouter.swift
import Foundation
import UIKit

// MARK: - Protocol

protocol CompleteOrderRouterProtocol {
    /// Перейти к добавлению платёжной информации
    func toPaymentInfo()

    /// Перейти к управлению адресами
    func toAddresses()

    /// Вернуться на главную после успешного заказа
    func toHome()
}

// MARK: - Router

final class CompleteOrderRouter {

    // MARK: - Properties

    private weak var view: UIViewController?

    // MARK: - Init

    init(view: UIViewController) {
        self.view = view
    }

    // MARK: - Module Creation

    /// Фабричный метод создания модуля
    /// - Parameter items: Товары из корзины для оформления заказа
    /// - Returns: Готовый ViewController
    static func startCompleteOrderModule(items: [BasketModel]?) -> UIViewController {
        // 1. Создаём View
        let view = CompleteOrderViewController()

        // 2. Создаём Router
        let router = CompleteOrderRouter(view: view)

        // 3. Создаём Interactor с зависимостями
        let interactor = CompleteOrderInteractor(
            items: items,
            storageManager: RealmManager.shared,
            basketManager: BasketManager()
        )

        // 4. Создаём Presenter
        let presenter = CompleteOrderPresenter(
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

// MARK: - CompleteOrderRouterProtocol

extension CompleteOrderRouter: CompleteOrderRouterProtocol {

    func toPaymentInfo() {
        // Переход к модулю добавления карты
        let paymentInfoModule = PaymentInfoRouter.startPaymentInfoModule()
        view?.navigationController?.pushViewController(paymentInfoModule, animated: true)
    }

    func toAddresses() {
        // Переход к модулю управления адресами
        let addressesModule = AddressesRouter.startAddressesModule()
        view?.navigationController?.pushViewController(addressesModule, animated: true)
    }

    func toHome() {
        // Возвращаемся на главную и переключаемся на Home
        view?.navigationController?.popToRootViewController(animated: true)
        view?.tabBarController?.selectedIndex = 0
    }
}
```

---

## 19.4 CompleteOrderInteractor — бизнес-логика

```swift
// Modules/CompleteOrder/Base/CompleteOrderInteractor.swift
import Foundation
import FirebaseFirestore

// MARK: - Input Protocol

protocol CompleteOrderInteractorInputs {
    /// Загрузить сохранённые адреса
    func getAddresses()

    /// Загрузить сохранённые карты
    func getCards()

    /// Получить адреса для отображения
    func showAddresses() -> [AddressModel]?

    /// Получить карты для отображения
    func showCards() -> [CardModel]?

    /// Получить итоговую сумму и стоимость доставки
    func showTotalAndDeliveryPrice() -> (price: Double, delivery: Double)?

    /// Сохранить заказ
    func saveOrder(address: AddressModel?, card: CardModel?)
}

// MARK: - Output Protocol

protocol CompleteOrderInteractorOutputs: AnyObject {
    func dataRefreshed()
    func alert(title: String, message: String)
    func orderSuccess()
}

// MARK: - Interactor

final class CompleteOrderInteractor {

    // MARK: - Properties

    weak var presenter: CompleteOrderInteractorOutputs?

    private let storageManager: RealmManagerProtocol?
    private let basketManager: BasketManagerProtocol?
    private let firestore = Firestore.firestore()

    /// Список адресов пользователя
    private var addresses: [AddressModel]? {
        didSet {
            presenter?.dataRefreshed()
        }
    }

    /// Список карт пользователя
    private var cards: [CardModel]? {
        didSet {
            presenter?.dataRefreshed()
        }
    }

    /// Товары для заказа (из корзины)
    private var items: [BasketModel]?

    // MARK: - Init

    init(
        items: [BasketModel]?,
        storageManager: RealmManagerProtocol,
        basketManager: BasketManagerProtocol
    ) {
        self.items = items
        self.storageManager = storageManager
        self.basketManager = basketManager
    }
}

// MARK: - CompleteOrderInteractorInputs

extension CompleteOrderInteractor: CompleteOrderInteractorInputs {

    func getAddresses() {
        self.addresses = storageManager?.getAll(AddressModel.self)
    }

    func getCards() {
        self.cards = storageManager?.getAll(CardModel.self)
    }

    func showAddresses() -> [AddressModel]? {
        return addresses
    }

    func showCards() -> [CardModel]? {
        return cards
    }

    func showTotalAndDeliveryPrice() -> (price: Double, delivery: Double)? {
        /*
         Подсчёт итоговой суммы:
         1. Суммируем цены всех товаров × количество
         2. Добавляем фиксированную стоимость доставки
         */

        var total = 0.0
        let deliveryPrice = 5.50  // Фиксированная стоимость доставки

        if let items {
            for item in items {
                total += item.productPrice * Double(item.count)
            }
        }

        return (total, deliveryPrice)
    }

    func saveOrder(address: AddressModel?, card: CardModel?) {
        /*
         Сохранение заказа в Firebase:
         1. Валидация данных
         2. Сохранение адреса в коллекцию Addresses
         3. Сохранение карты в коллекцию Cards
         4. Создание заказа в коллекции Orders
         5. Очистка корзины
         6. Уведомление пользователя
         */

        guard let address = address, let card = card else {
            presenter?.alert(title: "", message: GeneralError.emptyAddressOrCard.localizedDescription)
            return
        }

        // Подготовка данных адреса
        let addressData: [String: Any] = [
            "street": address.street,
            "buildingNumber": address.buildingNumber,
            "city": address.city,
            "country": address.country
        ]
        let addressRef = firestore.collection("Addresses").document()
        addressRef.setData(addressData)

        // Подготовка данных карты
        let cardData: [String: Any] = [
            "cardNumber": card.cardNumber
        ]
        let cardRef = firestore.collection("Cards").document()
        cardRef.setData(cardData)

        // Подготовка данных заказа
        var products: [String: Int] = [:]
        var total = 5.50  // Начинаем с доставки

        if let items {
            for item in items {
                products[item.productTitle] = item.count
                total += item.productPrice * Double(item.count)
            }
        }

        let orderData: [String: Any] = [
            "customerName": card.nameSurname,
            "userId": address.userId ?? "",
            "address": addressRef,  // Ссылка на документ адреса
            "card": cardRef,        // Ссылка на документ карты
            "products": products,
            "total": total,
            "date": FieldValue.serverTimestamp()  // Серверное время
        ]

        // Сохранение заказа
        firestore.collection("Orders").addDocument(data: orderData) { [weak self] error in
            guard let self else { return }

            if error != nil {
                self.presenter?.alert(
                    title: "",
                    message: FirebaseError.addOrderFailed.localizedDescription
                )
            } else {
                // Очищаем корзину после успешного заказа
                self.clearBasket()

                // Показываем сообщение об успехе
                self.presenter?.alert(
                    title: "Success",
                    message: "The order has been created. It will be delivered as soon as possible. Thank you."
                )

                // Возвращаемся на главную через 3 секунды
                DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
                    self?.presenter?.orderSuccess()
                }
            }
        }
    }

    // MARK: - Private Methods

    private func clearBasket() {
        // Удаляем все товары из корзины
        if let basketItems = items {
            for item in basketItems {
                basketManager?.deleteBasketItem(item: item) { error in
                    print("Error clearing basket: \(error.localizedDescription)")
                }
            }
        }
    }
}
```

### Схема сохранения заказа

```
┌─────────────────────────────────────────────────────────────────┐
│                  FIREBASE ORDER STRUCTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Firestore                                                     │
│   ├── Addresses/                                                │
│   │   └── {addressId}                                          │
│   │       ├── street: "ул. Пушкина"                            │
│   │       ├── buildingNumber: 10                               │
│   │       ├── city: "Москва"                                   │
│   │       └── country: "Россия"                                │
│   │                                                             │
│   ├── Cards/                                                    │
│   │   └── {cardId}                                             │
│   │       └── cardNumber: "4111...1111"                        │
│   │                                                             │
│   └── Orders/                                                   │
│       └── {orderId}                                            │
│           ├── customerName: "Ivan Ivanov"                      │
│           ├── userId: "abc123"                                 │
│           ├── address: Reference → Addresses/{addressId}       │
│           ├── card: Reference → Cards/{cardId}                 │
│           ├── products: { "iPhone": 2, "Case": 1 }            │
│           ├── total: 2005.50                                   │
│           └── date: Timestamp                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 19.5 CompleteOrderPresenter — связующее звено

```swift
// Modules/CompleteOrder/Base/CompleteOrderPresenter.swift
import Foundation

// MARK: - Input Protocol

protocol CompleteOrderPresenterInputs {
    func viewDidLoad()
    func viewWillAppear()

    /// Количество секций в CollectionView
    func numberOfSections() -> Int

    /// Количество элементов в секции
    func numberOfItemsInSection(section: Int) -> Int

    /// Данные для ячейки
    func cellForItemAt(indexPath: IndexPath) -> [Any]

    /// Размер ячейки
    func sizeForItemAt(indexPath: IndexPath) -> CGSize

    /// Нажатие кнопки "Оформить заказ"
    func completeButtonTapped()

    /// Нажатие "Add/Update" для карт
    func addUpdateTappedFromCards()

    /// Нажатие "Add/Update" для адресов
    func addUpdateTappedFromAddresses()

    /// Получить сумму и доставку
    func showTotalAndDeliveryPrice() -> (price: Double, delivery: Double)?

    /// Пользователь выбрал карту
    func didSelectCard(cardName: String)

    /// Пользователь выбрал адрес
    func didSelectAddress(addressName: String)
}

// MARK: - Presenter

final class CompleteOrderPresenter {

    // MARK: - Properties

    private weak var view: CompleteOrderViewProtocol?
    private let interactor: CompleteOrderInteractorInputs?
    private let router: CompleteOrderRouterProtocol?

    /// Выбранная карта
    private var selectedCard: CardModel?

    /// Выбранный адрес
    private var selectedAddress: AddressModel?

    // MARK: - Init

    init(
        view: CompleteOrderViewProtocol,
        interactor: CompleteOrderInteractorInputs,
        router: CompleteOrderRouterProtocol
    ) {
        self.view = view
        self.interactor = interactor
        self.router = router
    }
}

// MARK: - CompleteOrderPresenterInputs

extension CompleteOrderPresenter: CompleteOrderPresenterInputs {

    func viewDidLoad() {
        view?.setNavTitle(title: "Complete Order")
        view?.setBackgroundColor(color: .systemBackground)
        view?.setTabBarVisibility()
        view?.prepareCompleteButton()
        view?.prepareCollectionView()
    }

    func viewWillAppear() {
        // Обновляем данные при каждом появлении
        interactor?.getCards()
        interactor?.getAddresses()
    }

    func numberOfSections() -> Int {
        /*
         Структура CollectionView:
         Секция 0: AddressInfoCell (выбор адреса)
         Секция 1: CardInfoCell (выбор карты)
         Секция 2: TotalPriceCell (итоговая сумма)
         */
        return 3
    }

    func numberOfItemsInSection(section: Int) -> Int {
        return 1  // По одной ячейке в каждой секции
    }

    func cellForItemAt(indexPath: IndexPath) -> [Any] {
        switch indexPath.section {
        case 0:
            return interactor?.showAddresses() ?? []
        case 1:
            return interactor?.showCards() ?? []
        default:
            return []
        }
    }

    func sizeForItemAt(indexPath: IndexPath) -> CGSize {
        switch indexPath.section {
        case 0, 1:
            // Ячейки адреса и карты
            return CGSize(width: UIScreenBounds.width - 32, height: 180)
        default:
            // Ячейка итоговой суммы
            return CGSize(width: UIScreenBounds.width - 32, height: 100)
        }
    }

    func showTotalAndDeliveryPrice() -> (price: Double, delivery: Double)? {
        return interactor?.showTotalAndDeliveryPrice()
    }

    func addUpdateTappedFromCards() {
        router?.toPaymentInfo()
    }

    func addUpdateTappedFromAddresses() {
        router?.toAddresses()
    }

    func didSelectCard(cardName: String) {
        // Находим карту по имени
        let selected = interactor?.showCards()?.first { $0.cardName == cardName }
        self.selectedCard = selected
    }

    func didSelectAddress(addressName: String) {
        // Находим адрес по имени
        let selected = interactor?.showAddresses()?.first { $0.name == addressName }
        self.selectedAddress = selected
    }

    func completeButtonTapped() {
        /*
         Валидация перед оформлением:
         1. Проверяем, выбраны ли адрес и карта
         2. Проверяем, что они не пустые
         */

        guard let selectedCard = selectedCard,
              let selectedAddress = selectedAddress,
              !selectedAddress.name.isEmpty,
              !selectedCard.cardName.isEmpty else {
            view?.presentAlert(
                title: "",
                message: GeneralError.emptyAddressOrCard.localizedDescription
            )
            return
        }

        interactor?.saveOrder(address: selectedAddress, card: selectedCard)
    }
}

// MARK: - CompleteOrderInteractorOutputs

extension CompleteOrderPresenter: CompleteOrderInteractorOutputs {

    func dataRefreshed() {
        view?.dataRefreshed()
    }

    func alert(title: String, message: String) {
        view?.presentAlert(title: title, message: message)
    }

    func orderSuccess() {
        router?.toHome()
    }
}
```

---

## 19.6 CompleteOrderViewController — отображение

```swift
// Modules/CompleteOrder/Base/CompleteOrderViewController.swift
import UIKit

// MARK: - View Protocol

protocol CompleteOrderViewProtocol: AnyObject {
    func setNavTitle(title: String)
    func setBackgroundColor(color: UIColor)
    func setTabBarVisibility()
    func prepareCollectionView()
    func prepareCompleteButton()
    func dataRefreshed()
    func presentAlert(title: String, message: String)
}

// MARK: - ViewController

final class CompleteOrderViewController: UIViewController {

    // MARK: - UI Components

    private lazy var completeOrderCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        let collectionView = UICollectionView(
            frame: .zero,
            collectionViewLayout: layout
        )
        collectionView.delegate = self
        collectionView.dataSource = self

        // Регистрируем ячейки
        collectionView.register(
            AddressInfoCell.self,
            forCellWithReuseIdentifier: AddressInfoCell.identifier
        )
        collectionView.register(
            CardInfoCell.self,
            forCellWithReuseIdentifier: CardInfoCell.identifier
        )
        collectionView.register(
            TotalPriceCell.self,
            forCellWithReuseIdentifier: TotalPriceCell.identifier
        )

        return collectionView
    }()

    private lazy var completeOrderButton: UIButton = {
        let button = UIButton()
        button.backgroundColor = .label
        button.setTitleColor(.systemBackground, for: .normal)
        button.layer.cornerRadius = 8
        button.setTitle("Complete Order", for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        button.addTarget(
            self,
            action: #selector(completeButtonTapped),
            for: .touchUpInside
        )
        return button
    }()

    // MARK: - Properties

    var presenter: CompleteOrderPresenterInputs!

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        presenter.viewDidLoad()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        presenter.viewWillAppear()
    }

    // MARK: - Actions

    @objc private func completeButtonTapped() {
        presenter.completeButtonTapped()
    }
}

// MARK: - CompleteOrderViewProtocol

extension CompleteOrderViewController: CompleteOrderViewProtocol {

    func setNavTitle(title: String) {
        self.title = title
    }

    func setBackgroundColor(color: UIColor) {
        view.backgroundColor = color
    }

    func setTabBarVisibility() {
        tabBarController?.tabBar.isHidden = true
    }

    func prepareCollectionView() {
        view.addSubview(completeOrderCollectionView)
        completeOrderCollectionView.backgroundColor = .systemGray6

        completeOrderCollectionView.snp.makeConstraints { make in
            make.top.left.right.equalToSuperview()
            make.bottom.equalTo(completeOrderButton.snp.top).offset(-16)
        }
    }

    func prepareCompleteButton() {
        view.addSubview(completeOrderButton)

        completeOrderButton.snp.makeConstraints { make in
            make.left.equalToSuperview().offset(16)
            make.right.equalToSuperview().inset(16)
            make.height.equalTo(60)
            make.bottom.equalTo(view.safeAreaLayoutGuide.snp.bottom).offset(-20)
        }
    }

    func dataRefreshed() {
        completeOrderCollectionView.reloadData()
    }

    func presentAlert(title: String, message: String) {
        showAlert(title: title, message: message)
    }
}

// MARK: - CardInfoCellDelegate

extension CompleteOrderViewController: CardInfoCellDelegate {

    func addUpdateTapped() {
        presenter.addUpdateTappedFromCards()
    }

    func didSelectCard(cardName: String) {
        presenter.didSelectCard(cardName: cardName)
    }
}

// MARK: - AddressInfoCellDelegate

extension CompleteOrderViewController: AddressInfoCellDelegate {

    func addUpdateTappedFromAddress() {
        presenter.addUpdateTappedFromAddresses()
    }

    func didSelectAddress(addressName: String) {
        presenter.didSelectAddress(addressName: addressName)
    }
}

// MARK: - UICollectionViewDelegate & DataSource

extension CompleteOrderViewController: UICollectionViewDelegate,
                                       UICollectionViewDataSource,
                                       UICollectionViewDelegateFlowLayout {

    func numberOfSections(in collectionView: UICollectionView) -> Int {
        return presenter.numberOfSections()
    }

    func collectionView(
        _ collectionView: UICollectionView,
        numberOfItemsInSection section: Int
    ) -> Int {
        return presenter.numberOfItemsInSection(section: section)
    }

    func collectionView(
        _ collectionView: UICollectionView,
        cellForItemAt indexPath: IndexPath
    ) -> UICollectionViewCell {

        switch indexPath.section {
        case 0:
            // Ячейка выбора адреса
            guard let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: AddressInfoCell.identifier,
                for: indexPath
            ) as? AddressInfoCell else {
                return UICollectionViewCell()
            }

            cell.backgroundColor = .systemBackground
            cell.layer.cornerRadius = 8
            cell.layer.shadowOpacity = 0.2
            cell.delegate = self
            cell.showAddres(
                addresses: presenter.cellForItemAt(indexPath: indexPath) as? [AddressModel]
            )

            return cell

        case 1:
            // Ячейка выбора карты
            guard let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: CardInfoCell.identifier,
                for: indexPath
            ) as? CardInfoCell else {
                return UICollectionViewCell()
            }

            cell.backgroundColor = .systemBackground
            cell.layer.cornerRadius = 8
            cell.layer.shadowOpacity = 0.2
            cell.delegate = self
            cell.showCards(
                cards: presenter.cellForItemAt(indexPath: indexPath) as? [CardModel]
            )

            return cell

        default:
            // Ячейка итоговой суммы
            guard let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: TotalPriceCell.identifier,
                for: indexPath
            ) as? TotalPriceCell else {
                return UICollectionViewCell()
            }

            cell.backgroundColor = .systemBackground
            cell.layer.cornerRadius = 8
            cell.layer.shadowOpacity = 0.2
            cell.showModel(model: presenter.showTotalAndDeliveryPrice())

            return cell
        }
    }

    func collectionView(
        _ collectionView: UICollectionView,
        layout collectionViewLayout: UICollectionViewLayout,
        sizeForItemAt indexPath: IndexPath
    ) -> CGSize {
        return presenter.sizeForItemAt(indexPath: indexPath)
    }

    func collectionView(
        _ collectionView: UICollectionView,
        layout collectionViewLayout: UICollectionViewLayout,
        insetForSectionAt section: Int
    ) -> UIEdgeInsets {
        return UIEdgeInsets(top: 16, left: 16, bottom: 0, right: 16)
    }
}
```

### Визуализация экрана CompleteOrder

```
┌─────────────────────────────────────────────┐
│          Complete Order                      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Delivery Address      [Add/Update] │   │
│  │  ┌─────────────────────────────┐   │   │
│  │  │ Select delivery address  ▼  │   │   │
│  │  └─────────────────────────────┘   │   │
│  │  • Дом                              │   │
│  │  • Работа                           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Card Information      [Add/Update] │   │
│  │  ┌─────────────────────────────┐   │   │
│  │  │ Select your card         ▼  │   │   │
│  │  └─────────────────────────────┘   │   │
│  │  • Visa Основная                    │   │
│  │  • MasterCard                       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Delivery              $5.50        │   │
│  │  Basket               $999.99       │   │
│  │  Total              $1005.49        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │         Complete Order              │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 19.7 AddressInfoCell — выбор адреса

```swift
// Modules/CompleteOrder/UIComponents/Cells/AddressInfoCell.swift
import UIKit

// MARK: - Delegate Protocol

protocol AddressInfoCellDelegate: AnyObject {
    func addUpdateTappedFromAddress()
    func didSelectAddress(addressName: String)
}

// MARK: - Cell

final class AddressInfoCell: UICollectionViewCell {

    // MARK: - Identifier

    static let identifier = "AddressInfoCell"

    // MARK: - UI Components

    private lazy var deliveryAddressLabel: UILabel = {
        let label = UILabel()
        label.text = "Delivery Address"
        label.font = .boldSystemFont(ofSize: 20)
        return label
    }()

    private lazy var addUpdateAddressButton: UIButton = {
        let button = UIButton()
        button.setTitle("Add / Update", for: .normal)
        button.setTitleColor(.label, for: .normal)
        button.addTarget(
            self,
            action: #selector(addUpdateTapped),
            for: .touchUpInside
        )
        return button
    }()

    /// Выпадающий список адресов
    private lazy var dropDownButton: UIDropDown = {
        let drop = UIDropDown(
            frame: CGRect(x: 0, y: 0, width: frame.width - 16, height: 30)
        )
        drop.center = CGPoint(x: frame.midX - 16, y: frame.midY - 20)
        drop.placeholder = "Select delivery address"
        drop.didSelect { [weak self] addressName, _ in
            self?.delegate?.didSelectAddress(addressName: addressName)
        }
        return drop
    }()

    // MARK: - Properties

    weak var delegate: AddressInfoCellDelegate?

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
        addSubview(deliveryAddressLabel)
        contentView.addSubview(addUpdateAddressButton)
        addSubview(dropDownButton)

        deliveryAddressLabel.snp.makeConstraints { make in
            make.top.equalToSuperview().offset(8)
            make.left.equalToSuperview().offset(8)
        }

        addUpdateAddressButton.snp.makeConstraints { make in
            make.centerY.equalTo(deliveryAddressLabel)
            make.right.equalToSuperview().inset(8)
        }
    }

    // MARK: - Actions

    @objc private func addUpdateTapped() {
        delegate?.addUpdateTappedFromAddress()

        // Сбрасываем выбор
        dropDownButton.options = []
        dropDownButton.placeholder = "Select delivery address"
        delegate?.didSelectAddress(addressName: "")
    }

    // MARK: - Configure

    func showAddres(addresses: [AddressModel]?) {
        dropDownButton.options = []

        if let addresses {
            for address in addresses {
                dropDownButton.options.append(address.name)
            }
        }
    }
}
```

---

## 19.8 CardInfoCell — выбор карты

```swift
// Modules/CompleteOrder/UIComponents/Cells/CardInfoCell.swift
import UIKit

// MARK: - Delegate Protocol

protocol CardInfoCellDelegate: AnyObject {
    func addUpdateTapped()
    func didSelectCard(cardName: String)
}

// MARK: - Cell

final class CardInfoCell: UICollectionViewCell {

    // MARK: - Identifier

    static let identifier = "CardInfoCell"

    // MARK: - UI Components

    private lazy var cardInfoLabel: UILabel = {
        let label = UILabel()
        label.text = "Card Information"
        label.font = .boldSystemFont(ofSize: 20)
        return label
    }()

    private lazy var addUpdateCardButton: UIButton = {
        let button = UIButton()
        button.setTitle("Add / Update", for: .normal)
        button.setTitleColor(.label, for: .normal)
        button.addTarget(
            self,
            action: #selector(addUpdateTapped),
            for: .touchUpInside
        )
        return button
    }()

    /// Выпадающий список карт
    private lazy var dropDownButton: UIDropDown = {
        let drop = UIDropDown(
            frame: CGRect(x: 0, y: 0, width: frame.width - 16, height: 30)
        )
        drop.center = CGPoint(
            x: contentView.frame.midX,
            y: contentView.frame.midY - 20
        )
        drop.placeholder = "Select your card"
        drop.didSelect { [weak self] cardName, _ in
            self?.delegate?.didSelectCard(cardName: cardName)
        }
        return drop
    }()

    // MARK: - Properties

    weak var delegate: CardInfoCellDelegate?

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
        addSubview(cardInfoLabel)
        contentView.addSubview(addUpdateCardButton)
        contentView.addSubview(dropDownButton)

        cardInfoLabel.snp.makeConstraints { make in
            make.top.equalToSuperview().offset(8)
            make.left.equalToSuperview().offset(8)
        }

        addUpdateCardButton.snp.makeConstraints { make in
            make.centerY.equalTo(cardInfoLabel)
            make.right.equalToSuperview().inset(8)
        }
    }

    // MARK: - Actions

    @objc private func addUpdateTapped() {
        delegate?.addUpdateTapped()

        // Сбрасываем выбор
        dropDownButton.options = []
        dropDownButton.placeholder = "Select your card"
        delegate?.didSelectCard(cardName: "")
    }

    // MARK: - Configure

    func showCards(cards: [CardModel]?) {
        dropDownButton.options = []

        if let cards {
            for card in cards {
                dropDownButton.options.append(card.cardName)
            }
        }
    }
}
```

---

## 19.9 TotalPriceCell — итоговая сумма

```swift
// Modules/CompleteOrder/UIComponents/Cells/TotalPriceCell.swift
import UIKit

final class TotalPriceCell: UICollectionViewCell {

    // MARK: - Identifier

    static let identifier = "TotalPriceCell"

    // MARK: - UI Components

    private lazy var deliveryLabel: UILabel = {
        let label = UILabel()
        label.font = .boldSystemFont(ofSize: 16)
        label.textColor = .label
        label.text = "Delivery"
        return label
    }()

    private lazy var basketLabel: UILabel = {
        let label = UILabel()
        label.font = .boldSystemFont(ofSize: 16)
        label.textColor = .label
        label.text = "Basket"
        return label
    }()

    private lazy var deliveryPriceLabel: UILabel = {
        let label = UILabel()
        label.font = .boldSystemFont(ofSize: 16)
        label.textColor = .label
        return label
    }()

    private lazy var basketPriceLabel: UILabel = {
        let label = UILabel()
        label.textColor = .label
        label.font = .boldSystemFont(ofSize: 16)
        return label
    }()

    private lazy var totalLabel: UILabel = {
        let label = UILabel()
        label.font = .boldSystemFont(ofSize: 16)
        label.textColor = .label
        label.text = "Total"
        return label
    }()

    private lazy var totalPriceLabel: UILabel = {
        let label = UILabel()
        label.font = .boldSystemFont(ofSize: 16)
        label.textColor = .label
        return label
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
        addSubview(deliveryLabel)
        addSubview(basketLabel)
        addSubview(deliveryPriceLabel)
        addSubview(basketPriceLabel)
        addSubview(totalLabel)
        addSubview(totalPriceLabel)

        deliveryLabel.snp.makeConstraints { make in
            make.top.equalToSuperview().offset(16)
            make.left.equalToSuperview().offset(16)
        }

        deliveryPriceLabel.snp.makeConstraints { make in
            make.centerY.equalTo(deliveryLabel)
            make.right.equalToSuperview().inset(16)
        }

        basketLabel.snp.makeConstraints { make in
            make.top.equalTo(deliveryLabel.snp.bottom).offset(8)
            make.left.equalTo(deliveryLabel)
        }

        basketPriceLabel.snp.makeConstraints { make in
            make.centerY.equalTo(basketLabel)
            make.right.equalTo(deliveryPriceLabel)
        }

        totalLabel.snp.makeConstraints { make in
            make.top.equalTo(basketLabel.snp.bottom).offset(8)
            make.left.equalTo(basketLabel)
        }

        totalPriceLabel.snp.makeConstraints { make in
            make.centerY.equalTo(totalLabel)
            make.right.equalTo(basketPriceLabel)
        }
    }

    // MARK: - Configure

    func showModel(model: (price: Double, delivery: Double)?) {
        guard let model else { return }

        let formattedPrice = String(format: "%.2f", model.price)
        let formattedDelivery = String(format: "%.2f", model.delivery)

        basketPriceLabel.text = "$" + formattedPrice
        deliveryPriceLabel.text = "$" + formattedDelivery

        let total = model.price + model.delivery
        let formattedTotal = String(format: "%.2f", total)
        totalPriceLabel.text = "$" + formattedTotal
    }
}
```

---

## 19.10 Добавление ошибки в GeneralError

```swift
// Entities/Enums/GeneralError.swift

enum GeneralError: LocalizedError {
    case emptyBasketError
    case emptyAddressOrCard
    case unknown

    var errorDescription: String? {
        switch self {
        case .emptyBasketError:
            return "Your basket is empty. Add some products first."
        case .emptyAddressOrCard:
            return "Please select both delivery address and payment card."
        case .unknown:
            return "An unknown error occurred."
        }
    }
}
```

---

## 19.11 Полная схема взаимодействия

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   COMPLETE ORDER MODULE FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   BasketVC ─────► CompleteOrderVC                                       │
│                         │                                               │
│   ┌─────────────────────┴─────────────────────┐                        │
│   │                                           │                        │
│   ▼                                           ▼                        │
│   AddressInfoCell                       CardInfoCell                   │
│   │                                           │                        │
│   │ [Add/Update]                             │ [Add/Update]            │
│   ▼                                           ▼                        │
│   AddressesModule                       PaymentInfoModule              │
│   │                                           │                        │
│   │ (add new address)                        │ (add new card)          │
│   ▼                                           ▼                        │
│   ◄───────── viewWillAppear() ──────────────────┘                      │
│                         │                                               │
│                         │ [Complete Order]                              │
│                         ▼                                               │
│               CompleteOrderInteractor                                   │
│                         │                                               │
│   ┌─────────────────────┼─────────────────────┐                        │
│   │                     │                     │                        │
│   ▼                     ▼                     ▼                        │
│   Save Address    Save Card           Save Order                       │
│   to Firebase     to Firebase         to Firebase                      │
│                         │                                               │
│                         │ Clear Basket                                  │
│                         │                                               │
│                         ▼                                               │
│               Show Success Alert                                        │
│                         │                                               │
│                         │ (after 3 sec)                                 │
│                         ▼                                               │
│               router.toHome()                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 19.12 Итоги главы

В этой главе мы создали модуль оформления заказа:

### Компоненты модуля:

| Компонент | Ответственность |
|-----------|-----------------|
| **AddressModel** | Realm-модель адреса доставки |
| **CardModel** | Realm-модель банковской карты |
| **CompleteOrderRouter** | Создание модуля, навигация |
| **CompleteOrderInteractor** | Работа с Realm и Firebase |
| **CompleteOrderPresenter** | Связь View-Interactor |
| **CompleteOrderViewController** | CollectionView с секциями |
| **AddressInfoCell** | Выбор адреса из списка |
| **CardInfoCell** | Выбор карты из списка |
| **TotalPriceCell** | Отображение итоговой суммы |

### Ключевые паттерны:

```
┌────────────────────────────────────────────────────────────────┐
│                  ИЗУЧЕННЫЕ КОНЦЕПЦИИ                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✅ Firebase References (ссылки между документами)             │
│  ✅ FieldValue.serverTimestamp() (серверное время)             │
│  ✅ UICollectionView с несколькими секциями                    │
│  ✅ Delegate pattern для ячеек                                 │
│  ✅ UIDropDown для выбора из списка                            │
│  ✅ Валидация данных перед сохранением                         │
│  ✅ Очистка данных после успешной операции                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Следующая глава

В [Главе 20](../20-Final/README.md) мы завершим приложение: создадим профиль пользователя, настройки и подготовим приложение к публикации.
