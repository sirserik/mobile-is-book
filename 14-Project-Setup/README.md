# Глава 14: Настройка проекта

## Введение

В этой главе мы создадим полную инфраструктуру приложения интернет-магазина. Вы научитесь:
- Правильно структурировать iOS проект
- Настраивать менеджеры для работы с данными
- Создавать сетевой слой с протоколами
- Обрабатывать ошибки типизированно
- Интегрировать Firebase и другие зависимости

> **Аналогия с веб-разработкой:** Это как настройка webpack, создание папок `src/`, `components/`, `services/` и установка npm пакетов в JavaScript проекте.

---

## 14.1 Создание проекта в Xcode

### Шаг 1: Новый проект

1. Откройте Xcode
2. **File → New → Project**
3. Выберите **iOS → App**
4. Заполните поля:

```
Product Name:           ECommerce
Team:                   Ваш Apple ID
Organization Identifier: com.yourname
Interface:              Storyboard
Language:               Swift
```

5. **Снимите галочки** с Use Core Data и Include Tests (добавим позже)
6. Сохраните проект

### Шаг 2: Удаление Storyboard (опционально)

Мы будем использовать **программную вёрстку** — это даёт больше контроля и упрощает работу в команде.

1. Удалите `Main.storyboard`
2. В `Info.plist` удалите ключ `Main storyboard file base name`
3. В **Project → Targets → Info** удалите `Storyboard Name` из `Application Scene Manifest`

---

## 14.2 Полная структура проекта

Создайте следующую структуру папок (**правый клик → New Group**):

```
ECommerce/
│
├── Core/                           # Жизненный цикл приложения
│   ├── AppDelegate.swift
│   └── SceneDelegate.swift
│
├── Managers/                       # Бизнес-логика и менеджеры данных
│   ├── AuthManager/
│   │   └── AuthManager.swift
│   ├── BasketManager/
│   │   └── BasketManager.swift
│   ├── NetworkManager/
│   │   └── NetworkManager.swift
│   ├── StorageManager/
│   │   └── RealmManager.swift
│   ├── UserInfoManager/
│   │   └── UserInfoManager.swift
│   └── RootWindowManager/
│       └── RootWindowManager.swift
│
├── Entities/                       # Модели данных и типы ошибок
│   ├── Enums/
│   │   ├── HTTPMethods.swift
│   │   ├── NetworkError.swift
│   │   ├── FirebaseError.swift
│   │   ├── RealmError.swift
│   │   └── GeneralError.swift
│   └── Models/
│       ├── ResponseModels/
│       │   ├── ProductModel.swift
│       │   └── CountryModel.swift
│       └── StorageModels/
│           ├── FavoriteProductModel.swift
│           ├── BasketModel.swift
│           ├── AddressModel.swift
│           └── CardModel.swift
│
├── Services/                       # API сервисы
│   ├── ProductsService/
│   │   ├── ProductsService.swift
│   │   └── ProductsEndpoint.swift
│   └── CountriesService/
│       ├── CountriesService.swift
│       └── CountriesEndpoint.swift
│
├── Modules/                        # VIPER модули (каждый экран)
│   ├── Onboarding/
│   ├── Login/
│   ├── SignUp/
│   ├── MainTabBar/
│   ├── Home/
│   ├── ProductDetail/
│   ├── Favorites/
│   ├── Basket/
│   ├── CompleteOrder/
│   ├── OrderHistory/
│   ├── Addresses/
│   ├── PaymentInfo/
│   └── Profile/
│
├── Utilities/                      # Вспомогательные инструменты
│   ├── Extensions/
│   │   ├── UIViewController+Extension.swift
│   │   ├── UIView+Extension.swift
│   │   ├── String+Extension.swift
│   │   └── UITabBarController+Extension.swift
│   ├── Helpers/
│   │   ├── UIScreenBounds.swift
│   │   └── SnappingLayout.swift
│   └── Protocols/
│       └── EndpointProtocol.swift
│
└── Resources/                      # Ресурсы
    ├── Assets.xcassets
    ├── LaunchScreen.storyboard
    └── GoogleService-Info.plist
```

> **Почему такая структура?**
> - **Managers** — переиспользуемая бизнес-логика (аналог сервисов в Angular/React)
> - **Entities** — модели данных (аналог TypeScript интерфейсов)
> - **Services** — работа с API (аналог fetch/axios в JS)
> - **Modules** — экраны по VIPER (аналог страниц/компонентов)
> - **Utilities** — хелперы и расширения

---

## 14.3 Подключение зависимостей (Swift Package Manager)

### Добавление пакетов

1. **File → Add Package Dependencies...**
2. Добавьте следующие пакеты:

| Пакет | URL | Версия | Назначение |
|-------|-----|--------|------------|
| SnapKit | `https://github.com/SnapKit/SnapKit` | 5.0.0+ | Auto Layout |
| Firebase | `https://github.com/firebase/firebase-ios-sdk` | 10.0.0+ | Auth, Firestore |
| GoogleSignIn | `https://github.com/google/GoogleSignIn-iOS` | 7.0.0+ | Google авторизация |
| Realm | `https://github.com/realm/realm-swift` | 10.0.0+ | Локальная БД |
| SDWebImage | `https://github.com/SDWebImage/SDWebImage` | 5.0.0+ | Загрузка изображений |
| IQKeyboardManager | `https://github.com/hackiftekhar/IQKeyboardManagerSwift` | 6.0.0+ | Управление клавиатурой |

### Выбор продуктов Firebase

При добавлении Firebase выберите:
- ✅ FirebaseAuth
- ✅ FirebaseFirestore
- ✅ FirebaseAnalytics (опционально)

---

## 14.4 HTTP методы и типы ошибок

### HTTPMethods.swift

```swift
// Entities/Enums/HTTPMethods.swift

import Foundation

/// HTTP методы для сетевых запросов
/// Аналог в JS: method в fetch({ method: 'GET' })
enum HTTPMethod: String {
    case get = "GET"       // Получение данных (аналог fetch без body)
    case post = "POST"     // Создание данных (аналог fetch с body)
    case put = "PUT"       // Полное обновление
    case patch = "PATCH"   // Частичное обновление
    case delete = "DELETE" // Удаление
}
```

**Объяснение:**
- `enum` с `String` raw value — значение можно получить через `.rawValue`
- Используется в URLRequest для указания типа запроса

### NetworkError.swift

```swift
// Entities/Enums/NetworkError.swift

import Foundation

/// Ошибки сетевого слоя
/// Каждый case описывает конкретную проблему
enum NetworkError: Error, LocalizedError {
    case invalidURL           // Неверный URL
    case invalidResponse      // Сервер вернул не HTTP ответ
    case invalidURLRequest    // Не удалось создать запрос
    case requestFailed        // Запрос не выполнен
    case noConnection         // Нет интернет-соединения
    case unauthorized         // 401 ошибка (не авторизован)

    /// Человекочитаемое описание ошибки
    /// Вызывается автоматически при error.localizedDescription
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Неверный адрес сервера"
        case .invalidResponse:
            return "Сервер вернул некорректный ответ"
        case .invalidURLRequest:
            return "Не удалось сформировать запрос"
        case .requestFailed:
            return "Запрос не выполнен"
        case .noConnection:
            return "Отсутствует подключение к интернету"
        case .unauthorized:
            return "Необходима авторизация"
        }
    }
}
```

**Объяснение:**
- `Error` — протокол Swift для типов ошибок (аналог `throw new Error()` в JS)
- `LocalizedError` — добавляет свойство `errorDescription` для UI
- `switch` должен быть exhaustive (покрывать все cases)

### FirebaseError.swift

```swift
// Entities/Enums/FirebaseError.swift

import Foundation

/// Ошибки при работе с Firebase
enum FirebaseError: Error, LocalizedError {
    case loginError              // Ошибка входа
    case signUpError             // Ошибка регистрации
    case sendEmailError          // Ошибка отправки email
    case signOutError            // Ошибка выхода
    case emailNotVerified        // Email не подтверждён
    case passwordResetError      // Ошибка сброса пароля
    case googleSignInFailed      // Google Sign-In не удался
    case addProductToBasket      // Не удалось добавить в корзину
    case getBasketItemsFailed    // Не удалось получить корзину
    case itemCouldNotBeRemoved   // Не удалось удалить товар
    case addOrderFailed          // Не удалось создать заказ

    var errorDescription: String? {
        switch self {
        case .loginError:
            return "Не удалось войти. Проверьте email и пароль"
        case .signUpError:
            return "Не удалось зарегистрироваться"
        case .sendEmailError:
            return "Не удалось отправить email"
        case .signOutError:
            return "Не удалось выйти из аккаунта"
        case .emailNotVerified:
            return "Пожалуйста, подтвердите email перед входом"
        case .passwordResetError:
            return "Не удалось сбросить пароль"
        case .googleSignInFailed:
            return "Не удалось войти через Google"
        case .addProductToBasket:
            return "Не удалось добавить товар в корзину"
        case .getBasketItemsFailed:
            return "Не удалось загрузить корзину"
        case .itemCouldNotBeRemoved:
            return "Не удалось удалить товар"
        case .addOrderFailed:
            return "Не удалось оформить заказ"
        }
    }
}
```

### RealmError.swift

```swift
// Entities/Enums/RealmError.swift

import Foundation

/// Ошибки локального хранилища Realm
enum RealmError: Error, LocalizedError {
    case addFailed      // Не удалось добавить объект
    case updateFailed   // Не удалось обновить
    case deleteFailed   // Не удалось удалить

    var errorDescription: String? {
        switch self {
        case .addFailed:
            return "Не удалось сохранить данные"
        case .updateFailed:
            return "Не удалось обновить данные"
        case .deleteFailed:
            return "Не удалось удалить данные"
        }
    }
}
```

### GeneralError.swift

```swift
// Entities/Enums/GeneralError.swift

import Foundation

/// Общие ошибки приложения (валидация, бизнес-логика)
enum GeneralError: Error, LocalizedError {
    case emailPasswordEmpty     // Пустые поля email/password
    case addressInfoMissing     // Не заполнен адрес
    case cardInfoMissing        // Не заполнены данные карты
    case emptyBasketError       // Корзина пуста
    case emptyAddressOrCard     // Не выбран адрес или карта

    var errorDescription: String? {
        switch self {
        case .emailPasswordEmpty:
            return "Введите email и пароль"
        case .addressInfoMissing:
            return "Заполните все поля адреса"
        case .cardInfoMissing:
            return "Заполните данные карты"
        case .emptyBasketError:
            return "Корзина пуста"
        case .emptyAddressOrCard:
            return "Выберите адрес доставки и способ оплаты"
        }
    }
}
```

---

## 14.5 Протокол Endpoint (Сетевой слой)

### EndpointProtocol.swift

```swift
// Utilities/Protocols/EndpointProtocol.swift

import Foundation

/// Протокол для описания API endpoint
/// Аналог в JS: конфигурация axios или описание route в Express
///
/// Каждый endpoint должен указать:
/// - baseURL: базовый адрес API
/// - path: путь к ресурсу
/// - httpMethod: GET, POST и т.д.
/// - headers: заголовки запроса
/// - parameters: параметры запроса
protocol EndpointProtocol {
    var baseURL: URL { get }
    var path: String { get }
    var httpMethod: HTTPMethod { get }
    var headers: [String: String]? { get }
    var parameters: [String: Any]? { get }
}

// MARK: - Реализация по умолчанию
extension EndpointProtocol {

    /// Создаёт URLRequest из endpoint
    /// Это как создание конфига для fetch() в JavaScript
    func urlRequest() throws -> URLRequest {
        // 1. Формируем полный URL: baseURL + path
        // Пример: "https://api.com" + "/products" = "https://api.com/products"
        let url = baseURL.appendingPathComponent(path)

        // 2. Создаём объект запроса
        var urlRequest = URLRequest(url: url)

        // 3. Устанавливаем HTTP метод
        urlRequest.httpMethod = httpMethod.rawValue

        // 4. Добавляем заголовки (если есть)
        // Аналог headers в fetch()
        if let headers = headers {
            headers.forEach { key, value in
                urlRequest.addValue(value, forHTTPHeaderField: key)
            }
        }

        // 5. Добавляем параметры
        if let parameters = parameters {
            switch httpMethod {
            case .get:
                // GET: параметры в URL (?key=value&key2=value2)
                // Аналог: fetch('/api?name=John&age=25')
                if var components = URLComponents(url: url, resolvingAgainstBaseURL: false) {
                    components.queryItems = parameters.map { key, value in
                        URLQueryItem(name: key, value: "\(value)")
                    }
                    urlRequest.url = components.url
                }

            case .post, .put, .delete, .patch:
                // POST/PUT/etc: параметры в body как JSON
                // Аналог: fetch('/api', { body: JSON.stringify(data) })
                urlRequest.httpBody = try? JSONSerialization.data(withJSONObject: parameters)
                urlRequest.addValue("application/json", forHTTPHeaderField: "Content-Type")
            }
        }

        return urlRequest
    }
}
```

**Детальное объяснение:**

1. **Протокол как контракт** — любой тип, реализующий `EndpointProtocol`, гарантирует наличие всех свойств

2. **Extension с реализацией по умолчанию** — `urlRequest()` работает "из коробки" для всех endpoint'ов

3. **Сравнение с JavaScript:**
```javascript
// JavaScript (fetch)
fetch('https://api.com/products?category=electronics', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer token' }
});

// Swift (EndpointProtocol)
enum ProductsEndpoint: EndpointProtocol {
    case getByCategory(String)

    var baseURL: URL { URL(string: "https://api.com")! }
    var path: String { "/products" }
    var httpMethod: HTTPMethod { .get }
    var parameters: [String: Any]? { ["category": "electronics"] }
}
```

---

## 14.6 NetworkManager

```swift
// Managers/NetworkManager/NetworkManager.swift

import Foundation
import SystemConfiguration

/// Менеджер сетевых запросов
/// Singleton — один экземпляр на всё приложение
/// Аналог axios instance в JavaScript
final class NetworkManager {

    // MARK: - Singleton
    /// Единственный экземпляр (паттерн Singleton)
    /// Аналог: const api = axios.create({ baseURL: '...' })
    static let shared = NetworkManager()

    // MARK: - Properties
    /// Декодер JSON (преобразует Data в Swift объекты)
    private let decoder = JSONDecoder()

    // MARK: - Init
    /// Private init запрещает создание других экземпляров
    private init() {}

    // MARK: - Reachability
    /// Проверка подключения к интернету
    /// Использует низкоуровневый API SystemConfiguration
    var isReachable: Bool {
        // Создаём объект для проверки доступности apple.com
        guard let reachability = SCNetworkReachabilityCreateWithName(nil, "www.apple.com") else {
            return false
        }

        var flags = SCNetworkReachabilityFlags()
        SCNetworkReachabilityGetFlags(reachability, &flags)

        // Проверяем флаги:
        // - reachable: сеть доступна
        // - connectionRequired: нужно установить соединение (WiFi выключен)
        let isReachable = flags.contains(.reachable)
        let needsConnection = flags.contains(.connectionRequired)

        return isReachable && !needsConnection
    }

    // MARK: - Generic Request
    /// Универсальный метод для выполнения запросов
    ///
    /// - Parameters:
    ///   - endpoint: Описание запроса (URL, метод, параметры)
    ///   - type: Тип данных для декодирования (например, [Product].self)
    /// - Returns: Декодированные данные или nil
    ///
    /// Пример использования:
    /// ```
    /// let products = try await networkManager.request(
    ///     ProductsEndpoint.all,
    ///     type: [ProductModel].self
    /// )
    /// ```
    func request<T: Codable>(_ endpoint: EndpointProtocol, type: T.Type) async throws -> T? {
        // 1. Проверяем интернет
        guard isReachable else {
            throw NetworkError.noConnection
        }

        // 2. Создаём URLRequest из endpoint
        let urlRequest = try endpoint.urlRequest()

        // 3. Выполняем запрос (async/await)
        // Аналог: const response = await fetch(url)
        let (data, response) = try await URLSession.shared.data(for: urlRequest)

        // 4. Проверяем HTTP статус
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        // 5. Обрабатываем статус код
        switch httpResponse.statusCode {
        case 200...299:
            // Успех — декодируем JSON в Swift объект
            // Аналог: const data = await response.json()
            let decodedData = try decoder.decode(T.self, from: data)
            return decodedData

        case 401:
            throw NetworkError.unauthorized

        default:
            throw NetworkError.invalidResponse
        }
    }
}
```

**Ключевые концепции:**

1. **Singleton** — глобальный доступ через `NetworkManager.shared`

2. **Generic `<T: Codable>`** — метод работает с любым типом, реализующим Codable:
```swift
// Один метод для разных типов данных:
let products: [ProductModel]? = try await manager.request(endpoint, type: [ProductModel].self)
let categories: [String]? = try await manager.request(endpoint, type: [String].self)
```

3. **async/await** — современный способ асинхронного кода (как в JS):
```swift
// Swift                              // JavaScript
let data = try await fetch()          // const data = await fetch()
```

---

## 14.7 RealmManager (Локальное хранилище)

```swift
// Managers/StorageManager/RealmManager.swift

import Foundation
import RealmSwift

/// Менеджер локальной базы данных Realm
/// Аналог localStorage/IndexedDB в браузере, но с полноценной БД
///
/// Realm — это:
/// - Быстрая мобильная база данных
/// - Хранит данные локально на устройстве
/// - Поддерживает сложные запросы
/// - Работает с объектами напрямую (не SQL)
final class RealmManager {

    // MARK: - Singleton
    static let shared = RealmManager()

    // MARK: - Properties
    /// Экземпляр базы данных
    /// try! — crash при ошибке (Realm должен всегда инициализироваться)
    private let realm = try! Realm()

    // MARK: - Init
    private init() {
        // Выводим путь к файлу БД (для отладки)
        print("📁 Realm path: \(realm.configuration.fileURL?.absoluteString ?? "unknown")")
    }

    // MARK: - CRUD Operations

    /// CREATE — Создание нового объекта
    /// Аналог: localStorage.setItem(key, JSON.stringify(object))
    ///
    /// - Parameters:
    ///   - object: Объект для сохранения (должен наследовать от Object)
    ///   - onError: Callback при ошибке
    func create<T: Object>(_ object: T, onError: (RealmError) -> Void) {
        do {
            // write — транзакция записи (атомарная операция)
            try realm.write {
                realm.add(object)
            }
        } catch {
            onError(.addFailed)
        }
    }

    /// READ — Получение всех объектов определённого типа
    /// Аналог: JSON.parse(localStorage.getItem(key))
    ///
    /// - Parameter object: Тип объектов для получения
    /// - Returns: Массив объектов
    ///
    /// Пример:
    /// ```
    /// let favorites = realmManager.getAll(FavoriteProductModel.self)
    /// ```
    func getAll<T: Object>(_ object: T.Type) -> [T] {
        // objects() возвращает Results<T> — lazy коллекцию
        // Array() — конвертируем в обычный массив
        let results = realm.objects(object)
        return Array(results)
    }

    /// UPDATE — Обновление существующего объекта
    ///
    /// - Parameters:
    ///   - object: Объект для обновления
    ///   - dictionary: Словарь с новыми значениями
    ///   - onError: Callback при ошибке
    ///
    /// Пример:
    /// ```
    /// realmManager.update(address, with: ["city": "Москва", "street": "Тверская"])
    /// ```
    func update<T: Object>(_ object: T, with dictionary: [String: Any?], onError: (RealmError) -> Void) {
        do {
            try realm.write {
                // setValuesForKeys — устанавливает значения по ключам
                // compactMapValues — убирает nil значения
                object.setValuesForKeys(dictionary.compactMapValues { $0 })
            }
        } catch {
            onError(.updateFailed)
        }
    }

    /// DELETE — Удаление объекта
    ///
    /// - Parameters:
    ///   - object: Объект для удаления
    ///   - onError: Callback при ошибке
    func delete<T: Object>(_ object: T, onError: (RealmError) -> Void) {
        do {
            try realm.write {
                realm.delete(object)
            }
        } catch {
            onError(.deleteFailed)
        }
    }

    /// DELETE ALL — Удаление всех объектов определённого типа
    func deleteAll<T: Object>(_ type: T.Type, onError: (RealmError) -> Void) {
        do {
            try realm.write {
                let objects = realm.objects(type)
                realm.delete(objects)
            }
        } catch {
            onError(.deleteFailed)
        }
    }

    /// FILTER — Получение объектов с фильтрацией
    ///
    /// - Parameters:
    ///   - type: Тип объектов
    ///   - predicate: Условие фильтрации (NSPredicate)
    /// - Returns: Отфильтрованные объекты
    ///
    /// Пример:
    /// ```
    /// // Получить избранное текущего пользователя
    /// let myFavorites = realmManager.filter(
    ///     FavoriteProductModel.self,
    ///     predicate: NSPredicate(format: "userId == %@", currentUserId)
    /// )
    /// ```
    func filter<T: Object>(_ type: T.Type, predicate: NSPredicate) -> [T] {
        let results = realm.objects(type).filter(predicate)
        return Array(results)
    }
}
```

**Сравнение с JavaScript:**

| Realm (Swift) | JavaScript |
|---------------|------------|
| `realm.add(object)` | `localStorage.setItem(key, JSON.stringify(obj))` |
| `realm.objects(Type.self)` | `JSON.parse(localStorage.getItem(key))` |
| `realm.delete(object)` | `localStorage.removeItem(key)` |
| `filter(predicate)` | `array.filter(item => ...)` |

---

## 14.8 UserInfoManager

```swift
// Managers/UserInfoManager/UserInfoManager.swift

import Foundation
import FirebaseAuth

/// Протокол для получения информации о пользователе
protocol UserInfoManagerProtocol {
    func getUserProfilePictureAndEmail(completion: @escaping (_ photo: String?, _ email: String?) -> Void)
    func getUserUid() -> String?
}

/// Менеджер информации о текущем пользователе
/// Получает данные из Firebase Auth
final class UserInfoManager: UserInfoManagerProtocol {

    /// Получение фото профиля и email текущего пользователя
    ///
    /// - Parameter completion: Callback с URL фото и email
    ///
    /// Firebase Auth хранит базовую информацию о пользователе:
    /// - uid: уникальный идентификатор
    /// - email: электронная почта
    /// - displayName: имя пользователя
    /// - photoURL: URL аватара (если вошёл через Google)
    func getUserProfilePictureAndEmail(completion: @escaping (_ photo: String?, _ email: String?) -> Void) {
        // Auth.auth().currentUser — текущий авторизованный пользователь
        // nil если пользователь не вошёл
        guard let currentUser = Auth.auth().currentUser else {
            completion(nil, nil)
            return
        }

        // photoURL — URL из Google профиля (если вошёл через Google)
        // absoluteString — преобразуем URL в String
        let photoURL = currentUser.photoURL?.absoluteString
        let email = currentUser.email

        completion(photoURL, email)
    }

    /// Получение UID текущего пользователя
    ///
    /// UID — уникальный идентификатор пользователя в Firebase
    /// Используется для фильтрации данных (корзина, избранное и т.д.)
    func getUserUid() -> String? {
        return Auth.auth().currentUser?.uid
    }
}
```

---

## 14.9 RootWindowManager

```swift
// Managers/RootWindowManager/RootWindowManager.swift

import UIKit

/// Протокол для управления корневым контроллером
protocol RootWindowManagerProtocol {
    func changeRootViewController(_ viewController: UIViewController, animated: Bool)
}

/// Менеджер управления корневым окном приложения
///
/// Используется для смены экранов на уровне всего приложения:
/// - После входа: Login → MainTabBar
/// - После выхода: MainTabBar → Login
///
/// Аналог в веб: window.location.href = '/dashboard'
final class RootWindowManager: RootWindowManagerProtocol {

    // MARK: - Singleton
    static let shared = RootWindowManager()

    // MARK: - Properties
    /// Ссылка на главное окно приложения
    /// Устанавливается в SceneDelegate
    var window: UIWindow?

    // MARK: - Init
    private init() {}

    // MARK: - Methods

    /// Смена корневого контроллера с анимацией
    ///
    /// - Parameters:
    ///   - viewController: Новый корневой контроллер
    ///   - animated: Использовать анимацию перехода
    ///
    /// Пример:
    /// ```
    /// // После успешного входа
    /// RootWindowManager.shared.changeRootViewController(
    ///     MainTabBarRouter.startTabBarModule(),
    ///     animated: true
    /// )
    /// ```
    func changeRootViewController(_ viewController: UIViewController, animated: Bool) {
        guard let window = window else { return }

        // Устанавливаем новый корневой контроллер
        window.rootViewController = viewController

        // Анимация перехода (fade)
        if animated {
            // UIView.transition — анимация смены содержимого view
            UIView.transition(
                with: window,
                duration: 0.3,
                options: .transitionCrossDissolve,  // Плавное появление
                animations: nil,
                completion: nil
            )
        }

        // Делаем окно активным
        window.makeKeyAndVisible()
    }
}
```

---

## 14.10 AppDelegate

```swift
// Core/AppDelegate.swift

import UIKit
import FirebaseCore
import GoogleSignIn
import IQKeyboardManagerSwift

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    // MARK: - Init
    /// Инициализатор — вызывается при создании AppDelegate
    /// Используем для ранней настройки UI
    override init() {
        super.init()

        // Настройка цвета Navigation Bar для всего приложения
        // Аналог: :root { --nav-color: black; } в CSS
        UINavigationBar.appearance().tintColor = .label  // .label = чёрный/белый в зависимости от темы
    }

    // MARK: - Application Lifecycle

    /// Вызывается после запуска приложения
    /// Аналог: document.addEventListener('DOMContentLoaded', ...)
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        // 1. Инициализация Firebase
        // Читает GoogleService-Info.plist и настраивает SDK
        FirebaseApp.configure()

        // 2. Настройка IQKeyboardManager
        // Автоматически поднимает контент при появлении клавиатуры
        IQKeyboardManager.shared.enable = true
        IQKeyboardManager.shared.resignOnTouchOutside = true  // Скрывать клавиатуру при тапе вне поля

        return true
    }

    // MARK: - URL Handling

    /// Обработка URL schemes (для Google Sign-In)
    /// Вызывается когда приложение открывается через custom URL
    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        // Передаём URL в Google Sign-In SDK для обработки callback
        return GIDSignIn.sharedInstance.handle(url)
    }

    // MARK: - UISceneSession Lifecycle

    /// Конфигурация новой сцены (для multi-window на iPad)
    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}
```

---

## 14.11 SceneDelegate

```swift
// Core/SceneDelegate.swift

import UIKit
import FirebaseAuth

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    // MARK: - Properties
    /// Главное окно приложения
    var window: UIWindow?

    // MARK: - Scene Lifecycle

    /// Вызывается при создании сцены (запуск приложения)
    /// Здесь определяем, какой экран показать первым
    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        // 1. Проверяем, что scene — это UIWindowScene
        guard let windowScene = (scene as? UIWindowScene) else { return }

        // 2. Создаём окно с размерами сцены
        window = UIWindow(frame: windowScene.coordinateSpace.bounds)
        window?.windowScene = windowScene

        // 3. Определяем корневой контроллер в зависимости от авторизации
        // Auth.auth().currentUser — текущий пользователь Firebase
        // nil = не авторизован, не nil = авторизован
        if Auth.auth().currentUser != nil {
            // Пользователь вошёл → показываем главный экран
            window?.rootViewController = MainTabBarRouter.startTabBarModule()
        } else {
            // Пользователь не вошёл → показываем онбординг/логин
            let onboardingVC = OnboardingRouter.startOnboarding()
            window?.rootViewController = UINavigationController(rootViewController: onboardingVC)
        }

        // 4. Делаем окно видимым
        window?.makeKeyAndVisible()

        // 5. Сохраняем ссылку на окно в RootWindowManager
        // Это позволит менять корневой контроллер из любого места
        RootWindowManager.shared.window = window
    }

    // MARK: - Scene State Changes

    /// Приложение уходит в background
    func sceneDidEnterBackground(_ scene: UIScene) {
        // Можно сохранить состояние или отменить операции
    }

    /// Приложение возвращается из background
    func sceneWillEnterForeground(_ scene: UIScene) {
        // Можно обновить данные
    }
}
```

**Диаграмма навигации:**

```
┌──────────────────────────────────────────────────────────┐
│                     SceneDelegate                         │
│                          │                                │
│              Auth.auth().currentUser                      │
│                    /          \                           │
│                  nil        not nil                       │
│                  /              \                         │
│         ┌───────▼───────┐  ┌────▼────────────────┐       │
│         │  Onboarding   │  │   MainTabBarVC      │       │
│         │      │        │  │   ┌──┬──┬──┬──┐     │       │
│         │      ▼        │  │   │🏠│❤️│🛒│👤│     │       │
│         │    Login      │  │   └──┴──┴──┴──┘     │       │
│         │      │        │  └────────────────────-┘       │
│         │      ▼        │                                 │
│         │   SignUp      │                                 │
│         └───────────────┘                                 │
└──────────────────────────────────────────────────────────┘
```

---

## 14.12 Расширения (Extensions)

### UIViewController+Extension.swift

```swift
// Utilities/Extensions/UIViewController+Extension.swift

import UIKit

extension UIViewController {

    /// Показ простого alert с сообщением
    /// Аналог: alert('Сообщение') в JavaScript
    ///
    /// - Parameters:
    ///   - title: Заголовок alert
    ///   - message: Текст сообщения
    func showAlert(title: String, message: String) {
        let alert = UIAlertController(
            title: title,
            message: message,
            preferredStyle: .alert
        )

        alert.addAction(UIAlertAction(title: "OK", style: .default))

        present(alert, animated: true)
    }

    /// Alert для сброса пароля с текстовым полем
    /// Возвращает введённый email через completion
    func passwordResetAlert(completion: @escaping (String) -> Void) {
        let alert = UIAlertController(
            title: "Сброс пароля",
            message: "Введите email для получения ссылки",
            preferredStyle: .alert
        )

        // Добавляем текстовое поле в alert
        alert.addTextField { textField in
            textField.placeholder = "Email"
            textField.keyboardType = .emailAddress
        }

        // Кнопка отправки
        let sendAction = UIAlertAction(title: "Отправить", style: .default) { _ in
            if let email = alert.textFields?.first?.text, !email.isEmpty {
                completion(email)
            }
        }

        // Кнопка отмены
        let cancelAction = UIAlertAction(title: "Отмена", style: .cancel)

        alert.addAction(sendAction)
        alert.addAction(cancelAction)

        present(alert, animated: true)
    }

    /// Sheet alert для подтверждения удаления
    /// Показывается снизу экрана (action sheet)
    func deleteAllSheetAlert(completion: @escaping () -> Void) {
        let alert = UIAlertController(
            title: "Удалить всё?",
            message: "Это действие нельзя отменить",
            preferredStyle: .actionSheet  // Снизу экрана
        )

        let deleteAction = UIAlertAction(title: "Удалить", style: .destructive) { _ in
            completion()
        }

        let cancelAction = UIAlertAction(title: "Отмена", style: .cancel)

        alert.addAction(deleteAction)
        alert.addAction(cancelAction)

        present(alert, animated: true)
    }
}
```

### UIView+Extension.swift

```swift
// Utilities/Extensions/UIView+Extension.swift

import UIKit

extension UIView {

    /// Добавление нескольких subviews одним вызовом
    /// Аналог: parent.append(child1, child2, child3) в JS
    func addSubviews(_ views: UIView...) {
        views.forEach { addSubview($0) }
    }

    /// Скругление углов
    func roundCorners(radius: CGFloat) {
        layer.cornerRadius = radius
        clipsToBounds = true
    }

    /// Добавление тени
    /// Аналог: box-shadow в CSS
    func addShadow(
        color: UIColor = .black,
        opacity: Float = 0.1,
        radius: CGFloat = 8,
        offset: CGSize = CGSize(width: 0, height: 2)
    ) {
        layer.shadowColor = color.cgColor
        layer.shadowOpacity = opacity
        layer.shadowRadius = radius
        layer.shadowOffset = offset
        layer.masksToBounds = false
    }

    /// Добавление границы
    /// Аналог: border в CSS
    func addBorder(color: UIColor, width: CGFloat = 1) {
        layer.borderColor = color.cgColor
        layer.borderWidth = width
    }
}
```

### String+Extension.swift

```swift
// Utilities/Extensions/String+Extension.swift

import UIKit

extension String {

    /// Вычисление ширины текста при заданной высоте и шрифте
    /// Используется для динамического размера ячеек категорий
    ///
    /// - Parameters:
    ///   - height: Максимальная высота
    ///   - font: Шрифт текста
    /// - Returns: Ширина текста
    func width(withConstrainedHeight height: CGFloat, font: UIFont) -> CGFloat {
        let constraintRect = CGSize(width: .greatestFiniteMagnitude, height: height)

        let boundingBox = self.boundingRect(
            with: constraintRect,
            options: .usesLineFragmentOrigin,
            attributes: [.font: font],
            context: nil
        )

        return ceil(boundingBox.width)
    }

    /// Проверка валидности email
    var isValidEmail: Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let predicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return predicate.evaluate(with: self)
    }

    /// Удаление пробелов по краям
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
```

---

## 14.13 Хелперы

### UIScreenBounds.swift

```swift
// Utilities/Helpers/UIScreenBounds.swift

import UIKit

/// Быстрый доступ к размерам экрана
/// Аналог: window.innerWidth, window.innerHeight в JavaScript
struct UIScreenBounds {
    static let width = UIScreen.main.bounds.width
    static let height = UIScreen.main.bounds.height
}

// Использование:
// let cellWidth = UIScreenBounds.width / 2 - 20
```

---

## 14.14 Настройка Firebase

### Шаг 1: Создание проекта

1. Перейдите на [console.firebase.google.com](https://console.firebase.google.com)
2. Нажмите **"Создать проект"**
3. Введите имя: `ECommerce`
4. Google Analytics — по желанию

### Шаг 2: Добавление iOS приложения

1. В консоли нажмите **"Добавить приложение" → iOS**
2. Bundle ID: `com.yourname.ECommerce` (из Xcode)
3. Скачайте `GoogleService-Info.plist`
4. Перетащите файл в Xcode → папку `Resources`
5. ✅ Copy items if needed

### Шаг 3: Включение аутентификации

1. Firebase Console → **Authentication**
2. **Sign-in method** → Включите:
   - ✅ Email/Password
   - ✅ Google

### Шаг 4: Создание Firestore

1. Firebase Console → **Firestore Database**
2. **Create database**
3. Выберите **Start in test mode** (для разработки)
4. Выберите регион (ближайший)

### Шаг 5: URL Scheme для Google Sign-In

1. Откройте `GoogleService-Info.plist`
2. Скопируйте значение `REVERSED_CLIENT_ID`
3. В Xcode: **Project → Targets → Info → URL Types**
4. Нажмите **+** и вставьте в **URL Schemes**

---

## 14.15 Итоги главы

В этой главе вы создали полную инфраструктуру приложения:

✅ Структура проекта по модулям

✅ Типизированные ошибки (NetworkError, FirebaseError, RealmError)

✅ Сетевой слой с протоколами (EndpointProtocol, NetworkManager)

✅ Локальное хранилище (RealmManager)

✅ Менеджеры бизнес-логики (UserInfoManager, RootWindowManager)

✅ AppDelegate и SceneDelegate с Firebase

✅ Расширения и хелперы

### Сравнение с веб-разработкой

| iOS (Swift) | Web (JavaScript) |
|-------------|------------------|
| `NetworkManager` | `axios.create()` |
| `EndpointProtocol` | Route configuration |
| `RealmManager` | `localStorage` / IndexedDB |
| `enum Error` | `class CustomError extends Error` |
| `AppDelegate` | `index.js` / entry point |
| `SceneDelegate` | Router initialization |

---

## Следующая глава

В [Главе 15](../15-Authentication/README.md) мы создадим полный модуль аутентификации с Firebase, Google Sign-In и Onboarding.
