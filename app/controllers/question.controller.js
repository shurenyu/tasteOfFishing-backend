const db = require("../models");
const Question = db.question;
const AnswerComment = db.answerComment;

exports.registerQuestion = (req, res) => {
    const newQuestion = {
        question: req.body.question,
        userId: req.body.userId,
        createdDate: new Date(),
    };

    Question.create(newQuestion)
        .then(data => {
            return res.status(200).send({result: 'QUESTION_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.getAllQuestion = (req, res) => {
    Question.findAll()
        .then(data => {
            return res.status(200).send({result: data});
        }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getQuestionById = (req, res) => {
    const questionId = req.body.questionId;
    Question.findOne({
        where: {id: questionId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.updateQuestion = async (req, res) => {
    const questionId = req.body.questionId;

    try {
        const question = await Question.findOne({
            where: {id: questionId}
        });

        if (!question) {
            return res.status(404).send({msg: 'QUESTION_NOT_FOUND'});
        }

        question.question = req.body.question;
        await question.save();

        return res.status(200).send({result: 'QUESTION_UPDATE_SUCCESS'});

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.deleteQuestion = (req, res) => {
    const questionId = req.body.questionId;

    Question.destroy({
        where: {id: questionId}
    }).then(data => {
        return res.status(200).send({result: 'QUESTION_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.registerAnswer = async (req, res) => {
    const questionId = req.body.questionId;

    try {
        const question = await Question.findOne({
            where: {id: questionId}
        });

        if (!question) {
            return res.status(404).send({msg: 'QUESTION_NOT_FOUND'});
        }

        question.answer = req.body.answer;
        await question.save();

        return res.status(200).send({result: 'QUESTION_ANSWER_ADD_SUCCESS'});

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.addCommentToAnswer = (req, res) => {
    const newComment = {
        questionId: req.body.questionId,
        userId: req.body.userId,
        comment: req.body.comment,
        createdDate: new Date(),
    };

    AnswerComment.create(newComment)
        .then(data => {
            return res.status(200).send({result: 'ANSWER_COMMENT_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};
