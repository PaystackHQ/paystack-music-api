const ChanceTheRapper = require('chance');
const sinon = require('sinon');
const request = require('supertest');
require('should');

const chance = new ChanceTheRapper();
const app = require('../../../server');
const spotifyHelper = require('../../../helpers/spotify');
const triggerRequestFactory = require('../../factories/triggerrequestdata');

describe('IndexController', () => {
  let sandbox;

  const createSandbox = () => {
    sandbox = sinon.createSandbox();
  };

  const restoreSandbox = () => {
    sandbox.restore();
  };

  beforeEach('Setup', () => {
    createSandbox();
  });
  afterEach('Shift + Delete', () => {
    restoreSandbox();
  });
  describe('callback', () => {
    beforeEach(() => {
      sandbox.stub(spotifyHelper, 'performAuthentication');
    });
    it('should fail with a validation error if "code" query is not provided', async () => {
      const response = await request(app)
        .get('/callback')
        .expect(400);
      response.body.should.be.a.Object().with.properties({
        status: false,
        message: '"code" is required',
      });
    });
    it('should return an HTML response when callback is called with "code"', async () => {
      const response = await request(app)
        .get('/callback')
        .query({ code: chance.string() })
        .expect(200);
      response.text.should.be.a.String();
      response.text.includes('{ year (yyyy), month (mm), day (dd) }').should.be.True();
    });
  });

  describe('trigger', () => {
    it('should fail with a validation error if required parameters are not provided', async () => {
      const triggerRequestData = triggerRequestFactory.getRecord();
      delete triggerRequestData.year;
      const response = await request(app)
        .post('/trigger')
        .send(triggerRequestData)
        .expect(400);
      response.body.should.be.an.Object().with.properties({
        status: false,
        message: '"year" is required',
      });
    });
    it('should fail with a validation error if required parameters are invalid', async () => {
      const triggerRequestData = { ...triggerRequestFactory.getRecord(), month: 13 };
      const response = await request(app)
        .post('/trigger')
        .send(triggerRequestData)
        .expect(400);
      response.body.should.be.an.Object().with.properties({
        status: false,
        message: '"month" must be less than or equal to 12',
      });
    });
  });
});
