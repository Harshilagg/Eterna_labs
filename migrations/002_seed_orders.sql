-- seed data for orders (optional)
INSERT INTO orders(id, type, payload, status) VALUES
('seed-1', 'market', '{"amount":1,"symbol":"TOKEN"}', 'pending')
ON CONFLICT (id) DO NOTHING;
