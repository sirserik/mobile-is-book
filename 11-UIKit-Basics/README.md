# Глава 11: UIKit — Полное руководство по интерфейсам iOS

## Введение

UIKit — это **основной фреймворк** Apple для создания пользовательских интерфейсов iOS приложений. Если вы знакомы с HTML/CSS, UIKit можно сравнить с DOM, CSS и JavaScript вместе взятыми — он отвечает за структуру, стилизацию и поведение интерфейса.

В этой главе мы **глубоко** изучим:
- Полную иерархию классов UIKit
- Когда и какой класс использовать
- Почему мы наследуемся от определённых классов
- Все основные UI компоненты
- Auto Layout и программную вёрстку
- SnapKit для удобной работы

---

## 11.1 Что такое UIKit

UIKit предоставляет всё необходимое для создания iOS приложений:
- **UI компоненты** — кнопки, текст, изображения, списки
- **Систему layout** — Auto Layout для адаптивной вёрстки
- **Обработку событий** — касания, жесты, клавиатура
- **Анимации** — встроенные и кастомные
- **Навигацию** — переходы между экранами
- **Жизненный цикл** — управление состоянием экранов

### Сравнение с Web технологиями

| Web | UIKit | Описание |
|-----|-------|----------|
| `<div>` | `UIView` | Базовый контейнер |
| `<button>` | `UIButton` | Кнопка |
| `<input type="text">` | `UITextField` | Однострочное поле ввода |
| `<textarea>` | `UITextView` | Многострочное поле ввода |
| `<p>`, `<span>`, `<h1>` | `UILabel` | Текст |
| `<img>` | `UIImageView` | Изображение |
| `<ul>`, `<table>` | `UITableView` | Вертикальный список |
| `display: grid` | `UICollectionView` | Сетка элементов |
| `display: flex` | `UIStackView` | Стек элементов |
| `<select>` | `UIPickerView` | Выбор из списка |
| `<input type="checkbox">` | `UISwitch` | Переключатель |
| `window.alert()` | `UIAlertController` | Диалоговое окно |
| `document` | `UIWindow` | Окно приложения |
| `CSS styles` | Свойства UIView | Стилизация элементов |
| `window.location` | `UINavigationController` | Навигация |
| `fetch()` / `XMLHttpRequest` | `URLSession` | Сетевые запросы |
| `localStorage` | `UserDefaults` / `Realm` | Локальное хранилище |

---

## 11.2 Полная иерархия классов UIKit

### Основная иерархия

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NSObject                                           │
│              (Базовый класс всех Objective-C объектов)                       │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          UIResponder                                         │
│    (Обработка событий: касания, жесты, клавиатура, motion events)           │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
    ┌─────────────┐      ┌─────────────┐       ┌──────────────────┐
    │ UIApplication│      │   UIView    │       │ UIViewController │
    │ (Singleton)  │      │(UI элемент) │       │   (Экран)        │
    └─────────────┘      └──────┬──────┘       └────────┬─────────┘
                                │                       │
            ┌───────────────────┼───────────────────┐   │
            │       │       │       │       │       │   │
            ▼       ▼       ▼       ▼       ▼       ▼   │
         UILabel UIButton UIImage UIText UIScroll UIStack
                          View  Field   View   View    │
                                         │             │
                                    ┌────┴────┐        │
                                    │         │        │
                              UITableView UICollection │
                                          View         │
                                                       │
                    ┌──────────────────────────────────┤
                    │              │                   │
                    ▼              ▼                   ▼
           UINavigation    UITabBar          UIAlert
           Controller      Controller        Controller
```

### Детальная иерархия UIView

```
UIView (Базовый элемент интерфейса)
│
├── UILabel                    ← Отображение текста
│
├── UIControl                  ← Базовый класс для интерактивных элементов
│   ├── UIButton               ← Кнопка
│   ├── UITextField            ← Поле ввода (одна строка)
│   ├── UISwitch               ← Переключатель (вкл/выкл)
│   ├── UISlider               ← Ползунок
│   ├── UIStepper              ← Кнопки +/-
│   ├── UISegmentedControl     ← Сегментированный контрол
│   ├── UIPageControl          ← Индикатор страниц (точки)
│   └── UIDatePicker           ← Выбор даты
│
├── UIImageView                ← Отображение изображений
│
├── UIScrollView               ← Прокручиваемый контейнер
│   ├── UITableView            ← Вертикальный список
│   ├── UICollectionView       ← Сетка / произвольный layout
│   └── UITextView             ← Многострочный текст
│
├── UIStackView                ← Автоматический стек элементов
│
├── UIActivityIndicatorView    ← Индикатор загрузки (спиннер)
│
├── UIProgressView             ← Полоса прогресса
│
├── UIVisualEffectView         ← Blur эффекты
│
├── UIToolbar                  ← Панель инструментов
│
├── UITabBar                   ← Панель вкладок
│
├── UINavigationBar            ← Навигационная панель
│
└── UISearchBar                ← Поле поиска
```

### Детальная иерархия UIViewController

```
UIViewController (Базовый контроллер экрана)
│
├── UINavigationController     ← Стек экранов с навигацией (push/pop)
│
├── UITabBarController         ← Вкладки внизу экрана
│
├── UISplitViewController      ← Разделённый экран (iPad)
│
├── UIPageViewController       ← Листание страниц
│
├── UIAlertController          ← Диалоги и action sheets
│
├── UISearchController         ← Контроллер поиска
│
├── UIImagePickerController    ← Выбор фото/видео
│
├── UIDocumentPickerVC         ← Выбор файлов
│
└── UIActivityViewController   ← Меню "Поделиться"
```

---

## 11.3 Когда использовать какой класс

### Таблица выбора класса

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ВЫБОР КЛАССА UIKit                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ❓ Что вам нужно?                         → Используйте                     │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  📺 ЭКРАНЫ И НАВИГАЦИЯ                                                       │
│  • Обычный экран                           → UIViewController                │
│  • Навигация с back кнопкой               → UINavigationController          │
│  • Вкладки внизу                          → UITabBarController              │
│  • Диалог/алерт                           → UIAlertController               │
│  • Меню "Поделиться"                      → UIActivityViewController        │
│  • Выбор фото из галереи                  → UIImagePickerController         │
│                                                                              │
│  📝 ОТОБРАЖЕНИЕ ДАННЫХ                                                       │
│  • Статический текст                       → UILabel                         │
│  • Список элементов                        → UITableView                     │
│  • Сетка элементов                         → UICollectionView                │
│  • Изображение                             → UIImageView                     │
│  • Многострочный текст (редактируемый)    → UITextView                      │
│                                                                              │
│  🎮 ИНТЕРАКТИВНЫЕ ЭЛЕМЕНТЫ                                                   │
│  • Кнопка                                  → UIButton                        │
│  • Поле ввода (одна строка)               → UITextField                     │
│  • Переключатель (вкл/выкл)               → UISwitch                        │
│  • Ползунок (выбор значения)              → UISlider                        │
│  • Выбор из сегментов                     → UISegmentedControl              │
│  • Выбор даты                             → UIDatePicker                    │
│                                                                              │
│  📦 КОНТЕЙНЕРЫ И LAYOUT                                                      │
│  • Простой контейнер                       → UIView                          │
│  • Прокручиваемый контент                  → UIScrollView                    │
│  • Автоматический стек                     → UIStackView                     │
│                                                                              │
│  ⏳ ИНДИКАТОРЫ                                                               │
│  • Загрузка (спиннер)                      → UIActivityIndicatorView        │
│  • Прогресс (полоса)                       → UIProgressView                 │
│                                                                              │
│  🌐 СЕТЬ (НЕ UIKit, но важно)                                               │
│  • HTTP запросы                            → URLSession                      │
│  • Загрузка изображений                   → SDWebImage (библиотека)         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Подробное объяснение: Когда какой класс

#### 1. Для ЭКРАНОВ — UIViewController

```swift
// ПОЧЕМУ наследуемся от UIViewController:
// - Получаем view для размещения UI
// - Получаем жизненный цикл (viewDidLoad, viewWillAppear...)
// - Интеграция с Navigation/TabBar
// - Возможность показывать модальные экраны
// - Обработка поворота экрана

class HomeViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        // ✅ view уже создан и готов
        view.backgroundColor = .systemBackground
    }
}
```

#### 2. Для НАВИГАЦИИ — UINavigationController

```swift
// КОГДА использовать:
// - Нужна иерархическая навигация (главный → детали)
// - Нужна кнопка "назад"
// - Нужен navigation bar с заголовком

// Создание
let homeVC = HomeViewController()
let navController = UINavigationController(rootViewController: homeVC)

// В SceneDelegate
window?.rootViewController = navController

// Переход на следующий экран
navigationController?.pushViewController(DetailVC(), animated: true)

// Возврат назад
navigationController?.popViewController(animated: true)
```

#### 3. Для ВКЛАДОК — UITabBarController

```swift
// КОГДА использовать:
// - Несколько независимых разделов приложения
// - Пользователь может переключаться между ними

let tabBar = UITabBarController()

let homeVC = UINavigationController(rootViewController: HomeViewController())
homeVC.tabBarItem = UITabBarItem(title: "Главная", image: UIImage(systemName: "house"), tag: 0)

let cartVC = UINavigationController(rootViewController: CartViewController())
cartVC.tabBarItem = UITabBarItem(title: "Корзина", image: UIImage(systemName: "cart"), tag: 1)

let profileVC = UINavigationController(rootViewController: ProfileViewController())
profileVC.tabBarItem = UITabBarItem(title: "Профиль", image: UIImage(systemName: "person"), tag: 2)

tabBar.viewControllers = [homeVC, cartVC, profileVC]
```

#### 4. Для ДИАЛОГОВ — UIAlertController

```swift
// КОГДА использовать:
// - Показать сообщение пользователю
// - Запросить подтверждение действия
// - Показать action sheet (меню снизу)

// Alert (диалог по центру)
let alert = UIAlertController(
    title: "Удалить товар?",
    message: "Товар будет удалён из корзины",
    preferredStyle: .alert  // ← .alert для диалога
)

alert.addAction(UIAlertAction(title: "Отмена", style: .cancel))
alert.addAction(UIAlertAction(title: "Удалить", style: .destructive) { _ in
    // Действие при удалении
    self.deleteItem()
})

present(alert, animated: true)


// Action Sheet (меню снизу)
let actionSheet = UIAlertController(
    title: "Выберите действие",
    message: nil,
    preferredStyle: .actionSheet  // ← .actionSheet для меню
)

actionSheet.addAction(UIAlertAction(title: "Сфотографировать", style: .default) { _ in
    self.takePhoto()
})
actionSheet.addAction(UIAlertAction(title: "Выбрать из галереи", style: .default) { _ in
    self.selectFromGallery()
})
actionSheet.addAction(UIAlertAction(title: "Отмена", style: .cancel))

present(actionSheet, animated: true)
```

#### 5. Для СПИСКОВ — UITableView

```swift
// КОГДА использовать:
// - Вертикальный список однородных элементов
// - История заказов
// - Настройки
// - Любой скроллящийся список

class OrdersViewController: UIViewController {
    private let tableView = UITableView()
    private var orders: [Order] = []

    override func viewDidLoad() {
        super.viewDidLoad()

        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(OrderCell.self, forCellReuseIdentifier: "OrderCell")
        view.addSubview(tableView)
    }
}

extension OrdersViewController: UITableViewDataSource, UITableViewDelegate {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return orders.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "OrderCell", for: indexPath) as! OrderCell
        cell.configure(with: orders[indexPath.row])
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let order = orders[indexPath.row]
        navigationController?.pushViewController(OrderDetailVC(order: order), animated: true)
    }
}
```

#### 6. Для СЕТОК — UICollectionView

```swift
// КОГДА использовать:
// - Сетка товаров (как в магазине)
// - Галерея изображений
// - Горизонтальные карусели
// - Любой нестандартный layout

class ProductsViewController: UIViewController {
    private var collectionView: UICollectionView!

    override func viewDidLoad() {
        super.viewDidLoad()

        // Layout для сетки
        let layout = UICollectionViewFlowLayout()
        layout.itemSize = CGSize(width: 180, height: 250)
        layout.minimumInteritemSpacing = 10
        layout.minimumLineSpacing = 10

        collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(ProductCell.self, forCellWithReuseIdentifier: "ProductCell")
    }
}
```

#### 7. Для СЕТЕВЫХ ЗАПРОСОВ — URLSession (НЕ UIKit)

```swift
// ⚠️ URLSession НЕ является частью UIKit, но очень важен

// КОГДА использовать:
// - Любые HTTP запросы к серверу
// - Загрузка данных из API
// - Отправка данных на сервер

class NetworkManager {
    static let shared = NetworkManager()
    private let session = URLSession.shared

    func fetchProducts() async throws -> [Product] {
        guard let url = URL(string: "https://fakestoreapi.com/products") else {
            throw NetworkError.invalidURL
        }

        let (data, response) = try await session.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }

        return try JSONDecoder().decode([Product].self, from: data)
    }
}

// Использование в ViewController
class HomeViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        loadProducts()
    }

    private func loadProducts() {
        Task {
            do {
                let products = try await NetworkManager.shared.fetchProducts()
                // Обновляем UI в main thread
                await MainActor.run {
                    self.products = products
                    self.collectionView.reloadData()
                }
            } catch {
                showError(error)
            }
        }
    }
}
```

---

## 11.4 Почему мы наследуемся от определённых классов

### UIViewController — для КАЖДОГО экрана

```swift
// UIViewController предоставляет:
class MyViewController: UIViewController {

    // 1. ✅ Готовый view для размещения UI
    // view уже создан, когда вызывается viewDidLoad

    // 2. ✅ Жизненный цикл
    override func viewDidLoad() { }         // Один раз при загрузке
    override func viewWillAppear(_ animated: Bool) { }   // Перед появлением
    override func viewDidAppear(_ animated: Bool) { }    // После появления
    override func viewWillDisappear(_ animated: Bool) { } // Перед исчезновением
    override func viewDidDisappear(_ animated: Bool) { }  // После исчезновения

    // 3. ✅ Навигация
    func goToDetail() {
        navigationController?.pushViewController(DetailVC(), animated: true)
    }

    // 4. ✅ Модальные экраны
    func showModal() {
        present(ModalVC(), animated: true)
    }

    // 5. ✅ Navigation bar
    func setupNavBar() {
        title = "Главная"
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            image: UIImage(systemName: "cart"),
            style: .plain,
            target: self,
            action: #selector(cartTapped)
        )
    }

    // 6. ✅ Обработка поворота экрана
    override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
        super.viewWillTransition(to: size, with: coordinator)
        // Обработка поворота
    }
}

// ❌ Если НЕ наследоваться от UIViewController:
// - Нет view
// - Нет жизненного цикла
// - Нет интеграции с Navigation/TabBar
// - Придётся всё реализовывать с нуля
```

### UIView — для кастомных UI компонентов

```swift
// UIView предоставляет:
class ProductCardView: UIView {

    // 1. ✅ frame и bounds — размер и позиция
    // 2. ✅ backgroundColor, alpha — визуальные свойства
    // 3. ✅ addSubview — иерархия view
    // 4. ✅ layer — тени, скругления, рамки
    // 5. ✅ Auto Layout через anchors
    // 6. ✅ Обработка касаний
    // 7. ✅ Анимации

    private let imageView = UIImageView()
    private let titleLabel = UILabel()
    private let priceLabel = UILabel()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupUI() {
        // Стилизация через layer
        backgroundColor = .systemBackground
        layer.cornerRadius = 12
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOpacity = 0.1
        layer.shadowRadius = 8
        layer.shadowOffset = CGSize(width: 0, height: 2)

        // Добавление subviews
        addSubview(imageView)
        addSubview(titleLabel)
        addSubview(priceLabel)

        // Auto Layout...
    }

    // Переопределение отрисовки (опционально)
    override func draw(_ rect: CGRect) {
        super.draw(rect)
        // Кастомная отрисовка
    }

    // Переопределение layout (опционально)
    override func layoutSubviews() {
        super.layoutSubviews()
        // Кастомный layout
    }
}
```

### UITableViewCell — для ячеек списка

```swift
// UITableViewCell предоставляет:
class ProductCell: UITableViewCell {

    // 1. ✅ contentView — контейнер для контента
    // 2. ✅ Reuse mechanism — переиспользование ячеек
    // 3. ✅ Selection states — состояния выделения
    // 4. ✅ Accessory views — стрелки, галочки справа
    // 5. ✅ Swipe actions — действия при свайпе
    // 6. ✅ Separator — разделитель

    static let identifier = "ProductCell"

    private let productImageView = UIImageView()
    private let titleLabel = UILabel()
    private let priceLabel = UILabel()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupUI()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupUI() {
        // ⚠️ ВАЖНО: добавляем в contentView, НЕ в self!
        contentView.addSubview(productImageView)
        contentView.addSubview(titleLabel)
        contentView.addSubview(priceLabel)

        // Accessory — стрелка справа
        accessoryType = .disclosureIndicator
    }

    // Очистка при переиспользовании
    override func prepareForReuse() {
        super.prepareForReuse()
        productImageView.image = nil
        titleLabel.text = nil
        priceLabel.text = nil
    }

    func configure(with product: Product) {
        titleLabel.text = product.title
        priceLabel.text = product.formattedPrice
        // Загрузка изображения...
    }
}
```

### UICollectionViewCell — для ячеек сетки

```swift
// UICollectionViewCell предоставляет:
class ProductGridCell: UICollectionViewCell {

    // 1. ✅ contentView — контейнер для контента
    // 2. ✅ Reuse mechanism — переиспользование
    // 3. ✅ Selection states — выделение
    // 4. ✅ Более гибкий layout чем TableViewCell

    static let identifier = "ProductGridCell"

    private let imageView = UIImageView()
    private let titleLabel = UILabel()
    private let priceLabel = UILabel()
    private let addButton = UIButton(type: .system)

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupUI() {
        contentView.backgroundColor = .systemBackground
        contentView.layer.cornerRadius = 12
        contentView.layer.shadowOpacity = 0.1

        contentView.addSubview(imageView)
        contentView.addSubview(titleLabel)
        contentView.addSubview(priceLabel)
        contentView.addSubview(addButton)
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        imageView.image = nil
        titleLabel.text = nil
    }
}
```

---

## 11.5 UIView — базовый элемент интерфейса

### Создание и настройка UIView

```swift
import UIKit

// Создание view
let containerView = UIView()

// Размер и позиция (если не используется Auto Layout)
containerView.frame = CGRect(x: 20, y: 100, width: 200, height: 150)

// Цвет фона
containerView.backgroundColor = .systemBlue

// Прозрачность (0.0 - 1.0)
containerView.alpha = 0.9

// Скругление углов
containerView.layer.cornerRadius = 12
containerView.clipsToBounds = true  // Обрезать контент за границами

// Рамка
containerView.layer.borderWidth = 1
containerView.layer.borderColor = UIColor.systemGray.cgColor

// Тень (требует clipsToBounds = false)
containerView.layer.shadowColor = UIColor.black.cgColor
containerView.layer.shadowOffset = CGSize(width: 0, height: 2)
containerView.layer.shadowRadius = 8
containerView.layer.shadowOpacity = 0.15
containerView.clipsToBounds = false  // Для отображения тени

// Видимость
containerView.isHidden = false

// Взаимодействие
containerView.isUserInteractionEnabled = true

// Tag для идентификации
containerView.tag = 100
```

### Иерархия View

```swift
// Родительский view
let parentView = UIView()

// Дочерние views
let childView1 = UIView()
let childView2 = UIView()

// Добавление в иерархию
parentView.addSubview(childView1)
parentView.addSubview(childView2)

// childView2 будет поверх childView1

// Управление порядком
parentView.bringSubviewToFront(childView1)  // childView1 наверх
parentView.sendSubviewToBack(childView2)    // childView2 вниз

// Вставка на определённую позицию
parentView.insertSubview(newView, at: 0)  // В самый низ
parentView.insertSubview(newView, aboveSubview: childView1)
parentView.insertSubview(newView, belowSubview: childView1)

// Удаление из иерархии
childView1.removeFromSuperview()

// Доступ к родителю и детям
let parent = childView1.superview
let children = parentView.subviews
```

### Трансформации

```swift
// Поворот (в радианах)
view.transform = CGAffineTransform(rotationAngle: .pi / 4)  // 45°

// Масштаб
view.transform = CGAffineTransform(scaleX: 1.5, y: 1.5)

// Смещение
view.transform = CGAffineTransform(translationX: 50, y: 20)

// Комбинация трансформаций
view.transform = CGAffineTransform(rotationAngle: .pi / 4)
    .scaledBy(x: 1.2, y: 1.2)
    .translatedBy(x: 10, y: 10)

// Сброс трансформации
view.transform = .identity
```

---

## 11.6 UIViewController — жизненный цикл

### Полный жизненный цикл

```swift
class ExampleViewController: UIViewController {

    // MARK: - Lifecycle

    // 1️⃣ Вызывается при загрузке view (ОДИН раз)
    override func viewDidLoad() {
        super.viewDidLoad()

        // ✅ Инициализация UI
        // ✅ Добавление subviews
        // ✅ Настройка constraints
        // ✅ Одноразовая настройка

        setupUI()
        setupConstraints()
    }

    // 2️⃣ View собирается появиться (КАЖДЫЙ раз)
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        // ✅ Обновление данных
        // ✅ Подписка на уведомления
        // ✅ Запуск обновлений (таймеры)

        refreshData()
        subscribeToNotifications()
    }

    // 3️⃣ View появился на экране (КАЖДЫЙ раз)
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        // ✅ Запуск анимаций
        // ✅ Отправка аналитики
        // ✅ Показ клавиатуры

        startAnimations()
        trackScreenView()
    }

    // 4️⃣ View собирается исчезнуть (КАЖДЫЙ раз)
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)

        // ✅ Сохранение данных
        // ✅ Остановка таймеров
        // ✅ Скрытие клавиатуры

        saveData()
        stopTimers()
    }

    // 5️⃣ View исчез с экрана (КАЖДЫЙ раз)
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)

        // ✅ Отписка от уведомлений
        // ✅ Очистка ресурсов

        unsubscribeFromNotifications()
    }

    // 6️⃣ Предупреждение о нехватке памяти
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()

        // ✅ Освобождение кэшей
        // ✅ Очистка неиспользуемых данных
    }

    // 7️⃣ Деинициализация (при удалении VC)
    deinit {
        print("ViewController deallocated")
    }
}
```

### Диаграмма жизненного цикла

```
┌─────────────────────────────────────────────────────────────────┐
│                    ЖИЗНЕННЫЙ ЦИКЛ ViewController                │
└─────────────────────────────────────────────────────────────────┘

              ┌──────────────────┐
              │   init / awake   │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   viewDidLoad    │ ◄─── Один раз
              │                  │      (настройка UI)
              └────────┬─────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    │                  ▼                  │
    │         ┌──────────────────┐        │
    │    ┌───►│ viewWillAppear   │        │
    │    │    └────────┬─────────┘        │
    │    │             │                  │
    │    │             ▼                  │
    │    │    ┌──────────────────┐        │
    │    │    │  viewDidAppear   │        │
    │    │    │                  │        │  Цикл появления/
    │    │    │  (View видим)    │        │  исчезновения
    │    │    └────────┬─────────┘        │
    │    │             │                  │
    │    │             ▼                  │
    │    │    ┌──────────────────┐        │
    │    │    │viewWillDisappear │        │
    │    │    └────────┬─────────┘        │
    │    │             │                  │
    │    │             ▼                  │
    │    │    ┌──────────────────┐        │
    │    └────│ viewDidDisappear │        │
    │         └──────────────────┘        │
    │                                     │
    └─────────────────────────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │      deinit      │ ◄─── При удалении
              └──────────────────┘
```

---

## 11.7 Основные UI компоненты

### UILabel — текст

```swift
let label = UILabel()

// Текст
label.text = "Привет, мир!"
label.attributedText = NSAttributedString(...)  // Стилизованный текст

// Шрифт
label.font = .systemFont(ofSize: 16)
label.font = .systemFont(ofSize: 16, weight: .bold)
label.font = .preferredFont(forTextStyle: .headline)  // Dynamic Type

// Цвет текста
label.textColor = .label  // Адаптивный цвет (тёмный/светлый режим)
label.textColor = .systemBlue

// Выравнивание
label.textAlignment = .left
label.textAlignment = .center
label.textAlignment = .right

// Многострочность
label.numberOfLines = 0  // Неограниченное количество строк
label.numberOfLines = 2  // Максимум 2 строки

// Обрезка текста
label.lineBreakMode = .byTruncatingTail  // "Длинный тек..."
label.lineBreakMode = .byWordWrapping    // Перенос по словам

// Минимальный размер шрифта
label.adjustsFontSizeToFitWidth = true
label.minimumScaleFactor = 0.5  // Минимум 50% от исходного размера
```

### UIButton — кнопка

```swift
// Создание кнопки
let button = UIButton(type: .system)  // Системный стиль

// Текст кнопки
button.setTitle("Нажми меня", for: .normal)
button.setTitle("Нажато!", for: .highlighted)

// Цвет текста
button.setTitleColor(.white, for: .normal)
button.setTitleColor(.gray, for: .disabled)

// Фон
button.backgroundColor = .systemBlue

// Скругление
button.layer.cornerRadius = 8

// Изображение
button.setImage(UIImage(systemName: "cart"), for: .normal)
button.tintColor = .white

// Расположение изображения и текста
button.imageEdgeInsets = UIEdgeInsets(top: 0, left: -8, bottom: 0, right: 0)

// Обработка нажатия
button.addTarget(self, action: #selector(buttonTapped), for: .touchUpInside)

@objc func buttonTapped() {
    print("Кнопка нажата!")
}

// Включение/выключение
button.isEnabled = false
```

### UITextField — поле ввода

```swift
let textField = UITextField()

// Placeholder
textField.placeholder = "Введите email"

// Текст
textField.text = ""

// Стиль рамки
textField.borderStyle = .roundedRect

// Тип клавиатуры
textField.keyboardType = .emailAddress
textField.keyboardType = .numberPad
textField.keyboardType = .phonePad

// Автокоррекция и автозаглавные
textField.autocorrectionType = .no
textField.autocapitalizationType = .none

// Secure entry (для паролей)
textField.isSecureTextEntry = true

// Кнопка очистки
textField.clearButtonMode = .whileEditing

// Return key
textField.returnKeyType = .done
textField.returnKeyType = .next

// Delegate
textField.delegate = self

// UITextFieldDelegate
extension ViewController: UITextFieldDelegate {
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.resignFirstResponder()  // Скрыть клавиатуру
        return true
    }

    func textFieldDidEndEditing(_ textField: UITextField) {
        print("Введено: \(textField.text ?? "")")
    }

    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        // Валидация ввода
        return true
    }
}
```

### UIImageView — изображение

```swift
let imageView = UIImageView()

// Изображение из Assets
imageView.image = UIImage(named: "productPhoto")

// SF Symbols (системные иконки)
imageView.image = UIImage(systemName: "heart.fill")
imageView.tintColor = .systemRed

// Content Mode — как изображение вписывается
imageView.contentMode = .scaleAspectFit   // Вписать полностью, сохраняя пропорции
imageView.contentMode = .scaleAspectFill  // Заполнить, сохраняя пропорции (может обрезаться)
imageView.contentMode = .scaleToFill      // Растянуть (нарушает пропорции)
imageView.contentMode = .center           // По центру без масштабирования

// Обрезать выступающее
imageView.clipsToBounds = true

// Скругление
imageView.layer.cornerRadius = 8

// Загрузка из URL (с SDWebImage)
imageView.sd_setImage(with: URL(string: product.imageURL))
```

### UISwitch — переключатель

```swift
let toggle = UISwitch()

// Состояние
toggle.isOn = true

// Цвета
toggle.onTintColor = .systemGreen
toggle.thumbTintColor = .white

// Обработка изменения
toggle.addTarget(self, action: #selector(switchChanged), for: .valueChanged)

@objc func switchChanged(_ sender: UISwitch) {
    if sender.isOn {
        print("Включено")
    } else {
        print("Выключено")
    }
}
```

### UIActivityIndicatorView — индикатор загрузки

```swift
let spinner = UIActivityIndicatorView(style: .large)
spinner.color = .systemBlue

// Скрывать когда не анимируется
spinner.hidesWhenStopped = true

// Запуск/остановка
spinner.startAnimating()

// После загрузки
spinner.stopAnimating()  // Автоматически скроется
```

### UIStackView — автоматический стек

```swift
let stackView = UIStackView()

// Направление
stackView.axis = .vertical    // Вертикальный стек
stackView.axis = .horizontal  // Горизонтальный стек

// Распределение
stackView.distribution = .fill            // Заполнить пространство
stackView.distribution = .fillEqually     // Равные размеры
stackView.distribution = .fillProportionally
stackView.distribution = .equalSpacing    // Равные промежутки
stackView.distribution = .equalCentering

// Выравнивание
stackView.alignment = .fill
stackView.alignment = .center
stackView.alignment = .leading
stackView.alignment = .trailing

// Отступы между элементами
stackView.spacing = 16

// Добавление элементов
stackView.addArrangedSubview(label)
stackView.addArrangedSubview(button)
stackView.addArrangedSubview(textField)

// Удаление элемента
stackView.removeArrangedSubview(button)
button.removeFromSuperview()
```

---

## 11.8 Auto Layout — система constraints

### Основные концепции

Auto Layout — это система **ограничений (constraints)**, которая описывает:
- Где элемент находится относительно других элементов
- Какого размера элемент
- Как элемент должен изменяться при изменении экрана

### Anchor-based API

```swift
let redView = UIView()
redView.backgroundColor = .red

// ⚠️ ОБЯЗАТЕЛЬНО при программной вёрстке
redView.translatesAutoresizingMaskIntoConstraints = false

view.addSubview(redView)

// Активация constraints
NSLayoutConstraint.activate([
    // Привязка к верху (с отступом от safe area)
    redView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),

    // Привязка к левому краю
    redView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),

    // Привязка к правому краю
    redView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),

    // Фиксированная высота
    redView.heightAnchor.constraint(equalToConstant: 100)
])
```

### Типы Anchors

```swift
// ПОЗИЦИОНИРОВАНИЕ
view.topAnchor        // Верхний край
view.bottomAnchor     // Нижний край
view.leadingAnchor    // Левый край (с учётом RTL языков)
view.trailingAnchor   // Правый край (с учётом RTL)
view.leftAnchor       // Всегда левый
view.rightAnchor      // Всегда правый
view.centerXAnchor    // Центр по горизонтали
view.centerYAnchor    // Центр по вертикали

// РАЗМЕРЫ
view.widthAnchor
view.heightAnchor

// BASELINE (для текста)
view.firstBaselineAnchor
view.lastBaselineAnchor

// SAFE AREA
view.safeAreaLayoutGuide.topAnchor     // Учитывает notch
view.safeAreaLayoutGuide.bottomAnchor  // Учитывает home indicator
```

### Типы Constraints

```swift
// РАВЕНСТВО
label.topAnchor.constraint(equalTo: view.topAnchor, constant: 20)

// БОЛЬШЕ ИЛИ РАВНО
label.widthAnchor.constraint(greaterThanOrEqualToConstant: 100)

// МЕНЬШЕ ИЛИ РАВНО
label.widthAnchor.constraint(lessThanOrEqualToConstant: 300)

// ПРОПОРЦИЯ
imageView.heightAnchor.constraint(equalTo: imageView.widthAnchor, multiplier: 0.75)

// ПРИОРИТЕТЫ
let widthConstraint = label.widthAnchor.constraint(equalToConstant: 200)
widthConstraint.priority = .defaultHigh  // 750
widthConstraint.priority = .required     // 1000
widthConstraint.priority = UILayoutPriority(999)

// АКТИВАЦИЯ/ДЕАКТИВАЦИЯ
widthConstraint.isActive = true
widthConstraint.isActive = false
```

### Пример: Экран входа с чистым Auto Layout

```swift
class LoginViewController: UIViewController {
    private let logoImageView = UIImageView()
    private let emailTextField = UITextField()
    private let passwordTextField = UITextField()
    private let loginButton = UIButton(type: .system)

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupConstraints()
    }

    private func setupUI() {
        view.backgroundColor = .systemBackground

        logoImageView.image = UIImage(systemName: "cart.fill")
        logoImageView.tintColor = .systemBlue
        logoImageView.contentMode = .scaleAspectFit
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(logoImageView)

        emailTextField.placeholder = "Email"
        emailTextField.borderStyle = .roundedRect
        emailTextField.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(emailTextField)

        passwordTextField.placeholder = "Пароль"
        passwordTextField.borderStyle = .roundedRect
        passwordTextField.isSecureTextEntry = true
        passwordTextField.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(passwordTextField)

        loginButton.setTitle("Войти", for: .normal)
        loginButton.backgroundColor = .systemBlue
        loginButton.setTitleColor(.white, for: .normal)
        loginButton.layer.cornerRadius = 8
        loginButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(loginButton)
    }

    private func setupConstraints() {
        NSLayoutConstraint.activate([
            // Logo
            logoImageView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 60),
            logoImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            logoImageView.widthAnchor.constraint(equalToConstant: 100),
            logoImageView.heightAnchor.constraint(equalToConstant: 100),

            // Email
            emailTextField.topAnchor.constraint(equalTo: logoImageView.bottomAnchor, constant: 40),
            emailTextField.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            emailTextField.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            emailTextField.heightAnchor.constraint(equalToConstant: 50),

            // Password
            passwordTextField.topAnchor.constraint(equalTo: emailTextField.bottomAnchor, constant: 16),
            passwordTextField.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            passwordTextField.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            passwordTextField.heightAnchor.constraint(equalToConstant: 50),

            // Login Button
            loginButton.topAnchor.constraint(equalTo: passwordTextField.bottomAnchor, constant: 30),
            loginButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            loginButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            loginButton.heightAnchor.constraint(equalToConstant: 50),
        ])
    }
}
```

---

## 11.9 SnapKit — удобные constraints

SnapKit — библиотека, упрощающая написание Auto Layout.

### Установка через SPM

```
File → Add Packages → https://github.com/SnapKit/SnapKit
```

### Базовое использование

```swift
import SnapKit

// ⚠️ НЕ нужно: translatesAutoresizingMaskIntoConstraints = false
// SnapKit делает это автоматически

let redView = UIView()
redView.backgroundColor = .red
view.addSubview(redView)

// Создание constraints
redView.snp.makeConstraints { make in
    make.top.equalTo(view.safeAreaLayoutGuide).offset(20)
    make.leading.equalToSuperview().offset(20)
    make.trailing.equalToSuperview().offset(-20)
    make.height.equalTo(100)
}
```

### Основные методы

```swift
// ПРИВЯЗКА К РОДИТЕЛЮ
view.snp.makeConstraints { make in
    make.edges.equalToSuperview()  // Все края
    make.edges.equalToSuperview().inset(20)  // С отступами

    make.center.equalToSuperview()  // Центр
    make.centerX.equalToSuperview()
    make.centerY.equalToSuperview()

    make.size.equalTo(CGSize(width: 100, height: 100))
    make.width.equalToSuperview()
    make.height.equalTo(50)
}

// ПРИВЯЗКА К ДРУГОМУ VIEW
label.snp.makeConstraints { make in
    make.top.equalTo(imageView.snp.bottom).offset(10)
    make.leading.trailing.equalToSuperview().inset(16)
}

// SAFE AREA
view.snp.makeConstraints { make in
    make.top.equalTo(view.safeAreaLayoutGuide)
    make.bottom.equalTo(view.safeAreaLayoutGuide)
}

// ПРОПОРЦИИ
imageView.snp.makeConstraints { make in
    make.height.equalTo(imageView.snp.width).multipliedBy(0.75)
}

// ПРИОРИТЕТЫ
label.snp.makeConstraints { make in
    make.width.lessThanOrEqualTo(300).priority(.high)
    make.width.equalTo(200).priority(.low)
}

// ОБНОВЛЕНИЕ CONSTRAINTS
view.snp.updateConstraints { make in
    make.height.equalTo(200)  // Обновить только height
}

// ПЕРЕСОЗДАНИЕ ВСЕХ CONSTRAINTS
view.snp.remakeConstraints { make in
    make.edges.equalToSuperview()
}
```

### Пример: Экран входа с SnapKit

```swift
import UIKit
import SnapKit

class LoginViewController: UIViewController {

    // MARK: - UI Elements

    private let logoImageView: UIImageView = {
        let iv = UIImageView()
        iv.image = UIImage(systemName: "cart.fill")
        iv.tintColor = .systemBlue
        iv.contentMode = .scaleAspectFit
        return iv
    }()

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "Добро пожаловать"
        label.font = .systemFont(ofSize: 28, weight: .bold)
        label.textAlignment = .center
        return label
    }()

    private let emailTextField: UITextField = {
        let tf = UITextField()
        tf.placeholder = "Email"
        tf.borderStyle = .roundedRect
        tf.keyboardType = .emailAddress
        tf.autocapitalizationType = .none
        return tf
    }()

    private let passwordTextField: UITextField = {
        let tf = UITextField()
        tf.placeholder = "Пароль"
        tf.borderStyle = .roundedRect
        tf.isSecureTextEntry = true
        return tf
    }()

    private let loginButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Войти", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .systemBlue
        button.layer.cornerRadius = 8
        button.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        return button
    }()

    private let signUpButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Создать аккаунт", for: .normal)
        return button
    }()

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupConstraints()
        setupActions()
    }

    // MARK: - Setup

    private func setupUI() {
        view.backgroundColor = .systemBackground

        view.addSubview(logoImageView)
        view.addSubview(titleLabel)
        view.addSubview(emailTextField)
        view.addSubview(passwordTextField)
        view.addSubview(loginButton)
        view.addSubview(signUpButton)
    }

    private func setupConstraints() {
        logoImageView.snp.makeConstraints { make in
            make.top.equalTo(view.safeAreaLayoutGuide).offset(60)
            make.centerX.equalToSuperview()
            make.size.equalTo(100)
        }

        titleLabel.snp.makeConstraints { make in
            make.top.equalTo(logoImageView.snp.bottom).offset(20)
            make.leading.trailing.equalToSuperview().inset(20)
        }

        emailTextField.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(40)
            make.leading.trailing.equalToSuperview().inset(20)
            make.height.equalTo(50)
        }

        passwordTextField.snp.makeConstraints { make in
            make.top.equalTo(emailTextField.snp.bottom).offset(16)
            make.leading.trailing.equalToSuperview().inset(20)
            make.height.equalTo(50)
        }

        loginButton.snp.makeConstraints { make in
            make.top.equalTo(passwordTextField.snp.bottom).offset(30)
            make.leading.trailing.equalToSuperview().inset(20)
            make.height.equalTo(50)
        }

        signUpButton.snp.makeConstraints { make in
            make.top.equalTo(loginButton.snp.bottom).offset(16)
            make.centerX.equalToSuperview()
        }
    }

    private func setupActions() {
        loginButton.addTarget(self, action: #selector(loginTapped), for: .touchUpInside)
        signUpButton.addTarget(self, action: #selector(signUpTapped), for: .touchUpInside)
    }

    // MARK: - Actions

    @objc private func loginTapped() {
        guard let email = emailTextField.text, !email.isEmpty,
              let password = passwordTextField.text, !password.isEmpty else {
            showAlert(message: "Заполните все поля")
            return
        }

        // Авторизация...
    }

    @objc private func signUpTapped() {
        // Переход на регистрацию
    }

    private func showAlert(message: String) {
        let alert = UIAlertController(
            title: "Ошибка",
            message: message,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
```

---

## 11.10 UITableView и UICollectionView — подробно

### UITableView — вертикальный список

```swift
class ProductsTableViewController: UIViewController {

    private let tableView = UITableView()
    private var products: [Product] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        setupTableView()
    }

    private func setupTableView() {
        // Настройка
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(ProductCell.self, forCellReuseIdentifier: ProductCell.identifier)

        // Стиль
        tableView.separatorStyle = .singleLine
        tableView.separatorInset = UIEdgeInsets(top: 0, left: 16, bottom: 0, right: 16)
        tableView.rowHeight = UITableView.automaticDimension
        tableView.estimatedRowHeight = 100

        // Layout
        view.addSubview(tableView)
        tableView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }
}

// MARK: - UITableViewDataSource

extension ProductsTableViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return products.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(
            withIdentifier: ProductCell.identifier,
            for: indexPath
        ) as! ProductCell

        cell.configure(with: products[indexPath.row])
        return cell
    }
}

// MARK: - UITableViewDelegate

extension ProductsTableViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)

        let product = products[indexPath.row]
        let detailVC = ProductDetailViewController(product: product)
        navigationController?.pushViewController(detailVC, animated: true)
    }

    // Swipe actions
    func tableView(_ tableView: UITableView, trailingSwipeActionsConfigurationForRowAt indexPath: IndexPath) -> UISwipeActionsConfiguration? {
        let deleteAction = UIContextualAction(style: .destructive, title: "Удалить") { [weak self] _, _, completion in
            self?.deleteProduct(at: indexPath)
            completion(true)
        }

        return UISwipeActionsConfiguration(actions: [deleteAction])
    }
}
```

### UICollectionView — сетка

```swift
class ProductsCollectionViewController: UIViewController {

    private var collectionView: UICollectionView!
    private var products: [Product] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCollectionView()
    }

    private func setupCollectionView() {
        // Layout
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .vertical

        // Размер ячейки (2 колонки)
        let width = (view.bounds.width - 48) / 2  // 16 + 16 + 16 отступы
        layout.itemSize = CGSize(width: width, height: width * 1.4)

        // Отступы
        layout.minimumInteritemSpacing = 16
        layout.minimumLineSpacing = 16
        layout.sectionInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)

        // Создание
        collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(ProductGridCell.self, forCellWithReuseIdentifier: ProductGridCell.identifier)
        collectionView.backgroundColor = .systemBackground

        view.addSubview(collectionView)
        collectionView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }
}

// MARK: - UICollectionViewDataSource

extension ProductsCollectionViewController: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return products.count
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: ProductGridCell.identifier,
            for: indexPath
        ) as! ProductGridCell

        cell.configure(with: products[indexPath.item])
        return cell
    }
}

// MARK: - UICollectionViewDelegate

extension ProductsCollectionViewController: UICollectionViewDelegate {
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        let product = products[indexPath.item]
        let detailVC = ProductDetailViewController(product: product)
        navigationController?.pushViewController(detailVC, animated: true)
    }
}
```

---

## 11.11 Упражнения

### Упражнение 11.1: Карточка товара

Создайте кастомный `ProductCardView` с:
- Изображением товара
- Названием
- Ценой
- Кнопкой "В корзину"

<details>
<summary>Показать решение</summary>

```swift
import UIKit
import SnapKit

class ProductCardView: UIView {

    // MARK: - UI Elements

    private let imageView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode = .scaleAspectFit
        iv.backgroundColor = .systemGray6
        iv.layer.cornerRadius = 8
        iv.clipsToBounds = true
        return iv
    }()

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 14, weight: .medium)
        label.numberOfLines = 2
        return label
    }()

    private let priceLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 16, weight: .bold)
        label.textColor = .systemBlue
        return label
    }()

    private let addButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("В корзину", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .systemBlue
        button.layer.cornerRadius = 8
        button.titleLabel?.font = .systemFont(ofSize: 14, weight: .semibold)
        return button
    }()

    var onAddToCart: (() -> Void)?

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
        backgroundColor = .systemBackground
        layer.cornerRadius = 12
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOpacity = 0.1
        layer.shadowRadius = 8
        layer.shadowOffset = CGSize(width: 0, height: 2)

        addSubview(imageView)
        addSubview(titleLabel)
        addSubview(priceLabel)
        addSubview(addButton)

        imageView.snp.makeConstraints { make in
            make.top.leading.trailing.equalToSuperview().inset(12)
            make.height.equalTo(120)
        }

        titleLabel.snp.makeConstraints { make in
            make.top.equalTo(imageView.snp.bottom).offset(8)
            make.leading.trailing.equalToSuperview().inset(12)
        }

        priceLabel.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(4)
            make.leading.equalToSuperview().inset(12)
        }

        addButton.snp.makeConstraints { make in
            make.top.equalTo(priceLabel.snp.bottom).offset(12)
            make.leading.trailing.bottom.equalToSuperview().inset(12)
            make.height.equalTo(36)
        }

        addButton.addTarget(self, action: #selector(addButtonTapped), for: .touchUpInside)
    }

    // MARK: - Actions

    @objc private func addButtonTapped() {
        onAddToCart?()
    }

    // MARK: - Configure

    func configure(title: String, price: Double, imageURL: String?) {
        titleLabel.text = title
        priceLabel.text = String(format: "$%.2f", price)

        if let url = imageURL, let imageUrl = URL(string: url) {
            // Используйте SDWebImage для загрузки
            // imageView.sd_setImage(with: imageUrl)
        }
    }
}
```
</details>

### Упражнение 11.2: Экран профиля

Создайте `ProfileViewController` с:
- Аватаром пользователя
- Именем и email
- Кнопками: "Мои заказы", "Настройки", "Выход"

<details>
<summary>Показать решение</summary>

```swift
import UIKit
import SnapKit

class ProfileViewController: UIViewController {

    // MARK: - UI Elements

    private let avatarImageView: UIImageView = {
        let iv = UIImageView()
        iv.image = UIImage(systemName: "person.circle.fill")
        iv.tintColor = .systemGray
        iv.contentMode = .scaleAspectFit
        iv.layer.cornerRadius = 50
        iv.clipsToBounds = true
        return iv
    }()

    private let nameLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 24, weight: .bold)
        label.textAlignment = .center
        return label
    }()

    private let emailLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 16)
        label.textColor = .secondaryLabel
        label.textAlignment = .center
        return label
    }()

    private let ordersButton = ProfileMenuItem(title: "Мои заказы", icon: "bag")
    private let settingsButton = ProfileMenuItem(title: "Настройки", icon: "gearshape")
    private let logoutButton = ProfileMenuItem(title: "Выход", icon: "arrow.right.square", isDestructive: true)

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        configureUser()
    }

    // MARK: - Setup

    private func setupUI() {
        title = "Профиль"
        view.backgroundColor = .systemBackground

        let stackView = UIStackView(arrangedSubviews: [ordersButton, settingsButton, logoutButton])
        stackView.axis = .vertical
        stackView.spacing = 1
        stackView.backgroundColor = .separator

        view.addSubview(avatarImageView)
        view.addSubview(nameLabel)
        view.addSubview(emailLabel)
        view.addSubview(stackView)

        avatarImageView.snp.makeConstraints { make in
            make.top.equalTo(view.safeAreaLayoutGuide).offset(30)
            make.centerX.equalToSuperview()
            make.size.equalTo(100)
        }

        nameLabel.snp.makeConstraints { make in
            make.top.equalTo(avatarImageView.snp.bottom).offset(16)
            make.leading.trailing.equalToSuperview().inset(20)
        }

        emailLabel.snp.makeConstraints { make in
            make.top.equalTo(nameLabel.snp.bottom).offset(4)
            make.leading.trailing.equalToSuperview().inset(20)
        }

        stackView.snp.makeConstraints { make in
            make.top.equalTo(emailLabel.snp.bottom).offset(40)
            make.leading.trailing.equalToSuperview()
        }

        // Actions
        ordersButton.onTap = { [weak self] in self?.showOrders() }
        settingsButton.onTap = { [weak self] in self?.showSettings() }
        logoutButton.onTap = { [weak self] in self?.logout() }
    }

    private func configureUser() {
        nameLabel.text = "Иван Иванов"
        emailLabel.text = "ivan@example.com"
    }

    // MARK: - Actions

    private func showOrders() {
        // navigationController?.pushViewController(OrdersVC(), animated: true)
    }

    private func showSettings() {
        // navigationController?.pushViewController(SettingsVC(), animated: true)
    }

    private func logout() {
        let alert = UIAlertController(
            title: "Выход",
            message: "Вы уверены, что хотите выйти?",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Отмена", style: .cancel))
        alert.addAction(UIAlertAction(title: "Выйти", style: .destructive) { _ in
            // AuthManager.shared.signOut()
        })
        present(alert, animated: true)
    }
}

// MARK: - ProfileMenuItem

class ProfileMenuItem: UIView {
    var onTap: (() -> Void)?

    init(title: String, icon: String, isDestructive: Bool = false) {
        super.init(frame: .zero)

        backgroundColor = .systemBackground

        let iconView = UIImageView(image: UIImage(systemName: icon))
        iconView.tintColor = isDestructive ? .systemRed : .label

        let label = UILabel()
        label.text = title
        label.textColor = isDestructive ? .systemRed : .label

        let chevron = UIImageView(image: UIImage(systemName: "chevron.right"))
        chevron.tintColor = .tertiaryLabel

        addSubview(iconView)
        addSubview(label)
        addSubview(chevron)

        iconView.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(20)
            make.centerY.equalToSuperview()
            make.size.equalTo(24)
        }

        label.snp.makeConstraints { make in
            make.leading.equalTo(iconView.snp.trailing).offset(16)
            make.centerY.equalToSuperview()
        }

        chevron.snp.makeConstraints { make in
            make.trailing.equalToSuperview().offset(-20)
            make.centerY.equalToSuperview()
        }

        self.snp.makeConstraints { make in
            make.height.equalTo(56)
        }

        let tap = UITapGestureRecognizer(target: self, action: #selector(tapped))
        addGestureRecognizer(tap)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    @objc private func tapped() {
        onTap?()
    }
}
```
</details>

---

## Итоги главы

В этой главе вы **глубоко** изучили:

✅ **Полную иерархию классов UIKit** — от NSObject до UICollectionView

✅ **Когда какой класс использовать** — таблица выбора для любой задачи

✅ **Почему наследуемся от UIViewController, UIView, UITableViewCell** — что они предоставляют

✅ **UIView** — все свойства и настройки базового элемента

✅ **Жизненный цикл UIViewController** — все методы и когда их использовать

✅ **Основные UI компоненты** — Label, Button, TextField, ImageView, StackView

✅ **Auto Layout** — anchors, constraints, приоритеты

✅ **SnapKit** — удобная вёрстка constraints

✅ **UITableView и UICollectionView** — списки и сетки

---

## Следующая глава

В [Главе 12](../12-UIKit-Advanced/README.md) мы изучим продвинутые техники UIKit: сложные layouts, анимации, жесты и кастомные переходы.

---

> **Совет**: Запомните правило: **для каждого экрана — UIViewController**, **для каждого кастомного UI — UIView**, **для ячеек — Cell классы**. Всегда наследуйтесь от правильного базового класса!
