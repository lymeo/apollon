/**
 * Function returning the authentication middleware for the graphql endpoint
 * @param {Object} connectors The different connectors you defined in the connectors folder
 * 
 * @returns {async function} Asynchronous middleware function 
 */
function authenticator(connectors) {
  return async function authenticate(request, accept, reject) {
    return accept();
  };
}

module.exports = authenticator;
