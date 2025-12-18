# Глава 20: Профиль пользователя и завершение приложения

## Введение

В финальной главе мы создадим:
- Модуль профиля пользователя (Profile VIPER)
- Управление адресами доставки (Addresses VIPER)
- Управление платёжными картами (PaymentInfo VIPER)
- Историю заказов (OrderHistory)
- Выход из аккаунта

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROFILE MODULE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ┌─────────────────────────────────────┐                          │
│    │         UserInfoView                │                          │
│    │   ┌─────────────────────────────┐   │                          │
│    │   │      [Profile Photo]        │   │                          │
│    │   │         140x140             │   │                          │
│    │   └─────────────────────────────┘   │                          │
│    │         user@email.com              │                          │
│    └─────────────────────────────────────┘                          │
│                                                                      │
│    ┌─────────────────────────────────────┐                          │
│    │  🗺️  Address Information        >   │ → AddressesModule        │
│    ├─────────────────────────────────────┤                          │
│    │  💳  Payment Information        >   │ → PaymentInfoModule      │
│    ├─────────────────────────────────────┤                          │
│    │  📦  Order History              >   │ → OrderHistoryModule     │
│    ├─────────────────────────────────────┤                          │
│    │  🔌  Sign Out                       │ → LoginModule            │
│    └─────────────────────────────────────┘                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 20.1 Entity-слой: Модели профиля

### CurrentUserModel — данные пользователя

```swift
// Entities/Models/CurrentUserModel.swift
import Foundation
import UIKit.UIImage

struct CurrentUserModel: Equatable {
    let profileImageURLString: String?
    let userEmail: String?
}
```

**Анализ:**
- `profileImageURLString` — URL фото профиля из Firebase Auth (может быть nil)
- `userEmail` — email текущего пользователя
- `Equatable` — позволяет сравнивать модели (полезно для тестирования)

### ProfileRowItem — элементы меню профиля

```swift
// Entities/Enums/ProfileRowItem.swift
import Foundation
import UIKit.UIImage

enum ProfileRowItem {
    case address
    case payment
    case orderHistory
    case signOut

    var title: String {
        switch self {
        case .address:
            return "Address Information"
        case .payment:
            return "Payment Information"
        case .orderHistory:
            return "Order History"
        case .signOut:
            return "Sign Out"
        }
    }

    var image: UIImage? {
        switch self {
        case .address:
            return UIImage(systemName: "map")
        case .payment:
            return UIImage(systemName: "creditcard")
        case .orderHistory:
            return UIImage(systemName: "wallet.pass")
        case .signOut:
            return UIImage(systemName: "power")
        }
    }
}
```

**Почему enum с computed properties:**
- Каждый case — пункт меню профиля
- `title` — текст для отображения
- `image` — SF Symbol иконка
- Централизованное управление UI элементами

### ProfileRowItemModel — обёртка для элемента

```swift
// Entities/Models/ProfileRowItemModel.swift
import Foundation
import UIKit.UIImage

struct ProfileRowItemModel {
    let item: ProfileRowItem
}
```

**Зачем нужна обёртка:**
- Позволяет добавить дополнительные свойства в будущем
- Отделяет enum от модели данных
- Упрощает работу с коллекциями

---

## 20.2 UserInfoManager — менеджер данных пользователя

```swift
// Managers/UserInfoManager/UserInfoManager.swift
import Foundation
import GoogleSignIn
import FirebaseAuth

protocol UserInfoManagerProtocol {
    func getUserProfilePictureAndEmail(completion: @escaping (_ photo: String?, _ email: String?) -> Void)
    func getUserUid() -> String?
}

final class UserInfoManager: UserInfoManagerProtocol {

    func getUserProfilePictureAndEmail(completion: @escaping (_ photo: String?, _ email: String?) -> Void) {
        if let currentUser = Auth.auth().currentUser {
            let profileImageURL = currentUser.photoURL
            completion(profileImageURL?.absoluteString, currentUser.email)
        } else {
            completion(nil, nil)
        }
    }

    func getUserUid() -> String? {
        return Auth.auth().currentUser?.uid
    }
}
```

**Как это работает:**

```
┌──────────────────────────────────────────────────────────────────┐
│                     UserInfoManager                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   getUserProfilePictureAndEmail()                                 │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  Auth.auth().currentUser                                 │    │
│   │       ↓                                                  │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  Firebase User Object                           │    │    │
│   │  │  ├── photoURL: URL? (Google/Apple photo)        │    │    │
│   │  │  ├── email: String?                             │    │    │
│   │  │  └── uid: String                                │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   │       ↓                                                  │    │
│   │  completion(photoURL?.absoluteString, email)             │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│   getUserUid()                                                    │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  return Auth.auth().currentUser?.uid                     │    │
│   │  (используется для фильтрации данных по пользователю)    │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Ключевые моменты:**
- `Auth.auth().currentUser` — текущий авторизованный пользователь
- `photoURL` — URL фото (заполняется при Google/Apple Sign-In)
- `uid` — уникальный идентификатор для фильтрации данных

---

## 20.3 Profile VIPER Module

### ProfileRouter — точка входа и навигация

```swift
// Modules/Profile/Base/ProfileRouter.swift
import Foundation
import UIKit.UIViewController

protocol ProfileRouterProtocol {
    func toLogin()
    func toAddresses()
    func toPaymentInfo()
    func toOrderHistory()
}

final class ProfileRouter {

    private weak var view: UIViewController?
    private let windowManager: RootWindowManagerProtocol?

    init(view: UIViewController, windowManager: RootWindowManagerProtocol) {
        self.view = view
        self.windowManager = windowManager
    }

    static func startProfileModule() -> UIViewController {
        let view = ProfileViewController()
        let router = ProfileRouter(view: view, windowManager: RootWindowManager.shared)
        let interactor = ProfileInteractor(userInfoManager: UserInfoManager(), authManager: AuthManager())
        let presenter = ProfilePresenter(view: view, interactor: interactor, router: router)

        view.presenter = presenter
        interactor.presenter = presenter

        return view
    }
}

extension ProfileRouter: ProfileRouterProtocol {

    func toLogin() {
        let loginModule = UINavigationController(rootViewController: LoginRouter.startLogin())
        windowManager?.changeRootViewController(loginModule, animated: true)
    }

    func toAddresses() {
        let addressesModule = AddressesRouter.startAddressesModule()
        self.view?.navigationController?.pushViewController(addressesModule, animated: true)
    }

    func toPaymentInfo() {
        let paymentInfoModule = PaymentInfoRouter.startPaymentInfoModule()
        self.view?.navigationController?.pushViewController(paymentInfoModule, animated: true)
    }

    func toOrderHistory() {
        let orderHistoryVC = OrderHistoryViewController()
        self.view?.navigationController?.pushViewController(orderHistoryVC, animated: true)
    }
}
```

**Диаграмма навигации:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ProfileRouter Navigation                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ProfileViewController                                              │
│          │                                                           │
│          ├── toAddresses() ──────→ AddressesViewController           │
│          │                              │                            │
│          │                              └── AddAddressViewController │
│          │                                                           │
│          ├── toPaymentInfo() ────→ PaymentInfoViewController         │
│          │                              │                            │
│          │                              └── AddCardViewController    │
│          │                                                           │
│          ├── toOrderHistory() ───→ OrderHistoryViewController        │
│          │                                                           │
│          └── toLogin() ─────────→ ❌ CHANGE ROOT WINDOW              │
│                                        │                             │
│                                        ↓                             │
│                                   LoginViewController                │
│                                   (новый root controller)            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Особенность `toLogin()`:**
- Не делает push, а меняет root окна
- Полностью сбрасывает navigation stack
- Пользователь не может вернуться назад

### ProfileInteractor — бизнес-логика

```swift
// Modules/Profile/Base/ProfileInteractor.swift
import Foundation

protocol ProfileInteractorInputs {
    func getUserInfos()
    func showItems() -> [ProfileRowItemModel]
    func signOutAction()
}

protocol ProfileInteractorOutputs: AnyObject {
    func showUserInfo(model: CurrentUserModel?)
    func startLoading()
    func endLoading()
    func signOutCompleted()
    func onError(message: String)
}

final class ProfileInteractor {

    weak var presenter: ProfileInteractorOutputs?
    private let userInfoManager: UserInfoManagerProtocol?
    private let authManager: AuthManagerProtocol?

    private let rowItems: [ProfileRowItemModel] = [
        .init(item: .address),
        .init(item: .payment),
        .init(item: .orderHistory),
        .init(item: .signOut)
    ]

    init(userInfoManager: UserInfoManagerProtocol, authManager: AuthManagerProtocol) {
        self.userInfoManager = userInfoManager
        self.authManager = authManager
    }
}

// MARK: - Interactor Inputs
extension ProfileInteractor: ProfileInteractorInputs {

    func getUserInfos() {
        userInfoManager?.getUserProfilePictureAndEmail(completion: { [weak self] photo, email in
            guard let self else { return }
            let model: CurrentUserModel = .init(profileImageURLString: photo, userEmail: email)
            presenter?.showUserInfo(model: model)
        })
    }

    func showItems() -> [ProfileRowItemModel] {
        return self.rowItems
    }

    func signOutAction() {
        presenter?.startLoading()
        authManager?.signOut { [weak self] result in
            guard let self else { return }
            presenter?.endLoading()

            switch result {
            case .success(_):
                presenter?.signOutCompleted()
            case .failure(let error):
                presenter?.onError(message: error.localizedDescription)
            }
        }
    }
}
```

**Поток данных:**

```
┌──────────────────────────────────────────────────────────────────────┐
│                      ProfileInteractor Flow                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   getUserInfos()                                                      │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  userInfoManager.getUserProfilePictureAndEmail()             │    │
│   │           ↓                                                  │    │
│   │  completion(photo, email)                                    │    │
│   │           ↓                                                  │    │
│   │  CurrentUserModel(profileImageURLString: photo,              │    │
│   │                   userEmail: email)                          │    │
│   │           ↓                                                  │    │
│   │  presenter?.showUserInfo(model: model)                       │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│   signOutAction()                                                     │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  presenter?.startLoading()                                   │    │
│   │           ↓                                                  │    │
│   │  authManager?.signOut { result in                            │    │
│   │       switch result {                                        │    │
│   │       case .success:                                         │    │
│   │           presenter?.signOutCompleted()  ─→ Router.toLogin() │    │
│   │       case .failure(error):                                  │    │
│   │           presenter?.onError(message)                        │    │
│   │       }                                                      │    │
│   │  }                                                           │    │
│   │  presenter?.endLoading()                                     │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### ProfilePresenter — координатор

```swift
// Modules/Profile/Base/ProfilePresenter.swift
import Foundation

protocol ProfilePresenterInputs {
    func viewDidLoad()
    func numberOfRowsInSection() -> Int
    func cellForRowAt(indexPath: IndexPath) -> ProfileRowItemModel?
    func heightForRowAt(indexPath: IndexPath) -> CGFloat
    func didSelectRowAt(indexPath: IndexPath)
}

final class ProfilePresenter {

    private weak var view: ProfileViewProtocol?
    private let interactor: ProfileInteractorInputs?
    private let router: ProfileRouterProtocol?

    init(view: ProfileViewProtocol, interactor: ProfileInteractorInputs, router: ProfileRouterProtocol) {
        self.view = view
        self.interactor = interactor
        self.router = router
    }
}

// MARK: - Presenter Inputs
extension ProfilePresenter: ProfilePresenterInputs {

    func viewDidLoad() {
        view?.setNavTitle(title: "My Profile")
        view?.setBackgroundColor()
        view?.prepareUserInfoView()
        view?.prepareTableView()
        interactor?.getUserInfos()
    }

    func numberOfRowsInSection() -> Int {
        return interactor?.showItems().count ?? 0
    }

    func cellForRowAt(indexPath: IndexPath) -> ProfileRowItemModel? {
        return interactor?.showItems()[indexPath.row]
    }

    func heightForRowAt(indexPath: IndexPath) -> CGFloat {
        return 60
    }

    func didSelectRowAt(indexPath: IndexPath) {
        let selectedItem = interactor?.showItems()[indexPath.row]

        switch selectedItem?.item {
        case .address:
            router?.toAddresses()
        case .payment:
            router?.toPaymentInfo()
        case .orderHistory:
            router?.toOrderHistory()
        case .signOut:
            interactor?.signOutAction()
        default:
            break
        }
    }
}

// MARK: - Interactor to Presenter
extension ProfilePresenter: ProfileInteractorOutputs {

    func showUserInfo(model: CurrentUserModel?) {
        view?.showCurrentUserInfo(model: model)
    }

    func startLoading() {
        view?.startLoading()
    }

    func endLoading() {
        view?.endLoading()
    }

    func signOutCompleted() {
        router?.toLogin()
    }

    func onError(message: String) {
        view?.onError(message: message)
    }
}
```

**Обработка выбора пункта меню:**

```
┌─────────────────────────────────────────────────────────────────┐
│                didSelectRowAt() Switch Logic                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   selectedItem?.item                                             │
│        │                                                         │
│        ├── .address ─────────→ router?.toAddresses()             │
│        │                       (push AddressesViewController)    │
│        │                                                         │
│        ├── .payment ─────────→ router?.toPaymentInfo()           │
│        │                       (push PaymentInfoViewController)  │
│        │                                                         │
│        ├── .orderHistory ────→ router?.toOrderHistory()          │
│        │                       (push OrderHistoryViewController) │
│        │                                                         │
│        └── .signOut ─────────→ interactor?.signOutAction()       │
│                                     │                            │
│                                     ↓                            │
│                               signOutCompleted()                 │
│                                     │                            │
│                                     ↓                            │
│                               router?.toLogin()                  │
│                               (change root window)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ProfileViewController — отображение

```swift
// Modules/Profile/Base/ProfileViewController.swift
import UIKit

protocol ProfileViewProtocol: AnyObject {
    func setNavTitle(title: String)
    func setBackgroundColor()
    func prepareUserInfoView()
    func prepareTableView()
    func startLoading()
    func endLoading()
    func onError(message: String)
    func showCurrentUserInfo(model: CurrentUserModel?)
}

final class ProfileViewController: UIViewController {

    private lazy var profileTableView: UITableView = {
        let tableView = UITableView()
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(ProfileCell.self, forCellReuseIdentifier: ProfileCell.identifier)
        return tableView
    }()

    private lazy var userInfoView = UserInfoView()

    internal var presenter: ProfilePresenterInputs!

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        presenter.viewDidLoad()
    }
}

// MARK: - Profile View Protocol
extension ProfileViewController: ProfileViewProtocol {

    func setNavTitle(title: String) {
        self.title = title
    }

    func setBackgroundColor() {
        self.view.backgroundColor = .systemBackground
    }

    func prepareUserInfoView() {
        view.addSubview(userInfoView)

        userInfoView.snp.makeConstraints { make in
            make.width.equalToSuperview()
            make.height.equalTo(280)
            make.top.equalTo(view.safeAreaLayoutGuide)
        }
    }

    func prepareTableView() {
        view.addSubview(profileTableView)

        profileTableView.snp.makeConstraints { make in
            make.top.equalTo(userInfoView.snp.bottom)
            make.left.right.bottom.equalToSuperview()
        }
    }

    func startLoading() {
        // Показать индикатор загрузки
    }

    func endLoading() {
        // Скрыть индикатор загрузки
    }

    func onError(message: String) {
        showAlert(title: "", message: message)
    }

    func showCurrentUserInfo(model: CurrentUserModel?) {
        userInfoView.showModel(model: model)
    }
}

// MARK: - Profile TableView Delegate & DataSource
extension ProfileViewController: UITableViewDelegate, UITableViewDataSource {

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return presenter.numberOfRowsInSection()
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let cell = profileTableView.dequeueReusableCell(
            withIdentifier: ProfileCell.identifier,
            for: indexPath
        ) as? ProfileCell else {
            return UITableViewCell()
        }
        cell.showModel(model: presenter.cellForRowAt(indexPath: indexPath))
        cell.selectionStyle = .none
        cell.accessoryType = .disclosureIndicator
        return cell
    }

    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        return presenter.heightForRowAt(indexPath: indexPath)
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        profileTableView.deselectRow(at: indexPath, animated: true)
        presenter.didSelectRowAt(indexPath: indexPath)
    }
}
```

**Структура экрана:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Navigation Bar: "My Profile"                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   UserInfoView (280pt)                     │  │
│  │                                                            │  │
│  │              ┌─────────────────┐                          │  │
│  │              │   [Profile      │                          │  │
│  │              │    Photo]       │   140x140                │  │
│  │              │   cornerRadius  │   borderWidth: 3         │  │
│  │              │      70         │                          │  │
│  │              └─────────────────┘                          │  │
│  │                                                            │  │
│  │                 user@email.com                             │  │
│  │              (semibold, size 20)                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ProfileTableView                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  🗺️  Address Information                        >   │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │  💳  Payment Information                        >   │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │  📦  Order History                              >   │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │  🔌  Sign Out                                   >   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 20.4 UI Components

### UserInfoView — информация о пользователе

```swift
// Modules/Profile/UIComponents/CustomViews/UserInfoView.swift
import Foundation
import UIKit.UIView
import SDWebImage

final class UserInfoView: UIView {

    private lazy var profilePhotoImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFit
        imageView.layer.borderWidth = 3
        imageView.layer.borderColor = UIColor.label.cgColor
        imageView.layer.cornerRadius = 70
        imageView.clipsToBounds = true
        return imageView
    }()

    private lazy var emailLabel: UILabel = {
        let label = UILabel()
        label.textColor = .label
        label.font = .systemFont(ofSize: 20, weight: .semibold)
        label.textAlignment = .center
        return label
    }()

    private lazy var vStackView: VerticalStackView = {
        let stackView = VerticalStackView(
            arrangedSubviews: [profilePhotoImageView, emailLabel],
            spacing: 48
        )
        stackView.alignment = .center
        return stackView
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setUpConstraints()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        fatalError("init(coder:) has not been implemented")
    }

    private func setUpConstraints() {
        addSubview(vStackView)

        profilePhotoImageView.snp.makeConstraints { make in
            make.width.height.equalTo(140)
        }

        emailLabel.snp.makeConstraints { make in
            make.width.equalToSuperview().offset(44)
        }

        vStackView.snp.makeConstraints { make in
            make.centerX.centerY.equalToSuperview()
        }
    }

    func showModel(model: CurrentUserModel?) {
        profilePhotoImageView.sd_setImage(
            with: URL(string: model?.profileImageURLString ?? "https://picsum.photos/seed/picsum/500/500")
        )
        emailLabel.text = model?.userEmail ?? ""
    }
}
```

**Детали реализации:**

```
┌────────────────────────────────────────────────────────────────┐
│                      UserInfoView Layout                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   VerticalStackView (centered)                                  │
│   spacing: 48                                                   │
│   alignment: .center                                            │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              profilePhotoImageView                       │  │
│   │              ┌───────────────────┐                       │  │
│   │              │                   │  width: 140           │  │
│   │              │    [Photo/       │  height: 140          │  │
│   │              │     Placeholder]  │  cornerRadius: 70     │  │
│   │              │                   │  borderWidth: 3       │  │
│   │              │                   │  borderColor: .label  │  │
│   │              └───────────────────┘                       │  │
│   │                                                          │  │
│   │              spacing: 48pt                               │  │
│   │                                                          │  │
│   │              emailLabel                                  │  │
│   │              ─────────────────────                       │  │
│   │              user@example.com                            │  │
│   │              font: semibold 20                           │  │
│   │              textAlignment: .center                      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   SDWebImage загружает фото асинхронно:                        │
│   • Кэширует в памяти и на диске                               │
│   • Показывает placeholder при загрузке                        │
│   • Использует picsum.photos как fallback                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### ProfileCell — ячейка меню

```swift
// Modules/Profile/UIComponents/Cells/ProfileCell.swift
import UIKit

final class ProfileCell: UITableViewCell {

    static let identifier = "ProfileCell"

    private lazy var symbolImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.tintColor = .label
        return imageView
    }()

    private lazy var titleLabel: UILabel = {
        let label = UILabel()
        return label
    }()

    private lazy var hStackView: UIStackView = {
        let stackView = UIStackView(arrangedSubviews: [symbolImageView, titleLabel])
        stackView.axis = .horizontal
        stackView.alignment = .center
        stackView.spacing = 8
        return stackView
    }()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setUpConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setUpConstraints() {
        addSubview(hStackView)

        symbolImageView.snp.makeConstraints { make in
            make.width.height.equalTo(36)
        }

        hStackView.snp.makeConstraints { make in
            make.left.equalToSuperview().offset(20)
            make.top.right.bottom.equalToSuperview()
        }
    }

    func showModel(model: ProfileRowItemModel?) {
        symbolImageView.image = model?.item.image
        titleLabel.text = model?.item.title
    }
}
```

**Структура ячейки:**

```
┌─────────────────────────────────────────────────────────────────┐
│                       ProfileCell (60pt height)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  HStackView                                                 │ │
│  │  left: 20, spacing: 8                                       │ │
│  │                                                             │ │
│  │  ┌──────────┐  ┌─────────────────────────────┐  ┌───────┐  │ │
│  │  │  Symbol  │  │  Title Label                 │  │   >   │  │ │
│  │  │  36x36   │  │  "Address Information"       │  │       │  │ │
│  │  │   🗺️    │  │                              │  │       │  │ │
│  │  └──────────┘  └─────────────────────────────┘  └───────┘  │ │
│  │                                                 accessory   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 20.5 Addresses Module — управление адресами

### AddressesRouter

```swift
// Modules/Addresses/Base/AddressesRouter.swift
import Foundation
import UIKit.UIViewController

protocol AddressesRouterProtocol {
    func toAddAddress(address: AddressModel?)
}

final class AddressesRouter {

    private weak var view: UIViewController?

    init(view: UIViewController) {
        self.view = view
    }

    static func startAddressesModule() -> UIViewController {
        let view = AddressesViewController()
        let router = AddressesRouter(view: view)
        let interactor = AddressesInteractor(
            storageManager: RealmManager.shared,
            userInfoManager: UserInfoManager()
        )
        let presenter = AddressesPresenter(view: view, interactor: interactor, router: router)

        view.presenter = presenter
        interactor.presenter = presenter

        return view
    }
}

extension AddressesRouter: AddressesRouterProtocol {

    func toAddAddress(address: AddressModel?) {
        let addController = AddAddressViewController(address: address)
        self.view?.navigationController?.pushViewController(addController, animated: true)
    }
}
```

### AddressesInteractor

```swift
// Modules/Addresses/Base/AddressesInteractor.swift
import Foundation

protocol AddressesInteractorInputs {
    func getAddresses()
    func showAddresses() -> [AddressModel]?
    func addAction(model: [String: Any])
    func updateAction(model: [String: Any])
    func deleteAction(model: AddressModel?)
}

protocol AddressesInteractorOutputs: AnyObject {
    func dataRefreshed()
    func onError(error: RealmError)
}

final class AddressesInteractor {

    weak var presenter: AddressesInteractorOutputs?
    private let storageManager: RealmManagerProtocol?
    private let userInfoManager: UserInfoManagerProtocol?

    private var addresses: [AddressModel]? {
        didSet {
            presenter?.dataRefreshed()
        }
    }

    init(storageManager: RealmManagerProtocol?, userInfoManager: UserInfoManagerProtocol) {
        self.storageManager = storageManager
        self.userInfoManager = userInfoManager
    }
}

// MARK: Interactor Inputs
extension AddressesInteractor: AddressesInteractorInputs {

    func getAddresses() {
        self.addresses = storageManager?.getAll(AddressModel.self)
            .filter { $0.userId == userInfoManager?.getUserUid() }
    }

    func showAddresses() -> [AddressModel]? {
        return self.addresses
    }

    func addAction(model: [String: Any]) {
        let address = AddressModel(
            userId: (model["userId"] as! String),
            uuid: (model["uuid"] as! UUID),
            name: model["name"] as! String,
            country: model["country"] as! String,
            city: model["city"] as! String,
            street: model["street"] as! String,
            buildingNumber: model["buildingNumber"] as! Int,
            zipCode: model["zipCode"] as! Int
        )
        storageManager?.create(address, onError: { [weak self] error in
            guard let self else { return }
            presenter?.onError(error: error)
        })
        presenter?.dataRefreshed()
    }

    func updateAction(model: [String: Any]) {
        guard let savedAddress = self.addresses?
            .filter({ $0.uuid == (model["uuid"] as! UUID) }).first
        else { return }

        storageManager?.update(savedAddress, with: model, onError: { [weak self] error in
            guard let self else { return }
            self.presenter?.onError(error: error)
        })
        self.presenter?.dataRefreshed()
    }

    func deleteAction(model: AddressModel?) {
        if let model {
            if let index = self.addresses?.firstIndex(where: { $0.uuid == model.uuid }) {
                storageManager?.delete(model, onError: { [weak self] error in
                    guard let self else { return }
                    self.presenter?.onError(error: error)
                })
                self.addresses?.remove(at: index)
            }
        }
    }
}
```

**Фильтрация по userId:**

```
┌─────────────────────────────────────────────────────────────────┐
│                 Address Filtering by User                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Realm Database                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  AddressModel Objects                                    │   │
│   │  ├── userId: "user1", name: "Home", city: "Moscow"       │   │
│   │  ├── userId: "user1", name: "Work", city: "SPb"          │   │
│   │  ├── userId: "user2", name: "Office", city: "Kazan"      │   │
│   │  └── userId: "user1", name: "Parents", city: "Sochi"     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ↓                                      │
│   .filter { $0.userId == currentUserId }                        │
│                           │                                      │
│                           ↓                                      │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Filtered (user1 only)                                   │   │
│   │  ├── name: "Home", city: "Moscow"                        │   │
│   │  ├── name: "Work", city: "SPb"                           │   │
│   │  └── name: "Parents", city: "Sochi"                      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Каждый пользователь видит только свои адреса!                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AddressesPresenter

```swift
// Modules/Addresses/Base/AddressesPresenter.swift
import Foundation

protocol AddressesPresenterInputs {
    func viewDidLoad()
    func viewWillAppear()
    func numberOfItemsInSection(section: Int) -> Int
    func cellForItemAt(indexPath: IndexPath) -> AddressModel?
    func sizeForItemAt(indexPath: IndexPath) -> CGSize
    func didSelectItemAt(indexPath: IndexPath)
    func toAddButtonTapped()
    func trashTapped(model: AddressModel?)
    func plusButtonTapped()
}

final class AddressesPresenter {

    private weak var view: AddressesViewProtocol?
    private let interactor: AddressesInteractorInputs?
    private let router: AddressesRouterProtocol?

    init(view: AddressesViewProtocol, interactor: AddressesInteractorInputs, router: AddressesRouterProtocol) {
        self.view = view
        self.router = router
        self.interactor = interactor

        // Подписка на уведомления о добавлении/обновлении
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(self.notificationReceived(_:)),
            name: .addUpdateButtonNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self, name: .addUpdateButtonNotification, object: nil)
    }
}

extension AddressesPresenter: AddressesPresenterInputs {

    func viewDidLoad() {
        view?.setViewBackgroundColor(color: .systemBackground)
        view?.setNavBarTitle(title: "My Addresses")
        view?.prepareCollectionView()
        view?.prepareEmptyView()
        view?.preparePlusButton()
    }

    func viewWillAppear() {
        interactor?.getAddresses()
    }

    func numberOfItemsInSection(section: Int) -> Int {
        return interactor?.showAddresses()?.count ?? 0
    }

    func cellForItemAt(indexPath: IndexPath) -> AddressModel? {
        return interactor?.showAddresses()?[indexPath.item]
    }

    func sizeForItemAt(indexPath: IndexPath) -> CGSize {
        return .init(width: UIScreenBounds.width - 32, height: 180)
    }

    func didSelectItemAt(indexPath: IndexPath) {
        let selectedAddress = interactor?.showAddresses()?[indexPath.item]
        router?.toAddAddress(address: selectedAddress) // Редактирование
    }

    func toAddButtonTapped() {
        router?.toAddAddress(address: nil) // Создание нового
    }

    func plusButtonTapped() {
        router?.toAddAddress(address: nil)
    }

    @objc func notificationReceived(_ notification: Notification) {
        guard let newInfos = notification.userInfo?["address"] else { return }
        guard let action = notification.userInfo?["action"] else { return }

        if action as! String == "add" {
            interactor?.addAction(model: newInfos as! [String: Any])
        } else {
            interactor?.updateAction(model: newInfos as! [String: Any])
        }
    }

    func trashTapped(model: AddressModel?) {
        interactor?.deleteAction(model: model)
    }
}

extension AddressesPresenter: AddressesInteractorOutputs {

    func dataRefreshed() {
        view?.dataRefreshed()
    }

    func onError(error: RealmError) {
        view?.onError(message: error.localizedDescription)
    }
}
```

**NotificationCenter для передачи данных:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                 NotificationCenter Communication                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   AddAddressViewController                                           │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  addUpdateButtonTapped()                                       │ │
│   │       │                                                        │ │
│   │       ↓                                                        │ │
│   │  let userInfo = ["address": newInfos, "action": "add/update"]  │ │
│   │       │                                                        │ │
│   │       ↓                                                        │ │
│   │  NotificationCenter.post(name: .addUpdateButtonNotification,   │ │
│   │                          object: nil,                          │ │
│   │                          userInfo: userInfo)                   │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                           │                                          │
│                           │ Broadcast                                │
│                           ↓                                          │
│   AddressesPresenter                                                 │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  notificationReceived(_ notification)                          │ │
│   │       │                                                        │ │
│   │       ↓                                                        │ │
│   │  if action == "add":                                           │ │
│   │      interactor?.addAction(model: newInfos)                    │ │
│   │  else:                                                         │ │
│   │      interactor?.updateAction(model: newInfos)                 │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│   Преимущество: AddAddressVC не знает о Presenter                   │
│   Недостаток: слабая связь может усложнить отладку                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### AddressesViewController

```swift
// Modules/Addresses/Base/AddressesViewController.swift
import UIKit

protocol AddressesViewProtocol: AnyObject {
    func setViewBackgroundColor(color: UIColor)
    func setNavBarTitle(title: String)
    func prepareCollectionView()
    func prepareEmptyView()
    func preparePlusButton()
    func dataRefreshed()
    func onError(message: String)
}

final class AddressesViewController: UIViewController {

    private lazy var addressesCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(AddressCell.self, forCellWithReuseIdentifier: AddressCell.identifier)
        return collectionView
    }()

    private lazy var emptyView = EmptyAddressesView()

    internal var presenter: AddressesPresenterInputs!

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        presenter.viewDidLoad()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        presenter.viewWillAppear()
    }

    // MARK: - Actions
    @objc private func plusButtonTapped() {
        presenter.plusButtonTapped()
    }
}

// MARK: - View protocol
extension AddressesViewController: AddressesViewProtocol {

    func setViewBackgroundColor(color: UIColor) {
        self.view.backgroundColor = color
    }

    func setNavBarTitle(title: String) {
        self.title = title
    }

    func prepareCollectionView() {
        view.addSubview(addressesCollectionView)
        addressesCollectionView.backgroundColor = .systemGray6

        addressesCollectionView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }

    func prepareEmptyView() {
        view.addSubview(emptyView)
        emptyView.delegate = self

        emptyView.snp.makeConstraints { make in
            make.centerX.centerY.equalToSuperview()
        }
    }

    func preparePlusButton() {
        self.navigationItem.rightBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .add,
            target: self,
            action: #selector(plusButtonTapped)
        )
    }

    func dataRefreshed() {
        self.addressesCollectionView.reloadData()
    }

    func onError(message: String) {
        self.showAlert(title: "", message: message)
    }
}

// MARK: - EmptyAddressView button delegate
extension AddressesViewController: EmptyAddressesViewButtonDelegate {
    func toAddButtonTapped() {
        presenter.toAddButtonTapped()
    }
}

extension AddressesViewController: AddressCellTrashButtonDelegate {
    func trashTapped(model: AddressModel?) {
        presenter.trashTapped(model: model)
    }
}

// MARK: CollectionView Delegate & DataSource
extension AddressesViewController: UICollectionViewDelegate, UICollectionViewDataSource, UICollectionViewDelegateFlowLayout {

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        emptyView.isHidden = (presenter.numberOfItemsInSection(section: section) == 0) ? false : true
        return presenter.numberOfItemsInSection(section: section)
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let cell = addressesCollectionView.dequeueReusableCell(
            withReuseIdentifier: AddressCell.identifier,
            for: indexPath
        ) as? AddressCell else {
            return UICollectionViewCell()
        }

        cell.showModel(model: presenter.cellForItemAt(indexPath: indexPath))
        cell.delegate = self
        cell.layer.borderWidth = 1
        cell.layer.borderColor = UIColor.label.cgColor
        cell.layer.cornerRadius = 8
        cell.backgroundColor = .systemBackground

        return cell
    }

    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        return presenter.sizeForItemAt(indexPath: indexPath)
    }

    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        addressesCollectionView.deselectItem(at: indexPath, animated: true)
        presenter.didSelectItemAt(indexPath: indexPath)
    }
}
```

### AddressCell

```swift
// Modules/Addresses/UIComponents/Cells/AddressCell.swift
import UIKit

protocol AddressCellTrashButtonDelegate: AnyObject {
    func trashTapped(model: AddressModel?)
}

final class AddressCell: UICollectionViewCell {

    static let identifier = "AddressCell"

    private lazy var addressNameLabel: PaddingLabel = {
        let label = PaddingLabel(withInsets: 4, 4, 4, 4)
        label.textColor = .label
        label.font = .boldSystemFont(ofSize: 16)
        label.layer.borderWidth = 1
        label.layer.borderColor = UIColor.gray.cgColor
        label.layer.cornerRadius = 4
        return label
    }()

    private lazy var addressCityAndCountryLabel: UILabel = {
        let label = UILabel()
        label.textColor = .label
        return label
    }()

    private lazy var addressLabel: UILabel = {
        let label = UILabel()
        label.textColor = .label
        label.numberOfLines = 0
        return label
    }()

    private lazy var trashButton: UIButton = {
        let button = UIButton()
        button.setImage(
            UIImage(systemName: "trash", withConfiguration: UIImage.SymbolConfiguration(pointSize: 18)),
            for: .normal
        )
        button.tintColor = .systemRed
        button.addTarget(self, action: #selector(trashButtonTapped), for: .touchUpInside)
        return button
    }()

    private lazy var arrowImageView: UIImageView = {
        let image = UIImage(systemName: "arrow.right", withConfiguration: UIImage.SymbolConfiguration(pointSize: 12))
        let imageView = UIImageView()
        imageView.image = image
        imageView.tintColor = .label
        return imageView
    }()

    private lazy var VStackView: VerticalStackView = {
        let stackView = VerticalStackView(
            arrangedSubviews: [addressNameLabel, addressCityAndCountryLabel, addressLabel],
            spacing: 26
        )
        stackView.alignment = .leading
        return stackView
    }()

    private var model: AddressModel?
    weak var delegate: AddressCellTrashButtonDelegate?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setUpConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setUpConstraints() {
        addSubview(VStackView)
        addSubview(arrowImageView)
        contentView.addSubview(trashButton)

        arrowImageView.snp.makeConstraints { make in
            make.centerY.equalTo(contentView.snp.centerY)
            make.right.equalTo(contentView.snp.right).inset(16)
        }

        trashButton.snp.makeConstraints { make in
            make.centerX.equalTo(arrowImageView)
            make.top.equalToSuperview().offset(14)
        }

        VStackView.snp.makeConstraints { make in
            make.edges.equalToSuperview().inset(16)
        }
    }

    @objc private func trashButtonTapped() {
        delegate?.trashTapped(model: self.model)
    }

    func showModel(model: AddressModel?) {
        self.model = model
        addressNameLabel.text = model?.name ?? ""
        addressCityAndCountryLabel.text = "\(model?.city ?? ""), \(model?.country ?? "")"
        addressLabel.text = "\(model?.street ?? ""), No: \(model?.buildingNumber ?? 0), ZIP: \(model?.zipCode ?? 0)"
    }
}
```

**Визуальная структура ячейки:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AddressCell (180pt height)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐  🗑️    │
│  │  ┌──────────┐                                          │  trash  │
│  │  │  Home    │  addressNameLabel (with border)          │         │
│  │  └──────────┘                                          │         │
│  │                                                        │         │
│  │  Moscow, Russia                                        │    →    │
│  │  addressCityAndCountryLabel                            │  arrow  │
│  │                                                        │         │
│  │  Lenina Street, No: 15, ZIP: 123456                   │         │
│  │  addressLabel (numberOfLines: 0)                       │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                      │
│  VStackView (spacing: 26, inset: 16)                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### EmptyAddressesView

```swift
// Modules/Addresses/UIComponents/CustomViews/EmptyAddressesView.swift
import UIKit

protocol EmptyAddressesViewButtonDelegate: AnyObject {
    func toAddButtonTapped()
}

final class EmptyAddressesView: UIView {

    private lazy var infoLabel: UILabel = {
        let label = UILabel()
        label.tintColor = .label
        label.text = "You haven't added addresses yet!"
        label.font = .systemFont(ofSize: 20, weight: .thin)
        return label
    }()

    private lazy var toAddButton: UIButton = {
        let button = UIButton()
        button.setTitleColor(.systemBackground, for: .normal)
        button.setTitle("+ Add Address", for: .normal)
        button.backgroundColor = .label
        button.layer.cornerRadius = 8
        button.clipsToBounds = true
        button.titleEdgeInsets = .init(top: 8, left: 8, bottom: 8, right: 8)
        button.addTarget(self, action: #selector(toAddButtonTapped), for: .touchUpInside)
        return button
    }()

    private lazy var VStackView: VerticalStackView = {
        let stackView = VerticalStackView(arrangedSubviews: [infoLabel, toAddButton], spacing: 16)
        stackView.alignment = .center
        return stackView
    }()

    weak var delegate: EmptyAddressesViewButtonDelegate?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setConstraints() {
        addSubview(VStackView)

        toAddButton.snp.makeConstraints { make in
            make.width.equalTo(148)
            make.height.equalTo(40)
        }

        VStackView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }

    @objc private func toAddButtonTapped(_ sender: UIButton) {
        delegate?.toAddButtonTapped()
    }
}
```

### AddAddressViewController — форма добавления

```swift
// Modules/Addresses/AddAddress/AddAddressViewController.swift
import UIKit

extension Notification.Name {
    static let addUpdateButtonNotification = Notification.Name(rawValue: "AddUpdateButtonNotification")
}

final class AddAddressViewController: UIViewController {

    @IBOutlet private weak var nameTextField: UITextField!
    @IBOutlet private weak var countryTextField: UITextField!
    @IBOutlet private weak var cityTextField: UITextField!
    @IBOutlet private weak var streetTextField: UITextField!
    @IBOutlet private weak var buildingNoTextField: UITextField!
    @IBOutlet private weak var zipCodeTextField: UITextField!
    @IBOutlet private weak var addUpdateButton: UIButton!

    private lazy var pickerView = UIPickerView()

    private let service: CountriesServiceProtocol = CountriesService()
    private let userInfoManager: UserInfoManagerProtocol = UserInfoManager()

    private var address: AddressModel?
    private var countries: [Country] = []

    private let notificationCenter: NotificationCenter = NotificationCenter.default

    init(address: AddressModel?) {
        self.address = address
        super.init(nibName: "AddAddressView", bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupRequirements()
        getCountries()
    }

    override func viewWillAppear(_ animated: Bool) {
        setupWithModel()
    }

    private func setupRequirements() {
        pickerView.delegate = self
        pickerView.dataSource = self
        countryTextField.inputView = pickerView
    }

    private func setupWithModel() {
        if address != nil {
            nameTextField.text = address?.name
            countryTextField.text = address?.country
            cityTextField.text = address?.city
            streetTextField.text = address?.street
            buildingNoTextField.text = String(address?.buildingNumber ?? 0)
            zipCodeTextField.text = String(address?.zipCode ?? 0)
            addUpdateButton.setTitle("Update", for: .normal)
        }
    }

    @IBAction private func addUpdateButtonTapped(_ sender: Any) {
        defer {
            self.navigationController?.popViewController(animated: true)
        }

        if let name = nameTextField.text,
           let country = countryTextField.text,
           let city = cityTextField.text,
           let street = streetTextField.text,
           let buildingNo = buildingNoTextField.text,
           let zipCode = zipCodeTextField.text,
           !name.isEmpty,
           !country.isEmpty,
           !city.isEmpty,
           !street.isEmpty,
           !buildingNo.isEmpty,
           !zipCode.isEmpty {

            let newInfos: [String: AnyHashable] = [
                "userId": userInfoManager.getUserUid(),
                "uuid": self.address?.uuid ?? UUID(),
                "name": name,
                "country": country,
                "city": city,
                "street": street,
                "buildingNumber": Int(buildingNo),
                "zipCode": Int(zipCode)
            ]

            let action = addUpdateButton.titleLabel?.text == "Add" ? "add" : "update"
            let userInfoForNC: [String: Any] = ["address": newInfos, "action": action]
            notificationCenter.post(name: .addUpdateButtonNotification, object: nil, userInfo: userInfoForNC)
        } else {
            self.showAlert(title: "", message: GeneralError.addressInfoMissing.localizedDescription)
        }
    }

    private func getCountries() {
        Task {
            try await service.getAllCountries { [weak self] result in
                guard let self else { return }

                switch result {
                case .success(let countries):
                    DispatchQueue.main.async { [weak self] in
                        self?.countries = countries.sorted()
                        self?.pickerView.reloadAllComponents()
                    }
                case .failure(let error):
                    print(error.localizedDescription)
                }
            }
        }
    }
}

// MARK: - PickerViewDelegate
extension AddAddressViewController: UIPickerViewDelegate, UIPickerViewDataSource {

    func numberOfComponents(in pickerView: UIPickerView) -> Int {
        return 1
    }

    func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
        return countries.count
    }

    func pickerView(_ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String? {
        return countries[row].name.common
    }

    func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
        countryTextField.text = countries[row].name.common
    }
}
```

**UIPickerView как inputView:**

```
┌─────────────────────────────────────────────────────────────────────┐
│           UIPickerView as TextField InputView                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   countryTextField.inputView = pickerView                            │
│                                                                      │
│   Когда пользователь нажимает на countryTextField:                  │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                              │   │
│   │   [ Name:     Home                                    ]      │   │
│   │   [ Country:  Russia                                  ] ←tap │   │
│   │   [ City:     _____                                   ]      │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                           │                                          │
│                           ↓                                          │
│   Вместо клавиатуры появляется:                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ┌─────────────────────────────────────────────────────┐    │   │
│   │  │                 Afghanistan                          │    │   │
│   │  │                 Albania                              │    │   │
│   │  │ ═══════════════ Russia ═══════════════ (selected)   │    │   │
│   │  │                 Rwanda                               │    │   │
│   │  │                 Saudi Arabia                         │    │   │
│   │  └─────────────────────────────────────────────────────┘    │   │
│   │                    UIPickerView                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   didSelectRow → countryTextField.text = countries[row].name.common  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 20.6 PaymentInfo Module — управление картами

### PaymentInfoRouter

```swift
// Modules/PaymentInfo/Base/PaymentInfoRouter.swift
import Foundation
import UIKit.UIViewController

protocol PaymentInfoRouterProtocol {
    func toAddCard(card: CardModel?)
}

final class PaymentInfoRouter {

    private weak var view: UIViewController?

    init(view: UIViewController?) {
        self.view = view
    }

    static func startPaymentInfoModule() -> UIViewController {
        let view = PaymentInfoViewController()
        let router = PaymentInfoRouter(view: view)
        let interactor = PaymentInfoInteractor(
            storageManager: RealmManager.shared,
            userInfoManager: UserInfoManager()
        )
        let presenter = PaymentInfoPresenter(view: view, router: router, interactor: interactor)

        view.presenter = presenter
        interactor.presenter = presenter

        return view
    }
}

extension PaymentInfoRouter: PaymentInfoRouterProtocol {

    func toAddCard(card: CardModel?) {
        let addCardViewController = AddCardViewController(card: card)
        self.view?.navigationController?.pushViewController(addCardViewController, animated: true)
    }
}
```

### PaymentInfoInteractor

```swift
// Modules/PaymentInfo/Base/PaymentInfoInteractor.swift
import Foundation

protocol PaymentInfoInteractorInputs {
    func getCards()
    func showCards() -> [CardModel]?
    func addAction(model: [String: Any])
    func updateAction(model: [String: Any])
    func deleteAction(model: CardModel?)
}

protocol PaymentInfoInteractorOutputs: AnyObject {
    func onError(error: RealmError)
    func dataRefreshed()
}

final class PaymentInfoInteractor {

    weak var presenter: PaymentInfoInteractorOutputs!
    private let storageManager: RealmManagerProtocol?
    private let userInfoManager: UserInfoManagerProtocol?

    private var cards: [CardModel]?

    init(storageManager: RealmManagerProtocol, userInfoManager: UserInfoManagerProtocol) {
        self.storageManager = storageManager
        self.userInfoManager = userInfoManager
    }
}

extension PaymentInfoInteractor: PaymentInfoInteractorInputs {

    func getCards() {
        self.cards = storageManager?.getAll(CardModel.self)
            .filter { $0.userId == userInfoManager?.getUserUid() }
    }

    func showCards() -> [CardModel]? {
        return self.cards
    }

    func addAction(model: [String : Any]) {
        let card = CardModel(
            userId: model["userId"] as! String,
            uuid: model["uuid"] as! String,
            nameSurname: model["nameSurname"] as! String,
            cardName: model["cardName"] as! String,
            cardNumber: model["cardNumber"] as! String,
            month: model["month"] as! String,
            year: model["year"] as! String,
            cvv: model["cvv"] as! String
        )

        storageManager?.create(card) { [weak self] error in
            guard let self else { return }
            self.presenter.onError(error: error)
        }
        presenter?.dataRefreshed()
    }

    func updateAction(model: [String : Any]) {
        guard let savedCard = self.cards?
            .filter({ $0.uuid == (model["uuid"] as! String) }).first
        else { return }

        storageManager?.update(savedCard, with: model, onError: { [weak self] error in
            guard let self else { return }
            self.presenter?.onError(error: error)
        })
        self.presenter?.dataRefreshed()
    }

    func deleteAction(model: CardModel?) {
        if let model {
            if let index = self.cards?.firstIndex(where: { $0.uuid == model.uuid }) {
                storageManager?.delete(model, onError: { [weak self] error in
                    guard let self else { return }
                    self.presenter?.onError(error: error)
                })
                self.cards?.remove(at: index)
                self.presenter.dataRefreshed()
            }
        }
    }
}
```

### PaymentInfoPresenter

```swift
// Modules/PaymentInfo/Base/PaymentInfoPresenter.swift
import Foundation

protocol PaymentInfoPresenterInputs {
    func viewDidLoad()
    func viewWillAppear()
    func plusButtonTapped()
    func numberOfItemsInSection(section: Int) -> Int
    func cellForItemAt(indexPath: IndexPath) -> CardModel?
    func sizeForItemAt(indexPath: IndexPath) -> CGSize
    func didSelectItemAt(indexPath: IndexPath)
    func trashTapped(model: CardModel?)
    func toAddButtonTapped()
}

final class PaymentInfoPresenter {

    private weak var view: PaymentInfoViewProtocol?
    private let router: PaymentInfoRouterProtocol?
    private let interactor: PaymentInfoInteractorInputs?

    init(view: PaymentInfoViewProtocol, router: PaymentInfoRouterProtocol, interactor: PaymentInfoInteractorInputs) {
        self.view = view
        self.router = router
        self.interactor = interactor

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(self.notificationReceived(_:)),
            name: .cardAddButtonNotification,
            object: nil
        )
    }
}

extension PaymentInfoPresenter: PaymentInfoPresenterInputs {

    func viewDidLoad() {
        view?.setNavTitle(title: "My Cards")
        view?.setBackgrodunColor(color: .systemBackground)
        view?.prepareCollectionView()
        view?.prepareEmptyCardView()
        view?.preparePlusButton()
    }

    func viewWillAppear() {
        interactor?.getCards()
    }

    func plusButtonTapped() {
        router?.toAddCard(card: nil)
    }

    func numberOfItemsInSection(section: Int) -> Int {
        return interactor?.showCards()?.count ?? 0
    }

    func cellForItemAt(indexPath: IndexPath) -> CardModel? {
        return interactor?.showCards()?[indexPath.item]
    }

    func sizeForItemAt(indexPath: IndexPath) -> CGSize {
        return .init(width: UIScreenBounds.width - 32, height: 100)
    }

    func didSelectItemAt(indexPath: IndexPath) {
        let selectedCard = interactor?.showCards()?[indexPath.item]
        router?.toAddCard(card: selectedCard)
    }

    @objc func notificationReceived(_ notification: Notification) {
        guard let cardInfos = notification.userInfo?["card"] else { return }
        guard let action = notification.userInfo?["action"] else { return }

        if action as! String == "add" {
            interactor?.addAction(model: cardInfos as! [String: Any])
        } else {
            interactor?.updateAction(model: cardInfos as! [String: Any])
        }
    }

    func trashTapped(model: CardModel?) {
        interactor?.deleteAction(model: model)
    }

    func toAddButtonTapped() {
        router?.toAddCard(card: nil)
    }
}

extension PaymentInfoPresenter: PaymentInfoInteractorOutputs {

    func onError(error: RealmError) {
        view?.onError(message: error.localizedDescription)
    }

    func dataRefreshed() {
        view?.dataRefreshed()
    }
}
```

### PaymentInfoViewController

```swift
// Modules/PaymentInfo/Base/PaymentInfoViewController.swift
import UIKit

protocol PaymentInfoViewProtocol: AnyObject {
    func setNavTitle(title: String)
    func setBackgrodunColor(color: UIColor)
    func preparePlusButton()
    func prepareCollectionView()
    func prepareEmptyCardView()
    func onError(message: String)
    func dataRefreshed()
}

final class PaymentInfoViewController: UIViewController {

    private lazy var paymentCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(CardCell.self, forCellWithReuseIdentifier: CardCell.identifier)
        return collectionView
    }()

    private lazy var emptyCardView = EmptyCardView()

    internal var presenter: PaymentInfoPresenterInputs!

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        presenter.viewDidLoad()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        presenter.viewWillAppear()
    }

    // MARK: - Actions
    @objc private func plusButtonTapped() {
        presenter.plusButtonTapped()
    }
}

// MARK: - View protocols
extension PaymentInfoViewController: PaymentInfoViewProtocol {

    func setNavTitle(title: String) {
        self.title = title
    }

    func setBackgrodunColor(color: UIColor) {
        self.view.backgroundColor = color
    }

    func preparePlusButton() {
        self.navigationItem.rightBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .add,
            target: self,
            action: #selector(plusButtonTapped)
        )
    }

    func prepareEmptyCardView() {
        view.addSubview(emptyCardView)
        emptyCardView.delegate = self

        emptyCardView.snp.makeConstraints { make in
            make.centerX.centerY.equalToSuperview()
        }
    }

    func prepareCollectionView() {
        view.addSubview(paymentCollectionView)
        paymentCollectionView.backgroundColor = .systemGray6

        paymentCollectionView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }

    func onError(message: String) {
        self.showAlert(title: "", message: message)
    }

    func dataRefreshed() {
        self.paymentCollectionView.reloadData()
    }
}

// MARK: - EmptyView Button Delegate
extension PaymentInfoViewController: EmptyCardViewButtonDelegate {
    func toAddButtonTapped() {
        presenter.toAddButtonTapped()
    }
}

// MARK: - Cell Button Delegate
extension PaymentInfoViewController: CardCellTrashButtonDelegate {
    func trashTapped(model: CardModel?) {
        presenter.trashTapped(model: model)
    }
}

// MARK: - UICollectionView Delegates & DataSource
extension PaymentInfoViewController: UICollectionViewDelegate, UICollectionViewDataSource, UICollectionViewDelegateFlowLayout {

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        emptyCardView.isHidden = (presenter.numberOfItemsInSection(section: section) == 0) ? false : true
        return presenter.numberOfItemsInSection(section: section)
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let cell = paymentCollectionView.dequeueReusableCell(
            withReuseIdentifier: CardCell.identifier,
            for: indexPath
        ) as? CardCell else {
            return UICollectionViewCell()
        }
        cell.layer.borderWidth = 1
        cell.layer.borderColor = UIColor.label.cgColor
        cell.layer.cornerRadius = 8
        cell.backgroundColor = .systemBackground
        cell.delegate = self
        cell.showModel(model: presenter.cellForItemAt(indexPath: indexPath))
        return cell
    }

    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        return presenter.sizeForItemAt(indexPath: indexPath)
    }

    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        paymentCollectionView.deselectItem(at: indexPath, animated: true)
        presenter.didSelectItemAt(indexPath: indexPath)
    }
}
```

### CardCell

```swift
// Modules/PaymentInfo/UIComponents/Cells/CardCell.swift
import UIKit

protocol CardCellTrashButtonDelegate: AnyObject {
    func trashTapped(model: CardModel?)
}

class CardCell: UICollectionViewCell {

    static let identifier = "CardCell"

    private lazy var cardNameLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 20, weight: .thin)
        return label
    }()

    private lazy var cardNumber: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 16)
        return label
    }()

    private lazy var trashButton: UIButton = {
        let button = UIButton()
        button.setImage(
            UIImage(systemName: "trash", withConfiguration: UIImage.SymbolConfiguration(pointSize: 18)),
            for: .normal
        )
        button.tintColor = .systemRed
        button.addTarget(self, action: #selector(trashButtonTapped), for: .touchUpInside)
        return button
    }()

    private lazy var vStackView: UIStackView = {
        let stackView = VerticalStackView(
            arrangedSubviews: [cardNameLabel, cardNumber],
            spacing: 16
        )
        stackView.alignment = .leading
        return stackView
    }()

    private var model: CardModel?
    weak var delegate: CardCellTrashButtonDelegate?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setConstraints() {
        addSubview(vStackView)
        contentView.addSubview(trashButton)

        trashButton.snp.makeConstraints { make in
            make.right.equalTo(contentView.snp.right).inset(16)
            make.top.equalToSuperview().offset(14)
        }

        vStackView.snp.makeConstraints { make in
            make.edges.equalToSuperview().inset(16)
        }
    }

    @objc private func trashButtonTapped() {
        delegate?.trashTapped(model: self.model)
    }

    func showModel(model: CardModel?) {
        self.model = model
        self.cardNameLabel.text = model?.cardName ?? ""
        self.cardNumber.text = model?.cardNumber
    }
}
```

---

## 20.7 OrderHistory Module — история заказов

```swift
// Modules/OrderHistory/Controller/OrderHistoryViewController.swift
import UIKit
import FirebaseFirestore

final class OrderHistoryViewController: UIViewController {

    private lazy var ordersTableView: UITableView = {
        let tableView = UITableView()
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(OrderCell.self, forCellReuseIdentifier: OrderCell.identifier)
        tableView.rowHeight = UITableView.automaticDimension
        tableView.backgroundColor = .systemGray6
        return tableView
    }()

    private var orders: [OrderModel] = []

    private let userInfoManager: UserInfoManagerProtocol = UserInfoManager()

    override func viewDidLoad() {
        super.viewDidLoad()

        self.title = "Order History"
        setupConstraints()
        getOrders()
    }

    private func setupConstraints() {
        view.addSubview(ordersTableView)

        ordersTableView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }

    private func getOrders() {
        if let userId = userInfoManager.getUserUid() {
            Firestore.firestore()
                .collection("Orders")
                .whereField("userId", isEqualTo: userId)
                .addSnapshotListener { [weak self] snapshot, error in
                    guard let self else { return }

                    if let error {
                        showAlert(title: "", message: error.localizedDescription)
                        return
                    } else {
                        guard let documents = snapshot?.documents else { return }
                        self.orders = []
                        for document in documents {
                            if let date = document.get("date") as? Timestamp,
                               let products = document.get("products") as? [String: Int],
                               let total = document.get("total") as? Double
                            {
                                let order = OrderModel(date: date, products: products, total: total)
                                self.orders.append(order)
                                self.ordersTableView.reloadData()
                            }
                        }
                    }
                }
        }
    }
}

extension OrderHistoryViewController: UITableViewDelegate, UITableViewDataSource {

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return self.orders.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let cell = ordersTableView.dequeueReusableCell(
            withIdentifier: OrderCell.identifier,
            for: indexPath
        ) as? OrderCell else {
            return UITableViewCell()
        }
        cell.showModel(order: self.orders[indexPath.row])
        cell.selectionStyle = .none
        cell.backgroundColor = .systemBackground
        return cell
    }
}

struct OrderModel {
    let date: Timestamp
    let products: [String: Int]
    let total: Double
}
```

**Firestore Query с фильтрацией:**

```
┌─────────────────────────────────────────────────────────────────────┐
│              Firestore Order History Query                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Firestore.firestore()                                              │
│       .collection("Orders")                                          │
│       .whereField("userId", isEqualTo: userId)  ← фильтрация        │
│       .addSnapshotListener { snapshot, error in ... }                │
│                                                                      │
│   Firestore Collection: "Orders"                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Document 1                                                  │   │
│   │  ├── userId: "user1"  ✓                                      │   │
│   │  ├── date: Timestamp                                         │   │
│   │  ├── products: {"iPhone": 2, "AirPods": 1}                   │   │
│   │  └── total: 1299.99                                          │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  Document 2                                                  │   │
│   │  ├── userId: "user2"  ✗ (не включается)                      │   │
│   │  └── ...                                                     │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  Document 3                                                  │   │
│   │  ├── userId: "user1"  ✓                                      │   │
│   │  ├── date: Timestamp                                         │   │
│   │  ├── products: {"MacBook": 1}                                │   │
│   │  └── total: 1999.00                                          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   addSnapshotListener — real-time updates                            │
│   (если добавится новый заказ, UI обновится автоматически)          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### OrderCell

```swift
// Modules/OrderHistory/Cells/OrderCell.swift
import UIKit

final class OrderCell: UITableViewCell {

    static let identifier = "OrderCell"

    private lazy var orderDateLabel: UILabel = {
        let label = UILabel()
        label.numberOfLines = 0
        label.textColor = .label
        label.font = .boldSystemFont(ofSize: 18)
        return label
    }()

    private lazy var productsLabel: UILabel = {
        let label = UILabel()
        label.numberOfLines = 0
        label.textColor = .label
        label.font = .systemFont(ofSize: 18)
        return label
    }()

    private lazy var totalPriceLabel: UILabel = {
        let label = UILabel()
        label.numberOfLines = 0
        label.textColor = .label
        label.font = .boldSystemFont(ofSize: 18)
        return label
    }()

    private lazy var vStackView: VerticalStackView = {
        let stackView = VerticalStackView(
            arrangedSubviews: [orderDateLabel, productsLabel, totalPriceLabel],
            spacing: 16
        )
        stackView.alignment = .center
        return stackView
    }()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupConstraints() {
        addSubview(vStackView)

        vStackView.snp.makeConstraints { make in
            make.edges.equalToSuperview().inset(16)
        }
    }

    func showModel(order: OrderModel) {
        let timestamp: TimeInterval = TimeInterval(order.date.seconds)
        let date = Date(timeIntervalSince1970: timestamp)

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "MMM d, yyyy 'at' h:mm:ss a"

        let dateString = dateFormatter.string(from: date)

        orderDateLabel.text = dateString
        let formattedPrice = String(format: "%.2f", order.total)
        totalPriceLabel.text = "TOTAL: $" + formattedPrice

        var productsText = ""
        for (key, value) in order.products {
            productsText += "🛍️" + key + " ⎯ \(value)" + "\n"
        }
        productsLabel.text = productsText
    }
}
```

**Визуальная структура ячейки заказа:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      OrderCell (dynamic height)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │                   Mar 14, 2023 at 3:26:10 PM                  │  │
│  │                   (orderDateLabel - bold 18)                  │  │
│  │                                                                │  │
│  │                   spacing: 16pt                                │  │
│  │                                                                │  │
│  │                   🛍️ iPhone 14 Pro ⎯ 2                        │  │
│  │                   🛍️ AirPods Pro ⎯ 1                          │  │
│  │                   🛍️ MacBook Air ⎯ 1                          │  │
│  │                   (productsLabel - regular 18)                │  │
│  │                                                                │  │
│  │                   spacing: 16pt                                │  │
│  │                                                                │  │
│  │                   TOTAL: $3499.97                             │  │
│  │                   (totalPriceLabel - bold 18)                 │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  VStackView (alignment: .center, spacing: 16, inset: 16)            │
│  rowHeight = UITableView.automaticDimension                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 20.8 Полная архитектура приложения

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ECommerce App Architecture                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        UITabBarController                           │ │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │ │
│  │  │   Home   │  Search  │  Basket  │Favorites │  Profile │          │ │
│  │  │   🏠     │   🔍     │   🛒     │    ❤️    │    👤    │          │ │
│  │  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘          │ │
│  └───────│──────────│──────────│──────────│──────────│────────────────┘ │
│          │          │          │          │          │                   │
│          ↓          ↓          ↓          ↓          ↓                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│  │   Home    │ │  Search   │ │  Basket   │ │ Favorites │ │  Profile  │  │
│  │   VIPER   │ │   VIPER   │ │   VIPER   │ │   VIPER   │ │   VIPER   │  │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘  │
│        │             │             │             │             │         │
│        ↓             ↓             ↓             ↓             ↓         │
│  ┌───────────┐       │       ┌───────────┐       │       ┌───────────┐  │
│  │ Product   │       │       │ Complete  │       │       │ Addresses │  │
│  │ Detail    │←──────┘       │ Order     │       │       │   VIPER   │  │
│  │   VIPER   │               │   VIPER   │       │       └───────────┘  │
│  └───────────┘               └───────────┘       │       ┌───────────┐  │
│                                                  │       │ Payment   │  │
│                                                  │       │ Info      │  │
│                                                  │       │   VIPER   │  │
│                                                  │       └───────────┘  │
│                                                  │       ┌───────────┐  │
│                                                  │       │ Order     │  │
│                                                  │       │ History   │  │
│                                                  │       │   MVC     │  │
│                                                  │       └───────────┘  │
│                                                  │                       │
├──────────────────────────────────────────────────┴───────────────────────┤
│                          Shared Services                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ AuthManager  │  │ UserInfo     │  │ RealmManager │  │ BasketManager│ │
│  │ (Firebase)   │  │ Manager      │  │ (Local DB)   │  │ (Firestore)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 20.9 Полная структура проекта

```
ECommerce/
├── Application/
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   └── Info.plist
│
├── Core/
│   ├── Extensions/
│   │   ├── UIView+Extensions.swift
│   │   ├── UIViewController+Extensions.swift
│   │   └── Notification+Extensions.swift
│   ├── Helpers/
│   │   ├── VerticalStackView.swift
│   │   ├── PaddingLabel.swift
│   │   └── UIScreenBounds.swift
│   └── Protocols/
│       └── RootWindowManagerProtocol.swift
│
├── Entities/
│   ├── Enums/
│   │   ├── ProfileRowItem.swift
│   │   ├── FirebaseError.swift
│   │   ├── GeneralError.swift
│   │   ├── NetworkError.swift
│   │   └── RealmError.swift
│   └── Models/
│       ├── CurrentUserModel.swift
│       ├── ProfileRowItemModel.swift
│       ├── ResponseModels/
│       │   ├── ProductModel.swift
│       │   ├── Categories.swift
│       │   └── CountryModel.swift
│       └── StorageModels/
│           ├── AddressModel.swift
│           ├── CardModel.swift
│           ├── BasketModel.swift
│           └── FavoriteProductModel.swift
│
├── Managers/
│   ├── AuthManager/
│   │   └── AuthManager.swift
│   ├── UserInfoManager/
│   │   └── UserInfoManager.swift
│   ├── RealmManager/
│   │   └── RealmManager.swift
│   ├── BasketManager/
│   │   └── BasketManager.swift
│   └── RootWindowManager/
│       └── RootWindowManager.swift
│
├── Services/
│   ├── ProductsService.swift
│   ├── CategoriesService.swift
│   └── CountriesService.swift
│
├── Modules/
│   ├── Onboarding/
│   │   └── ... (VIPER)
│   ├── Login/
│   │   └── ... (VIPER)
│   ├── SignUp/
│   │   └── ... (VIPER)
│   ├── Home/
│   │   └── ... (VIPER)
│   ├── ProductDetail/
│   │   └── ... (VIPER)
│   ├── Basket/
│   │   └── ... (VIPER)
│   ├── CompleteOrder/
│   │   └── ... (VIPER)
│   ├── Favorites/
│   │   └── ... (VIPER)
│   ├── Profile/
│   │   ├── Base/
│   │   │   ├── ProfileRouter.swift
│   │   │   ├── ProfileInteractor.swift
│   │   │   ├── ProfilePresenter.swift
│   │   │   └── ProfileViewController.swift
│   │   └── UIComponents/
│   │       ├── Cells/
│   │       │   └── ProfileCell.swift
│   │       └── CustomViews/
│   │           └── UserInfoView.swift
│   ├── Addresses/
│   │   ├── Base/
│   │   │   ├── AddressesRouter.swift
│   │   │   ├── AddressesInteractor.swift
│   │   │   ├── AddressesPresenter.swift
│   │   │   └── AddressesViewController.swift
│   │   ├── AddAddress/
│   │   │   ├── AddAddressViewController.swift
│   │   │   └── AddAddressView.xib
│   │   └── UIComponents/
│   │       ├── Cells/
│   │       │   └── AddressCell.swift
│   │       └── CustomViews/
│   │           └── EmptyAddressesView.swift
│   ├── PaymentInfo/
│   │   ├── Base/
│   │   │   ├── PaymentInfoRouter.swift
│   │   │   ├── PaymentInfoInteractor.swift
│   │   │   ├── PaymentInfoPresenter.swift
│   │   │   └── PaymentInfoViewController.swift
│   │   ├── AddCard/
│   │   │   ├── AddCardViewController.swift
│   │   │   └── AddCardView.xib
│   │   └── UIComponents/
│   │       ├── Cells/
│   │       │   └── CardCell.swift
│   │       └── CustomViews/
│   │           └── EmptyCardView.swift
│   └── OrderHistory/
│       ├── Controller/
│       │   └── OrderHistoryViewController.swift
│       └── Cells/
│           └── OrderCell.swift
│
└── Resources/
    ├── Assets.xcassets
    ├── LaunchScreen.storyboard
    └── GoogleService-Info.plist
```

---

## 20.10 Итоги главы

В этой главе мы создали:

| Модуль | Архитектура | Хранение | Описание |
|--------|-------------|----------|----------|
| Profile | VIPER | Firebase Auth | Информация о пользователе |
| Addresses | VIPER | Realm | Адреса доставки |
| PaymentInfo | VIPER | Realm | Платёжные карты |
| OrderHistory | MVC | Firestore | История заказов |

**Ключевые паттерны:**

1. **NotificationCenter** — для передачи данных между экранами
2. **Delegate Pattern** — для кнопок в ячейках
3. **UIPickerView as inputView** — для выбора страны
4. **Firestore SnapshotListener** — для real-time обновлений
5. **Realm filtering** — фильтрация по userId

---

## Заключение книги

Поздравляем! Вы прошли полный путь от основ Swift до создания полноценного iOS-приложения интернет-магазина.

### Что вы изучили:

**Swift (Главы 1-10)**
- Переменные, типы данных, операторы
- Условия, циклы, коллекции
- Функции и замыкания
- ООП: классы, структуры, перечисления
- Протоколы и расширения
- Опционалы и обработка ошибок
- Управление памятью (ARC)
- Дженерики
- Многопоточность

**UIKit (Главы 11-12)**
- Иерархия классов UIKit
- UIView, UIViewController
- TableView, CollectionView
- Навигация и TabBar
- Auto Layout и SnapKit
- Анимации

**Архитектура (Глава 13)**
- Паттерн VIPER
- Разделение ответственности
- Протоколы и модули

**Практика (Главы 14-20)**
- Настройка проекта
- Firebase Authentication
- Работа с API (Fake Store API)
- Realm Database
- Firestore для облачных данных
- Полноценные VIPER-модули

### Технологии в проекте:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Technology Stack                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Language:     Swift 5.9                                         │
│  UI:           UIKit (programmatic)                              │
│  Architecture: VIPER                                             │
│  Layout:       SnapKit (Auto Layout wrapper)                     │
│  Images:       SDWebImage (async loading + caching)              │
│  Auth:         Firebase Authentication                           │
│  Cloud DB:     Firebase Firestore                                │
│  Local DB:     Realm                                             │
│  API:          URLSession + Codable                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Следующие шаги:

1. **SwiftUI** — современный декларативный UI-фреймворк
2. **Combine** — реактивное программирование
3. **Core Data** — альтернатива Realm от Apple
4. **Unit Testing** — тестирование кода
5. **CI/CD** — автоматизация сборки и деплоя

### Ресурсы для продолжения обучения:

- [Swift Documentation](https://swift.org/documentation/)
- [Apple Developer](https://developer.apple.com)
- [Hacking with Swift](https://www.hackingwithswift.com)
- [Ray Wenderlich](https://www.raywenderlich.com)

---

**Удачи в iOS-разработке!**
