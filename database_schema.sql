-- 1. INVENTORY TABLE: Tracks stock levels of ingredients/supplies
CREATE TABLE inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE, -- e.g., "110G CHORIZO", "TOMATO"
    current_stock DECIMAL(10,2), -- Could be in PCS, KG, etc.
    unit VARCHAR(20), -- 'PCS', 'KG', 'L' - from your Excel
    alert_level DECIMAL(10,2) -- The '<5' or '<3' from Excel
);

-- 2. RECIPE/BILL OF MATERIALS TABLE: Links a menu item to its ingredients
CREATE TABLE menu_item_ingredients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    menu_item_id INT, -- Links to `menu_items.id`
    inventory_id INT, -- Links to `inventory.id`
    quantity_required DECIMAL(10,2) -- e.g., 2 pieces of chorizo per sandwich
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);