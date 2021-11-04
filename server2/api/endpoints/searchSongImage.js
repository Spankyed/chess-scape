const Responses = require("../common/HTTP_Responses");
const { hooksWithSchema } = require("../common/hooks");
const fetch = require("node-fetch");
const HTMLParser = require("node-html-parser");

const schema = {
	body: { clientID: "string", title: "string" },
};

const handler = async (event) => {
	const { title } = event.body;
	try {
		const image = await getGoogleImage(title);
		// return Responses._200({ image: title });
		console.log('First google image search result: ', {image});
		return Responses._200({ image: JSON.stringify(image) });
	} catch (err) {
		console.error(err);
		return Responses._400({ error: err.message });
	}
};;

exports.handler = hooksWithSchema(schema, ["parse"])(handler);
// exports.handler = hooksWithSchema(schema, ["log", "parse", "authorize"])(handler);

async function getGoogleImage(search) {
	// console.time('fetch')
	const url =
		"https://www.google.com/search?tbm=isch&q=" +
		encodeURIComponent(search + " song");
	let page = await fetch(url);
	// console.timeEnd('fetch')
	let html = await page.text();
	let parsedPage = HTMLParser.parse(html);
	let img = parsedPage.querySelectorAll("img")[1].attributes.src;
	return img;
}