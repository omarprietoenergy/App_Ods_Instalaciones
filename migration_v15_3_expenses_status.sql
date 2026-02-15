ALTER TABLE expenses MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'pending_invoicing', 'invoiced', 'void') NOT NULL DEFAULT 'pending_invoicing';
UPDATE expenses SET status='pending_invoicing' WHERE status='pending';
UPDATE expenses SET status='invoiced' WHERE status='approved';
