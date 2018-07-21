const bunyan = require('bunyan');

const level =
	process.env.LOG_LEVEL || (process.argv[2] == 'dev' || process.env.NODE_ENV == 'dev' ? 'debug' : false) || 'info';

function requestSerializer(request) {
	let tmp = bunyan.stdSerializers.req(request);
	if (request.body.query) {
		tmp.query = request.body.query;
	}
	return tmp;
}

module.exports = bunyan.createLogger({
	name: 'apollon',
	level,
	serializers: {
		request: requestSerializer,
		resonse: bunyan.stdSerializers.res,
		err: bunyan.stdSerializers.err
	}
});
