// https://stackoverflow.com/a/54646877/8723748
{/* <iframe id="player" src="https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1"></iframe> */}
var addYoutubeEventListener = (function() {

    var callbacks = [];
    var iframeId = 0;

    return function (iframe, callback) {
        // init message listener that will receive onStateChange messages from youtube iframes
        if(iframeId === 0) {
            window.addEventListener("message", function (e) {
                if(e.origin !== "https://www.youtube.com" || e.data === undefined) return;
                try {
                    var data = JSON.parse(e.data);
                    if(data.event !== 'onStateChange') return;
                    var callback = callbacks[data.id];
                    callback(data);
                }
                catch(e) {}
            });
        }

        // store callback
        iframeId++;
        callbacks[iframeId] = callback;
        var currentFrameId = iframeId;

        // sendMessage to frame to start receiving messages
        iframe.addEventListener("load", function () {
            var message = JSON.stringify({
                event: 'listening',
                id: currentFrameId,
                channel: 'widget'
            });
            iframe.contentWindow.postMessage(message, 'https://www.youtube.com');

            message = JSON.stringify({
                event: "command",
                func: "addEventListener",
                args: ["onStateChange"],
                id: currentFrameId,
                channel: "widget"
            });
            iframe.contentWindow.postMessage(message, 'https://www.youtube.com');
        });
    }
})();

addYoutubeEventListener(document.getElementById("player"), function(e) {

    switch(e.info) {
        case 1:
            // playing
            break;
        case 0:
            // ended
            break;
    }
});