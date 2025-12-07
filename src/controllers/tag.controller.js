const TagModel = require('../models/tag.model');
const { validationResult } = require('express-validator');
const { successResponse } = require('../utils/responses');
const { ValidationError, NotFoundError } = require('../utils/errors');

class TagController {
  static async getAllTags(req, res, next) {
    try {
      const tags = await TagModel.findAll(req.user.user_id);

      return successResponse(res, { tags });

    } catch (error) {
      next(error);
    }
  }

  static async getTagById(req, res, next) {
    try {
      const tag = await TagModel.findById(req.params.id, req.user.user_id);

      if (!tag) {
        throw new NotFoundError('Tag not found');
      }

      return successResponse(res, { tag });

    } catch (error) {
      next(error);
    }
  }

  static async createTag(req, res, next) {
    try {
      const { name, color, description } = req.body;

      if (!name) {
        throw new ValidationError('Tag name is required');
      }

      const tag = await TagModel.create(req.user.user_id, {
        name,
        color,
        description
      });

      return successResponse(res, { tag }, 'Tag created successfully', 201);

    } catch (error) {
      next(error);
    }
  }

  static async updateTag(req, res, next) {
    try {
      const { name, color, description } = req.body;

      const tag = await TagModel.update(req.params.id, req.user.user_id, {
        name,
        color,
        description
      });

      if (!tag) {
        throw new NotFoundError('Tag not found');
      }

      return successResponse(res, { tag }, 'Tag updated successfully');

    } catch (error) {
      next(error);
    }
  }

  static async deleteTag(req, res, next) {
    try {
      const tag = await TagModel.delete(req.params.id, req.user.user_id);

      if (!tag) {
        throw new NotFoundError('Tag not found');
      }

      return successResponse(res, null, 'Tag deleted successfully');

    } catch (error) {
      next(error);
    }
  }
}

module.exports = TagController;
