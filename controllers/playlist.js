const spotify = require('../helpers/spotify');
const errorResponse = require('../responses/errorResponse');

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
      return errorResponse(res, err);
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
      return errorResponse(res, err);
    }
  },
};
