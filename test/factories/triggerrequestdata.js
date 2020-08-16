const Chance = require('chance');

const chance = new Chance();
function getRecord() {
  return {
    day: chance.integer({ min: 1, max: 31 }),
    month: chance.integer({ min: 1, max: 12 }),
    year: chance.integer(),
  };
}

module.exports = {
  getRecord,
};
