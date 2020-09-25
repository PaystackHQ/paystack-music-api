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
      const tracks = await spotify.findTracksWithoutAnalytics();
      if (!tracks.length) return res.status(200).send({ status: true, message: 'All tracks have their analytics set' });
      await spotify.performAuthentication();
      spotify.getAudioAnalyticsForTracks(tracks);
      return successResponse(res, 200, 'Populating analytics...');
    } catch (err) {
      return serverErrorResponse(res, err);
    }
  },

  populateTrackPreviews: async (req, res) => {
    try {
      const tracks = await spotify.findTracksWithoutPreview();
      if (!tracks.length) return res.status(200).send({ status: true, message: 'All tracks have their previews set' });
      await spotify.performAuthentication();

      await spotify.getPreviewUrlForTracks(tracks);
      return successResponse(res, 200, 'Previews have been populated');
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
