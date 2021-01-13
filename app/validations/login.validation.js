const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateLoginInput(data){
    let msg = [];

    try {
        // Email checks
        if(Validator.isEmpty(data.email)){
            msg.push("AUTH.VALIDATION.REQUIRED_EMAIL");
        }
        else if(!Validator.isEmail(data.email)){
            msg.push("AUTH.VALIDATION.WRONG_EMAIL");
        }

        // Password checks
        if(Validator.isEmpty(data.password)){
            msg.push("AUTH.VALIDATION.REQUIRED_PASSWORD");
        }

        return {
            msg: msg,
            isValid: isEmpty(msg)
        };
    } catch (e) {
        return  e;
    }
};
