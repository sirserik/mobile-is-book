# Глава 15: Модуль аутентификации

## Введение

В этой главе мы создадим полный модуль аутентификации по архитектуре VIPER:
- **AuthManager** — менеджер авторизации Firebase
- **Onboarding** — приветственные экраны при первом запуске
- **Login** — вход с email/password и Google
- **SignUp** — регистрация нового пользователя

> **Аналогия с веб:** Это как создание auth middleware в Express.js + страницы /login, /register с OAuth.

---

## 15.1 AuthManager — Сердце авторизации

AuthManager инкапсулирует всю логику работы с Firebase Authentication.

```swift
// Managers/AuthManager/AuthManager.swift

import Foundation
import FirebaseAuth
import FirebaseCore
import GoogleSignIn

// MARK: - Protocol
/// Протокол определяет контракт для менеджера авторизации
/// Позволяет подменять реализацию для тестов
protocol AuthManagerProtocol {
    /// Вход с email и паролем
    func login(email: String, password: String, completion: @escaping (Result<Void, FirebaseError>) -> Void)

    /// Регистрация нового пользователя
    func signUp(email: String, password: String, completion: @escaping (Result<Void, FirebaseError>) -> Void)

    /// Сброс пароля
    func resetPassword(with email: String, completion: @escaping (Result<Void, FirebaseError>) -> Void)

    /// Выход из аккаунта
    func signOut(completion: (Result<Void, FirebaseError>) -> Void)

    /// Вход через Google
    func signInWithGoogle(presenting viewController: UIViewController, completion: @escaping (Result<Void, FirebaseError>) -> Void)
}

// MARK: - Implementation
/// Реализация менеджера авторизации с Firebase
final class AuthManager: AuthManagerProtocol {

    // MARK: - Properties
    /// Ссылка на Firebase Auth
    /// Auth.auth() — singleton Firebase Authentication
    private let auth = Auth.auth()

    // MARK: - Login
    /// Вход с email и паролем
    ///
    /// Процесс:
    /// 1. Firebase проверяет email/password
    /// 2. При успехе проверяем верификацию email
    /// 3. Если email не подтверждён — отправляем письмо повторно
    ///
    /// - Parameters:
    ///   - email: Email пользователя
    ///   - password: Пароль
    ///   - completion: Result с успехом или ошибкой
    func login(email: String, password: String, completion: @escaping (Result<Void, FirebaseError>) -> Void) {

        // signIn — метод Firebase для входа
        // Аналог: fetch('/api/auth/login', { method: 'POST', body: { email, password } })
        auth.signIn(withEmail: email, password: password) { [weak self] authResult, error in

            // Проверяем ошибку
            if let _ = error {
                completion(.failure(.loginError))
                return
            }

            // Проверяем, подтверждён ли email
            // isEmailVerified — флаг Firebase
            guard let isEmailVerified = authResult?.user.isEmailVerified else {
                completion(.failure(.loginError))
                return
            }

            if isEmailVerified {
                // Email подтверждён — успешный вход
                completion(.success(()))
            } else {
                // Email не подтверждён — отправляем письмо повторно
                self?.sendVerificationEmail(completion: { result in
                    switch result {
                    case .success:
                        // Письмо отправлено, но вход не выполняем
                        completion(.failure(.emailNotVerified))
                    case .failure:
                        completion(.failure(.sendEmailError))
                    }
                })
            }
        }
    }

    // MARK: - Sign Up
    /// Регистрация нового пользователя
    ///
    /// Процесс:
    /// 1. Создаём пользователя в Firebase
    /// 2. Отправляем email для верификации
    /// 3. Выходим из аккаунта (пользователь должен подтвердить email перед входом)
    ///
    /// - Parameters:
    ///   - email: Email для регистрации
    ///   - password: Пароль (минимум 6 символов для Firebase)
    ///   - completion: Result с успехом или ошибкой
    func signUp(email: String, password: String, completion: @escaping (Result<Void, FirebaseError>) -> Void) {

        // createUser — создание нового пользователя в Firebase
        auth.createUser(withEmail: email, password: password) { [weak self] _, error in

            if let _ = error {
                completion(.failure(.signUpError))
                return
            }

            // Отправляем письмо для подтверждения email
            self?.sendVerificationEmail(completion: { result in
                switch result {
                case .success:
                    // Выходим из аккаунта после регистрации
                    // Пользователь должен подтвердить email и войти заново
                    try? self?.auth.signOut()
                    completion(.success(()))

                case .failure:
                    completion(.failure(.sendEmailError))
                }
            })
        }
    }

    // MARK: - Send Verification Email
    /// Отправка письма для верификации email
    private func sendVerificationEmail(completion: @escaping (Result<Void, FirebaseError>) -> Void) {

        // currentUser — текущий авторизованный пользователь
        auth.currentUser?.sendEmailVerification(completion: { error in
            if let _ = error {
                completion(.failure(.sendEmailError))
            } else {
                completion(.success(()))
            }
        })
    }

    // MARK: - Reset Password
    /// Сброс пароля по email
    ///
    /// Firebase отправляет письмо со ссылкой для сброса пароля
    func resetPassword(with email: String, completion: @escaping (Result<Void, FirebaseError>) -> Void) {

        auth.sendPasswordReset(withEmail: email) { error in
            if let _ = error {
                completion(.failure(.passwordResetError))
            } else {
                completion(.success(()))
            }
        }
    }

    // MARK: - Sign Out
    /// Выход из аккаунта
    func signOut(completion: (Result<Void, FirebaseError>) -> Void) {
        do {
            try auth.signOut()

            // Также выходим из Google (если вошли через Google)
            GIDSignIn.sharedInstance.signOut()

            completion(.success(()))
        } catch {
            completion(.failure(.signOutError))
        }
    }

    // MARK: - Google Sign In
    /// Вход через Google
    ///
    /// Процесс:
    /// 1. Открываем Google Sign-In UI
    /// 2. Пользователь выбирает аккаунт
    /// 3. Получаем токены от Google
    /// 4. Обмениваем токены на Firebase credential
    /// 5. Входим в Firebase с Google credential
    ///
    /// - Parameters:
    ///   - viewController: ViewController для показа Google UI
    ///   - completion: Result с успехом или ошибкой
    func signInWithGoogle(presenting viewController: UIViewController, completion: @escaping (Result<Void, FirebaseError>) -> Void) {

        // 1. Получаем Client ID из Firebase конфигурации
        guard let clientID = FirebaseApp.app()?.options.clientID else {
            completion(.failure(.googleSignInFailed))
            return
        }

        // 2. Настраиваем Google Sign-In
        let config = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = config

        // 3. Показываем Google Sign-In UI
        GIDSignIn.sharedInstance.signIn(withPresenting: viewController) { result, error in

            if let _ = error {
                completion(.failure(.googleSignInFailed))
                return
            }

            // 4. Получаем данные от Google
            guard let user = result?.user,
                  let idToken = user.idToken?.tokenString else {
                completion(.failure(.googleSignInFailed))
                return
            }

            // 5. Создаём Firebase credential из Google токенов
            // Это связывает Google аккаунт с Firebase
            let credential = GoogleAuthProvider.credential(
                withIDToken: idToken,
                accessToken: user.accessToken.tokenString
            )

            // 6. Входим в Firebase с Google credential
            Auth.auth().signIn(with: credential) { _, error in
                if let _ = error {
                    completion(.failure(.googleSignInFailed))
                } else {
                    completion(.success(()))
                }
            }
        }
    }
}
```

### Диаграмма потока авторизации

```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    Email/Password    ┌──────────────┐             │
│  │  Login   │ ──────────────────► │   Firebase   │             │
│  │  Screen  │                      │     Auth     │             │
│  └────┬─────┘                      └──────┬───────┘             │
│       │                                   │                      │
│       │    Google Sign-In                 │                      │
│       │ ┌────────────────┐                │                      │
│       └►│  Google SDK    │────────────────┘                      │
│         └────────────────┘                                       │
│                                           │                      │
│                                    ┌──────▼───────┐             │
│                                    │ Email        │             │
│                                    │ Verified?    │             │
│                                    └──────┬───────┘             │
│                                    YES    │    NO               │
│                                    ┌──────┴───────┐             │
│                                    │              │              │
│                              ┌─────▼────┐  ┌─────▼─────┐        │
│                              │  SUCCESS │  │  SEND     │        │
│                              │  → Home  │  │  EMAIL    │        │
│                              └──────────┘  └───────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15.2 Onboarding Module — Приветственные экраны

Onboarding показывается при первом запуске приложения.

### Структура модуля

```
Modules/Onboarding/
├── Base/
│   ├── OnboardingViewController.swift   (View)
│   ├── OnboardingPresenter.swift
│   ├── OnboardingInteractor.swift
│   └── OnboardingRouter.swift
└── Cell/
    └── OnboardingCollectionViewCell.swift
```

### OnboardingRouter.swift

```swift
// Modules/Onboarding/Base/OnboardingRouter.swift

import UIKit

// MARK: - Protocol
protocol OnboardingRouterProtocol {
    func toLogin()
}

// MARK: - Router
final class OnboardingRouter: OnboardingRouterProtocol {

    // MARK: - Properties
    /// Слабая ссылка на ViewController (избегаем retain cycle)
    weak var view: UIViewController?

    // MARK: - Factory Method
    /// Создание и сборка модуля Onboarding
    /// Это "точка входа" в модуль — собирает все VIPER компоненты
    static func startOnboarding() -> OnboardingViewController {
        // 1. Создаём компоненты
        let view = OnboardingViewController()
        let interactor = OnboardingInteractor()
        let router = OnboardingRouter()
        let presenter = OnboardingPresenter(
            view: view,
            interactor: interactor,
            router: router
        )

        // 2. Связываем компоненты
        view.presenter = presenter
        interactor.presenter = presenter
        router.view = view

        return view
    }

    // MARK: - Navigation
    /// Переход на экран Login
    func toLogin() {
        let loginVC = LoginRouter.startLogin()
        view?.navigationController?.pushViewController(loginVC, animated: true)
    }
}
```

### OnboardingInteractor.swift

```swift
// Modules/Onboarding/Base/OnboardingInteractor.swift

import UIKit

// MARK: - Protocols
protocol OnboardingInteractorProtocol {
    func createOnboardingItems()
}

protocol OnboardingInteractorOutputProtocol: AnyObject {
    func onboardingItemsCreated(_ items: [OnboardingItem])
}

// MARK: - Onboarding Item Model
/// Модель данных для страницы онбординга
struct OnboardingItem {
    let title: String
    let description: String
    let imageName: String      // Имя изображения в Assets
}

// MARK: - Interactor
final class OnboardingInteractor: OnboardingInteractorProtocol {

    // MARK: - Properties
    weak var presenter: OnboardingInteractorOutputProtocol?

    // MARK: - Methods
    /// Создаёт массив страниц онбординга
    /// Бизнес-логика: какие экраны показать пользователю
    func createOnboardingItems() {
        let items: [OnboardingItem] = [
            OnboardingItem(
                title: "Добро пожаловать",
                description: "Тысячи товаров в одном приложении. Найдите всё, что вам нужно.",
                imageName: "onboarding1"
            ),
            OnboardingItem(
                title: "Быстрая доставка",
                description: "Доставим ваш заказ в кратчайшие сроки прямо до двери.",
                imageName: "onboarding2"
            ),
            OnboardingItem(
                title: "Безопасная оплата",
                description: "Несколько способов оплаты. Ваши данные под защитой.",
                imageName: "onboarding3"
            )
        ]

        // Передаём данные в Presenter
        presenter?.onboardingItemsCreated(items)
    }
}
```

### OnboardingPresenter.swift

```swift
// Modules/Onboarding/Base/OnboardingPresenter.swift

import Foundation

// MARK: - Protocols
protocol OnboardingPresenterProtocol {
    func viewDidLoad()
    func numberOfItems() -> Int
    func item(at index: Int) -> OnboardingItem?
    func nextButtonTapped(currentIndex: Int)
    func skipButtonTapped()
}

// MARK: - Presenter
final class OnboardingPresenter {

    // MARK: - Properties
    /// weak — избегаем retain cycle (View держит Presenter, Presenter НЕ держит View)
    weak var view: OnboardingViewProtocol?

    /// Interactor — сильная ссылка (Presenter владеет Interactor)
    private let interactor: OnboardingInteractorProtocol

    /// Router — сильная ссылка
    private let router: OnboardingRouterProtocol

    /// Данные для отображения
    private var items: [OnboardingItem] = []

    // MARK: - Init
    init(view: OnboardingViewProtocol,
         interactor: OnboardingInteractorProtocol,
         router: OnboardingRouterProtocol) {
        self.view = view
        self.interactor = interactor
        self.router = router
    }
}

// MARK: - OnboardingPresenterProtocol
extension OnboardingPresenter: OnboardingPresenterProtocol {

    /// Вызывается из View при загрузке
    func viewDidLoad() {
        // Запрашиваем данные у Interactor
        interactor.createOnboardingItems()
    }

    /// Количество страниц онбординга
    func numberOfItems() -> Int {
        items.count
    }

    /// Получение элемента по индексу
    func item(at index: Int) -> OnboardingItem? {
        guard items.indices.contains(index) else { return nil }
        return items[index]
    }

    /// Обработка нажатия "Далее"
    func nextButtonTapped(currentIndex: Int) {
        let nextIndex = currentIndex + 1

        if nextIndex < items.count {
            // Переход на следующую страницу
            view?.scrollToItem(at: nextIndex)
            view?.updatePageControl(currentPage: nextIndex)

            // На последней странице меняем текст кнопки
            if nextIndex == items.count - 1 {
                view?.updateButtonTitle("Начать")
            }
        } else {
            // Это последняя страница — переходим на Login
            router.toLogin()
        }
    }

    /// Обработка нажатия "Пропустить"
    func skipButtonTapped() {
        router.toLogin()
    }
}

// MARK: - OnboardingInteractorOutputProtocol
extension OnboardingPresenter: OnboardingInteractorOutputProtocol {

    /// Callback от Interactor с данными
    func onboardingItemsCreated(_ items: [OnboardingItem]) {
        self.items = items
        view?.reloadData()
    }
}
```

### OnboardingViewController.swift

```swift
// Modules/Onboarding/Base/OnboardingViewController.swift

import UIKit
import SnapKit

// MARK: - Protocol
protocol OnboardingViewProtocol: AnyObject {
    func reloadData()
    func scrollToItem(at index: Int)
    func updatePageControl(currentPage: Int)
    func updateButtonTitle(_ title: String)
}

// MARK: - ViewController
final class OnboardingViewController: UIViewController {

    // MARK: - Properties
    var presenter: OnboardingPresenterProtocol!

    /// Текущий индекс страницы
    private var currentIndex = 0

    // MARK: - UI Elements

    /// CollectionView для горизонтального скролла страниц
    private lazy var collectionView: UICollectionView = {
        // FlowLayout для горизонтального скролла
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .horizontal
        layout.minimumLineSpacing = 0

        let cv = UICollectionView(frame: .zero, collectionViewLayout: layout)
        cv.delegate = self
        cv.dataSource = self
        cv.isPagingEnabled = true  // Пагинация (скролл по страницам)
        cv.showsHorizontalScrollIndicator = false
        cv.register(
            OnboardingCollectionViewCell.self,
            forCellWithReuseIdentifier: OnboardingCollectionViewCell.identifier
        )
        return cv
    }()

    /// Индикатор текущей страницы (точки)
    private let pageControl: UIPageControl = {
        let pc = UIPageControl()
        pc.currentPageIndicatorTintColor = .label
        pc.pageIndicatorTintColor = .systemGray4
        return pc
    }()

    /// Кнопка "Далее" / "Начать"
    private let nextButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Далее", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .systemBlue
        button.layer.cornerRadius = 12
        button.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        return button
    }()

    /// Кнопка "Пропустить"
    private let skipButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Пропустить", for: .normal)
        button.setTitleColor(.systemGray, for: .normal)
        return button
    }()

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupActions()
        presenter.viewDidLoad()
    }

    // MARK: - Setup
    private func setupUI() {
        view.backgroundColor = .systemBackground

        // Скрываем navigation bar на онбординге
        navigationController?.navigationBar.isHidden = true

        view.addSubviews(collectionView, pageControl, nextButton, skipButton)

        // Layout с SnapKit
        collectionView.snp.makeConstraints { make in
            make.top.equalTo(view.safeAreaLayoutGuide).offset(40)
            make.leading.trailing.equalToSuperview()
            make.height.equalTo(UIScreenBounds.height * 0.5)
        }

        pageControl.snp.makeConstraints { make in
            make.top.equalTo(collectionView.snp.bottom).offset(20)
            make.centerX.equalToSuperview()
        }

        nextButton.snp.makeConstraints { make in
            make.bottom.equalTo(view.safeAreaLayoutGuide).offset(-40)
            make.leading.trailing.equalToSuperview().inset(24)
            make.height.equalTo(56)
        }

        skipButton.snp.makeConstraints { make in
            make.bottom.equalTo(nextButton.snp.top).offset(-16)
            make.centerX.equalToSuperview()
        }
    }

    private func setupActions() {
        nextButton.addTarget(self, action: #selector(nextButtonTapped), for: .touchUpInside)
        skipButton.addTarget(self, action: #selector(skipButtonTapped), for: .touchUpInside)
    }

    // MARK: - Actions
    @objc private func nextButtonTapped() {
        presenter.nextButtonTapped(currentIndex: currentIndex)
    }

    @objc private func skipButtonTapped() {
        presenter.skipButtonTapped()
    }
}

// MARK: - OnboardingViewProtocol
extension OnboardingViewController: OnboardingViewProtocol {

    func reloadData() {
        collectionView.reloadData()
        pageControl.numberOfPages = presenter.numberOfItems()
    }

    func scrollToItem(at index: Int) {
        currentIndex = index
        let indexPath = IndexPath(item: index, section: 0)
        collectionView.scrollToItem(at: indexPath, at: .centeredHorizontally, animated: true)
    }

    func updatePageControl(currentPage: Int) {
        pageControl.currentPage = currentPage
    }

    func updateButtonTitle(_ title: String) {
        nextButton.setTitle(title, for: .normal)
    }
}

// MARK: - UICollectionViewDataSource
extension OnboardingViewController: UICollectionViewDataSource {

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        presenter.numberOfItems()
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: OnboardingCollectionViewCell.identifier,
            for: indexPath
        ) as? OnboardingCollectionViewCell else {
            return UICollectionViewCell()
        }

        if let item = presenter.item(at: indexPath.item) {
            cell.configure(with: item)
        }

        return cell
    }
}

// MARK: - UICollectionViewDelegateFlowLayout
extension OnboardingViewController: UICollectionViewDelegateFlowLayout {

    /// Размер ячейки = размер CollectionView (полноэкранные страницы)
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        return collectionView.bounds.size
    }

    /// Обработка скролла для обновления pageControl
    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        let pageWidth = scrollView.bounds.width
        let currentPage = Int(scrollView.contentOffset.x / pageWidth)
        currentIndex = currentPage
        pageControl.currentPage = currentPage

        // Обновляем текст кнопки на последней странице
        if currentPage == presenter.numberOfItems() - 1 {
            nextButton.setTitle("Начать", for: .normal)
        } else {
            nextButton.setTitle("Далее", for: .normal)
        }
    }
}
```

### OnboardingCollectionViewCell.swift

```swift
// Modules/Onboarding/Cell/OnboardingCollectionViewCell.swift

import UIKit
import SnapKit

final class OnboardingCollectionViewCell: UICollectionViewCell {

    // MARK: - Identifier
    static let identifier = "OnboardingCollectionViewCell"

    // MARK: - UI Elements
    private let imageView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode = .scaleAspectFit
        iv.tintColor = .systemBlue
        return iv
    }()

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 28, weight: .bold)
        label.textAlignment = .center
        label.numberOfLines = 0
        return label
    }()

    private let descriptionLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 16)
        label.textColor = .secondaryLabel
        label.textAlignment = .center
        label.numberOfLines = 0
        return label
    }()

    // MARK: - Init
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup
    private func setupUI() {
        contentView.addSubviews(imageView, titleLabel, descriptionLabel)

        imageView.snp.makeConstraints { make in
            make.top.equalToSuperview()
            make.centerX.equalToSuperview()
            make.size.equalTo(CGSize(width: 200, height: 200))
        }

        titleLabel.snp.makeConstraints { make in
            make.top.equalTo(imageView.snp.bottom).offset(40)
            make.leading.trailing.equalToSuperview().inset(24)
        }

        descriptionLabel.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(16)
            make.leading.trailing.equalToSuperview().inset(24)
        }
    }

    // MARK: - Configure
    func configure(with item: OnboardingItem) {
        imageView.image = UIImage(named: item.imageName) ?? UIImage(systemName: "star.fill")
        titleLabel.text = item.title
        descriptionLabel.text = item.description
    }
}
```

---

## 15.3 Login Module — Экран входа

### LoginRouter.swift

```swift
// Modules/Login/Base/LoginRouter.swift

import UIKit

// MARK: - Protocol
protocol LoginRouterProtocol {
    func toSignUp()
    func toHome()
}

// MARK: - Router
final class LoginRouter: LoginRouterProtocol {

    weak var view: UIViewController?

    // MARK: - Factory
    static func startLogin() -> LoginViewController {
        let view = LoginViewController()
        let interactor = LoginInteractor()
        let router = LoginRouter()
        let presenter = LoginPresenter(
            view: view,
            interactor: interactor,
            router: router
        )

        view.presenter = presenter
        interactor.presenter = presenter
        router.view = view

        return view
    }

    // MARK: - Navigation

    /// Переход на экран регистрации
    func toSignUp() {
        let signUpVC = SignUpRouter.startSignUp()
        view?.navigationController?.pushViewController(signUpVC, animated: true)
    }

    /// Переход на главный экран (после успешного входа)
    func toHome() {
        // Меняем корневой контроллер всего приложения
        let mainTabBar = MainTabBarRouter.startTabBarModule()
        RootWindowManager.shared.changeRootViewController(mainTabBar, animated: true)
    }
}
```

### LoginInteractor.swift

```swift
// Modules/Login/Base/LoginInteractor.swift

import UIKit

// MARK: - Protocols
protocol LoginInteractorProtocol {
    func login(email: String, password: String)
    func loginWithGoogle(from viewController: UIViewController)
    func forgotPassword(email: String)
}

protocol LoginInteractorOutputProtocol: AnyObject {
    func loginSuccess()
    func loginFailed(error: FirebaseError)
    func forgotPasswordSuccess()
    func forgotPasswordFailed(error: FirebaseError)
}

// MARK: - Interactor
final class LoginInteractor: LoginInteractorProtocol {

    // MARK: - Properties
    weak var presenter: LoginInteractorOutputProtocol?
    private let authManager: AuthManagerProtocol

    // MARK: - Init
    /// Dependency Injection через init
    /// Позволяет подменять AuthManager в тестах
    init(authManager: AuthManagerProtocol = AuthManager()) {
        self.authManager = authManager
    }

    // MARK: - Methods

    func login(email: String, password: String) {
        authManager.login(email: email, password: password) { [weak self] result in
            switch result {
            case .success:
                self?.presenter?.loginSuccess()
            case .failure(let error):
                self?.presenter?.loginFailed(error: error)
            }
        }
    }

    func loginWithGoogle(from viewController: UIViewController) {
        authManager.signInWithGoogle(presenting: viewController) { [weak self] result in
            switch result {
            case .success:
                self?.presenter?.loginSuccess()
            case .failure(let error):
                self?.presenter?.loginFailed(error: error)
            }
        }
    }

    func forgotPassword(email: String) {
        authManager.resetPassword(with: email) { [weak self] result in
            switch result {
            case .success:
                self?.presenter?.forgotPasswordSuccess()
            case .failure(let error):
                self?.presenter?.forgotPasswordFailed(error: error)
            }
        }
    }
}
```

### LoginPresenter.swift

```swift
// Modules/Login/Base/LoginPresenter.swift

import UIKit

// MARK: - Protocol
protocol LoginPresenterProtocol {
    func loginButtonTapped(email: String?, password: String?)
    func googleSignInButtonTapped()
    func signUpButtonTapped()
    func forgotPasswordTapped()
}

// MARK: - Presenter
final class LoginPresenter {

    weak var view: LoginViewProtocol?
    private let interactor: LoginInteractorProtocol
    private let router: LoginRouterProtocol

    init(view: LoginViewProtocol,
         interactor: LoginInteractorProtocol,
         router: LoginRouterProtocol) {
        self.view = view
        self.interactor = interactor
        self.router = router
    }
}

// MARK: - LoginPresenterProtocol
extension LoginPresenter: LoginPresenterProtocol {

    func loginButtonTapped(email: String?, password: String?) {
        // Валидация
        guard let email = email, !email.isEmpty,
              let password = password, !password.isEmpty else {
            view?.showError(GeneralError.emailPasswordEmpty)
            return
        }

        // Показываем индикатор загрузки
        view?.showLoading()

        // Выполняем вход
        interactor.login(email: email, password: password)
    }

    func googleSignInButtonTapped() {
        // Получаем ViewController для показа Google UI
        guard let viewController = view as? UIViewController else { return }

        view?.showLoading()
        interactor.loginWithGoogle(from: viewController)
    }

    func signUpButtonTapped() {
        router.toSignUp()
    }

    func forgotPasswordTapped() {
        // View показывает alert с текстовым полем для email
        view?.showForgotPasswordAlert()
    }
}

// MARK: - LoginInteractorOutputProtocol
extension LoginPresenter: LoginInteractorOutputProtocol {

    func loginSuccess() {
        view?.hideLoading()
        router.toHome()
    }

    func loginFailed(error: FirebaseError) {
        view?.hideLoading()
        view?.showError(error)
    }

    func forgotPasswordSuccess() {
        view?.hideLoading()
        view?.showSuccess(message: "Письмо для сброса пароля отправлено на вашу почту")
    }

    func forgotPasswordFailed(error: FirebaseError) {
        view?.hideLoading()
        view?.showError(error)
    }
}
```

### LoginViewController.swift

```swift
// Modules/Login/Base/LoginViewController.swift

import UIKit
import SnapKit

// MARK: - Protocol
protocol LoginViewProtocol: AnyObject {
    func showLoading()
    func hideLoading()
    func showError(_ error: Error)
    func showSuccess(message: String)
    func showForgotPasswordAlert()
}

// MARK: - ViewController
final class LoginViewController: UIViewController {

    // MARK: - Properties
    var presenter: LoginPresenterProtocol!

    // MARK: - UI Elements

    private let logoImageView: UIImageView = {
        let iv = UIImageView()
        iv.image = UIImage(systemName: "cart.fill")
        iv.tintColor = .systemBlue
        iv.contentMode = .scaleAspectFit
        return iv
    }()

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "Добро пожаловать"
        label.font = .systemFont(ofSize: 28, weight: .bold)
        label.textAlignment = .center
        return label
    }()

    private let subtitleLabel: UILabel = {
        let label = UILabel()
        label.text = "Войдите в аккаунт"
        label.font = .systemFont(ofSize: 16)
        label.textColor = .secondaryLabel
        label.textAlignment = .center
        return label
    }()

    private let emailTextField: UITextField = {
        let tf = UITextField()
        tf.placeholder = "Email"
        tf.borderStyle = .roundedRect
        tf.keyboardType = .emailAddress
        tf.autocapitalizationType = .none
        tf.autocorrectionType = .no
        tf.returnKeyType = .next
        return tf
    }()

    private let passwordTextField: UITextField = {
        let tf = UITextField()
        tf.placeholder = "Пароль"
        tf.borderStyle = .roundedRect
        tf.isSecureTextEntry = true
        tf.returnKeyType = .done
        return tf
    }()

    private let forgotPasswordButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Забыли пароль?", for: .normal)
        button.setTitleColor(.systemBlue, for: .normal)
        button.contentHorizontalAlignment = .right
        return button
    }()

    private let loginButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Войти", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .systemBlue
        button.layer.cornerRadius = 12
        button.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        return button
    }()

    private let orLabel: UILabel = {
        let label = UILabel()
        label.text = "или"
        label.font = .systemFont(ofSize: 14)
        label.textColor = .secondaryLabel
        label.textAlignment = .center
        return label
    }()

    private let googleButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("  Войти через Google", for: .normal)
        button.setTitleColor(.label, for: .normal)
        button.setImage(UIImage(named: "google_icon"), for: .normal)
        button.backgroundColor = .secondarySystemBackground
        button.layer.cornerRadius = 12
        button.layer.borderWidth = 1
        button.layer.borderColor = UIColor.systemGray4.cgColor
        button.titleLabel?.font = .systemFont(ofSize: 16, weight: .medium)
        return button
    }()

    private let signUpStackView: UIStackView = {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 4
        stack.alignment = .center
        return stack
    }()

    private let noAccountLabel: UILabel = {
        let label = UILabel()
        label.text = "Нет аккаунта?"
        label.font = .systemFont(ofSize: 14)
        label.textColor = .secondaryLabel
        return label
    }()

    private let signUpButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Зарегистрируйтесь", for: .normal)
        button.setTitleColor(.systemBlue, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 14, weight: .semibold)
        return button
    }()

    private let activityIndicator: UIActivityIndicatorView = {
        let indicator = UIActivityIndicatorView(style: .large)
        indicator.hidesWhenStopped = true
        return indicator
    }()

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupActions()
    }

    // MARK: - Setup
    private func setupUI() {
        view.backgroundColor = .systemBackground
        navigationController?.navigationBar.isHidden = true

        signUpStackView.addArrangedSubview(noAccountLabel)
        signUpStackView.addArrangedSubview(signUpButton)

        view.addSubviews(
            logoImageView, titleLabel, subtitleLabel,
            emailTextField, passwordTextField, forgotPasswordButton,
            loginButton, orLabel, googleButton,
            signUpStackView, activityIndicator
        )

        // Constraints
        logoImageView.snp.makeConstraints { make in
            make.top.equalTo(view.safeAreaLayoutGuide).offset(40)
            make.centerX.equalToSuperview()
            make.size.equalTo(80)
        }

        titleLabel.snp.makeConstraints { make in
            make.top.equalTo(logoImageView.snp.bottom).offset(24)
            make.leading.trailing.equalToSuperview().inset(24)
        }

        subtitleLabel.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(8)
            make.leading.trailing.equalToSuperview().inset(24)
        }

        emailTextField.snp.makeConstraints { make in
            make.top.equalTo(subtitleLabel.snp.bottom).offset(40)
            make.leading.trailing.equalToSuperview().inset(24)
            make.height.equalTo(50)
        }

        passwordTextField.snp.makeConstraints { make in
            make.top.equalTo(emailTextField.snp.bottom).offset(16)
            make.leading.trailing.equalToSuperview().inset(24)
            make.height.equalTo(50)
        }

        forgotPasswordButton.snp.makeConstraints { make in
            make.top.equalTo(passwordTextField.snp.bottom).offset(8)
            make.trailing.equalToSuperview().inset(24)
        }

        loginButton.snp.makeConstraints { make in
            make.top.equalTo(forgotPasswordButton.snp.bottom).offset(24)
            make.leading.trailing.equalToSuperview().inset(24)
            make.height.equalTo(56)
        }

        orLabel.snp.makeConstraints { make in
            make.top.equalTo(loginButton.snp.bottom).offset(20)
            make.centerX.equalToSuperview()
        }

        googleButton.snp.makeConstraints { make in
            make.top.equalTo(orLabel.snp.bottom).offset(20)
            make.leading.trailing.equalToSuperview().inset(24)
            make.height.equalTo(56)
        }

        signUpStackView.snp.makeConstraints { make in
            make.top.equalTo(googleButton.snp.bottom).offset(24)
            make.centerX.equalToSuperview()
        }

        activityIndicator.snp.makeConstraints { make in
            make.center.equalToSuperview()
        }
    }

    private func setupActions() {
        loginButton.addTarget(self, action: #selector(loginButtonTapped), for: .touchUpInside)
        googleButton.addTarget(self, action: #selector(googleButtonTapped), for: .touchUpInside)
        signUpButton.addTarget(self, action: #selector(signUpButtonTapped), for: .touchUpInside)
        forgotPasswordButton.addTarget(self, action: #selector(forgotPasswordTapped), for: .touchUpInside)
    }

    // MARK: - Actions
    @objc private func loginButtonTapped() {
        presenter.loginButtonTapped(
            email: emailTextField.text,
            password: passwordTextField.text
        )
    }

    @objc private func googleButtonTapped() {
        presenter.googleSignInButtonTapped()
    }

    @objc private func signUpButtonTapped() {
        presenter.signUpButtonTapped()
    }

    @objc private func forgotPasswordTapped() {
        presenter.forgotPasswordTapped()
    }
}

// MARK: - LoginViewProtocol
extension LoginViewController: LoginViewProtocol {

    func showLoading() {
        activityIndicator.startAnimating()
        loginButton.isEnabled = false
        googleButton.isEnabled = false
    }

    func hideLoading() {
        activityIndicator.stopAnimating()
        loginButton.isEnabled = true
        googleButton.isEnabled = true
    }

    func showError(_ error: Error) {
        showAlert(title: "Ошибка", message: error.localizedDescription)
    }

    func showSuccess(message: String) {
        showAlert(title: "Успешно", message: message)
    }

    func showForgotPasswordAlert() {
        passwordResetAlert { [weak self] email in
            self?.presenter.loginButtonTapped(email: email, password: nil)
        }
    }
}
```

---

## 15.4 SignUp Module — Регистрация

Модуль SignUp аналогичен Login, но с дополнительной логикой.

### SignUpRouter.swift

```swift
// Modules/SignUp/Base/SignUpRouter.swift

import UIKit

protocol SignUpRouterProtocol {
    func toLogin()
}

final class SignUpRouter: SignUpRouterProtocol {

    weak var view: UIViewController?

    static func startSignUp() -> SignUpViewController {
        let view = SignUpViewController()
        let interactor = SignUpInteractor()
        let router = SignUpRouter()
        let presenter = SignUpPresenter(
            view: view,
            interactor: interactor,
            router: router
        )

        view.presenter = presenter
        interactor.presenter = presenter
        router.view = view

        return view
    }

    func toLogin() {
        view?.navigationController?.popViewController(animated: true)
    }
}
```

### SignUpInteractor.swift

```swift
// Modules/SignUp/Base/SignUpInteractor.swift

import Foundation

protocol SignUpInteractorProtocol {
    func signUp(email: String, password: String)
}

protocol SignUpInteractorOutputProtocol: AnyObject {
    func signUpSuccess()
    func signUpFailed(error: FirebaseError)
}

final class SignUpInteractor: SignUpInteractorProtocol {

    weak var presenter: SignUpInteractorOutputProtocol?
    private let authManager: AuthManagerProtocol

    init(authManager: AuthManagerProtocol = AuthManager()) {
        self.authManager = authManager
    }

    func signUp(email: String, password: String) {
        authManager.signUp(email: email, password: password) { [weak self] result in
            switch result {
            case .success:
                self?.presenter?.signUpSuccess()
            case .failure(let error):
                self?.presenter?.signUpFailed(error: error)
            }
        }
    }
}
```

### SignUpPresenter.swift

```swift
// Modules/SignUp/Base/SignUpPresenter.swift

import Foundation

protocol SignUpPresenterProtocol {
    func signUpButtonTapped(email: String?, password: String?, confirmPassword: String?)
    func loginButtonTapped()
}

final class SignUpPresenter {

    weak var view: SignUpViewProtocol?
    private let interactor: SignUpInteractorProtocol
    private let router: SignUpRouterProtocol

    init(view: SignUpViewProtocol,
         interactor: SignUpInteractorProtocol,
         router: SignUpRouterProtocol) {
        self.view = view
        self.interactor = interactor
        self.router = router
    }
}

extension SignUpPresenter: SignUpPresenterProtocol {

    func signUpButtonTapped(email: String?, password: String?, confirmPassword: String?) {
        // Валидация
        guard let email = email, !email.isEmpty,
              let password = password, !password.isEmpty,
              let confirmPassword = confirmPassword, !confirmPassword.isEmpty else {
            view?.showError(GeneralError.emailPasswordEmpty)
            return
        }

        // Проверка совпадения паролей
        guard password == confirmPassword else {
            view?.showError(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Пароли не совпадают"]))
            return
        }

        // Проверка длины пароля (Firebase требует минимум 6 символов)
        guard password.count >= 6 else {
            view?.showError(NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Пароль должен содержать минимум 6 символов"]))
            return
        }

        view?.showLoading()
        interactor.signUp(email: email, password: password)
    }

    func loginButtonTapped() {
        router.toLogin()
    }
}

extension SignUpPresenter: SignUpInteractorOutputProtocol {

    func signUpSuccess() {
        view?.hideLoading()
        view?.showSuccessAndNavigate(message: "Регистрация успешна! Проверьте почту для подтверждения email.")
    }

    func signUpFailed(error: FirebaseError) {
        view?.hideLoading()
        view?.showError(error)
    }
}
```

### SignUpViewController.swift

```swift
// Modules/SignUp/Base/SignUpViewController.swift

import UIKit
import SnapKit

protocol SignUpViewProtocol: AnyObject {
    func showLoading()
    func hideLoading()
    func showError(_ error: Error)
    func showSuccessAndNavigate(message: String)
}

final class SignUpViewController: UIViewController {

    var presenter: SignUpPresenterProtocol!

    // MARK: - UI Elements
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "Создать аккаунт"
        label.font = .systemFont(ofSize: 28, weight: .bold)
        label.textAlignment = .center
        return label
    }()

    private let subtitleLabel: UILabel = {
        let label = UILabel()
        label.text = "Заполните данные для регистрации"
        label.font = .systemFont(ofSize: 16)
        label.textColor = .secondaryLabel
        label.textAlignment = .center
        return label
    }()

    private let emailTextField: UITextField = {
        let tf = UITextField()
        tf.placeholder = "Email"
        tf.borderStyle = .roundedRect
        tf.keyboardType = .emailAddress
        tf.autocapitalizationType = .none
        return tf
    }()

    private let passwordTextField: UITextField = {
        let tf = UITextField()
        tf.placeholder = "Пароль"
        tf.borderStyle = .roundedRect
        tf.isSecureTextEntry = true
        return tf
    }()

    private let confirmPasswordTextField: UITextField = {
        let tf = UITextField()
        tf.placeholder = "Подтвердите пароль"
        tf.borderStyle = .roundedRect
        tf.isSecureTextEntry = true
        return tf
    }()

    private let signUpButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Зарегистрироваться", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .systemBlue
        button.layer.cornerRadius = 12
        button.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        return button
    }()

    private let loginStackView: UIStackView = {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 4
        return stack
    }()

    private let hasAccountLabel: UILabel = {
        let label = UILabel()
        label.text = "Уже есть аккаунт?"
        label.font = .systemFont(ofSize: 14)
        label.textColor = .secondaryLabel
        return label
    }()

    private let loginButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Войти", for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 14, weight: .semibold)
        return button
    }()

    private let activityIndicator = UIActivityIndicatorView(style: .large)

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupActions()
    }

    private func setupUI() {
        view.backgroundColor = .systemBackground

        loginStackView.addArrangedSubview(hasAccountLabel)
        loginStackView.addArrangedSubview(loginButton)

        view.addSubviews(
            titleLabel, subtitleLabel,
            emailTextField, passwordTextField, confirmPasswordTextField,
            signUpButton, loginStackView, activityIndicator
        )

        titleLabel.snp.makeConstraints { make in
            make.top.equalTo(view.safeAreaLayoutGuide).offset(60)
            make.leading.trailing.equalToSuperview().inset(24)
        }

        subtitleLabel.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(8)
            make.leading.trailing.equalToSuperview().inset(24)
        }

        emailTextField.snp.makeConstraints { make in
            make.top.equalTo(subtitleLabel.snp.bottom).offset(40)
            make.leading.trailing.equalToSuperview().inset(24)
            make.height.equalTo(50)
        }

        passwordTextField.snp.makeConstraints { make in
            make.top.equalTo(emailTextField.snp.bottom).offset(16)
            make.leading.trailing.equalToSuperview().inset(24)
            make.height.equalTo(50)
        }

        confirmPasswordTextField.snp.makeConstraints { make in
            make.top.equalTo(passwordTextField.snp.bottom).offset(16)
            make.leading.trailing.equalToSuperview().inset(24)
            make.height.equalTo(50)
        }

        signUpButton.snp.makeConstraints { make in
            make.top.equalTo(confirmPasswordTextField.snp.bottom).offset(32)
            make.leading.trailing.equalToSuperview().inset(24)
            make.height.equalTo(56)
        }

        loginStackView.snp.makeConstraints { make in
            make.top.equalTo(signUpButton.snp.bottom).offset(24)
            make.centerX.equalToSuperview()
        }

        activityIndicator.snp.makeConstraints { make in
            make.center.equalToSuperview()
        }
    }

    private func setupActions() {
        signUpButton.addTarget(self, action: #selector(signUpTapped), for: .touchUpInside)
        loginButton.addTarget(self, action: #selector(loginTapped), for: .touchUpInside)
    }

    @objc private func signUpTapped() {
        presenter.signUpButtonTapped(
            email: emailTextField.text,
            password: passwordTextField.text,
            confirmPassword: confirmPasswordTextField.text
        )
    }

    @objc private func loginTapped() {
        presenter.loginButtonTapped()
    }
}

// MARK: - SignUpViewProtocol
extension SignUpViewController: SignUpViewProtocol {

    func showLoading() {
        activityIndicator.startAnimating()
        signUpButton.isEnabled = false
    }

    func hideLoading() {
        activityIndicator.stopAnimating()
        signUpButton.isEnabled = true
    }

    func showError(_ error: Error) {
        showAlert(title: "Ошибка", message: error.localizedDescription)
    }

    func showSuccessAndNavigate(message: String) {
        let alert = UIAlertController(title: "Успешно", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            self?.presenter.loginButtonTapped()
        })
        present(alert, animated: true)
    }
}
```

---

## 15.5 Диаграмма связей VIPER

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LOGIN MODULE - VIPER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ┌──────────────────┐         ┌───────────────────┐               │
│    │  LoginRouter     │         │  LoginInteractor  │               │
│    │                  │         │                   │               │
│    │  • toSignUp()    │         │  • login()        │               │
│    │  • toHome()      │         │  • loginWithGoogle│               │
│    │                  │         │  • forgotPassword │               │
│    └────────▲─────────┘         └────────▲──────────┘               │
│             │                            │                           │
│             │                            │                           │
│    ┌────────┴────────────────────────────┴──────────┐               │
│    │                                                 │               │
│    │              LoginPresenter                     │               │
│    │                                                 │               │
│    │  Inputs:           Interactor Output:           │               │
│    │  • loginButtonTapped    • loginSuccess()        │               │
│    │  • googleSignInTapped   • loginFailed()         │               │
│    │  • signUpButtonTapped                           │               │
│    │  • forgotPasswordTapped                         │               │
│    │                                                 │               │
│    └────────────────────┬────────────────────────────┘               │
│                         │                                            │
│                         │ weak reference                             │
│                         ▼                                            │
│    ┌────────────────────────────────────────────────┐               │
│    │                                                 │               │
│    │           LoginViewController                   │               │
│    │                                                 │               │
│    │  Protocol Methods:                              │               │
│    │  • showLoading()                                │               │
│    │  • hideLoading()                                │               │
│    │  • showError()                                  │               │
│    │  • showSuccess()                                │               │
│    │                                                 │               │
│    └────────────────────────────────────────────────┘               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 15.6 Итоги главы

В этой главе вы создали полноценную систему аутентификации:

✅ **AuthManager** — централизованная логика авторизации с Firebase

✅ **Onboarding** — приветственные экраны с CollectionView

✅ **Login** — вход с email/password и Google Sign-In

✅ **SignUp** — регистрация с валидацией и верификацией email

✅ **VIPER архитектура** — чёткое разделение ответственности

### Ключевые паттерны

| Паттерн | Где используется |
|---------|------------------|
| Singleton | AuthManager, RootWindowManager |
| Factory Method | Router.startModule() |
| Delegation | Interactor → Presenter |
| Protocol-Oriented | Все компоненты VIPER |

### Сравнение с веб-разработкой

| iOS (Swift/VIPER) | Web (React/Express) |
|-------------------|---------------------|
| AuthManager | Auth middleware |
| LoginViewController | LoginPage component |
| LoginPresenter | useLogin hook / controller |
| LoginInteractor | Auth service |
| LoginRouter | React Router / next/router |

---

## Следующая глава

В [Главе 16](../16-Products/README.md) мы создадим главный экран с товарами: Home модуль с категориями, поиском и списком товаров.
