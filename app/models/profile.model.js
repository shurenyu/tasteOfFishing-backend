module.exports = (sequelize, Sequelize) => {
    return sequelize.define("profile", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        username: {
            type: Sequelize.STRING(100)
        },
        introMe: {
            type: Sequelize.STRING(32)
        },
        avatar: {
            type: Sequelize.STRING(100)
        },
        serviceAlarm: {
            type: Sequelize.BOOLEAN
        },
        adAlarm: {
            type: Sequelize.BOOLEAN
        },
        withdrawEmail: {
            type: Sequelize.STRING(50),
            defaultValue: "",
        },
        withdrawPhoneNumber: {
            type: Sequelize.STRING(12),
            defaultValue: "",
        },
        pointAmount: {
            type: Sequelize.INTEGER(20),
        },
        level: {
            type: Sequelize.INTEGER(2),
        },
        style: {
            type: Sequelize.STRING(30),
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
