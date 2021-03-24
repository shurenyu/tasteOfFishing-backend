const db = require("../models");
const User = db.user;
const Profile = db.profile;
// const Diary = db.diary;
const UserStyle = db.userStyle;
const FishType = db.fishType;
const UserCompetition = db.userCompetition;
const Competition = db.competition;
const UserPoint = db.userPoint;
const Op = db.Sequelize.Op;
const {updatePoint} = require("./withdrawal.controller");

/**
 * Register Profile
 * @param req keys: {userId, username, introMe, avatar, serviceAlarm, adAlarm}
 * @param res
 * @returns {token}
 */
exports.registerProfile = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {id: req.body.userId}
        });
        user.name = req.body.name || user.name;
        await user.save();

        const profile = await Profile.create({
            userId: req.body.userId,
            username: req.body.name,
            introMe: req.body.introMe,
            avatar: req.body.avatar,
            serviceAlarm: req.body.serviceAlarm,
            adAlarm: req.body.adAlarm,
            pointAmount: 30,
            createdDate: new Date(),
        });

        const userInfo = await User.findOne({
            where: {id: req.body.userId},
            attributes: {
                exclude: ['password'],
            },
            include: [{
                model: Profile,
                include: [{
                    model: FishType
                }, {
                    model: UserStyle
                }]
            }]
        });

        let dailyCheck = true;
        return res.status(200).send({
            result: 'USER.PROFILE_REGISTER_SUCCESS',
            userInfo: userInfo,
            data: profile.id,
            dailyCheck,
        });
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};


exports.updateProfile = async (req, res) => {
    try {
        const profileId = req.body.profileId;
        const userId = req.body.userId;
        // const filter = profileId ? {id: profileId} : userId ? {userId: userId} : null;
        //
        // if (filter === null) {
        //     return res.status(404).send({msg: 'USER.PROFILE_NOT_FOUND'});
        // }

        const profile = await Profile.findOne({
            where: {userId: userId}
        });

        if (!profile) {
            return res.status(404).send({msg: 'USER.PROFILE_NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        for (const key of keys) {
            if (key !== 'profileId' && key !== 'userId') {
                profile[key] = req.body[key];
            }
        }
        await profile.save();

        const user = await User.findOne({
            where: {id: userId},
            attributes: {
                exclude: ['password'],
            },
            include: [{
                model: Profile,
                include: [{
                    model: FishType
                }, {
                    model: UserStyle
                }]
            }]
        });

        user.name = req.body.name || user.name;

        await user.save();

        return res.status(200).send({
            result: 'USER.PROFILE_UPDATE_SUCCESS',
            userInfo: user,
            data: profile.id,
        });

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getProfileById = (req, res) => {
    const profileId = req.body.profileId;

    Profile.findOne({
        where: {id: profileId}
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getProfileByUserId = (req, res) => {
    const userId = req.body.userId;

    Profile.findOne({
        where: {userId: userId},
        include: [{
            model: UserStyle
        }]
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getAllUsers = async (req, res) => {
    try {
        const userCount = await User.count({
            where: {
                type: {[Op.gt]: 0}
            }
        });

        const users = await User.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            where: {
                type: {[Op.gt]: 0}
            },
            attributes: {exclude: ['password']},
        });

        return res.status(200).send({result: users, totalCount: userCount});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getUserById = async (req, res) => {
    const userId = req.body.userId;

    try {
        const user = await User.findOne({
            where: {id: userId},
            attributes: ['id', 'email', 'name'],
            include: [{
                model: Profile,
                attributes: ['id', 'username', 'level', 'introMe', 'avatar'],
                include: [{
                    model: UserStyle
                }]
            }]
        });

        const userRecord = await getRecordByUser(userId);

        return res.status(200).send({userInfo: user, userRecord: userRecord});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.deleteUserById = (req, res) => {
    const userId = req.body.userId;

    User.destroy({
        where: {id: userId}
    }).then(cnt => {
        if (cnt === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: cnt});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.getMyInfo = async (req, res) => {
    const userId = req.body.userId;

    try {
        const myInfo = await User.findOne({
            where: {
                id: userId
            },
            attributes: ['id', 'name', 'email'],
            include: [{
                model: Profile,
                include: [{
                    model: UserStyle,
                }]
            }]
        });

        const userRecord = await getRecordByUser(userId);

        return res.status(200).send({userInfo: myInfo, userRecord: userRecord});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.attendCompetition = async (req, res) => {
    try {
        const userId = req.body.userId;
        const competitionId = req.body.competitionId;
        const attendPoint = req.body.attendPoint;

        const userCompetition = await UserCompetition.findOne({
            where: {
                userId: userId,
                competitionId: competitionId
            }
        });

        if (userCompetition) {
            return res.status(400).send({msg: 'ALREADY_ATTENDED'});
        }

        const profile = await Profile.findOne({
            where: {
                userId: userId,
            }
        });

        if (profile.pointAmount < attendPoint) {
            return res.status(400).send({result: 'POINT_NOT_ENOUGH'});
        }

        await UserCompetition.create({
            userId: userId,
            competitionId: competitionId,
            createdDate: new Date()
        });

        // update the pointAmount, level, exp, and style
        await updatePoint(userId, attendPoint, 0, '대회참여');
        profile.exp += 150;
        profile.level = Math.floor(profile.exp / 1000);
        const attendCount = await UserCompetition.count({
            where: {userId: userId},
        });

        if (profile.userStyleId <= 5) {
            if (attendCount <= 1) {
                profile.userStyleId = 1;
            } else if (attendCount <= 10) {
                profile.userStyleId = 2;
            } else if (attendCount <= 20) {
                profile.userStyleId = 3;
            } else if (attendCount <= 50) {
                profile.userStyleId = 4;
            } else if (attendCount <= 100) {
                profile.userStyleId = 5;
            }
        }
        await profile.save();

        return res.status(200).send({result: 'SUCCESS_COMPETITION_ATTEND', userInfo: profile});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.cancelCompetition = async (req, res) => {
    const userId = req.body.userId;
    const competitionId = req.body.competitionId;

    try {
        const cnt = await UserCompetition.destroy({
            where: {
                userId: userId,
                competitionId: competitionId
            }
        });

        if (cnt === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }

        const profile = await Profile.findOne({
            where: {
                userId: userId,
            }
        });

        // update the pointAmount, level, exp, and style
        profile.exp -= 150;
        profile.level = Math.floor(profile.exp / 1000);
        const attendCount = await UserCompetition.count({
            where: {userId: userId},
        });

        if (profile.userStyleId <= 5) {
            if (attendCount <= 1) {
                profile.userStyleId = 1;
            } else if (attendCount <= 10) {
                profile.userStyleId = 2;
            } else if (attendCount <= 20) {
                profile.userStyleId = 3;
            } else if (attendCount <= 50) {
                profile.userStyleId = 4;
            } else if (attendCount <= 100) {
                profile.userStyleId = 5;
            }
        }
        await profile.save();

        return res.status(200).send({result: 'SUCCESS_COMPETITION_CANCEL', userInfo: profile});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

const getRecordByUser = async (userId) => {
    let totalDiaryCount = 0;
    let rankDiaryCount = 0;
    let questDiaryCount = 0;
    let rankChampionshipCount = 0;
    let questChampionshipCount = 0;

    const myCompetitions = await UserCompetition.findAll({
        where: {userId: userId},
        include: [{
            model: Competition,
        }]
    });

    totalDiaryCount = myCompetitions.length;

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

exports.getStyleStatistic = async (req, res) => {
    try {
        let result = [];
        for (let i = 1; i < 9; i++) {
            const temp = await Profile.count({
                where: {
                    userStyleId: i,
                }
            });

            result.push(temp);
        }
        return res.status(200).send({result: result});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getUserPointHistory = (req, res) => {
    UserPoint.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        where: {
            userId: req.body.userId
        }
    }).then(async data => {
        const count = await UserPoint.count({
            where: {
                userId: req.body.userId
            }
        })
        return res.status(200).send({result: data, totalCount: count});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    });

}


const Test = db.test
exports.testing = async (req, res) => {
    console.log("***********************")
    try {
        // const rank = db.Sequelize.literal('(RANK() OVER (ORDER BY point DESC))');
        // const data = await Test.findAll({
        //     // order: [['point', 'DESC']],
        //     attributes: [
        //         'id', 'point',
        //         [rank, 'rank']
        //     ]
        // });


        const [winners, metadata] = await db.sequelize.query(`
                    SELECT *,
                    (
                        SELECT 1+ count(*)
                        FROM userCompetitions uc1
                        WHERE uc1.record1 > uc.record1
                    ) as rank
                    FROM userCompetitions uc
                    HAVING competitionId = 15 and rank < 4
                    ORDER BY uc.record1 DESC
                `);


        return res.status(200).send({result: winners});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }

}

