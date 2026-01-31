import { validationResult } from 'express-validator';
import CategoryModel from '../models/category.model.js';
import { successResponse } from '../utils/responses.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

class CategoryController {
  static async getAllCategories(req, res, next) {
    try {
      const categories = await CategoryModel.findAll(req.user.user_id);
      return successResponse(res, { categories });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryById(req, res, next) {
    try {
      const category = await CategoryModel.findById(req.params.id, req.user.user_id);

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      return successResponse(res, { category });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const category = await CategoryModel.create(req.user.user_id, req.body);
      return successResponse(res, { category }, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const category = await CategoryModel.update(req.params.id, req.user.user_id, req.body);

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      return successResponse(res, { category }, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const category = await CategoryModel.delete(req.params.id, req.user.user_id);

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      return successResponse(res, null, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryStats(req, res, next) {
    try {
      const category = await CategoryModel.getStats(req.params.id, req.user.user_id);

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      return successResponse(res, { category });
    } catch (error) {
      next(error);
    }
  }
}

export default CategoryController;
