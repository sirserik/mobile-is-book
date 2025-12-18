# Глава 5: ООП — Классы, структуры и объектно-ориентированное программирование

## Введение

Объектно-ориентированное программирование (ООП) — это **фундаментальная парадигма**, на которой построен весь UIKit и большинство iOS приложений. Если вы работали с JavaScript, вы уже знакомы с объектами. Swift предлагает более строгую и мощную систему ООП.

В этой главе мы **глубоко** изучим:
- Структуры (struct) и классы (class)
- Когда и почему использовать каждый из них
- Наследование и почему мы наследуемся от определённых классов
- Инкапсуляцию и управление доступом
- Полиморфизм
- Практические паттерны iOS разработки

### Сравнение с Web разработкой

| Концепция | JavaScript | Swift |
|-----------|------------|-------|
| Объект | `{}` или `class` | `class` или `struct` |
| Наследование | `extends` | `: ParentClass` |
| Интерфейс | TypeScript `interface` | `protocol` |
| Приватные поля | `#field` или `_field` | `private var field` |
| Геттеры/сеттеры | `get`/`set` | computed properties |
| Статические методы | `static` | `static` или `class` |

---

## 5.1 Структуры (struct) — подробное руководство

### Что такое структура

Структура — это **тип-значение (value type)**, который группирует связанные данные. Когда вы передаёте структуру в функцию или присваиваете её другой переменной, создаётся **копия**.

```
Аналогия из реальной жизни:
Структура — как документ Word. Когда вы отправляете файл другу,
он получает КОПИЮ. Если он изменит свою копию, ваш оригинал
останется нетронутым.
```

### Базовый синтаксис структуры

```swift
// Объявление структуры
struct Product {
    // Хранимые свойства (stored properties)
    let id: Int              // Неизменяемое свойство
    var name: String         // Изменяемое свойство
    var price: Double        // Изменяемое свойство
    var inStock: Bool = true // Свойство со значением по умолчанию
}

// Создание экземпляра (memberwise initializer создаётся автоматически)
let iphone = Product(id: 1, name: "iPhone 15", price: 999.0)

// Или с указанием значения по умолчанию
let macbook = Product(id: 2, name: "MacBook Pro", price: 1999.0, inStock: false)

// Доступ к свойствам
print(iphone.name)    // iPhone 15
print(iphone.price)   // 999.0
```

### Почему структуры — это value type

```swift
// Демонстрация копирования
var product1 = Product(id: 1, name: "iPhone", price: 999.0)
var product2 = product1  // Создаётся КОПИЯ

product2.price = 899.0   // Изменяем копию

print(product1.price)    // 999.0 — оригинал НЕ изменился!
print(product2.price)    // 899.0 — изменилась только копия
```

### Визуализация value type

```
Шаг 1: Создаём product1
┌──────────────────────────┐
│ product1                 │
│ ┌──────────────────────┐ │
│ │ id: 1                │ │
│ │ name: "iPhone"       │ │
│ │ price: 999.0         │ │
│ └──────────────────────┘ │
└──────────────────────────┘

Шаг 2: product2 = product1 (копирование)
┌──────────────────────────┐    ┌──────────────────────────┐
│ product1                 │    │ product2                 │
│ ┌──────────────────────┐ │    │ ┌──────────────────────┐ │
│ │ id: 1                │ │    │ │ id: 1                │ │
│ │ name: "iPhone"       │ │    │ │ name: "iPhone"       │ │
│ │ price: 999.0         │ │    │ │ price: 999.0         │ │
│ └──────────────────────┘ │    └──────────────────────┘ │
└──────────────────────────┘    └──────────────────────────┘
        ↑                               ↑
   Оригинал                          Копия

Шаг 3: product2.price = 899.0
┌──────────────────────────┐    ┌──────────────────────────┐
│ product1                 │    │ product2                 │
│ ┌──────────────────────┐ │    │ ┌──────────────────────┐ │
│ │ id: 1                │ │    │ │ id: 1                │ │
│ │ name: "iPhone"       │ │    │ │ name: "iPhone"       │ │
│ │ price: 999.0 ✓       │ │    │ │ price: 899.0 ✓       │ │
│ └──────────────────────┘ │    │ └──────────────────────┘ │
└──────────────────────────┘    └──────────────────────────┘
  Не изменился!                    Изменилась копия
```

### Методы структуры

```swift
struct Rectangle {
    var width: Double
    var height: Double

    // Обычный метод (только читает свойства)
    func area() -> Double {
        return width * height
    }

    func perimeter() -> Double {
        return 2 * (width + height)
    }

    func describe() -> String {
        return "Прямоугольник \(width) x \(height)"
    }
}

let rect = Rectangle(width: 10, height: 5)
print(rect.area())       // 50.0
print(rect.perimeter())  // 30.0
print(rect.describe())   // Прямоугольник 10.0 x 5.0
```

### Mutating методы — изменение свойств

Поскольку структуры — value type, методы по умолчанию **не могут изменять свойства**. Чтобы разрешить изменение, используйте `mutating`:

```swift
struct Point {
    var x: Double
    var y: Double

    // ❌ Ошибка: Cannot assign to property: 'self' is immutable
    // func move(dx: Double, dy: Double) {
    //     x += dx
    //     y += dy
    // }

    // ✅ Правильно: используем mutating
    mutating func move(dx: Double, dy: Double) {
        x += dx
        y += dy
    }

    mutating func reset() {
        x = 0
        y = 0
    }

    // Обычный метод не требует mutating (только читает)
    func distance(to other: Point) -> Double {
        let dx = other.x - x
        let dy = other.y - y
        return sqrt(dx * dx + dy * dy)
    }
}

// Использование
var point = Point(x: 0, y: 0)
point.move(dx: 3, dy: 4)
print(point)  // Point(x: 3.0, y: 4.0)

let origin = Point(x: 0, y: 0)
print(point.distance(to: origin))  // 5.0

// ⚠️ Важно: mutating методы нельзя вызвать на константе
let fixedPoint = Point(x: 10, y: 10)
// fixedPoint.move(dx: 1, dy: 1)  // ❌ Ошибка!
```

### Вычисляемые свойства (Computed Properties)

Вычисляемые свойства не хранят значение, а вычисляют его при каждом доступе:

```swift
struct Circle {
    // Хранимое свойство
    var radius: Double

    // Вычисляемое свойство (только чтение)
    var diameter: Double {
        return radius * 2
    }

    var area: Double {
        return .pi * radius * radius
    }

    var circumference: Double {
        return 2 * .pi * radius
    }

    // Вычисляемое свойство с геттером и сеттером
    var diameterWithSetter: Double {
        get {
            return radius * 2
        }
        set {
            // newValue — автоматическая переменная с новым значением
            radius = newValue / 2
        }
    }
}

var circle = Circle(radius: 5)

// Чтение вычисляемых свойств
print(circle.diameter)       // 10.0
print(circle.area)           // 78.54...
print(circle.circumference)  // 31.42...

// Запись через сеттер
circle.diameterWithSetter = 20
print(circle.radius)         // 10.0 (радиус изменился)
```

### Статические свойства и методы

Статические члены принадлежат **типу**, а не экземпляру:

```swift
struct APIConfig {
    // Статические свойства — общие для всех экземпляров
    static let baseURL = "https://fakestoreapi.com"
    static let apiVersion = "v1"
    static var timeout: TimeInterval = 30.0

    // Статический метод
    static func buildURL(endpoint: String) -> String {
        return "\(baseURL)/\(apiVersion)/\(endpoint)"
    }
}

// Доступ без создания экземпляра
print(APIConfig.baseURL)                    // https://fakestoreapi.com
print(APIConfig.buildURL(endpoint: "products"))  // https://fakestoreapi.com/v1/products

// Изменение статической переменной
APIConfig.timeout = 60.0
```

### Пользовательские инициализаторы

```swift
struct User {
    let id: Int
    var email: String
    var name: String
    var createdAt: Date

    // Пользовательский инициализатор
    init(id: Int, email: String, name: String) {
        self.id = id
        self.email = email.lowercased()  // Нормализация email
        self.name = name.trimmingCharacters(in: .whitespaces)
        self.createdAt = Date()  // Автоматически текущая дата
    }

    // Convenience инициализатор для тестирования
    init(testUser name: String) {
        self.init(
            id: Int.random(in: 1...1000),
            email: "\(name.lowercased())@test.com",
            name: name
        )
    }
}

let user = User(id: 1, email: "JOHN@EXAMPLE.COM", name: "  John  ")
print(user.email)  // john@example.com (приведено к lowercase)
print(user.name)   // John (убраны пробелы)

let testUser = User(testUser: "Alice")
print(testUser.email)  // alice@test.com
```

### Failable Initializer — инициализатор с валидацией

```swift
struct Email {
    let address: String

    // Возвращает nil, если email невалидный
    init?(_ string: String) {
        // Проверка формата
        guard string.contains("@"),
              string.contains("."),
              string.count >= 5 else {
            return nil  // Невалидный email
        }

        self.address = string.lowercased()
    }
}

// Использование
if let validEmail = Email("user@example.com") {
    print("Email валидный: \(validEmail.address)")
} else {
    print("Невалидный email")
}

let invalidEmail = Email("not-an-email")  // nil
```

---

## 5.2 Классы (class) — подробное руководство

### Что такое класс

Класс — это **ссылочный тип (reference type)**. Когда вы передаёте класс или присваиваете его другой переменной, передаётся **ссылка** на тот же объект в памяти.

```
Аналогия из реальной жизни:
Класс — как Google Документ. Когда вы делитесь ссылкой с другом,
вы оба работаете с ОДНИМ И ТЕМ ЖЕ документом. Изменения одного
видны другому.
```

### Базовый синтаксис класса

```swift
class Person {
    // Свойства
    var name: String
    var age: Int
    var email: String?  // Опциональное свойство

    // ⚠️ В отличие от struct, класс ТРЕБУЕТ явный инициализатор
    init(name: String, age: Int, email: String? = nil) {
        self.name = name
        self.age = age
        self.email = email
    }

    // Методы
    func introduce() {
        print("Привет, я \(name), мне \(age) лет")
    }

    func celebrateBirthday() {
        age += 1
        print("\(name) отмечает день рождения! Теперь ему/ей \(age)")
    }
}

// Создание экземпляра
let person = Person(name: "Анна", age: 25)
person.introduce()  // Привет, я Анна, мне 25 лет
```

### Почему классы — это reference type

```swift
// Демонстрация ссылочной семантики
let person1 = Person(name: "Иван", age: 30)
let person2 = person1  // person2 указывает на ТОТ ЖЕ объект

person2.age = 35  // Изменяем через вторую ссылку

print(person1.age)  // 35 — изменился и оригинал!
print(person2.age)  // 35

// Это один и тот же объект
print(person1 === person2)  // true (оператор идентичности)
```

### Визуализация reference type

```
Шаг 1: Создаём person1
┌──────────────┐         ┌──────────────────────┐
│ person1      │────────►│ Объект Person        │
└──────────────┘         │ name: "Иван"         │
                         │ age: 30              │
                         └──────────────────────┘
                              Heap (куча памяти)

Шаг 2: person2 = person1 (копируется ССЫЛКА, не объект)
┌──────────────┐
│ person1      │────────┐
└──────────────┘        │    ┌──────────────────────┐
                        └───►│ Объект Person        │
┌──────────────┐        ┌───►│ name: "Иван"         │
│ person2      │────────┘    │ age: 30              │
└──────────────┘             └──────────────────────┘
                                  Один объект в памяти!

Шаг 3: person2.age = 35 (обе ссылки видят изменение)
┌──────────────┐
│ person1      │────────┐
└──────────────┘        │    ┌──────────────────────┐
                        └───►│ Объект Person        │
┌──────────────┐        ┌───►│ name: "Иван"         │
│ person2      │────────┘    │ age: 35 ← изменено   │
└──────────────┘             └──────────────────────┘
```

### Deinitializer — деструктор класса

Только классы могут иметь deinit — код, выполняемый при удалении объекта:

```swift
class FileHandler {
    let filename: String

    init(filename: String) {
        self.filename = filename
        print("📂 Файл '\(filename)' открыт")
    }

    deinit {
        // Автоматически вызывается, когда объект удаляется из памяти
        print("📁 Файл '\(filename)' закрыт")
    }

    func read() -> String {
        return "Содержимое файла \(filename)"
    }
}

// Демонстрация жизненного цикла
func processFile() {
    let handler = FileHandler(filename: "data.json")
    // 📂 Файл 'data.json' открыт

    print(handler.read())
    // Содержимое файла data.json

} // handler выходит из scope, вызывается deinit
// 📁 Файл 'data.json' закрыт

processFile()
```

---

## 5.3 Критическое сравнение: struct vs class

### Таблица различий

| Характеристика | struct (Value Type) | class (Reference Type) |
|----------------|---------------------|------------------------|
| Копирование | Создаётся копия | Копируется ссылка |
| Наследование | ❌ Не поддерживается | ✅ Поддерживается |
| Deinitializer | ❌ Нет | ✅ Есть (`deinit`) |
| Memberwise init | ✅ Автоматический | ❌ Нужен явный |
| Mutating методы | ✅ Нужны для изменения | ❌ Не нужны |
| Идентичность (===) | ❌ Нет | ✅ Есть |
| let с изменением свойств | ❌ Невозможно | ✅ Можно |
| Хранение в памяти | Stack (быстрее) | Heap (медленнее) |
| Reference counting | ❌ Нет | ✅ ARC |

### Когда использовать struct (90% случаев в Swift)

✅ **Используйте struct когда:**

1. **Данные простые и изолированные**
   ```swift
   // ✅ Координаты — простые данные
   struct Coordinate {
       var latitude: Double
       var longitude: Double
   }
   ```

2. **Нужна независимость копий**
   ```swift
   // ✅ Каждый товар в корзине независим
   struct CartItem {
       var product: Product
       var quantity: Int
   }
   ```

3. **Это модель данных (Entity)**
   ```swift
   // ✅ Все модели из API
   struct Product {
       let id: Int
       let title: String
       let price: Double
       let description: String
       let category: String
       let image: String
   }

   struct User {
       let id: String
       var email: String
       var name: String
   }

   struct Order {
       let id: String
       let items: [CartItem]
       let total: Double
       let status: OrderStatus
   }
   ```

4. **Тип должен быть Codable (JSON)**
   ```swift
   // ✅ Структуры автоматически Codable
   struct APIResponse: Codable {
       let success: Bool
       let data: [Product]
   }
   ```

### Когда использовать class (10% случаев)

✅ **Используйте class когда:**

1. **Нужно наследование**
   ```swift
   // ✅ Наследование от UIKit классов
   class ProductCell: UITableViewCell {
       // Наследует всю функциональность UITableViewCell
   }

   class HomeViewController: UIViewController {
       // Наследует жизненный цикл, view, навигацию
   }
   ```

2. **Один объект должен использоваться в нескольких местах (shared state)**
   ```swift
   // ✅ Менеджеры, сервисы — одна копия на всё приложение
   class AuthManager {
       static let shared = AuthManager()  // Singleton

       var currentUser: User?
       var isLoggedIn: Bool { currentUser != nil }
   }

   class ShoppingCart {
       static let shared = ShoppingCart()

       var items: [CartItem] = []

       func add(_ product: Product) {
           // Все части приложения видят изменения
       }
   }
   ```

3. **Объект управляет внешними ресурсами**
   ```swift
   // ✅ Сетевые запросы, файлы, базы данных
   class NetworkManager {
       private let session = URLSession.shared

       deinit {
           // Очистка ресурсов
           session.invalidateAndCancel()
       }
   }

   class DatabaseConnection {
       private var connection: Connection?

       deinit {
           connection?.close()
       }
   }
   ```

4. **Работа с Objective-C / UIKit**
   ```swift
   // ✅ UIKit построен на классах
   // Все UIViewController, UIView — классы
   // Delegate pattern требует class для weak ссылок

   protocol DataSourceDelegate: AnyObject {  // AnyObject = только классы
       func didUpdateData()
   }

   class DataSource {
       weak var delegate: DataSourceDelegate?  // weak только для классов
   }
   ```

### Правило большого пальца

```
┌─────────────────────────────────────────────────────────────┐
│                    ПРАВИЛО ВЫБОРА                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  По умолчанию используйте STRUCT                           │
│                                                             │
│  Используйте CLASS только если:                             │
│  1. Нужно наследование (от UIKit классов)                  │
│  2. Нужен shared state (Singleton, Manager)                │
│  3. Нужен deinit для очистки ресурсов                      │
│  4. Работаете с Objective-C API                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5.4 Свойства — полное руководство

### Типы свойств в Swift

```swift
class Example {
    // 1. Stored Property — хранит значение
    var storedProperty: String = "value"

    // 2. Lazy Stored Property — вычисляется при первом доступе
    lazy var lazyProperty: String = {
        print("Вычисляется lazy свойство")
        return "lazy value"
    }()

    // 3. Computed Property — вычисляется каждый раз
    var computedProperty: String {
        return "computed: \(storedProperty)"
    }

    // 4. Type Property — принадлежит типу, не экземпляру
    static var typeProperty: String = "shared"
}
```

### Stored Properties подробно

```swift
struct Product {
    // Константа — устанавливается один раз
    let id: Int

    // Переменная — можно изменять
    var name: String

    // Со значением по умолчанию
    var isAvailable: Bool = true

    // Опциональное свойство
    var discount: Double?

    // Private — доступно только внутри типа
    private var internalNote: String = ""
}
```

### Lazy Properties — ленивые свойства

Ленивые свойства вычисляются **только при первом доступе**. Полезно для:
- Тяжёлых вычислений
- Загрузки ресурсов
- Зависимостей от других свойств

```swift
class DataLoader {
    // Тяжёлая операция — не хотим выполнять при создании объекта
    lazy var loadedData: [String] = {
        print("⏳ Загрузка данных...")
        // Представим, что это долгая операция
        Thread.sleep(forTimeInterval: 1)
        print("✅ Данные загружены")
        return ["item1", "item2", "item3"]
    }()

    init() {
        print("DataLoader создан")
    }
}

let loader = DataLoader()
// DataLoader создан

// Данные ещё НЕ загружены!

print(loader.loadedData)  // Только сейчас происходит загрузка
// ⏳ Загрузка данных...
// ✅ Данные загружены
// ["item1", "item2", "item3"]

print(loader.loadedData)  // Повторно НЕ вычисляется
// ["item1", "item2", "item3"]
```

### Computed Properties — вычисляемые свойства

```swift
struct Temperature {
    // Хранимое свойство (источник истины)
    var celsius: Double

    // Вычисляемое свойство только для чтения
    var fahrenheit: Double {
        return celsius * 9/5 + 32
    }

    // Вычисляемое свойство с getter и setter
    var kelvin: Double {
        get {
            return celsius + 273.15
        }
        set {
            celsius = newValue - 273.15
        }
    }

    // Краткий синтаксис для read-only (без return)
    var description: String {
        "\(celsius)°C = \(fahrenheit)°F = \(kelvin)K"
    }
}

var temp = Temperature(celsius: 25)
print(temp.fahrenheit)   // 77.0
print(temp.kelvin)       // 298.15
print(temp.description)  // 25.0°C = 77.0°F = 298.15K

// Изменение через setter
temp.kelvin = 300
print(temp.celsius)      // 26.85
```

### Property Observers — наблюдатели свойств

```swift
class UserProfile {
    var name: String = "" {
        willSet {
            // Вызывается ДО изменения
            // newValue — новое значение (автоматическая переменная)
            print("Имя будет изменено с '\(name)' на '\(newValue)'")
        }
        didSet {
            // Вызывается ПОСЛЕ изменения
            // oldValue — старое значение
            print("Имя изменено с '\(oldValue)' на '\(name)'")

            // Можно выполнить побочные действия
            updateUI()
        }
    }

    var email: String = "" {
        didSet {
            // Валидация после изменения
            if !email.contains("@") {
                print("⚠️ Некорректный email!")
                email = oldValue  // Откат к старому значению
            }
        }
    }

    private func updateUI() {
        print("🔄 UI обновлён")
    }
}

let profile = UserProfile()
profile.name = "Иван"
// Имя будет изменено с '' на 'Иван'
// Имя изменено с '' на 'Иван'
// 🔄 UI обновлён

profile.email = "invalid"
// ⚠️ Некорректный email!
print(profile.email)  // "" (осталось пустым)

profile.email = "ivan@mail.ru"
print(profile.email)  // ivan@mail.ru
```

### Access Control — управление доступом

```swift
class BankAccount {
    // public — доступно везде (для frameworks)
    public let accountNumber: String

    // internal — доступно в модуле (по умолчанию)
    internal var accountName: String

    // fileprivate — доступно только в этом файле
    fileprivate var transactions: [String] = []

    // private — доступно только в этом типе
    private var balance: Double = 0

    // private(set) — читать можно, изменять только внутри
    private(set) var lastTransaction: Date?

    init(number: String, name: String) {
        self.accountNumber = number
        self.accountName = name
    }

    // Публичные методы для работы с private данными
    func deposit(_ amount: Double) {
        guard amount > 0 else { return }
        balance += amount
        lastTransaction = Date()
        transactions.append("Deposit: +\(amount)")
    }

    func getBalance() -> Double {
        return balance  // Контролируемый доступ
    }
}

let account = BankAccount(number: "123", name: "Savings")
account.deposit(1000)

// ✅ Можно прочитать
print(account.accountNumber)   // 123
print(account.lastTransaction) // Optional(Date...)

// ❌ Нельзя изменить private
// account.balance = 1000000   // Ошибка компиляции!
// account.lastTransaction = nil  // Ошибка: setter недоступен

// ✅ Только через методы
print(account.getBalance())  // 1000.0
```

---

## 5.5 Методы — полное руководство

### Instance Methods — методы экземпляра

```swift
class ShoppingCart {
    private var items: [String: Int] = [:]  // productId: quantity

    // Метод без возвращаемого значения
    func addItem(_ productId: String, quantity: Int = 1) {
        if let existing = items[productId] {
            items[productId] = existing + quantity
        } else {
            items[productId] = quantity
        }
    }

    // Метод с возвращаемым значением
    func getQuantity(for productId: String) -> Int {
        return items[productId] ?? 0
    }

    // Метод с несколькими параметрами
    func updateQuantity(productId: String, to newQuantity: Int) {
        if newQuantity <= 0 {
            items.removeValue(forKey: productId)
        } else {
            items[productId] = newQuantity
        }
    }

    // Метод, возвращающий Optional
    func removeItem(_ productId: String) -> Int? {
        return items.removeValue(forKey: productId)
    }

    // Вычисляемое свойство вместо метода (когда нет параметров)
    var totalItems: Int {
        return items.values.reduce(0, +)
    }

    var isEmpty: Bool {
        return items.isEmpty
    }
}
```

### Static vs Class Methods

```swift
class Animal {
    // static — нельзя переопределить в подклассе
    static func staticMethod() {
        print("Это static метод Animal")
    }

    // class — можно переопределить в подклассе
    class func classMethod() {
        print("Это class метод Animal")
    }
}

class Dog: Animal {
    // ❌ Ошибка: Cannot override static method
    // override static func staticMethod() { }

    // ✅ Можно переопределить class метод
    override class func classMethod() {
        print("Это class метод Dog")
    }
}

Animal.staticMethod()  // Это static метод Animal
Dog.staticMethod()     // Это static метод Animal (наследуется)

Animal.classMethod()   // Это class метод Animal
Dog.classMethod()      // Это class метод Dog (переопределён)
```

### Self и self

```swift
class Counter {
    var count = 0

    // self (lowercase) — ссылка на текущий экземпляр
    func increment() {
        self.count += 1  // self можно опустить
        count += 1       // То же самое
    }

    // self обязателен при конфликте имён
    func set(count: Int) {
        self.count = count  // self.count — свойство, count — параметр
    }

    // Self (uppercase) — ссылка на тип
    static func create() -> Self {
        return Self()  // Создаёт экземпляр текущего класса
    }

    class func createNew() -> Self {
        return self.init()  // self.init() для class methods
    }

    required init() {}
}
```

---

## 5.6 Инициализаторы — полное руководство

### Designated vs Convenience Initializers

```swift
class Vehicle {
    var brand: String
    var model: String
    var year: Int
    var color: String

    // Designated Initializer — основной, инициализирует ВСЕ свойства
    init(brand: String, model: String, year: Int, color: String) {
        self.brand = brand
        self.model = model
        self.year = year
        self.color = color
    }

    // Convenience Initializer — удобный, вызывает designated
    convenience init(brand: String, model: String, year: Int) {
        self.init(brand: brand, model: model, year: year, color: "белый")
    }

    convenience init(brand: String, model: String) {
        self.init(brand: brand, model: model, year: Calendar.current.component(.year, from: Date()))
    }

    convenience init() {
        self.init(brand: "Unknown", model: "Unknown")
    }
}

// Все варианты создания
let v1 = Vehicle(brand: "BMW", model: "X5", year: 2023, color: "чёрный")
let v2 = Vehicle(brand: "Toyota", model: "Camry", year: 2024)  // белый
let v3 = Vehicle(brand: "Mercedes", model: "C-Class")          // белый, 2024
let v4 = Vehicle()                                              // Unknown, Unknown, белый, 2024
```

### Правила инициализации в наследовании

```swift
class Animal {
    var name: String

    // Designated initializer родителя
    init(name: String) {
        self.name = name
    }

    convenience init() {
        self.init(name: "Unknown")
    }
}

class Dog: Animal {
    var breed: String

    // Designated initializer потомка
    // Правило: СНАЧАЛА инициализируем свои свойства, ПОТОМ вызываем super.init
    init(name: String, breed: String) {
        // 1. Инициализация собственных свойств
        self.breed = breed

        // 2. Вызов designated init родителя
        super.init(name: name)

        // 3. После super.init можно использовать self
        print("Создана собака: \(self.name)")
    }

    // Переопределение convenience init родителя
    override convenience init(name: String) {
        self.init(name: name, breed: "Дворняга")
    }

    // Собственный convenience init
    convenience init(breed: String) {
        self.init(name: "Пёс", breed: breed)
    }
}

let dog1 = Dog(name: "Бобик", breed: "Лабрадор")
let dog2 = Dog(name: "Шарик")  // breed = Дворняга
let dog3 = Dog(breed: "Овчарка")  // name = Пёс
```

### Required Initializers

```swift
class BaseView {
    var frame: CGRect

    // Required — все подклассы ОБЯЗАНЫ реализовать
    required init(frame: CGRect) {
        self.frame = frame
    }
}

class CustomView: BaseView {
    var title: String

    init(frame: CGRect, title: String) {
        self.title = title
        super.init(frame: frame)
    }

    // ОБЯЗАНЫ реализовать required init
    required init(frame: CGRect) {
        self.title = "Default"
        super.init(frame: frame)
    }
}

// Это позволяет создавать экземпляры через тип
func createView<T: BaseView>(type: T.Type, frame: CGRect) -> T {
    return type.init(frame: frame)  // Работает благодаря required
}

let view = createView(type: CustomView.self, frame: .zero)
```

### Failable Initializers с наследованием

```swift
class Document {
    var title: String

    init?(title: String) {
        guard !title.isEmpty else { return nil }
        self.title = title
    }
}

class TextDocument: Document {
    var content: String

    init?(title: String, content: String) {
        guard !content.isEmpty else { return nil }
        self.content = content
        super.init(title: title)  // Может вернуть nil
    }
}

let doc1 = TextDocument(title: "Заметки", content: "Текст")  // ✅
let doc2 = TextDocument(title: "", content: "Текст")        // nil (пустой title)
let doc3 = TextDocument(title: "Заметки", content: "")      // nil (пустой content)
```

---

## 5.7 Наследование — подробное руководство

### Зачем нужно наследование

Наследование позволяет:
1. **Переиспользовать код** — не дублировать общую логику
2. **Расширять функциональность** — добавлять новые возможности
3. **Полиморфизм** — работать с разными типами единообразно

### Базовый синтаксис наследования

```swift
// Базовый класс (родитель, superclass)
class Shape {
    var name: String
    var fillColor: String

    init(name: String, fillColor: String = "white") {
        self.name = name
        self.fillColor = fillColor
    }

    func area() -> Double {
        return 0  // Базовая реализация
    }

    func describe() -> String {
        return "\(name) (цвет: \(fillColor))"
    }
}

// Дочерний класс (потомок, subclass)
class Circle: Shape {
    var radius: Double

    init(radius: Double, fillColor: String = "white") {
        // 1. Сначала инициализируем свои свойства
        self.radius = radius
        // 2. Потом вызываем init родителя
        super.init(name: "Круг", fillColor: fillColor)
    }

    // Переопределение метода
    override func area() -> Double {
        return .pi * radius * radius
    }

    // Дополнительный метод (только у Circle)
    func diameter() -> Double {
        return radius * 2
    }
}

class Rectangle: Shape {
    var width: Double
    var height: Double

    init(width: Double, height: Double, fillColor: String = "white") {
        self.width = width
        self.height = height
        super.init(name: "Прямоугольник", fillColor: fillColor)
    }

    override func area() -> Double {
        return width * height
    }
}

// Использование
let circle = Circle(radius: 5, fillColor: "red")
print(circle.describe())  // Круг (цвет: red)
print(circle.area())      // 78.54...
print(circle.diameter())  // 10.0

let rect = Rectangle(width: 10, height: 5)
print(rect.describe())    // Прямоугольник (цвет: white)
print(rect.area())        // 50.0
```

### Вызов родительской реализации (super)

```swift
class Employee {
    var name: String
    var salary: Double

    init(name: String, salary: Double) {
        self.name = name
        self.salary = salary
    }

    func getInfo() -> String {
        return "Сотрудник: \(name), зарплата: \(salary)"
    }

    func calculateBonus() -> Double {
        return salary * 0.1  // 10% бонус
    }
}

class Manager: Employee {
    var teamSize: Int

    init(name: String, salary: Double, teamSize: Int) {
        self.teamSize = teamSize
        super.init(name: name, salary: salary)
    }

    override func getInfo() -> String {
        // Вызываем родительскую реализацию + добавляем своё
        return super.getInfo() + ", команда: \(teamSize) чел."
    }

    override func calculateBonus() -> Double {
        // Базовый бонус + бонус за команду
        return super.calculateBonus() + Double(teamSize) * 1000
    }
}

let manager = Manager(name: "Иван", salary: 100000, teamSize: 5)
print(manager.getInfo())
// Сотрудник: Иван, зарплата: 100000.0, команда: 5 чел.
print(manager.calculateBonus())
// 15000.0 (10000 базовый + 5000 за команду)
```

### final — запрет наследования и переопределения

```swift
// final class — нельзя наследовать
final class SecurityManager {
    static let shared = SecurityManager()
    private init() {}

    func validateToken(_ token: String) -> Bool {
        // Логика валидации
        return true
    }
}

// ❌ Ошибка: Cannot inherit from final class
// class CustomSecurityManager: SecurityManager { }

class BaseViewController: UIViewController {
    // final method — нельзя переопределить
    final func logAnalytics(event: String) {
        print("Analytics: \(event)")
    }

    // Можно переопределить
    func setupUI() {
        // Базовая настройка
    }
}

class HomeViewController: BaseViewController {
    // ✅ Можно переопределить
    override func setupUI() {
        super.setupUI()
        // Дополнительная настройка
    }

    // ❌ Ошибка: Cannot override final method
    // override func logAnalytics(event: String) { }
}
```

### Полиморфизм — работа с базовым типом

```swift
// Полиморфизм позволяет работать с разными типами единообразно
let shapes: [Shape] = [
    Circle(radius: 5),
    Rectangle(width: 10, height: 5),
    Circle(radius: 3),
]

// Работаем с массивом Shape, но вызываются переопределённые методы
for shape in shapes {
    print("\(shape.name): площадь = \(shape.area())")
}
// Круг: площадь = 78.54...
// Прямоугольник: площадь = 50.0
// Круг: площадь = 28.27...

// Общая площадь всех фигур
let totalArea = shapes.reduce(0) { $0 + $1.area() }
print("Общая площадь: \(totalArea)")
```

### Type Casting — приведение типов

```swift
for shape in shapes {
    // Проверка типа
    if shape is Circle {
        print("\(shape.name) — это круг")
    }

    // Безопасное приведение (as?)
    if let circle = shape as? Circle {
        print("Диаметр: \(circle.diameter())")
    }

    // Принудительное приведение (as!) — опасно!
    // let circle = shape as! Circle  // Crash, если не Circle
}

// Использование switch для type casting
for shape in shapes {
    switch shape {
    case let circle as Circle:
        print("Круг с радиусом \(circle.radius)")
    case let rect as Rectangle:
        print("Прямоугольник \(rect.width) x \(rect.height)")
    default:
        print("Неизвестная фигура")
    }
}
```

---

## 5.8 Перечисления (enum) — полное руководство

### Зачем нужны enum

Enum представляет **ограниченный набор возможных значений**. Это безопаснее, чем строки или числа:

```swift
// ❌ Плохо: магические строки
func setOrderStatus(_ status: String) {
    // Что если опечатка? "pendnig"?
}
setOrderStatus("pending")
setOrderStatus("Pending")  // Разные регистры!
setOrderStatus("in_progress")

// ✅ Хорошо: enum
enum OrderStatus {
    case pending
    case processing
    case shipped
    case delivered
    case cancelled
}

func setOrderStatus(_ status: OrderStatus) {
    // Компилятор проверяет все возможные значения
}
setOrderStatus(.pending)
// setOrderStatus(.pendnig)  // ❌ Ошибка компиляции!
```

### Raw Values — связанные значения

```swift
// String raw values
enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}

print(HTTPMethod.get.rawValue)  // "GET"

// Создание из raw value
if let method = HTTPMethod(rawValue: "POST") {
    print(method)  // post
}

// Int raw values с автоматической нумерацией
enum Priority: Int {
    case low = 1
    case medium = 2
    case high = 3
    case critical = 4
}

print(Priority.high.rawValue)  // 3

// Автоматические String raw values (равны названию case)
enum Category: String {
    case electronics  // rawValue = "electronics"
    case clothing     // rawValue = "clothing"
    case food         // rawValue = "food"
}

print(Category.electronics.rawValue)  // "electronics"
```

### Associated Values — данные внутри enum

Associated values позволяют **хранить дополнительные данные** в каждом case:

```swift
enum NetworkResult {
    case success(data: Data, statusCode: Int)
    case failure(error: Error)
    case loading(progress: Double)
    case noConnection
}

func handleResult(_ result: NetworkResult) {
    switch result {
    case .success(let data, let code):
        print("✅ Успех! Получено \(data.count) байт, код \(code)")

    case .failure(let error):
        print("❌ Ошибка: \(error.localizedDescription)")

    case .loading(let progress):
        print("⏳ Загрузка: \(Int(progress * 100))%")

    case .noConnection:
        print("📵 Нет соединения")
    }
}

// Использование
let result1 = NetworkResult.success(data: Data(), statusCode: 200)
let result2 = NetworkResult.loading(progress: 0.75)
handleResult(result1)  // ✅ Успех! Получено 0 байт, код 200
handleResult(result2)  // ⏳ Загрузка: 75%
```

### Практический пример: Валидация формы

```swift
enum ValidationResult {
    case valid
    case invalid(errors: [String])

    var isValid: Bool {
        switch self {
        case .valid:
            return true
        case .invalid:
            return false
        }
    }

    var errorMessages: [String] {
        switch self {
        case .valid:
            return []
        case .invalid(let errors):
            return errors
        }
    }
}

enum PasswordStrength {
    case weak
    case medium
    case strong

    var color: String {
        switch self {
        case .weak: return "red"
        case .medium: return "orange"
        case .strong: return "green"
        }
    }
}

func validatePassword(_ password: String) -> (ValidationResult, PasswordStrength) {
    var errors: [String] = []

    if password.count < 8 {
        errors.append("Минимум 8 символов")
    }
    if !password.contains(where: { $0.isUppercase }) {
        errors.append("Нужна заглавная буква")
    }
    if !password.contains(where: { $0.isNumber }) {
        errors.append("Нужна цифра")
    }

    let strength: PasswordStrength
    if errors.isEmpty {
        strength = .strong
    } else if errors.count == 1 {
        strength = .medium
    } else {
        strength = .weak
    }

    let result = errors.isEmpty ? ValidationResult.valid : .invalid(errors: errors)
    return (result, strength)
}

let (result, strength) = validatePassword("Pass123")
print(result.errorMessages)  // ["Минимум 8 символов"]
print(strength.color)        // orange
```

### Enum с методами

```swift
enum Direction: CaseIterable {
    case north, south, east, west

    // Вычисляемое свойство
    var degrees: Double {
        switch self {
        case .north: return 0
        case .east: return 90
        case .south: return 180
        case .west: return 270
        }
    }

    var opposite: Direction {
        switch self {
        case .north: return .south
        case .south: return .north
        case .east: return .west
        case .west: return .east
        }
    }

    // Метод
    func turnRight() -> Direction {
        switch self {
        case .north: return .east
        case .east: return .south
        case .south: return .west
        case .west: return .north
        }
    }

    // Static метод
    static func random() -> Direction {
        return allCases.randomElement()!
    }
}

var heading = Direction.north
heading = heading.turnRight()  // .east
print(heading.opposite)        // .west
print(heading.degrees)         // 90.0

// CaseIterable — итерация по всем case
for direction in Direction.allCases {
    print("\(direction): \(direction.degrees)°")
}
```

---

## 5.9 Почему в iOS мы наследуемся от определённых классов

### Иерархия UIKit

```
NSObject                          ← Базовый класс Objective-C
    │
    └── UIResponder               ← Обработка событий (тачи, клавиатура)
            │
            ├── UIApplication     ← Singleton приложения
            │
            ├── UIView            ← Базовый UI элемент
            │   │
            │   ├── UILabel       ← Текст
            │   ├── UIButton      ← Кнопка
            │   ├── UIImageView   ← Изображение
            │   ├── UITextField   ← Поле ввода
            │   ├── UIScrollView  ← Прокрутка
            │   │   │
            │   │   ├── UITableView      ← Список
            │   │   └── UICollectionView ← Сетка
            │   │
            │   └── UIStackView   ← Стек элементов
            │
            └── UIViewController  ← Контроллер экрана
                    │
                    ├── UINavigationController  ← Стек навигации
                    ├── UITabBarController      ← Вкладки
                    └── UIAlertController       ← Диалоги
```

### Почему наследуемся от UIViewController

```swift
// UIViewController предоставляет:
class MyViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        // 1. View для размещения UI
        view.backgroundColor = .white

        // 2. Жизненный цикл (viewDidLoad, viewWillAppear, etc.)

        // 3. Навигацию
        navigationController?.pushViewController(NextVC(), animated: true)

        // 4. Презентацию модальных экранов
        present(ModalVC(), animated: true)

        // 5. Обработку поворота экрана
        // 6. Управление памятью (didReceiveMemoryWarning)
        // 7. Интеграцию с Interface Builder
    }

    // Lifecycle methods — наследуются от UIViewController
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
    }
}

// Если НЕ наследоваться от UIViewController:
// - Нет view
// - Нет lifecycle
// - Нет интеграции с Navigation/TabBar
// - Придётся всё писать с нуля
```

### Почему наследуемся от UIView

```swift
// UIView предоставляет:
class CustomCardView: UIView {

    override init(frame: CGRect) {
        super.init(frame: frame)

        // 1. frame/bounds — размер и позиция
        // 2. backgroundColor, alpha — визуальные свойства
        // 3. addSubview — иерархия view
        // 4. layer — тени, скругления, анимации
        // 5. Auto Layout anchors
        // 6. Обработку касаний

        backgroundColor = .white
        layer.cornerRadius = 12
        layer.shadowOpacity = 0.1
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // Можно переопределить отрисовку
    override func draw(_ rect: CGRect) {
        // Кастомная отрисовка
    }

    // Можно переопределить layout
    override func layoutSubviews() {
        super.layoutSubviews()
        // Кастомный layout
    }
}
```

### Почему наследуемся от UITableViewCell

```swift
// UITableViewCell предоставляет:
class ProductCell: UITableViewCell {

    // 1. Встроенный contentView для контента
    // 2. Reuse mechanism (переиспользование)
    // 3. Selection states (выделение)
    // 4. Accessory views (стрелки, галочки)
    // 5. Swipe actions
    // 6. Интеграцию с UITableView

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)

        // Добавляем в contentView, а не в self!
        contentView.addSubview(titleLabel)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // Подготовка к переиспользованию
    override func prepareForReuse() {
        super.prepareForReuse()
        titleLabel.text = nil
        imageView?.image = nil
    }

    private let titleLabel = UILabel()
}
```

---

## 5.10 Практические примеры из E-Commerce проекта

### Product Entity (struct)

```swift
// Модель товара — struct, потому что это данные
struct Product: Codable, Equatable {
    let id: Int
    let title: String
    let price: Double
    let description: String
    let category: String
    let image: String
    let rating: Rating

    struct Rating: Codable, Equatable {
        let rate: Double
        let count: Int
    }

    // Вычисляемые свойства
    var formattedPrice: String {
        return String(format: "$%.2f", price)
    }

    var isOnSale: Bool {
        return price < 50
    }
}
```

### NetworkManager (class + Singleton)

```swift
// Менеджер сети — class, потому что:
// 1. Один экземпляр на всё приложение (shared state)
// 2. Управляет ресурсами (URLSession)
final class NetworkManager {
    // Singleton pattern
    static let shared = NetworkManager()

    // Private init предотвращает создание других экземпляров
    private init() {}

    private let session = URLSession.shared
    private let decoder = JSONDecoder()

    func fetch<T: Decodable>(url: URL) async throws -> T {
        let (data, response) = try await session.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }

        return try decoder.decode(T.self, from: data)
    }
}
```

### CartItem (struct с логикой)

```swift
struct CartItem: Equatable {
    let product: Product
    var quantity: Int

    var subtotal: Double {
        return product.price * Double(quantity)
    }

    var formattedSubtotal: String {
        return String(format: "$%.2f", subtotal)
    }

    // Mutating методы для изменения количества
    mutating func incrementQuantity() {
        quantity += 1
    }

    mutating func decrementQuantity() {
        if quantity > 1 {
            quantity -= 1
        }
    }

    mutating func setQuantity(_ newQuantity: Int) {
        quantity = max(1, newQuantity)
    }
}
```

### Error Enums

```swift
enum NetworkError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case noData
    case decodingError(Error)
    case serverError(statusCode: Int)
    case noConnection

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Неверный URL"
        case .invalidResponse:
            return "Неверный ответ сервера"
        case .noData:
            return "Нет данных"
        case .decodingError(let error):
            return "Ошибка декодирования: \(error.localizedDescription)"
        case .serverError(let code):
            return "Ошибка сервера: \(code)"
        case .noConnection:
            return "Нет подключения к интернету"
        }
    }
}

enum AuthError: Error {
    case invalidCredentials
    case userNotFound
    case emailAlreadyInUse
    case weakPassword
    case networkError(Error)
    case unknown
}
```

---

## 5.11 Упражнения

### Упражнение 5.1: Модель корзины

Создайте полную модель корзины покупок:
- `CartItem` (struct) с продуктом и количеством
- `ShoppingCart` (class) с методами add, remove, updateQuantity
- Вычисляемые свойства: totalItems, totalPrice

<details>
<summary>Показать решение</summary>

```swift
struct CartItem: Equatable {
    let product: Product
    var quantity: Int

    var subtotal: Double {
        product.price * Double(quantity)
    }

    static func == (lhs: CartItem, rhs: CartItem) -> Bool {
        return lhs.product.id == rhs.product.id
    }
}

class ShoppingCart {
    static let shared = ShoppingCart()
    private init() {}

    private(set) var items: [CartItem] = []

    var totalItems: Int {
        items.reduce(0) { $0 + $1.quantity }
    }

    var totalPrice: Double {
        items.reduce(0) { $0 + $1.subtotal }
    }

    var formattedTotal: String {
        String(format: "$%.2f", totalPrice)
    }

    var isEmpty: Bool {
        items.isEmpty
    }

    func add(_ product: Product, quantity: Int = 1) {
        if let index = items.firstIndex(where: { $0.product.id == product.id }) {
            items[index].quantity += quantity
        } else {
            items.append(CartItem(product: product, quantity: quantity))
        }
    }

    func remove(_ productId: Int) {
        items.removeAll { $0.product.id == productId }
    }

    func updateQuantity(productId: Int, quantity: Int) {
        guard let index = items.firstIndex(where: { $0.product.id == productId }) else {
            return
        }

        if quantity <= 0 {
            items.remove(at: index)
        } else {
            items[index].quantity = quantity
        }
    }

    func clear() {
        items.removeAll()
    }

    func contains(_ productId: Int) -> Bool {
        items.contains { $0.product.id == productId }
    }
}
```
</details>

### Упражнение 5.2: Enum для API Endpoints

Создайте enum `Endpoint` с associated values для разных API endpoints:
- products (с опциональной категорией)
- product(id: Int)
- categories
- auth/login
- auth/register

<details>
<summary>Показать решение</summary>

```swift
enum Endpoint {
    case products(category: String? = nil)
    case product(id: Int)
    case categories
    case login(email: String, password: String)
    case register(email: String, password: String)

    var path: String {
        switch self {
        case .products(let category):
            if let category = category {
                return "/products/category/\(category)"
            }
            return "/products"
        case .product(let id):
            return "/products/\(id)"
        case .categories:
            return "/products/categories"
        case .login:
            return "/auth/login"
        case .register:
            return "/auth/register"
        }
    }

    var method: String {
        switch self {
        case .products, .product, .categories:
            return "GET"
        case .login, .register:
            return "POST"
        }
    }

    var body: Data? {
        switch self {
        case .login(let email, let password):
            return try? JSONEncoder().encode([
                "email": email,
                "password": password
            ])
        case .register(let email, let password):
            return try? JSONEncoder().encode([
                "email": email,
                "password": password
            ])
        default:
            return nil
        }
    }

    func buildURL(baseURL: String = "https://fakestoreapi.com") -> URL? {
        return URL(string: baseURL + path)
    }
}

// Использование
let endpoint1 = Endpoint.products()
let endpoint2 = Endpoint.products(category: "electronics")
let endpoint3 = Endpoint.product(id: 1)

print(endpoint1.path)  // /products
print(endpoint2.path)  // /products/category/electronics
print(endpoint3.buildURL()!)  // https://fakestoreapi.com/products/1
```
</details>

### Упражнение 5.3: Класс с наследованием

Создайте иерархию классов для пользователей:
- `User` (базовый) с email, name
- `Customer` (наследник) с shippingAddress
- `Admin` (наследник) с permissions

<details>
<summary>Показать решение</summary>

```swift
class User {
    let id: String
    var email: String
    var name: String
    let createdAt: Date

    init(id: String, email: String, name: String) {
        self.id = id
        self.email = email
        self.name = name
        self.createdAt = Date()
    }

    func describe() -> String {
        return "\(name) (\(email))"
    }

    func canAccess(_ resource: String) -> Bool {
        return true  // Базовый доступ
    }
}

class Customer: User {
    var shippingAddress: String?
    var orderHistory: [String] = []  // Order IDs
    var loyaltyPoints: Int = 0

    init(id: String, email: String, name: String, shippingAddress: String? = nil) {
        self.shippingAddress = shippingAddress
        super.init(id: id, email: email, name: name)
    }

    override func describe() -> String {
        return super.describe() + " (Покупатель, \(loyaltyPoints) баллов)"
    }

    func addLoyaltyPoints(_ points: Int) {
        loyaltyPoints += points
    }
}

class Admin: User {
    enum Permission: String, CaseIterable {
        case manageUsers
        case manageProducts
        case viewAnalytics
        case manageOrders
        case fullAccess
    }

    var permissions: Set<Permission>

    init(id: String, email: String, name: String, permissions: Set<Permission>) {
        self.permissions = permissions
        super.init(id: id, email: email, name: name)
    }

    convenience init(id: String, email: String, name: String, isSuperAdmin: Bool = false) {
        let perms: Set<Permission> = isSuperAdmin ? Set(Permission.allCases) : [.viewAnalytics]
        self.init(id: id, email: email, name: name, permissions: perms)
    }

    override func describe() -> String {
        return super.describe() + " (Админ, \(permissions.count) прав)"
    }

    override func canAccess(_ resource: String) -> Bool {
        return permissions.contains(.fullAccess) || super.canAccess(resource)
    }

    func hasPermission(_ permission: Permission) -> Bool {
        return permissions.contains(permission) || permissions.contains(.fullAccess)
    }
}

// Использование
let customer = Customer(id: "1", email: "user@test.com", name: "Иван")
customer.addLoyaltyPoints(100)
print(customer.describe())  // Иван (user@test.com) (Покупатель, 100 баллов)

let admin = Admin(id: "2", email: "admin@test.com", name: "Админ", isSuperAdmin: true)
print(admin.hasPermission(.manageUsers))  // true

// Полиморфизм
let users: [User] = [customer, admin]
for user in users {
    print(user.describe())
}
```
</details>

---

## Итоги главы

В этой главе вы **глубоко** изучили:

✅ **Структуры (struct)** — value type, копирование, mutating методы

✅ **Классы (class)** — reference type, наследование, deinit

✅ **Когда использовать struct vs class** — правило: struct по умолчанию

✅ **Свойства** — stored, computed, lazy, observers, access control

✅ **Методы** — instance, static, class, mutating

✅ **Инициализаторы** — designated, convenience, failable, required

✅ **Наследование** — override, super, final, полиморфизм

✅ **Enum** — raw values, associated values, методы

✅ **Почему в iOS наследуемся от UIViewController, UIView, UITableViewCell**

---

## Следующая глава

В [Главе 6](../06-Protocols/README.md) мы изучим **протоколы** — ещё более мощный инструмент абстракции, который позволяет обойти ограничения наследования.

---

> **Совет**: Запомните правило: **struct для данных, class для поведения**. Модели (Product, User, Order) — struct. Менеджеры, сервисы, контроллеры — class. Это стандарт в Swift разработке.
