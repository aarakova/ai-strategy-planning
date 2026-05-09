Потенциальные коллекции MongoDB:

users;
planning_contexts;
strategic_orientations;
projects;
project_dependencies;
portfolio_constraints;
analysis_results;
strategic_goals;
ai_goal_suggestions;
goal_conflicts;
goal_duplicates;
alternative_scenarios;
scenario_comparisons;
strategic_plans;
monitoring_records;
domain_events.

Привязка данных к пользователю:
- Один пользователь может иметь несколько мультипроектов (planning_contexts).
- Все коллекции привязаны к пользователю транзитивно через цепочку: users → planning_contexts (userId) → все остальные коллекции (contextId).
- Изменения в других коллекциях не требуются.