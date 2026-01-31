-- Migration: Add Sub-tasks Support
-- Description: Adds parent_task_id column to tasks table for hierarchical task structure

-- Add parent_task_id column to tasks table
ALTER TABLE tasks 
ADD COLUMN parent_task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Add comment
COMMENT ON COLUMN tasks.parent_task_id IS 'Reference to parent task ID for sub-tasks. NULL means this is a main task.';
