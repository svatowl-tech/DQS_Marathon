# 🥗 DQS — Дневник и Трекер Качества Питания (Diet Quality Score)

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

**DQS Tracker** — современное, автономное веб-приложение для фиксации и анализа качества рациона по методике **Diet Quality Score (DQS)** с поддержкой фиксации тренировок, фото-дневником блюд, быстрыми шаблонами и генерацией эстетичных фото-отчетов для соцсетей.

---

## ✨ Основные Возможности

- 🥑 **Подсчет баллов DQS в реальном времени**:
  - Положительные категории (+3, +2, +1): овощи, фрукты, орехи и семена, цельные злаки, нежирные белки, полезные напитки.
  - Ограничиваемые категории (-1, -2, -3): очищенные злаки, сладости, обработанное мясо, сладкие напитки/алкоголь.
  - Бонусы за разнообразие рациона и штрафы за пропуски ключевых микронутриентов.

- ⚡ **Быстрый ввод приёмов пищи и любимые шаблоны**:
  - Ввод порций в 1 клик с подсчетом динамики.
  - Сохранение часто используемых комбинаций блюд в **Любимые Шаблоны** (быстрое заполнение на основе сохраненных рецептов).

- 🏋️‍♂️ **Трекинг тренировок и физической активности**:
  - Добавление и редактирование тренировок (силовые, кардио, йога, плавание, ходьба и др.).
  - Сохранение времени, видов нагрузок и заметок.

- 📸 **Фото-дневник и Экспорт Отчёта в Картинку**:
  - Загрузка фотографий блюд с привязкой к приемам пищи.
  - **Генерация визуальных карточек-отчетов (Stories 9:16 / Square 1:1)** с баллами, фото тарелок, тренировками и замерными показателями для быстрой публикации в соцсетях.

- 📊 **Наглядная Аналитика и Отчёты**:
  - Графики динамики DQS, разнообразия рациона, веса и активности на базе **Recharts**.
  - Формирование еженедельных отчетов и аналитики целевых зон (зеленая/желтая/красная).

- 💾 **Локальное хранение и Резервное копирование**:
  - Все данные сохраняются локально в `localStorage` вашего браузера (полная приватность).
  - Экспорт и импорт всего архива в один JSON-файл для переноса между устройствами.

---

## 🛠️ Технологический Стек

- **Фронтенд**: React 19, TypeScript
- **Сборщик**: Vite 6
- **Стилизация**: Tailwind CSS v4, Lucide React (иконки)
- **Графики и Графика**: Recharts, `html-to-image` (экспорт фото-карточек)
- **Деплой**: Vercel Ready (`vercel.json`)

---

## 🚀 Быстрый запуск на локальном компьютере

### 1. Клонирование репозитория
```bash
git clone https://github.com/YOUR_USERNAME/dqs-nutrition-tracker.git
cd dqs-nutrition-tracker
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Запуск сервера разработки
```bash
npm run dev
```
Приложение будет доступно по адресу: `http://localhost:3000`

### 4. Сборка для продакшена
```bash
npm run build
```
Готовая сборка будет создана в папке `dist/`.

---

## 📦 Публикация на GitHub

1. Создайте новый публичный или приватный репозиторий на [GitHub](https://github.com/new).
2. Выполните в терминале команды:

```bash
git init
git add .
git commit -m "feat: initial commit DQS Nutrition Tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dqs-nutrition-tracker.git
git push -u origin main
```

---

## 📐 Деплой на Vercel

Проект полностью настроен для деплоя на [Vercel](https://vercel.com) за пару кликов:

### Вариант 1: Через веб-интерфейс Vercel (Рекомендуемый)
1. Зайдите на [Vercel Dashboard](https://vercel.com/dashboard) и нажмите **"Add New" ➔ "Project"**.
2. Подключите ваш GitHub аккаунт и выберите репозиторий `dqs-nutrition-tracker`.
3. Vercel автоматически определит Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Нажмите **Deploy**. Через 30 секунд ваш проект будет доступен по бесплатному SSL-домену `https://...vercel.app`.

### Вариант 2: Через Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 📄 Лицензия

MIT License. Свободно для использования и модификации.
