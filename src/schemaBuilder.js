const fs = require("fs");
const glob = require("glob");
const logger = require("./logger");

module.exports = function(config) {
  let schemaDirectives = {};
  glob
    .sync(config.source.directives)
    .forEach(filepath => {
      let filename = filepath.split("/").slice(-1)[0].split('.')[0];
      schemaDirectives[filename] = require(filepath);
    });
  logger.trace("Included directive implementations");

  logger.trace("Created specification typeDefs schema");

  let queryContents = [];
  let mutationContents = [];
  let subscriptionContents = [];
  let otherContents = [];
  // let queryReg = /type\s*[q|Q][u|U][e|E][r|R][y|Y]\s*{/g;
  // let mutationReg = /type\s*[m|M][u|U][t|T][a|A][t|T][i|I][o|O][n|N]\s*{/g;
  // let subscriptionReg = /type\s*[s|S][u|U][b|B][s|S][c|C][r|R][i|I][p|P][t|T][i|I][o|O][n|N]\s*{/g;
  
    // type\s*[q|Q][u|U][e|E][r|R][y|Y]\s*{
  // let getType = content => {
  //   if(queryReg.test(content)) {
  //   }else if(mutationReg.test(content)){
  //   }else if(subscriptionReg.test(content)){
  //   }
  //   return '_';

  // }

  // let getFormatedContent = (content, type) => {
  //   if(type == 'query' || (!type && queryReg.test(content))) {
  //     return content.replace(queryReg, '').replace('}', '');
  //   }else if(type == 'mutation' || (!type && mutationReg.test(content))){
  //     return content.replace(mutationReg, '').replace('}', '');
  //   }else if(type == 'subscription' || (!type && subscriptionReg.test(content))){
  //     return content.replace(subscriptionReg, '').replace('}', '');
  //   }
  //   return content;
  // }
  
  glob
    .sync(config.source.schema)
    .forEach(filepath => {
      let fileContent = fs.readFileSync(filepath, { encoding: "utf8" })
      let formatedFilepath = filepath.toLowerCase();
      // let type = getType(fileContent);
      // let formatedContent = getFormatedContent(fileContent, type);
      if(formatedFilepath.includes('query')){
        queryContents.push(fileContent)
      }else if(formatedFilepath.includes('mutation')){
        mutationContents.push(fileContent)
      }else if(formatedFilepath.includes('subscription')){
        subscriptionContents.push(fileContent);
      } else {

        let currentType ='_';
        fileContent.split('\n').map(e => e.trim()).filter(e => e.length).forEach(p_line => {
          let line = p_line.toLowerCase();
          if(line.includes('{') && ['query','mutation', 'subscription'].some(e => line.includes(e))){
          
            if(line.includes('query')){
              currentType = 'query';
            }else if(line.includes('mutation')){
              currentType = 'mutation';
  
            }else if(line.includes('subscription')) {
              currentType = 'subscription';
            }
          } else if(currentType != '_' && line.startsWith('}')){
            currentType = "_";
          } else {
            if(currentType == 'query'){
              queryContents.push(p_line)
            } else if(currentType == 'mutation'){
              mutationContents.push(p_line)
            } else if(currentType == 'subscription'){
              subscriptionContents.push(p_line);
            } else {
              otherContents.push(p_line);
  
            }
          } 
      })
    }

      // if(formatedFilepath.includes('query') || type == 'query'){
      //   queryContents.push(formatedContent);
      // }else if(formatedFilepath.includes('mutation') || type == 'mutation') {
      //   mutationContents.push(formatedContent);
      // }else if(formatedFilepath.includes('subscription') || type == 'subscription') {
      //   subscriptionContents.push(formatedContent);
      // } else {
      //   otherContents.push(formatedContent);
      // }
    })

    let typeDefs = [];

    if(queryContents.length > 0) typeDefs.push('type Query {\n'+ queryContents.join('\n')+'\n}');
    if(mutationContents.length > 0) typeDefs.push('type Mutation {\n'+ mutationContents.join('\n')+'\n}');
    if(subscriptionContents.length > 0) typeDefs.push('type Subscription {\n'+ subscriptionContents.join('\n')+'\n}');
    if(otherContents.length > 0) typeDefs.push('\n'+ otherContents.join('\n'));
    typeDefs = typeDefs.join("\n");
    

  logger.trace("Created the schema for the resolvers from the types file");

  let schema = { Query: {}, Mutation: {}, Subscription: {} };
  logger.trace(
    "Added the Query, Mutation and Subscription to the executable schema"
  );

  glob.sync(config.source.types).forEach(filepath => {
    let type = require(filepath);
    if (type && type.name) {
      schema[type.name] = type;
    }
  });

  glob.sync(config.source.resolvers).forEach(filepath => {
    require(filepath)(schema, {
      //Helpers
      SimpleSubscription: function(sub) {
        schema.Subscription[sub] = {
          subscribe: (_, __, { pubsub }) => {
            return pubsub.asyncIterator(sub);
          }
        };
      },
      fs: require("./helpers/fs")
    });
  });

  if (Object.keys(schema.Query).length == 0) {
    delete schema.Query;
    logger.trace("Removed the empty query field from executable schema");
  }
  if (Object.keys(schema.Mutation).length == 0) {
    delete schema.Mutation;
    logger.trace("Removed the empty mutation field from executable schema");
  }
  if (Object.keys(schema.Subscription).length == 0) {
    delete schema.Subscription;
    logger.trace("Removed the empty subscription field from executable schema");
  }


  return {
    resolvers: schema,
    typeDefs,
    schemaDirectives
  };
};
