const db = require("../models");
const Competition = db.competition;
const Diary = db.diary;
const FishType = db.fishType;
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

exports.getAllCompetitions = async (req, res) => {
    try {
        const totalCount = await Competition.count();

        const competitions = await Competition.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            include: [{
                model: FishType
            }]
        });

        return res.status(200).send({result: competitions, totalCount: totalCount});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
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

exports.getProgressingCompetitionsByUser = (req, res) => {
    const now = new Date();

    Diary.findAll({
        where: {userId: req.body.userId},
        include: [{
            model: Competition,
            where: {
                startDate: {
                    [Op.lte]: now.getTime()
                },
                endDate: {
                    [Op.gte]: now.getTime()
                }
            },
            include: [{
                model: FishType
            }]
        }]
    }).then(data => {
        return res.status(200).send({result: data, totalCount: data.length});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getAttendedCompetitionsByUser = (req, res) => {
    const now = new Date();

    Diary.findAll({
        where: {userId: req.body.userId},
        include: [{
            model: Competition,
            where: {
                endDate: {
                    [Op.lt]: now.getTime()
                }
            },
            include: [{
                model: FishType
            }]
        }]
    }).then(data => {
        return res.status(200).send({result: data, totalCount: data.length});
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

exports.getCompetitionByMultiFilter = async (req, res) => {
    const type = req.body.type;
    const mode = req.body.mode;
    const status = req.body.status;
    const filter = {};
    const now = new Date();

    if (type !== 'ALL') filter.type = type;
    if (mode === 0) filter.mode = 0;
    if (mode === 1) filter.mode = {
        [Op.gt]: 0
    }
    if (status === 0) {
        filter.endDate = {
            [Op.lt]: now.getTime()
        };
    } else if (status === 1) {
        filter.startDate = {
            [Op.lt]: now.getTime()
        };
        filter.endDate = {
            [Op.gt]: now.getTime()
        };
    } else if (status === 2) {
        filter.startDate = {
            [Op.gt]: now.getTime()
        };
    }

    try {
        const count = await Competition.count({
            where: filter
        });

        const data = await Competition.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            where: filter
        });

        return res.status(200).send({result: data, totalCount: count});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}



