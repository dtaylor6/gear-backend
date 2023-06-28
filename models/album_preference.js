import { Model, DataTypes } from 'sequelize';

import { sequelize } from '../utils/db.js';

class album_preference extends Model {}

album_preference.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uri: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: false
  },
  num_tracks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  track_preferences: {
    // Char for each track where '0' = skip and '1' = play
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[01]+$/g,
      len: this.num_tracks
    }
  }
},
{
  sequelize,
  underscored: true,
  timestamps: false,
  modelName: 'album_preference'
});

export default album_preference;
