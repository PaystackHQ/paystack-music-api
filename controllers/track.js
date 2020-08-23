const spotify = require('../helpers/spotify');
const errorResponse = require('../responses/errorResponse');

module.exports = {

  getTrackAudioFeatures: async (req, res) => {
    try {
      const { id: trackId } = req.params;

      await spotify.performAuthentication();
      const trackFeatures = await spotify.getAudioFeaturesForTrack(trackId);
      return res.status(200).send({
        status: true,
        data: trackFeatures,
      });
    } catch (err) {
      return errorResponse(res, err);
    }
  },

  getTrackData: async (req, res) => {
    try {
      const { track_ids: ids } = req.body;

      const result = await spotify.performAuthentication();
      if (result && result.code === 401) {
        return res.status(401).send({ message: result.message });
      }

      const data = await spotify.getTrackData(ids);

      return res.status(200).send({
        status: true,
        data,
      });
    } catch (err) {
      return errorResponse(res, err);
    }
  },
};
