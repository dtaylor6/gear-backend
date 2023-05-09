const axios = require('axios')
const discogsRouter = require('express').Router()
const config = require('../utils/config')


const discogs_client_id = config.DISCOGS_CLIENT_ID
const discogs_secret = config.DISCOGS_SECRET

const REQUEST_HEADERS = {
  'Authorization': `Discogs key=${discogs_client_id}, secret=${discogs_secret}`,
  'User-Agent': 'Dedeluxify/1.0'
}

discogsRouter.get('/search', (req, res, next) => {
  const query = req.query.q
  axios
    .get(
      'https://api.discogs.com/database/search', {
        params: {
          q: query,
          type: 'master',
        },
        headers: REQUEST_HEADERS
      }
    )
    .then((response) => {
      res.status(200).json(response.data)
    })
    .catch ((error) => {
      next(error)
    })
})

module.exports = discogsRouter