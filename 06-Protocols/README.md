# Глава 6: Протоколы и расширения

## Введение

Протоколы — это контракты, определяющие требования к типам. Расширения позволяют добавлять функциональность к существующим типам. Вместе они составляют основу **Protocol-Oriented Programming** — подхода, который Swift продвигает вместо классического ООП.

---

## 6.1 Что такое протоколы

Протокол описывает, **что** должен уметь тип, но не говорит **как** это реализовать.

### Базовый синтаксис

```swift
protocol Describable {
    var description: String { get }
    func describe() -> String
}
```

### Сравнение с интерфейсами

| TypeScript interface | Swift protocol |
|---------------------|----------------|
| `interface Flyable { fly(): void }` | `protocol Flyable { func fly() }` |
| Только для объектов | Для struct, class, enum |
| Нельзя реализовать по умолчанию | Можно через extension |

---

## 6.2 Требования протоколов

### Требования к свойствам

```swift
protocol FullyNamed {
    // Только для чтения
    var fullName: String { get }

    // Для чтения и записи
    var nickname: String { get set }
}

struct Person: FullyNamed {
    var firstName: String
    var lastName: String
    var nickname: String

    var fullName: String {
        "\(firstName) \(lastName)"
    }
}
```

### Требования к методам

```swift
protocol Togglable {
    mutating func toggle()
}

enum Switch: Togglable {
    case on, off

    mutating func toggle() {
        switch self {
        case .on: self = .off
        case .off: self = .on
        }
    }
}

var lightSwitch = Switch.off
lightSwitch.toggle()  // .on
```

### Требования к инициализаторам

```swift
protocol Named {
    init(name: String)
}

class SomeClass: Named {
    var name: String

    // required — подклассы тоже должны реализовать
    required init(name: String) {
        self.name = name
    }
}
```

### Требования к статическим членам

```swift
protocol Configurable {
    static var defaultConfig: Self { get }
    static func configure(with settings: [String: Any]) -> Self
}
```

---

## 6.3 Соответствие протоколам

### Структуры

```swift
protocol Drawable {
    func draw()
}

struct Circle: Drawable {
    var radius: Double

    func draw() {
        print("Рисую круг с радиусом \(radius)")
    }
}

struct Rectangle: Drawable {
    var width: Double
    var height: Double

    func draw() {
        print("Рисую прямоугольник \(width)x\(height)")
    }
}
```

### Классы

```swift
protocol Printable {
    func printDetails()
}

class Document: Printable {
    var title: String

    init(title: String) {
        self.title = title
    }

    func printDetails() {
        print("Документ: \(title)")
    }
}
```

### Множественное соответствие

```swift
protocol Named {
    var name: String { get }
}

protocol Aged {
    var age: Int { get }
}

// Соответствие нескольким протоколам
struct Person: Named, Aged {
    var name: String
    var age: Int
}
```

### Наследование протоколов

```swift
protocol Animal {
    var name: String { get }
    func makeSound()
}

protocol Pet: Animal {
    var owner: String { get }
    func play()
}

struct Dog: Pet {
    var name: String
    var owner: String

    func makeSound() {
        print("Гав!")
    }

    func play() {
        print("\(name) играет с \(owner)")
    }
}
```

---

## 6.4 Протоколы как типы

Протокол можно использовать как тип:

```swift
protocol Flyable {
    func fly()
}

struct Bird: Flyable {
    func fly() { print("Птица летит") }
}

struct Airplane: Flyable {
    func fly() { print("Самолёт летит") }
}

// Массив объектов, соответствующих протоколу
let flyingThings: [Flyable] = [Bird(), Airplane()]

for thing in flyingThings {
    thing.fly()
}

// Функция, принимающая протокол
func makeFly(_ object: Flyable) {
    object.fly()
}

makeFly(Bird())      // Птица летит
makeFly(Airplane())  // Самолёт летит
```

### any и some (Swift 5.7+)

```swift
// any — экзистенциальный тип (runtime полиморфизм)
var anyFlyable: any Flyable = Bird()
anyFlyable = Airplane()  // Можно присвоить другой тип

// some — opaque type (compile-time, один конкретный тип)
func getFlyer() -> some Flyable {
    Bird()  // Всегда возвращает Bird
}
```

---

## 6.5 Делегирование (Delegation Pattern)

Делегирование — паттерн, где один объект передаёт часть работы другому. Широко используется в iOS.

### Пример: Загрузка данных

```swift
// 1. Определяем протокол делегата
protocol DataLoaderDelegate: AnyObject {
    func dataLoader(_ loader: DataLoader, didLoadData data: [String])
    func dataLoader(_ loader: DataLoader, didFailWithError error: Error)
}

// 2. Класс с делегатом
class DataLoader {
    // weak — предотвращаем retain cycle
    weak var delegate: DataLoaderDelegate?

    func loadData() {
        // Имитация асинхронной загрузки
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
            guard let self = self else { return }

            let success = Bool.random()

            if success {
                let data = ["Item 1", "Item 2", "Item 3"]
                self.delegate?.dataLoader(self, didLoadData: data)
            } else {
                let error = NSError(domain: "LoadError", code: 1)
                self.delegate?.dataLoader(self, didFailWithError: error)
            }
        }
    }
}

// 3. Реализация делегата
class ViewController: DataLoaderDelegate {
    let loader = DataLoader()

    func start() {
        loader.delegate = self
        loader.loadData()
    }

    func dataLoader(_ loader: DataLoader, didLoadData data: [String]) {
        print("Загружено: \(data)")
    }

    func dataLoader(_ loader: DataLoader, didFailWithError error: Error) {
        print("Ошибка: \(error)")
    }
}
```

### UITableView Delegate (пример из UIKit)

```swift
class MyViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {

    let tableView = UITableView()

    override func viewDidLoad() {
        super.viewDidLoad()
        tableView.delegate = self
        tableView.dataSource = self
    }

    // UITableViewDataSource
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return 10
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = UITableViewCell()
        cell.textLabel?.text = "Row \(indexPath.row)"
        return cell
    }

    // UITableViewDelegate
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        print("Выбрана строка \(indexPath.row)")
    }
}
```

---

## 6.6 Расширения (Extensions)

Расширения добавляют функциональность к существующим типам без наследования.

### Базовый синтаксис

```swift
extension String {
    var isEmail: Bool {
        contains("@") && contains(".")
    }

    func trimmed() -> String {
        trimmingCharacters(in: .whitespaces)
    }

    mutating func trim() {
        self = trimmed()
    }
}

let email = "user@example.com"
print(email.isEmail)  // true

var text = "  Hello  "
print(text.trimmed())  // "Hello"
```

### Расширение стандартных типов

```swift
extension Int {
    var isEven: Bool { self % 2 == 0 }
    var isOdd: Bool { !isEven }
    var squared: Int { self * self }

    func times(_ action: () -> Void) {
        for _ in 0..<self {
            action()
        }
    }
}

print(5.isOdd)      // true
print(4.squared)    // 16

3.times {
    print("Привет!")
}
// Привет! Привет! Привет!


extension Array where Element == Int {
    var sum: Int {
        reduce(0, +)
    }

    var average: Double {
        isEmpty ? 0 : Double(sum) / Double(count)
    }
}

let numbers = [1, 2, 3, 4, 5]
print(numbers.sum)      // 15
print(numbers.average)  // 3.0
```

### Расширения с инициализаторами

```swift
extension CGRect {
    init(center: CGPoint, size: CGSize) {
        let origin = CGPoint(
            x: center.x - size.width / 2,
            y: center.y - size.height / 2
        )
        self.init(origin: origin, size: size)
    }
}

let rect = CGRect(center: CGPoint(x: 100, y: 100), size: CGSize(width: 50, height: 50))
```

---

## 6.7 Protocol Extensions

Расширения протоколов позволяют добавить реализацию по умолчанию.

```swift
protocol Greetable {
    var name: String { get }
    func greet() -> String
}

// Реализация по умолчанию
extension Greetable {
    func greet() -> String {
        "Привет, \(name)!"
    }

    func formalGreet() -> String {
        "Здравствуйте, \(name)!"
    }
}

struct Person: Greetable {
    var name: String
    // greet() уже реализован по умолчанию
}

struct Robot: Greetable {
    var name: String

    // Переопределяем реализацию по умолчанию
    func greet() -> String {
        "Бип-буп, я \(name)"
    }
}

let person = Person(name: "Иван")
let robot = Robot(name: "R2D2")

print(person.greet())       // Привет, Иван!
print(person.formalGreet()) // Здравствуйте, Иван!
print(robot.greet())        // Бип-буп, я R2D2
```

### Условные расширения (where)

```swift
extension Collection where Element: Numeric {
    var total: Element {
        reduce(0, +)
    }
}

let integers = [1, 2, 3, 4, 5]
let doubles = [1.5, 2.5, 3.5]

print(integers.total)  // 15
print(doubles.total)   // 7.5


extension Array where Element: Equatable {
    func removingDuplicates() -> [Element] {
        var result: [Element] = []
        for element in self {
            if !result.contains(element) {
                result.append(element)
            }
        }
        return result
    }
}

let numbers = [1, 2, 2, 3, 3, 3, 4]
print(numbers.removingDuplicates())  // [1, 2, 3, 4]
```

---

## 6.8 Стандартные протоколы Swift

### Equatable

```swift
struct Product: Equatable {
    let id: Int
    let name: String
    let price: Double

    // Swift автоматически синтезирует ==
    // Или можно реализовать вручную:
    static func == (lhs: Product, rhs: Product) -> Bool {
        lhs.id == rhs.id  // Сравниваем только по id
    }
}

let p1 = Product(id: 1, name: "iPhone", price: 999)
let p2 = Product(id: 1, name: "iPhone 15", price: 1099)

print(p1 == p2)  // true (id совпадают)
```

### Comparable

```swift
struct Person: Comparable {
    let name: String
    let age: Int

    static func < (lhs: Person, rhs: Person) -> Bool {
        lhs.age < rhs.age
    }
}

let people = [
    Person(name: "Анна", age: 30),
    Person(name: "Борис", age: 25),
    Person(name: "Виктор", age: 35)
]

let sorted = people.sorted()
// [Борис (25), Анна (30), Виктор (35)]
```

### Hashable

```swift
struct User: Hashable {
    let id: Int
    let email: String

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

// Можно использовать в Set и как ключ Dictionary
var users: Set<User> = []
users.insert(User(id: 1, email: "a@b.com"))
```

### Codable

```swift
struct Product: Codable {
    let id: Int
    let name: String
    let price: Double
}

// Кодирование в JSON
let product = Product(id: 1, name: "iPhone", price: 999)
let encoder = JSONEncoder()
encoder.outputFormatting = .prettyPrinted

if let data = try? encoder.encode(product),
   let json = String(data: data, encoding: .utf8) {
    print(json)
}
/*
{
  "id" : 1,
  "name" : "iPhone",
  "price" : 999
}
*/

// Декодирование из JSON
let jsonString = """
{"id": 2, "name": "MacBook", "price": 1999}
"""

let decoder = JSONDecoder()
if let data = jsonString.data(using: .utf8),
   let decoded = try? decoder.decode(Product.self, from: data) {
    print(decoded.name)  // MacBook
}
```

### CustomStringConvertible

```swift
struct Point: CustomStringConvertible {
    var x: Double
    var y: Double

    var description: String {
        "(\(x), \(y))"
    }
}

let point = Point(x: 10, y: 20)
print(point)  // (10.0, 20.0)
```

---

## 6.9 Практические примеры

### Пример 1: Валидация форм

```swift
protocol Validatable {
    func validate() -> ValidationResult
}

enum ValidationResult {
    case valid
    case invalid(errors: [String])

    var isValid: Bool {
        if case .valid = self { return true }
        return false
    }
}

struct EmailValidator: Validatable {
    let email: String

    func validate() -> ValidationResult {
        var errors: [String] = []

        if email.isEmpty {
            errors.append("Email не может быть пустым")
        }
        if !email.contains("@") {
            errors.append("Email должен содержать @")
        }
        if !email.contains(".") {
            errors.append("Email должен содержать точку")
        }

        return errors.isEmpty ? .valid : .invalid(errors: errors)
    }
}

struct PasswordValidator: Validatable {
    let password: String
    let minLength: Int = 8

    func validate() -> ValidationResult {
        var errors: [String] = []

        if password.count < minLength {
            errors.append("Пароль должен быть минимум \(minLength) символов")
        }
        if !password.contains(where: { $0.isUppercase }) {
            errors.append("Пароль должен содержать заглавную букву")
        }
        if !password.contains(where: { $0.isNumber }) {
            errors.append("Пароль должен содержать цифру")
        }

        return errors.isEmpty ? .valid : .invalid(errors: errors)
    }
}

// Использование
let emailResult = EmailValidator(email: "test@example.com").validate()
let passwordResult = PasswordValidator(password: "weak").validate()

if case .invalid(let errors) = passwordResult {
    print("Ошибки пароля:")
    errors.forEach { print("  - \($0)") }
}
```

### Пример 2: Репозиторий данных

```swift
protocol Repository {
    associatedtype Entity

    func getAll() -> [Entity]
    func get(by id: Int) -> Entity?
    func save(_ entity: Entity)
    func delete(by id: Int)
}

// Реализация для продуктов
class ProductRepository: Repository {
    typealias Entity = Product

    private var products: [Product] = []

    func getAll() -> [Product] {
        products
    }

    func get(by id: Int) -> Product? {
        products.first { $0.id == id }
    }

    func save(_ entity: Product) {
        if let index = products.firstIndex(where: { $0.id == entity.id }) {
            products[index] = entity
        } else {
            products.append(entity)
        }
    }

    func delete(by id: Int) {
        products.removeAll { $0.id == id }
    }
}
```

---

## 6.10 Упражнения

### Упражнение 6.1: Протокол Shape

Создайте протокол `Shape` с:
- Свойство `name: String`
- Метод `area() -> Double`
- Метод `perimeter() -> Double`

Реализуйте для Circle, Rectangle, Triangle.

<details>
<summary>Показать решение</summary>

```swift
protocol Shape {
    var name: String { get }
    func area() -> Double
    func perimeter() -> Double
}

extension Shape {
    func describe() -> String {
        "\(name): площадь = \(area()), периметр = \(perimeter())"
    }
}

struct Circle: Shape {
    let radius: Double
    var name: String { "Круг" }

    func area() -> Double {
        .pi * radius * radius
    }

    func perimeter() -> Double {
        2 * .pi * radius
    }
}

struct Rectangle: Shape {
    let width: Double
    let height: Double
    var name: String { "Прямоугольник" }

    func area() -> Double {
        width * height
    }

    func perimeter() -> Double {
        2 * (width + height)
    }
}

struct Triangle: Shape {
    let a: Double, b: Double, c: Double
    var name: String { "Треугольник" }

    func area() -> Double {
        let s = (a + b + c) / 2
        return sqrt(s * (s - a) * (s - b) * (s - c))
    }

    func perimeter() -> Double {
        a + b + c
    }
}

let shapes: [Shape] = [
    Circle(radius: 5),
    Rectangle(width: 10, height: 5),
    Triangle(a: 3, b: 4, c: 5)
]

shapes.forEach { print($0.describe()) }
```
</details>

---

### Упражнение 6.2: Расширение Array

Добавьте к Array расширение с методами:
- `chunked(into size: Int)` — разбивает на подмассивы
- `shuffled()` — уже есть, но реализуйте `randomElement()`

<details>
<summary>Показать решение</summary>

```swift
extension Array {
    func chunked(into size: Int) -> [[Element]] {
        guard size > 0 else { return [] }

        return stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}

let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
print(numbers.chunked(into: 3))
// [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]

print(numbers.chunked(into: 4))
// [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]
```
</details>

---

### Упражнение 6.3: Codable модель

Создайте Codable модель для API ответа интернет-магазина:

```json
{
  "products": [
    {"id": 1, "name": "iPhone", "price": 999.99, "inStock": true},
    {"id": 2, "name": "MacBook", "price": 1999.99, "inStock": false}
  ],
  "total": 2
}
```

<details>
<summary>Показать решение</summary>

```swift
struct Product: Codable {
    let id: Int
    let name: String
    let price: Double
    let inStock: Bool
}

struct ProductsResponse: Codable {
    let products: [Product]
    let total: Int
}

let json = """
{
  "products": [
    {"id": 1, "name": "iPhone", "price": 999.99, "inStock": true},
    {"id": 2, "name": "MacBook", "price": 1999.99, "inStock": false}
  ],
  "total": 2
}
"""

let decoder = JSONDecoder()
if let data = json.data(using: .utf8),
   let response = try? decoder.decode(ProductsResponse.self, from: data) {
    print("Всего товаров: \(response.total)")
    for product in response.products {
        let status = product.inStock ? "В наличии" : "Нет в наличии"
        print("  \(product.name): $\(product.price) — \(status)")
    }
}
```
</details>

---

## Итоги главы

В этой главе вы узнали:

✅ Протоколы как контракты для типов

✅ Требования к свойствам, методам и инициализаторам

✅ Соответствие протоколам (struct, class, enum)

✅ Протоколы как типы и `any`/`some`

✅ Паттерн делегирования (Delegation)

✅ Расширения для добавления функциональности

✅ Protocol Extensions с реализацией по умолчанию

✅ Стандартные протоколы: Equatable, Comparable, Hashable, Codable

---

## Следующая глава

В [Главе 7](../07-Optionals/README.md) мы изучим опционалы и обработку ошибок — критически важные концепции для безопасного кода.
