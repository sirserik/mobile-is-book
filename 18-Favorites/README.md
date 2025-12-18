# Глава 18: Избранное

## Введение

Модуль избранного позволяет пользователям сохранять понравившиеся товары для быстрого доступа. В отличие от корзины (Firebase), избранное хранится локально в Realm — это означает мгновенный доступ к данным без интернета.

```
┌─────────────────────────────────────────────────────────────────┐
│                 ИЗБРАННОЕ vs КОРЗИНА                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ИЗБРАННОЕ (Realm)              КОРЗИНА (Firebase)             │
│   ┌─────────────────┐           ┌─────────────────┐             │
│   │  Локально       │           │  Облако         │             │
│   │  Мгновенно      │           │  Real-time      │             │
│   │  Оффлайн        │           │  Синхронизация  │             │
│   │  Только здесь   │           │  На всех устр.  │             │
│   └─────────────────┘           └─────────────────┘             │
│                                                                 │
│   Использование:                Использование:                  │
│   • "Хочу купить потом"         • "Покупаю сейчас"              │
│   • Закладки                    • Оформление заказа             │
│   • Wishlist                    • Оплата                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 18.1 FavoriteProductModel — модель избранного

Модель наследуется от `Object` (Realm) для автоматического сохранения в локальную базу данных.

### Почему Realm Object?

```swift
// ❌ Обычная структура — НЕ сохраняется автоматически
struct FavoriteProduct {
    let productId: Int
    let productTitle: String
    // Нужно вручную сериализовать/десериализовать
}

// ✅ Realm Object — автоматическое сохранение
class FavoriteProductModel: Object {
    @Persisted var productId: Int
    @Persisted var productTitle: String
    // Realm сам сохраняет при realm.add()
}
```

### Создание модели

```swift
// Entities/Models/StorageModels/FavoriteProductModel.swift
import Foundation
import RealmSwift

/// Модель избранного товара для хранения в Realm
final class FavoriteProductModel: Object {

    // MARK: - Persisted Properties

    /// ID пользователя — для фильтрации избранного по пользователям
    @Persisted var userId: String?

    /// ID товара из API
    @Persisted var productId: Int

    /// URL изображения товара
    @Persisted var productImage: String

    /// Название товара
    @Persisted var productTitle: String

    // MARK: - Convenience Init

    /// Создание модели с параметрами
    /// - Parameters:
    ///   - userId: ID текущего пользователя
    ///   - productId: ID товара
    ///   - productImage: URL изображения
    ///   - productTitle: Название товара
    convenience init(
        userId: String?,
        productId: Int,
        productImage: String,
        productTitle: String
    ) {
        self.init()
        self.userId = userId
        self.productId = productId
        self.productImage = productImage
        self.productTitle = productTitle
    }
}
```

### Визуализация модели

```
┌─────────────────────────────────────────────────────────────────┐
│                    FavoriteProductModel                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   @Persisted var userId: String?                                │
│   └── "user_abc123"  ← Для фильтрации по пользователю           │
│                                                                 │
│   @Persisted var productId: Int                                 │
│   └── 1  ← ID товара для перехода к деталям                     │
│                                                                 │
│   @Persisted var productImage: String                           │
│   └── "https://..."  ← Для отображения в списке                 │
│                                                                 │
│   @Persisted var productTitle: String                           │
│   └── "Fjallraven - Foldsack..."  ← Название товара             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Почему НЕ храним цену?

```
┌─────────────────────────────────────────────────────────────────┐
│                  МИНИМАЛЬНЫЕ ДАННЫЕ                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Храним:                        Не храним:                     │
│   • productId   ← Ключ           • price (может измениться)     │
│   • productImage ← Для UI        • description (загрузим)       │
│   • productTitle ← Для UI        • rating (загрузим)            │
│   • userId      ← Фильтр         • category (загрузим)          │
│                                                                 │
│   При клике на товар → загружаем актуальные данные из API       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 18.2 Структура VIPER модуля

```
Modules/Favorites/
├── Base/
│   ├── FavoritesViewController.swift    ← View
│   ├── FavoritesInteractor.swift        ← Interactor
│   ├── FavoritesPresenter.swift         ← Presenter
│   └── FavoritesRouter.swift            ← Router
└── UIComponents/
    └── Cells/
        └── FavoriteCell.swift           ← Ячейка избранного
```

---

## 18.3 FavoritesRouter — создание модуля

Router создаёт модуль и управляет навигацией.

```swift
// Modules/Favorites/Base/FavoritesRouter.swift
import Foundation
import UIKit

// MARK: - Protocol

protocol FavoritesRouterProtocol {
    /// Перейти на главный экран (Home)
    func toHome()

    /// Перейти к деталям товара
    func toDetail(productId: Int)
}

// MARK: - Router

final class FavoritesRouter {

    // MARK: - Properties

    private weak var view: UIViewController?

    // MARK: - Init

    init(view: UIViewController) {
        self.view = view
    }

    // MARK: - Module Creation

    /// Фабричный метод создания модуля Favorites
    /// - Returns: Готовый ViewController
    static func startFavoritesModule() -> UIViewController {
        // 1. Создаём View
        let view = FavoritesViewController()

        // 2. Создаём Router
        let router = FavoritesRouter(view: view)

        // 3. Создаём Interactor с зависимостями
        let interactor = FavoritesInteractor(
            storageManager: RealmManager.shared,
            userInfoManager: UserInfoManager()
        )

        // 4. Создаём Presenter и связываем компоненты
        let presenter = FavoritesPresenter(
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

// MARK: - FavoritesRouterProtocol

extension FavoritesRouter: FavoritesRouterProtocol {

    func toHome() {
        // Переключаемся на вкладку Home (индекс 0)
        view?.tabBarController?.selectedIndex = 0
    }

    func toDetail(productId: Int) {
        /*
         При переходе к деталям:
         1. Создаём модуль ProductDetail с productID
         2. Модуль сам загрузит данные из API
         3. Push на NavigationController
         */

        let detailModule = ProductDetailRouter.startModule(productID: productId)
        view?.navigationController?.pushViewController(detailModule, animated: true)
    }
}
```

### Схема создания модуля

```
┌─────────────────────────────────────────────────────────────────┐
│              startFavoritesModule()                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. View = FavoritesViewController()                           │
│   2. Router = FavoritesRouter(view: view)                       │
│   3. Interactor = FavoritesInteractor(                          │
│         storageManager: RealmManager.shared,                    │
│         userInfoManager: UserInfoManager()                      │
│      )                                                          │
│   4. Presenter = FavoritesPresenter(                            │
│         view: view,                                             │
│         interactor: interactor,                                 │
│         router: router                                          │
│      )                                                          │
│                                                                 │
│   СВЯЗИ:                                                        │
│   ┌─────────────────────────────────────────────────────┐       │
│   │  view.presenter = presenter                         │       │
│   │  interactor.presenter = presenter                   │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 18.4 FavoritesInteractor — бизнес-логика

Interactor работает с Realm для получения, удаления и управления избранным.

```swift
// Modules/Favorites/Base/FavoritesInteractor.swift
import Foundation

// MARK: - Input Protocol

protocol FavoritesInteractorInputs {
    /// Загрузить избранные товары текущего пользователя
    func getFavorites()

    /// Получить список избранного для отображения
    func showFavorites() -> [FavoriteProductModel]

    /// Удалить товар из избранного по индексу
    func deleteItemForRowAt(indexPath: IndexPath)

    /// Удалить все товары из избранного
    func deleteAll()
}

// MARK: - Output Protocol

protocol FavoritesInteractorOutputs: AnyObject {
    /// Данные обновились — нужно перезагрузить UI
    func dataRefreshed()

    /// Произошла ошибка
    func onError(message: String)
}

// MARK: - Interactor

final class FavoritesInteractor {

    // MARK: - Properties

    /// Связь с Presenter
    weak var presenter: FavoritesInteractorOutputs?

    /// Менеджер локального хранилища (Realm)
    private let storageManager: RealmManagerProtocol?

    /// Менеджер информации о пользователе
    private let userInfoManager: UserInfoManagerProtocol?

    /// Кэш избранных товаров
    private var favorites: [FavoriteProductModel] = [] {
        didSet {
            // При изменении списка — уведомляем Presenter
            presenter?.dataRefreshed()
        }
    }

    // MARK: - Init

    init(
        storageManager: RealmManagerProtocol,
        userInfoManager: UserInfoManagerProtocol
    ) {
        self.storageManager = storageManager
        self.userInfoManager = userInfoManager
    }
}

// MARK: - FavoritesInteractorInputs

extension FavoritesInteractor: FavoritesInteractorInputs {

    func getFavorites() {
        /*
         Алгоритм загрузки избранного:
         1. Получаем все FavoriteProductModel из Realm
         2. Фильтруем по userId текущего пользователя
         3. Сохраняем в кэш

         Почему фильтруем по userId?
         - На одном устройстве могут быть разные пользователи
         - У каждого своё избранное
         */

        let currentUserId = userInfoManager?.getUserUid()

        let allFavorites = storageManager?.getAll(FavoriteProductModel.self) ?? []

        self.favorites = allFavorites.filter { $0.userId == currentUserId }
    }

    func showFavorites() -> [FavoriteProductModel] {
        return favorites
    }

    func deleteItemForRowAt(indexPath: IndexPath) {
        /*
         Удаление одного товара:
         1. Удаляем из Realm
         2. Удаляем из локального кэша
         3. didSet автоматически вызовет dataRefreshed()
         */

        let itemToDelete = favorites[indexPath.row]

        // Удаляем из Realm
        storageManager?.delete(itemToDelete) { [weak self] error in
            self?.presenter?.onError(message: error.localizedDescription)
        }

        // Удаляем из локального кэша
        favorites.remove(at: indexPath.row)
    }

    func deleteAll() {
        /*
         Удаление всех товаров:
         1. Итерируем по всем избранным
         2. Удаляем каждый из Realm
         3. Очищаем локальный кэш
         */

        for favorite in favorites {
            storageManager?.delete(favorite) { [weak self] error in
                self?.presenter?.onError(message: error.localizedDescription)
            }
        }

        favorites.removeAll()
    }
}
```

### Схема работы Interactor

```
┌─────────────────────────────────────────────────────────────────┐
│                FAVORITES INTERACTOR FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Presenter                    Interactor                       │
│       │                           │                             │
│       │  getFavorites()           │                             │
│       ├──────────────────────────►│                             │
│       │                           │  RealmManager               │
│       │                           │  ┌───────────────────┐      │
│       │                           ├─►│ getAll()          │      │
│       │                           │  │ .filter(userId)   │      │
│       │                           │◄─┤ → [Favorites]     │      │
│       │                           │  └───────────────────┘      │
│       │  ◄── dataRefreshed() ─────┤                             │
│       │                           │                             │
│       │  showFavorites()          │                             │
│       ├──────────────────────────►│                             │
│       │  ◄── [FavoriteProductModel] ─┤                          │
│       │                           │                             │
│       │  deleteItemForRowAt()     │                             │
│       ├──────────────────────────►│                             │
│       │                           ├─► delete(item)              │
│       │  ◄── dataRefreshed() ─────┤                             │
│       │                           │                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 18.5 FavoritesPresenter — связующее звено

Presenter связывает View и Interactor, форматирует данные для отображения.

```swift
// Modules/Favorites/Base/FavoritesPresenter.swift
import Foundation

// MARK: - Input Protocol

protocol FavoritesPresenterInputs {
    func viewDidLoad()
    func viewWillAppear()

    /// Количество строк в таблице
    func numberOfRowsInSection() -> Int

    /// Модель для ячейки
    func cellForRowAt(indexPath: IndexPath) -> FavoriteProductModel?

    /// Удаление товара (swipe to delete)
    func deleteItemForRowAt(indexPath: IndexPath)

    /// Выбор товара — переход к деталям
    func didSelectRowAt(indexPath: IndexPath)

    /// Высота ячейки
    func heightForRowAt() -> CGFloat

    /// Нажатие на кнопку "Удалить всё"
    func trashButtonTapped()

    /// Подтверждение удаления всех
    func deleteAllFavorites()

    /// Переход на главный экран
    func jumpToHomeTapped()
}

// MARK: - Presenter

final class FavoritesPresenter {

    // MARK: - Properties

    private weak var view: FavoritesViewProtocol?
    private let interactor: FavoritesInteractorInputs?
    private let router: FavoritesRouterProtocol?

    // MARK: - Init

    init(
        view: FavoritesViewProtocol,
        interactor: FavoritesInteractorInputs,
        router: FavoritesRouterProtocol
    ) {
        self.view = view
        self.interactor = interactor
        self.router = router
    }
}

// MARK: - FavoritesPresenterInputs

extension FavoritesPresenter: FavoritesPresenterInputs {

    func viewDidLoad() {
        // Настраиваем UI
        view?.setNavTitle(title: "Favorites")
        view?.prepareTrashBarButton()
        view?.prepareTableView()

        // Загружаем данные
        interactor?.getFavorites()
    }

    func viewWillAppear() {
        /*
         Обновляем данные при каждом появлении экрана

         Почему?
         - Пользователь мог добавить/удалить товар из деталей
         - Пользователь мог вернуться после logout/login
         */

        view?.setNavBarAndTabBarVisibility()
        interactor?.getFavorites()
        view?.dataRefreshed()
    }

    func numberOfRowsInSection() -> Int {
        return interactor?.showFavorites().count ?? 0
    }

    func cellForRowAt(indexPath: IndexPath) -> FavoriteProductModel? {
        return interactor?.showFavorites()[indexPath.row]
    }

    func deleteItemForRowAt(indexPath: IndexPath) {
        interactor?.deleteItemForRowAt(indexPath: indexPath)
    }

    func didSelectRowAt(indexPath: IndexPath) {
        /*
         При выборе товара:
         1. Получаем productId из модели
         2. Передаём Router для навигации
         3. Router создаёт ProductDetail модуль
         */

        guard let productId = interactor?.showFavorites()[indexPath.row].productId else {
            return
        }

        router?.toDetail(productId: productId)
    }

    func heightForRowAt() -> CGFloat {
        return 150  // Фиксированная высота ячейки
    }

    func trashButtonTapped() {
        // Показываем Alert с подтверждением
        view?.presentTrashAllAlert()
    }

    func deleteAllFavorites() {
        interactor?.deleteAll()
    }

    func jumpToHomeTapped() {
        router?.toHome()
    }
}

// MARK: - FavoritesInteractorOutputs

extension FavoritesPresenter: FavoritesInteractorOutputs {

    func dataRefreshed() {
        view?.dataRefreshed()
    }

    func onError(message: String) {
        view?.onError(message: message)
    }
}
```

---

## 18.6 FavoritesViewController — отображение

View отображает список избранного в UITableView с возможностью удаления.

```swift
// Modules/Favorites/Base/FavoritesViewController.swift
import UIKit

// MARK: - View Protocol

protocol FavoritesViewProtocol: AnyObject {
    func setNavTitle(title: String)
    func setNavBarAndTabBarVisibility()
    func prepareTrashBarButton()
    func prepareTableView()
    func dataRefreshed()
    func onError(message: String)
    func presentTrashAllAlert()
}

// MARK: - ViewController

final class FavoritesViewController: UIViewController {

    // MARK: - UI Components

    /// TableView для отображения избранного
    private lazy var favoritesTableView: UITableView = {
        let tableView = UITableView()
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(
            FavoriteCell.self,
            forCellReuseIdentifier: FavoriteCell.identifier
        )
        tableView.separatorStyle = .singleLine
        return tableView
    }()

    /// Кнопка для перехода на главный экран (когда список пуст)
    private lazy var jumpToHomeButton: UIButton = {
        let button = UIButton()
        button.setTitle("List is clear. Tap to see the products.", for: .normal)
        button.setTitleColor(.label, for: .normal)
        button.layer.borderWidth = 1
        button.layer.borderColor = UIColor.label.cgColor
        button.clipsToBounds = true
        button.addTarget(
            self,
            action: #selector(jumpToHomeTapped),
            for: .touchUpInside
        )
        return button
    }()

    // MARK: - Properties

    var presenter: FavoritesPresenterInputs!

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

    @objc private func trashButtonTapped() {
        presenter.trashButtonTapped()
    }

    @objc private func jumpToHomeTapped() {
        presenter.jumpToHomeTapped()
    }
}

// MARK: - FavoritesViewProtocol

extension FavoritesViewController: FavoritesViewProtocol {

    func setNavTitle(title: String) {
        self.title = title
    }

    func setNavBarAndTabBarVisibility() {
        // Показываем Navigation Bar и Tab Bar
        // (они могли быть скрыты на экране ProductDetail)
        navigationController?.navigationBar.isHidden = false
        tabBarController?.tabBar.isHidden = false
    }

    func prepareTrashBarButton() {
        // Кнопка "Удалить всё" в правом верхнем углу
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .trash,
            target: self,
            action: #selector(trashButtonTapped)
        )
        navigationItem.rightBarButtonItem?.tintColor = .red
    }

    func prepareTableView() {
        view.addSubview(favoritesTableView)

        // Кнопка показывается как backgroundView когда список пуст
        favoritesTableView.backgroundView = jumpToHomeButton

        favoritesTableView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }

    func dataRefreshed() {
        favoritesTableView.reloadData()
    }

    func onError(message: String) {
        showAlert(title: "", message: message)
    }

    func presentTrashAllAlert() {
        // Показываем Alert с подтверждением удаления
        deleteAllSheetAlert { [weak self] in
            self?.presenter.deleteAllFavorites()
        }
    }
}

// MARK: - UITableViewDelegate & DataSource

extension FavoritesViewController: UITableViewDelegate, UITableViewDataSource {

    func tableView(
        _ tableView: UITableView,
        numberOfRowsInSection section: Int
    ) -> Int {
        let count = presenter.numberOfRowsInSection()

        // Показываем/скрываем кнопку "Перейти на Home"
        jumpToHomeButton.isHidden = count != 0

        return count
    }

    func tableView(
        _ tableView: UITableView,
        cellForRowAt indexPath: IndexPath
    ) -> UITableViewCell {
        guard let cell = favoritesTableView.dequeueReusableCell(
            withIdentifier: FavoriteCell.identifier,
            for: indexPath
        ) as? FavoriteCell else {
            return UITableViewCell()
        }

        cell.showModel(model: presenter.cellForRowAt(indexPath: indexPath))
        cell.accessoryType = .disclosureIndicator  // Стрелка вправо
        cell.selectionStyle = .none

        return cell
    }

    func tableView(
        _ tableView: UITableView,
        heightForRowAt indexPath: IndexPath
    ) -> CGFloat {
        return presenter.heightForRowAt()
    }

    // MARK: - Swipe to Delete

    func tableView(
        _ tableView: UITableView,
        commit editingStyle: UITableViewCell.EditingStyle,
        forRowAt indexPath: IndexPath
    ) {
        /*
         Swipe to Delete — стандартный жест iOS

         Пользователь свайпает влево → появляется кнопка Delete
         При нажатии → удаляем товар
         */

        if editingStyle == .delete {
            presenter.deleteItemForRowAt(indexPath: indexPath)
        }
    }

    // MARK: - Selection

    func tableView(
        _ tableView: UITableView,
        didSelectRowAt indexPath: IndexPath
    ) {
        tableView.deselectRow(at: indexPath, animated: true)
        presenter.didSelectRowAt(indexPath: indexPath)
    }
}
```

### Визуализация экрана Favorites

```
┌─────────────────────────────────────────────┐
│  Favorites                          🗑️      │
├─────────────────────────────────────────────┤
│  ┌─────┬─────────────────────────────┬──┐  │
│  │     │  Fjallraven - Foldsack No.  │ ► │  │
│  │ IMG │  1 Backpack, Fits 15        │   │  │
│  │     │  Laptops                    │   │  │
│  └─────┴─────────────────────────────┴──┘  │
│  ─────────────────────────────────────────  │
│  ┌─────┬─────────────────────────────┬──┐  │
│  │     │  Mens Casual Premium Slim   │ ► │  │
│  │ IMG │  Fit T-Shirts               │   │  │
│  │     │                             │   │  │
│  └─────┴─────────────────────────────┴──┘  │
│  ─────────────────────────────────────────  │
│  ┌─────┬─────────────────────────────┬──┐  │
│  │     │  John Hardy Women's         │ ► │  │
│  │ IMG │  Legends Naga Gold &        │   │  │
│  │     │  Silver Dragon...           │   │  │
│  └─────┴─────────────────────────────┴──┘  │
│                                             │
│          (Если список пуст)                 │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  List is clear.                     │   │
│  │  Tap to see the products.           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Home] [♥ Favorites] [🛒 Basket] [Profile] │
└─────────────────────────────────────────────┘
```

---

## 18.7 FavoriteCell — ячейка избранного

```swift
// Modules/Favorites/UIComponents/Cells/FavoriteCell.swift
import UIKit
import SDWebImage

final class FavoriteCell: UITableViewCell {

    // MARK: - Identifier

    static let identifier = "FavoriteCell"

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
        label.numberOfLines = 0  // Многострочный текст
        label.textColor = .label
        label.font = .systemFont(ofSize: 16)
        return label
    }()

    /// Горизонтальный стек
    private lazy var hStackView: UIStackView = {
        let stackView = UIStackView(arrangedSubviews: [
            productImageView,
            productTitleLabel
        ])
        stackView.contentMode = .center
        stackView.spacing = 8
        return stackView
    }()

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
        addSubview(hStackView)

        // Изображение фиксированного размера
        productImageView.snp.makeConstraints { make in
            make.width.height.equalTo(94)
        }

        // Стек с отступами
        hStackView.snp.makeConstraints { make in
            make.right.equalToSuperview().inset(40)  // Место для стрелки
            make.edges.equalToSuperview().inset(16)
        }
    }

    // MARK: - Configure

    func showModel(model: FavoriteProductModel?) {
        productImageView.sd_setImage(with: URL(string: model?.productImage ?? ""))
        productTitleLabel.text = model?.productTitle ?? ""
    }
}
```

### Анатомия ячейки

```
┌─────────────────────────────────────────────────────────────────┐
│                        FavoriteCell                             │
├─────────────────────────────────────────────────────────────────┤
│  16px                                                 40px      │
│  ┌──────┐                                                       │
│  │      │                                                       │
│  │  94  │   ← 8px →  productTitleLabel         ► accessory      │
│  │  x   │            (numberOfLines: 0)                         │
│  │  94  │                                                       │
│  │      │                                                       │
│  └──────┘                                                       │
│  16px                                                           │
├─────────────────────────────────────────────────────────────────┤
│  Высота ячейки: 150px (фиксированная)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 18.8 Расширение UIViewController для алертов

Добавим удобный метод для показа Alert с подтверждением удаления.

```swift
// Core/Extensions/UIViewController+Alerts.swift
import UIKit

extension UIViewController {

    /// Показать Alert для подтверждения удаления всех элементов
    func deleteAllSheetAlert(completion: @escaping () -> Void) {
        let alert = UIAlertController(
            title: "Delete All",
            message: "Are you sure you want to delete all favorites?",
            preferredStyle: .actionSheet
        )

        // Кнопка "Удалить"
        let deleteAction = UIAlertAction(
            title: "Delete All",
            style: .destructive
        ) { _ in
            completion()
        }

        // Кнопка "Отмена"
        let cancelAction = UIAlertAction(
            title: "Cancel",
            style: .cancel
        )

        alert.addAction(deleteAction)
        alert.addAction(cancelAction)

        present(alert, animated: true)
    }

    /// Показать простой Alert с сообщением
    func showAlert(title: String, message: String) {
        let alert = UIAlertController(
            title: title,
            message: message,
            preferredStyle: .alert
        )

        let okAction = UIAlertAction(title: "OK", style: .default)
        alert.addAction(okAction)

        present(alert, animated: true)
    }
}
```

---

## 18.9 Интеграция в MainTabBar

Добавим вкладку Favorites в Tab Bar.

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

## 18.10 Полная схема взаимодействия

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   FAVORITES MODULE FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                    FavoritesViewController                    │      │
│   │  ┌──────────────────────────────────────────────────────┐    │      │
│   │  │  [🗑️]  ← trashButtonTapped()                          │    │      │
│   │  │  ┌────────────────────────────────────────────────┐  │    │      │
│   │  │  │  [Image]  Product Title...              ►      │  │    │      │
│   │  │  │                   ↓ didSelectRowAt()           │  │    │      │
│   │  │  │                   ← swipe to delete            │  │    │      │
│   │  │  └────────────────────────────────────────────────┘  │    │      │
│   │  │  ┌────────────────────────────────────────────────┐  │    │      │
│   │  │  │  [Image]  Product Title...              ►      │  │    │      │
│   │  │  └────────────────────────────────────────────────┘  │    │      │
│   │  └──────────────────────────────────────────────────────┘    │      │
│   │                                                              │      │
│   │  [List is clear. Tap to see products.]                       │      │
│   │                   ↓ jumpToHomeTapped()                       │      │
│   └────────────────────────────────────┬─────────────────────────┘      │
│                                        │                                │
│                                        ▼                                │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                    FavoritesPresenter                        │      │
│   │  • viewDidLoad() → getFavorites()                            │      │
│   │  • didSelectRowAt() → router.toDetail()                      │      │
│   │  • deleteItemForRowAt() → interactor.delete()                │      │
│   │  • trashButtonTapped() → presentTrashAllAlert()              │      │
│   └────────────────────────────────────┬─────────────────────────┘      │
│                                        │                                │
│                                        ▼                                │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                    FavoritesInteractor                       │      │
│   │  • getFavorites() → RealmManager.getAll().filter(userId)     │      │
│   │  • deleteItemForRowAt() → RealmManager.delete()              │      │
│   │  • deleteAll() → loop delete()                               │      │
│   └────────────────────────────────────┬─────────────────────────┘      │
│                                        │                                │
│                                        ▼                                │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                    FavoritesRouter                           │      │
│   │  • toDetail() → ProductDetailRouter.startModule()            │      │
│   │  • toHome() → tabBarController.selectedIndex = 0             │      │
│   └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 18.11 Добавление в избранное из ProductDetail

В главе 17 мы уже реализовали добавление в избранное. Вот как это работает:

```swift
// ProductDetailInteractor.swift (из главы 17)

func favButtonTapped(model: ProductModel?) {
    guard let model else { return }

    if !isFav(model: model) {
        // ДОБАВЛЯЕМ в избранное
        let favModel = FavoriteProductModel(
            userId: userInfoManager?.getUserUid(),
            productId: model.id,
            productImage: model.image,
            productTitle: model.title
        )

        storageManager?.create(favModel) { [weak self] error in
            self?.presenter?.onError(errorMessage: error.localizedDescription)
        }
    } else {
        // УДАЛЯЕМ из избранного
        let favorites = storageManager?
            .getAll(FavoriteProductModel.self)
            .filter { $0.userId == userInfoManager?.getUserUid() }

        if let itemToRemove = favorites?.first(where: { $0.productId == model.id }) {
            storageManager?.delete(itemToRemove) { [weak self] error in
                self?.presenter?.onError(errorMessage: error.localizedDescription)
            }
        }
    }
}

func isFav(model: ProductModel?) -> Bool {
    let userId = userInfoManager?.getUserUid()

    let favorites = storageManager?
        .getAll(FavoriteProductModel.self)
        .filter { $0.userId == userId }

    return favorites?.contains { $0.productTitle == model?.title } ?? false
}
```

### Связь ProductDetail ↔ Favorites

```
┌─────────────────────────────────────────────────────────────────┐
│              ДОБАВЛЕНИЕ В ИЗБРАННОЕ                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ProductDetailVC           RealmManager          FavoritesVC   │
│        │                        │                      │        │
│        │  ♥ tap                 │                      │        │
│        ├───────────────────────►│                      │        │
│        │  favButtonTapped()     │                      │        │
│        │                        │                      │        │
│        │  if !isFav:            │                      │        │
│        │    create(FavoriteProductModel)               │        │
│        │                        │                      │        │
│        │  if isFav:             │                      │        │
│        │    delete(item)        │                      │        │
│        │                        │                      │        │
│        │                        │                      │        │
│        │  (User navigates to Favorites tab)            │        │
│        │                        │        viewWillAppear│        │
│        │                        │◄──────────────────────┤        │
│        │                        │    getFavorites()    │        │
│        │                        ├──────────────────────►│        │
│        │                        │    [FavoriteProductModel]     │
│        │                        │                      │        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 18.12 Итоги главы

В этой главе мы создали полноценный VIPER модуль избранного:

### Компоненты модуля:

| Компонент | Ответственность |
|-----------|-----------------|
| **FavoriteProductModel** | Realm-модель для хранения избранного |
| **FavoritesRouter** | Создание модуля, навигация |
| **FavoritesInteractor** | Работа с Realm, фильтрация по userId |
| **FavoritesPresenter** | Связь View-Interactor |
| **FavoritesViewController** | UITableView с избранным |
| **FavoriteCell** | Ячейка с изображением и названием |

### Ключевые паттерны:

```
┌────────────────────────────────────────────────────────────────┐
│                  ИЗУЧЕННЫЕ КОНЦЕПЦИИ                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✅ Realm для локального хранения                              │
│  ✅ Фильтрация по userId для мульти-аккаунтов                  │
│  ✅ Swipe to Delete (UITableViewDelegate)                      │
│  ✅ backgroundView для пустого состояния                       │
│  ✅ Alert с подтверждением удаления                            │
│  ✅ Property Observer (didSet) для обновления UI               │
│  ✅ Навигация между модулями через Router                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Realm vs Firebase:

```
┌────────────────────────────────────────────────────────────────┐
│                  КОГДА ЧТО ИСПОЛЬЗОВАТЬ                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   REALM (локально):                                            │
│   • Избранное ← быстрый доступ                                 │
│   • Кэш данных                                                 │
│   • Настройки приложения                                       │
│   • Данные, специфичные для устройства                         │
│                                                                │
│   FIREBASE (облако):                                           │
│   • Корзина ← синхронизация между устройствами                 │
│   • Заказы ← история покупок                                   │
│   • Профиль пользователя                                       │
│   • Данные, которые нужны везде                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Следующая глава

В [Главе 19](../19-Orders/README.md) мы создадим модуль оформления заказа и истории заказов.
