const db = require("../models");
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
const aDay = 24 * 3600000;
// const aDay = 3 * 60000;

const validCompetition = (start, end) => {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const now = new Date().getTime();

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
    if (!validCompetition(req.body.startDate, req.body.endDate)) {
        return res.status(400).send({msg: 'INVALID_DATE'});
    }

    console.log(req.body)
    try {
        const newCompetition = req.body.type === 1 ? {
            ...req.body,
            needApplication: 0,
        } : {
            ...req.body,
            needApplication: 1,
        };

        const contest = await Competition.create(newCompetition);

        let tmr = setInterval(async function () {
            const now = new Date().getTime();

            const competition = await Competition.findOne({
                where: {id: contest.id}
            });

            if (!competition) {
                console.log('clear --------- contest ----------')
                clearInterval(tmr);
            } else {
                const endDate = new Date(competition.endDate).getTime();
                const startDate = new Date(competition.startDate).getTime();

                if (now > endDate + CHECK_INTERVAL) {
                    clearInterval(tmr);
                } else if (now > endDate + 1000) {

                    console.log('the competition finished!!!!!!!!')
                    await rewarding(competition);
                    clearInterval(tmr);

                } else if (now >= endDate - aDay && now < endDate - aDay + CHECK_INTERVAL) {
                    console.log('ending  ------------------');

                    const userCompetition = await UserCompetition.findAll({
                        where: {competitionId: competition.id},
                        include: [{
                            model: User,
                            include: [{
                                model: Profile
                            }]
                        }]
                    });

                    const userIds = [];
                    for (const item of userCompetition) {
                        if (item.user && item.user.profile && item.user.profile.serviceAlarm) {
                            userIds.push(item.userId);
                        }
                    }

                    const registeredTokens = await getSubTokens(userIds);
                    await sendNotification(registeredTokens,
                        {message: 'Ending soon!',
                            data: {competitionId: competition.id, message: 'Ending soon!'}});

                } else if (now >= startDate - aDay && now < startDate - aDay + CHECK_INTERVAL) {
                    console.log('starting -----------------')

                    const appliedUsers = await UserApplication.findAll({
                        where: {competitionId: competition.id},
                        include: [{
                            model: User,
                            include: [{
                                model: Profile
                            }]
                        }]
                    });

                    const userIds = [];
                    for (const item of appliedUsers) {
                        if (item.user && item.user.profile && item.user.profile.serviceAlarm) {
                            userIds.push(item.userId);
                        }
                    }

                    console.log('Starting soon!')

                    const registeredTokens = await getSubTokens(userIds);
                    await sendNotification(registeredTokens, {
                        message: 'Starting soon!',
                        data: {competitionId: competition.id, message: 'Starting soon!'}
                    });
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
            if (key === 'endDate' && new Date(req.body[key]).getTime() <= new Date().getTime()) {
                return res.status(400).send({msg: 'INVALID_DATE'});
            }
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
                attributes: ['id', `record${competition.mode}`, 'image', 'ranking'],
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

        let count = 2;
        let rank = 1;

        if (winners.length > 0) {
            winners[0].ranking = 1;
            for (let i = 1; i < winners.length; i++) {
                switch (competition.mode) {
                    case 1:
                        if (winners[i - 1].record1 > winners[i].record1)
                            rank = count;
                        break;
                    case 2:
                        if (winners[i - 1].record2 > winners[i].record2)
                            rank = count;
                        break;
                    case 3:
                        if (winners[i - 1].record3 > winners[i].record3)
                            rank = count;
                        break;
                    case 4:
                        if (winners[i - 1].record4 > winners[i].record4)
                            rank = count;
                        break;
                    case 5:
                        if (Math.abs(winners[i - 1].record5 - competition.questSpecialWidth) <
                            Math.abs(winners[i].record5 - competition.questSpecialWidth))
                            rank = count;
                }
                winners[i].ranking = rank;
                count++;
            }
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
            startApplication: {
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
                limit: limit || 10000,
                order: order,
                attributes: ['id', `record${competition.mode}`, 'image', 'ranking'],
                where: {
                    competitionId: competitionId,
                    // [`record${competition.mode}`]: {
                    //     [Op.gt]: 0,
                    // },
                },
                include: [
                    {
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

        let count = 2;
        let rank = 1;

        if (data.length > 0) {
            data[0].ranking = 1;
            for (let i = 1; i < data.length; i++) {
                switch (competition.mode) {
                    case 1:
                        if (data[i - 1].record1 > data[i].record1)
                            rank = count;
                        break;
                    case 2:
                        if (data[i - 1].record2 > data[i].record2)
                            rank = count;
                        break;
                    case 3:
                        if (data[i - 1].record3 > data[i].record3)
                            rank = count;
                        break;
                    case 4:
                        if (data[i - 1].record4 > data[i].record4)
                            rank = count;
                        break;
                    case 5:
                        if (Math.abs(data[i - 1].record5 - competition.questSpecialWidth) <
                            Math.abs(data[i].record5 - competition.questSpecialWidth))
                            rank = count;
                }
                data[i].ranking = rank;
                count++;
            }
        }

        const my = data.find(x => x.user.id === req.body.userId);

        if ((my === null) || (my === undefined))
            return res.status(200).send({result: data});
        else
            return res.status(200).send({result: data, myRanking: my && my.ranking || 0});
    } catch (err) {
        console.log(err);
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
        if (new Date(item.competition.endDate).getTime() < new Date().getTime()) { 
            if (item.competition && item.competition.mode === 1) {
                rankDiaryCount += 1;

                const maxScore = await UserCompetition.max('record1', {
                    where: {competitionId: item.competition.id}
                });

                if (item.record1 >= maxScore) rankChampionshipCount += 1;
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
                    const norm = comp.questSpecialWidth;
                    const data = await UserCompetition.findAll({
                        where: {competitionId: 22},
                        order: [[db.sequelize.fn('ABS', db.sequelize.literal('record5 - ' + norm)), 'ASC']],
                        raw: true
                    })

                    const minRec = data && data.length > 0 ? Math.abs(data[0].record5 - norm) : null;

                    if (minRec && Math.abs(item.record5 - norm) <= minRec) questChampionshipCount += 1;
                }
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
