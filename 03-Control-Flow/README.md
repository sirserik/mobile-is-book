# Глава 3: Управление потоком и коллекции

## Введение

В предыдущей главе мы научились хранить данные в переменных. Теперь пора научиться принимать решения и работать с группами данных. В этой главе мы изучим:

- Условные операторы (`if`, `else`, `switch`)
- Циклы (`for`, `while`, `repeat-while`)
- Коллекции (`Array`, `Dictionary`, `Set`)

---

## 3.1 Условные операторы

### if / else

Базовая конструкция для принятия решений:

```swift
let temperature = 25

if temperature > 30 {
    print("Жарко! Включите кондиционер.")
} else if temperature > 20 {
    print("Отличная погода!")
} else if temperature > 10 {
    print("Прохладно, возьмите куртку.")
} else {
    print("Холодно, оденьтесь теплее.")
}
// Выведет: "Отличная погода!"
```

### Множественные условия

```swift
let age = 25
let hasTicket = true

// AND (&&) — оба условия должны быть true
if age >= 18 && hasTicket {
    print("Добро пожаловать на концерт!")
}

// OR (||) — хотя бы одно условие должно быть true
let isVIP = false
let isEmployee = true

if isVIP || isEmployee {
    print("Проходите без очереди")
}

// Комбинирование условий
let isMember = true
let discount = 20

if (isMember && age >= 60) || discount >= 50 {
    print("Вы получаете специальную скидку!")
}
```

### Сравнение с JavaScript

```javascript
// JavaScript
if (age >= 18) {
    console.log("Взрослый");
}
```

```swift
// Swift — круглые скобки необязательны, но фигурные обязательны
if age >= 18 {
    print("Взрослый")
}

// Скобки можно добавить для читаемости
if (age >= 18) {
    print("Взрослый")
}
```

> **Важно**: В Swift фигурные скобки `{}` обязательны, даже для одной строки кода!

### guard — ранний выход

`guard` — это особый вид условия для раннего выхода из функции:

```swift
func processOrder(quantity: Int) {
    // guard требует выхода из функции, если условие НЕ выполнено
    guard quantity > 0 else {
        print("Ошибка: количество должно быть больше 0")
        return
    }

    guard quantity <= 100 else {
        print("Ошибка: максимальное количество — 100")
        return
    }

    // Если мы дошли сюда, оба условия выполнены
    print("Заказ на \(quantity) товаров принят")
}

processOrder(quantity: 5)   // "Заказ на 5 товаров принят"
processOrder(quantity: 0)   // "Ошибка: количество должно быть больше 0"
processOrder(quantity: 150) // "Ошибка: максимальное количество — 100"
```

### guard vs if

```swift
// ❌ Много вложенности с if
func validateUser(name: String?, age: Int?, email: String?) {
    if let name = name {
        if let age = age {
            if let email = email {
                print("Пользователь: \(name), \(age), \(email)")
            }
        }
    }
}

// ✅ Плоская структура с guard
func validateUserBetter(name: String?, age: Int?, email: String?) {
    guard let name = name else {
        print("Имя не указано")
        return
    }
    guard let age = age else {
        print("Возраст не указан")
        return
    }
    guard let email = email else {
        print("Email не указан")
        return
    }

    print("Пользователь: \(name), \(age), \(email)")
}
```

---

## 3.2 Switch

`switch` — мощная конструкция для проверки множества значений:

```swift
let dayNumber = 3

switch dayNumber {
case 1:
    print("Понедельник")
case 2:
    print("Вторник")
case 3:
    print("Среда")
case 4:
    print("Четверг")
case 5:
    print("Пятница")
case 6, 7:
    print("Выходные!")
default:
    print("Неизвестный день")
}
// Выведет: "Среда"
```

### Отличия от JavaScript

1. **Не нужен `break`** — в Swift автоматически выходит после выполнения case
2. **Обязателен `default`** — если не покрыты все возможные значения
3. **Нельзя пустой case** — каждый case должен содержать код

```swift
// ❌ Ошибка: пустой case
switch value {
case 1:
    // нужен хотя бы один statement
case 2:
    print("Два")
default:
    break
}

// ✅ Используйте break для пустого действия
switch value {
case 1:
    break  // ничего не делаем
case 2:
    print("Два")
default:
    break
}
```

### fallthrough

Если нужно "провалиться" в следующий case (как в JS без break):

```swift
let number = 5

switch number {
case 5:
    print("Пять")
    fallthrough
case 4:
    print("Четыре или меньше")
    fallthrough
default:
    print("Конец")
}
// Выведет:
// Пять
// Четыре или меньше
// Конец
```

### Switch с диапазонами

```swift
let score = 85

switch score {
case 0..<60:
    print("Неудовлетворительно")
case 60..<70:
    print("Удовлетворительно")
case 70..<85:
    print("Хорошо")
case 85...100:
    print("Отлично!")
default:
    print("Некорректная оценка")
}
// Выведет: "Отлично!"
```

### Switch со строками

```swift
let command = "start"

switch command.lowercased() {
case "start", "begin", "go":
    print("Запуск...")
case "stop", "end", "quit":
    print("Остановка...")
case "pause":
    print("Пауза")
default:
    print("Неизвестная команда: \(command)")
}
```

### Switch с where (условия)

```swift
let point = (x: 3, y: 3)

switch point {
case let (x, y) where x == y:
    print("Точка на диагонали: (\(x), \(y))")
case let (x, y) where x == -y:
    print("Точка на антидиагонали")
case let (x, 0):
    print("Точка на оси X: x = \(x)")
case let (0, y):
    print("Точка на оси Y: y = \(y)")
default:
    print("Обычная точка")
}
// Выведет: "Точка на диагонали: (3, 3)"
```

---

## 3.3 Циклы

### for-in (основной цикл)

```swift
// Итерация по диапазону
for i in 1...5 {
    print("Итерация \(i)")
}
// 1, 2, 3, 4, 5

// Если индекс не нужен — используйте _
for _ in 1...3 {
    print("Привет!")
}

// Итерация по массиву
let fruits = ["Яблоко", "Банан", "Апельсин"]
for fruit in fruits {
    print("Фрукт: \(fruit)")
}

// С индексом
for (index, fruit) in fruits.enumerated() {
    print("\(index + 1). \(fruit)")
}
// 1. Яблоко
// 2. Банан
// 3. Апельсин
```

### Диапазоны

```swift
// Закрытый диапазон (включает оба конца)
for i in 1...5 {
    print(i)  // 1, 2, 3, 4, 5
}

// Полуоткрытый диапазон (не включает верхнюю границу)
for i in 1..<5 {
    print(i)  // 1, 2, 3, 4
}

// Обратный порядок
for i in (1...5).reversed() {
    print(i)  // 5, 4, 3, 2, 1
}

// С шагом
for i in stride(from: 0, to: 10, by: 2) {
    print(i)  // 0, 2, 4, 6, 8
}

for i in stride(from: 10, through: 0, by: -2) {
    print(i)  // 10, 8, 6, 4, 2, 0
}
```

### while

Выполняется, пока условие true:

```swift
var countdown = 5

while countdown > 0 {
    print("\(countdown)...")
    countdown -= 1
}
print("Поехали!")
// 5... 4... 3... 2... 1... Поехали!
```

### repeat-while (аналог do-while)

Выполняется минимум один раз:

```swift
var number = 0

repeat {
    print("Число: \(number)")
    number += 1
} while number < 3
// Число: 0
// Число: 1
// Число: 2
```

### Управление циклом: break и continue

```swift
// break — полностью выходит из цикла
for i in 1...10 {
    if i == 5 {
        print("Достигли 5, выходим!")
        break
    }
    print(i)
}
// 1, 2, 3, 4, Достигли 5, выходим!

// continue — пропускает текущую итерацию
for i in 1...5 {
    if i == 3 {
        continue  // пропускаем 3
    }
    print(i)
}
// 1, 2, 4, 5
```

### Метки для вложенных циклов

```swift
outerLoop: for i in 1...3 {
    for j in 1...3 {
        if i == 2 && j == 2 {
            print("Нашли (2, 2), выходим из обоих циклов")
            break outerLoop
        }
        print("(\(i), \(j))")
    }
}
```

---

## 3.4 Массивы (Array)

Массив — упорядоченная коллекция однотипных элементов.

### Создание массивов

```swift
// Пустой массив
var emptyArray: [Int] = []
var anotherEmpty = [String]()
var yetAnother: Array<Double> = []

// Массив с начальными значениями
let numbers = [1, 2, 3, 4, 5]
let names = ["Анна", "Борис", "Виктор"]

// Массив с повторяющимися значениями
let zeros = Array(repeating: 0, count: 5)  // [0, 0, 0, 0, 0]
```

### Доступ к элементам

```swift
let fruits = ["Яблоко", "Банан", "Апельсин", "Манго"]

// По индексу (начинается с 0)
let first = fruits[0]   // "Яблоко"
let second = fruits[1]  // "Банан"

// Первый и последний элемент
let firstFruit = fruits.first  // Optional("Яблоко")
let lastFruit = fruits.last    // Optional("Манго")

// Срезы (возвращают ArraySlice, не Array)
let slice = fruits[1...2]  // ["Банан", "Апельсин"]

// Количество элементов
let count = fruits.count  // 4

// Проверка на пустоту
let isEmpty = fruits.isEmpty  // false
```

> **Важно**: Доступ к несуществующему индексу вызовет crash! Всегда проверяйте границы.

```swift
let array = [1, 2, 3]
// let value = array[10]  // ❌ CRASH!

// Безопасный доступ
if array.indices.contains(10) {
    let value = array[10]
}

// Или создайте extension (узнаем позже)
```

### Модификация массива

```swift
var shopping = ["Молоко", "Хлеб"]

// Добавление
shopping.append("Яйца")               // ["Молоко", "Хлеб", "Яйца"]
shopping += ["Сыр", "Масло"]          // ["Молоко", "Хлеб", "Яйца", "Сыр", "Масло"]
shopping.insert("Вода", at: 0)        // ["Вода", "Молоко", ...]

// Изменение
shopping[0] = "Минералка"             // Заменяем "Вода" на "Минералка"
shopping[1...2] = ["Кефир"]           // Заменяем диапазон одним элементом

// Удаление
let removed = shopping.removeLast()    // Удаляет и возвращает последний
shopping.removeFirst()                 // Удаляет первый
shopping.remove(at: 1)                 // Удаляет по индексу
shopping.removeAll()                   // Очищает массив

// Удаление по значению (если есть)
if let index = shopping.firstIndex(of: "Хлеб") {
    shopping.remove(at: index)
}
```

### Поиск в массиве

```swift
let numbers = [5, 2, 8, 1, 9, 3]

// Проверка наличия
let hasNine = numbers.contains(9)     // true
let hasTen = numbers.contains(10)     // false

// Поиск индекса
let indexOfEight = numbers.firstIndex(of: 8)  // Optional(2)

// Поиск по условию
let firstEven = numbers.first { $0 % 2 == 0 }     // Optional(2)
let firstBig = numbers.first { $0 > 7 }           // Optional(8)
let indexBig = numbers.firstIndex { $0 > 7 }      // Optional(2)
```

### Сортировка

```swift
var numbers = [5, 2, 8, 1, 9, 3]

// sorted() — возвращает новый отсортированный массив
let sortedAsc = numbers.sorted()              // [1, 2, 3, 5, 8, 9]
let sortedDesc = numbers.sorted(by: >)        // [9, 8, 5, 3, 2, 1]

// sort() — сортирует на месте
numbers.sort()                                 // numbers теперь [1, 2, 3, 5, 8, 9]
numbers.sort(by: >)                           // numbers теперь [9, 8, 5, 3, 2, 1]

// Сортировка строк
var names = ["Яна", "Анна", "Борис"]
names.sort()                                   // ["Анна", "Борис", "Яна"]
```

### Преобразование массивов

```swift
let numbers = [1, 2, 3, 4, 5]

// map — преобразует каждый элемент
let doubled = numbers.map { $0 * 2 }           // [2, 4, 6, 8, 10]
let strings = numbers.map { "Число \($0)" }    // ["Число 1", ...]

// filter — фильтрует по условию
let evens = numbers.filter { $0 % 2 == 0 }     // [2, 4]
let bigNumbers = numbers.filter { $0 > 3 }     // [4, 5]

// reduce — сворачивает в одно значение
let sum = numbers.reduce(0, +)                 // 15
let product = numbers.reduce(1, *)             // 120

// compactMap — map + удаление nil
let strings2 = ["1", "2", "три", "4"]
let parsed = strings2.compactMap { Int($0) }   // [1, 2, 4]

// flatMap — "разворачивает" вложенные массивы
let nested = [[1, 2], [3, 4], [5]]
let flat = nested.flatMap { $0 }               // [1, 2, 3, 4, 5]
```

### Цепочки операций

```swift
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

let result = numbers
    .filter { $0 % 2 == 0 }    // [2, 4, 6, 8, 10]
    .map { $0 * $0 }           // [4, 16, 36, 64, 100]
    .reduce(0, +)              // 220

print(result)  // 220
```

---

## 3.5 Словари (Dictionary)

Словарь — коллекция пар ключ-значение.

### Создание словарей

```swift
// Пустой словарь
var emptyDict: [String: Int] = [:]
var anotherEmpty = [String: Double]()

// Словарь с начальными значениями
let ages = ["Анна": 25, "Борис": 30, "Виктор": 35]
var scores: [String: Int] = ["Математика": 90, "Физика": 85]
```

### Доступ к значениям

```swift
var user = ["name": "Иван", "city": "Москва", "email": "ivan@mail.ru"]

// По ключу (возвращает Optional!)
let name = user["name"]              // Optional("Иван")
let age = user["age"]                // nil (ключа нет)

// Со значением по умолчанию
let country = user["country", default: "Россия"]  // "Россия"

// Все ключи и значения
let keys = Array(user.keys)          // ["name", "city", "email"]
let values = Array(user.values)      // ["Иван", "Москва", "ivan@mail.ru"]

// Количество пар
let count = user.count               // 3
```

### Модификация словаря

```swift
var inventory = ["Яблоки": 10, "Бананы": 5]

// Добавление/изменение
inventory["Апельсины"] = 8           // Добавляем новый ключ
inventory["Яблоки"] = 15             // Изменяем существующий

// updateValue возвращает старое значение
let oldValue = inventory.updateValue(20, forKey: "Бананы")  // Optional(5)

// Удаление
inventory["Апельсины"] = nil         // Удаляем по ключу
let removed = inventory.removeValue(forKey: "Бананы")  // Optional(20)
inventory.removeAll()                // Очищаем словарь
```

### Итерация по словарю

```swift
let capitals = ["Россия": "Москва", "Франция": "Париж", "Япония": "Токио"]

// По парам ключ-значение
for (country, capital) in capitals {
    print("Столица \(country) — \(capital)")
}

// Только по ключам
for country in capitals.keys {
    print(country)
}

// Только по значениям
for capital in capitals.values {
    print(capital)
}
```

### Практический пример

```swift
// Подсчёт слов в тексте
let text = "яблоко банан яблоко апельсин банан яблоко"
let words = text.split(separator: " ")

var wordCount: [String: Int] = [:]
for word in words {
    let wordString = String(word)
    wordCount[wordString, default: 0] += 1
}

print(wordCount)  // ["яблоко": 3, "банан": 2, "апельсин": 1]
```

---

## 3.6 Множества (Set)

Множество — неупорядоченная коллекция уникальных элементов.

### Создание множеств

```swift
// Пустое множество
var emptySet: Set<Int> = []
var anotherEmpty = Set<String>()

// Множество с начальными значениями
let numbers: Set = [1, 2, 3, 4, 5]
let letters: Set<Character> = ["a", "b", "c"]

// Из массива (дубликаты удаляются)
let array = [1, 2, 2, 3, 3, 3, 4]
let uniqueNumbers = Set(array)  // {1, 2, 3, 4}
```

### Операции с множествами

```swift
var fruits: Set = ["Яблоко", "Банан", "Апельсин"]

// Добавление
fruits.insert("Манго")        // (inserted: true, memberAfterInsert: "Манго")
fruits.insert("Яблоко")       // (inserted: false, ...) — уже есть

// Удаление
fruits.remove("Банан")        // Optional("Банан")
fruits.remove("Киви")         // nil — не было

// Проверка наличия
let hasApple = fruits.contains("Яблоко")  // true

// Количество
let count = fruits.count      // 3
```

### Операции над множествами

```swift
let a: Set = [1, 2, 3, 4, 5]
let b: Set = [4, 5, 6, 7, 8]

// Объединение (union)
let union = a.union(b)                    // {1, 2, 3, 4, 5, 6, 7, 8}

// Пересечение (intersection)
let intersection = a.intersection(b)      // {4, 5}

// Разность (subtracting)
let difference = a.subtracting(b)         // {1, 2, 3}

// Симметрическая разность
let symmetric = a.symmetricDifference(b)  // {1, 2, 3, 6, 7, 8}

// Проверки
let isSubset = a.isSubset(of: Set(1...10))      // true
let isSuperset = a.isSuperset(of: Set([1, 2]))  // true
let isDisjoint = a.isDisjoint(with: Set([6, 7])) // true (нет общих элементов)
```

### Когда использовать Set vs Array

| Характеристика | Array | Set |
|----------------|-------|-----|
| Порядок | Сохраняется | Не гарантирован |
| Дубликаты | Разрешены | Запрещены |
| Поиск contains() | O(n) | O(1) |
| Использование | Списки, очереди | Уникальные значения |

```swift
// ✅ Set — для проверки уникальных значений
let visitedPages: Set = ["/home", "/about", "/contact"]
if !visitedPages.contains("/login") {
    // страница не посещена
}

// ✅ Array — для упорядоченных данных
let browserHistory = ["/home", "/about", "/home", "/contact"]
// сохраняем порядок и дубликаты
```

---

## 3.7 Кортежи (Tuple)

Кортеж — группа значений, объединённых в одно составное значение.

### Создание кортежей

```swift
// Простой кортеж
let coordinates = (10.5, 20.3)
let person = ("Иван", 25, true)

// С именованными элементами
let user = (name: "Анна", age: 28, isActive: true)
```

### Доступ к элементам

```swift
let point = (x: 10, y: 20)

// По индексу
let xValue = point.0      // 10
let yValue = point.1      // 20

// По имени
let x = point.x           // 10
let y = point.y           // 20

// Деструктуризация
let (coordX, coordY) = point
print(coordX)             // 10
print(coordY)             // 20

// Игнорирование значений
let (onlyX, _) = point
print(onlyX)              // 10
```

### Использование кортежей

```swift
// Возврат нескольких значений из функции
func getMinMax(array: [Int]) -> (min: Int, max: Int)? {
    guard let min = array.min(), let max = array.max() else {
        return nil
    }
    return (min, max)
}

if let result = getMinMax(array: [5, 2, 8, 1, 9]) {
    print("Min: \(result.min), Max: \(result.max)")
}

// В switch
let httpStatus = (code: 404, message: "Not Found")

switch httpStatus {
case (200, _):
    print("Успех")
case (400..<500, let message):
    print("Ошибка клиента: \(message)")
case (500..<600, _):
    print("Ошибка сервера")
default:
    print("Неизвестный статус")
}
```

---

## 3.8 Операторы диапазона

### Виды диапазонов

```swift
// Закрытый диапазон (a...b) — включает оба конца
let closed = 1...5         // 1, 2, 3, 4, 5

// Полуоткрытый диапазон (a..<b) — не включает b
let halfOpen = 1..<5       // 1, 2, 3, 4

// Односторонние диапазоны
let array = [0, 1, 2, 3, 4, 5]
let fromSecond = array[2...]     // [2, 3, 4, 5]
let untilThird = array[..<3]     // [0, 1, 2]
let throughThird = array[...3]   // [0, 1, 2, 3]
```

### Проверка вхождения

```swift
let range = 1...100

if range.contains(50) {
    print("50 в диапазоне")
}

// Для строк
let letterRange = "a"..."z"
if letterRange.contains("m") {
    print("m — это буква")
}
```

---

## 3.9 Упражнения

### Упражнение 3.1: Условия

Напишите программу, которая определяет время суток по часу:
- 6-11: "Утро"
- 12-17: "День"
- 18-22: "Вечер"
- 23-5: "Ночь"

```swift
let hour = 14
// Ваш код здесь
```

<details>
<summary>Показать решение</summary>

```swift
let hour = 14

switch hour {
case 6...11:
    print("Утро")
case 12...17:
    print("День")
case 18...22:
    print("Вечер")
case 23, 0...5:
    print("Ночь")
default:
    print("Некорректный час")
}
```
</details>

---

### Упражнение 3.2: FizzBuzz

Классическая задача: для чисел от 1 до 30:
- Если делится на 3 — выведите "Fizz"
- Если делится на 5 — выведите "Buzz"
- Если делится на оба — выведите "FizzBuzz"
- Иначе — выведите число

```swift
// Ваш код здесь
```

<details>
<summary>Показать решение</summary>

```swift
for i in 1...30 {
    switch (i % 3 == 0, i % 5 == 0) {
    case (true, true):
        print("FizzBuzz")
    case (true, false):
        print("Fizz")
    case (false, true):
        print("Buzz")
    default:
        print(i)
    }
}
```
</details>

---

### Упражнение 3.3: Работа с массивом

Дан массив оценок студентов. Найдите:
1. Среднюю оценку
2. Количество отличников (оценка >= 90)
3. Минимальную и максимальную оценку

```swift
let grades = [85, 92, 78, 96, 88, 73, 91, 67, 89, 94]
// Ваш код здесь
```

<details>
<summary>Показать решение</summary>

```swift
let grades = [85, 92, 78, 96, 88, 73, 91, 67, 89, 94]

// Средняя оценка
let average = Double(grades.reduce(0, +)) / Double(grades.count)
print("Средняя оценка: \(average)")

// Количество отличников
let excellentCount = grades.filter { $0 >= 90 }.count
print("Отличников: \(excellentCount)")

// Мин и макс
if let min = grades.min(), let max = grades.max() {
    print("Минимум: \(min), Максимум: \(max)")
}
```
</details>

---

### Упражнение 3.4: Словарь

Создайте словарь "телефонная книга" и реализуйте:
1. Добавление контакта
2. Поиск номера по имени
3. Удаление контакта
4. Вывод всех контактов

```swift
var phoneBook: [String: String] = [:]
// Ваш код здесь
```

<details>
<summary>Показать решение</summary>

```swift
var phoneBook: [String: String] = [:]

// 1. Добавление контактов
phoneBook["Анна"] = "+7-900-111-22-33"
phoneBook["Борис"] = "+7-900-444-55-66"
phoneBook["Виктор"] = "+7-900-777-88-99"

// 2. Поиск
func findNumber(for name: String) {
    if let number = phoneBook[name] {
        print("\(name): \(number)")
    } else {
        print("Контакт '\(name)' не найден")
    }
}

findNumber(for: "Анна")    // Анна: +7-900-111-22-33
findNumber(for: "Галина")  // Контакт 'Галина' не найден

// 3. Удаление
phoneBook["Борис"] = nil

// 4. Вывод всех контактов
print("\nВсе контакты:")
for (name, number) in phoneBook {
    print("  \(name): \(number)")
}
```
</details>

---

### Упражнение 3.5: Множества

Даны два списка: посещённые города пользователем A и пользователем B.
Найдите:
1. Все посещённые города (любым из них)
2. Города, которые посетили оба
3. Города, которые посетил только A

```swift
let citiesA: Set = ["Москва", "Париж", "Лондон", "Рим", "Берлин"]
let citiesB: Set = ["Токио", "Париж", "Нью-Йорк", "Рим", "Сидней"]
// Ваш код здесь
```

<details>
<summary>Показать решение</summary>

```swift
let citiesA: Set = ["Москва", "Париж", "Лондон", "Рим", "Берлин"]
let citiesB: Set = ["Токио", "Париж", "Нью-Йорк", "Рим", "Сидней"]

// 1. Все города
let allCities = citiesA.union(citiesB)
print("Все города: \(allCities)")

// 2. Общие города
let commonCities = citiesA.intersection(citiesB)
print("Общие: \(commonCities)")

// 3. Только A
let onlyA = citiesA.subtracting(citiesB)
print("Только A: \(onlyA)")
```
</details>

---

### Упражнение 3.6: Корзина покупок

Создайте структуру корзины покупок с использованием словаря:

```swift
// Структура: [Название товара: (цена, количество)]
var cart: [String: (price: Double, quantity: Int)] = [:]

// Реализуйте:
// 1. Добавление товара
// 2. Изменение количества
// 3. Удаление товара
// 4. Подсчёт итоговой суммы
// 5. Вывод чека
```

<details>
<summary>Показать решение</summary>

```swift
var cart: [String: (price: Double, quantity: Int)] = [:]

// 1. Добавление товаров
cart["iPhone"] = (price: 999.0, quantity: 1)
cart["AirPods"] = (price: 199.0, quantity: 2)
cart["Чехол"] = (price: 29.0, quantity: 3)

// 2. Изменение количества
if var item = cart["AirPods"] {
    item.quantity = 3
    cart["AirPods"] = item
}

// 3. Удаление товара
cart["Чехол"] = nil

// 4. Подсчёт итоговой суммы
var total = 0.0
for (_, item) in cart {
    total += item.price * Double(item.quantity)
}

// 5. Вывод чека
print("=== ЧЕК ===")
for (name, item) in cart {
    let subtotal = item.price * Double(item.quantity)
    print("\(name): $\(item.price) x \(item.quantity) = $\(subtotal)")
}
print("ИТОГО: $\(total)")
```
</details>

---

## Итоги главы

В этой главе вы узнали:

✅ Условные операторы `if`, `else if`, `else`, `guard`

✅ Мощный оператор `switch` с диапазонами и условиями

✅ Циклы `for-in`, `while`, `repeat-while`

✅ Управление циклами: `break`, `continue`, метки

✅ Массивы и операции над ними: `map`, `filter`, `reduce`

✅ Словари для хранения пар ключ-значение

✅ Множества для уникальных значений и операций над ними

✅ Кортежи для группировки разнородных данных

✅ Операторы диапазона `...` и `..<`

---

## Следующая глава

В [Главе 4](../04-Functions/README.md) мы изучим функции и замыкания — ключевые инструменты для организации кода.

---

> **Совет**: Коллекции — это основа работы с данными. Убедитесь, что вы понимаете разницу между Array, Dictionary и Set, и когда использовать каждый из них.
