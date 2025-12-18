# Глава 9: Generics и продвинутые типы

## Введение

Generics позволяют писать гибкий, переиспользуемый код, который работает с разными типами. Вместо того чтобы писать отдельные функции для Int, String, Double — пишем одну generic функцию.

---

## 9.1 Зачем нужны Generics

### Проблема без Generics

```swift
// Функция обмена для Int
func swapInts(_ a: inout Int, _ b: inout Int) {
    let temp = a
    a = b
    b = temp
}

// Функция обмена для String
func swapStrings(_ a: inout String, _ b: inout String) {
    let temp = a
    a = b
    b = temp
}

// Функция обмена для Double
func swapDoubles(_ a: inout Double, _ b: inout Double) {
    let temp = a
    a = b
    b = temp
}

// 😫 Дублирование кода!
```

### Решение с Generics

```swift
func swap<T>(_ a: inout T, _ b: inout T) {
    let temp = a
    a = b
    b = temp
}

var x = 10, y = 20
swap(&x, &y)
print(x, y)  // 20, 10

var s1 = "Hello", s2 = "World"
swap(&s1, &s2)
print(s1, s2)  // World, Hello
```

`T` — это **type parameter** (параметр типа). Компилятор подставит конкретный тип при вызове.

---

## 9.2 Generic функции

### Базовый синтаксис

```swift
func printValue<T>(_ value: T) {
    print("Значение: \(value)")
}

printValue(42)        // Значение: 42
printValue("Hello")   // Значение: Hello
printValue(3.14)      // Значение: 3.14
```

### Несколько type parameters

```swift
func makePair<T, U>(_ first: T, _ second: U) -> (T, U) {
    return (first, second)
}

let pair1 = makePair(1, "one")           // (Int, String)
let pair2 = makePair("name", true)       // (String, Bool)
let pair3 = makePair([1,2], ["a","b"])   // ([Int], [String])
```

### Generic с возвращаемым значением

```swift
func firstElement<T>(of array: [T]) -> T? {
    array.first
}

let numbers = [1, 2, 3]
let first = firstElement(of: numbers)  // Optional(1)

let strings = ["a", "b", "c"]
let firstStr = firstElement(of: strings)  // Optional("a")
```

---

## 9.3 Generic типы

### Generic struct

```swift
struct Stack<Element> {
    private var items: [Element] = []

    var isEmpty: Bool {
        items.isEmpty
    }

    var count: Int {
        items.count
    }

    mutating func push(_ item: Element) {
        items.append(item)
    }

    mutating func pop() -> Element? {
        items.popLast()
    }

    func peek() -> Element? {
        items.last
    }
}

var intStack = Stack<Int>()
intStack.push(1)
intStack.push(2)
intStack.push(3)
print(intStack.pop())  // Optional(3)

var stringStack = Stack<String>()
stringStack.push("Hello")
stringStack.push("World")
print(stringStack.peek())  // Optional("World")
```

### Generic class

```swift
class Box<T> {
    var value: T

    init(_ value: T) {
        self.value = value
    }
}

let intBox = Box(42)
let stringBox = Box("Hello")

print(intBox.value)     // 42
print(stringBox.value)  // Hello
```

### Generic enum

```swift
enum Result<Success, Failure: Error> {
    case success(Success)
    case failure(Failure)
}

enum NetworkError: Error {
    case notFound
    case serverError
}

let successResult: Result<String, NetworkError> = .success("Data loaded")
let failureResult: Result<String, NetworkError> = .failure(.notFound)
```

---

## 9.4 Ограничения типов (Type Constraints)

### Ограничение протоколом

```swift
// T должен соответствовать Comparable
func findMax<T: Comparable>(_ a: T, _ b: T) -> T {
    a > b ? a : b
}

print(findMax(10, 20))        // 20
print(findMax("abc", "xyz"))  // xyz

// ❌ Ошибка: тип должен быть Comparable
// findMax([1,2], [3,4])
```

### Ограничение классом

```swift
class Animal { }
class Dog: Animal { }
class Cat: Animal { }

func printAnimal<T: Animal>(_ animal: T) {
    print("Это животное типа \(type(of: animal))")
}

printAnimal(Dog())  // Это животное типа Dog
printAnimal(Cat())  // Это животное типа Cat
```

### Множественные ограничения

```swift
func process<T: Comparable & Hashable>(_ value: T) {
    print("Значение \(value) можно сравнивать и хэшировать")
}

// Или с where
func processItems<T, U>(item1: T, item2: U)
    where T: Comparable, U: Collection, U.Element == T {
    // ...
}
```

### where clause

```swift
func allItemsMatch<C1: Collection, C2: Collection>(
    _ collection1: C1,
    _ collection2: C2
) -> Bool where C1.Element == C2.Element, C1.Element: Equatable {
    guard collection1.count == collection2.count else {
        return false
    }

    for (item1, item2) in zip(collection1, collection2) {
        if item1 != item2 {
            return false
        }
    }

    return true
}

let array = [1, 2, 3]
let set: Set = [1, 2, 3]
print(allItemsMatch(array, Array(set)))  // зависит от порядка Set
```

---

## 9.5 Associated Types

Протокол может определить placeholder тип:

```swift
protocol Container {
    associatedtype Item

    var count: Int { get }
    mutating func append(_ item: Item)
    subscript(index: Int) -> Item { get }
}

struct IntStack: Container {
    typealias Item = Int  // Указываем конкретный тип

    private var items: [Int] = []

    var count: Int { items.count }

    mutating func append(_ item: Int) {
        items.append(item)
    }

    subscript(index: Int) -> Int {
        items[index]
    }
}

// Swift может вывести Item автоматически
struct GenericStack<Element>: Container {
    private var items: [Element] = []

    var count: Int { items.count }

    mutating func append(_ item: Element) {
        items.append(item)
    }

    subscript(index: Int) -> Element {
        items[index]
    }
}
```

### Ограничения для associated types

```swift
protocol SortableContainer {
    associatedtype Item: Comparable

    var items: [Item] { get set }
    func sorted() -> [Item]
}

extension SortableContainer {
    func sorted() -> [Item] {
        items.sorted()
    }
}
```

---

## 9.6 Typealias

### Простой alias

```swift
typealias Coordinates = (x: Double, y: Double)

func distance(from point1: Coordinates, to point2: Coordinates) -> Double {
    let dx = point2.x - point1.x
    let dy = point2.y - point1.y
    return sqrt(dx*dx + dy*dy)
}

let p1: Coordinates = (0, 0)
let p2: Coordinates = (3, 4)
print(distance(from: p1, to: p2))  // 5.0
```

### Alias для closure

```swift
typealias CompletionHandler = (Result<Data, Error>) -> Void
typealias DataCallback = ([String]) -> Void

func fetchData(completion: CompletionHandler) {
    // ...
}
```

### Generic typealias

```swift
typealias StringDictionary<T> = Dictionary<String, T>

var scores: StringDictionary<Int> = [:]
scores["Alice"] = 100
scores["Bob"] = 95
```

---

## 9.7 Opaque Types (some)

`some` скрывает конкретный тип, но гарантирует, что это всегда один и тот же тип.

```swift
protocol Shape {
    func draw() -> String
}

struct Circle: Shape {
    func draw() -> String { "○" }
}

struct Square: Shape {
    func draw() -> String { "□" }
}

// Возвращает КАКОЙ-ТО Shape (всегда один и тот же тип)
func makeShape() -> some Shape {
    Circle()  // Всегда Circle
}

let shape = makeShape()
print(shape.draw())  // ○
```

### some vs any

```swift
// some — compile-time, один конкретный тип
func getShape() -> some Shape {
    Circle()  // Всегда возвращает Circle
}

// any — runtime, может быть любой тип
func getAnyShape(useCircle: Bool) -> any Shape {
    if useCircle {
        return Circle()
    } else {
        return Square()
    }
}
```

---

## 9.8 Result тип подробнее

```swift
enum NetworkError: Error {
    case invalidURL
    case noData
    case decodingError(String)
}

func fetchUser(id: Int) -> Result<User, NetworkError> {
    guard id > 0 else {
        return .failure(.invalidURL)
    }

    // Имитация успеха
    return .success(User(id: id, name: "User \(id)"))
}

// Обработка
let result = fetchUser(id: 1)

switch result {
case .success(let user):
    print("Получен: \(user.name)")
case .failure(let error):
    print("Ошибка: \(error)")
}

// Методы Result
let user = try? result.get()  // User?
let mapped = result.map { $0.name }  // Result<String, NetworkError>
```

---

## 9.9 Практические примеры

### Пример 1: Generic Network Layer

```swift
protocol APIEndpoint {
    associatedtype Response: Decodable
    var path: String { get }
}

struct UsersEndpoint: APIEndpoint {
    typealias Response = [User]
    let path = "/users"
}

struct ProductsEndpoint: APIEndpoint {
    typealias Response = [Product]
    let path = "/products"
}

class APIClient {
    func fetch<E: APIEndpoint>(_ endpoint: E) async throws -> E.Response {
        let url = URL(string: "https://api.example.com\(endpoint.path)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(E.Response.self, from: data)
    }
}

// Использование
let client = APIClient()
// let users = try await client.fetch(UsersEndpoint())
// let products = try await client.fetch(ProductsEndpoint())
```

### Пример 2: Generic Repository

```swift
protocol Identifiable {
    var id: Int { get }
}

protocol Repository {
    associatedtype Entity: Identifiable

    func getAll() -> [Entity]
    func get(by id: Int) -> Entity?
    func save(_ entity: Entity)
    func delete(by id: Int)
}

class InMemoryRepository<T: Identifiable>: Repository {
    typealias Entity = T

    private var storage: [Int: T] = [:]

    func getAll() -> [T] {
        Array(storage.values)
    }

    func get(by id: Int) -> T? {
        storage[id]
    }

    func save(_ entity: T) {
        storage[entity.id] = entity
    }

    func delete(by id: Int) {
        storage.removeValue(forKey: id)
    }
}

// Использование
struct Product: Identifiable {
    let id: Int
    var name: String
}

let productRepo = InMemoryRepository<Product>()
productRepo.save(Product(id: 1, name: "iPhone"))
productRepo.save(Product(id: 2, name: "MacBook"))
print(productRepo.getAll())
```

---

## 9.10 Упражнения

### Упражнение 9.1: Generic Queue

Реализуйте generic структуру `Queue` (очередь) с методами `enqueue`, `dequeue`, `peek`.

<details>
<summary>Показать решение</summary>

```swift
struct Queue<Element> {
    private var elements: [Element] = []

    var isEmpty: Bool { elements.isEmpty }
    var count: Int { elements.count }

    mutating func enqueue(_ element: Element) {
        elements.append(element)
    }

    mutating func dequeue() -> Element? {
        isEmpty ? nil : elements.removeFirst()
    }

    func peek() -> Element? {
        elements.first
    }
}

var queue = Queue<Int>()
queue.enqueue(1)
queue.enqueue(2)
queue.enqueue(3)

print(queue.dequeue())  // Optional(1)
print(queue.peek())     // Optional(2)
```
</details>

---

### Упражнение 9.2: Generic функция фильтрации

Напишите generic функцию `filterItems`, которая фильтрует массив по условию.

<details>
<summary>Показать решение</summary>

```swift
func filterItems<T>(_ items: [T], where predicate: (T) -> Bool) -> [T] {
    var result: [T] = []
    for item in items {
        if predicate(item) {
            result.append(item)
        }
    }
    return result
}

let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
let evens = filterItems(numbers) { $0 % 2 == 0 }
print(evens)  // [2, 4, 6, 8, 10]

let names = ["Alice", "Bob", "Anna", "Alex"]
let aNames = filterItems(names) { $0.hasPrefix("A") }
print(aNames)  // ["Alice", "Anna", "Alex"]
```
</details>

---

## Итоги главы

В этой главе вы узнали:

✅ Зачем нужны Generics и как они решают проблему дублирования

✅ Generic функции и типы (struct, class, enum)

✅ Ограничения типов (type constraints) с протоколами и классами

✅ Associated types в протоколах

✅ Typealias для создания псевдонимов типов

✅ Opaque types (some) vs existential types (any)

✅ Практические паттерны: generic repository, network layer

---

## Следующая глава

В [Главе 10](../10-Concurrency/README.md) мы изучим многопоточность — GCD и async/await.
