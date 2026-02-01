import { Note, Tag, sequelize } from "./orm/index.js";
import { Op } from "sequelize";

class NoteModel {
  static async create(userId, noteData) {
    const note = await Note.create({
      user_id: userId,
      ...noteData,
    });
    return note.toJSON();
  }

  static async findAll(userId, options = {}) {
    const { page = 1, limit = 20, search } = options;
    const offset = (page - 1) * limit;

    const where = { user_id: userId };

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const notes = await Note.findAll({
      where,
      include: [
        {
          model: Tag,
          as: "tags",
          attributes: ["tag_id", "name", "color"],
          through: { attributes: [] },
        },
      ],
      order: [["updated_at", "DESC"]],
      limit,
      offset,
    });

    return notes.map((note) => note.toJSON());
  }

  static async findById(noteId, userId) {
    const note = await Note.findOne({
      where: { note_id: noteId, user_id: userId },
      include: [
        {
          model: Tag,
          as: "tags",
          attributes: ["tag_id", "name", "color"],
          through: { attributes: [] },
        },
      ],
    });

    return note ? note.toJSON() : null;
  }

  static async update(noteId, userId, updates) {
    const note = await Note.findOne({
      where: { note_id: noteId, user_id: userId },
    });

    if (!note) return null;

    await note.update(updates);
    return note.toJSON();
  }

  static async delete(noteId, userId) {
    const note = await Note.findOne({
      where: { note_id: noteId, user_id: userId },
    });

    if (!note) return null;

    const noteData = note.toJSON();
    await note.destroy();
    return noteData;
  }

  static async addTags(noteId, tags) {
    const note = await Note.findByPk(noteId);
    if (!note) throw new Error("Note not found");

    const tagIds = [];

    for (const tag of tags) {
      if (typeof tag === "number") {
        tagIds.push(tag);
      } else if (typeof tag === "string") {
        // Treat as tag name -> Find or create
        const [tagRecord] = await Tag.findOrCreate({
          where: {
            name: tag,
            user_id: note.user_id,
          },
          defaults: {
            color: "#3498db", // Default color
          },
        });
        tagIds.push(tagRecord.tag_id);
      }
    }

    await note.setTags(tagIds);
  }

  static async removeTag(noteId, tagId) {
    const note = await Note.findByPk(noteId);
    if (!note) return null;

    await note.removeTags([tagId]);
    return { note_id: noteId, tag_id: tagId };
  }

  static async count(userId, search) {
    const where = { user_id: userId };

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return await Note.count({ where });
  }
}

export default NoteModel;
