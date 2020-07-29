/**
 * Returns an array with arrays of the given size.
 *
 * @param myArray {Array} Array to split
 * @param chunkSize {number} Size of every group
 */
function chunkArray(myArray, chunkSize) {
  const results = [];

  while (myArray.length) {
    results.push(myArray.splice(0, chunkSize));
  }

  return results;
}

module.exports = {
  chunkArray,
};
