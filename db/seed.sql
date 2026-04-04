-- Seed data for RestaurantGuard

-- Restaurants
INSERT INTO restaurants (name, type, address, city, state, zip, phone, health_dept_id, next_inspection_date) VALUES
('Bella Vista Trattoria', 'Full Service', '142 Main St', 'Austin', 'TX', '78701', '(512) 555-0101', 'HD-ATX-2847', '2026-04-18'),
('Sunrise Diner', 'Quick Service', '88 Oak Ave', 'Austin', 'TX', '78702', '(512) 555-0102', 'HD-ATX-3192', '2026-04-25'),
('Sakura Sushi Bar', 'Full Service', '305 Congress Ave', 'Austin', 'TX', '78701', '(512) 555-0103', 'HD-ATX-1456', '2026-05-02'),
('Taco Libre', 'Food Truck', '12 S Lamar Blvd', 'Austin', 'TX', '78704', '(512) 555-0104', 'HD-ATX-5501', '2026-04-10'),
('The Green Fork', 'Fast Casual', '920 E 6th St', 'Austin', 'TX', '78702', '(512) 555-0105', 'HD-ATX-4410', '2026-05-15');

-- HACCP Checklists
INSERT INTO checklists (restaurant_id, name, category, description, is_template) VALUES
(1, 'Daily Food Safety Checklist', 'HACCP', 'Standard daily HACCP monitoring checklist', FALSE),
(1, 'Pre-Inspection Prep', 'Inspection Prep', 'Checklist to prepare for upcoming health dept inspection', FALSE),
(2, 'Daily Food Safety Checklist', 'HACCP', 'Daily monitoring for quick-service operations', FALSE),
(3, 'Raw Fish Handling Protocol', 'HACCP', 'Specialized checklist for raw fish and sushi prep', FALSE),
(4, 'Mobile Unit Daily Check', 'HACCP', 'Food truck specific daily safety checks', FALSE),
(5, 'Daily Food Safety Checklist', 'HACCP', 'Standard daily monitoring checklist', FALSE),
(NULL, 'Universal HACCP Template', 'HACCP', 'Standard HACCP checklist template for any restaurant', TRUE),
(NULL, 'Health Inspection Prep Template', 'Inspection Prep', 'Universal pre-inspection preparation checklist', TRUE);

-- Checklist Items for Daily Food Safety (checklist 1 - Bella Vista)
INSERT INTO checklist_items (checklist_id, description, category, is_critical, sort_order) VALUES
(1, 'Check walk-in cooler temperature (must be ≤ 41°F / 5°C)', 'Temperature Control', TRUE, 1),
(1, 'Check freezer temperature (must be ≤ 0°F / -18°C)', 'Temperature Control', TRUE, 2),
(1, 'Verify hot-holding temps for prepared items (≥ 135°F / 57°C)', 'Temperature Control', TRUE, 3),
(1, 'Inspect handwashing stations — soap, paper towels, hot water', 'Personal Hygiene', TRUE, 4),
(1, 'Verify sanitizer concentration at dish station (chlorine 50-100 ppm)', 'Sanitation', TRUE, 5),
(1, 'Check food label dates — discard expired items', 'Food Storage', FALSE, 6),
(1, 'Inspect raw/cooked food separation in walk-in', 'Cross-Contamination', TRUE, 7),
(1, 'Clean and sanitize prep surfaces', 'Sanitation', FALSE, 8),
(1, 'Verify pest traps are intact and logged', 'Pest Control', FALSE, 9),
(1, 'Review employee illness log — no symptomatic staff on duty', 'Personal Hygiene', TRUE, 10);

-- Checklist Items for Pre-Inspection Prep (checklist 2)
INSERT INTO checklist_items (checklist_id, description, category, is_critical, sort_order) VALUES
(2, 'Review last inspection report — address all prior violations', 'Documentation', TRUE, 1),
(2, 'Verify all food handler permits are current and posted', 'Documentation', TRUE, 2),
(2, 'Calibrate all food thermometers', 'Equipment', TRUE, 3),
(2, 'Deep clean all hood vents and grease traps', 'Sanitation', FALSE, 4),
(2, 'Ensure all HACCP logs are complete for past 90 days', 'Documentation', TRUE, 5),
(2, 'Check fire suppression system tags are current', 'Safety', FALSE, 6),
(2, 'Verify first-aid kit is stocked', 'Safety', FALSE, 7),
(2, 'Test all handwashing sinks for hot water (≥ 100°F)', 'Sanitation', TRUE, 8),
(2, 'Review allergen labeling on all menu items', 'Food Safety', FALSE, 9),
(2, 'Confirm chemical storage is separated from food areas', 'Chemical Safety', TRUE, 10);

-- Checklist Items for Sunrise Diner daily (checklist 3)
INSERT INTO checklist_items (checklist_id, description, category, is_critical, sort_order) VALUES
(3, 'Check walk-in cooler temperature (≤ 41°F)', 'Temperature Control', TRUE, 1),
(3, 'Verify hot-holding station temps (≥ 135°F)', 'Temperature Control', TRUE, 2),
(3, 'Inspect handwashing stations', 'Personal Hygiene', TRUE, 3),
(3, 'Check sanitizer buckets at each station', 'Sanitation', TRUE, 4),
(3, 'Verify date labels on all prep containers', 'Food Storage', FALSE, 5),
(3, 'Clean and sanitize countertops and cutting boards', 'Sanitation', FALSE, 6);

-- Checklist Items for Sushi checklist (checklist 4)
INSERT INTO checklist_items (checklist_id, description, category, is_critical, sort_order) VALUES
(4, 'Check sushi-grade fish receiving temp (≤ 41°F)', 'Temperature Control', TRUE, 1),
(4, 'Verify fish supplier HACCP documentation on file', 'Documentation', TRUE, 2),
(4, 'Inspect rice holding temperature and pH log', 'Temperature Control', TRUE, 3),
(4, 'Verify parasite destruction records for raw fish (frozen ≤ -4°F for 7 days)', 'Food Safety', TRUE, 4),
(4, 'Check sashimi knife sanitization between uses', 'Sanitation', TRUE, 5),
(4, 'Confirm allergen info posted for shellfish and soy', 'Food Safety', FALSE, 6);

-- Inspections
INSERT INTO inspections (restaurant_id, checklist_id, inspector_name, inspection_type, scheduled_date, completed_date, status, score, notes) VALUES
(1, 1, 'Maria Gonzalez', 'Routine', '2026-01-15', '2026-01-15 10:30:00', 'Completed', 92, 'Minor violation: one handwashing station missing paper towels. Corrected on-site.'),
(2, 3, 'James Chen', 'Routine', '2026-02-20', '2026-02-20 14:00:00', 'Completed', 88, 'Two items in walk-in above temp threshold. Hot-holding station slightly below minimum.'),
(3, 4, 'Maria Gonzalez', 'Routine', '2026-03-10', '2026-03-10 09:45:00', 'Completed', 95, 'Excellent fish handling procedures. Minor labeling issue on soy sauce containers.'),
(4, 5, 'James Chen', 'Routine', '2026-02-05', '2026-02-05 11:00:00', 'Completed', 78, 'Water heater not reaching adequate temp. Grease trap overdue for cleaning.'),
(1, 2, NULL, 'Routine', '2026-04-18', NULL, 'Scheduled', NULL, NULL),
(2, 3, NULL, 'Follow-Up', '2026-04-25', NULL, 'Scheduled', NULL, NULL),
(5, 6, 'Sarah Kim', 'Routine', '2026-03-01', '2026-03-01 13:15:00', 'Completed', 90, 'Good overall. Needed better date labeling on prepped salad items.');

-- Inspection Responses (for Bella Vista's completed inspection)
INSERT INTO inspection_responses (inspection_id, checklist_item_id, status, notes) VALUES
(1, 1, 'pass', 'Walk-in at 38°F'),
(1, 2, 'pass', 'Freezer at -4°F'),
(1, 3, 'pass', 'Soup station at 142°F'),
(1, 4, 'fail', 'Paper towels missing at back prep station'),
(1, 5, 'pass', 'Chlorine at 75 ppm'),
(1, 6, 'pass', 'All dates current'),
(1, 7, 'pass', 'Proper separation maintained'),
(1, 8, 'pass', 'Surfaces clean'),
(1, 9, 'pass', 'All traps intact'),
(1, 10, 'pass', 'No ill staff on duty');

-- Corrective Actions
INSERT INTO corrective_actions (inspection_id, restaurant_id, description, severity, assigned_to, due_date, status, completed_at) VALUES
(1, 1, 'Restock paper towels at back prep handwashing station and add to daily opening checklist', 'Low', 'Tony Russo', '2026-01-17', 'Resolved', '2026-01-15 15:00:00'),
(2, 2, 'Repair walk-in cooler door gasket — not sealing properly causing temp rise', 'High', 'Mike Johnson', '2026-02-25', 'Resolved', '2026-02-22 10:00:00'),
(2, 2, 'Recalibrate hot-holding station thermostat', 'Medium', 'Mike Johnson', '2026-02-25', 'Resolved', '2026-02-23 09:00:00'),
(4, 4, 'Replace water heater — current unit cannot maintain 100°F at handwash sinks', 'Critical', 'Carlos Mendez', '2026-02-12', 'Resolved', '2026-02-10 16:00:00'),
(4, 4, 'Schedule grease trap cleaning service — overdue by 3 weeks', 'High', 'Carlos Mendez', '2026-02-08', 'Resolved', '2026-02-07 11:00:00'),
(3, 3, 'Update soy sauce container labels to include allergen warnings', 'Low', 'Yuki Tanaka', '2026-03-15', 'Resolved', '2026-03-12 14:00:00'),
(7, 5, 'Implement date-labeling protocol for all prepped salad containers', 'Medium', 'Alex Rivera', '2026-03-08', 'Open', NULL);

-- Alerts
INSERT INTO alerts (restaurant_id, type, title, message, due_date, is_read) VALUES
(1, 'inspection_upcoming', 'Health Inspection in 15 Days', 'Your routine health department inspection is scheduled for April 18, 2026. Start your pre-inspection prep checklist.', '2026-04-18', FALSE),
(2, 'inspection_upcoming', 'Follow-Up Inspection in 22 Days', 'Health department follow-up inspection scheduled for April 25, 2026. Ensure all corrective actions from February are documented.', '2026-04-25', FALSE),
(4, 'inspection_upcoming', 'Health Inspection in 7 Days', 'Your routine inspection is scheduled for April 10, 2026. Complete all prep items immediately.', '2026-04-10', FALSE),
(1, 'checklist_reminder', 'Daily HACCP Checklist Due', 'Complete your daily food safety checklist before end of shift today.', '2026-04-03', FALSE),
(3, 'compliance_alert', 'Fish Supplier HACCP Docs Expiring', 'Your primary fish supplier HACCP certification expires April 30. Request updated documentation.', '2026-04-30', FALSE),
(5, 'corrective_action', 'Open Corrective Action Overdue', 'Date-labeling protocol for salad prep is past due (was due March 8). Please resolve and update status.', '2026-03-08', FALSE),
(4, 'compliance_alert', 'Food Handler Permit Renewal', 'Carlos Mendez food handler permit expires April 20, 2026. Schedule renewal.', '2026-04-20', FALSE);
