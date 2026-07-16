CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS commerce;
CREATE SCHEMA IF NOT EXISTS content;

DO $$
DECLARE
  table_move record;
BEGIN
  FOR table_move IN
    SELECT *
    FROM (
      VALUES
        ('catalog', 'categories'),
        ('catalog', 'products'),
        ('catalog', 'product_images'),
        ('catalog', 'product_attributes'),
        ('catalog', 'product_option_values'),
        ('catalog', 'product_categories'),
        ('auth', 'users'),
        ('auth', 'addresses'),
        ('commerce', 'orders'),
        ('commerce', 'order_items')
    ) AS planned_moves(target_schema, table_name)
  LOOP
    IF to_regclass(format('public.%I', table_move.table_name)) IS NOT NULL
      AND to_regclass(format('%I.%I', table_move.target_schema, table_move.table_name)) IS NULL
    THEN
      EXECUTE format(
        'ALTER TABLE public.%I SET SCHEMA %I',
        table_move.table_name,
        table_move.target_schema
      );
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  sequence_move record;
BEGIN
  FOR sequence_move IN
    SELECT *
    FROM (
      VALUES
        ('catalog', 'categories_id_seq'),
        ('catalog', 'products_id_seq'),
        ('catalog', 'product_images_id_seq'),
        ('catalog', 'product_attributes_id_seq'),
        ('catalog', 'product_option_values_id_seq'),
        ('auth', 'users_id_seq'),
        ('auth', 'addresses_id_seq'),
        ('commerce', 'orders_id_seq'),
        ('commerce', 'order_items_id_seq')
    ) AS planned_moves(target_schema, sequence_name)
  LOOP
    IF to_regclass(format('public.%I', sequence_move.sequence_name)) IS NOT NULL
      AND to_regclass(format('%I.%I', sequence_move.target_schema, sequence_move.sequence_name)) IS NULL
    THEN
      EXECUTE format(
        'ALTER SEQUENCE public.%I SET SCHEMA %I',
        sequence_move.sequence_name,
        sequence_move.target_schema
      );
    END IF;
  END LOOP;
END $$;
