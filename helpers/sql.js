const { BadRequestError } = require("../expressError");

/**
 * Helper for making specific updates to queries.
 * 
 * A function that calls this helper uses it to make the SET statement of an SQL UPDATE.
 * 
 * @param dataToUpdate {object} {title1: value, title2: value, ...}
 * 
 * @param jsToSql {object} it maps Js data fields to database columns -
 * Such as {exampleData: "example_data"}
 * 
 * @returns {Object} {setCols, dataToUpdate}
 * 
 * @example {firstName: 'Aliya', age: 32} => 
 * { setCols: '"first_name"=$1, "age"=$2',
 *   values: ['Aliya', 32]
 * }
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
