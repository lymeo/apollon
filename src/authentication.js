/**
 * function returning authentication middleware
 * @param {Object} connectors The different connectors specified in the connectors folder
 * 
 * @returns {async function} Asynchronous authentication middleware
 */
function authenticator(connectors) {
  return async function authenticate(request, accept, reject) {
    return accept();
  };
}

module.exports = authenticator;
