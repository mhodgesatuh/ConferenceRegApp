-- Fixture: populate lunch menu validation entries
INSERT INTO validation_tables (validation_table, value)
SELECT 'lunch_menu', 'spam'
WHERE NOT EXISTS (
    SELECT 1 FROM validation_tables WHERE validation_table = 'lunch_menu' AND value = 'spam'
);

INSERT INTO validation_tables (validation_table, value)
SELECT 'lunch_menu', 'loco moco'
WHERE NOT EXISTS (
    SELECT 1 FROM validation_tables WHERE validation_table = 'lunch_menu' AND value = 'loco moco'
);
