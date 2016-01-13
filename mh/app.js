var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var app = express();
//var server = app.listen(3000, '0.0.0.0', function(){
var server = app.listen(3000, 'localhost', function(){
  console.log("server running on localhost 3000");
});

var io = require('socket.io').listen(server);
//連想配列
var userHash = {}; //socketidをkeyにしたユーザ名
var roomNameHash = {};
var userRoomHash = {};//socketidをkeyにしたchatroom
var roomMesHash = {};
var roomStateHash = {};//チャットルームの人数
var roomkeyHash = {};
// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');
app.set('view engine', 'jade')
app.locals.pretty = true;
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
// loginname と soketidを紐づける
//io.on ?
io.sockets.on('connection', function(socket){
  console.log('connection socket id : ' + socket.id);
  //部屋を立てるイベント
  socket.on('roomMaking',function(data){
    //部屋に参加してる場合は弾く
    for(var key in userHash){
      if(key == socket.id){
        io.sockets.to(socket.id).emit("result", {result:0, msg:"すでに部屋に参加しています"});
        return;
      }
    }
    for(var key in roomkeyHash){
      if(roomkeyHash[key] == data.key){
        socket.emit("result", {result:0, msg:"そのパスワードはすでに使われています"});
        return;
      }
    }
    //ただいまの時刻
    var now = new Date().toLocaleTimeString();
    var username = data.username;
    var roomname = data.roomname;
    var mes = data.mes;
    var key = data.key;
    var tabledata = [now,roomname,mes,username,'1/4', socket.id];
    console.log("name: " + username);
    console.log("roomname: " + roomname);
    console.log("message: " + mes);
    console.log("key: " + key);
    //roomname and message are checked if space and whitespace
    if( (!roomname.match(/\S/g) || (!mes.match(/\S/g))) ){
      io.sockets.to(socket.id).emit("result", {result:0, msg:"未入力値があります"});
      console.log("format error");
      return;
    }
    // 数字四文字以外は弾く
    if(!key.match(/\d{4}/)){
      io.sockets.to(socket.id).emit("result", {result:0, msg:"key値が不正です"});
      console.log("key value error");
      return;
    }
    userHash[socket.id] = username;
    roomNameHash[socket.id] = roomname;
    roomMesHash[socket.id] = mes;
    roomkeyHash[socket.id] = key;
    roomStateHash[socket.id] = 1;
    socket.emit("result", {result:2, tabledata:tabledata});// 自分にも送信
    socket.broadcast.emit("result", {result:1, tabledata:tabledata});
    socket.join(roomname);

  }) // --roomMaking --
  // roomkeycheck
  socket.on('Checker', function(id){
    socket.emit("passCheck", {rkh:roomkeyHash, id:id});
  });
  socket.on("msg_from_client", function(data){
    socket.emit("msg_from_server", {name:data.name, msg:data.msg});// 渡された先でオブジェクトがつくられる
    socket.broadcast.to(data.room).emit("msg_from_server", {name:data.name, msg:data.msg});
  });

  socket.on('entering', function(data){
    var count = 0;
    var hash = io.sockets.adapter.rooms[data.roomname];// room人数
    for(var i in hash){
      count +=1;
    }
    data.count = count;
    socket.emit('noti', {name: data.name, count: data.count, room: data.roomname});
  })
  socket.on('leave', function(data){
    // var kuso = socket.sockets.clients(data.roomname);
    console.log(io.socket.clients(data.room));
  })
  socket.on("Enter", function(val){
    //パスワードからsocket.id get
    var flg = 0;
    for(var key in roomkeyHash){
      　if(roomkeyHash[key] == val.key){
        var id = key;
        flg = 1;
      }
    }
    if(!flg){
      socket.emit("result", {result:0, msg:"fattal error"});
      //eturn;
    }
    //socket.id からへやめいをget
    flg = 0;
    for(key in roomNameHash){
      if(key == id){
        var roomname = roomNameHash[key];
        flg = 1;
      }
    }
    if(!flg){
      socket.emit("result", {result:0, msg:"fattal error"});
      //return;
    }
    //部屋人数をチェック
    flg=0;
    for(key in roomStateHash){
      if(key == id && roomStateHash[key] <= 4){
        console.log(roomStateHash[key]);
        roomStateHash[key]++;
        flg=1;
      }
    }
    if(!flg){
      socket.emit("result", {result:0, msg:"へやがまんいんです"});
      //return;
    }
    flg=0;
    socket.join(roomname);
    socket.emit("result", {result:3, name:roomname});
    // console.log("name: " + val.name + " key :" + val.key + " 入りたいルームを作った人:" + id);
    console.log("roomname : " + roomname);
  })
  socket.on('disconnect', function(){// 切断した時に発火　
    console.log('user disconnect by:' + socket.id);
    socket.broadcast.emit("delete", {id:socket.id});
    delete userHash[socket.id];
    delete roomNameHash[socket.id];
    delete roomMesHash[socket.id];
    delete roomkeyHash[socket.id];
    delete roomStateHash[socket.id];
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
