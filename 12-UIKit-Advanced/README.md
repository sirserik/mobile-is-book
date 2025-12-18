# Глава 12: Продвинутый UIKit

## Введение

В этой главе мы изучим компоненты, которые используются в большинстве приложений: списки (TableView), сетки (CollectionView), навигацию и работу с изображениями.

---

## 12.1 UITableView — списки

TableView — один из самых используемых компонентов для отображения списков.

### Базовая настройка

```swift
class ProductListViewController: UIViewController {

    private let tableView = UITableView()
    private var products: [Product] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        setupTableView()
        loadData()
    }

    private func setupTableView() {
        view.addSubview(tableView)
        tableView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }

        // Регистрация ячейки
        tableView.register(ProductCell.self, forCellReuseIdentifier: "ProductCell")

        // Делегат и источник данных
        tableView.delegate = self
        tableView.dataSource = self
    }

    private func loadData() {
        products = [
            Product(id: 1, name: "iPhone 15", price: 999),
            Product(id: 2, name: "MacBook Pro", price: 1999),
            Product(id: 3, name: "AirPods Pro", price: 249)
        ]
        tableView.reloadData()
    }
}

// MARK: - UITableViewDataSource
extension ProductListViewController: UITableViewDataSource {

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        products.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(
            withIdentifier: "ProductCell",
            for: indexPath
        ) as! ProductCell

        let product = products[indexPath.row]
        cell.configure(with: product)
        return cell
    }
}

// MARK: - UITableViewDelegate
extension ProductListViewController: UITableViewDelegate {

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        let product = products[indexPath.row]
        print("Выбран: \(product.name)")
    }

    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        80
    }
}
```

### Кастомная ячейка

```swift
class ProductCell: UITableViewCell {

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
        contentView.addSubview(productImageView)
        contentView.addSubview(titleLabel)
        contentView.addSubview(priceLabel)

        productImageView.contentMode = .scaleAspectFit
        productImageView.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(16)
            make.centerY.equalToSuperview()
            make.size.equalTo(60)
        }

        titleLabel.font = .systemFont(ofSize: 16, weight: .medium)
        titleLabel.snp.makeConstraints { make in
            make.top.equalToSuperview().offset(16)
            make.leading.equalTo(productImageView.snp.trailing).offset(12)
            make.trailing.equalToSuperview().offset(-16)
        }

        priceLabel.font = .systemFont(ofSize: 14)
        priceLabel.textColor = .systemBlue
        priceLabel.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(4)
            make.leading.equalTo(titleLabel)
        }
    }

    func configure(with product: Product) {
        titleLabel.text = product.name
        priceLabel.text = String(format: "$%.2f", product.price)
        productImageView.image = UIImage(systemName: "photo")
    }
}
```

### Swipe Actions

```swift
extension ProductListViewController {

    func tableView(
        _ tableView: UITableView,
        trailingSwipeActionsConfigurationForRowAt indexPath: IndexPath
    ) -> UISwipeActionsConfiguration? {

        // Удалить
        let deleteAction = UIContextualAction(style: .destructive, title: "Удалить") { [weak self] _, _, completion in
            self?.products.remove(at: indexPath.row)
            tableView.deleteRows(at: [indexPath], with: .automatic)
            completion(true)
        }

        // В избранное
        let favoriteAction = UIContextualAction(style: .normal, title: "В избранное") { _, _, completion in
            print("Добавлено в избранное")
            completion(true)
        }
        favoriteAction.backgroundColor = .systemYellow

        return UISwipeActionsConfiguration(actions: [deleteAction, favoriteAction])
    }
}
```

---

## 12.2 UICollectionView — сетки

CollectionView — для отображения элементов в сетке.

### Базовая настройка

```swift
class ProductGridViewController: UIViewController {

    private var collectionView: UICollectionView!
    private var products: [Product] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCollectionView()
        loadData()
    }

    private func setupCollectionView() {
        // Layout
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .vertical
        layout.minimumLineSpacing = 16
        layout.minimumInteritemSpacing = 16
        layout.sectionInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)

        // Размер ячейки
        let width = (view.bounds.width - 48) / 2  // 2 колонки
        layout.itemSize = CGSize(width: width, height: width * 1.4)

        collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.backgroundColor = .systemBackground
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(ProductCollectionCell.self, forCellWithReuseIdentifier: "ProductCell")

        view.addSubview(collectionView)
        collectionView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }
}

// MARK: - UICollectionViewDataSource
extension ProductGridViewController: UICollectionViewDataSource {

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        products.count
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: "ProductCell",
            for: indexPath
        ) as! ProductCollectionCell

        let product = products[indexPath.item]
        cell.configure(with: product)
        return cell
    }
}

// MARK: - UICollectionViewDelegate
extension ProductGridViewController: UICollectionViewDelegate {

    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        let product = products[indexPath.item]
        print("Выбран: \(product.name)")
    }
}
```

### Ячейка CollectionView

```swift
class ProductCollectionCell: UICollectionViewCell {

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
        contentView.backgroundColor = .systemBackground
        contentView.layer.cornerRadius = 12
        contentView.layer.shadowColor = UIColor.black.cgColor
        contentView.layer.shadowOpacity = 0.1
        contentView.layer.shadowRadius = 8

        contentView.addSubview(imageView)
        contentView.addSubview(titleLabel)
        contentView.addSubview(priceLabel)

        imageView.contentMode = .scaleAspectFit
        imageView.snp.makeConstraints { make in
            make.top.leading.trailing.equalToSuperview().inset(12)
            make.height.equalTo(100)
        }

        titleLabel.font = .systemFont(ofSize: 14, weight: .medium)
        titleLabel.numberOfLines = 2
        titleLabel.snp.makeConstraints { make in
            make.top.equalTo(imageView.snp.bottom).offset(8)
            make.leading.trailing.equalToSuperview().inset(12)
        }

        priceLabel.font = .systemFont(ofSize: 16, weight: .bold)
        priceLabel.textColor = .systemBlue
        priceLabel.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(4)
            make.leading.equalToSuperview().inset(12)
        }
    }

    func configure(with product: Product) {
        titleLabel.text = product.name
        priceLabel.text = String(format: "$%.2f", product.price)
        imageView.image = UIImage(systemName: "photo")
    }
}
```

---

## 12.3 UINavigationController — навигация

### Базовая настройка

```swift
// В SceneDelegate
func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene else { return }

    let window = UIWindow(windowScene: windowScene)
    let rootVC = HomeViewController()
    let navController = UINavigationController(rootViewController: rootVC)

    window.rootViewController = navController
    window.makeKeyAndVisible()
    self.window = window
}
```

### Переходы между экранами

```swift
class HomeViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Главная"
        navigationController?.navigationBar.prefersLargeTitles = true
    }

    func showProductDetails(_ product: Product) {
        let detailVC = ProductDetailViewController(product: product)
        navigationController?.pushViewController(detailVC, animated: true)
    }

    func showSettings() {
        let settingsVC = SettingsViewController()
        // Модальное представление
        present(settingsVC, animated: true)
    }
}
```

### Настройка Navigation Bar

```swift
class ProductDetailViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        title = "Товар"

        // Кнопки в navigation bar
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            image: UIImage(systemName: "heart"),
            style: .plain,
            target: self,
            action: #selector(favoriteTapped)
        )

        // Несколько кнопок
        let shareButton = UIBarButtonItem(
            image: UIImage(systemName: "square.and.arrow.up"),
            style: .plain,
            target: self,
            action: #selector(shareTapped)
        )
        let cartButton = UIBarButtonItem(
            image: UIImage(systemName: "cart"),
            style: .plain,
            target: self,
            action: #selector(cartTapped)
        )
        navigationItem.rightBarButtonItems = [cartButton, shareButton]
    }

    @objc private func favoriteTapped() { }
    @objc private func shareTapped() { }
    @objc private func cartTapped() { }
}
```

---

## 12.4 UITabBarController — вкладки

### Создание Tab Bar

```swift
// В SceneDelegate
func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene else { return }

    let window = UIWindow(windowScene: windowScene)

    let tabBarController = UITabBarController()

    // Вкладка "Главная"
    let homeVC = HomeViewController()
    let homeNav = UINavigationController(rootViewController: homeVC)
    homeNav.tabBarItem = UITabBarItem(
        title: "Главная",
        image: UIImage(systemName: "house"),
        selectedImage: UIImage(systemName: "house.fill")
    )

    // Вкладка "Каталог"
    let catalogVC = CatalogViewController()
    let catalogNav = UINavigationController(rootViewController: catalogVC)
    catalogNav.tabBarItem = UITabBarItem(
        title: "Каталог",
        image: UIImage(systemName: "square.grid.2x2"),
        selectedImage: UIImage(systemName: "square.grid.2x2.fill")
    )

    // Вкладка "Корзина"
    let cartVC = CartViewController()
    let cartNav = UINavigationController(rootViewController: cartVC)
    cartNav.tabBarItem = UITabBarItem(
        title: "Корзина",
        image: UIImage(systemName: "cart"),
        selectedImage: UIImage(systemName: "cart.fill")
    )
    cartNav.tabBarItem.badgeValue = "3"  // Бейдж

    // Вкладка "Профиль"
    let profileVC = ProfileViewController()
    let profileNav = UINavigationController(rootViewController: profileVC)
    profileNav.tabBarItem = UITabBarItem(
        title: "Профиль",
        image: UIImage(systemName: "person"),
        selectedImage: UIImage(systemName: "person.fill")
    )

    tabBarController.viewControllers = [homeNav, catalogNav, cartNav, profileNav]

    window.rootViewController = tabBarController
    window.makeKeyAndVisible()
    self.window = window
}
```

---

## 12.5 UIScrollView

```swift
class ScrollViewController: UIViewController {

    private let scrollView = UIScrollView()
    private let contentView = UIView()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupScrollView()
    }

    private func setupScrollView() {
        view.addSubview(scrollView)
        scrollView.addSubview(contentView)

        scrollView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }

        contentView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
            make.width.equalTo(scrollView)  // Только вертикальный скролл
        }

        // Добавляем контент
        let labels = (1...20).map { i -> UILabel in
            let label = UILabel()
            label.text = "Элемент \(i)"
            label.font = .systemFont(ofSize: 18)
            contentView.addSubview(label)
            return label
        }

        // Располагаем вертикально
        var previousLabel: UILabel?
        for label in labels {
            label.snp.makeConstraints { make in
                make.leading.trailing.equalToSuperview().inset(20)
                if let previous = previousLabel {
                    make.top.equalTo(previous.snp.bottom).offset(20)
                } else {
                    make.top.equalToSuperview().offset(20)
                }
            }
            previousLabel = label
        }

        // Последний элемент определяет высоту contentView
        previousLabel?.snp.makeConstraints { make in
            make.bottom.equalToSuperview().offset(-20)
        }
    }
}
```

---

## 12.6 Работа с изображениями и SDWebImage

### Установка SDWebImage (SPM)

```swift
// File → Add Packages
// URL: https://github.com/SDWebImage/SDWebImage
```

### Использование

```swift
import SDWebImage

class ProductImageCell: UICollectionViewCell {

    private let imageView = UIImageView()

    func configure(with imageURL: String) {
        // Загрузка с кэшированием
        imageView.sd_setImage(
            with: URL(string: imageURL),
            placeholderImage: UIImage(systemName: "photo")
        )

        // С completion
        imageView.sd_setImage(with: URL(string: imageURL)) { [weak self] image, error, _, _ in
            if let error = error {
                print("Ошибка: \(error)")
            }
        }

        // С индикатором загрузки
        imageView.sd_imageIndicator = SDWebImageActivityIndicator.gray
        imageView.sd_setImage(with: URL(string: imageURL))
    }
}
```

---

## 12.7 UIAlertController — диалоги

### Alert (окно)

```swift
func showAlert() {
    let alert = UIAlertController(
        title: "Удалить?",
        message: "Вы уверены, что хотите удалить этот товар?",
        preferredStyle: .alert
    )

    alert.addAction(UIAlertAction(title: "Отмена", style: .cancel))
    alert.addAction(UIAlertAction(title: "Удалить", style: .destructive) { _ in
        print("Удалено")
    })

    present(alert, animated: true)
}
```

### ActionSheet (снизу)

```swift
func showActionSheet() {
    let sheet = UIAlertController(
        title: "Поделиться",
        message: nil,
        preferredStyle: .actionSheet
    )

    sheet.addAction(UIAlertAction(title: "Копировать ссылку", style: .default) { _ in
        print("Скопировано")
    })

    sheet.addAction(UIAlertAction(title: "Поделиться в соцсетях", style: .default) { _ in
        print("Поделиться")
    })

    sheet.addAction(UIAlertAction(title: "Отмена", style: .cancel))

    present(sheet, animated: true)
}
```

### Alert с текстовым полем

```swift
func showInputAlert() {
    let alert = UIAlertController(
        title: "Введите промокод",
        message: nil,
        preferredStyle: .alert
    )

    alert.addTextField { textField in
        textField.placeholder = "Промокод"
    }

    alert.addAction(UIAlertAction(title: "Отмена", style: .cancel))
    alert.addAction(UIAlertAction(title: "Применить", style: .default) { _ in
        if let code = alert.textFields?.first?.text {
            print("Промокод: \(code)")
        }
    })

    present(alert, animated: true)
}
```

---

## 12.8 Простые анимации

```swift
// Изменение свойств с анимацией
UIView.animate(withDuration: 0.3) {
    self.view.alpha = 0
}

// С completion
UIView.animate(withDuration: 0.3, animations: {
    self.button.transform = CGAffineTransform(scaleX: 1.2, y: 1.2)
}) { _ in
    UIView.animate(withDuration: 0.3) {
        self.button.transform = .identity
    }
}

// Spring анимация
UIView.animate(
    withDuration: 0.5,
    delay: 0,
    usingSpringWithDamping: 0.5,
    initialSpringVelocity: 0.5,
    options: [],
    animations: {
        self.view.transform = CGAffineTransform(translationX: 0, y: -100)
    }
)

// Анимация constraints
UIView.animate(withDuration: 0.3) {
    self.heightConstraint.constant = 200
    self.view.layoutIfNeeded()
}
```

---

## 12.9 Практический пример: Каталог товаров

```swift
class CatalogViewController: UIViewController {

    // MARK: - Properties
    private var collectionView: UICollectionView!
    private var products: [Product] = []
    private let refreshControl = UIRefreshControl()

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        loadProducts()
    }

    // MARK: - Setup
    private func setupUI() {
        title = "Каталог"
        navigationController?.navigationBar.prefersLargeTitles = true
        view.backgroundColor = .systemBackground

        setupCollectionView()
        setupRefreshControl()
        setupSearchBar()
    }

    private func setupCollectionView() {
        let layout = createLayout()
        collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.backgroundColor = .clear
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(ProductCollectionCell.self, forCellWithReuseIdentifier: "ProductCell")

        view.addSubview(collectionView)
        collectionView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }

    private func createLayout() -> UICollectionViewFlowLayout {
        let layout = UICollectionViewFlowLayout()
        let width = (view.bounds.width - 48) / 2
        layout.itemSize = CGSize(width: width, height: width * 1.5)
        layout.minimumLineSpacing = 16
        layout.minimumInteritemSpacing = 16
        layout.sectionInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        return layout
    }

    private func setupRefreshControl() {
        refreshControl.addTarget(self, action: #selector(refresh), for: .valueChanged)
        collectionView.refreshControl = refreshControl
    }

    private func setupSearchBar() {
        let searchController = UISearchController(searchResultsController: nil)
        searchController.searchResultsUpdater = self
        searchController.obscuresBackgroundDuringPresentation = false
        searchController.searchBar.placeholder = "Поиск товаров"
        navigationItem.searchController = searchController
    }

    // MARK: - Data
    private func loadProducts() {
        // Имитация загрузки
        products = [
            Product(id: 1, name: "iPhone 15 Pro", price: 999),
            Product(id: 2, name: "MacBook Air M3", price: 1299),
            Product(id: 3, name: "iPad Pro 12.9", price: 1099),
            Product(id: 4, name: "Apple Watch Ultra", price: 799),
            Product(id: 5, name: "AirPods Pro 2", price: 249),
            Product(id: 6, name: "HomePod mini", price: 99)
        ]
        collectionView.reloadData()
    }

    @objc private func refresh() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.loadProducts()
            self.refreshControl.endRefreshing()
        }
    }
}

// MARK: - UICollectionViewDataSource
extension CatalogViewController: UICollectionViewDataSource {

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        products.count
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "ProductCell", for: indexPath) as! ProductCollectionCell
        cell.configure(with: products[indexPath.item])
        return cell
    }
}

// MARK: - UICollectionViewDelegate
extension CatalogViewController: UICollectionViewDelegate {

    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        let product = products[indexPath.item]
        let detailVC = ProductDetailViewController(product: product)
        navigationController?.pushViewController(detailVC, animated: true)
    }
}

// MARK: - UISearchResultsUpdating
extension CatalogViewController: UISearchResultsUpdating {

    func updateSearchResults(for searchController: UISearchController) {
        guard let query = searchController.searchBar.text, !query.isEmpty else {
            loadProducts()
            return
        }

        products = products.filter { $0.name.lowercased().contains(query.lowercased()) }
        collectionView.reloadData()
    }
}
```

---

## 12.10 Упражнения

### Упражнение 12.1: Экран корзины

Создайте экран корзины с TableView:
- Ячейки с товарами (изображение, название, цена, количество)
- Кнопки +/- для изменения количества
- Итоговая сумма внизу

### Упражнение 12.2: Детальный экран товара

Создайте экран товара с:
- Изображением (в ScrollView)
- Названием и ценой
- Описанием
- Кнопкой "Добавить в корзину"
- Кнопкой "В избранное" в navigation bar

---

## Итоги главы

В этой главе вы узнали:

✅ UITableView для отображения списков

✅ UICollectionView для сеток

✅ UINavigationController для навигации

✅ UITabBarController для вкладок

✅ UIScrollView для прокручиваемого контента

✅ SDWebImage для загрузки изображений

✅ UIAlertController для диалогов

✅ Базовые анимации

---

## Следующая глава

В [Главе 13](../13-VIPER/README.md) мы изучим архитектуру VIPER — профессиональный подход к организации кода.
