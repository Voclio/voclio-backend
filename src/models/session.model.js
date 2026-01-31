import { Session } from './orm/index.js';

class SessionModel {
  static async create(userId, refreshToken, expiresAt) {
    const session = await Session.create({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt
    });
    
    return {
      session_id: session.session_id,
      refresh_token: session.refresh_token
    };
  }

  static async findByRefreshToken(refreshToken) {
    const session = await Session.findOne({
      where: { refresh_token: refreshToken }
    });
    return session ? session.toJSON() : null;
  }

  static async invalidate(refreshToken) {
    await Session.destroy({
      where: { refresh_token: refreshToken }
    });
  }

  static async invalidateAllUserSessions(userId) {
    await Session.destroy({
      where: { user_id: userId }
    });
  }
}

export default SessionModel;
