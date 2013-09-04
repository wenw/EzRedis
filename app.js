
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var manage = require('./routes/manage');
var http = require('http');
var path = require('path');
var partials = require('express-partials');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var app = express();

// all environments

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('0987654321'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

app.get("/manage/:server/:port", manage.list);

app.post("/search", manage.search);
app.get("/search/random", manage.random);

app.get('/show/:key', manage.show);
app.get('/show/:key/:page', manage.show);


app.get('/remove/:key', manage.remove);

app.get("/clear", manage.flushAll);

app.get("/shutdown", manage.shutdown);

app.get("/list/remove/:key/:index", manage.listRemove);


if (cluster.isMaster) {

    var workers = {};
    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        var worker = cluster.fork();
        workers[cluster.pid] = worker;
    }

    cluster.on('exit', function (worker) {

        console.log('worker ' + worker.process.pid + ' died');

        // 当一个工作进程结束时，重启工作进程
        delete workers[worker.pid];
        worker = cluster.fork();
        workers[worker.pid] = worker;

        console.log('Restart worker ' + worker.process.pid);
    });
} else {
    // Workers can share any TCP connection
    // In this case its a HTTP server
    http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
    });
}


/*
//单进程模式，方便调试
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
*/

// 当主进程被终止时，关闭所有工作进程
process.on('SIGTERM', function () {
    for (var pid in workers) {
        process.kill(pid);
    }
    process.exit(0);
});
