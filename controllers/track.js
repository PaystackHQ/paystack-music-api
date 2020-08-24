const spotify = require('../helpers/spotify');
const {
  successResponse,
  clientErrorResponse,
  serverErrorResponse,
} = require('../responses');

module.exports = {

  /**
   * Get track audio features
   */
  getTrackAudioFeatures: async (req, res) => {
    try {
      const { id: trackId } = req.params;

      await spotify.performAuthentication();
      const trackFeatures = await spotify.getAudioFeaturesForTrack(trackId);

      return successResponse(res, 200, 'Audio features retrieved', trackFeatures);
    } catch (err) {
      return serverErrorResponse(res, err);
    }
  },

  /**
   * Get track data
   */
  getTrackData: async (req, res) => {
    try {
      const { track_ids: ids } = req.body;

      const result = await spotify.performAuthentication();
      if (result && result.code === 401) {
        return clientErrorResponse(res, result.code, result.message);
      }

      const data = await spotify.getTrackData(ids);

      return successResponse(res, 200, 'Track data retrieved', data);
    } catch (err) {
      return serverErrorResponse(res, err);
    }
  },
};
