import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const WebexSync = sequelize.define(
  'WebexSync',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      onDelete: 'CASCADE'
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'AES-256-GCM encrypted'
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'AES-256-GCM encrypted'
    },
    token_type: {
      type: DataTypes.STRING,
      defaultValue: 'Bearer'
    },
    expires_in: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scope: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    webex_user_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    webex_user_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    webex_display_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_sync_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sync_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'webex_sync',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['user_id'] },
      { fields: ['webex_user_id'] },
      { fields: ['webex_user_email'] },
      { fields: ['is_active'] },
      { fields: ['sync_enabled'] }
    ]
  }
);

async function getEncryption() {
  const { default: enc } = await import('../../services/encryption.service.js');
  return enc;
}

WebexSync.addHook('beforeCreate', async instance => {
  const enc = await getEncryption();
  if (instance.access_token) instance.access_token = enc.encryptField(instance.access_token);
  if (instance.refresh_token) instance.refresh_token = enc.encryptField(instance.refresh_token);
});

WebexSync.addHook('beforeUpdate', async instance => {
  const enc = await getEncryption();
  if (instance.changed('access_token') && instance.access_token)
    instance.access_token = enc.encryptField(instance.access_token);
  if (instance.changed('refresh_token') && instance.refresh_token)
    instance.refresh_token = enc.encryptField(instance.refresh_token);
});

WebexSync.addHook('afterFind', async result => {
  if (!result) return;
  const enc = await getEncryption();
  const decrypt = inst => {
    if (inst.access_token) inst.access_token = enc.decryptField(inst.access_token);
    if (inst.refresh_token) inst.refresh_token = enc.decryptField(inst.refresh_token);
  };
  Array.isArray(result) ? result.forEach(decrypt) : decrypt(result);
});

export default WebexSync;
