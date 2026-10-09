.DEFAULT_GOAL := help

help: ## Список целей
	@awk -F ':.*## ' '/^[a-z-]+:.*## / { printf "  %-16s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

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

test: ## Прогнать тесты
	npx vitest run

lint: ## Проверить типы, линт и формат
	npx tsc --noEmit
	npx oxlint .
	npx oxfmt --check .

lint-fix: ## Исправить формат и автоисправимые ошибки линта
	npx oxfmt .
	npx oxlint --fix .

.PHONY: help install build start start-frontend develop test lint lint-fix
