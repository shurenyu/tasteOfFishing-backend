const db = require("../models");
const Notice = db.notice;
const NoticeType = db.noticeType;
const UserNotice = db.userNotice;
const User = db.user;
const Profile = db.profile;
const {sendNotification} = require("../utils/push-notification")
const {getSubTokens} = require("../utils/push-notification")

exports.registerNotice = async (req, res) => {
    const newNotice = {
        noticeTypeId: req.body.noticeTypeId,
        title: req.body.title,
        content: req.body.content,
        createdDate: new Date(),
    };

    try {
        const notice = await Notice.create(newNotice);
        res.status(200).send({result: 'NOTICE_REGISTER_SUCCESS', data: notice});

        const users = await User.findAll({
            where: {
                '$profile.serviceAlarm$': 1
            },
            include: [{
                model: Profile
            }]
        })
        const tokens = await getSubTokens(users.map(x => (x.id)));
        console.log('tokens: ', tokens)

        return await sendNotification(tokens, {
            message: '공지가 등록되었습니다',
            data: {noticeId: notice.id, message: '공지가 등록되었습니다'}
        });

    } catch (err) {
        console.log(err)
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getAllNotice = async (req, res) => {
    try {
        const notices = await Notice.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            order: [['createdDate', 'DESC']],
            include: [{
                model: NoticeType
            }]
        });

        const count = await Notice.count();

        if (!req.body.userId) {
            return res.status(200).send({result: notices, totalCount: count});
        }

        const temp = [];
        for (const notice of notices) {
            const flag = await UserNotice.findOne({
                where: {
                    userId: req.body.userId,
                    noticeId: notice.id
                }
            });

            temp.push({
                ...notice.dataValues,
                status: !flag
            });
        }
        return res.status(200).send({result: temp, totalCount: count});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getRecentNotice = (req, res) => {
    Notice.findAll({
        limit: req.body.limit || 1000000,
        order: [['updatedDate', 'DESC']]
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
};

exports.getNoticeById = (req, res) => {
    const noticeId = req.body.noticeId;
    Notice.findOne({
        where: {id: noticeId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
};

exports.updateNotice = async (req, res) => {
    const noticeId = req.body.noticeId;

    try {
        const notice = await Notice.findOne({
            where: {id: noticeId}
        });

        if (!notice) {
            return res.status(404).send({msg: 'NOTICE_NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        for (const key of keys) {
            if (key !== 'noticeId') {
                notice[key] = req.body[key];
            }
        }
        await notice.save();

        return res.status(200).send({result: 'NOTICE_UPDATE_SUCCESS'});

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.deleteNotice = (req, res) => {
    const noticeId = req.body.noticeId;

    Notice.destroy({
        where: {id: noticeId}
    }).then(data => {
        if (data === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: 'NOTICE_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.registerNoticeType = (req, res) => {
    NoticeType.create({
        type: req.body.noticeType,
        createdDate: new Date()
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.getAllNoticeType = (req, res) => {
    NoticeType.findAll()
        .then(data => {
            return res.status(200).send({result: data});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
}

exports.deleteNoticeType = (req, res) => {
    NoticeType.destroy({
        where: {
            id: req.body.noticeTypeId
        }
    }).then(cnt => {
        if (cnt === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: cnt});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.readNotice = (req, res) => {
    const userId = req.body.userId;
    const noticeId = req.body.noticeId;

    UserNotice.create({
        userId,
        noticeId,
        createdDate: new Date()
    }).then(data => {
        return res.status(200).send({result: 'NOTICE_READ_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}
