module.exports = (sequelize, Sequelize) => {
    return sequelize.define("emailCertification", {
        email: {
            type: Sequelize.STRING(50)
        },
        code: {
            type: Sequelize.STRING(8)
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
