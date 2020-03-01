import bunyan from "bunyan";

const level =
  process.env.LOG_LEVEL ||
  (process.argv[2] == "dev" || process.env.NODE_ENV == "dev"
    ? "debug"
    : false) ||
  "info";

function requestSerializer(request) {
  let tmp = bunyan.stdSerializers.req(request);
  if (request.body.query) {
    tmp.query = request.body.query;
  }
  return tmp;
}

const logger = bunyan.createLogger({
  name: "apollon",
  level,
  serializers: {
    request: requestSerializer,
    resonse: bunyan.stdSerializers.res,
    err: bunyan.stdSerializers.err
  }
});

//Setting up child logger
logger.trace("Setting up logging");
let childLogger = logger.child({ scope: "userland" });
childLogger.domain = function(obj, potMessage) {
  const domain = { scope: "domain" };
  if (potMessage) {
    childLogger.info(Object.assign(obj, domain), potMessage);
  } else {
    childLogger.info(domain, obj);
  }
};

logger._childLogger = childLogger;

export default logger;
