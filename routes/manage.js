var redis = require("redis");


exports.list = function(req,res){
    var server = req.param("server");
    var port = req.param("port");
    var keys = null;

    res.cookie("port", port);
    res.cookie("server", server);

    var client = redis.createClient(port, server);

    client.dbsize(function(err, count){

        client.quit();

        res.render('manage', {
            title: 'Easy Redis Console',
            server: server,
            port: port,
            count:count,
            keys: null
        });
    });


};

exports.search = function(req, res){
    var keyword = req.param("keyword");
    var server = req.cookies["server"];
    var port = req.cookies["port"];

    if(keyword != null){
        var client = redis.createClient(port, server);

        client.keys(keyword, function(err, keywords){

            client.quit();

            res.render('manage', {
                title: 'Search - Easy Redis Console',
                server: server,
                port: port,
                keys: keywords,
                count: keywords != null ? keywords.length : 0
            });

        });
    }
}

exports.random = function(req, res){
    var server = req.cookies["server"];
    var port = req.cookies["port"];
    var keys = new Array();
    var count = 0;

    var client = redis.createClient(port, server);

    client.on("ready", function(){
        for(var i=0;i<100;i++){

            client.randomkey(function(err, key){

                client.quit();

                if(key != null)
                    keys.push(key);

                if(count == 99){

                    res.render("manage", {
                        title : "Get 100 random keys - Easy Redis Console",
                        server : server,
                        port : port,
                        keys : keys,
                        count: keys.length
                    });
                }

                count ++;
            });
        }
    });


}

exports.show = function(req,res){
    var server = req.cookies["server"];
    var port = req.cookies["port"];
    var key = req.param("key");

    var client = redis.createClient(port, server);

    client.type(key, function(err, type){
       if(type == "string"){

           client.get(req.param("key"), function(err, info){
               res.render("key",{
                   title:"Show item value",
                   key: req.param("key"),
                   value: info
               });

               client.quit();
           });
       }
        else if(type == "list"){
           client.llen(key, function(err, count){
               if(count > 0){
                   client.lrange(key, 0, count, function(err, list){
                        res.render("list", {
                            title: "Show list data",
                            key : key,
                            count : count,
                            list : list
                        });

                       client.quit();
                   })
               }

           });
       }
        else if(type == "set"){

       }
        else if(type == "zset"){

       }
        else if(type == "hash"){

       }
    });


}

exports.remove = function(req, res){
    var client = getClient(req);
    var server = req.cookies["server"];
    var port = req.cookies["port"];
    client.del(req.param("key"), function(err, info){

        client.quit();
        res.redirect("/manage/" + server + "/" + port);
    });
}

exports.flushAll = function(req, res){
    var client = getClient(req);

    client.flushall(function(err,info){
        client.quit();
        res.redirect("/manage/" + req.cookies["server"] + "/" + req.cookies["port"]);
    });
}

exports.shutdown = function(req, res){
    var client = getClient(req);

    client.shutdown(function(err, info){
        client.quit();
        res.redirect("/");
    })
}

exports.listRemove = function(req, res){
    var client = getClient(req);
    var key = req.param("key");
    var index = req.param("index");
    client.lrem(key, index, function(err, info){
        client.llen(key, function(err, count){
            if(count > 0){
                client.lrange(key, 0, count, function(err, list){

                    client.quit();

                    res.render("list", {
                        title: "Show list data",
                        key : key,
                        count : count,
                        list : list
                    });
                })
            }

        });
    });
}

function getClient(req){
    var server = req.cookies["server"];
    var port = req.cookies["port"];

    return redis.createClient(port, server);
}