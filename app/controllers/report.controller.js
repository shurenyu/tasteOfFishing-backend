const db = require("../models");
const Report = db.report;
const User = db.user;
const Fish = db.fish;
const FishType = db.fishType;
const FishImage = db.fishImage;
const Post = db.post;
const PostImage = db.postImage;

exports.registerReport = (req, res) => {
    const newReport = {
        userId: req.body.userId,
        reporterId: req.body.reporterId,
        type: req.body.type,
        content: req.body.content,
        postId: req.body.postId,
        fishId: req.body.fishId,
        status: 1, 
        createdDate: new Date(),
        updatedDate: new Date(),
    };

    Report.create(newReport)
        .then(data => {
            return res.status(200).send({result: 'REPORT_REGISTER_SUCCESS', data: data.id});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.getAllReports = (req, res) => {
    Report.findAll()
        .then(data => {
            return res.status(200).send({result: data});
        }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getReportById = (req, res) => {
    const reportId = req.body.reportId;
    Report.findOne({
        where: {id: reportId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getReportByUser = (req, res) => {
    const userId = req.body.userId;
    Report.findAll({
        where: {userId: userId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getReportByReporter = (req, res) => {
    const reporterId = req.body.reporterId;
    Report.findAll({
        where: {reporterId: reporterId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.updateReport = async (req, res) => {
    const reportId = req.body.reportId;

    try {
        const report = await Report.findOne({
            where: {id: reportId}
        });

        if (!report) {
            return res.status(404).send({msg: 'REPORT_NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        for (const key of keys) {
            if (key !== 'reportId') {
                report[key] = req.body[key];
            }
        }
        await report.save();

        return res.status(200).send({result: 'REPORT_UPDATE_SUCCESS'});

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.deleteReport = (req, res) => {
    const reportId = req.body.reportId;

    Report.destroy({
        where: {id: reportId}
    }).then(data => {
        if (data === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: 'REPORT_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getReportByFilter = (req, res) => {

    let filter = {};
    if (req.body.status) filter.status = req.body.status;

    Report.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        where: filter,
        include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name']
        }, {
            model: User,
            as: 'reporter',
            attributes: ['id', 'name']
        }, {
            model: Fish,
            attributes: ['id', 'fishWidth'],
            include: [{
                model: FishImage,
            }, {
                model: FishType,
            }]
        }, {
            model: Post,
            include: [{
                model: PostImage,
            }]
        }]
    }).then(async data => {
        const count = await Report.count({where: filter});
        return res.status(200).send({result: data, totalCount: count});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}
