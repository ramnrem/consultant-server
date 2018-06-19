var log = require('../libs/log')(module);
var config = require('../config');
var connect = require('connect'); // npm i connect
var async = require('async');
var cookie = require('cookie');   // npm i cookie
var sessionStore = require('../libs/sessionStore');
var HttpError = require('../error').HttpError;
var User = require('../models/user').User;
var Tag = require('../models/tag').Tag;
var cookieParser = require('cookie-parser');


function loadSession(sid, callback) {

  sessionStore.load(sid, function(err, session) {
    if (arguments.length == 0) {
      return callback(null, null);
    } else {
      return callback(null, session);
    }
  });

}

function loadUser(session, callback) {

  if (!session.user) {
    log.debug("Session %s is anonymous", session.id);
    return callback(null, null);
  }

  log.debug("retrieving user ", session.user);

  User.findById(session.user, function(err, user) {
    if (err) return callback(err);

    if (!user) {
      return callback(null, null);
    }
    log.debug("user findbyId result: " + user);
    callback(null, user);
  });

}

module.exports = function(server) {
  var io = require('socket.io').listen(server);
  io.set('origins', 'localhost:*');

  io.set('authorization', function(handshake, callback) {
    async.waterfall([
      function(callback) {
        handshake.cookies = cookie.parse(handshake.headers.cookie || '');
        var sidCookie = handshake.cookies[config.get('session:key')];
        var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));
        loadSession(sid, callback);
      },
      function(session, callback) {

        if (!session) {
          callback(new HttpError(401, "No session"));
        }

        handshake.session = session;
        loadUser(session, callback);
      },
      function(user, callback) {
        if (!user) {
          callback(new HttpError(403, "Anonymous session may not connect"));
        }
        handshake.user = user;
        callback(null);
      }

    ], function(err) {
      if (!err) {
        return callback(null, true);
      }

      if (err instanceof HttpError) {
        return callback(null, false);
      }
      callback(err);
    });
    
    
  });

  io.sockets.on('session:reload', function(sid) {
    var clients = io.sockets.clients();
    clients.forEach(function(client) {
      if (client.handshake.session.id != sid) return;

      loadSession(sid, function(err, session) {
        if (err) {
          client.emit("error", "server error");
          client.disconnect();
          return;
        }

        if (!session) {
          client.emit("logout");
          client.disconnect();
          return;
        }
        client.handshake.session = session;
      });
        
    });

  });

  var socket_clients = [];
  var chats = [];

  io.sockets.on('connection', function(socket) {

    var username = socket.request.user.username;
    var s_id = socket.id;
    var e = {
      idd: s_id,
      username: username,
      tags:['test']
    };

    socket.broadcast.emit('join', username);

    
    async.waterfall([
      function(callback) {
        Tag.find({username: username}, callback);
      },
      function(tagss, callback) {
        for(let i=0; i<tagss.length; i++){
          e.tags[i] = tagss[i].title;
        }
        callback(null)

      },function(err){
        socket_clients.push(e);
      }])
    
    

    socket.on('question', function(text, cb) {

      chats = [];
      console.log(chats[0])
      let q_text = text;
      let punctuationless = q_text.replace(/[.,\/#!$?%\^&\*;:{}=\-_`~()]/g,"");
      let finalString = punctuationless.replace(/\s{2,}/g," ");
      let arr = finalString.split(' ');

      let names = [];

      for(let i=0; i<arr.length; i++){
        async.waterfall([
          function(callback) {
            Tag.find({title: arr[i]}, callback);
          },
          function(tagss, callback) {
            if(tagss){
              for(let j=0; j<tagss.length; j++){
                names[i] = tagss[j].username;
              }
              callback(null)
            }
          },function(err){
            if(err){
              for(let i = 0; i<socket_clients.length; i++){
                for(let j = 0; j<names.length; j++){
                  if(socket_clients[i].username == names[j]){
                    console.log("Айди "+socket_clients[i].idd +" Имя "+socket_clients[i].username);
                    socket.broadcast.to(socket_clients[i].idd).emit('message', username, text);
                    chats.push(socket_clients[i].idd)
                  }
                }
                if(socket_clients[i].username == username){
                  chats.push(socket_clients[i].idd)
                  console.log("запросил: Айди "+socket_clients[i].idd +" Имя "+socket_clients[i].username)
                }
              }
            }
        }])
      }

      cb && cb();
    });

    socket.on('message', function(text, cb) {
      if(chats[0] != undefined){
        for(let i = 0; i< chats.length; i++){
          socket.broadcast.to(chats[i]).emit('message', username, text);
        }
      } else socket.broadcast.emit('message', username, text);
      cb && cb();
    });

    socket.on('disconnect', function() {
      socket.broadcast.emit('leave', username);
      for(let i=0; i<socket_clients.length; i++){
        if(socket_clients[i].username == username)
          socket_clients.splice(i, 1);
      }
    });

  });
  return io;
};