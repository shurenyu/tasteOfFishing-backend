const db = require("../models");
const Notice = db.notice;

exports.registerNotice = (req, res) => {
    const newNotice = {
        content: req.body.content,
        createdDate: new Date(),
    };

    Notice.create(newNotice)
        .then(data => {
            return res.status(200).send({result: 'NOTICE_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(200).send({msg: err.toString()});
        })
};

exports.getAllNotice = (req, res) => {
    Notice.findAll()
        .then(data => {
            return res.status(200).send({result: data});
        }).catch(err => {
        return res.status(500).send({msg: err.toString()});
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
        return res.status(200).send({result: 'NOTICE_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};
