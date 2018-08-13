module.exports = async function(context, results) {
    const fs = require('fs');

    let report = {
        quick: {
            passed: 0,
            failed: 0
        },
        suites: []
    }

    for(let fullSuite of results.suites_){
        let suite = {
            description: fullSuite.description,
            specs: []
        };
        for(let fullspec of fullSuite.specs_){
            report.quick.passed += fullspec.results_.passedCount;
            report.quick.failed += fullspec.results_.failedCount;
            suite.specs.push({
                description: fullspec.description,
                results: fullspec.results_
            });
        }
        report.suites.push(suite);
    }


    const stream = fs.createWriteStream("./report.json");
    stream.once('open', function(fd) {
        stream.write(JSON.stringify(report));
        stream.end();
    });

    if(report.quick.failed){
        process.exit(1);
    }
    
    
    context.server.close();
}