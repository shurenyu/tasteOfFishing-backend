module.exports = (sequelize, Sequelize) => {
    return sequelize.define("userNotice", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        noticeId: {
            type: Sequelize.INTEGER(21)
        },
        createdDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: false,
        underscored: false,
    });
};
