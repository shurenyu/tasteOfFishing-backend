const db = require("../models");
const Competition = db.competition;
const Diary = db.diary;
const Fish = db.fish;
const Op = db.Sequelize.Op;

/**
 * Register Competition
 * @param req keys: {...}
 * @param res
 * @returns {token}
 */
exports.registerCompetition = (req, res) => {
    const newCompetition = {
        ...req.body
    };
    Competition.create(newCompetition)
        .then(data => {
            return res.status(200).send({result: 'COMPETITION.REGISTER'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        });
};


exports.updateCompetition = async (req, res) => {
    try {
        const competitionId = req.body.competitionId;

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        if (!competition) {
            return res.status(404).send({msg: 'COMPETITION.NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        for (const key of keys) {
            if (key !== 'competitionId') {
                competition[key] = req.body[key];
            }
        }
        await competition.save();

        return res.status(200).send({result: 'COMPETITION.UPDATE_SUCCESS'});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getCompetitionById = (req, res) => {
    const competitionId = req.body.competitionId;

    Competition.findOne({
        where: {id: competitionId}
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getAllCompetitions = (req, res) => {
    Competition.findAll()
        .then(data => {
            return res.status(200).send({result: data});
        }).catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.deleteCompetitionById = (req, res) => {
    const competitionId = req.body.competitionId;

    Competition.destroy({
        where: {id: competitionId}
    }).then(cnt => {
        return res.status(200).send({result: cnt});
    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
};

exports.getProgressingCompetitions = (req, res) => {
    const now = new Date();

    Competition.findAll({
        where: {
            startDate: {
                [Op.lte]: now.getTime()
            },
            endDate: {
                [Op.gte]: now.getTime()
            }
        }
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getRankCompetitions = (req, res) => {
    Competition.findAll({
        where: {
            mode: 0
        }
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getQuestCompetitions = (req, res) => {
    Competition.findAll({
        where: {
            mode: {
                [Op.gt]: 0
            }
        }
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};



