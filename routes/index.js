var redis = require("redis");
var setting = require("modules/setting");

/*
 * GET home page.
 */
exports.index = function(req, res) {

    getServerInfo(function(servers){
        res.render('index', {  title:"Easy Redis Console", servers:servers});
    });

};


function getServerInfo(callback){
    var servers = new Array();

    var count = 0;

    setting.redis_server.forEach(function(server, sindex){

        setting.redis_ports.forEach(function(port, index){

            var client = redis.createClient(port, server);

            client.on("error", function(err){
                console.log(Date.now() + " " + err);
                count++;

                client.quit();

                if(count == setting.redis_ports.length * setting.redis_server.length)
                    callback(servers);
            });


            client.on("ready", function(){

                client.multi()
                    .info("server")
                    .dbsize()
                    .exec(function(err, result){

                        count++;

                        servers.push({ ip: server, port: port, info:result[0], dbSize: result[1] });

                        client.quit();

                        if(count == setting.redis_ports.length * setting.redis_server.length)
                            callback(servers);
                    });

                console.log("connected to the server: "+ server + ":" + port);
            });

            console.log("i=" + index);
        });
    });

}

