import pinoHttp from "pino-http";

const isDevelopment = process.env.NODE_ENV !== "production";

export const httpLogger = pinoHttp({
    transport: isDevelopment
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
            },
        }
        : undefined,

    customLogLevel(_req, res, err) {
        if (err || res.statusCode >= 500) {
            return "error";
        }

        if (res.statusCode >= 400) {
            return "warn";
        }

        return "info";
    },

    serializers: {
        req(req) {
            return {
                method: req.method,
                url: req.url,
            };
        },

        res(res) {
            return {
                statusCode: res.statusCode,
            };
        },
    },
});