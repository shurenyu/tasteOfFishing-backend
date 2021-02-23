const {authJwt} = require("../middleware");
const controller = require("../controllers/posCode.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "authorization, Origin, Content-Type, Accept"
        );
        next();
    });

    app.all(
        "/position-code/get",
        [authJwt.verifyToken],
        controller.getPositionCode
    );

    app.all(
        "/position-code/get-by-filter",
        [authJwt.verifyToken],
        controller.getPositionCodeByFilter
    );

};
