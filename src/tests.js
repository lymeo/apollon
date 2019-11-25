module.exports = async function tests(context){
    const requireDir = require("require-dir");
    const path = require("path");
    const jasmine = require('jasmine-node');
    const {promisify} = require('util');
    const fs = require('fs');

    const hook = require("../other/report");
    const childLogger = context.logger.child({scope: "tests"});
    
    //Jasmine custom reporter
    const apollonReporter = {
        reportRunnerResults: function(results){
            hook(context, results)
        },
        reportRunnerStarting: () => {},
        reportSpecResults: function(result){
            result.results_.suite = result.env.currentSpec.suite.description;

            childLogger[!result.results_.failedCount ? "info" : "warn"](result.results_, result.env.currentSpec.description)
        },
        reportSpecStarting: function(result){
            childLogger.info({suite: result.env.currentSpec.suite.description}, result.env.currentSpec.description);
        },
        reportSuiteResults: () => {},
    };


    let client = require('graphql-client')({
        url: `http://localhost:${context.PORT}${context.ENDPOINT}`
    })
    function getClient(){
        if(!client.reconfigure){
            client.reconfigure = function(headers){
                client = require('graphql-client')({
                    url: `http://localhost:${context.PORT}${context.ENDPOINT}`,
                    headers
                });
                return getClient();
            };
        }
        if(!client.queryFromFile){
            client.queryFromFile = function(path){
                let query = "";
                let q = promisify(fs.readFile)(path, 'utf8')
                    .then(file => query = file);
                ;
                let queryFromFileRoot = {
                    send(){
                        return q.then(_ => client.query(query, {}));
                    },
                    injectAndSend(data){
                        return q.then(_ => client.query(query, data));
                    }
                }
                return queryFromFileRoot;
            }
        }
        return client;
    }

    let testDir = requireDir(path.join(__dirname, "../tests"));

    let testDirSpecs = [];
    
    let rgx;
    if(process.argv[3]){
        rgx = new RegExp(process.argv[3]);
    }

    let match = false;
    for(let spec in testDir){
        if(!rgx || (rgx && rgx.test(spec.toString()))){
            match = true;
            testDirSpecs.push(testDir[spec](context, getClient));
        }
    }

    if(match){
        await Promise.all(testDirSpecs)
        var jasmineEnv = jasmine.getEnv();
        jasmineEnv.reporter = apollonReporter;
        jasmineEnv.execute();
    } else {
        hook(context, false);
    }

}