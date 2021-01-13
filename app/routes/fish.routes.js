const {authJwt} = require("../middleware");
const controller = require("../controllers/fish.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "authorization, Origin, Content-Type, Accept"
        );
        next();
    });

    app.all(
        "/fish/commit",
        [authJwt.verifyToken],
        controller.commitFish
    );

    app.all(
        "/fish/register-checked-fish",
        [authJwt.verifyToken],
        controller.registerCheckedFish
    );

    app.all(
        "/fish/get-by-user",
        [authJwt.verifyToken],
        controller.getFishesByUser
    );

    app.all(
        "/fish/get-by-competition",
        [authJwt.verifyToken],
        controller.getFishesByCompetition
    );

    app.all(
        "/fish/add-image",
        [authJwt.verifyToken],
        controller.addFishImage
    );
};
