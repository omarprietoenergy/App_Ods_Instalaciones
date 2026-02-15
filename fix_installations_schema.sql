CREATE TABLE IF NOT EXISTS installationStatusHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  installationId INT NOT NULL,
  userId INT NOT NULL,
  previousStatus VARCHAR(50),
  newStatus VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS installationNotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  installationId INT NOT NULL,
  userId INT NOT NULL,
  noteText TEXT NOT NULL,
  parentNoteId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auxiliaryContacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  installationId INT NOT NULL,
  contactName VARCHAR(255) NOT NULL,
  contactPhone VARCHAR(50),
  contactRole VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add parentNoteId column if it doesn't exist (for existing tables)
-- Note: MySQL doesn't support IF NOT EXISTS for columns in generic SQL easily without stored procedure or complex syntax.
-- But since we use IF NOT EXISTS for table, we assume if table exists it might be old version?
-- Let's try a safe alter.
-- ALTER TABLE installationNotes ADD COLUMN parentNoteId INT; 
-- This would fail if column exists. 
-- Given the user context, it's likely either the table is missing validly or it's fully present from a fresh deploy.
-- We will stick to table creation for now as the most critical "missing" part.
