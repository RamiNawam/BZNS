-- 002_financial_questionnaire.sql
-- Persist cluster-specific financial questionnaire answers per profile

alter table if exists profiles
  add column if not exists financial_questionnaire_completed boolean default false;

alter table if exists profiles
  add column if not exists financial_questionnaire_answers jsonb default '{}'::jsonb;
