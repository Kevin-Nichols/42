const {sqlForPartialUpdate} = require("./sql");

describe("sqlForPartialUpdate", function() {
  test("Test with one item", function() {
    const res = sqlForPartialUpdate({field1: "value1"}, {field1: "field1", field2: "field2"});
    expect(res).toEqual(
      {
        setCols:"\"field1\"=$1", 
        values: ["value1"]
      });
  });

  test("Test with two items", function() {
    const res = sqlForPartialUpdate({field1: "value1", field2: "value2"}, {field2: "field2"});
    expect(res).toEqual(
      {
        setCols: "\"field1\"=$1, \"field2\"=$2", 
        Values: ["value1", "value2"]
      });
  });
});