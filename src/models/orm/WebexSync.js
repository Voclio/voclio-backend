import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const WebexSync = sequelize.define('WebexSync', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
    onDelete: 'CASCADE'
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'AES-256-GCM encrypted'
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AES-256-GCM encrypted'
  },
  tokenType: {
    type: DataTypes.STRING,
    defaultValue: 'Bearer'
  },
  expiresIn: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scope: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  webexUserId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  webexUserEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  webexDisplayName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  syncEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'webex_sync',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['user_id'] },
    { fields: ['webex_user_id'] },
    { fields: ['webex_user_email'] },
    { fields: ['is_active'] },
    { fields: ['sync_enabled'] }
  ]
});

// ── Encryption hooks ──────────────────────────────────────────────────────────
// Lazy-import to avoid circular deps at module load time
async function getEncryption() {
  const { default: enc } = await import('../../services/encryption.service.js');
  return enc;
}

WebexSync.addHook('beforeCreate', async (instance) => {
  const enc = await getEncryption();
  if (instance.accessToken)  instance.accessToken  = enc.encryptField(instance.accessToken);
  if (instance.refreshToken) instance.refreshToken = enc.encryptField(instance.refreshToken);
});

WebexSync.addHook('beforeUpdate', async (instance) => {
  const enc = await getEncryption();
  if (instance.changed('accessToken')  && instance.accessToken)  instance.accessToken  = enc.encryptField(instance.accessToken);
  if (instance.changed('refreshToken') && instance.refreshToken) instance.refreshToken = enc.encryptField(instance.refreshToken);
});

WebexSync.addHook('afterFind', async (result) => {
  if (!result) return;
  const enc = await getEncryption();
  const decrypt = (inst) => {
    if (inst.accessToken)  inst.accessToken  = enc.decryptField(inst.accessToken);
    if (inst.refreshToken) inst.refreshToken = enc.decryptField(inst.refreshToken);
  };
  Array.isArray(result) ? result.forEach(decrypt) : decrypt(result);
});

export default WebexSync;