message = {
    event: 'listening',
    id: currentFrameId,
    channel: 'widget'
}
message = {
    event: "command",
    func: "addEventListener",
    args: ["onStateChange"],
    id: currentFrameId,
    channel: "widget"
}


var frame = document.querySelector('iframe');
var controls = document.querySelectorAll('.video-control');

var message = function(func) {
  return JSON.stringify({
    event: 'command',
    func: func,
    args: []
  });
};
var execCommand = function(frame) {
  return (func) => () => frame.contentWindow.postMessage(message(func), '*') 
};
var frameCommand = execCommand(frame);

var configControl = function(vc) {
  console.log('vc',vc)
  var func = vc.getAttribute('data-func');
  var handler = frameCommand(func);
  vc.tabIndex = 0;
  vc.addEventListener('click', handler, false);
};

[].forEach.call(controls, configControl);

/*
apiInterface[
    "cueVideoById",
    "loadVideoById",
    "cueVideoByUrl",
    "loadVideoByUrl",
    "playVideo",
    "pauseVideo",
    "stopVideo",
    "clearVideo",
    "getVideoBytesLoaded",
    "getVideoBytesTotal",
    "getVideoLoadedFraction",
    "getVideoStartBytes",
    "cuePlaylist",
    "loadPlaylist",
    "nextVideo",
    "previousVideo",
    "playVideoAt",
    "setShuffle",
    "setLoop",
    "getPlaylist",
    "getPlaylistIndex",
    "getPlaylistId",
    "loadModule",
    "unloadModule",
    "setOption",
    "getOption",
    "getOptions",
    "mute",
    "unMute",
    "isMuted",
    "setVolume",
    "getVolume",
    "seekTo",
    "getPlayerState",
    "getPlaybackRate",
    "setPlaybackRate",
    "getAvailablePlaybackRates",
    "getPlaybackQuality",
    "setPlaybackQuality",
    "getAvailableQualityLevels",
    "getCurrentTime",
    "getDuration",
    "addEventListener",
    "removeEventListener",
    "getDebugText",
    "getVideoData",
    "addCueRange",
    "removeCueRange",
    "setSize",
    "getApiInterface",
    "destroy",
    "showVideoInfo",
    "hideVideoInfo",
    "isVideoInfoVisible",
    "getSphericalProperties",
    "setSphericalProperties",
    "getVideoEmbedCode",
    "getVideoUrl",
    "getMediaReferenceTime"
]
*/