module.exports = (sequelize, Sequelize) => {
    return sequelize.define("user", {
        type: { // 0-admin 1-email-login 2-google login 3-facebook login
            type: Sequelize.INTEGER(2)
        },
        name: {
            type: Sequelize.STRING(100)
        },
        email: {
            type: Sequelize.STRING(50)
        },
        password: {
            type: Sequelize.STRING(256)
        },
        active: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        createdDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        updatedDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: false,
        underscored: false,
    });
};
