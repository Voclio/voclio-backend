import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.orm.js';

const ApiKey = sequelize.define(
  'ApiKey',
  {
    key_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    api_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    provider: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    rate_limit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: 'api_keys',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

async function getEncryption() {
  const { default: enc } = await import('../../services/encryption.service.js');
  return enc;
}

ApiKey.addHook('beforeCreate', async instance => {
  const enc = await getEncryption();
  if (instance.access_token) instance.access_token = enc.encryptField(instance.access_token);
});

ApiKey.addHook('beforeUpdate', async instance => {
  const enc = await getEncryption();
  if (instance.changed('access_token') && instance.access_token) {
    instance.access_token = enc.encryptField(instance.access_token);
  }
});

ApiKey.addHook('afterFind', async result => {
  if (!result) return;
  const enc = await getEncryption();
  const mask = inst => {
    if (inst.access_token) {
      const decrypted = enc.decryptField(inst.access_token);
      inst.setDataValue(
        'access_token',
        decrypted ? `${decrypted.slice(0, 4)}...${decrypted.slice(-4)}` : null
      );
      inst.setDataValue('access_token_masked', true);
    }
  };
  Array.isArray(result) ? result.forEach(mask) : mask(result);
});

export default ApiKey;
