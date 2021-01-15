module.exports = {
	// HOST: "54.180.210.166",
	HOST: "127.0.0.1",
	USER: "fishing_user",
	PASSWORD: "fishing_password",
	DB: "fishing_db",
	dialect: "mysql",
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	}
};
