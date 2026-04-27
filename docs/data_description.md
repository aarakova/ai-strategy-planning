# Данные 
## 1. Название мультипроекта
```
{
  "title": "Название мультипроекта",
  "type": "string",
  "default": "",
  "restrictions": {
    "required": true
  }
}
```
**Примечание:** 
Используется: 
- на странице **Главная**, отображает название мультипроекта
- на странице **План**, отображает название мультипроекта

## 2. Горизонт планирования
```
{
  "title": "Горизонт планирования",
  ??? "type": "date",
  "default": "",
  "restrictions": {
    "required": true
  }
}
```

Используется: 
- на странице **Анализ**, сопоставляется конечный срок портфеля (дата завершения последнего проекта в портфеле) и горизонт планирования
- на странице **Альтернативы**, на основе конечных дат альтернатив делается вывод "укладывается/не укладывается в горизонт планирования"

## 3. Стратегические ориентиры
```
{
  "title": "Стратегические ориентиры",
  "type": "block",
  "dynamic": true,
  "minInstances": 1,
  "components": [
    {
      "title": "Видение (к чему стремимся?)",
      "type": "string",
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "Приоритет ориентира",
      "type": "enum",
      "values": ["high", "medium", "low"]  
      "restrictions": {
        "required": true
      }
    }
  ]
}
```

Например: Сделать цифровую трансформацию доступной для среднего бизнеса. Приоритет средний

Используется: 
- на странице **Цели**, выбор соответствующего стратегического ориентира при создании/редаутировании цели

## 4. Проекты 
```
{
  "title": "Реестр проектов",
  "type": "block",
  "dynamic": true,
  "minInstances": 1,
  "components": [
    {
      "title": "Название проекта",
      "type": "string",
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "Статус",
      "type": "enum",
      "values": ["planning", "active", "pause", "closed"],
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "Дата начала",
      "type": "date",
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "Дата окончания",
      "type": "date",
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "Трудоемкость: аналитики",
      "type": "integer",
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "Трудоемкость: разработчики",
      "type": "integer",
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "Трудоемкость: тестировщики",
      "type": "integer",
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "Зависимости",
      "type": "string"
    },
    {
      "title": "Ограничения",
      "type": "string"
    },
    {
      "title": "Отклонения",
      "type": "string"
    },
    {
      "title": "Описание",
      "type": "string"
    }
  ]
}
```

Используется: 
- на странице **Анализ**, в каждом блоке страницы 
- на странице **Цели**, выбор проектов при создании цели
- на странице **Альтернативы**, при создании сценариев 
- на станице **План**, на этапах реализации

## 5. Портфельные ограничения
```
{
  "title": "Портфельные ограничения",
  "type": "block",
  "dynamic": false,
  "components": [
    {
      "title": "Лимит: аналитики",
      "type": "integer"
    },
    {
      "title": "Лимит: разработчики",
      "type": "integer"
    },
    {
      "title": "Лимит: тестировщики",
      "type": "integer"
    },
    {
      "title": "Критический срок",
      "type": "date"
    }
  ]
}
```

Используется: 
- на странице **Анализ**, в блоках Граф зависимостей, Риски, Анализ ресурсов, Анализ ограничений
- на странице **Альтернатвы**, перечень ограничений
- на странице **План**, в блоке Ограничения в зоне внимания

## 6. Отчет о внешней среде
_TBD_

Используется: 
- на странице **Анализ**, риски, ИИ-объяснения, ИИ-рекомендации 

## 7. Стратегические цели 
```
{
  "title": "Добавление стратегической цели",
  "type": "block",
  "dynamic": true,
  "minInstances": 1,
  "components": [
    {
      "title": "S (Specific) — что необходимо достичь",
      "type": "string",
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "M (Measurable) — как будет измеряться достижение цели",
      "type": "block",
      "dynamic": false,
      "restrictions": {
        "required": true
      },
      "components": [
        {
          "title": "Название KPI",
          "type": "string",
        },
        {
          "title": "Целевое значение",
          "type": "integer",
        },
        {
          "title": "Единица измерения",
          "type": "string",
        }
      ]
    },
    {
      "title": "A (Achievable) — почему цель достижима",
      "type": "string",
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "T (Time-bound) — срок достижения",
      "type": "date",
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "Приоритет",
      "type": "enum",
      "values": ["high", "medium", "low"],
      "restrictions": {
        "required": true
      }
    },
    {
      "title": "Стратегические ориентиры",
      "type": "???"
    },
    {
      "title": "Связанные проекты",
      "type": "???"
    }
  ]
}
```

Используется: 
- на странице **Цели** 
