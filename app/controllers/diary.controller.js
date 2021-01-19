const db = require("../models");
const Fish = db.fish;
const Diary = db.diary;
const DiaryComment = db.diaryComment;
const Competition = db.competition;
const FishImage = db.fishImage;
const User = db.user;
const Profile = db.profile;
const Op = db.Sequelize.Op;

exports.registerDiary = (req, res) => {
    const newDiary = {
        userId: req.body.userId,
        competitionId: req.body.competitionId,
        createdDate: new Date(),
    }

    Diary.create(newDiary)
        .then(data => {
            return res.status(200).send({result: 'DIARY_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.getDiariesByUser = (req, res) => {
    Diary.hasOne(Competition);
    Competition.belongsTo(Diary);

    Competition.hasMany(Fish);
    Fish.belongsTo(Competition);

    const userId = req.body.userId;

    Diary.findAll({
        where: {userId: userId},
        attributes: ['id'],
        include: [{
            model: Competition,
            attributes: ['id', 'name'],
            include: [{
                model: Fish,
                where: {
                    userId: userId
                }
            }]
        }]
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

/**
 *
 * @param req keys: {competitionId, limit}
 * @param res
 * @returns {Promise<void>}
 */
exports.getDiaryByCompetition = async (req, res) => {
    Diary.hasOne(User);
    User.belongsTo(Diary);

    try {
        const competitionId = req.body.competitionId;
        const limit = req.body.limit;

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        let order = [];
        if (competition.mode === 0) order = [['record0', 'DESC']];
        if (competition.mode === 1) order = [['record1', 'DESC']];
        if (competition.mode === 2) order = [['record2', 'DESC']];
        if (competition.mode === 3) order = [['record3', 'DESC']];
        if (competition.mode === 4) order = [['record4', 'ASC']];

        const data = await Diary.findAll({
            limit: limit,
            order: order,
            include: [{
                model: User,
                include: [{
                    model: Profile
                }]
            }]
        });

        return res.status(200).send({result: data});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

/**
 *
 * @param req keys: {competitionId}
 * @param res
 * @returns {Promise<void>}
 */
exports.getWinners = async (req, res) => {
    Diary.hasOne(User);
    User.belongsTo(Diary);

    try {
        const competitionId = req.body.competitionId;

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        let data = [];

        if (competition.mode === 0) {
            data = await Diary.findAll({
                limit: 3,
                order: [['record0', 'DESC']],
                where: {competitionId: competitionId},
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }],
            });
        } else if (competition.mode === 1) {
            data = await Diary.findAll({
                order: [['record1', 'DESC']],
                where: {
                    competitionId: competitionId,
                    record1: {[Op.gte]: competition.questFishWidth}
                },
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }],
            })
        } else if (competition.mode === 2) {
            data = await Diary.findAll({
                order: [['record2', 'DESC']],
                where: {
                    competitionId: competitionId,
                    record2: {[Op.gte]: competition.questFishNumber}
                },
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }]
            })
        } else if (competition.mode === 3) {
            data = await Diary.findAll({
                order: [['record3', 'DESC']],
                where: {
                    competitionId: competitionId,
                    record3: {[Op.gte]: competition.questFishNumber}
                },
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }]
            })
        } else if (competition.mode === 4) {
            data = await Diary.findAll({
                limit: 3,
                order: [['record4', 'ASC']],
                where: {competitionId: competitionId},
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }]
            })
        }

        return res.status(200).send({result: data});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.updateDiary = (req, res) => {
    const diaryId = req.body.diaryId;
    const data = {
        text: req.body.text,
    }

    Diary.update(data, {
        where: {id: diaryId}
    }).then(data => {
        return res.status(200).send({result: 'DIARY_UPDATE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.deleteDiaryById = (req, res) => {
    const diaryId = req.body.diaryId;

    Diary.destroy({
        where: {id: diaryId}
    }).then(cnt => {
        return res.status(200).send({result: cnt});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.addDiaryComment = (req, res) => {
    const newComment = {
        diaryId: req.body.diaryId,
        userId: req.body.userId,
        comment: req.body.comment,
        createdDate: new Date(),
    }

    DiaryComment.create(newComment)
        .then(data => {
            return res.status(200).send({result: 'DIARY_COMMENT_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};
