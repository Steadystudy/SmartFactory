
LOCK TABLES `storage` WRITE;
INSERT IGNORE INTO storage (storage_id, amount, max_amount)
VALUES (1, 8000, 10000);
UNLOCK TABLES;

LOCK TABLES `line` WRITE;
INSERT IGNORE INTO line (line_id, cycle_time, status) VALUES
(1, 12.3, b'1'),
(2, 14.7, b'0'),
(3, 10.5, b'1'),
(4, 16.2, b'1'),
(5, 11.9, b'0'),
(6, 13.4, b'1'),
(7, 15.8, b'0'),
(8, 12.0, b'1'),
(9, 17.1, b'0'),
(10, 11.0, b'1');
UNLOCK TABLES;

LOCK TABLES `virtual_wall` WRITE;
INSERT IGNORE INTO virtual_wall (wall_id, x1, x2, y1, y2) VALUES
(1, 10.5, 20.7, 30.2, 40.1),
(2, 5.0, 15.3, 25.4, 35.6),
(3, 0.0, 10.0, 0.0, 10.0),
(4, 50.0, 60.0, 70.0, 80.0),
(5, 12.2, 18.5, 22.7, 28.9),
(6, 33.3, 44.4, 55.5, 66.6),
(7, 7.7, 14.4, 21.1, 27.8),
(8, 40.0, 50.0, 10.0, 20.0),
(9, 22.0, 32.0, 42.0, 52.0),
(10, 18.0, 28.0, 38.0, 48.0),
(11, 60.5, 70.2, 10.3, 20.4),
(12, 45.0, 55.0, 65.0, 75.0),
(13, 13.3, 23.3, 33.3, 43.3),
(14, 5.5, 15.5, 25.5, 35.5),
(15, 75.0, 80.0, 5.0, 10.0),
(16, 28.8, 38.8, 48.8, 58.8),
(17, 35.0, 45.0, 55.0, 65.0),
(18, 2.2, 12.2, 22.2, 32.2),
(19, 50.0, 60.0, 0.0, 10.0),
(20, 8.0, 18.0, 28.0, 38.0);
UNLOCK TABLES;

LOCK TABLES `amr` WRITE;
INSERT IGNORE INTO amr (amr_id, installed_at, name, type) VALUES
('AMR001', '2024-01-01 09:00:00.000000', 'AlphaBot', 'Type-A'),
('AMR002', '2024-01-02 10:00:00.000000', 'BetaBot', 'Type-B'),
('AMR003', '2024-01-03 11:00:00.000000', 'GammaBot', 'Type-A'),
('AMR004', '2024-01-04 12:00:00.000000', 'DeltaBot', 'Type-C'),
('AMR005', '2024-01-05 13:00:00.000000', 'EpsilonBot', 'Type-B'),
('AMR006', '2024-01-06 14:00:00.000000', 'ZetaBot', 'Type-A'),
('AMR007', '2024-01-07 15:00:00.000000', 'EtaBot', 'Type-C'),
('AMR008', '2024-01-08 16:00:00.000000', 'ThetaBot', 'Type-A'),
('AMR009', '2024-01-09 17:00:00.000000', 'IotaBot', 'Type-B'),
('AMR010', '2024-01-10 18:00:00.000000', 'KappaBot', 'Type-C'),
('AMR011', '2024-01-11 09:00:00.000000', 'LambdaBot', 'Type-A'),
('AMR012', '2024-01-12 10:00:00.000000', 'MuBot', 'Type-B'),
('AMR013', '2024-01-13 11:00:00.000000', 'NuBot', 'Type-C'),
('AMR014', '2024-01-14 12:00:00.000000', 'XiBot', 'Type-A'),
('AMR015', '2024-01-15 13:00:00.000000', 'OmicronBot', 'Type-B'),
('AMR016', '2024-01-16 14:00:00.000000', 'PiBot', 'Type-C'),
('AMR017', '2024-01-17 15:00:00.000000', 'RhoBot', 'Type-A'),
('AMR018', '2024-01-18 16:00:00.000000', 'SigmaBot', 'Type-B'),
('AMR019', '2024-01-19 17:00:00.000000', 'TauBot', 'Type-C'),
('AMR020', '2024-01-20 18:00:00.000000', 'UpsilonBot', 'Type-A');
UNLOCK TABLES;

LOCK TABLES `amr_error_log` WRITE;
INSERT IGNORE INTO amr_error_log (error_log_id, error_code, occurred_at, resolved_at, x, y, amr_id) VALUES
(1, 'ERR001', '2025-05-05 12:00:00.000000', '2025-05-05 12:05:00.000000', 10.5, 20.5, 'AMR001'),
(2, 'ERR002', '2025-05-05 12:10:00.000000', '2025-05-05 12:15:00.000000', 15.0, 25.0, 'AMR002'),
(3, 'ERR003', '2025-05-05 12:20:00.000000', '2025-05-05 12:25:00.000000', 20.5, 30.5, 'AMR003'),
(4, 'ERR004', '2025-05-05 12:30:00.000000', '2025-05-05 12:35:00.000000', 25.0, 35.0, 'AMR004'),
(5, 'ERR005', '2025-05-05 12:40:00.000000', '2025-05-05 12:45:00.000000', 30.5, 40.5, 'AMR005'),
(6, 'ERR006', '2025-05-05 12:50:00.000000', '2025-05-05 12:55:00.000000', 35.0, 45.0, 'AMR006'),
(7, 'ERR007', '2025-05-05 13:00:00.000000', '2025-05-05 13:05:00.000000', 40.5, 50.5, 'AMR007'),
(8, 'ERR008', '2025-05-05 13:10:00.000000', '2025-05-05 13:15:00.000000', 45.0, 55.0, 'AMR008'),
(9, 'ERR009', '2025-05-05 13:20:00.000000', '2025-05-05 13:25:00.000000', 50.5, 60.5, 'AMR009'),
(10, 'ERR010', '2025-05-05 13:30:00.000000', '2025-05-05 13:35:00.000000', 55.0, 65.0, 'AMR010');
UNLOCK TABLES;

LOCK TABLES `node` WRITE;
INSERT IGNORE INTO node (node_id, direction, geo_fence, node_name, node_type, x, y) VALUES
(1, 45.0, b'1', 'Node_Alpha', 'CHARGE', 10.5, 20.3),
(2, 90.0, b'0', 'Node_Beta', 'COMMON', 15.2, 25.6),
(3, 180.0, b'1', 'Node_Gamma', 'DOCKING', 12.8, 22.1),
(4, 270.0, b'0', 'Node_Delta', 'WAITING', 18.7, 30.4),
(5, 0.0, b'1', 'Node_Epsilon', 'CHARGE', 16.5, 27.9),
(6, 45.0, b'1', 'Node_Zeta', 'COMMON', 14.1, 24.7),
(7, 135.0, b'0', 'Node_Eta', 'DOCKING', 11.3, 19.8),
(8, 225.0, b'1', 'Node_Theta', 'WAITING', 13.9, 23.6),
(9, 315.0, b'0', 'Node_Iota', 'CHARGE', 17.4, 28.2),
(10, 60.0, b'1', 'Node_Kappa', 'COMMON', 19.6, 32.0);
UNLOCK TABLES;

LOCK TABLES `edge` WRITE;
INSERT IGNORE INTO edge (edge_id, edge_direction, speed, node1_node_id, node2_node_id) VALUES
(1, 'FORWARD', 5.5, 1, 2),
(2, 'REARWARD', 4.8, 2, 3),
(3, 'TWOWAY', 6.2, 3, 4),
(4, 'FORWARD', 7.0, 4, 5),
(5, 'REARWARD', 3.9, 5, 6);
UNLOCK TABLES;

LOCK TABLES `mission` WRITE;
INSERT IGNORE INTO mission (mission_id, amount, mission_type, target_node_id) VALUES
('Mission001', 5, 'CHARGING', 1),
('Mission002', 10, 'LOADING', 2),
('Mission003', 8, 'MOVING', 3),
('Mission004', 12, 'UNLOADING', 4),
('Mission005', 7, 'CHARGING', 5),
('Mission006', 15, 'LOADING', 6),
('Mission007', 9, 'MOVING', 7),
('Mission008', 11, 'UNLOADING', 8),
('Mission009', 6, 'CHARGING', 9),
('Mission010', 14, 'LOADING', 10);
UNLOCK TABLES;

LOCK TABLES `mission_log` WRITE;
INSERT IGNORE INTO mission_log (mission_log_id, ended_at, started_at, amr_id, mission_id) VALUES
(1, '2025-04-30 08:30:00.000000', '2025-04-30 08:10:00.000000', 'AMR001', 'Mission001'),
(2, '2025-04-30 12:25:00.000000', '2025-04-30 12:15:00.000000', 'AMR002', 'Mission002'),
(3, '2025-04-30 12:40:00.000000', '2025-04-30 12:30:00.000000', 'AMR003', 'Mission003'),
(4, '2025-04-30 12:55:00.000000', '2025-04-30 12:45:00.000000', 'AMR004', 'Mission004'),
(5, '2025-04-30 13:10:00.000000', '2025-04-30 13:00:00.000000', 'AMR005', 'Mission005'),
(6, '2025-04-30 13:25:00.000000', '2025-04-30 13:15:00.000000', 'AMR006', 'Mission006'),
(7, '2025-04-30 13:40:00.000000', '2025-04-30 13:30:00.000000', 'AMR007', 'Mission001'),
(8, '2025-04-30 13:55:00.000000', '2025-04-30 13:45:00.000000', 'AMR008', 'Mission007'),
(9, '2025-04-30 14:10:00.000000', '2025-04-30 14:00:00.000000', 'AMR009', 'Mission002'),
(10, '2025-04-30 14:25:00.000000', '2025-04-30 14:15:00.000000', 'AMR010', 'Mission008'),
(11, '2025-04-30 14:40:00.000000', '2025-04-30 14:30:00.000000', 'AMR011', 'Mission003'),
(12, '2025-04-30 14:55:00.000000', '2025-04-30 14:45:00.000000', 'AMR012', 'Mission009'),
(13, '2025-04-30 15:10:00.000000', '2025-04-30 15:00:00.000000', 'AMR013', 'Mission010'),
(14, '2025-04-30 15:25:00.000000', '2025-04-30 15:15:00.000000', 'AMR014', 'Mission001'),
(15, '2025-04-30 15:40:00.000000', '2025-04-30 15:30:00.000000', 'AMR015', 'Mission004'),
(16, '2025-04-30 15:55:00.000000', '2025-04-30 15:45:00.000000', 'AMR016', 'Mission005'),
(17, '2025-04-30 16:10:00.000000', '2025-04-30 16:00:00.000000', 'AMR017', 'Mission006'),
(18, '2025-04-30 16:25:00.000000', '2025-04-30 16:15:00.000000', 'AMR018', 'Mission001'),
(19, '2025-04-30 16:40:00.000000', '2025-04-30 16:30:00.000000', 'AMR019', 'Mission002'),
(20, '2025-04-30 16:55:00.000000', '2025-04-30 16:45:00.000000', 'AMR020', 'Mission001');
UNLOCK TABLES;

LOCK TABLES `route` WRITE;
INSERT IGNORE INTO route (route_id, edge_id, ended_at, node_id, started_at, mission_log_id) VALUES
(1, 2, '2025-05-05 10:00:10.123456', 3, '2025-05-05 10:00:00.123456', 1),
(2, 4, '2025-05-05 10:05:20.654321', 5, '2025-05-05 10:05:10.654321', 1),
(3, 6, '2025-05-05 10:10:30.111111', 7, '2025-05-05 10:10:20.111111', 1),
(4, 8, '2025-05-05 10:15:40.222222', 9, '2025-05-05 10:15:30.222222', 2),
(5, 10, '2025-05-05 10:20:50.333333', 1, '2025-05-05 10:20:40.333333', 2),
(6, 1, '2025-05-05 10:25:00.444444', 2, '2025-05-05 10:24:50.444444', 3),
(7, 3, '2025-05-05 10:30:10.555555', 4, '2025-05-05 10:30:00.555555', 4),
(8, 5, '2025-05-05 10:35:20.666666', 6, '2025-05-05 10:35:10.666666', 5),
(9, 7, '2025-05-05 10:40:30.777777', 8, '2025-05-05 10:40:20.777777', 5),
(10, 9, '2025-05-05 10:45:40.888888', 10, '2025-05-05 10:45:30.888888', 6),
(11, 2, '2025-05-05 10:50:50.999999', 3, '2025-05-05 10:50:40.999999', 7),
(12, 4, '2025-05-05 10:55:00.123456', 5, '2025-05-05 10:54:50.123456', 8),
(13, 6, '2025-05-05 11:00:10.234567', 7, '2025-05-05 11:00:00.234567', 9),
(14, 8, '2025-05-05 11:05:20.345678', 9, '2025-05-05 11:05:10.345678', 10),
(15, 10, '2025-05-05 11:10:30.456789', 1, '2025-05-05 11:10:20.456789', 10),
(16, 1, '2025-05-05 11:15:40.567890', 2, '2025-05-05 11:15:30.567890', 10),
(17, 3, '2025-05-05 11:20:50.678901', 4, '2025-05-05 11:20:40.678901', 10),
(18, 5, '2025-05-05 11:25:00.789012', 6, '2025-05-05 11:24:50.789012', 10),
(19, 7, '2025-05-05 11:30:10.890123', 8, '2025-05-05 11:30:00.890123', 11),
(20, 9, '2025-05-05 11:35:20.901234', 10, '2025-05-05 11:35:10.901234', 12);
UNLOCK TABLES;
