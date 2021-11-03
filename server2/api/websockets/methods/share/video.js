module.exports = function handleVideo({ videoId }) {
	if (typeof videoId != "string") throw new Error("Invalid viedoId");
	return { method: "share", type: "video", videoId };
};