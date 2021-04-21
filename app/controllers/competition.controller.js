const db = require("../models");
const schedule = require('node-schedule');
const Competition = db.competition;
const UserCompetition = db.userCompetition;
const UserApplication = db.userApplication;
const Fish = db.fish;
const FishType = db.fishType;
const User = db.user;
const Profile = db.profile;
const UserStyle = db.userStyle;
const Op = db.Sequelize.Op;
const {getSubTokens, sendNotification} = require("../utils/push-notification");
const {rewarding} = require("./fish.controller");
const CHECK_INTERVAL = 60000;

const validCompetition = (start, end) => {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const now = new Date().getTime();
    console.log(start)
    console.log(end)

    if (startDate > endDate) return false;
    return startDate >= now;

}

/**
 * Register Competition
 * @param req keys: {...}
 * @param res
 * @returns {token}
 */
exports.registerCompetition = async (req, res) => {
    // if (!validCompetition(req.body.startDate, req.body.endDate)) {
    //     return res.status(400).send({result: 'INVALID_DATE'});
    // }

    try {
        const newCompetition = req.body.type === 0 ? {
            ...req.body,
        } : {
            ...req.body,
            needApplication: 1,
        };

        const contest = await Competition.create(newCompetition);
        let rewardJob = null;
        let startJob = null;
        let endJob = null;

        let tmr = setInterval(async function () {
            const now = new Date().getTime();

            const competition = await Competition.findOne({
                where: {id: contest.id}
            });

            const endDate = new Date(competition.endDate).getTime();
            const startDate = new Date(competition.startDate).getTime();

            if (now > endDate + 1000) {
                console.log('the competition finished!!!!!!!!')
                await rewarding(competition);
                clearInterval(tmr);

            } else if (endDate - now < CHECK_INTERVAL) {
                console.log('competition will be finished within 1 min !!!');

                rewardJob = schedule.scheduleJob(endDate, async function () {
                    await rewarding(competition);
                    clearInterval(tmr);
                })

            } else if (endDate - now < 24 * 3600000) {
                console.log('ending  ------------------');

                if (!endJob) {
                    endJob = schedule.scheduleJob(endDate - 23 * 3600000, async function () {
                        const userCompetition = await UserCompetition.findAll({
                            where: {competitionId: competition.id}
                        });

                        const userIds = [];
                        for (const item of userCompetition) {
                            userIds.push(item.userId);
                        }

                        const registeredTokens = await getSubTokens(userIds);
                        await sendNotification([registeredTokens],
                            {message: '곧 대회가 종료되요!',
                                data: {competitonId: competition.id, message: '곧 대회가 종료되요!'}});

                    })
                }
            } else if (startDate - now < 24 * 3600000) {
                console.log('starting -----------------')

                if (!startJob) {
                    startJob = schedule.scheduleJob(startDate - 23 * 3600000, async function () {
                        const userCompetition = await UserCompetition.findAll({
                            where: {competitionId: competition.id}
                        });

                        const userIds = [];
                        for (const item of userCompetition) {
                            userIds.push(item.userId);
                        }

                        const registeredTokens = await getSubTokens(userIds);
                        await sendNotification([registeredTokens], {
                            message: '곧 대회가 시작되요!',
                            data: {competitionId: competition.id, message: '곧 대회가 시작되요!'}
                        });
                    })
                }
            }

        }, CHECK_INTERVAL);

        return res.status(200).send({result: 'COMPETITION.REGISTER', data: contest.id});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }

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

exports.getCompetitionTerms = (req, res) => {
    Competition.findOne({
        attributes: ['id', 'termsAndConditions'],
        where: {
            id: req.body.competitionId,
        }
    }).then(data => {
        return res.status(200).send({result: data['termsAndConditions']});
    }).catch ((err) => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.getCompetitionById = async (req, res) => {
    try {
        const competitionId = req.body.competitionId;
        const userId = req.body.userId; //login user id

        const competition = await Competition.findOne({
            where: {id: competitionId},
            include: [{
                model: FishType,
                attributes: ['id', 'name']
            }]
        });

        const cntUser = await UserCompetition.count({
            where: {competitionId: competitionId}
        });

        const norm = competition.questSpecialWidth || 10000;

        let order = (competition.mode !== 5)
            ? [[`record${competition.mode}`, 'DESC']]
            : [[db.sequelize.fn('ABS', db.sequelize.literal('record5 - ' + norm)), 'ASC']];

        let winners = [];

        if (competition.mode > 0) {
            winners = await UserCompetition.findAll({
                limit: 3,
                order: order,
                attributes: ['id', `record${competition.mode}`, 'image'],
                where: {
                    competitionId: competitionId,
                    // [`record${competition.mode}`]: {
                    //     [Op.gt]: 0,
                    // },
                },
                include: [{
                    model: User,
                    attributes: ['id', 'name'],
                    include: [{
                        model: Profile,
                        attributes: ['id', 'username', 'level', 'avatar'],
                        include: [{
                            model: UserStyle
                        }]
                    }],
                    required: true,
                }],
                required: false,
            });
        }

        const myStatus = await UserCompetition.findOne({
            where: {
                competitionId: competitionId,
                userId: userId || 0,
            }
        })

        const isApplied = await UserApplication.findOne({
            where: {
                competitionId: competitionId,
                userId: userId || 0,
            }
        })

        return res.status(200).send({result: {...competition.dataValues, userCount: cntUser},
                            ranking: winners, myStatus: !!myStatus, isApplied: !!isApplied});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
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

exports.getNewCompetition = (req, res) => {
    Competition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        where: {
            endDate: {
                [Op.gt]: (new Date()).getTime()
            }
        },
        include: [{
            model: FishType
        }]
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.deleteCompetitionById = (req, res) => {
    const competitionId = req.body.competitionId;

    Competition.destroy({
        where: {id: competitionId}
    }).then(cnt => {
        if (cnt === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }

        UserCompetition.destroy({
            where: {competitionId: competitionId}
        }).then(data => {
            return res.status(200).send({result: cnt});
        }).catch(err => {
            return res.status(200).send({msg: err.toString()});
        })

    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
};

exports.getProgressingCompetitions = (req, res) => {
    const now = new Date();

    Competition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        where: {
            startDate: {
                [Op.lte]: now.getTime()
            },
            endDate: {
                [Op.gte]: now.getTime()
            }
        },
        include: [{
            model: FishType,
            attributes: ['id', 'name']
        }]
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.searchCompetitions = (req, res) => {
    const searchKey = req.body.keyword;
    const type = req.body.type;
    const now = new Date();
    let filter = {};

    if (type === 1) {
        filter = { // Progressing Contest
            startDate: {
                [Op.lte]: now.getTime()
            },
            endDate: {
                [Op.gte]: now.getTime()
            },
            [Op.or]: [{
                name: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }, {
                description: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }]
        };
    } else if (type === 2) { // Rank Contest
        filter = {
            mode: 1,
            [Op.or]: [{
                name: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }, {
                description: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }]
        }
    } else if (type === 3) {
        filter = {
            mode: {[Op.gt]: 1},
            [Op.or]: [{
                name: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }, {
                description: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }]
        }
    }

    Competition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        where: filter,
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.getProgressingCompetitionsByUser = (req, res) => {
    const now = new Date();

    UserCompetition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
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

    UserCompetition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
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
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        where: {
            mode: 1
        }
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getQuestCompetitions = (req, res) => {
    Competition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        where: {
            mode: {
                [Op.gt]: 1
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

    if (type) filter.type = type;
    if (mode === 1) filter.mode = 1;
    if (mode === 2) filter.mode = {
        [Op.gt]: 1
    }
    if (status === 1) {
        filter.endDate = {
            [Op.lt]: now.getTime()
        };
    } else if (status === 2) {
        filter.startDate = {
            [Op.lt]: now.getTime()
        };
        filter.endDate = {
            [Op.gt]: now.getTime()
        };
    } else if (status === 3) {
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
            order: [['createdDate', 'DESC']],
            where: filter
        });

        return res.status(200).send({result: data, totalCount: count});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}


/**
 * Get Ranking of the competition
 * @param req keys: {competitionId, limit}
 * @param res
 * @returns {Promise<void>}
 */
exports.getCompetitionRanking = async (req, res) => {

    try {
        const competitionId = req.body.competitionId;
        const limit = req.body.limit;

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        const norm = competition.questSpecialWidth || 10000;

        let order = (competition.mode !== 5)
            ? [[`record${competition.mode}`, 'DESC']]
            : [[db.sequelize.fn('ABS', db.sequelize.literal('record5 - ' + norm)), 'ASC']];

        let data = [];

        if (competition.mode > 0) {
            data = await UserCompetition.findAll({
                limit: limit || 1000000,
                order: order,
                attributes: ['id', `record${competition.mode}`, 'image'],
                where: {
                    competitionId: competitionId,
                    // [`record${competition.mode}`]: {
                    //     [Op.gt]: 0,
                    // },
                },
                include: [{
                    model: User,
                    attributes: ['id', 'name'],
                    include: [{
                        model: Profile,
                        attributes: ['id', 'username', 'level', 'avatar'],
                        include: [{
                            model: UserStyle
                        }]
                    }],
                    required: true,
                }],
            });
        }
        const myRanking = data.findIndex(x => x.user.id === req.body.userId);

        return res.status(200).send({result: data, myRanking: myRanking + 1});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};


exports.getCompetitionOverview = async (req, res) => {

    try {
        const competitionId = req.body.competitionId;
        const limit = req.body.limit || 10000;
        const offset = req.body.offset || 0;

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        const norm = competition.questSpecialWidth;

        let order = (competition.mode !== 5)
            ? [[`record${competition.mode}`, 'DESC']]
            : [[db.sequelize.fn('ABS', db.sequelize.literal('record5 - ' + norm)), 'ASC']];

        let data = [];

        if (competition.mode > 0) {
            data = await UserCompetition.findAndCountAll({
                limit: limit,
                offset: offset,
                order: order,
                attributes: ['id', 'userId', `record${competition.mode}`, 'image'],
                where: {
                    competitionId: competitionId,
                },
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'email', 'createdDate'],
                    include: [{
                        model: Profile,
                        attributes: ['id', 'username', 'level', 'avatar'],
                        include: [{
                            model: UserStyle
                        }]
                    }]
                }]
            });
        }

        return res.status(200).send({result: data});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

const getRecordByUser = async (userId) => {
    let totalDiaryCount = 0;
    let rankDiaryCount = 0;
    let questDiaryCount = 0;
    let rankChampionshipCount = 0;
    let questChampionshipCount = 0;

    totalDiaryCount = await Fish.count({
        where: {userId: userId}
    });

    const myCompetitions = await UserCompetition.findAll({
        where: {userId: userId},
        include: [{
            model: Competition,
        }]
    });

    for (const item of myCompetitions) {
        if (item.competition && item.competition.mode === 1) {
            rankDiaryCount += 1;

            const maxScore = await UserCompetition.max('record1', {
                where: {competitionId: item.competition.id}
            });

            if (item.record1 === maxScore) rankChampionshipCount += 1;
        } else if (item.competition) {
            questDiaryCount += 1;

            const comp = await Competition.findOne({
                where: {id: item.competition.id}
            });

            if (item.competition.mode === 2) {
                if (item.record2 >= comp.questFishWidth) questChampionshipCount += 1;
            } else if (item.competition.mode === 3) {
                if (item.record3 >= comp.questFishNumber) questChampionshipCount += 1;
            } else if (item.competition.mode === 4) {
                if (item.record4 >= comp.questFishNumber) questChampionshipCount += 1;
            } else {
                const minBias = await UserCompetition.min('record5', {
                    where: {competitionId: item.competition.id}
                });

                if (item.record5 === minBias) questChampionshipCount += 1;
            }
        }
    }

    return {
        totalDiaryCount,
        rankDiaryCount,
        questDiaryCount,
        rankChampionshipCount,
        questChampionshipCount,
    };
}
