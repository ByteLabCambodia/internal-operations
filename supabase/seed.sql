-- Reference / sample data (idempotent). The chart of accounts is seeded in
-- migration 003. Sample users are created separately by scripts/seed.ts.

insert into departments (name) values
  ('Engineering'), ('Operations'), ('Education')
on conflict do nothing;

insert into projects (name) values
  ('Robotics Kit 2026'), ('STEM Workshop'), ('General')
on conflict do nothing;

insert into inventory_items (sku, name, category, unit, stock_qty, reorder_point, reorder_qty) values
  ('MCU-ESP32',   'ESP32 Dev Board',        'Electronics', 'pcs', 40, 10, 50),
  ('MOT-DC-12V',  'DC Motor 12V',           'Electronics', 'pcs', 12,  5, 30),
  ('RES-10K',     'Resistor 10k (pack)',    'Components',  'pack', 8,  4, 20),
  ('FIL-PLA-1KG', 'PLA Filament 1kg',       '3D Printing', 'roll', 6,  3, 10),
  ('JMP-WIRE',    'Jumper Wires (bundle)',  'Components',  'bundle', 25, 8, 40)
on conflict (sku) do nothing;

-- Today's reference rates (currency per 1 USD). Finance can override later.
insert into exchange_rates (rate_date, currency, rate_to_usd, source) values
  (current_date, 'USD', 1,       'manual'),
  (current_date, 'KHR', 4100,    'manual'),
  (current_date, 'CNY', 7.24,    'manual')
on conflict (rate_date, currency) do nothing;
