// ════════════════════════════════════════════════════════
// ── ЯЗЫК ИНТЕРФЕЙСА (RU / EN) ──
// Интерфейс написан по-русски. Для английского переводим «на лету»:
// MutationObserver ловит новый текст и подменяет по словарю.
// Пользовательский контент (сообщения, имена, био) не трогаем.
// Подключается последним.
// ════════════════════════════════════════════════════════
const SLON_LANG=(()=>{try{return JSON.parse(localStorage.getItem('sl_lang'))||'ru';}catch(e){return 'ru';}})();

function _langName(){return SLON_LANG==='en'?'English':'Русский';}

const _I18N_EN={
'Аккаунт':'Account','Аккаунт заблокирован':'Account blocked','Аккаунт не найден — зарегистрируйся!':'Account not found — sign up!',
'Активна':'Active','Активные сеансы':'Active sessions','Анимации и производительность':'Animations and Performance','Анимации интерфейса':'Interface animations',
'Арктика':'Arctic','Архив пуст':'Archive is empty','Архивированные чаты':'Archived chats','Архивировать и заглушать':'Archive and mute',
'Аудио':'Audio','Аудио недоступно':'Audio unavailable','Аудиозвонок':'Voice call','Бегемот':'Hippo','Бегемоты':'Hippos','Без звука':'Mute',
'Без имени':'No name','БЕСПЛАТНЫЕ':'FREE','Биография обновлена':'Bio updated','больше не может приглашать':'can no longer invite',
'Браузер':'Browser','Браузер не поддерживает доступ к устройствам':'Your browser does not support device access','Браузер не поддерживает уведомления':'Your browser does not support notifications',
'Браузер не умеет выбирать динамик — звук идёт в системный':'Your browser can\'t pick a speaker — sound goes to the system default',
'будет удалена. Контакт останется.':'will be deleted. The contact will remain.',
'Будут удалены все сообщения, контакты, юзернейм и настройки. Это действие необратимо!':'All messages, contacts, username and settings will be deleted. This cannot be undone!',
'будут удалены. Сам чат и контакт останутся.':'will be deleted. The chat and contact will remain.',
'был(а) вчера в':'last seen yesterday at','был(а) недавно':'last seen recently','был(а) сегодня в':'last seen today at','был(а) только что':'last seen just now','был(а)':'last seen',
'В архив':'Archive','В войсе':'In voice','в войсе «':'in voice «','В группе нет других участников':'There are no other members in the group',
'В профиле будет видно, открыт ты сейчас или нет':'Your profile will show whether you\'re open right now','в сети':'online','В сети':'Online',
'Введи код-пароль':'Enter passcode','Введи название':'Enter a name','Введи название группы':'Enter group name','Введи название канала':'Enter channel name',
'Введи название папки':'Enter folder name','Введи пароль':'Enter password','Введи текст поста':'Enter post text','Введи юзернейм':'Enter username',
'Введи юзернейм и пароль':'Enter username and password','Введи юзернейм канала':'Enter channel username','Введи юзернейм канала (без @)':'Enter channel username (without @)',
'Введи юзернейм собеседника (без @). Например:':'Enter the person\'s username (without @). For example:',
'Веб-уведомления':'Web Notifications','Видео':'Video','Видео недоступно':'Video unavailable','Видеозвонок':'Video call','Виртуальные соединения':'Virtual connections',
'Вишня':'Cherry','Вкл':'On','Вкл камеру':'Camera on','Вкл. звук':'Unmute','Вкладки сверху':'Tabs at the top','Вкладки слева':'Tabs on the left',
'Включён':'Enabled','Включено':'Enabled','Включены':'Enabled','Включить':'Enable','Включить звук':'Unmute','Включить код-пароль':'Turn on passcode',
'Включить уведомления':'Enable notifications','Включить уведомления 🔔':'Enable notifications 🔔','Вместо 3 — веди сразу несколько своих каналов':'Instead of 3 — run several channels at once',
'Войс':'Voice','Войсов пока нет. Создай первый!':'No voice rooms yet. Create the first one!','Войсы':'Voice rooms','Войти':'Log in','Войти 🐘':'Log in 🐘','Войти в SLON':'Log in to SLON',
'Воскресенье':'Sunday','Время последнего захода':'Last seen time',
'Время указывается по твоему часовому поясу. Собеседники увидят статус «Открыто/Закрыто» по твоему времени.':'Times are in your time zone. Others will see «Open/Closed» based on your local time.',
'Все':'Everybody','Все видят, что ты поддерживаешь SLON':'Everyone sees that you support SLON','Все контакты смогут найти тебя только по новому юзернейму.':'Contacts will only be able to find you by your new username.',
'Все сообщения в чате с':'All messages in the chat with','Все сохранённые сообщения будут удалены безвозвратно.':'All saved messages will be permanently deleted.',
'Все чаты':'All Chats','Все неархивные чаты':'All unarchived chats','Всегда онлайн':'Always online','Вторник':'Tuesday','Вулкан':'Volcano','Вход с других устройств':'Sign-in from other devices',
'Входящий звонок':'Incoming call','Вчера':'Yesterday','Вы на экране':'You are on screen','Вы:':'You:','Вы: 🎙️ Голосовое':'You: 🎙️ Voice message','Вы: 🐘 Слонкружок':'You: 🐘 Video circle','Вы: 📎':'You: 📎',
'Выбери срок блокировки:':'Choose block duration:','Выбери срок подписки:':'Choose subscription duration:','Выбери типы чатов или добавь чаты':'Choose chat types or add chats',
'Выбери хотя бы одного':'Choose at least one','Выбери хотя бы одного участника':'Choose at least one member','Выбери юзернейм и придумай пароль':'Choose a username and a password',
'Выбери, сколько анимаций тебе нужно.':'Choose the desired animations amount.','Выбор динамика не поддерживается браузером':'Speaker selection is not supported by your browser',
'Выбранный канал увидят все, кто откроет твой профиль':'Everyone who opens your profile will see the chosen channel','Выбрать сообщения':'Select messages',
'Выдать ⭐ SLON Premium':'Grant ⭐ SLON Premium','Выдать 🐘 слонгалочку':'Grant 🐘 elephant badge','Выдать права':'Grant rights','Выдать права администратора':'Grant admin rights',
'Выйти':'Log out','Выйти из аккаунта':'Log out','Выйти из аккаунта?':'Log out?','Выключен':'Disabled','Выключено':'Disabled','Выключены':'Disabled','Выключить код-пароль':'Turn off passcode',
'Выключить уведомления':'Disable notifications','Выходной':'Closed','Галактика':'Galaxy','Глобальный поиск':'Global search','Говорите… нажмите ✓ чтобы отправить':'Speak… press ✓ to send',
'Голосовое':'Voice message','Голосовой звонок':'Voice call','Голосовые':'Voice','Голосовые и слонкружки':'Voice and video messages','Голосовые недоступны с ИИ':'Voice messages are unavailable with AI',
'Горячие клавиши':'Keyboard Shortcuts','Громкость звука':'Sound volume','Группа':'Group','Группа "':'Group "','Групповой звонок уже идёт':'A group call is already in progress','группу':'group','Группы':'Groups',
'Данные и память':'Data and Storage','Данные экспортированы':'Data exported','Действия':'Actions','Демонстрация экрана не поддерживается':'Screen sharing is not supported','Демонстрация экрана остановлена':'Screen sharing stopped',
'День рождения':'Birthday','Динамик':'Speaker','Динамик изменён':'Speaker changed','Динамик переключён':'Speaker switched','Динамики':'Speakers','Динамики не найдены':'No speakers found',
'Динамический порядок паков':'Dynamic Pack Order','Для видеозвонка разреши доступ.':'Allow access for video calls.','Для голосового звонка разреши доступ к микрофону.':'Allow microphone access for voice calls.',
'Для звонков SLON требует доступ к микрофону.':'SLON needs microphone access for calls.','До 10 каналов':'Up to 10 channels','добавил тебя в группу':'added you to the group','Добавить':'Add',
'Добавить аккаунт':'Add account','Добавить в папку':'Add to folder','Добавить канал в профиль':'Add a channel to your profile','Добавить описание…':'Add a bio…','Добавить участников':'Add members','Добавить чаты':'Add chats',
'Добавлен в "':'Added to "','Добро пожаловать в SLON 🐘':'Welcome to SLON 🐘','Добро пожаловать в SLON, @':'Welcome to SLON, @','Доступ заблокирован. Открой':'Access blocked. Open',
'Доступ к микрофону запрещён':'Microphone access denied','Доступ к экрану запрещён':'Screen access denied','Других активных сеансов нет.':'No other active sessions.',
'Его увидят все, кто откроет твой профиль':'Everyone who opens your profile will see it',
'Если забудешь код — придётся выйти из аккаунта на этом устройстве и войти заново по паролю.':'If you forget the code, you\'ll need to log out on this device and log in again with your password.',
'Если скрыть время захода, собеседники увидят «был(а) недавно».':'If you hide your last seen time, people will see «last seen recently».',
'Если считаешь это ошибкой — обратись к администраторам.':'If you think this is a mistake, contact the administrators.','Ещё':'More','Жираф':'Giraffe','Жирафы':'Giraffes',
'заблокирован':'blocked','заблокирован до':'blocked until','Заблокированные':'Blocked Users','Заблокированные не смогут писать и звонить тебе.':'Blocked users can\'t message or call you.',
'Заблокировать':'Block','Заблокировать пользователя':'Block user','Заблокировать сейчас':'Lock now','Заблокировать SLON':'Lock SLON','Забрать ⭐ SLON Premium':'Revoke ⭐ SLON Premium',
'Забрать 🐘 слонгалочку':'Revoke 🐘 elephant badge','Забыл(а) код-пароль?':'Forgot your passcode?','Забыл(а) код?':'Forgot the code?','Завершить':'Terminate',
'Завершить все другие сеансы':'Terminate All Other Sessions','Завершить все другие сеансы?':'Terminate all other sessions?','Завершить сеанс?':'Terminate session?',
'Заглушить отдельный чат можно в его меню или в профиле собеседника.':'You can mute a single chat from its menu or the person\'s profile.','Заголовок окна':'Window title bar',
'Загрузка сеансов…':'Loading sessions…','Загрузка устройств…':'Loading devices…','Загрузка…':'Loading…','Задать имя':'Set a name','Закат':'Sunset','Закрепить':'Pin','Закрепить чат':'Pin chat',
'Закреплённое сообщение':'Pinned message','Закрыть':'Close','Заметки для себя':'Notes to self','Запись голосового':'Recording voice','Запись голосового 🎙️':'Recording voice 🎙️',
'Запись не поддерживается':'Recording is not supported','Запись пустая':'Recording is empty','Запись слонкружка 🐘':'Recording video circle 🐘',
'Запрещены в браузере — разреши в настройках сайта':'Blocked by the browser — allow them in site settings','Зарегистрироваться 🐘':'Sign up 🐘','Зарегистрируйтесь здесь':'Sign up here',
'зашёл в войс':'joined the voice room','Защити аккаунт':'Protect your account','Звонки':'Calls','Звонки от остальных будут отклоняться автоматически.':'Calls from everyone else will be declined automatically.',
'Звонок':'Call','Звонок активен — смена устройства применится сразу':'Call in progress — the device change applies immediately','Звонок завершён':'Call ended','Звонок отклонён':'Call declined',
'Звонок отменён':'Call cancelled','Звук включён':'Sound on','Звук и камера':'Speakers and Camera','Значок ⭐ у имени':'⭐ badge next to your name','Золото':'Gold',
'и разреши для этого сайта.':'and allow it for this site.','Идёт звонок — смена устройства применится сразу.':'Call in progress — the device change applies immediately.',
'Из архива':'Unarchive','из группы «':'from the group «','Избранное':'Saved Messages','Избранное очищено':'Saved Messages cleared','Изменить':'Edit','Изменить папку':'Edit folder',
'Изменить профиль':'Edit profile','Изменить часы работы ›':'Edit business hours ›','Изумруд':'Emerald','Имя':'Name','Имя (обязательно)':'First name (required)','Имя обновлено':'Name updated','Имя обязательно':'Name is required',
'Имя, юзернейм, о себе, день рождения':'Name, Username, Bio, Birthday','Информация':'User Info','Информация о канале':'Channel Info','Истории (скоро)':'Stories (soon)',
'Истории контактов скоро появятся 🐘':'Contacts\' stories are coming soon 🐘','Истории скоро появятся 🐘':'Stories are coming soon 🐘','История очищена':'History cleared',
'История переписки с':'Chat history with','Ищем канал…':'Looking for the channel…','Ищем устройства…':'Looking for devices…','Ищем…':'Searching…',
'Камера':'Camera','Камера включена':'Camera on','Камера выбрана':'Camera selected','Камера выбрана (применится при следующем звонке)':'Camera selected (applies to the next call)',
'Камера выключена':'Camera off','Камера не найдена':'Camera not found','Камера переключена':'Camera switched','Камеры не найдены':'No cameras found','Канал':'Channel','Канал @':'Channel @',
'Канал в профиле':'Channel in profile','Канал добавлен в профиль 📢':'Channel added to profile 📢','Канал не найден':'Channel not found','Канал убран из профиля':'Channel removed from profile','Каналы':'Channels',
'Кастомизация профиля':'Profile Customization','Код — от 4 до 12 цифр':'Code must be 4–12 digits','Код-пароль':'Passcode Lock',
'Код-пароль блокирует SLON на этом устройстве: при запуске нужно будет его ввести. Код хранится только здесь.':'A passcode locks SLON on this device: you\'ll need to enter it on launch. The code is stored only here.',
'Код-пароль включён 🔒':'Passcode enabled 🔒','Код-пароль выключен':'Passcode disabled','Коды не совпадают':'Codes don\'t match','Консоль администратора':'Admin console','Контакты':'Contacts',
'Конфиденциальность':'Privacy and Security','Копировать':'Copy','Космос':'Deep Space','Края':'Edges','Круглосуточно':'Open 24 hours','Кто видит твой день рождения':'Who can see my birthday',
'Кто видит твою аватарку':'Who can see my profile photos','Кто видит текст «О себе»':'Who can see my bio','Кто видит, когда ты был(а) в сети':'Who can see my last seen time',
'Кто может добавлять меня в группы':'Who can add me to groups','Кто может мне звонить':'Who can call me','Кто может мне писать':'Who can send me messages',
'Кто может присылать мне голосовые и слонкружки':'Who can send me voice or video messages','Лаванда':'Lavender','ЛЕГЕНДА СЛОНА':'ELEPHANT LEGEND','Личные':'Personal','Личные чаты':'Private Chats',
'Локальные данные':'Local data','Любые два цвета фона профиля, как у тебя в голове':'Any two colors for your profile background','Максимум':'Lots of Stuff','Максимум 10 каналов':'10 channels maximum',
'Максимум 20 символов':'20 characters maximum','Максимум 3 канала — с ⭐ Premium можно больше':'3 channels maximum — more with ⭐ Premium','Максимум 3 канала на одном аккаунте':'3 channels maximum per account',
'Медиа':'Media','медиа недоступно':'media unavailable','Медиа-устройства недоступны':'Media devices unavailable','Меню':'Menu','Микро':'Mic','Микрофон':'Microphone','Микрофон выбран':'Microphone selected',
'Микрофон изменён':'Microphone changed','Микрофон не найден':'Microphone not found','Микрофон переключён':'Microphone switched','Микрофоны не найдены':'No microphones found',
'мин. назад':'min ago','Минимум 3 символа':'At least 3 characters',
'Можно выйти из аккаунта на этом устройстве и войти заново по паролю аккаунта. Код-пароль сбросится.':'You can log out on this device and log in again with your account password. The passcode will be reset.',
'Можно добавить описание — расскажи о чём канал. Это необязательно.':'You can add a description — tell people what the channel is about. Optional.',
'Мои истории':'My stories','Мои контакты':'My Contacts','Мои наборы':'My sticker sets','Мой профиль':'My profile','На весь экран':'Fullscreen','На остальных устройствах (':'On other devices (',
'На этом устройстве произойдёт выход из SLON.':'This device will be logged out of SLON.','навсегда':'forever','Навсегда':'Forever','Навсегда ✨':'Forever ✨','Нажми для включения звука':'Tap to unmute','Нажми для звука':'Tap for sound',
'Нажми на сеанс, чтобы завершить его. На том устройстве произойдёт выход из аккаунта.':'Tap a session to terminate it. That device will be logged out.','Назад':'Back','Название папки':'Folder name',
'Написать':'Message','Настройки':'Settings','Настройки браузера → Разрешения → Микрофон':'Browser settings → Permissions → Microphone','Настройки канала':'Channel settings','Настройки устройств':'Device settings',
'Начало чата':'Start of chat','Не в сети:':'Offline:','Не задано':'Not set','Не контакты':'Non-Contacts','не найден':'not found','Не показывать':'Don\'t show','Не удалось включить звук':'Couldn\'t enable sound',
'Не удалось включить камеру:':'Couldn\'t turn on the camera:','Не удалось загрузить сеансы — проверь подключение.':'Couldn\'t load sessions — check your connection.','Не удалось переключить камеру':'Couldn\'t switch camera',
'Не удалось переключить камеру:':'Couldn\'t switch camera:','Не удалось переключить микрофон:':'Couldn\'t switch microphone:','Не удалось получить новую камеру':'Couldn\'t get the new camera',
'Не удалось применить микрофон':'Couldn\'t apply the microphone','Не удалось проиграть звук':'Couldn\'t play the sound','Не указан':'Not set','Неверный пароль':'Wrong password','Неверный текущий пароль':'Wrong current password',
'Недавно использованные наборы будут показываться выше остальных.':'Recently used sticker sets will be displayed above the older ones.','Неизвестно':'Unknown','Неон':'Neon','Непрочитанные':'Unread',
'Нет':'None','Нет аккаунта?':'No account?','Нет активного звонка':'No active call','Нет видео экрана':'No screen video','Нет доступа к камере':'No camera access','Нет доступа к микрофону':'No microphone access',
'Нет доступа к микрофону.':'No microphone access.','Нет доступных контактов для добавления':'No contacts available to add','Нет контактов — сначала найди кого-то через поиск':'No contacts — find someone via search first',
'Нет подключения к Firebase':'No connection to Firebase','Нет прав приглашать':'No permission to invite','Нет соединения':'No connection','Нет участников':'No members','Никого не нашли по «':'Nobody found for «',
'Никто':'Nobody','Новая группа':'New group','Новая папка':'New folder','Новое сообщение':'New message','Новые сообщения из всех чатов':'New messages from all chats','Новые чаты от незнакомых':'New chats from unknown users',
'Новые чаты от тех, кому ты не писал(а), сразу попадут в архив без звука':'Automatically archive and mute new chats from non-contacts','Новый канал':'New channel','Новый код (от 4 цифр)':'New code (4+ digits)',
'новый пароль (мин. 6 символов)':'new password (min. 6 characters)','Новый пароль (мин. 6 символов)':'New password (min. 6 characters)','Новый пароль минимум 6 символов':'New password must be at least 6 characters',
'Нужен доступ к камере и микрофону':'Camera and microphone access needed','Нужен доступ к микрофону':'Microphone access needed','Нужна подписка SLON PREMIUM':'SLON PREMIUM subscription required',
'Нужны для уведомлений в фоне':'Needed for background notifications','О себе':'Bio','Обновить список':'Refresh list','Обои для чатов':'Chat wallpapers','Обои установлены':'Wallpaper set','Обои чата':'Chat wallpaper',
'Обои чатов':'Chat wallpapers','Общие настройки':'General Settings','Объединили дублирующийся чат с @':'Merged duplicate chat with @','Ожидание…':'Waiting…','Океан':'Ocean','Описание':'Description',
'Опубликовать':'Publish','Опубликовать пост в канале':'Publish a post in the channel','Орёл':'Eagle','Орлы':'Eagles','Осень':'Autumn','Отвечено на другом устройстве 📱':'Answered on another device 📱',
'Отдельные чаты':'Included chats','Отдельных чатов нет':'No individual chats','Отключить звук':'Mute','Открепить':'Unpin','Открой профиль пользователя чтобы выдать слонгалочку или заблокировать его.':'Open a user\'s profile to grant a badge or block them.',
'Открыто':'Open','Закрыто':'Closed','Открыть чат':'Open chat','Отмена':'Cancel','Отметить как непрочитанное':'Mark as unread','Отмечено как непрочитанное':'Marked as unread','отозваны':'revoked','Отправить':'Send',
'Официальный канал SLON — новости и обновления 🐘':'Official SLON channel — news and updates 🐘','Оформи свои группы так же, как профиль':'Style your groups just like your profile',
'Оформление, которого нет у остальных: неон, галактика, вишня и другие':'Themes nobody else has: neon, galaxy, cherry and more','Очистить':'Clear','Очистить все данные':'Clear all data',
'Очистить Избранное':'Clear Saved Messages','Очистить Избранное?':'Clear Saved Messages?','Очистить историю':'Clear history','Очистить историю?':'Clear history?','Ошибка воспроизведения:':'Playback error:',
'Ошибка демонстрации:':'Screen sharing error:','Ошибка загрузки':'Loading error','Ошибка отправки медиа:':'Media sending error:','Ошибка подключения:':'Connection error:','Ошибка:':'Error:',
'Папка «':'Folder «','Папка сохранена 📁':'Folder saved 📁','Папка удалена':'Folder deleted','Папки':'Chat Folders','Папки с чатами':'Chat Folders','Пароли не совпадают':'Passwords don\'t match',
'пароль':'password','пароль (мин. 6 символов)':'password (min. 6 characters)','Пароль аккаунта':'Account password','Пароль изменён — войди снова':'Password changed — log in again','Пароль изменён 🔒':'Password changed 🔒',
'Пароль минимум 6 символов':'Password must be at least 6 characters','Пароль нужен для входа в аккаунт с других устройств.':'The password is used to log in from other devices.','Пароль установлен 🔒':'Password set 🔒',
'Паттерн профиля':'Profile pattern','Перевернуть':'Flip','Переходы между экранами, появление карточек, пузыри сообщений':'Screen transitions, card appearance, message bubbles',
'Плавная прокрутка':'Smooth scrolling','Плавная прокрутка чатов и настроек':'Smooth scrolling of chats and settings','Плавно и быстро':'Nice and Fast','Повтори код':'Repeat code','Повтори новый пароль':'Repeat new password',
'повтори пароль':'repeat password','Повторить':'Retry','Подарить Premium':'Gift Premium','Поделись этим юзернеймом с друзьями — они найдут тебя через «➕ Контакт»':'Share this username with friends — they\'ll find you via «➕ Contact»',
'Подключение к @':'Connecting to @','подключение…':'connecting…','Подключение…':'Connecting…','Подключиться':'Connect','Подписаться':'Subscribe','подписчиков':'subscribers','подписчика':'subscribers','подписчик':'subscriber',
'Подписываемся…':'Subscribing…','Подсказывать стикеры по эмодзи':'Suggest stickers by emoji','Поиск':'Search','Поиск в чате — скоро':'Search in chat — coming soon','Поиск…':'Search…',
'Пока нет голосовых':'No voice messages yet','Пока нет контактов — найди кого-то через поиск':'No contacts yet — find someone via search','Пока нет ссылок':'No links yet','Пока нет файлов':'No files yet','Пока нет фото':'No photos yet',
'Показывать название чата':'Show chat name','Показывать часы работы':'Show business hours','Показывать метки папок':'Show Folder Tags','Названия папок у каждого чата в списке':'Display folder names for each chat in the chat list',
'Покрути слона 👆':'Spin the elephant 👆','Полночь':'Midnight','Пользователи':'Users','Пользователи и канал SLON':'Users and the SLON channel','Пользователь разблокирован':'User unblocked',
'Понедельник':'Monday','Попробовать снова':'Try again','Пост':'Post','потеряет доступ к консоли администратора.':'will lose access to the admin console.','Превью сообщений':'Message Preview',
'Предпросмотр скоро появится 👁':'Preview coming soon 👁','Привет,':'Hi,','Привет! Выбери юзернейм и делись им с друзьями — они найдут тебя по нему через ➕ Контакт':'Hi! Pick a username and share it with friends — they\'ll find you via ➕ Contact',
'Применить':'Apply','Природа':'Nature','Проверяем юзернейм…':'Checking username…','Проверяем…':'Checking…','Пропустить':'Skip','Пропустить (не рекомендуется)':'Skip (not recommended)','Просмотр':'View',
'Профиль':'Profile','Профиль обновлён 🎨':'Profile updated 🎨','Профиль синхронизирован 🔄':'Profile synced 🔄','Профиль сохранён ✓':'Profile saved ✓','Пусто':'Empty','Пятница':'Friday',
'разбанен':'unbanned','Разбанить пользователя':'Unban user','Разблокировать':'Unblock','Размытие и прозрачность':'Blur and transparency','Разрешение выдано':'Permission granted','Разреши его в настройках сайта.':'Allow it in site settings.',
'Разрешить':'Allow','Расписание':'Schedule','Расскажи о себе':'Tell about yourself','ред.':'edited','Ресурсоёмкие процессы':'Resource-Intensive Processes','Розовая':'Pink','Розовое золото':'Rose Gold',
'Сброс':'Reset','Свернуть':'Collapse','Свернуть ↓':'Collapse ↓','Свернуть окно':'Minimize','Светлая':'Light',
'Свои паки стикеров и эмодзи — слоны, бегемоты и другие — скоро появятся в SLON 🐘':'Custom sticker and emoji packs — elephants, hippos and more — are coming to SLON soon 🐘',
'Свои цвета':'Custom colors','Свой градиент профиля':'Custom profile gradient','Сеанс завершён':'Session terminated','Сеанс завершён с другого устройства':'Session terminated from another device','Сеансы завершены':'Sessions terminated',
'Сегодня':'Today','сейчас':'now','Скажи что-нибудь — полоски покажут громкость микрофона.':'Say something — the bars will show your microphone level.','Скачать историю чатов файлом':'Download chat history as a file',
'Скопировано':'Copied','Скопировать юзернейм':'Copy username','Скоро':'Soon','Скоро — несколько аккаунтов в приложении':'Coming soon — multiple accounts in the app','Скоро 🐘':'Coming soon 🐘',
'Слон':'Elephant','СЛОН AI':'SLON AI','Слонгалочка отозвана у @':'Elephant badge revoked from @','Слонкружки недоступны с ИИ':'Video circles are unavailable with AI','Слонкружок':'Video circle','Слонкружок недоступен':'Video circle unavailable',
'Слоны':'Elephants','Слоны, бегемоты, жирафы и орлы вокруг твоей аватарки':'Elephants, hippos, giraffes and eagles around your avatar','Сменить':'Change','Сменить пароль 🔑':'Change password 🔑','Сменить тему':'Change theme',
'Сменить фото':'Change photo','Сменить юзернейм':'Change username','Сначала включи камеру в звонке':'Turn on the camera in the call first','Сначала выбери юзернейм':'Choose a username first',
'Сначала добавь хотя бы один контакт':'Add at least one contact first','Сначала заверши текущий звонок':'End the current call first','Сначала прими/начни звонок':'Accept/start a call first',
'Собеседник на экране':'The other person is on screen','Собеседник отключился':'The other person disconnected','Соединение установлено':'Connection established','Соединение…':'Connecting…',
'Создавай папки для разных групп чатов и быстро переключайся между ними.':'Create folders for different groups of chats and quickly switch between them.','Создаём аккаунт…':'Creating account…',
'Создай его — и он появится в профиле.':'Create one — and it will appear in your profile.','Создать':'Create','Создать аккаунт':'Create account','Создать канал':'Create channel','Сообщение…':'Message','Сообщения':'Messages',
'Сообщить об ошибке':'Report a bug','Сохранить':'Save','Сохраняем…':'Saving…','Среда':'Wednesday','Ссылка':'Link','Ссылки':'Links','Стикеры и эмодзи':'Stickers and Emoji','Стоп':'Stop','Суббота':'Saturday',
'Твой аккаунт':'Your account','Твой аккаунт заблокирован до':'Your account is blocked until','твой_юзернейм':'your_username','Тебя добавили в "':'You were added to "','Текст не может быть пустым':'Text can\'t be empty',
'Текущий пароль':'Current password','Тема':'Theme','Тема оформления':'Theme','Тема, обои, кастомизация профиля':'Wallpaper, Theme, Customization','Тема:':'Theme:','Тёмная':'Dark','теперь администратор':'is now an admin',
'теперь может приглашать':'can now invite','Только латинские буквы, цифры и _ · 3–20 символов':'Latin letters, digits and _ only · 3–20 characters','Только сообщения из личных чатов':'Only messages from personal chats',
'Только ты видишь эти сообщения':'Only you can see these messages','Ты больше не будешь получать сообщения, звонки и запросы от этого пользователя.':'You will no longer get messages, calls or requests from this user.',
'Ты выйдешь из':'You will leave','Ты никого не блокировал(а)':'You haven\'t blocked anyone','Ты открыл секретный значок Слона! Теперь рядом с твоим именем навсегда будет 🐘':'You unlocked the secret Elephant badge! 🐘 will now always be next to your name',
'Ты с нами! 💜':'You are all set! 💜','У тебя пока нет своего канала.':'You don\'t have a channel yet.','У устройства одна камера или нет доступа к другой':'This device has one camera or no access to another',
'Убрать':'Remove','Убрать день рождения':'Remove birthday','Убрать права':'Revoke rights','Уведомления':'Notifications','Уведомления включены':'Notifications on','Уведомления включены ✅':'Notifications on ✅','Уведомления включены 🔔':'Notifications on 🔔',
'Уведомления выключены':'Notifications off','Уведомления выключены 🔕':'Notifications off 🔕','Уведомления заблокированы — разреши в настройках браузера':'Notifications are blocked — allow them in browser settings',
'Уведомления заблокированы ❌':'Notifications blocked ❌','Уведомления запрещены в браузере':'Notifications are blocked in the browser','Уведомления и звуки':'Notifications and Sounds','Уведомления не разрешены':'Notifications not allowed',
'Уведомления:':'Notifications:','Удалено у всех':'Deleted for everyone','Удалено у себя':'Deleted for me','удалил историю чата':'deleted the chat history','Удалить':'Delete','Удалить @':'Remove @','Удалить всё':'Delete everything',
'Удалить из группы':'Remove from group','Удалить папку':'Delete folder','Удалить только у себя?':'Delete only for me?','Удалить фото':'Delete photo','Удалить чат':'Delete chat','Удалить чат у всех участников?':'Delete the chat for all members?','Удалить чат?':'Delete chat?',
'Уже есть аккаунт?':'Already have an account?','Уже идёт звонок':'A call is already in progress','Узор':'Pattern','Узор профиля':'Profile pattern','Узорные фоны переписки в цвет темы':'Patterned chat backgrounds in your theme color',
'Узоры на фоне профиля':'Profile background patterns','Управление каналом':'Manage channel','Управление пользователями и каналом':'Manage users and the channel','Уровень':'Level','Уровень анимаций':'Animation Level',
'Установить пароль 🔒':'Set password 🔒','Устройства':'Devices','Устройства ввода / вывода':'Input / output devices','участник':'member','участников':'members','Файл':'File','Файл > 500 МБ':'File > 500 MB',
'Файл недоступен':'File unavailable','Файл неполный':'File incomplete','Файлы':'Files','Фамилия (необязательно)':'Last name (optional)','Фиолет':'Violet','Фон профиля изменён':'Profile background changed',
'Фон, градиент и узор':'Background, gradient and pattern','Фото > 5 МБ':'Photo > 5 MB','Фото недоступно':'Photo unavailable','Фото профиля':'Profile photos','Фото профиля обновлено':'Profile photo updated','Фото удалено':'Photo deleted',
'Фото, голосовые и слонкружки хранятся в IndexedDB браузера.':'Photos, voice messages and video circles are stored in the browser\'s IndexedDB.','Хранилище':'Storage','Цвет и узор групп':'Group color and pattern',
'Цвет профиля':'Profile color','Цвет профиля обновлён 🎨':'Profile color updated 🎨','Цвет фона':'Background color','Центр':'Center','Часы':'Hours','Часы работы':'Business hours',
'Чат возвращён из архива':'Chat unarchived','Чат закреплён 📌':'Chat pinned 📌','Чат откреплён':'Chat unpinned','Чат очищен':'Chat cleared','Чат перемещён в архив 📦':'Chat archived 📦','Чат удалён':'Chat deleted',
'Чат удалён у всех':'Chat deleted for everyone','чатов':'chats','чата':'chats','Чатов пока нет':'No chats yet','Чаты':'Chats','через Firebase…':'via Firebase…','Четверг':'Thursday','Экономия энергии':'Power Saving',
'Экран':'Screen','Экспорт данных':'Export data','Эмодзи-паки':'Emoji packs','Это твой юзернейм!':'That\'s your username!','Это устройство':'This Device','Этот юзернейм уже занят':'This username is already taken',
'Эффект матового стекла у меню. Выключи, если телефон тормозит':'Frosted glass effect in menus. Turn off if your phone lags','Юзернейм':'Username',
'Юзернейм — это твой постоянный ID в сети SLON. Смена приведёт к переподключению.':'Your username is your permanent ID in SLON. Changing it will reconnect you.',
'Юзернейм · нажми чтобы скопировать':'Username · tap to copy','Юзернейм занят — выбери другой или войди':'Username is taken — choose another or log in','Юзернейм изменён на @':'Username changed to @',
'Юзернейм изменён: @':'Username changed: @','Юзернейм максимум 20 символов':'Username must be at most 20 characters','Юзернейм минимум 3 символа':'Username must be at least 3 characters',
'Юзернейм не изменился':'Username didn\'t change','Юзернейм скопирован':'Username copied','Юзернейм скопирован!':'Username copied!','Язык':'Language','Язык интерфейса':'Interface Language',
'AI Ассистент':'AI Assistant','P2P не готов':'P2P not ready','Premium отозван у @':'Premium revoked from @','RGB цвет (Premium)':'RGB color (Premium)','WebRTC не поддерживается':'WebRTC is not supported',
'WebRTC не поддерживается в этом браузере':'WebRTC is not supported in this browser','10 эксклюзивных тем':'10 exclusive themes','1 год':'1 year','1 день':'1 day','1 час':'1 hour','3 месяца':'3 months','30 дней':'30 days','7 дней':'7 days',
// эмодзи-префиксы
'⚙️ Настройки @':'⚙️ Settings @','⚠ Нет соединения. Попробуй переподключиться.':'⚠ No connection. Try reconnecting.','⚠️ Очистить всё?':'⚠️ Clear everything?','⚠ Firebase не загрузился — проверь интернет':'⚠ Firebase didn\'t load — check your internet',
'✅ Добавлено':'✅ Added','✅ Значок активирован!':'✅ Badge activated!','✅ Настройки сохранены':'✅ Settings saved','✅ Опубликовано':'✅ Published','✅ Подписались на @':'✅ Subscribed to @','✅ Пост обновлён':'✅ Post updated',
'✅ Пост опубликован!':'✅ Post published!','✅ Пост удалён у всех':'✅ Post deleted for everyone','✅ Профиль группы обновлён':'✅ Group profile updated','✏️ Изменить имя':'✏️ Change name','✏️ Профиль группы':'✏️ Group profile',
'✏️ Редактирование ·':'✏️ Editing ·','✏️ Редактировать':'✏️ Edit','✏️ Редактировать пост':'✏️ Edit post','✏️ Редактировать профиль':'✏️ Edit profile','✓ Отправить':'✓ Send','✨ ПРИНЯТЬ СИЛУ СЛОНА ✨':'✨ ACCEPT THE ELEPHANT POWER ✨',
'❄️ Заморожен(а) до':'❄️ Frozen until','❌ Неверный код':'❌ Wrong code','➕ Добавить в группу':'➕ Add to group','➕ Добавить контакт':'➕ Add contact','➕ Добавить участника':'➕ Add member','⬇️ Скачать аудио':'⬇️ Download audio',
'⬇️ Скачать слонкружок':'⬇️ Download video circle','⬇️ Скачать файл':'⬇️ Download file','⬇️ Скачать фото':'⬇️ Download photo','⭐ Выдать Premium @':'⭐ Grant Premium @','⭐ Добро пожаловать в SLON Premium!':'⭐ Welcome to SLON Premium!',
'⭐ Нужна подписка SLON PREMIUM':'⭐ SLON PREMIUM subscription required','⭐ Обои — в SLON Premium':'⭐ Wallpapers are in SLON Premium','⭐ Свои цвета — в SLON Premium':'⭐ Custom colors are in SLON Premium','⭐ Сохранено в Избранном':'⭐ Saved to Saved Messages',
'⭐ Сохранить':'⭐ Save','⭐ Узоры — в SLON Premium':'⭐ Patterns are in SLON Premium','⭐ Premium выдан @':'⭐ Premium granted to @','⭐ SLON Premium — кастомный фон профиля':'⭐ SLON Premium — custom profile background',
'🎙️ Голосовое':'🎙️ Voice message','🎙️ Голосовое отправлено':'🎙️ Voice message sent','🎨 Тема оформления':'🎨 Theme','🎨 Цвет профиля':'🎨 Profile color','🎨 Цвет фона профиля':'🎨 Profile background color',
'🐘 Значок уже активирован!':'🐘 Badge already activated!','🐘 Мой юзернейм':'🐘 My username','🐘 СЛОН':'🐘 SLON','🐘 СЛОН AI':'🐘 SLON AI','🐘 Слонгалочка выдана @':'🐘 Elephant badge granted to @','🐘 Слонкружок':'🐘 Video circle',
'🐘 Слонкружок отправлен':'🐘 Video circle sent','🐘 Ты теперь Легенда Слона!':'🐘 You are now an Elephant Legend!','🐘 SLON Новости':'🐘 SLON News','👆👆 Двойной тап — сменить камеру/экран':'👆👆 Double tap — switch camera/screen',
'👥 Создать группу':'👥 Create group','👥 Тебя добавили в «':'👥 You were added to «','👥 Тебя удалили из группы':'👥 You were removed from the group','📋 Копировать':'📋 Copy','📌 Паттерн':'📌 Pattern','📎 Медиа':'📎 Media','📎 Файл':'📎 File',
'📝 Биография':'📝 Bio','📝 Новый пост в канале':'📝 New post in channel','📝 Опубликовать пост':'📝 Publish post','📝 Пост':'📝 Post','📝 Пост в @':'📝 Post in @','📞 Входящий звонок':'📞 Incoming call','📢 Канал @':'📢 Channel @',
'📢 Новое в SLON-канале!':'📢 New in the SLON channel!','📢 Новости SLON — проверь канал!':'📢 SLON news — check the channel!','📢 Новый пост в @':'📢 New post in @','📢 Опубликовать':'📢 Publish','📢 Официальный канал':'📢 Official channel',
'📢 Подписаться на канал':'📢 Subscribe to a channel','📢 Создать канал':'📢 Create channel','📢 Только владелец может публиковать посты':'📢 Only the owner can publish posts','📢 Ты редактор канала':'📢 You are a channel editor',
'📢 Это канал — сюда нельзя писать':'📢 This is a channel — you can\'t write here','📥 Группа "':'📥 Group "','📥 Получаю файл:':'📥 Receiving file:','📦 Архив':'📦 Archive','📷 Аватарка группы':'📷 Group avatar','📷 Загрузить':'📷 Upload',
'📷 Задняя камера':'📷 Rear camera','🔊 Войс «':'🔊 Voice «','🔊 Войсы':'🔊 Voice rooms','🔊 Проверить звук':'🔊 Test sound','🔊 Создать войс':'🔊 Create voice room','🔑 Сменить пароль':'🔑 Change password',
'🔒 Кастомизация профиля —':'🔒 Profile customization —','🔔 Уведомления включены':'🔔 Notifications on','🔕 Уведомления выключены':'🔕 Notifications off','🔨 Забанить @':'🔨 Ban @','🖥 Экран':'🖥 Screen','🖼 Аватарка канала':'🖼 Channel avatar',
'🖼 Обои чата':'🖼 Chat wallpaper','🖼 Фото':'🖼 Photo','🗑 Удалить пост у всех':'🗑 Delete post for everyone','🗑 Удалить у всех':'🗑 Delete for everyone','🗑 Удалить у себя':'🗑 Delete for me','🤏 Сведите/разведите для зума':'🤏 Pinch to zoom',
'🤳 Фронтальная':'🤳 Front','🤳 Фронтальная камера':'🤳 Front camera','🚫 Заблокирован(а) тобой':'🚫 Blocked by you','🚫 Заблокировать @':'🚫 Block @','🛡 Выдать права администратора':'🛡 Grant admin rights',
'🛡 Консоль администратора':'🛡 Admin console','🛡 Права администратора у @':'🛡 Admin rights for @','🛡 Тебе выданы права администратора SLON!':'🛡 You\'ve been granted SLON admin rights!','🛡 Убрать права администратора':'🛡 Revoke admin rights',
'＋ Создать папку':'＋ Create New Folder','＋ добавить':'＋ add','+ звук':'+ sound','+ Создать войс':'+ Create voice room','Рекомендуемые папки':'Recommended Folders','Вид вкладок':'Tabs View','Типы чатов':'Chat types',
'Отмена ':'Cancel','Разблокировать ':'Unblock','Выбери юзернейм':'Choose a username','Мой юзернейм':'My username','Создать папку':'Create New Folder','Новая папка ':'New folder',
'SLON Premium':'SLON Premium','Больше возможностей для':'More features for','Вот что входит в подписку:':'Here\'s what the subscription includes:','Спасибо, что поддерживаешь':'Thank you for supporting','Вот что тебе открыто:':'Here\'s what is now unlocked:',
'Выключи, если телефон тормозит':'Turn off if your phone lags','Эффект матового стекла у меню.':'Frosted glass effect in menus.',
'Любые подробности: возраст, чем занимаешься или город. Например: 23 года, дизайнер из Казани':'Any details such as age, occupation or city. Example: 23 y.o. designer from San Francisco',
'Кто видит твой день рождения — в':'Choose who can see your birthday in','Конфиденциальности ›':'Settings ›',
'По юзернейму тебя найдут в SLON через «➕ Контакт».':'People can find you in SLON by this username via «➕ Contact».','Можно использовать':'You can use','и подчёркивание. Минимум 3 символа.':'and underscores. Minimum length is 3 characters.',
'Показываются в профиле':'Shown in profile','В папке будут все чаты выбранных типов плюс отдельно добавленные.':'The folder will contain all chats of the chosen types plus individually added ones.',
'Нажми на сеанс, чтобы завершить его.':'Tap a session to terminate it.','Звук и камера ':'Speakers and Camera','Проверить звук':'Test sound','Уровень ':'Level',
'Контент':'Content','Выбери канал':'Choose channel','изменить':'edit','Написать ':'Message','Звонок ':'Call','Видео ':'Video',
'января':'January','февраля':'February','марта':'March','апреля':'April','мая':'May','июня':'June','июля':'July','августа':'August','сентября':'September','октября':'October','ноября':'November','декабря':'December',
'Пн':'Mon','Вт':'Tue','Ср':'Wed','Чт':'Thu','Пт':'Fri','Сб':'Sat','Вс':'Sun','пн':'Mon','вт':'Tue','ср':'Wed','чт':'Thu','пт':'Fri','сб':'Sat','вс':'Sun'
};

// Регулярки для динамических фраз (числа, возраст и т.п.)
const _I18N_RULES=[
  [/\((\d+) (?:год|года|лет)\)/g,'($1 y.o.)'],
  [/(\d+) (?:чат|чата|чатов)(?![\p{L}])/gu,(m,n)=>n+(n==='1'?' chat':' chats')],
  [/(\d[\d\s]*) (?:подписчик|подписчика|подписчиков)(?![\p{L}])/gu,(m,n)=>n+(n.trim()==='1'?' subscriber':' subscribers')],
  [/(\d+) (?:участник|участника|участников)(?![\p{L}])/gu,(m,n)=>n+(n==='1'?' member':' members')],
  [/был\(а\) (\d+) мин\. назад/g,'last seen $1 min ago'],
  [/был\(а\) сегодня в /g,'last seen today at '],[/был\(а\) вчера в /g,'last seen yesterday at '],
  [/(^|\s)в (\d{1,2}:\d{2})/g,'$1at $2']
];

let _i18nRe=null;
function _i18nBuild(){
  // Фрагментная подстановка: ключи от 4 символов, длинные сначала, только целыми словами
  const keys=Object.keys(_I18N_EN).filter(k=>k.trim().length>=4).sort((a,b)=>b.length-a.length);
  const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  _i18nRe=new RegExp('(?<![\\p{L}])('+keys.map(k=>esc(k.trim())).join('|')+')(?![\\p{L}])','gu');
}
const _CYR=/[А-Яа-яЁё]/;
function trExact(s){
  if(SLON_LANG!=='en'||typeof s!=='string')return s;
  const t=s.trim();return _I18N_EN[t]!==undefined?s.replace(t,_I18N_EN[t]):s;
}
function tr(s){
  if(SLON_LANG!=='en'||typeof s!=='string'||!_CYR.test(s))return s;
  const t=s.trim();
  if(_I18N_EN[t]!==undefined)return s.replace(t,_I18N_EN[t]);
  let out=s;
  for(const [re,rep] of _I18N_RULES)out=out.replace(re,rep);
  if(!_i18nRe)_i18nBuild();
  out=out.replace(_i18nRe,m=>_I18N_EN[m]??m);
  return out;
}

// Где лежит пользовательский текст — не переводим
const _I18N_SKIP='.msg-bub,.msg-who,#pinnedText,.sp-ch-prev,.pin-txt span,[data-noi18n],textarea,script,style,.sb-ftags';
// Имена и «о себе»: переводим только точным совпадением («Избранное» → «Saved Messages»), чужие имена не искажаем
const _I18N_EXACT='.sb-prev,.sb-name,.ch-name,.sp-name,.pp-name,.sp-ch-name,.ci-name,.sp-row-multi .sp-row-title,.sp-pick-txt';

function _i18nText(n){
  const p=n.parentElement;if(!p||!_CYR.test(n.nodeValue))return;
  if(p.closest(_I18N_SKIP))return;
  const v=p.closest(_I18N_EXACT)?trExact(n.nodeValue):tr(n.nodeValue);
  if(v!==n.nodeValue)n.nodeValue=v;
}
function _i18nAttrs(el){
  ['placeholder','title','aria-label'].forEach(a=>{const v=el.getAttribute(a);if(v&&_CYR.test(v)){const t=tr(v);if(t!==v)el.setAttribute(a,t);}});
}
function _i18nNode(n){
  if(n.nodeType===3){_i18nText(n);return;}
  if(n.nodeType!==1)return;
  // Плейсхолдеры полей ввода переводим, даже если сам textarea — зона пользовательского текста
  if(n.matches('input[placeholder],textarea[placeholder]'))_i18nAttrs(n);
  n.querySelectorAll?.('input[placeholder],textarea[placeholder]').forEach(_i18nAttrs);
  if(n.matches(_I18N_SKIP)||n.closest(_I18N_SKIP))return;
  _i18nAttrs(n);
  // FILTER_REJECT пропускает всё поддерево пользовательского контента
  const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode:x=>
    x.nodeType===1&&x.matches(_I18N_SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  let c;while((c=w.nextNode())){if(c.nodeType===1)_i18nAttrs(c);else _i18nText(c);}
}

if(SLON_LANG==='en'){
  document.documentElement.lang='en';
  // Тосты и заголовки модалок идут через DOM — но toast лучше переводить сразу
  const _toastOrig=window.toast;
  if(typeof _toastOrig==='function')window.toast=function(msg,...a){return _toastOrig(tr(msg),...a);};
  const run=()=>{
    _i18nNode(document.body);
    new MutationObserver(ms=>{
      for(const m of ms){
        if(m.type==='characterData')_i18nNode(m.target);
        else m.addedNodes.forEach(_i18nNode);
      }
    }).observe(document.body,{childList:true,subtree:true,characterData:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
}

// ── Страница «Язык» в настройках ──
function _spLanguage(){
  const opt=(code,name,sub)=>`<div class="sp-pick${SLON_LANG===code?' sel':''}" onclick="_setLang('${code}')">
      <div class="sp-pick-radio"></div><div class="sp-pick-txt"><div>${name}</div><div class="sp-row-sub">${sub}</div></div></div>`;
  _spPush('Язык',
    _spSec('Язык интерфейса')
    +`<div class="sp-card sp-pad sp-lang-list">${opt('ru','Русский','Russian')}${opt('en','English','English')}</div>`);
}
function _setLang(code){
  if(code===SLON_LANG)return;
  try{localStorage.setItem('sl_lang',JSON.stringify(code));}catch(e){}
  document.body.style.transition='opacity .25s';document.body.style.opacity='0';
  setTimeout(()=>location.reload(),260);
}
