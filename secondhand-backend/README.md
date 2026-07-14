# SecondHand — Backend

## Установка

```powershell
cd C:\MyFirstSiteProject
npm install
copy .env.example .env
```

## Наполнить базу тестовыми объявлениями

```powershell
npm run seed
```

Это создаст файл `backend/db.json` с 60 тестовыми объявлениями.

## Запуск

```powershell
npm start
```

или с автоперезапуском при изменении файлов:

```powershell
npm run dev
```

Сервер поднимется на `http://localhost:3000`.

## Проверка

Откройте в браузере:
```
http://localhost:3000/api/products
```

Если видите JSON со списком объявлений — всё работает.

## Структура

```
MyFirstSiteProject/
├── index.html
├── profile.html
├── package.json
├── .env
└── backend/
    ├── server.js
    ├── seed.js
    ├── db.json          (создаётся командой npm run seed)
    └── middleware/
        └── auth.js
```

## Роуты API

| Метод | Роут | Авторизация | Что делает |
|---|---|---|---|
| POST | `/api/register` | нет | регистрация (email, password, name) |
| POST | `/api/login` | нет | вход, отдаёт JWT токен |
| GET | `/api/me` | да | данные текущего пользователя |
| GET | `/api/products` | нет | список с фильтрами: `?category=&priceFrom=&priceTo=&condition=&city=&search=&sort=&page=&limit=` |
| GET | `/api/products/:id` | нет | одно объявление |
| POST | `/api/products` | да | создать объявление |
| PUT | `/api/products/:id` | да, владелец | изменить своё объявление |
| DELETE | `/api/products/:id` | да, владелец | снять своё объявление |
| GET | `/api/my-products` | да | мои объявления |
| GET | `/api/favorites` | да | список избранного |
| POST | `/api/favorites/:productId` | да | добавить в избранное |
| DELETE | `/api/favorites/:productId` | да | убрать из избранного |

## Дальше

Сейчас `index.html` и `profile.html` берут данные из localStorage и генерируют их случайно в браузере.
Следующий шаг — заменить это на запросы `fetch()` к этому API, чтобы данные были общими для всех
пользователей и сохранялись на сервере, а не только в браузере одного человека.
Если понадобится — можем сделать это следующим шагом.
