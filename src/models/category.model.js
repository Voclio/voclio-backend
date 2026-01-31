import { Category, Task, sequelize } from './orm/index.js';

class CategoryModel {
  static async create(userId, categoryData) {
    const category = await Category.create({
      user_id: userId,
      color: categoryData.color || '#4CAF50',
      ...categoryData
    });
    return category.toJSON();
  }

  static async findAll(userId) {
    const categories = await Category.findAll({
      where: { user_id: userId },
      order: [['name', 'ASC']]
    });
    return categories.map(c => c.toJSON());
  }

  static async findById(categoryId, userId) {
    const category = await Category.findOne({
      where: { category_id: categoryId, user_id: userId }
    });
    return category ? category.toJSON() : null;
  }

  static async update(categoryId, userId, updates) {
    const category = await Category.findOne({
      where: { category_id: categoryId, user_id: userId }
    });
    
    if (!category) return null;
    
    await category.update(updates);
    return category.toJSON();
  }

  static async delete(categoryId, userId) {
    const category = await Category.findOne({
      where: { category_id: categoryId, user_id: userId }
    });
    
    if (!category) return null;
    
    const categoryData = category.toJSON();
    await category.destroy();
    return categoryData;
  }

  static async getStats(categoryId, userId) {
    const category = await Category.findOne({
      where: { category_id: categoryId, user_id: userId },
      include: [{
        model: Task,
        as: 'tasks',
        attributes: []
      }],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('tasks.task_id')), 'total_tasks'],
          [sequelize.literal(`COUNT(CASE WHEN tasks.status = 'completed' THEN 1 END)`), 'completed_tasks'],
          [sequelize.literal(`COUNT(CASE WHEN tasks.status != 'completed' THEN 1 END)`), 'pending_tasks']
        ]
      },
      group: ['Category.category_id'],
      raw: true
    });
    
    return category;
  }
}

export default CategoryModel;
