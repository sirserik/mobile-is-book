# Глава 12: Программный UI — запуск приложения без Storyboard

## Введение

В этой главе мы подробно разберём, как создавать iOS-приложения полностью программно, без использования Storyboard. Это профессиональный подход, который используется в большинстве коммерческих проектов.

**Почему программный UI?**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Storyboard vs Programmatic UI                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Storyboard:                                                            │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  ✗ Конфликты при merge в Git (XML сложно мержить)               │   │
│   │  ✗ Медленная загрузка больших Storyboard                        │   │
│   │  ✗ Сложно переиспользовать между проектами                      │   │
│   │  ✗ Неявные зависимости (segues, outlets)                        │   │
│   │  ✗ Сложно делать code review                                    │   │
│   │  ✓ Быстрый прототип для простых экранов                         │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Programmatic UI:                                                       │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  ✓ Легко мержить в Git (обычный Swift код)                      │   │
│   │  ✓ Полный контроль над UI                                       │   │
│   │  ✓ Легко переиспользовать компоненты                            │   │
│   │  ✓ Явные зависимости, понятный flow                             │   │
│   │  ✓ Code review как обычный код                                  │   │
│   │  ✓ Быстрее компиляция (нет парсинга XML)                        │   │
│   │  ✗ Больше кода для простых экранов                              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12.1 Настройка проекта без Storyboard

### Шаг 1: Создание проекта

1. Откройте Xcode
2. File → New → Project
3. iOS → App
4. Выберите "Storyboard" в Interface (мы его удалим)

### Шаг 2: Удаление Storyboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Удаление Storyboard                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. Удалите файл Main.storyboard                                       │
│      Project Navigator → Main.storyboard → Delete → Move to Trash       │
│                                                                          │
│   2. Очистите Info.plist                                                │
│      Удалите ключ "Main storyboard file base name"                      │
│      (или "UIMainStoryboardFile")                                       │
│                                                                          │
│   3. Очистите Build Settings                                            │
│      Target → Build Settings → Search "Main"                            │
│      UIKit Main Storyboard File Base Name → удалите значение            │
│                                                                          │
│   4. Очистите Scenes в Info.plist                                       │
│      Application Scene Manifest → Scene Configuration →                  │
│      → Storyboard Name → удалите                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Шаг 3: Структура Info.plist для Scene

```xml
<key>UIApplicationSceneManifest</key>
<dict>
    <key>UIApplicationSupportsMultipleScenes</key>
    <false/>
    <key>UISceneConfigurations</key>
    <dict>
        <key>UIWindowSceneSessionRoleApplication</key>
        <array>
            <dict>
                <key>UISceneConfigurationName</key>
                <string>Default Configuration</string>
                <key>UISceneDelegateClassName</key>
                <string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
                <!-- НЕТ UISceneStoryboardFile -->
            </dict>
        </array>
    </dict>
</dict>
```

---

## 12.2 AppDelegate — точка входа приложения

AppDelegate отвечает за глобальную настройку приложения:

```swift
// Core/AppDelegate.swift
import UIKit
import SnapKit
import FirebaseCore
import IQKeyboardManagerSwift
import GoogleSignIn

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    // Глобальная настройка при инициализации
    override init() {
        // Настройка внешнего вида Navigation Bar для всего приложения
        UINavigationBar.appearance().tintColor = .label
    }

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        // Инициализация Firebase
        FirebaseApp.configure()

        // Включение автоматического управления клавиатурой
        IQKeyboardManager.shared.enable = true

        return true
    }

    // Обработка URL для Google Sign-In
    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey : Any] = [:]
    ) -> Bool {
        return GIDSignIn.sharedInstance.handle(url)
    }

    // MARK: - UISceneSession Lifecycle

    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        // Возвращаем конфигурацию сцены
        return UISceneConfiguration(
            name: "Default Configuration",
            sessionRole: connectingSceneSession.role
        )
    }

    func application(
        _ application: UIApplication,
        didDiscardSceneSessions sceneSessions: Set<UISceneSession>
    ) {
        // Освобождение ресурсов закрытых сцен
    }
}
```

**Что делает AppDelegate:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       AppDelegate Responsibilities                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Запуск приложения                                                      │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  @main                                                           │   │
│   │  ↓                                                               │   │
│   │  AppDelegate.application(_:didFinishLaunchingWithOptions:)       │   │
│   │  ↓                                                               │   │
│   │  • FirebaseApp.configure()     ← Инициализация сервисов         │   │
│   │  • IQKeyboardManager.enable    ← Настройка библиотек            │   │
│   │  • UINavigationBar.appearance() ← Глобальные стили              │   │
│   │  ↓                                                               │   │
│   │  return true                                                     │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Lifecycle методы:                                                      │
│   • didFinishLaunchingWithOptions — приложение запущено                 │
│   • configurationForConnecting — создание новой сцены                   │
│   • didDiscardSceneSessions — сцены удалены                             │
│   • open url — обработка URL (deep links, OAuth)                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12.3 SceneDelegate — управление окном

SceneDelegate отвечает за создание и управление окном приложения:

```swift
// Core/SceneDelegate.swift
import UIKit
import FirebaseAuth

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        // 1. Проверяем, что получили UIWindowScene
        guard let windowScene = (scene as? UIWindowScene) else { return }

        // 2. Создаём окно программно
        window = UIWindow(frame: windowScene.coordinateSpace.bounds)
        window?.windowScene = windowScene

        // 3. Выбираем начальный экран в зависимости от состояния
        if Auth.auth().currentUser != nil {
            // Пользователь авторизован → показываем главный экран
            window?.rootViewController = MainTabBarRouter.startTabBarModule()
        } else {
            // Пользователь не авторизован → показываем онбординг
            window?.rootViewController = UINavigationController(
                rootViewController: OnboardingRouter.startOnboarding()
            )
        }

        // 4. Делаем окно видимым
        window?.makeKeyAndVisible()

        // 5. Сохраняем ссылку на окно для смены root контроллера
        RootWindowManager.shared.window = self.window
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        // Сцена отключена — освобождаем ресурсы
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // Сцена стала активной — возобновляем задачи
    }

    func sceneWillResignActive(_ scene: UIScene) {
        // Сцена станет неактивной — приостанавливаем задачи
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        // Сцена переходит на передний план
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        // Сцена ушла в фон — сохраняем данные
    }
}
```

**Ключевые шаги создания окна:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Programmatic Window Creation                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   scene(_:willConnectTo:options:)                                        │
│                                                                          │
│   Step 1: Получить WindowScene                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  guard let windowScene = (scene as? UIWindowScene) else {        │   │
│   │      return                                                      │   │
│   │  }                                                               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Step 2: Создать UIWindow                                              │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  window = UIWindow(frame: windowScene.coordinateSpace.bounds)    │   │
│   │  window?.windowScene = windowScene                               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Step 3: Установить rootViewController                                 │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  window?.rootViewController = YourViewController()               │   │
│   │  // или                                                          │   │
│   │  window?.rootViewController = UINavigationController(            │   │
│   │      rootViewController: YourViewController()                    │   │
│   │  )                                                               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Step 4: Показать окно                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  window?.makeKeyAndVisible()                                     │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12.4 RootWindowManager — смена корневого контроллера

Для смены экрана после логина/логаута используем менеджер окна:

```swift
// Managers/RootWindowManager/RootWindowManager.swift
import Foundation
import UIKit.UIViewController

protocol RootWindowManagerProtocol {
    func changeRootViewController(_ viewController: UIViewController, animated: Bool)
}

final class RootWindowManager: RootWindowManagerProtocol {

    // Singleton для доступа из любого места
    static let shared = RootWindowManager()

    // Ссылка на текущее окно (устанавливается в SceneDelegate)
    internal var window: UIWindow?

    private init() {}

    func changeRootViewController(_ viewController: UIViewController, animated: Bool) {
        guard let window = window else {
            return
        }

        // Анимация перехода
        if animated {
            UIView.transition(
                with: window,
                duration: 0.5,
                options: [.transitionFlipFromLeft],
                animations: nil,
                completion: nil
            )
        }

        // Замена корневого контроллера
        window.rootViewController = viewController
    }
}
```

**Использование:**

```swift
// После успешного логина
let mainTabBar = MainTabBarRouter.startTabBarModule()
RootWindowManager.shared.changeRootViewController(mainTabBar, animated: true)

// После логаута
let loginVC = UINavigationController(rootViewController: LoginRouter.startLogin())
RootWindowManager.shared.changeRootViewController(loginVC, animated: true)
```

**Диаграмма переключения:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Root Controller Switching                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Старт приложения                                                       │
│        │                                                                 │
│        ↓                                                                 │
│   ┌─────────────┐                                                        │
│   │ SceneDelegate│                                                       │
│   │ Auth check   │                                                       │
│   └──────┬──────┘                                                        │
│          │                                                               │
│    ┌─────┴─────┐                                                         │
│    ↓           ↓                                                         │
│ Logged In   Not Logged In                                                │
│    │           │                                                         │
│    ↓           ↓                                                         │
│ ┌──────┐   ┌──────────┐                                                  │
│ │TabBar│   │Onboarding│                                                  │
│ └──────┘   └────┬─────┘                                                  │
│                 │                                                        │
│                 ↓                                                        │
│            ┌────────┐                                                    │
│            │ Login  │                                                    │
│            └───┬────┘                                                    │
│                │                                                         │
│                ↓ Success                                                 │
│   RootWindowManager.changeRootViewController(TabBar)                     │
│                │                                                         │
│                ↓                                                         │
│            ┌──────┐                                                      │
│            │TabBar│  ← Новый root                                        │
│            └──────┘                                                      │
│                                                                          │
│   Логаут                                                                 │
│        │                                                                 │
│        ↓                                                                 │
│   RootWindowManager.changeRootViewController(Login)                      │
│        │                                                                 │
│        ↓                                                                 │
│   ┌────────┐                                                             │
│   │ Login  │  ← Новый root                                               │
│   └────────┘                                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12.5 UITabBarController — программно

```swift
// Modules/MainTabBar/MainTabBarViewController.swift
import UIKit

protocol MainTabBarViewProtocol: AnyObject {
    func configureTabBar()
    func setTabBarControllers()
    func setBasketItemsBadgeValue(value: Int)
}

final class MainTabBarViewController: UITabBarController {

    // Создаём модули через их Router'ы
    private let homeModule = HomeRouter.startHomeModule()
    private let favoritesModule = FavoritesRouter.startFavoritesModule()
    private let basketModule = BasketRouter.startBasketModule()
    private let profileModule = ProfileRouter.startProfileModule()

    internal var presenter: MainTabBarPresenterInputs!

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        presenter.viewWillAppear()
    }
}

extension MainTabBarViewController: MainTabBarViewProtocol {

    func configureTabBar() {
        // Настройка внешнего вида TabBar
        tabBar.backgroundColor = .systemGray5
        tabBar.tintColor = .label
        tabBar.layer.shadowOpacity = 0.75
        tabBar.layer.cornerRadius = 8
        tabBar.layer.shadowColor = UIColor.label.cgColor
    }

    func setTabBarControllers() {
        setViewControllers(
            [
                setController(
                    viewController: homeModule,
                    title: "Home",
                    imageName: "house",
                    selectedImageName: "house.fill"
                ),

                setController(
                    viewController: favoritesModule,
                    title: "Favorites",
                    imageName: "heart",
                    selectedImageName: "heart.fill"
                ),

                setController(
                    viewController: basketModule,
                    title: "Basket",
                    imageName: "basket",
                    selectedImageName: "basket.fill"
                ),

                setController(
                    viewController: profileModule,
                    title: "Profile",
                    imageName: "person",
                    selectedImageName: "person.fill"
                ),
            ],
            animated: true
        )
    }

    func setBasketItemsBadgeValue(value: Int) {
        // Установка badge на tab корзины
        self.basketModule.tabBarItem.badgeValue = String(value)
    }
}
```

### Extension для создания tab item

```swift
// Utilities/Extensions/UITabBarController+Extension.swift
import Foundation
import UIKit.UITabBarController

extension UITabBarController {

    func setController(
        viewController: UIViewController,
        title: String,
        imageName: String,
        selectedImageName: String
    ) -> UINavigationController {

        // Настройка tabBarItem
        viewController.tabBarItem.title = title
        viewController.tabBarItem.image = UIImage(systemName: imageName)
        viewController.tabBarItem.selectedImage = UIImage(systemName: selectedImageName)

        // Оборачиваем в NavigationController
        return UINavigationController(rootViewController: viewController)
    }
}
```

**Структура TabBar:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    UITabBarController Structure                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   MainTabBarViewController: UITabBarController                          │
│        │                                                                 │
│        ├── viewControllers = [                                          │
│        │       UINavigationController(rootViewController: homeModule),  │
│        │       UINavigationController(rootViewController: favModule),   │
│        │       UINavigationController(rootViewController: basketModule),│
│        │       UINavigationController(rootViewController: profileModule)│
│        │   ]                                                            │
│        │                                                                 │
│        └── tabBar                                                       │
│             ├── Home      🏠 / 🏠(fill)                                  │
│             ├── Favorites ❤️ / ❤️(fill)                                  │
│             ├── Basket    🧺 / 🧺(fill)  [badge: "3"]                   │
│             └── Profile   👤 / 👤(fill)                                  │
│                                                                          │
│   Каждый tab = UINavigationController                                   │
│   (свой stack навигации для каждой вкладки)                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12.6 Создание UI элементов программно

### Паттерн lazy var

Используем `lazy var` для создания UI элементов:

```swift
final class HomeViewController: UIViewController {

    // MARK: - UI Elements

    // SearchBar
    private lazy var searchBar: UISearchBar = {
        let searchBar = UISearchBar()
        searchBar.placeholder = "Search anything"
        searchBar.searchBarStyle = .minimal
        searchBar.delegate = self
        return searchBar
    }()

    // CollectionView
    private lazy var homeCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(
            CategoryTitleCell.self,
            forCellWithReuseIdentifier: CategoryTitleCell.identifier
        )
        collectionView.register(
            ProductCell.self,
            forCellWithReuseIdentifier: ProductCell.identifier
        )
        collectionView.keyboardDismissMode = .onDrag
        return collectionView
    }()

    // Activity Indicator
    private lazy var activityIndicatorView: UIActivityIndicatorView = {
        let aiv = UIActivityIndicatorView(style: .large)
        aiv.hidesWhenStopped = true
        return aiv
    }()

    // Custom View
    private lazy var customNavBarView = CustomNavBarView()

    // ...
}
```

**Почему lazy var?**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       lazy var Benefits                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   let vs lazy var:                                                       │
│                                                                          │
│   let property = UILabel()                                              │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  • Создаётся при инициализации объекта                           │   │
│   │  • Нельзя обратиться к self внутри closure                      │   │
│   │  • Память выделяется сразу                                       │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   lazy var property: UILabel = {                                        │
│       let label = UILabel()                                             │
│       label.delegate = self  // ← можно использовать self              │
│       return label                                                      │
│   }()                                                                   │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  • Создаётся при первом обращении                                │   │
│   │  • Можно использовать self (объект уже инициализирован)         │   │
│   │  • Экономия памяти (если не используется — не создаётся)        │   │
│   │  • Удобно для настройки в одном месте                           │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Различные UI элементы

```swift
// UILabel
private lazy var titleLabel: UILabel = {
    let label = UILabel()
    label.text = "Hello World"
    label.font = .systemFont(ofSize: 24, weight: .bold)
    label.textColor = .label
    label.textAlignment = .center
    label.numberOfLines = 0  // Многострочный
    return label
}()

// UIButton
private lazy var submitButton: UIButton = {
    let button = UIButton(type: .system)
    button.setTitle("Submit", for: .normal)
    button.setTitleColor(.white, for: .normal)
    button.backgroundColor = .systemBlue
    button.layer.cornerRadius = 8
    button.addTarget(self, action: #selector(submitTapped), for: .touchUpInside)
    return button
}()

// UITextField
private lazy var emailTextField: UITextField = {
    let textField = UITextField()
    textField.placeholder = "Enter email"
    textField.borderStyle = .roundedRect
    textField.keyboardType = .emailAddress
    textField.autocapitalizationType = .none
    textField.autocorrectionType = .no
    return textField
}()

// UIImageView
private lazy var profileImageView: UIImageView = {
    let imageView = UIImageView()
    imageView.contentMode = .scaleAspectFill
    imageView.clipsToBounds = true
    imageView.layer.cornerRadius = 50
    imageView.layer.borderWidth = 2
    imageView.layer.borderColor = UIColor.label.cgColor
    return imageView
}()

// UITableView
private lazy var tableView: UITableView = {
    let tableView = UITableView()
    tableView.delegate = self
    tableView.dataSource = self
    tableView.register(
        CustomCell.self,
        forCellReuseIdentifier: CustomCell.identifier
    )
    tableView.separatorStyle = .none
    tableView.rowHeight = UITableView.automaticDimension
    return tableView
}()

// UIStackView
private lazy var stackView: UIStackView = {
    let stackView = UIStackView(arrangedSubviews: [titleLabel, submitButton])
    stackView.axis = .vertical
    stackView.spacing = 16
    stackView.alignment = .fill
    stackView.distribution = .fill
    return stackView
}()
```

---

## 12.7 Auto Layout программно

### Способ 1: NSLayoutConstraint (нативный)

```swift
func setupConstraintsNative() {
    view.addSubview(titleLabel)
    view.addSubview(submitButton)

    // ВАЖНО: отключить autoresizing masks
    titleLabel.translatesAutoresizingMaskIntoConstraints = false
    submitButton.translatesAutoresizingMaskIntoConstraints = false

    NSLayoutConstraint.activate([
        // titleLabel
        titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
        titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
        titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),

        // submitButton
        submitButton.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 20),
        submitButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
        submitButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
        submitButton.heightAnchor.constraint(equalToConstant: 50)
    ])
}
```

### Способ 2: Anchors (более читаемый)

```swift
func setupConstraintsAnchors() {
    view.addSubview(titleLabel)
    view.addSubview(submitButton)

    titleLabel.translatesAutoresizingMaskIntoConstraints = false
    submitButton.translatesAutoresizingMaskIntoConstraints = false

    // titleLabel constraints
    titleLabel.topAnchor.constraint(
        equalTo: view.safeAreaLayoutGuide.topAnchor,
        constant: 20
    ).isActive = true

    titleLabel.leadingAnchor.constraint(
        equalTo: view.leadingAnchor,
        constant: 16
    ).isActive = true

    titleLabel.trailingAnchor.constraint(
        equalTo: view.trailingAnchor,
        constant: -16
    ).isActive = true

    // submitButton constraints
    submitButton.topAnchor.constraint(
        equalTo: titleLabel.bottomAnchor,
        constant: 20
    ).isActive = true

    submitButton.leadingAnchor.constraint(
        equalTo: view.leadingAnchor,
        constant: 16
    ).isActive = true

    submitButton.trailingAnchor.constraint(
        equalTo: view.trailingAnchor,
        constant: -16
    ).isActive = true

    submitButton.heightAnchor.constraint(equalToConstant: 50).isActive = true
}
```

### Способ 3: SnapKit (рекомендуемый)

```swift
import SnapKit

func setupConstraintsSnapKit() {
    view.addSubview(searchBar)
    view.addSubview(homeCollectionView)
    view.addSubview(activityIndicatorView)

    // SearchBar
    searchBar.snp.makeConstraints { make in
        make.top.equalTo(view.safeAreaLayoutGuide.snp.top).offset(32)
        make.left.right.equalToSuperview().inset(8)
    }

    // CollectionView
    homeCollectionView.snp.makeConstraints { make in
        make.top.equalTo(searchBar.snp.bottom)
        make.left.right.bottom.equalToSuperview()
    }

    // Activity Indicator
    activityIndicatorView.snp.makeConstraints { make in
        make.centerX.centerY.equalToSuperview()
    }
}
```

**Сравнение синтаксиса:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Auto Layout Syntax Comparison                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Задача: view по центру с отступами 16pt                               │
│                                                                          │
│   NSLayoutConstraint:                                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  view.translatesAutoresizingMaskIntoConstraints = false          │   │
│   │  NSLayoutConstraint.activate([                                   │   │
│   │      view.centerXAnchor.constraint(equalTo: superview.centerX),  │   │
│   │      view.centerYAnchor.constraint(equalTo: superview.centerY),  │   │
│   │      view.leadingAnchor.constraint(equalTo: superview.leading,   │   │
│   │                                    constant: 16),                │   │
│   │      view.trailingAnchor.constraint(equalTo: superview.trailing, │   │
│   │                                     constant: -16)               │   │
│   │  ])                                                              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│   ~ 8 строк                                                             │
│                                                                          │
│   SnapKit:                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  view.snp.makeConstraints { make in                              │   │
│   │      make.center.equalToSuperview()                              │   │
│   │      make.left.right.equalToSuperview().inset(16)                │   │
│   │  }                                                               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│   ~ 4 строки (в 2 раза меньше!)                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12.8 SnapKit — детальное руководство

### Установка SnapKit

```swift
// Package.swift (SPM)
dependencies: [
    .package(url: "https://github.com/SnapKit/SnapKit.git", from: "5.0.0")
]

// или Podfile
pod 'SnapKit'
```

### Основные методы

```swift
import SnapKit

// MARK: - Создание constraints
view.snp.makeConstraints { make in
    // ...
}

// MARK: - Обновление constraints
view.snp.updateConstraints { make in
    // Изменяет только указанные constraints
    make.height.equalTo(100)
}

// MARK: - Пересоздание constraints
view.snp.remakeConstraints { make in
    // Удаляет старые и создаёт новые
}
```

### Привязки (anchors)

```swift
view.snp.makeConstraints { make in
    // К краям
    make.top.equalToSuperview()
    make.bottom.equalToSuperview()
    make.left.equalToSuperview()      // или .leading
    make.right.equalToSuperview()     // или .trailing

    // Сокращённая запись
    make.edges.equalToSuperview()                    // Все края
    make.edges.equalToSuperview().inset(16)          // С отступами

    // К центру
    make.centerX.equalToSuperview()
    make.centerY.equalToSuperview()
    make.center.equalToSuperview()                   // Оба сразу

    // Размеры
    make.width.equalTo(100)
    make.height.equalTo(50)
    make.size.equalTo(CGSize(width: 100, height: 50))
    make.width.height.equalTo(100)                   // Квадрат

    // К другому view
    make.top.equalTo(otherView.snp.bottom).offset(16)
    make.left.equalTo(otherView.snp.right).offset(8)

    // К Safe Area
    make.top.equalTo(view.safeAreaLayoutGuide.snp.top)
}
```

### Модификаторы

```swift
view.snp.makeConstraints { make in
    // offset — добавить отступ
    make.top.equalToSuperview().offset(20)      // +20 от верха
    make.bottom.equalToSuperview().offset(-20)  // -20 от низа

    // inset — отступы внутрь (всегда положительные)
    make.left.right.equalToSuperview().inset(16)

    // multipliedBy — умножить
    make.width.equalToSuperview().multipliedBy(0.5)  // 50% ширины

    // priority — приоритет
    make.height.equalTo(100).priority(.high)
    make.height.greaterThanOrEqualTo(50).priority(.required)

    // lessThanOrEqualTo / greaterThanOrEqualTo
    make.width.lessThanOrEqualTo(300)
    make.height.greaterThanOrEqualTo(44)
}
```

### Практические примеры

```swift
// MARK: - Пример 1: Карточка товара
func setupProductCard() {
    view.addSubview(cardView)
    cardView.addSubview(imageView)
    cardView.addSubview(titleLabel)
    cardView.addSubview(priceLabel)

    cardView.snp.makeConstraints { make in
        make.top.equalTo(view.safeAreaLayoutGuide).offset(16)
        make.left.right.equalToSuperview().inset(16)
    }

    imageView.snp.makeConstraints { make in
        make.top.left.right.equalToSuperview()
        make.height.equalTo(200)
    }

    titleLabel.snp.makeConstraints { make in
        make.top.equalTo(imageView.snp.bottom).offset(12)
        make.left.right.equalToSuperview().inset(12)
    }

    priceLabel.snp.makeConstraints { make in
        make.top.equalTo(titleLabel.snp.bottom).offset(8)
        make.left.right.equalToSuperview().inset(12)
        make.bottom.equalToSuperview().inset(12)
    }
}

// MARK: - Пример 2: Форма логина
func setupLoginForm() {
    view.addSubview(logoImageView)
    view.addSubview(emailTextField)
    view.addSubview(passwordTextField)
    view.addSubview(loginButton)

    logoImageView.snp.makeConstraints { make in
        make.top.equalTo(view.safeAreaLayoutGuide).offset(60)
        make.centerX.equalToSuperview()
        make.size.equalTo(100)
    }

    emailTextField.snp.makeConstraints { make in
        make.top.equalTo(logoImageView.snp.bottom).offset(40)
        make.left.right.equalToSuperview().inset(24)
        make.height.equalTo(50)
    }

    passwordTextField.snp.makeConstraints { make in
        make.top.equalTo(emailTextField.snp.bottom).offset(16)
        make.left.right.height.equalTo(emailTextField)
    }

    loginButton.snp.makeConstraints { make in
        make.top.equalTo(passwordTextField.snp.bottom).offset(24)
        make.left.right.equalToSuperview().inset(24)
        make.height.equalTo(50)
    }
}

// MARK: - Пример 3: Ячейка с иконкой и текстом
func setupCell() {
    contentView.addSubview(iconImageView)
    contentView.addSubview(titleLabel)
    contentView.addSubview(arrowImageView)

    iconImageView.snp.makeConstraints { make in
        make.left.equalToSuperview().offset(16)
        make.centerY.equalToSuperview()
        make.size.equalTo(40)
    }

    titleLabel.snp.makeConstraints { make in
        make.left.equalTo(iconImageView.snp.right).offset(12)
        make.centerY.equalToSuperview()
        make.right.lessThanOrEqualTo(arrowImageView.snp.left).offset(-8)
    }

    arrowImageView.snp.makeConstraints { make in
        make.right.equalToSuperview().inset(16)
        make.centerY.equalToSuperview()
        make.size.equalTo(20)
    }
}
```

---

## 12.9 Навигация программно

### UINavigationController

```swift
// Создание Navigation Controller
let viewController = HomeViewController()
let navigationController = UINavigationController(rootViewController: viewController)

// Push (добавить в стек)
navigationController.pushViewController(detailVC, animated: true)

// Pop (вернуться назад)
navigationController.popViewController(animated: true)

// Pop to root (вернуться к первому экрану)
navigationController.popToRootViewController(animated: true)

// Pop to specific controller
if let targetVC = navigationController.viewControllers.first(where: { $0 is HomeViewController }) {
    navigationController.popToViewController(targetVC, animated: true)
}
```

### Present / Dismiss

```swift
// Present модально
let modalVC = ModalViewController()
modalVC.modalPresentationStyle = .fullScreen  // или .pageSheet, .formSheet
modalVC.modalTransitionStyle = .coverVertical  // или .crossDissolve, .flipHorizontal
present(modalVC, animated: true)

// С Navigation Controller
let navController = UINavigationController(rootViewController: modalVC)
navController.modalPresentationStyle = .fullScreen
present(navController, animated: true)

// Dismiss
dismiss(animated: true, completion: nil)
```

### Передача данных

```swift
// Способ 1: Через инициализатор
class DetailViewController: UIViewController {
    private let product: Product

    init(product: Product) {
        self.product = product
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

// Использование
let detailVC = DetailViewController(product: selectedProduct)
navigationController?.pushViewController(detailVC, animated: true)

// Способ 2: Через свойство
class DetailViewController: UIViewController {
    var product: Product?
}

// Использование
let detailVC = DetailViewController()
detailVC.product = selectedProduct
navigationController?.pushViewController(detailVC, animated: true)

// Способ 3: Через делегат (для обратной передачи)
protocol DetailViewControllerDelegate: AnyObject {
    func didSelectOption(_ option: String)
}

class DetailViewController: UIViewController {
    weak var delegate: DetailViewControllerDelegate?

    func selectOption() {
        delegate?.didSelectOption("Selected")
        navigationController?.popViewController(animated: true)
    }
}
```

---

## 12.10 Создание ячеек программно

### UICollectionViewCell

```swift
final class ProductCell: UICollectionViewCell {

    // Идентификатор для регистрации
    static let identifier = "ProductCell"

    // MARK: - UI Elements
    private lazy var productImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 8
        return imageView
    }()

    private lazy var titleLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 14, weight: .medium)
        label.textColor = .label
        label.numberOfLines = 2
        return label
    }()

    private lazy var priceLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 16, weight: .bold)
        label.textColor = .systemBlue
        return label
    }()

    private lazy var favoriteButton: UIButton = {
        let button = UIButton()
        button.setImage(UIImage(systemName: "heart"), for: .normal)
        button.tintColor = .systemRed
        button.addTarget(self, action: #selector(favoriteTapped), for: .touchUpInside)
        return button
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
        contentView.addSubview(productImageView)
        contentView.addSubview(titleLabel)
        contentView.addSubview(priceLabel)
        contentView.addSubview(favoriteButton)

        productImageView.snp.makeConstraints { make in
            make.top.left.right.equalToSuperview()
            make.height.equalTo(contentView.snp.width)  // Квадрат
        }

        titleLabel.snp.makeConstraints { make in
            make.top.equalTo(productImageView.snp.bottom).offset(8)
            make.left.right.equalToSuperview().inset(4)
        }

        priceLabel.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(4)
            make.left.equalToSuperview().offset(4)
            make.bottom.lessThanOrEqualToSuperview().inset(4)
        }

        favoriteButton.snp.makeConstraints { make in
            make.top.right.equalToSuperview().inset(8)
            make.size.equalTo(32)
        }
    }

    // MARK: - Configure
    func configure(with product: Product, isFavorite: Bool) {
        titleLabel.text = product.title
        priceLabel.text = "$\(product.price)"

        // Загрузка изображения (SDWebImage)
        productImageView.sd_setImage(with: URL(string: product.image))

        // Обновление кнопки избранного
        let imageName = isFavorite ? "heart.fill" : "heart"
        favoriteButton.setImage(UIImage(systemName: imageName), for: .normal)
    }

    // MARK: - Actions
    @objc private func favoriteTapped() {
        // Обработка через делегат
    }

    // MARK: - Reuse
    override func prepareForReuse() {
        super.prepareForReuse()
        productImageView.image = nil
        titleLabel.text = nil
        priceLabel.text = nil
    }
}
```

### UITableViewCell

```swift
final class SettingsCell: UITableViewCell {

    static let identifier = "SettingsCell"

    // MARK: - UI Elements
    private lazy var iconImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFit
        imageView.tintColor = .label
        return imageView
    }()

    private lazy var titleLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 16)
        label.textColor = .label
        return label
    }()

    // MARK: - Init
    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupUI()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup
    private func setupUI() {
        contentView.addSubview(iconImageView)
        contentView.addSubview(titleLabel)

        iconImageView.snp.makeConstraints { make in
            make.left.equalToSuperview().offset(16)
            make.centerY.equalToSuperview()
            make.size.equalTo(24)
        }

        titleLabel.snp.makeConstraints { make in
            make.left.equalTo(iconImageView.snp.right).offset(12)
            make.centerY.equalToSuperview()
            make.right.equalToSuperview().inset(16)
        }

        // Стандартная стрелка
        accessoryType = .disclosureIndicator
    }

    // MARK: - Configure
    func configure(icon: String, title: String) {
        iconImageView.image = UIImage(systemName: icon)
        titleLabel.text = title
    }
}
```

---

## 12.11 Полный пример ViewController

```swift
import UIKit
import SnapKit

final class HomeViewController: UIViewController {

    // MARK: - UI Elements

    private lazy var customNavBarView = CustomNavBarView()

    private lazy var searchBar: UISearchBar = {
        let searchBar = UISearchBar()
        searchBar.placeholder = "Search anything"
        searchBar.searchBarStyle = .minimal
        searchBar.delegate = self
        return searchBar
    }()

    private lazy var homeCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(
            CategoryTitleCell.self,
            forCellWithReuseIdentifier: CategoryTitleCell.identifier
        )
        collectionView.register(
            ProductCell.self,
            forCellWithReuseIdentifier: ProductCell.identifier
        )
        collectionView.keyboardDismissMode = .onDrag
        return collectionView
    }()

    private lazy var activityIndicatorView: UIActivityIndicatorView = {
        let aiv = UIActivityIndicatorView(style: .large)
        aiv.hidesWhenStopped = true
        return aiv
    }()

    // MARK: - Properties
    internal var presenter: HomePresenterInputs!

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

// MARK: - HomeViewProtocol
extension HomeViewController: HomeViewProtocol {

    func setViewBackgroundColor(color: UIColor) {
        view.backgroundColor = color
    }

    func prepareNavBarView() {
        navigationController?.navigationBar.addSubview(customNavBarView)
    }

    func setNavBarAndTabBarVisibility() {
        navigationController?.navigationBar.isHidden = false
        tabBarController?.tabBar.isHidden = false
    }

    func prepareSearchBar() {
        view.addSubview(searchBar)

        searchBar.snp.makeConstraints { make in
            make.top.equalTo(view.safeAreaLayoutGuide.snp.top).offset(32)
            make.left.right.equalToSuperview().inset(8)
        }
    }

    func prepareHomeCollectionView() {
        view.addSubview(homeCollectionView)

        homeCollectionView.snp.makeConstraints { make in
            make.top.equalTo(searchBar.snp.bottom)
            make.left.right.bottom.equalToSuperview()
        }
    }

    func prepareActivtyIndicatorView() {
        view.addSubview(activityIndicatorView)

        activityIndicatorView.snp.makeConstraints { make in
            make.centerX.centerY.equalToSuperview()
        }
    }

    func startLoading() {
        DispatchQueue.main.async { [weak self] in
            self?.activityIndicatorView.startAnimating()
        }
    }

    func endLoading() {
        DispatchQueue.main.async { [weak self] in
            self?.activityIndicatorView.stopAnimating()
        }
    }

    func dataRefreshed() {
        homeCollectionView.reloadData()
    }

    func onError(message: String) {
        showAlert(title: "", message: message)
    }
}

// MARK: - UISearchBarDelegate
extension HomeViewController: UISearchBarDelegate {
    func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
        presenter.searchTextDidChange(text: searchText)
    }
}

// MARK: - UICollectionViewDelegate & DataSource
extension HomeViewController: UICollectionViewDelegate,
                              UICollectionViewDataSource,
                              UICollectionViewDelegateFlowLayout {

    func numberOfSections(in collectionView: UICollectionView) -> Int {
        return presenter.numberOfSection()
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
        // Логика создания ячеек
        // ...
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
        didSelectItemAt indexPath: IndexPath
    ) {
        collectionView.deselectItem(at: indexPath, animated: true)
        presenter.didSelectItemAt(indexPath: indexPath)
    }
}
```

---

## 12.12 Чек-лист программного UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Programmatic UI Checklist                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Настройка проекта:                                                     │
│   □ Удалить Main.storyboard                                             │
│   □ Очистить Info.plist (UIMainStoryboardFile)                          │
│   □ Очистить Build Settings (Main Storyboard)                           │
│   □ Настроить SceneDelegate                                             │
│                                                                          │
│   SceneDelegate:                                                         │
│   □ Создать UIWindow                                                    │
│   □ Установить windowScene                                              │
│   □ Установить rootViewController                                       │
│   □ Вызвать makeKeyAndVisible()                                         │
│                                                                          │
│   ViewController:                                                        │
│   □ Использовать lazy var для UI элементов                              │
│   □ Создать метод setupUI() или setupConstraints()                      │
│   □ Вызвать setup в viewDidLoad()                                       │
│   □ Добавить subviews перед constraints                                 │
│                                                                          │
│   Auto Layout:                                                           │
│   □ addSubview() перед constraints                                      │
│   □ translatesAutoresizingMaskIntoConstraints = false                   │
│      (не нужно при использовании SnapKit)                               │
│   □ Активировать constraints                                            │
│                                                                          │
│   Cells:                                                                 │
│   □ static let identifier                                               │
│   □ override init(frame:) для Collection                                │
│   □ override init(style:reuseIdentifier:) для Table                     │
│   □ required init?(coder:) с fatalError                                 │
│   □ prepareForReuse() для очистки                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12.13 Итоги главы

В этой главе мы изучили:

| Тема | Описание |
|------|----------|
| Удаление Storyboard | Настройка проекта без Main.storyboard |
| AppDelegate | Глобальная настройка приложения |
| SceneDelegate | Создание окна и установка rootViewController |
| RootWindowManager | Смена корневого контроллера с анимацией |
| UITabBarController | Программное создание Tab Bar |
| lazy var | Паттерн для создания UI элементов |
| Auto Layout | NSLayoutConstraint, Anchors, SnapKit |
| SnapKit | Удобная библиотека для constraints |
| Navigation | Push, Pop, Present, Dismiss |
| Cells | UICollectionViewCell и UITableViewCell программно |

**Ключевые преимущества программного UI:**
1. Лучший контроль версий (Git)
2. Переиспользуемые компоненты
3. Понятный flow приложения
4. Быстрая компиляция
5. Удобный code review
