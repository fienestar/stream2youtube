(function(){
    'use strict';

    function getTimeID(date = new Date){
        return date.toISOString().slice(0, 15);
    }

    setInterval(async () => {
        const video_list = document.getElementsByTagName('video');
        if(video_list.length !== 1) return;

        const video = video_list[0];
        const timeString = document.getElementsByClassName('live-time')?.[0]?.innerText;
        if(video.paused || !timeString) return;

        const split = timeString.trim().split(':').map(v => parseInt(v, 10));
        const time = split[0] * 3600 + split[1] * 60 + split[2];
        const started = new Date(Date.now() - time * 1000);
        const id = window.location.pathname.slice(1);

        await chrome.storage.sync.set({
            [`live|${id}|${getTimeID(started)}`]: Date.now()
        });
    }, 5000);
})()
