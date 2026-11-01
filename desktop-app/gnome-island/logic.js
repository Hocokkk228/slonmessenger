// Чистые функции: поиск и синхронизация текста.
export function parseLrc(text) {
    const lines = [];
    for (const raw of String(text || '').split(/\r?\n/)) {
        const stamps = [...raw.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
        const words = raw.replace(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g, '').trim();
        for (const m of stamps) lines.push({time: +m[1] * 60 + +m[2] + (m[3] ? Number('0.' + m[3]) : 0), text: words});
    }
    return lines.sort((a, b) => a.time - b.time);
}
export function lineAt(lines, position, duration) {
    let i = -1;
    for (let n = 0; n < lines.length && lines[n].time <= position; n++) i = n;
    if (i < 0) return {index: -1, progress: 0};
    const end = lines[i + 1]?.time ?? (duration > lines[i].time ? duration : lines[i].time + 4);
    return {index: i, progress: Math.max(0, Math.min(1, (position - lines[i].time) / Math.max(0.2, end - lines[i].time)))};
}
export function choosePlayer(rows, previous) {
    const valid = rows.filter(r => r.instance && r.title && (r.status === 'Playing' || r.status === 'Paused'));
    return valid.find(r => r.instance === previous && r.status === 'Playing') || valid.find(r => r.status === 'Playing') || valid.find(r => r.instance === previous) || valid[0] || null;
}
export function pickLyrics(items, title, artist) {
    const clean = s => String(s || '').toLowerCase().replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const t = clean(title), artists = clean(artist).split(/\s+/).filter(x => x.length > 1);
    const score = x => {
        const xt=clean(x.trackName || x.name), xa=clean(x.artistName);
        const titleScore=xt===t?4:(xt.includes(t)||t.includes(xt))&&xt?2:0;
        const artistScore=artists.some(a=>xa.includes(a))?1:0;
        return titleScore+artistScore;
    };
    return (Array.isArray(items)?items:[]).filter(x => (x.syncedLyrics || x.plainLyrics) && score(x)>=2)
        .sort((a,b)=>score(b)-score(a)||Number(!!b.syncedLyrics)-Number(!!a.syncedLyrics))[0] || null;
}
