# Глава 7: Опционалы и обработка ошибок

## Введение

Опционалы (Optionals) — одна из ключевых особенностей Swift, обеспечивающая безопасность работы с отсутствующими значениями. Вместо null/undefined, которые могут вызвать crash, Swift заставляет явно обрабатывать случаи отсутствия значения.

---

## 7.1 Что такое Optional

Optional — это контейнер, который может содержать значение или `nil`.

```swift
// Обычная переменная — всегда имеет значение
var name: String = "Иван"
// name = nil  // ❌ Ошибка компиляции!

// Optional — может быть nil
var optionalName: String? = "Иван"
optionalName = nil  // ✅ Разрешено

// Декларация Optional
var age: Int? = 25
var email: String? = nil
var price: Double? = nil
```

### Как это работает

```swift
// String? — это сокращение для Optional<String>
var name1: String? = "Иван"
var name2: Optional<String> = "Иван"  // То же самое

// Optional — это enum
enum Optional<Wrapped> {
    case none           // nil
    case some(Wrapped)  // значение
}
```

### Сравнение с JavaScript

```javascript
// JavaScript — небезопасно
let user = null;
console.log(user.name);  // 💥 Runtime Error!

// Приходится проверять
if (user !== null && user !== undefined) {
    console.log(user.name);
}
```

```swift
// Swift — безопасно
var user: User? = nil
// print(user.name)  // ❌ Ошибка компиляции! Заставляет обработать nil
```

---

## 7.2 Принудительное извлечение (Force Unwrap)

Оператор `!` принудительно извлекает значение из Optional:

```swift
var name: String? = "Иван"
print(name!)  // "Иван"

// ⚠️ ОПАСНО! Если значение nil — программа упадёт
var empty: String? = nil
// print(empty!)  // 💥 Fatal error: Unexpectedly found nil
```

> **Правило**: Избегайте force unwrap (`!`) везде, где это возможно. Используйте его только когда вы **абсолютно уверены**, что значение не nil.

### Когда допустимо использовать !

```swift
// 1. В тестах
let value = try! JSONDecoder().decode(User.self, from: testData)

// 2. Когда 100% знаете, что значение есть
let image = UIImage(named: "icon")!  // Изображение есть в assets

// 3. IB Outlets (устанавливаются Interface Builder'ом)
@IBOutlet weak var titleLabel: UILabel!
```

---

## 7.3 Optional Binding

### if let

Безопасное извлечение значения:

```swift
var name: String? = "Иван"

if let unwrappedName = name {
    print("Привет, \(unwrappedName)!")  // unwrappedName — обычный String
} else {
    print("Имя не указано")
}

// Краткая форма (Swift 5.7+) — если имя совпадает
if let name {
    print("Привет, \(name)!")
}

// Множественные optional
var firstName: String? = "Иван"
var lastName: String? = "Петров"
var age: Int? = 25

if let firstName, let lastName, let age {
    print("\(firstName) \(lastName), \(age) лет")
}
```

### guard let

Ранний выход, если значение nil:

```swift
func greet(name: String?) {
    guard let name else {
        print("Имя не указано")
        return
    }

    // name теперь доступен как обычный String
    print("Привет, \(name)!")
}

greet(name: "Анна")   // Привет, Анна!
greet(name: nil)      // Имя не указано
```

### Разница между if let и guard let

```swift
// if let — используйте когда:
// - Обе ветки (есть значение / нет значения) равноценны
// - Нужно выполнить код только если значение есть

func process1(value: Int?) {
    if let value {
        print("Значение: \(value)")
    } else {
        print("Нет значения")
    }
    // Код продолжается в любом случае
}

// guard let — используйте когда:
// - Отсутствие значения — это ошибка или ранний выход
// - Нужно использовать значение далее в функции

func process2(value: Int?) {
    guard let value else {
        print("Ошибка: значение обязательно")
        return
    }

    // value доступен во всей оставшейся части функции
    print("Обработка: \(value)")
    print("Квадрат: \(value * value)")
}
```

---

## 7.4 Опциональная цепочка (Optional Chaining)

Позволяет безопасно обращаться к свойствам и методам Optional:

```swift
struct Address {
    var city: String
    var street: String
}

struct Person {
    var name: String
    var address: Address?
}

var person: Person? = Person(
    name: "Иван",
    address: Address(city: "Москва", street: "Ленина")
)

// Optional chaining с ?
let city = person?.address?.city  // Optional("Москва")
print(city ?? "Город не указан")  // "Москва"

// Если любое звено nil — результат nil
person?.address = nil
let city2 = person?.address?.city  // nil

person = nil
let city3 = person?.address?.city  // nil
```

### Вызов методов через цепочку

```swift
struct User {
    var name: String

    func greet() -> String {
        "Привет, \(name)!"
    }
}

var user: User? = User(name: "Анна")

// Результат — Optional<String>
let greeting = user?.greet()
print(greeting ?? "Нет приветствия")
```

### Присваивание через цепочку

```swift
struct Settings {
    var theme: String
}

class App {
    var settings: Settings?
}

var app: App? = App()
app?.settings = Settings(theme: "dark")  // Присвоится только если app не nil

app = nil
app?.settings = Settings(theme: "light")  // Ничего не произойдёт
```

---

## 7.5 Nil-Coalescing оператор (??)

Возвращает значение по умолчанию, если Optional — nil:

```swift
let name: String? = nil
let displayName = name ?? "Гость"
print(displayName)  // "Гость"

let age: Int? = 25
let displayAge = age ?? 0
print(displayAge)  // 25

// Цепочка ??
let primary: String? = nil
let secondary: String? = nil
let fallback: String = "По умолчанию"

let result = primary ?? secondary ?? fallback
print(result)  // "По умолчанию"
```

### Практические примеры

```swift
// Получение настроек
let fontSize = UserDefaults.standard.object(forKey: "fontSize") as? Int ?? 14

// Безопасный доступ к словарю
let config: [String: String] = ["theme": "dark"]
let theme = config["theme"] ?? "light"
let language = config["language"] ?? "ru"

// API ответ
struct APIResponse {
    var message: String?
    var errorCode: Int?
}

let response = APIResponse(message: nil, errorCode: 404)
let message = response.message ?? "Неизвестная ошибка"
```

---

## 7.6 Implicitly Unwrapped Optionals

Optional, который автоматически разворачивается при доступе:

```swift
// Обычный Optional
let name1: String? = "Иван"
print(name1!)  // Нужен !

// Implicitly Unwrapped Optional
let name2: String! = "Иван"
print(name2)   // Автоматически развернётся

// ⚠️ Но всё ещё упадёт, если nil
let empty: String! = nil
// print(empty)  // 💥 Crash!
```

### Когда использовать

```swift
// 1. IBOutlets — устанавливаются после init, но до использования
class ViewController: UIViewController {
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var submitButton: UIButton!
}

// 2. Двухфазная инициализация
class Game {
    var player: Player!

    init() {
        // player будет установлен позже
    }

    func start(with player: Player) {
        self.player = player
    }
}
```

> **Правило**: Избегайте `!` в типах. Используйте только в особых случаях (IBOutlet, двухфазная инициализация).

---

## 7.7 Обработка ошибок (Error Handling)

### Определение ошибок

```swift
enum NetworkError: Error {
    case invalidURL
    case noConnection
    case timeout
    case serverError(code: Int)
    case decodingFailed(description: String)
}

enum ValidationError: Error {
    case emptyField(fieldName: String)
    case invalidFormat(fieldName: String)
    case tooShort(fieldName: String, minLength: Int)
}
```

### Функции, бросающие ошибки (throws)

```swift
func fetchUser(id: Int) throws -> User {
    guard id > 0 else {
        throw NetworkError.invalidURL
    }

    // Имитация запроса
    let success = Bool.random()

    if success {
        return User(id: id, name: "User \(id)")
    } else {
        throw NetworkError.serverError(code: 500)
    }
}
```

### do-try-catch

```swift
do {
    let user = try fetchUser(id: 1)
    print("Получен пользователь: \(user.name)")
} catch NetworkError.invalidURL {
    print("Неверный URL")
} catch NetworkError.serverError(let code) {
    print("Ошибка сервера: \(code)")
} catch {
    print("Неизвестная ошибка: \(error)")
}
```

### try? и try!

```swift
// try? — возвращает nil при ошибке
let user1 = try? fetchUser(id: 1)  // Optional<User>

if let user = try? fetchUser(id: 1) {
    print("Пользователь: \(user.name)")
}

// try! — crash при ошибке (избегайте!)
let user2 = try! fetchUser(id: 1)  // User или 💥
```

### Проброс ошибок (rethrows)

```swift
func processUser(id: Int) throws -> String {
    let user = try fetchUser(id: id)  // Пробрасываем ошибку выше
    return user.name.uppercased()
}

// Вызывающий код должен обработать ошибку
do {
    let name = try processUser(id: 1)
    print(name)
} catch {
    print("Ошибка: \(error)")
}
```

### Функции с rethrows

```swift
func perform<T>(_ operation: () throws -> T) rethrows -> T {
    try operation()
}

// Если передаём не-throwing функцию — try не нужен
let result1 = perform { 42 }

// Если передаём throwing функцию — нужен try
let result2 = try perform { try fetchUser(id: 1) }
```

---

## 7.8 defer

`defer` откладывает выполнение кода до выхода из scope:

```swift
func processFile(name: String) throws {
    print("Открываем файл \(name)")

    defer {
        print("Закрываем файл \(name)")  // Выполнится в любом случае
    }

    // Работа с файлом...
    if name.isEmpty {
        throw NetworkError.invalidURL
    }

    print("Обрабатываем файл")
}

try? processFile(name: "data.txt")
// Открываем файл data.txt
// Обрабатываем файл
// Закрываем файл data.txt

try? processFile(name: "")
// Открываем файл
// Закрываем файл  <-- defer выполняется даже при ошибке
```

### Множественные defer

```swift
func multipleDefers() {
    defer { print("Первый defer") }
    defer { print("Второй defer") }
    defer { print("Третий defer") }

    print("Основной код")
}

multipleDefers()
// Основной код
// Третий defer  <-- LIFO порядок
// Второй defer
// Первый defer
```

---

## 7.9 Result тип

`Result` — это тип для представления успеха или ошибки:

```swift
enum Result<Success, Failure: Error> {
    case success(Success)
    case failure(Failure)
}

// Использование
func fetchData(from url: String) -> Result<Data, NetworkError> {
    guard !url.isEmpty else {
        return .failure(.invalidURL)
    }

    // Имитация успешного ответа
    let data = Data()
    return .success(data)
}

// Обработка
let result = fetchData(from: "https://api.example.com")

switch result {
case .success(let data):
    print("Получено \(data.count) байт")
case .failure(let error):
    print("Ошибка: \(error)")
}

// Или с get()
do {
    let data = try result.get()
    print("Данные: \(data)")
} catch {
    print("Ошибка: \(error)")
}
```

### Result в асинхронном коде

```swift
func fetchUser(id: Int, completion: @escaping (Result<User, NetworkError>) -> Void) {
    DispatchQueue.global().async {
        // Имитация сетевого запроса
        sleep(1)

        if id > 0 {
            let user = User(id: id, name: "User \(id)")
            completion(.success(user))
        } else {
            completion(.failure(.invalidURL))
        }
    }
}

// Использование
fetchUser(id: 1) { result in
    switch result {
    case .success(let user):
        print("Загружен: \(user.name)")
    case .failure(let error):
        print("Ошибка: \(error)")
    }
}
```

---

## 7.10 Практические примеры

### Пример 1: Валидация формы регистрации

```swift
struct RegistrationForm {
    var email: String?
    var password: String?
    var confirmPassword: String?
}

enum RegistrationError: Error, LocalizedError {
    case emptyEmail
    case invalidEmail
    case emptyPassword
    case passwordTooShort(minLength: Int)
    case passwordsDoNotMatch

    var errorDescription: String? {
        switch self {
        case .emptyEmail:
            return "Email не может быть пустым"
        case .invalidEmail:
            return "Неверный формат email"
        case .emptyPassword:
            return "Пароль не может быть пустым"
        case .passwordTooShort(let minLength):
            return "Пароль должен быть минимум \(minLength) символов"
        case .passwordsDoNotMatch:
            return "Пароли не совпадают"
        }
    }
}

func validate(_ form: RegistrationForm) throws {
    guard let email = form.email, !email.isEmpty else {
        throw RegistrationError.emptyEmail
    }

    guard email.contains("@") && email.contains(".") else {
        throw RegistrationError.invalidEmail
    }

    guard let password = form.password, !password.isEmpty else {
        throw RegistrationError.emptyPassword
    }

    guard password.count >= 8 else {
        throw RegistrationError.passwordTooShort(minLength: 8)
    }

    guard password == form.confirmPassword else {
        throw RegistrationError.passwordsDoNotMatch
    }
}

// Использование
let form = RegistrationForm(
    email: "test@example.com",
    password: "12345",
    confirmPassword: "12345"
)

do {
    try validate(form)
    print("Форма валидна!")
} catch let error as RegistrationError {
    print("Ошибка: \(error.errorDescription ?? "")")
} catch {
    print("Неизвестная ошибка")
}
```

### Пример 2: Безопасный парсинг JSON

```swift
struct Product: Codable {
    let id: Int
    let name: String
    let price: Double
    let description: String?
}

func parseProducts(from jsonString: String) -> Result<[Product], Error> {
    guard let data = jsonString.data(using: .utf8) else {
        return .failure(NetworkError.decodingFailed(description: "Invalid UTF-8"))
    }

    do {
        let products = try JSONDecoder().decode([Product].self, from: data)
        return .success(products)
    } catch {
        return .failure(error)
    }
}

let json = """
[
    {"id": 1, "name": "iPhone", "price": 999.99},
    {"id": 2, "name": "MacBook", "price": 1999.99, "description": "Мощный ноутбук"}
]
"""

switch parseProducts(from: json) {
case .success(let products):
    for product in products {
        let desc = product.description ?? "Нет описания"
        print("\(product.name): $\(product.price) — \(desc)")
    }
case .failure(let error):
    print("Ошибка парсинга: \(error)")
}
```

---

## 7.11 Упражнения

### Упражнение 7.1: Безопасное извлечение

Перепишите код, избавившись от force unwrap:

```swift
let numbers = ["1", "2", "three", "4"]
var sum = 0
for str in numbers {
    sum += Int(str)!  // Исправьте это
}
```

<details>
<summary>Показать решение</summary>

```swift
let numbers = ["1", "2", "three", "4"]
var sum = 0

for str in numbers {
    if let number = Int(str) {
        sum += number
    }
}
print(sum)  // 7

// Или одной строкой
let sum2 = numbers.compactMap { Int($0) }.reduce(0, +)
print(sum2)  // 7
```
</details>

---

### Упражнение 7.2: Optional chaining

Создайте структуры и используйте optional chaining:

```swift
struct Company {
    var name: String
    var ceo: Person?
}

struct Person {
    var name: String
    var email: String?
}

// Получите email CEO компании безопасно
```

<details>
<summary>Показать решение</summary>

```swift
struct Company {
    var name: String
    var ceo: Person?
}

struct Person {
    var name: String
    var email: String?
}

let company: Company? = Company(
    name: "Apple",
    ceo: Person(name: "Tim Cook", email: "tim@apple.com")
)

// Optional chaining
let ceoEmail = company?.ceo?.email
print(ceoEmail ?? "Email не указан")

// Или с guard
func printCEOEmail(company: Company?) {
    guard let email = company?.ceo?.email else {
        print("Email CEO недоступен")
        return
    }
    print("Email CEO: \(email)")
}

printCEOEmail(company: company)
```
</details>

---

### Упражнение 7.3: Обработка ошибок

Создайте функцию деления с обработкой ошибок:

```swift
enum MathError: Error {
    case divisionByZero
    case negativeNumber
}

// Реализуйте функцию divide, которая:
// - Бросает divisionByZero если делитель = 0
// - Бросает negativeNumber если любое число отрицательное
// - Возвращает результат деления
```

<details>
<summary>Показать решение</summary>

```swift
enum MathError: Error {
    case divisionByZero
    case negativeNumber
}

func divide(_ a: Double, by b: Double) throws -> Double {
    guard a >= 0 && b >= 0 else {
        throw MathError.negativeNumber
    }

    guard b != 0 else {
        throw MathError.divisionByZero
    }

    return a / b
}

// Тестирование
do {
    let result = try divide(10, by: 2)
    print("Результат: \(result)")
} catch MathError.divisionByZero {
    print("Ошибка: деление на ноль")
} catch MathError.negativeNumber {
    print("Ошибка: отрицательное число")
} catch {
    print("Неизвестная ошибка")
}

// С try?
let result1 = try? divide(10, by: 0)   // nil
let result2 = try? divide(10, by: 2)   // Optional(5.0)
let result3 = try? divide(-10, by: 2)  // nil
```
</details>

---

## Итоги главы

В этой главе вы узнали:

✅ Optional как безопасная альтернатива null

✅ Опасность force unwrap (`!`) и когда его можно использовать

✅ Optional binding: `if let` и `guard let`

✅ Optional chaining с `?.`

✅ Nil-coalescing оператор `??`

✅ Implicitly Unwrapped Optionals

✅ Обработка ошибок: `throws`, `try`, `catch`

✅ `defer` для гарантированного выполнения кода

✅ Тип `Result` для представления успеха/ошибки

---

## Следующая глава

В [Главе 8](../08-Memory/README.md) мы изучим управление памятью в Swift: ARC, сильные и слабые ссылки.
