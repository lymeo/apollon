const fs = require('fs');
const path = require('path');
const logger = require('../logger');

// Reading schema file
let typeDefs = '';
logger.debug('Created specification typeDefs schema');

typeDefs +=
    '\n' +
    fs.readFileSync(path.join(__dirname, '../../schema/directives.gql'), {
        encoding: 'utf8'
    });
logger.debug('Added directives to specification schema');

typeDefs +=
    '\n' +
    fs.readFileSync(path.join(__dirname, '../../schema/types.gql'), {
        encoding: 'utf8'
    });
logger.debug('Added types to specification schema');

typeDefs +=
    '\n' +
    fs.readFileSync(path.join(__dirname, '../../schema/queries.gql'), {
        encoding: 'utf8'
    });
logger.debug('Added types to queries schema');

typeDefs +=
    '\n' +
    fs.readFileSync(path.join(__dirname, '../../schema/mutations.gql'), {
        encoding: 'utf8'
    });
logger.debug('Added types to mutations schema');

typeDefs +=
    '\n' +
    fs.readFileSync(path.join(__dirname, '../../schema/inputs.gql'), {
        encoding: 'utf8'
    });
logger.debug('Added inputs to mutations schema');
typeDefs += '\n' + fs.readFileSync(path.join(__dirname, '../../schema/subscriptions.gql'), {
    encoding: 'utf8'
});
logger.debug('Added subscriptions to mutations schema');

module.exports = typeDefs;