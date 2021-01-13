const {authJwt} = require("../middleware");
const controller = require("../controllers/notice.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "authorization, Origin, Content-Type, Accept"
        );
        next();
    });

    app.all(
        "/notice/register",
        [authJwt.verifyToken],
        controller.registerNotice
    );

    app.all(
        "/notice/update",
        [authJwt.verifyToken],
        controller.updateNotice
    );

    app.all(
        "/notice/get-by-id",
        [authJwt.verifyToken],
        controller.getNoticeById
    );

    app.all(
        "/notice/get-all",
        [authJwt.verifyToken],
        controller.getAllNotice
    );

    app.all(
        "/notice/delete",
        [authJwt.verifyToken],
        controller.deleteNotice
    );
};
