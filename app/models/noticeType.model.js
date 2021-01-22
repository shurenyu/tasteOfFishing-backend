module.exports = (sequelize, Sequelize) => {
    return sequelize.define("noticeType", {
        type: {
            type: Sequelize.INTEGER(2)
        },
        createdDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
    }, {
        timestamps: false,
        underscored: false,
    });
};
