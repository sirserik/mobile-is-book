# Глава 8: Управление памятью (ARC)

## Введение

Управление памятью — критически важная тема для iOS разработки. В отличие от языков с garbage collector, Swift использует **ARC (Automatic Reference Counting)** — автоматический подсчёт ссылок. Понимание ARC поможет избежать утечек памяти и crashes.

---

## 8.1 Как работает память в Swift

### Value Types vs Reference Types

```swift
// VALUE TYPE (struct, enum) — копируется
struct Point {
    var x: Int
    var y: Int
}

var p1 = Point(x: 10, y: 20)
var p2 = p1  // Создаётся копия
p2.x = 100
print(p1.x)  // 10 — оригинал не изменился

// REFERENCE TYPE (class) — создаётся ссылка
class PointClass {
    var x: Int
    var y: Int

    init(x: Int, y: Int) {
        self.x = x
        self.y = y
    }
}

var pc1 = PointClass(x: 10, y: 20)
var pc2 = pc1  // Копируется ССЫЛКА, не объект
pc2.x = 100
print(pc1.x)  // 100 — изменился и оригинал
```

### Выделение памяти

- **Stack (стек)** — для value types, быстро, автоматически освобождается
- **Heap (куча)** — для reference types, медленнее, управляется ARC

---

## 8.2 Automatic Reference Counting (ARC)

ARC отслеживает количество ссылок на каждый объект. Когда count = 0, объект удаляется.

```swift
class Person {
    let name: String

    init(name: String) {
        self.name = name
        print("\(name) инициализирован")
    }

    deinit {
        print("\(name) деинициализирован")
    }
}

// Создаём объект — reference count = 1
var person1: Person? = Person(name: "Иван")
// Иван инициализирован

// Ещё одна ссылка — reference count = 2
var person2 = person1

// Убираем ссылку — reference count = 1
person1 = nil
// Объект ещё жив

// Убираем последнюю ссылку — reference count = 0
person2 = nil
// Иван деинициализирован
```

### Визуализация

```
var person1 = Person("Иван")

┌──────────┐         ┌──────────────┐
│ person1  │────────►│ Person       │  refCount: 1
└──────────┘         │ name: "Иван" │
                     └──────────────┘

var person2 = person1

┌──────────┐         ┌──────────────┐
│ person1  │────────►│ Person       │  refCount: 2
└──────────┘    ┌───►│ name: "Иван" │
┌──────────┐    │    └──────────────┘
│ person2  │────┘
└──────────┘

person1 = nil
                     ┌──────────────┐
                ┌───►│ Person       │  refCount: 1
┌──────────┐    │    │ name: "Иван" │
│ person2  │────┘    └──────────────┘
└──────────┘

person2 = nil
                     // Объект удалён  refCount: 0
```

---

## 8.3 Сильные ссылки (strong)

По умолчанию все ссылки — **strong** (сильные). Они увеличивают reference count.

```swift
class Apartment {
    let unit: String
    var tenant: Person?

    init(unit: String) {
        self.unit = unit
        print("Квартира \(unit) создана")
    }

    deinit {
        print("Квартира \(unit) освобождена")
    }
}

class Person {
    let name: String
    var apartment: Apartment?

    init(name: String) {
        self.name = name
        print("\(name) создан")
    }

    deinit {
        print("\(name) удалён")
    }
}

var john: Person? = Person(name: "John")
var unit4A: Apartment? = Apartment(unit: "4A")

// Создаём связь
john?.apartment = unit4A
unit4A?.tenant = john

// ⚠️ Циклическая ссылка!
// john → unit4A (strong)
// unit4A → john (strong)

john = nil    // Объект НЕ удалится!
unit4A = nil  // Объект НЕ удалится!

// 💥 УТЕЧКА ПАМЯТИ — объекты никогда не освободятся
```

---

## 8.4 Слабые ссылки (weak)

**weak** ссылка не увеличивает reference count. Автоматически становится `nil` при удалении объекта.

```swift
class Apartment {
    let unit: String
    weak var tenant: Person?  // weak!

    init(unit: String) {
        self.unit = unit
    }

    deinit {
        print("Квартира \(unit) освобождена")
    }
}

class Person {
    let name: String
    var apartment: Apartment?

    init(name: String) {
        self.name = name
    }

    deinit {
        print("\(name) удалён")
    }
}

var john: Person? = Person(name: "John")
var unit4A: Apartment? = Apartment(unit: "4A")

john?.apartment = unit4A
unit4A?.tenant = john

// Теперь:
// john → unit4A (strong)
// unit4A → john (WEAK)

john = nil
// John удалён
// unit4A?.tenant автоматически = nil

unit4A = nil
// Квартира 4A освобождена
```

### Правила weak

- Должен быть **Optional** (`var tenant: Person?`)
- Должен быть **var** (не let)
- Автоматически становится `nil`

---

## 8.5 Бесхозные ссылки (unowned)

**unowned** не увеличивает reference count, но **не становится nil** при удалении. Если объект удалён — crash!

```swift
class Customer {
    let name: String
    var card: CreditCard?

    init(name: String) {
        self.name = name
    }

    deinit {
        print("\(name) удалён")
    }
}

class CreditCard {
    let number: String
    unowned let customer: Customer  // unowned!

    init(number: String, customer: Customer) {
        self.number = number
        self.customer = customer
    }

    deinit {
        print("Карта \(number) удалена")
    }
}

var john: Customer? = Customer(name: "John")
john?.card = CreditCard(number: "1234-5678", customer: john!)

// john → card (strong)
// card → john (unowned)

john = nil
// John удалён
// Карта 1234-5678 удалена

// ✅ Нет утечки памяти!
```

### Когда использовать unowned vs weak

| Характеристика | weak | unowned |
|----------------|------|---------|
| Reference count | Не увеличивает | Не увеличивает |
| При удалении объекта | Становится nil | Crash! |
| Тип | Optional (?) | Non-optional |
| Используйте когда | Объект может быть nil | Объект точно существует |

```swift
// weak — когда связь может разорваться
class Person {
    weak var spouse: Person?  // Супруг может уйти
}

// unowned — когда связь гарантирована на время жизни
class CreditCard {
    unowned let customer: Customer  // Карта не может существовать без клиента
}
```

---

## 8.6 Циклы сильных ссылок

### Проблема

```swift
class ViewController {
    var onComplete: (() -> Void)?

    func doSomething() {
        onComplete = {
            // ⚠️ Захватывает self (strong)
            self.updateUI()
        }
    }

    func updateUI() {
        print("UI обновлён")
    }

    deinit {
        print("ViewController удалён")
    }
}

var vc: ViewController? = ViewController()
vc?.doSomething()
vc = nil  // ViewController НЕ удалится! 💥 Утечка памяти
```

### Диаграмма проблемы

```
┌──────────────────────┐
│   ViewController     │
│                      │
│   onComplete ────────┼──┐
│                      │  │
└───────────▲──────────┘  │
            │             │
            │  strong     │ strong
            │             │
            │  ┌──────────▼───────────┐
            └──│    Closure           │
               │  captures self       │
               └──────────────────────┘
```

---

## 8.7 Замыкания и захват значений

### [weak self]

```swift
class ViewController {
    var onComplete: (() -> Void)?

    func doSomething() {
        onComplete = { [weak self] in
            // self теперь Optional
            self?.updateUI()
        }
    }

    func updateUI() {
        print("UI обновлён")
    }

    deinit {
        print("ViewController удалён")
    }
}

var vc: ViewController? = ViewController()
vc?.doSomething()
vc = nil
// ViewController удалён ✅
```

### [weak self] с guard

```swift
class DataManager {
    var data: [String] = []

    func loadData() {
        NetworkService.fetch { [weak self] result in
            guard let self else { return }  // Swift 5.7+

            // self теперь strong внутри этого блока
            self.data = result
            self.processData()
            self.updateUI()
        }
    }
}
```

### [unowned self]

```swift
class HTMLElement {
    let name: String
    let text: String?

    // Замыкание гарантированно вызывается пока self жив
    lazy var asHTML: () -> String = { [unowned self] in
        if let text = self.text {
            return "<\(self.name)>\(text)</\(self.name)>"
        } else {
            return "<\(self.name) />"
        }
    }

    init(name: String, text: String? = nil) {
        self.name = name
        self.text = text
    }

    deinit {
        print("\(name) удалён")
    }
}

var heading: HTMLElement? = HTMLElement(name: "h1", text: "Привет")
print(heading!.asHTML())  // <h1>Привет</h1>
heading = nil             // h1 удалён
```

---

## 8.8 Capture List

Capture list позволяет контролировать, как замыкание захватывает значения:

```swift
class Counter {
    var count = 0

    func incrementer() -> () -> Int {
        // Захват по умолчанию — strong reference к self
        return { [weak self] in
            self?.count += 1
            return self?.count ?? 0
        }
    }
}

// Захват значения (не ссылки)
var x = 10
let closure = { [x] in
    print(x)  // Захвачено значение 10
}
x = 20
closure()  // Выведет 10, не 20

// Захват и переименование
let closure2 = { [capturedX = x] in
    print(capturedX)
}
```

---

## 8.9 Практические паттерны

### Паттерн 1: Delegate

```swift
protocol DataLoaderDelegate: AnyObject {
    func didLoadData(_ data: [String])
}

class DataLoader {
    weak var delegate: DataLoaderDelegate?  // Всегда weak!

    func load() {
        // Загрузка...
        delegate?.didLoadData(["item1", "item2"])
    }
}
```

### Паттерн 2: Completion Handler

```swift
class APIService {
    func fetchUser(completion: @escaping (User?) -> Void) {
        DispatchQueue.global().async {
            // Загрузка...
            let user = User(name: "John")

            DispatchQueue.main.async {
                completion(user)
            }
        }
    }
}

class ViewController {
    let api = APIService()

    func loadUser() {
        api.fetchUser { [weak self] user in
            guard let self else { return }
            self.displayUser(user)
        }
    }

    func displayUser(_ user: User?) {
        // ...
    }
}
```

### Паттерн 3: Timer

```swift
class TimerViewController {
    var timer: Timer?

    func startTimer() {
        timer = Timer.scheduledTimer(
            withTimeInterval: 1.0,
            repeats: true
        ) { [weak self] _ in
            self?.tick()
        }
    }

    func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    func tick() {
        print("Tick")
    }

    deinit {
        stopTimer()
        print("ViewController удалён")
    }
}
```

### Паттерн 4: NotificationCenter

```swift
class ObserverViewController {
    var observer: NSObjectProtocol?

    func setupObserver() {
        observer = NotificationCenter.default.addObserver(
            forName: .someNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            self?.handleNotification(notification)
        }
    }

    func handleNotification(_ notification: Notification) {
        // ...
    }

    deinit {
        if let observer = observer {
            NotificationCenter.default.removeObserver(observer)
        }
        print("ViewController удалён")
    }
}
```

---

## 8.10 Отладка утечек памяти

### Xcode Instruments

1. Product → Profile (⌘I)
2. Выберите "Leaks"
3. Запустите приложение
4. Instrument покажет утечки

### Debug Memory Graph

1. Запустите приложение в Debug
2. Нажмите кнопку "Debug Memory Graph" (⌥⌘M)
3. Изучите граф объектов

### Проверка в коде

```swift
class MyClass {
    init() {
        print("MyClass init")
    }

    deinit {
        print("MyClass deinit")  // Если не вызывается — утечка!
    }
}
```

---

## 8.11 Упражнения

### Упражнение 8.1: Найдите утечку

```swift
class Parent {
    var child: Child?
}

class Child {
    var parent: Parent?
}

var parent: Parent? = Parent()
var child: Child? = Child()

parent?.child = child
child?.parent = parent

parent = nil
child = nil
// Утечка? Как исправить?
```

<details>
<summary>Показать решение</summary>

```swift
class Parent {
    var child: Child?

    deinit { print("Parent deinit") }
}

class Child {
    weak var parent: Parent?  // weak!

    deinit { print("Child deinit") }
}

var parent: Parent? = Parent()
var child: Child? = Child()

parent?.child = child
child?.parent = parent

parent = nil  // Parent deinit
child = nil   // Child deinit
```
</details>

---

### Упражнение 8.2: Исправьте замыкание

```swift
class DataLoader {
    var onComplete: (() -> Void)?
    var data: [String] = []

    func load() {
        DispatchQueue.global().async {
            // Загрузка...
            self.data = ["loaded"]

            DispatchQueue.main.async {
                self.onComplete?()
            }
        }
    }
}
```

<details>
<summary>Показать решение</summary>

```swift
class DataLoader {
    var onComplete: (() -> Void)?
    var data: [String] = []

    func load() {
        DispatchQueue.global().async { [weak self] in
            guard let self else { return }

            // Загрузка...
            self.data = ["loaded"]

            DispatchQueue.main.async { [weak self] in
                self?.onComplete?()
            }
        }
    }

    deinit {
        print("DataLoader deinit")
    }
}
```
</details>

---

## Итоги главы

В этой главе вы узнали:

✅ Разницу между value types (stack) и reference types (heap)

✅ Как работает ARC — автоматический подсчёт ссылок

✅ Strong, weak и unowned ссылки

✅ Циклы сильных ссылок и как их избегать

✅ `[weak self]` и `[unowned self]` в замыканиях

✅ Практические паттерны (delegate, completion, timer)

✅ Отладка утечек памяти

---

## Следующая глава

В [Главе 9](../09-Generics/README.md) мы изучим Generics — мощный инструмент для написания гибкого и переиспользуемого кода.
