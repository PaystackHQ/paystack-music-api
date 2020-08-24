const spotify = require('../helpers/spotify');
const {
  successResponse,
  clientErrorResponse,
  serverErrorResponse,
} = require('../responses');

module.exports = {

  /**
   * Retrieve a single playlist
   */
  getPlaylistByID: async (req, res) => {
    try {
      const { id } = req.params;

      const playlist = await spotify.findPlaylist(id);
      if (!playlist) {
        return clientErrorResponse(res, 404, 'Playlist not found');
      }
      return successResponse(res, 200, 'Playlist retrieved', playlist);
    } catch (err) {
      return serverErrorResponse(res, err);
    }
  },

  /**
   * Retrieve all playlists
   */
  getAllPlaylists: async (req, res) => {
    try {
      const playlists = await spotify.findAllPlaylists();
      return successResponse(res, 200, 'Playlists retrieved', playlists);
    } catch (err) {
      return serverErrorResponse(res, err);
    }
  },
};
