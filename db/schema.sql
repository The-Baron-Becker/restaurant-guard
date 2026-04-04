-- RestaurantGuard Database Schema

CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'Full Service',
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    phone VARCHAR(30),
    health_dept_id VARCHAR(100),
    next_inspection_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE checklists (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    description TEXT,
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE checklist_items (
    id SERIAL PRIMARY KEY,
    checklist_id INTEGER REFERENCES checklists(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    is_critical BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE inspections (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    checklist_id INTEGER REFERENCES checklists(id),
    inspector_name VARCHAR(255),
    inspection_type VARCHAR(100) DEFAULT 'Routine',
    scheduled_date DATE,
    completed_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Scheduled',
    score INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inspection_responses (
    id SERIAL PRIMARY KEY,
    inspection_id INTEGER REFERENCES inspections(id) ON DELETE CASCADE,
    checklist_item_id INTEGER REFERENCES checklist_items(id),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    photo_url VARCHAR(500),
    responded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE corrective_actions (
    id SERIAL PRIMARY KEY,
    inspection_id INTEGER REFERENCES inspections(id) ON DELETE CASCADE,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'Medium',
    assigned_to VARCHAR(255),
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Open',
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    due_date DATE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
