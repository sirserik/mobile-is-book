# Глава 4: Функции и замыкания

## Введение

Функции — это фундаментальный строительный блок любой программы. Они позволяют организовать код в переиспользуемые блоки. Замыкания (closures) — это анонимные функции, которые могут захватывать значения из окружающего контекста. В iOS разработке замыкания используются повсеместно.

---

## 4.1 Объявление функций

### Базовый синтаксис

```swift
// Функция без параметров и возвращаемого значения
func sayHello() {
    print("Привет!")
}

sayHello()  // Привет!

// Функция с параметрами
func greet(name: String) {
    print("Привет, \(name)!")
}

greet(name: "Анна")  // Привет, Анна!

// Функция с возвращаемым значением
func add(a: Int, b: Int) -> Int {
    return a + b
}

let sum = add(a: 5, b: 3)  // 8
```

### Сравнение с JavaScript

```javascript
// JavaScript
function greet(name) {
    return `Привет, ${name}!`;
}

const greetArrow = (name) => `Привет, ${name}!`;
```

```swift
// Swift
func greet(name: String) -> String {
    return "Привет, \(name)!"
}

// Или короче (implicit return)
func greet(name: String) -> String {
    "Привет, \(name)!"
}
```

### Неявный return

Если функция состоит из одного выражения, `return` можно опустить:

```swift
func square(_ n: Int) -> Int {
    n * n  // return подразумевается
}

func isEven(_ n: Int) -> Bool {
    n % 2 == 0
}

print(square(5))     // 25
print(isEven(4))     // true
```

---

## 4.2 Параметры и возвращаемые значения

### Несколько параметров

```swift
func createFullName(firstName: String, lastName: String) -> String {
    return "\(firstName) \(lastName)"
}

let name = createFullName(firstName: "Иван", lastName: "Петров")
print(name)  // Иван Петров
```

### Возврат нескольких значений (кортеж)

```swift
func getMinMax(numbers: [Int]) -> (min: Int, max: Int)? {
    guard let min = numbers.min(), let max = numbers.max() else {
        return nil
    }
    return (min, max)
}

if let result = getMinMax(numbers: [5, 2, 8, 1, 9]) {
    print("Минимум: \(result.min), Максимум: \(result.max)")
}
```

### Функции без возвращаемого значения

```swift
// Три эквивалентных способа
func logMessage(_ message: String) {
    print(message)
}

func logMessage2(_ message: String) -> Void {
    print(message)
}

func logMessage3(_ message: String) -> () {
    print(message)
}
```

---

## 4.3 Внешние и внутренние имена параметров

Swift позволяет задать два имени для параметра:
- **Внешнее имя** (argument label) — используется при вызове
- **Внутреннее имя** (parameter name) — используется внутри функции

### Оба имени

```swift
func greet(person name: String, from city: String) {
    // name и city — внутренние имена
    print("Привет, \(name) из города \(city)!")
}

// person и from — внешние имена
greet(person: "Анна", from: "Москва")
```

### Пропуск внешнего имени (_)

```swift
func multiply(_ a: Int, _ b: Int) -> Int {
    return a * b
}

// Вызов без меток
let result = multiply(5, 3)  // 15
```

### Когда какой стиль использовать

```swift
// ✅ С меткой — когда параметр неочевиден
func move(to point: CGPoint)
func send(message: String, to recipient: String)

// ✅ Без метки (_) — когда очевидно из названия функции
func print(_ items: Any...)
func abs(_ x: Int) -> Int
func max(_ a: Int, _ b: Int) -> Int

// ✅ Разные метки для читаемости
func insert(_ element: Int, at index: Int)
func replace(_ old: String, with new: String)
```

### Пример с разными стилями

```swift
// Читается как предложение: "copy item to folder"
func copy(_ item: String, to folder: String) {
    print("Копирую \(item) в \(folder)")
}

copy("file.txt", to: "Documents")

// Читается как: "calculate distance from point1 to point2"
func calculateDistance(from point1: CGPoint, to point2: CGPoint) -> Double {
    let dx = point2.x - point1.x
    let dy = point2.y - point1.y
    return sqrt(dx*dx + dy*dy)
}

let distance = calculateDistance(from: .zero, to: CGPoint(x: 3, y: 4))
```

---

## 4.4 Значения по умолчанию

```swift
func greet(name: String, greeting: String = "Привет") {
    print("\(greeting), \(name)!")
}

greet(name: "Иван")                      // Привет, Иван!
greet(name: "Иван", greeting: "Здравствуй")  // Здравствуй, Иван!

// Пример из реальной практики
func fetchData(
    from url: String,
    timeout: TimeInterval = 30.0,
    retries: Int = 3,
    useCache: Bool = true
) {
    print("Загрузка \(url), timeout: \(timeout), retries: \(retries), cache: \(useCache)")
}

fetchData(from: "https://api.example.com")
fetchData(from: "https://api.example.com", timeout: 60.0)
fetchData(from: "https://api.example.com", useCache: false)
```

---

## 4.5 Вариативные параметры (Variadic)

Функция может принимать произвольное количество аргументов одного типа:

```swift
func sum(_ numbers: Int...) -> Int {
    var total = 0
    for number in numbers {
        total += number
    }
    return total
}

print(sum(1, 2, 3))           // 6
print(sum(1, 2, 3, 4, 5))     // 15
print(sum())                   // 0

// Пример: функция print
func myPrint(_ items: Any..., separator: String = " ") {
    let output = items.map { "\($0)" }.joined(separator: separator)
    print(output)
}

myPrint("a", "b", "c")                    // a b c
myPrint("a", "b", "c", separator: "-")    // a-b-c
```

---

## 4.6 Параметры inout

По умолчанию параметры функции — константы. `inout` позволяет изменять переданное значение:

```swift
func doubleValue(_ number: inout Int) {
    number *= 2
}

var myNumber = 5
doubleValue(&myNumber)  // & обязателен при вызове
print(myNumber)         // 10

// Классический пример: swap
func swap(_ a: inout Int, _ b: inout Int) {
    let temp = a
    a = b
    b = temp
}

var x = 10
var y = 20
swap(&x, &y)
print("x: \(x), y: \(y)")  // x: 20, y: 10
```

> **Важно**: Swift уже имеет встроенную функцию `swapAt` для массивов и глобальную `swap(&a, &b)`.

---

## 4.7 Функции как типы

В Swift функции — это объекты первого класса. Их можно:
- Присваивать переменным
- Передавать как параметры
- Возвращать из функций

### Типы функций

```swift
// (Int, Int) -> Int — функция принимает два Int, возвращает Int
func add(_ a: Int, _ b: Int) -> Int { a + b }
func multiply(_ a: Int, _ b: Int) -> Int { a * b }

// Присваивание функции переменной
var mathFunction: (Int, Int) -> Int = add
print(mathFunction(3, 4))  // 7

mathFunction = multiply
print(mathFunction(3, 4))  // 12

// () -> Void — функция без параметров и возвращаемого значения
func sayHi() { print("Hi") }
let greeting: () -> Void = sayHi
greeting()  // Hi
```

### Функции как параметры

```swift
func apply(
    _ operation: (Int, Int) -> Int,
    to a: Int,
    and b: Int
) -> Int {
    return operation(a, b)
}

func add(_ a: Int, _ b: Int) -> Int { a + b }
func subtract(_ a: Int, _ b: Int) -> Int { a - b }

let result1 = apply(add, to: 10, and: 5)       // 15
let result2 = apply(subtract, to: 10, and: 5)  // 5
```

### Функции как возвращаемые значения

```swift
func makeMultiplier(factor: Int) -> (Int) -> Int {
    func multiplier(_ number: Int) -> Int {
        return number * factor
    }
    return multiplier
}

let double = makeMultiplier(factor: 2)
let triple = makeMultiplier(factor: 3)

print(double(5))   // 10
print(triple(5))   // 15
```

---

## 4.8 Замыкания (Closures)

Замыкание — это блок кода, который можно передавать и выполнять. По сути, это анонимная функция.

### Базовый синтаксис

```swift
// Полный синтаксис замыкания
let greet = { (name: String) -> String in
    return "Привет, \(name)!"
}

print(greet("Мир"))  // Привет, Мир!
```

### Структура замыкания

```
{ (параметры) -> ТипВозврата in
    // код
}
```

### Сравнение: функция vs замыкание

```swift
// Функция
func addFunc(_ a: Int, _ b: Int) -> Int {
    return a + b
}

// Замыкание
let addClosure = { (a: Int, b: Int) -> Int in
    return a + b
}

// Использование идентично
print(addFunc(2, 3))     // 5
print(addClosure(2, 3))  // 5
```

---

## 4.9 Сокращённый синтаксис замыканий

Swift позволяет постепенно сокращать синтаксис замыканий:

```swift
let numbers = [5, 2, 8, 1, 9]

// 1. Полный синтаксис
let sorted1 = numbers.sorted(by: { (a: Int, b: Int) -> Bool in
    return a < b
})

// 2. Вывод типов (убираем типы)
let sorted2 = numbers.sorted(by: { a, b in
    return a < b
})

// 3. Неявный return (убираем return)
let sorted3 = numbers.sorted(by: { a, b in a < b })

// 4. Сокращённые имена аргументов ($0, $1, ...)
let sorted4 = numbers.sorted(by: { $0 < $1 })

// 5. Оператор как замыкание
let sorted5 = numbers.sorted(by: <)

// Все варианты дают одинаковый результат: [1, 2, 5, 8, 9]
```

### Объяснение $0, $1, $2...

Swift автоматически присваивает имена аргументам замыкания:
- `$0` — первый аргумент
- `$1` — второй аргумент
- и так далее

```swift
let multiply = { $0 * $1 }  // (Int, Int) -> Int
print(multiply(3, 4))       // 12

let isPositive = { $0 > 0 }  // (Int) -> Bool
print(isPositive(5))         // true
print(isPositive(-3))        // false
```

---

## 4.10 Trailing Closure Syntax

Если замыкание — последний аргумент функции, его можно вынести за скобки:

```swift
let numbers = [1, 2, 3, 4, 5]

// Обычный синтаксис
let doubled1 = numbers.map({ $0 * 2 })

// Trailing closure
let doubled2 = numbers.map { $0 * 2 }

// Если замыкание — единственный аргумент, скобки можно убрать
let doubled3 = numbers.map { number in
    number * 2
}
```

### Несколько trailing closures

```swift
// UIView.animate имеет два замыкания
UIView.animate(withDuration: 0.3) {
    // анимация
    view.alpha = 0
} completion: { finished in
    // после завершения
    view.removeFromSuperview()
}
```

---

## 4.11 Захват значений (Capturing Values)

Замыкания могут захватывать и хранить ссылки на переменные из окружающего контекста:

```swift
func makeCounter() -> () -> Int {
    var count = 0

    let counter = {
        count += 1
        return count
    }

    return counter
}

let counter1 = makeCounter()
print(counter1())  // 1
print(counter1())  // 2
print(counter1())  // 3

let counter2 = makeCounter()
print(counter2())  // 1 (новый счётчик)
```

### Захват в цикле

```swift
var closures: [() -> Void] = []

for i in 1...3 {
    closures.append {
        print("Значение: \(i)")
    }
}

for closure in closures {
    closure()
}
// Значение: 1
// Значение: 2
// Значение: 3
```

> **Примечание**: В Swift каждая итерация цикла создаёт новую копию переменной, поэтому каждое замыкание захватывает своё значение. В JavaScript без `let` все замыкания ссылались бы на одну переменную.

---

## 4.12 @escaping замыкания

По умолчанию замыкания, переданные в функцию, не могут "сбежать" за пределы функции. Если замыкание вызывается после завершения функции, его нужно пометить `@escaping`:

```swift
// Non-escaping (по умолчанию) — вызывается сразу
func performOperation(_ operation: () -> Void) {
    operation()  // Вызывается внутри функции
}

// Escaping — вызывается позже
var completionHandlers: [() -> Void] = []

func addCompletionHandler(_ handler: @escaping () -> Void) {
    completionHandlers.append(handler)  // Сохраняем для вызова позже
}

// Пример с асинхронной операцией
func fetchData(completion: @escaping (String) -> Void) {
    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
        completion("Данные загружены")  // Вызывается после завершения функции
    }
}

fetchData { result in
    print(result)
}
```

### Когда нужен @escaping

- Асинхронные операции (сетевые запросы, таймеры)
- Сохранение замыкания в свойство
- Передача в другую @escaping функцию

---

## 4.13 @autoclosure

`@autoclosure` автоматически оборачивает выражение в замыкание:

```swift
// Без @autoclosure
func logIfTrue(_ condition: () -> Bool, message: String) {
    if condition() {
        print(message)
    }
}

logIfTrue({ 2 > 1 }, message: "Два больше одного")

// С @autoclosure
func logIfTrueAuto(_ condition: @autoclosure () -> Bool, message: String) {
    if condition() {
        print(message)
    }
}

logIfTrueAuto(2 > 1, message: "Два больше одного")  // Без фигурных скобок!
```

### Пример: assert

```swift
// assert использует @autoclosure для ленивого вычисления
assert(expensiveCheck(), "Ошибка!")  // expensiveCheck() вызовется только если нужно

// Своя реализация
func myAssert(_ condition: @autoclosure () -> Bool, _ message: String) {
    #if DEBUG
    if !condition() {
        fatalError(message)
    }
    #endif
}
```

---

## 4.14 Примеры из реальной практики

### Работа с массивами

```swift
let products = [
    (name: "iPhone", price: 999),
    (name: "MacBook", price: 1999),
    (name: "iPad", price: 799),
    (name: "AirPods", price: 199)
]

// Фильтрация
let expensive = products.filter { $0.price > 500 }
// [(name: "iPhone", price: 999), (name: "MacBook", price: 1999), (name: "iPad", price: 799)]

// Преобразование
let names = products.map { $0.name }
// ["iPhone", "MacBook", "iPad", "AirPods"]

// Сумма
let totalPrice = products.reduce(0) { $0 + $1.price }
// 3996

// Сортировка
let sortedByPrice = products.sorted { $0.price < $1.price }

// Цепочка операций
let result = products
    .filter { $0.price < 1000 }
    .map { "\($0.name): $\($0.price)" }
    .joined(separator: "\n")

print(result)
// iPhone: $999
// iPad: $799
// AirPods: $199
```

### Completion handlers

```swift
func downloadImage(from url: String, completion: @escaping (UIImage?) -> Void) {
    // Имитация асинхронной загрузки
    DispatchQueue.global().async {
        // ... загрузка ...
        let image: UIImage? = nil  // результат загрузки

        DispatchQueue.main.async {
            completion(image)
        }
    }
}

// Использование
downloadImage(from: "https://example.com/image.jpg") { image in
    if let image = image {
        print("Изображение загружено")
        // imageView.image = image
    } else {
        print("Ошибка загрузки")
    }
}
```

### Конфигурирующие замыкания

```swift
func configure<T>(_ object: T, using closure: (inout T) -> Void) -> T {
    var copy = object
    closure(&copy)
    return copy
}

let label = configure(UILabel()) { label in
    label.text = "Привет"
    label.textColor = .black
    label.font = .systemFont(ofSize: 16)
}
```

---

## 4.15 Упражнения

### Упражнение 4.1: Базовые функции

Напишите функции:
1. `square(_ n: Int) -> Int` — возвращает квадрат числа
2. `isEven(_ n: Int) -> Bool` — проверяет, чётное ли число
3. `greet(name: String, times: Int)` — выводит приветствие указанное количество раз

<details>
<summary>Показать решение</summary>

```swift
func square(_ n: Int) -> Int {
    n * n
}

func isEven(_ n: Int) -> Bool {
    n % 2 == 0
}

func greet(name: String, times: Int) {
    for _ in 1...times {
        print("Привет, \(name)!")
    }
}

print(square(5))       // 25
print(isEven(4))       // true
greet(name: "Мир", times: 3)
```
</details>

---

### Упражнение 4.2: Параметры по умолчанию

Создайте функцию `formatPrice`, которая форматирует цену:
- Параметр `amount: Double` — сумма
- Параметр `currency: String = "$"` — символ валюты
- Параметр `decimals: Int = 2` — количество знаков после запятой

```swift
// formatPrice(99.5) -> "$99.50"
// formatPrice(99.5, currency: "€") -> "€99.50"
// formatPrice(99.5, decimals: 0) -> "$100"
```

<details>
<summary>Показать решение</summary>

```swift
func formatPrice(
    _ amount: Double,
    currency: String = "$",
    decimals: Int = 2
) -> String {
    let formatted = String(format: "%.\(decimals)f", amount)
    return "\(currency)\(formatted)"
}

print(formatPrice(99.5))                      // $99.50
print(formatPrice(99.5, currency: "€"))       // €99.50
print(formatPrice(99.5, decimals: 0))         // $100
print(formatPrice(1234.567, currency: "₽", decimals: 1))  // ₽1234.6
```
</details>

---

### Упражнение 4.3: Функции высшего порядка

Используя `map`, `filter`, `reduce`, обработайте массив чисел:

```swift
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// 1. Получите массив квадратов всех чисел
// 2. Отфильтруйте только нечётные числа
// 3. Найдите сумму всех чисел
// 4. Найдите произведение чисел от 1 до 5
```

<details>
<summary>Показать решение</summary>

```swift
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// 1. Квадраты
let squares = numbers.map { $0 * $0 }
print(squares)  // [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

// 2. Нечётные
let odds = numbers.filter { $0 % 2 != 0 }
print(odds)  // [1, 3, 5, 7, 9]

// 3. Сумма
let sum = numbers.reduce(0, +)
print(sum)  // 55

// 4. Произведение 1-5
let product = numbers.prefix(5).reduce(1, *)
print(product)  // 120
```
</details>

---

### Упражнение 4.4: Замыкания

Напишите функцию `makeMultiplier`, которая возвращает функцию-умножитель:

```swift
let double = makeMultiplier(2)
let triple = makeMultiplier(3)

print(double(5))   // 10
print(triple(5))   // 15
```

<details>
<summary>Показать решение</summary>

```swift
func makeMultiplier(_ factor: Int) -> (Int) -> Int {
    return { number in
        number * factor
    }
}

// Или короче
func makeMultiplierShort(_ factor: Int) -> (Int) -> Int {
    { $0 * factor }
}

let double = makeMultiplier(2)
let triple = makeMultiplier(3)

print(double(5))   // 10
print(triple(5))   // 15
print(double(triple(4)))  // 24 (4 * 3 * 2)
```
</details>

---

### Упражнение 4.5: Обработка данных

Дан массив пользователей. Выполните операции с использованием замыканий:

```swift
struct User {
    let name: String
    let age: Int
    let isActive: Bool
}

let users = [
    User(name: "Анна", age: 28, isActive: true),
    User(name: "Борис", age: 35, isActive: false),
    User(name: "Виктор", age: 22, isActive: true),
    User(name: "Галина", age: 45, isActive: true),
    User(name: "Дмитрий", age: 31, isActive: false)
]

// 1. Получите имена всех активных пользователей
// 2. Найдите средний возраст
// 3. Отсортируйте по возрасту (от младшего к старшему)
// 4. Найдите самого старшего активного пользователя
```

<details>
<summary>Показать решение</summary>

```swift
struct User {
    let name: String
    let age: Int
    let isActive: Bool
}

let users = [
    User(name: "Анна", age: 28, isActive: true),
    User(name: "Борис", age: 35, isActive: false),
    User(name: "Виктор", age: 22, isActive: true),
    User(name: "Галина", age: 45, isActive: true),
    User(name: "Дмитрий", age: 31, isActive: false)
]

// 1. Имена активных
let activeNames = users
    .filter { $0.isActive }
    .map { $0.name }
print(activeNames)  // ["Анна", "Виктор", "Галина"]

// 2. Средний возраст
let averageAge = Double(users.reduce(0) { $0 + $1.age }) / Double(users.count)
print(averageAge)  // 32.2

// 3. Сортировка по возрасту
let sortedByAge = users.sorted { $0.age < $1.age }
print(sortedByAge.map { "\($0.name): \($0.age)" })

// 4. Самый старший активный
let oldestActive = users
    .filter { $0.isActive }
    .max { $0.age < $1.age }
print(oldestActive?.name ?? "Не найден")  // Галина
```
</details>

---

### Упражнение 4.6: Создание калькулятора

Создайте калькулятор с использованием функций как типов:

```swift
// Реализуйте функцию calculate, которая принимает:
// - два числа
// - операцию в виде функции

func calculate(_ a: Double, _ b: Double, operation: (Double, Double) -> Double) -> Double {
    // ваш код
}

// Использование:
// calculate(10, 5, operation: +)  // 15
// calculate(10, 5, operation: -)  // 5
// calculate(10, 5, operation: *)  // 50
// calculate(10, 5, operation: /)  // 2
```

<details>
<summary>Показать решение</summary>

```swift
func calculate(_ a: Double, _ b: Double, operation: (Double, Double) -> Double) -> Double {
    operation(a, b)
}

print(calculate(10, 5, operation: +))  // 15.0
print(calculate(10, 5, operation: -))  // 5.0
print(calculate(10, 5, operation: *))  // 50.0
print(calculate(10, 5, operation: /))  // 2.0

// Кастомная операция
let power: (Double, Double) -> Double = { pow($0, $1) }
print(calculate(2, 10, operation: power))  // 1024.0
```
</details>

---

## Итоги главы

В этой главе вы узнали:

✅ Как объявлять функции с параметрами и возвращаемыми значениями

✅ Внешние и внутренние имена параметров

✅ Параметры по умолчанию и вариативные параметры

✅ Параметры `inout` для изменения переданных значений

✅ Функции как типы первого класса

✅ Замыкания и их сокращённый синтаксис

✅ Trailing closure syntax

✅ Захват значений и `@escaping` замыкания

✅ Функции высшего порядка: `map`, `filter`, `reduce`

---

## Следующая глава

В [Главе 5](../05-OOP/README.md) мы изучим объектно-ориентированное программирование: классы, структуры и перечисления.

---

> **Совет**: Замыкания — один из самых важных концептов в Swift. Они используются повсеместно: в обработке массивов, асинхронных операциях, делегировании. Убедитесь, что вы понимаете их синтаксис и принцип работы.
