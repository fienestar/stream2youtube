(function(){
    'use strict';

    function getTimeID(date = new Date){
        return date.toISOString().slice(0, 15);
    }

    function getChannelID() {
        if(!location.pathname.startsWith('/live/')) throw new Error('Not live page');
        return location.pathname.split('/')[2];
    }

    async function getLiveDetail(){
        const content = await fetch(`https://api.chzzk.naver.com/service/v2/channels/${getChannelID()}/live-detail`)
            .then(v => v.json())
            .then(v => v.content);

        if(!content) throw new Error('failed to get live detail');
        return content;
    }

    async function getCachedLiveDetail() {
        const cache = getCachedLiveDetail.cache ??= {};
        const id = getChannelID();
        if(cache.id !== id || cache.time < Date.now() - 1000 * 60 * 5) {
            cache.id = id;
            cache.time = Date.now();
            cache.data = await getLiveDetail();
        }

        return cache.data;
    }

    setInterval(async () => {
        const video_list = document.getElementsByTagName('video');
        if(video_list.length !== 1) return;

        const video = video_list[0];
        const live_detail = await getCachedLiveDetail();
        if(video.paused || !live_detail) return;

        const started = new Date(JSON.parse(live_detail.livePlaybackJson).live.start);
        const id = getChannelID();

        await chrome.storage.sync.set({
            [`live|${id}|${getTimeID(started)}`]: Date.now()
        });
    }, 5000);
})()
