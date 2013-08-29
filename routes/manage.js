var redis = require("redis");


exports.list = function(req,res){
    var server = req.session.server;
    var port = req.param("port");
    var keys = null;

    req.session.port = port;

    res.render('list', {
        title: 'Easy Redis Console',
        server: server,
        port: port,
        keys: null
    });
};

exports.search = function(req, res){
    var keyword = req.param("keyword");
    var server = req.session.server;
    var port = req.session.port;

    if(keyword != null){
        var client = redis.createClient(port, server);

        client.keys(keyword, function(err, keywords){

            client.quit();

            res.render('list', {
                title: 'Search - Easy Redis Console',
                server: server,
                port: port,
                keys: keywords
            });

        });
    }
}

exports.random = function(req, res){
    var server = req.session.server;
    var port = req.session.port;
    var keys = new Array();
    var count = 0;

    var client = redis.createClient(port, server);

    client.on("ready", function(){
        for(var i=0;i<100;i++){

            client.randomkey(function(err, key){

                if(key != null)
                    keys.push(key);

                if(count == 99){
                    res.render("list", {
                        title : "Get 100 random keys - Easy Redis Console",
                        server : server,
                        port : port,
                        keys : keys
                    });
                }

                count ++;
            });
        }
    });


}

exports.show = function(req,res){
    var server = req.session["server"];
    var port = req.session["port"];

    var client = redis.createClient(port, server);
    client.get(req.param("key"), function(err, info){
        res.render("show",{
            title:"Show item value",
            key: req.param("key"),
            value: info
        });
        client.quit();
    });
}

exports.remove = function(req, res){
    var client = getClient(req);
    var port = req.session["port"];
    client.del(req.param("key"), function(err, info){

        client.quit();
        res.redirect("/manage/" + port);
    });
}

function getClient(req){
    var server = req.session["server"];
    var port = req.session["port"];

    return redis.createClient(port, server);
}