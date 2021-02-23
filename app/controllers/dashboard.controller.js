const db = require("../models");
const Post = db.post;
const PostComment = db.postComment;
const PostCommentReply = db.postCommentReply;
const PostImage = db.postImage;
const User = db.user;
const Profile = db.profile;
const UserStyle = db.userStyle;
const Withdrawal = db.withdrawal;
const Op = db.Sequelize.Op;

exports.countUser = (req, res) => {
    User.count().then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.countUserToday = (req, res) => {
    const now = (new Date()).getTime();
    const todayStart = now - (now % (24 * 3600000))

    User.count({
        where: {
            createdDate: {
                [Op.gte]: todayStart,
                [Op.lte]: now,
            }
        }
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.topLevelUsers = (req, res) => {
    User.findAll({
        limit: req.body.limit || 1000000,
        attributes: ['id', 'name'],
        include: [{
            model: Profile,
            order: [['level', 'DESC']],
            attributes: ['id', 'level', 'username'],
            include: [{
                model: UserStyle
            }]
        }],
        where: {
            type: 1
        }
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.getPendingWithdrawalCount = async (req, res) => {
    try {
        const count = await Withdrawal.count({
            where: {
                status: 0
            }
        });

        return res.status(200).send({result: count});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getAverageWithdrawalMonthly = async (req, res) => {
    try {
        const now = new Date();
        const oldest = await Withdrawal.findOne({
            order: [['createdDate', 'ASC']]
        });
        const oldestDate = oldest.createdDate;

        let months;
        months = (now.getFullYear() - oldestDate.getFullYear()) * 12;
        months -= oldestDate.getMonth();
        months += now.getMonth();
        months = months < 0 ? 1 : months;

        const totalCount = await Withdrawal.count();

        return res.status(200).send({result: Math.floor(totalCount / months)});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}
