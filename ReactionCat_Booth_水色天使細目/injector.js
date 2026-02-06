#!/usr/bin/env node
/**
 * ReactionCat Injector
 * 
 * OBS縺ｮ繝ｪ繝｢繝ｼ繝医ョ繝舌ャ繧ｰ繝昴・繝医↓謗･邯壹＠縲・
 * YouTube繝√Ε繝・ヨ繝壹・繧ｸ縺ｫ繧ｹ繧ｯ繝ｪ繝励ヨ繧定・蜍墓ｳｨ蜈･縺吶ｋ繝・・繝ｫ
 * 
 * 窶ｻ 螟夜Κ繝ｩ繧､繝悶Λ繝ｪ荳堺ｽｿ逕ｨ迚茨ｼ・kg蟇ｾ蠢懶ｼ・
 */

const http = require('http');
const WebSocket = require('ws');

const CONFIG = {
    port: 9222,
    host: 'localhost',
    retryCount: 3,
    retryDelay: 1000
};

// obs-inject.js 縺ｮ蜀・ｮｹ繧堤峩謗･蝓九ａ霎ｼ縺ｿ
const INJECT_SCRIPT = `
(function () {
    'use strict';

    const CONFIG = {
        catUpUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-ben-up.png',
        catLeftUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-ben-left.png',
        catRightUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-ben-right.png',
        catBothUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-ben-both.png',
        bangDurationDefault: 150,
        bangDurationMin: 100,
        reactionWindow: 2000,
        highLoadThreshold: 10,
        maxSpeedFactor: 2,
        debug: true
    };

    const reactionTimestamps = [];
    let leftHandDown = false;
    let rightHandDown = false;

    function getCurrentBangDuration() {
        const now = Date.now();
        while (reactionTimestamps.length > 0 && now - reactionTimestamps[0] > CONFIG.reactionWindow) {
            reactionTimestamps.shift();
        }
        const recentCount = reactionTimestamps.length;
        if (recentCount >= CONFIG.highLoadThreshold) {
            const speedFactor = Math.min(recentCount / CONFIG.highLoadThreshold, CONFIG.maxSpeedFactor);
            const duration = Math.max(CONFIG.bangDurationMin, CONFIG.bangDurationDefault / speedFactor);
            if (CONFIG.debug) log('High load! ' + recentCount + ' reactions, duration: ' + Math.round(duration) + 'ms');
            return duration;
        }
        return CONFIG.bangDurationDefault;
    }

    function log(msg) {
        if (CONFIG.debug) console.log('[ReactionCat]', msg);
    }

    log('Starting ReactionCat (left/right independent mode)...');

    const style = document.createElement('style');
    style.textContent = \`
    #reaction-cat-container {
      position: fixed !important;
      bottom: 50px !important;
      right: 100px !important;
      width: 400px !important;
      height: 400px !important;
      z-index: -1 !important;
      pointer-events: none !important;
    }
    #reaction-cat-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center bottom;
    }
    \`;
    document.head.appendChild(style);
    log('Cat styles injected');

    const container = document.createElement('div');
    container.id = 'reaction-cat-container';

    const catImg = document.createElement('img');
    catImg.id = 'reaction-cat-img';
    catImg.src = CONFIG.catUpUrl;
    catImg.onerror = () => log('Image load error!');
    catImg.onload = () => log('Cat image loaded');

    container.appendChild(catImg);
    document.body.appendChild(container);
    log('Cat image added');

    const EMOJI_POSITIONS = {
        left: { right: '420px', bottom: '400px' },
        right: { right: '300px', bottom: '400px' }
    };

    function updateCatImage() {
        if (leftHandDown && rightHandDown) {
            catImg.src = CONFIG.catBothUrl;
            log('Cat: BOTH hands down');
        } else if (leftHandDown) {
            catImg.src = CONFIG.catLeftUrl;
            log('Cat: LEFT hand down');
        } else if (rightHandDown) {
            catImg.src = CONFIG.catRightUrl;
            log('Cat: RIGHT hand down');
        } else {
            catImg.src = CONFIG.catUpUrl;
            log('Cat: hands UP');
        }
    }

    let reactionQueue = [];
    let isAnimating = false;

    function getNextHand() {
        // 莠､莠偵↓蟾ｦ蜿ｳ繧呈険繧雁・縺代√◆縺縺励Λ繝ｳ繝繝諤ｧ繧ょｰ代＠谿九☆
        if (reactionQueue.length === 0) return null;
        return reactionQueue.shift();
    }

    function processQueue() {
        if (reactionQueue.length === 0) {
            isAnimating = false;
            leftHandDown = false;
            rightHandDown = false;
            updateCatImage();
            return;
        }

        isAnimating = true;
        const duration = getCurrentBangDuration();
        const upDuration = 100;

        // 繧ｭ繝･繝ｼ縺ｫ2縺､莉･荳翫≠縺｣縺ｦ縲∝ｷｦ蜿ｳ荳｡譁ｹ縺ゅｋ蝣ｴ蜷医・蜷梧凾蜃ｦ逅・
        let processedLeft = false;
        let processedRight = false;

        if (reactionQueue.length >= 2) {
            const leftIdx = reactionQueue.indexOf('left');
            const rightIdx = reactionQueue.indexOf('right');

            if (leftIdx !== -1 && rightIdx !== -1) {
                // 荳｡譁ｹ縺ゅｋ竊剃ｸ｡謇句酔譎ょ・逅・ｼ・
                reactionQueue.splice(Math.max(leftIdx, rightIdx), 1);
                reactionQueue.splice(Math.min(leftIdx, rightIdx), 1);
                processedLeft = true;
                processedRight = true;
                reactionTimestamps.push(Date.now());
                reactionTimestamps.push(Date.now());
                log('DUAL BANG! Processing both hands simultaneously (queue: ' + reactionQueue.length + ')');
            }
        }

        // 蜷梧凾蜃ｦ逅・〒縺阪↑縺九▲縺溷ｴ蜷医・1縺､縺縺大・逅・
        if (!processedLeft && !processedRight) {
            const hand = reactionQueue.shift();
            reactionTimestamps.push(Date.now());
            if (hand === 'left') {
                processedLeft = true;
            } else {
                processedRight = true;
            }
            log('Hand DOWN: ' + hand + ' (queue: ' + reactionQueue.length + ')');
        }

        // 邨ｵ譁・ｭ励・菴咲ｽｮ
        const fountain = document.querySelector('#emoji-fountain');
        if (fountain) {
            if (processedLeft && processedRight) {
                // 荳｡謇句酔譎・ 蟾ｦ縺九ｉ蜃ｺ縺励※縲∝ｰ代＠驕・ｌ縺ｦ蜿ｳ縺ｫ蛻・ｊ譖ｿ縺・
                fountain.style.setProperty('right', EMOJI_POSITIONS.left.right, 'important');
                fountain.style.setProperty('bottom', EMOJI_POSITIONS.left.bottom, 'important');
                setTimeout(() => {
                    fountain.style.setProperty('right', EMOJI_POSITIONS.right.right, 'important');
                    fountain.style.setProperty('bottom', EMOJI_POSITIONS.right.bottom, 'important');
                }, 50);
            } else if (processedLeft) {
                fountain.style.setProperty('right', EMOJI_POSITIONS.left.right, 'important');
                fountain.style.setProperty('bottom', EMOJI_POSITIONS.left.bottom, 'important');
            } else {
                fountain.style.setProperty('right', EMOJI_POSITIONS.right.right, 'important');
                fountain.style.setProperty('bottom', EMOJI_POSITIONS.right.bottom, 'important');
            }
        }

        // 閻輔ｒ荳九ｍ縺・
        leftHandDown = processedLeft;
        rightHandDown = processedRight;
        updateCatImage();

        setTimeout(() => {
            // 谺｡繧偵メ繧ｧ繝・け
            const nextHand = reactionQueue.length > 0 ? reactionQueue[0] : null;
            const needBothTransition = nextHand && (
                (processedLeft && !processedRight && nextHand === 'right') ||
                (processedRight && !processedLeft && nextHand === 'left')
            );

            if (needBothTransition) {
                // 繧ｹ繝繝ｼ繧ｺ縺ｪ荳｡謇矩・遘ｻ
                leftHandDown = true;
                rightHandDown = true;
                updateCatImage();
                log('BOTH hands down (smooth transition)');

                setTimeout(() => {
                    // 迴ｾ蝨ｨ蜃ｦ逅・＠縺滓焔繧剃ｸ翫￡繧・
                    if (processedLeft) leftHandDown = false;
                    if (processedRight) rightHandDown = false;
                    updateCatImage();
                    
                    setTimeout(() => {
                        processQueue();
                    }, upDuration);
                }, upDuration);
            } else {
                // 騾壼ｸｸ縺ｮ邨ゆｺ・
                leftHandDown = false;
                rightHandDown = false;
                updateCatImage();

                setTimeout(() => {
                    processQueue();
                }, upDuration);
            }
        }, duration);
    }

    function bang() {
        const hand = Math.random() > 0.5 ? 'left' : 'right';
        reactionQueue.push(hand);
        log('Reaction queued: ' + hand.toUpperCase() + ' (total: ' + reactionQueue.length + ')');

        // 繧ｭ繝･繝ｼ縺ｮ荳企剞繧定ｨｭ螳夲ｼ育┌髯舌↓貅懊∪繧峨↑縺・ｈ縺・↓・・
        if (reactionQueue.length > 50) {
            reactionQueue = reactionQueue.slice(-40);
            log('Queue trimmed to 40');
        }

        if (!isAnimating) {
            processQueue();
        }
    }

    function startObserving() {
        const fountain = document.querySelector('#emoji-fountain');
        if (!fountain) {
            log('emoji-fountain not found, retrying in 1s...');
            setTimeout(startObserving, 1000);
            return;
        }
        log('Watching #emoji-fountain');
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    log('Reaction detected!');
                    bang();
                    break;
                }
            }
        });
        observer.observe(fountain, {
            childList: true,
            subtree: true
        });
    }

    startObserving();
    log('ReactionCat ready (left/right independent mode)');

})();
`;

function printBanner() {
    console.log('');
    console.log('  笊ｭ笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笊ｮ');
    console.log('  笏・        棲 ReactionCat 棲          笏・);
    console.log('  笏・   YouTube Live Reaction Tool       笏・);
    console.log('  笊ｰ笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笊ｯ');
    console.log('');
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function findYouTubeChatTarget() {
    try {
        const targets = await httpGet(`http://${CONFIG.host}:${CONFIG.port}/json`);

        for (const target of targets) {
            if (target.url && target.url.includes('youtube.com/live_chat')) {
                return target;
            }
        }
        return null;
    } catch (err) {
        return null;
    }
}

async function injectScript(target) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        ws.on('open', () => {
            // Runtime.enable
            ws.send(JSON.stringify({
                id: 1,
                method: 'Runtime.enable'
            }));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());

            if (msg.id === 1) {
                // Runtime.evaluate
                ws.send(JSON.stringify({
                    id: 2,
                    method: 'Runtime.evaluate',
                    params: {
                        expression: INJECT_SCRIPT,
                        returnByValue: true
                    }
                }));
            } else if (msg.id === 2) {
                if (msg.result && msg.result.exceptionDetails) {
                    reject(new Error(msg.result.exceptionDetails.text));
                } else {
                    resolve(true);
                }
                ws.close();
            }
        });

        ws.on('error', (err) => {
            reject(err);
        });

        setTimeout(() => {
            reject(new Error('Timeout'));
            ws.close();
        }, 10000);
    });
}

async function main() {
    printBanner();

    console.log('  OBS縺ｫ謗･邯壻ｸｭ...');
    console.log('  繝昴・繝・ ' + CONFIG.port);
    console.log('');

    let target = null;

    for (let i = 0; i < CONFIG.retryCount; i++) {
        target = await findYouTubeChatTarget();

        if (target) {
            break;
        }

        if (i < CONFIG.retryCount - 1) {
            console.log('  YouTube繝√Ε繝・ヨ繝壹・繧ｸ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縲ょ・隧ｦ陦御ｸｭ... (' + (i + 1) + '/' + CONFIG.retryCount + ')');
            await sleep(CONFIG.retryDelay);
        }
    }

    if (!target) {
        console.log('');
        console.log('  笶・繧ｨ繝ｩ繝ｼ: YouTube繝√Ε繝・ヨ繝壹・繧ｸ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ');
        console.log('');
        console.log('  遒ｺ隱阪＠縺ｦ縺上□縺輔＞:');
        console.log('  1. OBS縺瑚ｵｷ蜍輔＠縺ｦ縺・ｋ');
        console.log('  2. OBS繧ｷ繝ｧ繝ｼ繝医き繝・ヨ縺ｫ莉･荳九・蠑墓焚縺瑚ｨｭ螳壹＆繧後※縺・ｋ:');
        console.log('     --remote-debugging-port=9222 --remote-allow-origins=http://localhost:9222');
        console.log('  3. 繝悶Λ繧ｦ繧ｶ繧ｽ繝ｼ繧ｹ縺ｧYouTube繝√Ε繝・ヨ繧帝幕縺・※縺・ｋ');
        console.log('     URL萓・ https://www.youtube.com/live_chat?v=VIDEO_ID&is_popout=1');
        console.log('');
        await waitForKeyPress();
        process.exit(1);
    }

    console.log('  笨・YouTube繝√Ε繝・ヨ繧呈､懷・縺励∪縺励◆');
    console.log('     URL: ' + target.url.substring(0, 60) + '...');
    console.log('');
    console.log('  繧ｹ繧ｯ繝ｪ繝励ヨ繧呈ｳｨ蜈･荳ｭ...');

    try {
        await injectScript(target);
        console.log('');
        console.log('  笊ｭ笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笊ｮ');
        console.log('  笏・ 笨・ReactionCat 襍ｷ蜍墓・蜉滂ｼ・         笏・);
        console.log('  笏・                                    笏・);
        console.log('  笏・ 迪ｫ縺後Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ縺ｫ蜿榊ｿ懊＠縺ｾ縺・棲    笏・);
        console.log('  笊ｰ笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笊ｯ');
        console.log('');
    } catch (err) {
        console.log('');
        console.log('  笶・繧ｹ繧ｯ繝ｪ繝励ヨ豕ｨ蜈･繧ｨ繝ｩ繝ｼ: ' + err.message);
        console.log('');
    }

    await waitForKeyPress();
}

function waitForKeyPress() {
    return new Promise(resolve => {
        console.log('  菴輔°繧ｭ繝ｼ繧呈款縺吶→邨ゆｺ・＠縺ｾ縺・..');

        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('data', () => {
                resolve();
            });
        } else {
            // Non-TTY迺ｰ蠅・ｼ医ム繝悶Ν繧ｯ繝ｪ繝・け螳溯｡梧凾縺ｪ縺ｩ・峨〒縺ｯ10遘貞ｾ・ｩ・
            setTimeout(resolve, 10000);
        }
    });
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

