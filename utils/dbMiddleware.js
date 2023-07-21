import axios from 'axios';

import { user, album_preference } from '../models/index.js';
import { getAlbumTracks } from '../utils/spotifyUtils.js';

const getSpotifyUser = async (req, res, next) => {
  const auth = req.headers['authorization'];

  if (auth === '') {
    return res.status(403).send('No Spotify auth token given in header');
  }
  else if (!auth.startsWith('Bearer ')) {
    return res.status(403).send('Malformatted Spotify auth token given in header. Must be of format: Bearer <token>');
  }
  else {
    req.token = auth;
  }

  try {
    const spotifyResponse = await axios
      .get(
        'https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': req.token,
          }
        }
      );

    req.spotifyUser = spotifyResponse.data;
  }
  catch(error) {
    next(error);
  }

  next();
};

const findUser = async (req, res, next) => {
  const spotifyId = req.spotifyUser.id;
  if (!spotifyId) {
    return res.status(401).send('The server encountered an error authenticating through Spotify');
  }

  try {
    req.user = await user.findOne({ where: { spotify_id: spotifyId } });
  }
  catch(error) {
    next(error);
  }

  next();
};

const findOrCreateUser = async (req, res, next) => {
  const spotifyId = req.spotifyUser.id;
  const displayName = req.spotifyUser.display_name;
  if (!spotifyId) {
    return res.status(401).send('The server encountered an error authenticating through Spotify');
  }

  try {
    [req.user] = await user.findOrCreate({
      where: { spotify_id: spotifyId },
      defaults: {
        spotify_id: spotifyId,
        display_name: displayName
      }
    });
  }
  catch(error) {
    next(error);
  }

  next();
};

const getAlbumPreference = async (albumId, userId) => {
  try {
    const preference = await album_preference.findOne({
      where: {
        album_id: albumId,
        user_id: userId
      }
    });

    return Promise.resolve(preference);
  }
  catch(error) {
    return Promise.reject(error);
  }
};

const findDbPreference = async (albumId, userId, spotifyToken) => {
  try {
    // Execute both async functions in parallel
    const [spotifyTracks, preference] = await Promise
      .all([
        getAlbumTracks(albumId, spotifyToken),
        getAlbumPreference(albumId, userId)
      ]);

    if (
      preference
      && Object.hasOwn(preference, 'dataValues')
      && Object.hasOwn(preference.dataValues, 'track_preferences')
    ) {
      const tracks = spotifyTracks.map((track, index) => {
        return ({
          name: track.name,
          uri: track.uri,
          play: preference.dataValues.track_preferences[index] === '1' ? true : false
        });
      });

      return Promise.resolve({ preferencesExist: true, tracks });
    }
    else {
      const tracks = spotifyTracks.map((track) => {
        return ({
          name: track.name,
          uri: track.uri,
          play: true
        });
      });

      return Promise.resolve({ preferencesExist: false, tracks });
    }
  }
  catch(error) {
    return Promise.reject(error);
  }
};

const deleteDbPreference = async (albumId, userId) => {
  try {
    await album_preference.destroy({
      where: {
        album_id: albumId,
        user_id: userId
      }
    });

    return Promise.resolve();
  }
  catch(error) {
    return Promise.reject(error);
  }
};

export {
  getSpotifyUser,
  findUser,
  findOrCreateUser,
  getAlbumPreference,
  findDbPreference,
  deleteDbPreference
};
