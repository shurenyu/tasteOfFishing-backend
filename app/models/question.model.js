module.exports = (sequelize, Sequelize) => {
    return sequelize.define("question", {
        question: {
            type: Sequelize.STRING(1000)
        },
        userId: {
            type: Sequelize.INTEGER(21)
        },
        questionDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        answer: {
            type: Sequelize.STRING(2000)
        },
        answerDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: false,
        underscored: false,
    });
};
