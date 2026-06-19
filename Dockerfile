# ==========================================
# Этап 1: Установка зависимостей (deps)
# ==========================================
FROM node:20-alpine AS deps
# Установка libc6-compat нужна для некоторых C++ модулей и библиотек в Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем только файлы блокировок для кэширования слоя зависимостей
COPY package.json package-lock.json* ./
# Чистая установка зависимостей
RUN npm ci

# ==========================================
# Этап 2: Сборка проекта (builder)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Отключаем телеметрию Next.js для ускорения сборки
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем проект
RUN npm run build

# ==========================================
# Этап 3: Финальный образ (runner)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаем непривилегированного пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем публичные статические файлы
COPY --from=builder /app/public ./public

# Настраиваем правильные права доступа для кэша Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Копируем ТОЛЬКО standalone сборку и статику
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Переключаемся на безопасного пользователя
USER nextjs

EXPOSE 3000
ENV PORT=3000
# Важно для правильной маршрутизации внутри контейнера
ENV HOSTNAME="0.0.0.0"

# В режиме standalone Next.js генерирует свой server.js
CMD ["node", "server.js"]