/**
 * Converts a Mongoose lean document into a serializable plain JavaScript object.
 *
 * @param {Object} leanDocument - The Mongoose lean document to be converted.
 * @returns {Object} A plain JavaScript object that is a serializable representation of the input document.
 */

export function convertToSerializeableObject(leanDocument) {
  if (leanDocument == null || typeof leanDocument !== 'object') {
    return leanDocument;
  }

  for (const key of Object.keys(leanDocument)) {
    const value = leanDocument[key];
    if (
      value != null &&
      typeof value === 'object' &&
      typeof value.toJSON === 'function' &&
      typeof value.toString === 'function'
    ) {
      leanDocument[key] = value.toString();
    }
  }
  return leanDocument;
}
