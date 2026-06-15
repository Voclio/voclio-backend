import { DeviceToken } from './orm/index.js';

class DeviceTokenModel {
  static async upsert(userId, token, platform = 'unknown') {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) {
      return null;
    }

    const existing = await DeviceToken.findOne({
      where: { user_id: userId, token: normalizedToken }
    });

    if (existing) {
      await existing.update({ platform, updated_at: new Date() });
      return existing.toJSON();
    }

    const created = await DeviceToken.create({
      user_id: userId,
      token: normalizedToken,
      platform
    });
    return created.toJSON();
  }

  static async remove(userId, token) {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) {
      return 0;
    }

    return DeviceToken.destroy({
      where: { user_id: userId, token: normalizedToken }
    });
  }

  static async removeAllForUser(userId) {
    return DeviceToken.destroy({ where: { user_id: userId } });
  }

  static async findByUserId(userId) {
    const rows = await DeviceToken.findAll({ where: { user_id: userId } });
    return rows.map(row => row.toJSON());
  }

  static async removeInvalidTokens(tokens = []) {
    if (!tokens.length) {
      return 0;
    }

    return DeviceToken.destroy({ where: { token: tokens } });
  }
}

export default DeviceTokenModel;
