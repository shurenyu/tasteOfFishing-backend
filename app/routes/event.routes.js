const {authJwt} = require("../middleware");
const controller = require("../controllers/event.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        // res.header(
        //     "Access-Control-Allow-Headers",
        //     "authorization, Origin, Content-Type, Accept"
        // );
        const headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };
        res.writeHead(200, headers);
        next();
    });

    app.all(
        "/event/register-user",
        controller.eventHandler
    );
};
