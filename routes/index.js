var redis = require("redis");
var setting = require("modules/setting");

/*
 * GET home page.
 */
exports.index = function(req, res) {

    req.session.server = setting.redis_server;

    getServerInfo(function(servers){
        res.render('index', {  title:"Easy Redis Console", servers:servers});
    });

};


function getServerInfo(callback){
    var servers = new Array();

    var count = 0;
    setting.redis_ports.forEach(function(port, index){

        var client = redis.createClient(port, setting.redis_server);

        client.on("error", function(err){
            console.log(Date.now() + " " + err);
            count++;

            if(index == setting.redis_ports.length -1)
                callback(servers);
        });


        client.on("ready", function(){

            client.multi()
                .info("server")
                .dbsize()
                .exec(function(err, result){

                    servers.push({ ip: setting.redis_server, port: port, info:result[0], dbSize: result[1] });

                    client.quit();

                    if(count == setting.redis_ports.length -1)
                        callback(servers);

                    count++;
                });

            console.log("connected to the server: "+ setting.redis_server + ":" + port);
        });

        console.log("i=" + index);
    });
}

