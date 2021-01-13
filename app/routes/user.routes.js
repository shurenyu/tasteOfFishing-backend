const {authJwt} = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "authorization, Origin, Content-Type, Accept"
        );
        next();
    });

    app.all(
        "/user/profile/register",
        [authJwt.verifyToken],
        controller.registerProfile
    );

    app.all(
        "/user/profile/update",
        [authJwt.verifyToken],
        controller.updateProfile
    );

    app.all(
        "/user/profile/get-by-id",
        [authJwt.verifyToken],
        controller.getProfileById
    );

    app.all(
        "/user/get-all",
        [authJwt.verifyToken],
        controller.getAllUsers
    );

    app.all(
        "/user/get-by-id",
        [authJwt.verifyToken],
        controller.getUserById
    );

    app.all(
        "/user/delete",
        [authJwt.verifyToken],
        controller.deleteUserById
    );
};
