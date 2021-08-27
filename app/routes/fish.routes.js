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
        "/fish/get-all",
        [authJwt.verifyToken],
        controller.getAllFishes
    );

    app.all(
        "/fish/get-by-id",
        [authJwt.verifyToken],
        controller.getFishById
    );

    app.all(
        "/fish/get-by-user",
        [authJwt.verifyToken],
        controller.getFishesByUser
    );

    app.all(
        "/diary/get-by-user",
        [authJwt.verifyToken],
        controller.getDiariesByUser
    );

    app.all(
        "/fish/get-by-multi-filter",
        [authJwt.verifyToken],
        controller.getFishesByMultiFilter
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

    app.all(
        "/fish/update",
        [authJwt.verifyToken],
        controller.updateFish
    );

    app.all(
        "/fish/delete",
        [authJwt.verifyToken],
        controller.deleteFish
    );

    app.all(
        "/diary/update",
        [authJwt.verifyToken],
        controller.updateFish
    );

    app.all(
        "/get-ranking/realtime",
        [authJwt.verifyToken],
        controller.getRankingRealtime
    );

    app.all(
        "/fish/add-comment",
        [authJwt.verifyToken],
        controller.addFishComment
    );

    app.all(
        "/fish/delete-comment",
        [authJwt.verifyToken],
        controller.deleteFishComment
    );


    app.all(
        "/diary/search",
        [authJwt.verifyToken],
        controller.searchDiary
    );

    app.all(
        "/fish/delete/report/update",
        [authJwt.verifyToken],
        controller.deleteFishAndUpdateReport
    );

    app.all(
        "/diary/get-my-info",
        [authJwt.verifyToken],
        controller.getMyDiaryInfo
    );

    //==============================================================//

    app.all(
        "/diary/register",
        [authJwt.verifyToken],
        controller.registerDiary
    );

};
