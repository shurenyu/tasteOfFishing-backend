const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateRegisterInput(data){
	let msg = [];

	if(Validator.isEmpty(data.name)){
		msg.push("AUTH.VALIDATION.REQUIRED_NAME");
	}
	if(Validator.isEmpty(data.email)){
		msg.push("AUTH.VALIDATION.REQUIRED_EMAIL");
	} else if(!Validator.isEmail(data.email)){
		msg.push("AUTH.VALIDATION.WRONG_EMAIL");
	}
	if(Validator.isEmpty(data.password)){
		msg.push("AUTH.VALIDATION.REQUIRED_PASSWORD");
	}
	if(Validator.isEmpty(data.confirmPassword)){
		msg.push("AUTH.VALIDATION.REQUIRED_CONFIRM_PASSWORD");
	}
	if(!Validator.isLength(data.password, {min: 6, max: 30})){
		msg.push("AUTH.VALIDATION.MIN_PASSWORD_LENGTH");
	}
	if(!Validator.equals(data.password, data.confirmPassword)){
		msg.push("AUTH.VALIDATION.PASSWORD_NOT_MATCH");
	}

	return {
		msg: msg,
		isValid: isEmpty(msg),
	};
};
