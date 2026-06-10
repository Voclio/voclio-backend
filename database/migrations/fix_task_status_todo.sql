-- Normalize legacy task status values to match API convention
UPDATE tasks SET status = 'todo' WHERE status = 'pending';
