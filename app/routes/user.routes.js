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
        controller.registerProfile
    );

    app.all(
        "/user/profile/update",
        controller.updateProfile
    );

    app.all(
        "/user/profile/get-by-id",
        [authJwt.verifyToken],
        controller.getProfileById
    );

    app.all(
        "/user/profile/get-by-user",
        [authJwt.verifyToken],
        controller.getProfileByUserId
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
        "/user/get-my-info",
        [authJwt.verifyToken],
        controller.getMyInfo
    );

    app.all(
        "/user/delete",
        [authJwt.verifyToken],
        controller.deleteUserById
    );

    app.all(
        "/user/apply-competition",
        [authJwt.verifyToken],
        controller.applyCompetition
    );

    app.all(
        "/user/attend-competition",
        [authJwt.verifyToken],
        controller.attendCompetition
    );

    app.all(
        "/user/competition-cancel",
        [authJwt.verifyToken],
        controller.cancelCompetition
    );

    app.all(
        "/user/style-statistic",
        [authJwt.verifyToken],
        controller.getStyleStatistic
    );


    app.all(
        "/user/point-history",
        [authJwt.verifyToken],
        controller.getUserPointHistory
    );

    app.all(
        "/user/point/update",
        [authJwt.verifyToken],
        controller.updateUserPoint
    );

    app.all(
        "/test",
        [authJwt.verifyToken],
        controller.testing
    );

};
