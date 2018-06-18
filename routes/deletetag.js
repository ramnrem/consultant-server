var Tag = require('../models/tag').Tag;
var async = require('async');
var HttpError = require('../error').HttpError;

exports.post = function(req, res, next) {

	var username = req.user.username;
	var tag = req.body.tag;

	async.waterfall([
    function(callback) {
     Tag.remove({username: username, title: tag},callback);
    },
    function(result, callback) {
	  if(result)
		callback(null);
    }
  ], function(err) {
    res.send();
  });
};