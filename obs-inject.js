/**
 * ReactionCat OBS Injection Script
 * 
 * このスクリプトをOBSの「対話」モードのコンソールに貼り付けて使用
 * または、ブラウザで直接実行
 */

(function () {
    'use strict';

    const CONFIG = {
        catUpUrl: 'https://yurunekoya.github.io/ReactionCat/bongo-cat-up.png',
        catDownUrl: 'https://yurunekoya.github.io/ReactionCat/bongo-cat-down.png',
        bangDuration: 100,
        bangCount: 3,
        debug: true
    };

    function log(msg) {
        if (CONFIG.debug) console.log('[ReactionCat]', msg);
    }

    log('Starting ReactionCat with images...');

    // スタイル注入
    const style = document.createElement('style');
    style.textContent = `
    * {
      background: rgba(0, 0, 0, 0) !important;
      border: none !important;
    }
    
    /* チャットUI非表示 */
    body > :not(yt-live-chat-app):not(#reaction-cat-container),
    yt-live-chat-app > :not(#contents),
    #content > yt-live-chat-renderer > :not(#content-pages),
    #content-pages > :not(#chat-messages),
    #chat-messages > :not(#contents),
    #chat-messages > #contents > :not(#panel-pages),
    #panel-pages > :not(#input-panel),
    #input-panel > yt-live-chat-message-input-renderer > :not(#container) { 
      display: none !important; 
    }
    #container > :not(#top) { display: none !important; }
    #avatar, #input-container, #right > #count-container,
    #right > #message-buttons { display: none !important; }
    
    /* リアクションボタン（ハートボタン）を非表示 */
    #reaction-control-panel,
    yt-reaction-control-panel-view-model,
    yt-reaction-control-panel-overlay-view-model > #reaction-control-panel { display: none !important; }
    
    /* リアクション噴水 - 猫より上のレイヤー */
    #emoji-fountain,
    #emoji-fountain * {
      z-index: 9999 !important;
    }
    #emoji-fountain {
      position: fixed !important;
      transform: scale(5) !important;
      /* right と bottom はJavaScriptで動的に設定 */
    }
    
    /* 猫コンテナ - 絵文字より後ろ（負のz-index） */
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
    log('Styles injected');

    // 猫画像を追加
    const container = document.createElement('div');
    container.id = 'reaction-cat-container';

    const catImg = document.createElement('img');
    catImg.id = 'reaction-cat-img';
    catImg.src = CONFIG.catUpUrl;  // 待機状態は手を上げた状態
    catImg.onerror = () => log('Image load error! Check localhost:3000');
    catImg.onload = () => log('Cat image loaded');

    container.appendChild(catImg);
    document.body.appendChild(container);
    log('Cat image added');

    // 絵文字位置設定（左手/右手）
    const EMOJI_POSITIONS = {
        left: { right: '500px', bottom: '320px' },   // 左手の位置（猫の幅分左）
        right: { right: '150px', bottom: '320px' }   // 右手の位置（少し左）
    };

    function setRandomEmojiPosition() {
        const fountain = document.querySelector('#emoji-fountain');
        if (!fountain) return;

        const side = Math.random() > 0.5 ? 'left' : 'right';
        const pos = EMOJI_POSITIONS[side];
        fountain.style.setProperty('right', pos.right, 'important');
        fountain.style.setProperty('bottom', pos.bottom, 'important');
        log('Emoji position: ' + side);
    }

    // 初期位置を設定
    function initEmojiPosition() {
        const fountain = document.querySelector('#emoji-fountain');
        if (fountain) {
            fountain.style.setProperty('right', '200px', 'important');
            fountain.style.setProperty('bottom', '320px', 'important');
            log('Initial emoji position set');
        }
    }
    setTimeout(initEmojiPosition, 500);

    // 叩きアニメーション
    let isAnimating = false;

    function bang() {
        if (isAnimating) return;
        isAnimating = true;
        log('Bang!');

        // 絵文字の位置をランダムに変更
        setRandomEmojiPosition();

        // 待機(up) → 叩く(down) → 待機(up) の1回のみ
        catImg.src = CONFIG.catDownUrl;  // 手を下ろす

        setTimeout(() => {
            catImg.src = CONFIG.catUpUrl;  // 手を上げて待機に戻る
            isAnimating = false;
        }, CONFIG.bangDuration);
    }

    // #emoji-fountain を監視
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

        log('MutationObserver started');
    }

    startObserving();

    // テスト用
    window.rcBang = bang;
    log('Ready! Test with: rcBang()');

})();
