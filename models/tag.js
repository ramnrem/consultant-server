var mongoose = require('../libs/mongoose'),
  Schema = mongoose.Schema;

var schema = new Schema({
  username: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  }
});

exports.Tag = mongoose.model('Tag', schema);