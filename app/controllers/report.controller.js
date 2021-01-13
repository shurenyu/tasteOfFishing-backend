const db = require("../models");
const Report = db.report;

exports.registerReport = (req, res) => {
    const newReport = {
        userId: req.body.userId,
        reporterId: req.body.reporterId,
        content: req.body.content,
        createdDate: new Date(),
    };

    Report.create(newReport)
        .then(data => {
            return res.status(200).send({result: 'REPORT_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(200).send({msg: err.toString()});
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
        return res.status(200).send({msg: err.toString()});
    })
};

exports.getReportByUser = (req, res) => {
    const userId = req.body.userId;
    Report.findAll({
        where: {userId: userId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
};

exports.getReportByReporter = (req, res) => {
    const reporterId = req.body.reporterId;
    Report.findAll({
        where: {reporterId: reporterId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
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
        return res.status(200).send({result: 'REPORT_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};
