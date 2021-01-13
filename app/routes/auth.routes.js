const controller = require("../controllers/auth.controller");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "authorization, Origin, Content-Type, Accept"
        );
        next();
    });

    app.all(
        "/auth/register",
        controller.register
    );

    app.all(
        "/auth/login",
        controller.login
    );

    app.all(
        "/auth/forgot-password",
        controller.forgotPassword
    );

    app.all(
        "/auth/verify-code",
        controller.verifyCode
    );

    app.all(
        "/auth/change-password",
        controller.changePassword
    );

    app.all(
        "/auth/email/check",
        controller.checkEmail
    );

    app.all(
        "/auth/user/get-by-id",
        controller.getUserInfo
    )
};
