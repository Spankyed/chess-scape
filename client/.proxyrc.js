// https://stackoverflow.com/a/68664795/8723748
https: module.exports = function (app) {
	app.use((req, res, next) => {
		res.removeHeader("Cross-Origin-Resource-Policy");
		res.removeHeader("Cross-Origin-Embedder-Policy");
		next();
	});
};
