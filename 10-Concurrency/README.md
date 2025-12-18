# Глава 10: Многопоточность

## Введение

Многопоточность позволяет выполнять несколько задач параллельно. В iOS это критически важно: тяжёлые операции (сеть, файлы, вычисления) должны выполняться в фоне, чтобы UI оставался отзывчивым.

---

## 10.1 Что такое многопоточность

### Main Thread (UI Thread)

- Главный поток — для работы с UI
- **Никогда** не блокируйте его тяжёлыми операциями
- Все обновления UI должны происходить на main thread

```swift
// ❌ ПЛОХО — блокируем UI
func loadData() {
    let data = heavyOperation()  // UI замрёт!
    updateUI(with: data)
}

// ✅ ХОРОШО — тяжёлая работа в фоне
func loadDataAsync() {
    DispatchQueue.global().async {
        let data = heavyOperation()  // В фоновом потоке

        DispatchQueue.main.async {
            updateUI(with: data)  // Обратно на main для UI
        }
    }
}
```

---

## 10.2 Grand Central Dispatch (GCD)

GCD — низкоуровневый API Apple для управления потоками.

### DispatchQueue

```swift
// Main queue — для UI
DispatchQueue.main.async {
    // Обновление UI
}

// Global queue — для фоновых задач
DispatchQueue.global().async {
    // Тяжёлая работа
}

// Собственная очередь
let customQueue = DispatchQueue(label: "com.myapp.queue")
customQueue.async {
    // Задача
}
```

### Quality of Service (QoS)

```swift
// Приоритеты (от высшего к низшему)
DispatchQueue.global(qos: .userInteractive).async {
    // Мгновенный отклик (анимации)
}

DispatchQueue.global(qos: .userInitiated).async {
    // Инициировано пользователем (загрузка при нажатии)
}

DispatchQueue.global(qos: .default).async {
    // По умолчанию
}

DispatchQueue.global(qos: .utility).async {
    // Длительные задачи (загрузка больших файлов)
}

DispatchQueue.global(qos: .background).async {
    // Фоновые задачи (синхронизация, бэкап)
}
```

### Sync vs Async

```swift
let queue = DispatchQueue(label: "com.myapp.queue")

// async — не ждёт завершения
queue.async {
    print("Async задача")
}
print("После async")  // Выполнится сразу

// sync — ждёт завершения
queue.sync {
    print("Sync задача")
}
print("После sync")  // Выполнится после задачи
```

> **Внимание**: Никогда не вызывайте `sync` на main queue из main queue — это вызовет deadlock!

### asyncAfter — отложенное выполнение

```swift
// Выполнить через 2 секунды
DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
    print("Прошло 2 секунды")
}

// С дробными секундами
DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
    print("Прошло 0.5 секунды")
}
```

---

## 10.3 Serial vs Concurrent Queues

### Serial Queue (последовательная)

Задачи выполняются одна за другой:

```swift
let serialQueue = DispatchQueue(label: "com.myapp.serial")

serialQueue.async { print("1") }
serialQueue.async { print("2") }
serialQueue.async { print("3") }
// Вывод всегда: 1, 2, 3
```

### Concurrent Queue (параллельная)

Задачи могут выполняться одновременно:

```swift
let concurrentQueue = DispatchQueue(
    label: "com.myapp.concurrent",
    attributes: .concurrent
)

concurrentQueue.async { print("1") }
concurrentQueue.async { print("2") }
concurrentQueue.async { print("3") }
// Вывод может быть: 2, 1, 3 или 1, 3, 2 и т.д.
```

---

## 10.4 DispatchGroup

Для ожидания завершения нескольких задач:

```swift
let group = DispatchGroup()

group.enter()
fetchUsers { users in
    print("Пользователи загружены")
    group.leave()
}

group.enter()
fetchProducts { products in
    print("Товары загружены")
    group.leave()
}

// Когда все задачи завершены
group.notify(queue: .main) {
    print("Всё загружено!")
    updateUI()
}
```

### С async методами

```swift
let group = DispatchGroup()
let queue = DispatchQueue.global()

group.enter()
queue.async {
    sleep(1)
    print("Задача 1 завершена")
    group.leave()
}

group.enter()
queue.async {
    sleep(2)
    print("Задача 2 завершена")
    group.leave()
}

group.wait()  // Блокирует до завершения всех
print("Все задачи завершены")
```

---

## 10.5 DispatchSemaphore

Контролирует количество одновременных задач:

```swift
let semaphore = DispatchSemaphore(value: 3)  // Максимум 3 одновременно
let queue = DispatchQueue.global()

for i in 1...10 {
    queue.async {
        semaphore.wait()  // Ждём разрешения
        print("Начало задачи \(i)")
        sleep(2)  // Работа
        print("Конец задачи \(i)")
        semaphore.signal()  // Освобождаем слот
    }
}
```

---

## 10.6 Async/Await (Swift Concurrency)

Современный способ работы с асинхронным кодом (Swift 5.5+).

### Базовый синтаксис

```swift
// Асинхронная функция
func fetchUser() async -> User {
    // Имитация сетевого запроса
    try? await Task.sleep(nanoseconds: 1_000_000_000)
    return User(name: "John")
}

// Вызов
func loadData() async {
    let user = await fetchUser()
    print(user.name)
}

// Запуск из синхронного кода
Task {
    await loadData()
}
```

### Throws + Async

```swift
func fetchData() async throws -> Data {
    let url = URL(string: "https://api.example.com/data")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return data
}

// Вызов
Task {
    do {
        let data = try await fetchData()
        print("Получено \(data.count) байт")
    } catch {
        print("Ошибка: \(error)")
    }
}
```

### Последовательное выполнение

```swift
func loadAllData() async throws {
    let user = try await fetchUser()      // Ждём
    let products = try await fetchProducts()  // Потом это
    let orders = try await fetchOrders()      // Потом это

    updateUI(user: user, products: products, orders: orders)
}
```

### Параллельное выполнение (async let)

```swift
func loadAllDataParallel() async throws {
    // Запускаем параллельно
    async let user = fetchUser()
    async let products = fetchProducts()
    async let orders = fetchOrders()

    // Ждём все результаты
    let (u, p, o) = try await (user, products, orders)
    updateUI(user: u, products: p, orders: o)
}
```

---

## 10.7 Task и TaskGroup

### Task

```swift
// Создание задачи
let task = Task {
    let result = await fetchData()
    return result
}

// Получение результата
let data = await task.value

// Отмена задачи
task.cancel()

// Проверка отмены
Task {
    for i in 1...100 {
        guard !Task.isCancelled else {
            print("Задача отменена")
            return
        }
        print("Итерация \(i)")
    }
}
```

### TaskGroup

```swift
func fetchAllUsers(ids: [Int]) async -> [User] {
    await withTaskGroup(of: User?.self) { group in
        for id in ids {
            group.addTask {
                try? await fetchUser(id: id)
            }
        }

        var users: [User] = []
        for await user in group {
            if let user = user {
                users.append(user)
            }
        }
        return users
    }
}
```

### ThrowingTaskGroup

```swift
func fetchAllUsersOrFail(ids: [Int]) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        for id in ids {
            group.addTask {
                try await fetchUser(id: id)
            }
        }

        var users: [User] = []
        for try await user in group {
            users.append(user)
        }
        return users
    }
}
```

---

## 10.8 Actor

Actor — изолированный тип для безопасной работы с данными из нескольких потоков.

```swift
actor BankAccount {
    private var balance: Double = 0

    func deposit(_ amount: Double) {
        balance += amount
    }

    func withdraw(_ amount: Double) -> Bool {
        guard balance >= amount else { return false }
        balance -= amount
        return true
    }

    func getBalance() -> Double {
        balance
    }
}

// Использование
let account = BankAccount()

Task {
    await account.deposit(100)
    let success = await account.withdraw(30)
    let balance = await account.getBalance()
    print("Баланс: \(balance)")  // 70
}
```

### @MainActor

Гарантирует выполнение на main thread:

```swift
@MainActor
class ViewModel {
    var items: [String] = []

    func loadItems() async {
        let data = await fetchData()
        items = data  // Безопасно — мы на main thread
    }
}

// Или для отдельного метода
class DataManager {
    @MainActor
    func updateUI() {
        // Гарантированно на main thread
    }
}
```

---

## 10.9 Практические примеры

### Пример 1: Загрузка изображения

```swift
class ImageLoader {
    func loadImage(from urlString: String) async throws -> UIImage {
        guard let url = URL(string: urlString) else {
            throw URLError(.badURL)
        }

        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        guard let image = UIImage(data: data) else {
            throw URLError(.cannotDecodeContentData)
        }

        return image
    }
}

// Использование в ViewController
class ImageViewController: UIViewController {
    let imageLoader = ImageLoader()
    let imageView = UIImageView()

    func loadImage() {
        Task {
            do {
                let image = try await imageLoader.loadImage(
                    from: "https://example.com/image.jpg"
                )
                imageView.image = image
            } catch {
                print("Ошибка: \(error)")
            }
        }
    }
}
```

### Пример 2: Параллельная загрузка

```swift
class ProductService {
    func loadProductDetails(id: Int) async throws -> ProductDetails {
        async let product = fetchProduct(id: id)
        async let reviews = fetchReviews(productId: id)
        async let recommendations = fetchRecommendations(productId: id)

        return try await ProductDetails(
            product: product,
            reviews: reviews,
            recommendations: recommendations
        )
    }

    private func fetchProduct(id: Int) async throws -> Product { ... }
    private func fetchReviews(productId: Int) async throws -> [Review] { ... }
    private func fetchRecommendations(productId: Int) async throws -> [Product] { ... }
}
```

### Пример 3: Кэширование с Actor

```swift
actor ImageCache {
    private var cache: [URL: UIImage] = [:]

    func image(for url: URL) -> UIImage? {
        cache[url]
    }

    func setImage(_ image: UIImage, for url: URL) {
        cache[url] = image
    }

    func clear() {
        cache.removeAll()
    }
}

class CachedImageLoader {
    private let cache = ImageCache()

    func loadImage(from url: URL) async throws -> UIImage {
        // Проверяем кэш
        if let cached = await cache.image(for: url) {
            return cached
        }

        // Загружаем
        let (data, _) = try await URLSession.shared.data(from: url)
        guard let image = UIImage(data: data) else {
            throw URLError(.cannotDecodeContentData)
        }

        // Сохраняем в кэш
        await cache.setImage(image, for: url)

        return image
    }
}
```

---

## 10.10 Упражнения

### Упражнение 10.1: GCD

Напишите функцию, которая загружает данные в фоне и обновляет UI на main thread.

<details>
<summary>Показать решение</summary>

```swift
func fetchAndDisplay() {
    DispatchQueue.global(qos: .userInitiated).async {
        // Имитация загрузки
        let data = ["Item 1", "Item 2", "Item 3"]
        sleep(2)

        DispatchQueue.main.async {
            // Обновление UI
            print("Загружено: \(data)")
            // tableView.reloadData()
        }
    }
}
```
</details>

---

### Упражнение 10.2: Async/Await

Перепишите с использованием async/await:

```swift
func loadData(completion: @escaping ([String]) -> Void) {
    DispatchQueue.global().async {
        sleep(1)
        let data = ["a", "b", "c"]
        DispatchQueue.main.async {
            completion(data)
        }
    }
}
```

<details>
<summary>Показать решение</summary>

```swift
func loadData() async -> [String] {
    try? await Task.sleep(nanoseconds: 1_000_000_000)
    return ["a", "b", "c"]
}

// Использование
Task { @MainActor in
    let data = await loadData()
    print("Загружено: \(data)")
}
```
</details>

---

## Итоги главы

В этой главе вы узнали:

✅ Почему важна многопоточность и что такое main thread

✅ GCD: DispatchQueue, QoS, sync/async

✅ DispatchGroup для ожидания нескольких задач

✅ Async/await — современный подход к асинхронности

✅ Task и TaskGroup для управления задачами

✅ Actor для безопасной работы с данными

✅ @MainActor для гарантии выполнения на UI потоке

---

## Следующая глава

В [Главе 11](../11-UIKit-Basics/README.md) мы начнём изучать UIKit — фреймворк для создания пользовательских интерфейсов.
