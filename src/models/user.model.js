import { User, UserSettings } from './orm/index.js';

class UserModel {
  static async create(userData) {
    const user = await User.create(userData);
    return user.toJSON();
  }

  static async findByEmail(email) {
    const user = await User.findOne({ where: { email } });
    return user ? user.toJSON() : null;
  }

  static async findByOAuth(provider, oauthId) {
    const user = await User.findOne({ 
      where: { 
        oauth_provider: provider, 
        oauth_id: oauthId 
      } 
    });
    return user ? user.toJSON() : null;
  }

  static async findById(userId) {
    const user = await User.findOne({
      where: { user_id: userId },
      attributes: ['user_id', 'email', 'name', 'phone_number', 'is_active', 'oauth_provider', 'created_at']
    });
    return user ? user.toJSON() : null;
  }

  static async findByIdWithPassword(userId) {
    const user = await User.findOne({ where: { user_id: userId } });
    return user ? user.toJSON() : null;
  }

  static async updateOAuthInfo(userId, provider, oauthId) {
    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) return null;
    
    await user.update({
      oauth_provider: provider,
      oauth_id: oauthId,
      email_verified: true
    });
    return user.toJSON();
  }

  static async update(userId, updates) {
    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) return null;
    
    await user.update(updates);
    return {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number
    };
  }

  static async updatePassword(userId, hashedPassword) {
    await User.update(
      { password: hashedPassword },
      { where: { user_id: userId } }
    );
  }

  static async delete(userId) {
    await User.destroy({ where: { user_id: userId } });
  }

  static async createDefaultSettings(userId) {
    await UserSettings.create({ user_id: userId });
  }
}

export default UserModel;
