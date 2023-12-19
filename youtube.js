(function () {
    'use strict';

    document.addEventListener("yt-navigate-start", removeTimeLink);
    document.addEventListener("yt-navigate-finish", async () => {
        'use strict';
        removeTimeLink();

        if (window.location.pathname !== '/watch') return;

        const meta = await getMetaData(window.location.href);
        if (!meta.isLiveBroadcast || !meta.endDate) return;

        const twitchID = await getTwitchID(meta.authorURL);
        const chzzkID = await getChzzkID(meta.authorURL);
        const tenMinutes = 10 * 60 * 1000;
        const twitchKeys = [];
        const chzzkKeys = [];
        if(twitchID !== null)
            for (let i = -3; i <= 3; ++i)
                twitchKeys.push(`live|${twitchID}|${getTimeID(new Date(meta.startDate.getTime() + i * tenMinutes))}`);
        if(chzzkID !== null)
            for (let i = -3; i <= 3; ++i)
                chzzkKeys.push(`live|${chzzkID}|${getTimeID(new Date(meta.startDate.getTime() + i * tenMinutes))}`);

        const result = await chrome.storage.sync.get([...twitchKeys, ...chzzkKeys]);
        let time = 0;
        let platform = null;
        for (const key of twitchKeys) {
            if(result[key] !== undefined && result[key] > time) {
                time = result[key];
                platform = 'twitch';
            }
        }

        for (const key of chzzkKeys) {
            if(result[key] !== undefined && result[key] > time) {
                time = result[key];
                platform = 'chzzk';
            }
        }

        if (platform === null) return;

        time = Math.max(0, Math.floor((time - meta.startDate.getTime()) / 1000));

        const owner = document.getElementById('owner');
        if (platform === 'twitch')
            owner.appendChild(createTwitchTimeLink(time));
        else if (platform === 'chzzk')
            owner.appendChild(createChzzkTimeLink(time));
    });

    function removeTimeLink() {
        document.getElementById('twitch-time-link')?.remove();
        document.getElementById('chzzk-time-link')?.remove();
    }

    function getTimeID(date = new Date) {
        return date.toISOString().slice(0, 15);
    }

    async function getTwitchID(youtubeAuthorURL) {
        const res = await fetch(`${youtubeAuthorURL}/about`);
        const text = await res.text();
        const match = text.match(/https%3A%2F%2Fwww\.twitch\.tv%2F(.+?)"/);
        if (!match) return null;
        return decodeURIComponent(match[1]);
    }

    async function getChzzkID(youtubeAuthorURL) {
        const res = await fetch(`${youtubeAuthorURL}/about`);
        const text = await res.text();
        const match = text.match(/https%3A%2F%2Fchzzk\.naver\.com%2F(?:live%2F)?(.+?)"/);
        if (!match) return null;
        return decodeURIComponent(match[1]);
    }

    function getYoutubeTimeString(time) {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor(time / 60) % 60;
        const seconds = time % 60;
        return `${hours
            }:${minutes.toString().padStart(2, '0')
            }:${seconds.toString().padStart(2, '0')
            }`;
    }

    async function getMetaData(url) {
        const res = await fetch(url);
        const html = await res.text();
        const dom = new DOMParser().parseFromString(html, "text/html")
        const content = dom.getElementById('watch7-content');

        let authorURL = content.querySelector('[itemprop="author"] > [itemprop="url"]')?.href;
        if (authorURL.startsWith('http://'))
            authorURL = authorURL.replace('http://', 'https://');

        const publication = content.querySelector('[itemprop="publication"]');
        const isLiveBroadcast = publication?.querySelector('[itemprop="isLiveBroadcast"]')?.content === "True"
        const publicationMeta = {};
        if (publication) {
            const startDate = publication.querySelector('[itemprop="startDate"]')?.content;
            const endDate = publication.querySelector('[itemprop="endDate"]')?.content;
            publicationMeta.startDate = startDate ? new Date(startDate) : null;
            publicationMeta.endDate = endDate ? new Date(endDate) : null
        }

        return {
            authorURL,
            isLiveBroadcast,
            ...publicationMeta
        }
    }

    function createTwitchTimeLink(time) {
        const div = document.createElement('div');
        div.id = 'twitch-time-link';
        div.style.height = '2rem';
        div.style.position = 'relative';
        div.style.marginLeft = '1rem';
        let search = window.location.search.slice(1).split('&').map(v => v.split('=')).filter(v => v[0] !== 't');
        search.push(['t', `${time}s`]);
        div.innerHTML = `
<img src="https://twitch.tv/favicon.ico" style="height: 2rem"/>
<a class="yt-simple-endpoint style-scope yt-formatted-string" spellcheck="false"
    href="/watch?${search.map(([key, value]) => `${key}=${value}`).join('&')}" dir="auto" style="font-size: 1.5rem;margin-left: 0.25rem;position: absolute;">
    ${getYoutubeTimeString(time)}
</a>`
        return div;
    }

    function createChzzkTimeLink(time) {
        const div = document.createElement('div');
        div.id = 'chzzk-time-link';
        div.style.height = '2rem';
        div.style.position = 'relative';
        div.style.marginLeft = '1rem';
        let search = window.location.search.slice(1).split('&').map(v => v.split('=')).filter(v => v[0] !== 't');
        search.push(['t', `${time}s`]);
        div.innerHTML = `
<img src="https://chzzk.naver.com/favicon.ico" style="height: 2rem"/>
<a class="yt-simple-endpoint style-scope yt-formatted-string" spellcheck="false"
    href="/watch?${search.map(([key, value]) => `${key}=${value}`).join('&')}" dir="auto" style="font-size: 1.5rem;margin-left: 0.25rem;position: absolute;">
    ${getYoutubeTimeString(time)}
</a>`
        return div;
    }
})();
