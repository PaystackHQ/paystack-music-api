const spotify = require('../helpers/spotify');
const logger = require('../helpers/logger');

module.exports = {

  getPlaylistByID: async (req, res) => {
    try {
      const { id } = req.params;

      const playlist = await spotify.findPlaylist(id);
      if (!playlist) {
        return res.status(404).send({
          status: false,
          message: 'Playlist not found',
        });
      }
      return res.status(200).send({
        status: true,
        data: playlist,
      });
    } catch (err) {
      logger.error(err);
      return res.status(500).send({ status: false, message: 'An error occurred' });
    }
  },

  getAllPlaylists: async (req, res) => {
    try {
      const playlists = await spotify.findAllPlaylists();
      return res.status(200).send({
        status: true,
        data: playlists,
      });
    } catch (err) {
      return res.status(500).send({ status: false, message: 'An error occurred' });
    }
  },

  deletePlaylist: async (req, res) => {
    try {
      const playlist = await spotify.deletePlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).send({
          status: false,
          message: 'Playlist not found',
        });
      }
      return res.status(200).send({
        status: true,
        message: `${playlist.name} playlist deleted`,
      });
    } catch (err) {
      return res.status(500).send({ status: false, message: 'An error occurred' });
    }
  },
};
