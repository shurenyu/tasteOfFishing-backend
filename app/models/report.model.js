module.exports = (sequelize, Sequelize) => {
    return sequelize.define("report", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        reporterId: {
            type: Sequelize.INTEGER(21)
        },
        content: {
            type: Sequelize.TEXT
        },
        postId: {
            type: Sequelize.INTEGER(21),
            defaultValue: 0,
        },
        fishId: {
            type: Sequelize.INTEGER(21),
            defaultValue: 0,
        },
        status: { // 1-대기중, 2-처리완료
            type: Sequelize.INTEGER(4)
        },
        type: {
            type: Sequelize.INTEGER(4)
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
