.DEFAULT_GOAL := help

help: ## Список целей
	@awk -F ':.*## ' '/^[a-z0-9-]+:.*## / { printf "  %-16s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Установить зависимости из lock-файла
	npm ci

build: ## Собрать фронтенд в dist
	rm -rf dist
	npx vite build

start: ## Запустить сервер чата со статикой из dist (порт 5001)
	npx start-server -s ./dist

start-frontend: ## Запустить dev-сервер Vite (порт 5002)
	npx vite

develop: ## Запустить сервер и dev-сервер вместе
	make start & make start-frontend

test: i18n-check ## Прогнать тесты (вместе с проверкой переводов)
	npx vitest run

i18n-check: ## Переводы: нет захардкоженных строк, все ключи из кода есть в словаре
	npx i18next-cli lint
	npx i18next-cli status

i18n-extract: ## Добавить в словарь ключи из вызовов t()
	npx i18next-cli extract

lint: ## Проверить типы, линт и формат
	npx tsc --noEmit
	npx oxlint .
	npx oxfmt --check .

lint-fix: ## Исправить формат и автоисправимые ошибки линта
	npx oxfmt .
	npx oxlint --fix .

.PHONY: help install build start start-frontend develop test i18n-check i18n-extract lint lint-fix
