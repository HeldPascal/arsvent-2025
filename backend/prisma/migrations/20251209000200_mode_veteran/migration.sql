-- Normalize legacy mode values from VET to VETERAN
UPDATE "User"
SET mode = 'VETERAN'
WHERE mode = 'VET';
