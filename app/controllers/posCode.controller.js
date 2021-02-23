const db = require("../models");
const PosCode = db.posCode;

exports.getPositionCode = (req, res) => {

    PosCode.findAll()
        .then(async data => {
            return res.status(200).send({result: data});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.getPositionCodeByFilter = async (req, res) => {
    const lat = req.body.latitude;
    const lng = req.body.longitude;

    try {
        const [results1, metadata1] = await db.sequelize.query(`SELECT *, (6371 * acos(cos( radians( ${lat} ) ) * cos( radians( posCodes.latitude ) ) * cos( radians( posCodes.longitude ) - radians( ${lng} ) ) + sin ( radians( ${lat} ) ) * sin( radians ( posCodes.latitude ) ))) AS distance FROM posCodes ORDER BY distance LIMIT 1;`)
        const [results2, metadata2] = await db.sequelize.query(`SELECT *, (6371 * acos(cos( radians( ${lat} ) ) * cos( radians( admCodes.latitude ) ) * cos( radians( admCodes.longitude ) - radians( ${lng} ) ) + sin ( radians( ${lat} ) ) * sin( radians ( admCodes.latitude ) ))) AS distance FROM admCodes ORDER BY distance LIMIT 1;`)

        return res.status(200).send({results1: results1, results2: results2});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}
