const mongoose = require("mongoose");

// Function to get or create a model with a dynamic schema
const getModel = (modelName, schemaDefinition) => {
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  const schema = new mongoose.Schema(schemaDefinition, { strict: false });
  return mongoose.model(modelName, schema);
};

module.exports = getModel;
