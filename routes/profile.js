var Tag = require('../models/tag').Tag;
var async = require('async');
var HttpError = require('../error').HttpError;

var username;
var _tags = [];
	

exports.get = function(req, res, next) {
	username = req.user.username;

		async.waterfall([
	    function(callback) {
	    	Tag.find({username: username}, callback);
	    },
	    function(tags, callback) {
	    	if(!tags){
	    		next(new HttpError(403, "У Вас нет добавленных тегов"));
	    	} else {
	    		_tags = tags;
		        callback(null, _tags);
	    	}
	    }
	 ], function(err, _tags) {
	    if(err) return next(err);
	    res.render('profile' , {
			user: req.user,
			_tags: _tags
		});
	 });
};


exports.post = function(req, res, next) {

 var title = req.body.tag;


 async.waterfall([
    function(callback) {
    	Tag.findOne({username: username, title: title}, callback);
    },
    function(tag, callback) {
    	if(tag){
    		next(new HttpError(403, "Тег уже добавлен в ваш список"));
    	} else {
    		var tag = new Tag({username: username, title: title});
	        tag.save(function(err) {
	          if(err) return next(err);
	          callback(null, tag);
	        });
    	}
    }
 ], function(err, tag) {
    if(err) return next(err);
    res.send();
 });
 
};