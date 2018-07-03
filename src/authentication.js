function authenticator(connectors) {
  return async function authenticate(request, accept, reject) {
    return accept();
  };
}

module.exports = authenticator;
