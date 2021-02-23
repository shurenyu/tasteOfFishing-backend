module.exports = (sequelize, Sequelize) => {
    return sequelize.define("postCommentReply", {
        postCommentId: {
            type: Sequelize.INTEGER(21)
        },
        userId: {
            type: Sequelize.INTEGER(21)
        },
        content: {
            type: Sequelize.TEXT
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
