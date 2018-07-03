function authenticator(orientDb) {

	return async function authenticate(request, response, next) {
		return next();
	};
}

module.exports = authenticator;
