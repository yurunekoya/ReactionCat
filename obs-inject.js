/**
 * ReactionCat OBS Injection Script
 * 
 * 左右独立アニメーション対応版
 * - 左手のみ叩き: reaction-cat-left.png
 * - 右手のみ叩き: reaction-cat-right.png
 * - 両手叩き: reaction-cat-both.png
 */

(function () {
    'use strict';

    const CONFIG = {
        catUpUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-bc-up.png',
        catLeftUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-bc-left.png',
        catRightUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-bc-right.png',
        catBothUrl: 'https://yurunekoya.github.io/ReactionCat/nekopng/reaction-cat-bc-both.png',
        bangDurationDefault: 150,
        bangDurationMin: 50,
        reactionWindow: 2000,
        highLoadThreshold: 5,
        debug: true
    };

    const reactionTimestamps = [];

    // 左右の手の状態
    let leftHandDown = false;
    let rightHandDown = false;

    function getCurrentBangDuration() {
        const now = Date.now();
        while (reactionTimestamps.length > 0 && now - reactionTimestamps[0] > CONFIG.reactionWindow) {
            reactionTimestamps.shift();
        }

        const recentCount = reactionTimestamps.length;

        if (recentCount >= CONFIG.highLoadThreshold) {
            const speedFactor = Math.min(recentCount / CONFIG.highLoadThreshold, 4);
            const duration = Math.max(
                CONFIG.bangDurationMin,
                CONFIG.bangDurationDefault / speedFactor
            );
            if (CONFIG.debug) log('High load! ' + recentCount + ' reactions, duration: ' + Math.round(duration) + 'ms');
            return duration;
        }

        return CONFIG.bangDurationDefault;
    }

    function log(msg) {
        if (CONFIG.debug) console.log('[ReactionCat]', msg);
    }

    log('Starting ReactionCat (left/right independent mode)...');

    // 猫のみのスタイル注入
    const style = document.createElement('style');
    style.textContent = `
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
    `;
    document.head.appendChild(style);
    log('Cat styles injected');

    // 猫画像を追加
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

    // 絵文字位置設定（左手/右手）
    const EMOJI_POSITIONS = {
        left: { right: '460px', bottom: '500px' },
        right: { right: '220px', bottom: '445px' }
    };

    // 猫画像を更新
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

    // 左右のキュー
    let leftQueue = 0;
    let rightQueue = 0;
    let leftAnimating = false;
    let rightAnimating = false;

    function processLeftBang() {
        if (leftQueue <= 0) {
            leftHandDown = false;
            leftAnimating = false;
            updateCatImage();
            return;
        }

        leftQueue--;
        leftAnimating = true;
        leftHandDown = true;
        reactionTimestamps.push(Date.now());

        const duration = getCurrentBangDuration();
        const upDuration = 50;

        // 絵文字位置を左に設定
        const fountain = document.querySelector('#emoji-fountain');
        if (fountain) {
            fountain.style.setProperty('right', EMOJI_POSITIONS.left.right, 'important');
            fountain.style.setProperty('bottom', EMOJI_POSITIONS.left.bottom, 'important');
        }

        updateCatImage();

        setTimeout(() => {
            leftHandDown = false;
            updateCatImage();

            setTimeout(() => {
                processLeftBang();
            }, upDuration);
        }, duration);
    }

    function processRightBang() {
        if (rightQueue <= 0) {
            rightHandDown = false;
            rightAnimating = false;
            updateCatImage();
            return;
        }

        rightQueue--;
        rightAnimating = true;
        rightHandDown = true;
        reactionTimestamps.push(Date.now());

        const duration = getCurrentBangDuration();
        const upDuration = 50;

        // 絵文字位置を右に設定
        const fountain = document.querySelector('#emoji-fountain');
        if (fountain) {
            fountain.style.setProperty('right', EMOJI_POSITIONS.right.right, 'important');
            fountain.style.setProperty('bottom', EMOJI_POSITIONS.right.bottom, 'important');
        }

        updateCatImage();

        setTimeout(() => {
            rightHandDown = false;
            updateCatImage();

            setTimeout(() => {
                processRightBang();
            }, upDuration);
        }, duration);
    }

    function bang() {
        // ランダムに左右を振り分け
        if (Math.random() > 0.5) {
            leftQueue++;
            log('Reaction queued: LEFT (pending: ' + leftQueue + ')');
            if (!leftAnimating) {
                processLeftBang();
            }
        } else {
            rightQueue++;
            log('Reaction queued: RIGHT (pending: ' + rightQueue + ')');
            if (!rightAnimating) {
                processRightBang();
            }
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
