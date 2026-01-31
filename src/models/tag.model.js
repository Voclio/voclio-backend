import { Tag } from './orm/index.js';

class TagModel {
  static async create(userId, tagData) {
    const tag = await Tag.create({
      user_id: userId,
      ...tagData
    });
    return tag.toJSON();
  }

  static async findAll(userId) {
    const tags = await Tag.findAll({
      where: { user_id: userId },
      order: [['name', 'ASC']]
    });
    return tags.map(tag => tag.toJSON());
  }

  static async findById(tagId, userId) {
    const tag = await Tag.findOne({
      where: { tag_id: tagId, user_id: userId }
    });
    return tag ? tag.toJSON() : null;
  }

  static async update(tagId, userId, updates) {
    const tag = await Tag.findOne({
      where: { tag_id: tagId, user_id: userId }
    });
    
    if (!tag) return null;
    
    await tag.update(updates);
    return tag.toJSON();
  }

  static async delete(tagId, userId) {
    const tag = await Tag.findOne({
      where: { tag_id: tagId, user_id: userId }
    });
    
    if (!tag) return null;
    
    const tagData = tag.toJSON();
    await tag.destroy();
    return tagData;
  }
}

export default TagModel;
