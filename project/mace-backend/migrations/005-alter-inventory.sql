USE mace_tracking;

-- Make bu field optional
ALTER TABLE inventory MODIFY COLUMN bu VARCHAR(50) NULL;

-- Increase the size of the item field to accommodate multiple items
ALTER TABLE inventory MODIFY COLUMN item TEXT NOT NULL;

-- Make uom field optional
ALTER TABLE inventory MODIFY COLUMN uom VARCHAR(50) NULL;