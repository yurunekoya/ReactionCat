#!/usr/bin/env node
/**
 * ReactionCat Injector
 * 
 * OBSのリモートデバッグポートに接続し、
 * YouTubeチャットページにスクリプトを自動注入するツール
 * 
 * ※ 外部ライブラリ不使用版（pkg対応）
 */

const http = require('http');
const WebSocket = require('ws');

const CONFIG = {
    port: 9222,
    host: 'localhost',
    retryCount: 3,
    retryDelay: 1000
};

// obs-inject.js の内容を直接埋め込み
const INJECT_SCRIPT = `
(function () {
    'use strict';

    const CONFIG = {
        catUpUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-bc-up.png',
        catLeftUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-bc-left.png',
        catRightUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-bc-right.png',
        catBothUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-bc-both.png',
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
        // 交互に左右を振り分け、ただしランダム性も少し残す
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

        // キューに2つ以上あって、左右両方ある場合は同時処理
        let processedLeft = false;
        let processedRight = false;

        if (reactionQueue.length >= 2) {
            const leftIdx = reactionQueue.indexOf('left');
            const rightIdx = reactionQueue.indexOf('right');

            if (leftIdx !== -1 && rightIdx !== -1) {
                // 両方ある→両手同時処理！
                reactionQueue.splice(Math.max(leftIdx, rightIdx), 1);
                reactionQueue.splice(Math.min(leftIdx, rightIdx), 1);
                processedLeft = true;
                processedRight = true;
                reactionTimestamps.push(Date.now());
                reactionTimestamps.push(Date.now());
                log('DUAL BANG! Processing both hands simultaneously (queue: ' + reactionQueue.length + ')');
            }
        }

        // 同時処理できなかった場合は1つだけ処理
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

        // 絵文字の位置
        const fountain = document.querySelector('#emoji-fountain');
        if (fountain) {
            if (processedLeft && processedRight) {
                // 両手同時: 左から出して、少し遅れて右に切り替え
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

        // 腕を下ろす
        leftHandDown = processedLeft;
        rightHandDown = processedRight;
        updateCatImage();

        setTimeout(() => {
            // 次をチェック
            const nextHand = reactionQueue.length > 0 ? reactionQueue[0] : null;
            const needBothTransition = nextHand && (
                (processedLeft && !processedRight && nextHand === 'right') ||
                (processedRight && !processedLeft && nextHand === 'left')
            );

            if (needBothTransition) {
                // スムーズな両手遷移
                leftHandDown = true;
                rightHandDown = true;
                updateCatImage();
                log('BOTH hands down (smooth transition)');

                setTimeout(() => {
                    // 現在処理した手を上げる
                    if (processedLeft) leftHandDown = false;
                    if (processedRight) rightHandDown = false;
                    updateCatImage();
                    
                    setTimeout(() => {
                        processQueue();
                    }, upDuration);
                }, upDuration);
            } else {
                // 通常の終了
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

        // キューの上限を設定（無限に溜まらないように）
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
    console.log('  ╭─────────────────────────────────────╮');
    console.log('  │         🐱 ReactionCat 🐱          │');
    console.log('  │    YouTube Live Reaction Tool       │');
    console.log('  ╰─────────────────────────────────────╯');
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

    console.log('  OBSに接続中...');
    console.log('  ポート: ' + CONFIG.port);
    console.log('');

    let target = null;

    for (let i = 0; i < CONFIG.retryCount; i++) {
        target = await findYouTubeChatTarget();

        if (target) {
            break;
        }

        if (i < CONFIG.retryCount - 1) {
            console.log('  YouTubeチャットページが見つかりません。再試行中... (' + (i + 1) + '/' + CONFIG.retryCount + ')');
            await sleep(CONFIG.retryDelay);
        }
    }

    if (!target) {
        console.log('');
        console.log('  ❌ エラー: YouTubeチャットページが見つかりません');
        console.log('');
        console.log('  確認してください:');
        console.log('  1. OBSが起動している');
        console.log('  2. OBSショートカットに以下の引数が設定されている:');
        console.log('     --remote-debugging-port=9222 --remote-allow-origins=http://localhost:9222');
        console.log('  3. ブラウザソースでYouTubeチャットを開いている');
        console.log('     URL例: https://www.youtube.com/live_chat?v=VIDEO_ID&is_popout=1');
        console.log('');
        await waitForKeyPress();
        process.exit(1);
    }

    console.log('  ✅ YouTubeチャットを検出しました');
    console.log('     URL: ' + target.url.substring(0, 60) + '...');
    console.log('');
    console.log('  スクリプトを注入中...');

    try {
        await injectScript(target);
        console.log('');
        console.log('  ╭─────────────────────────────────────╮');
        console.log('  │  ✅ ReactionCat 起動成功！          │');
        console.log('  │                                     │');
        console.log('  │  猫がリアクションに反応します 🐱    │');
        console.log('  ╰─────────────────────────────────────╯');
        console.log('');
    } catch (err) {
        console.log('');
        console.log('  ❌ スクリプト注入エラー: ' + err.message);
        console.log('');
    }

    await waitForKeyPress();
}

function waitForKeyPress() {
    return new Promise(resolve => {
        console.log('  何かキーを押すと終了します...');

        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('data', () => {
                resolve();
            });
        } else {
            // Non-TTY環境（ダブルクリック実行時など）では10秒待機
            setTimeout(resolve, 10000);
        }
    });
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
