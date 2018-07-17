/**
 * function returning authentication middleware
 * @param {Object} context The context containing connectors and config
 * 
 * @returns {async function} Asynchronous authentication middleware
 */
function authenticator(context) {
	return async function authenticate(request, accept, reject) {
		context.logger.debug('Authentication challenge');
		return accept();
	};
}

module.exports = authenticator;
