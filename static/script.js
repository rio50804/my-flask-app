// ==========================================
// グローバル変数（プログラム全体で使う変数）
// ==========================================
let charArray = [];            // キャラクターのデータを格納する配列
let currentCarouselIndex = 0;  // 現在カルーセル（円状の選択枠）で中央にきているキャラのインデックス番号
let selectedCharId = null;     // 選択されたキャラクターのID

//キャラクターごとのtruth時エンディング動画リスト
const truthVideos = {
    "ricky": "/static/videos/ricky_ending.mp4",        
    "関根": "/static/videos/sekine_ending.mp4",        
    "かんな": "/static/videos/matukan_wedding.mp4",    
    "Dalan": "/static/videos/dalan_ending.mp4",        
    "りょう": "/static/videos/ryou_ending.mp4",        
    "下呂成": "/static/videos/geronari_ending.mp4",    
    "富海子": "/static/videos/iitaka_wedding.mp4",      
    "sakura": "/static/videos/sakura_wedding.mp4"       
};

// ▼ 新しく追加：キャラクターごとのliar時専用画像リスト ▼
const liarImages = {
    "ricky": "/static/images/ricky_liar.png",
    "関根": "/static/images/sekine_liar.png",
    "かんな": "/static/images/kanna_liar.png",
    "Dalan": "/static/images/dalan_liar.png",
    "りょう": "/static/images/ryou_liar.png",
    "下呂成": "/static/images/geronari_liar.png",
    "富海子": "/static/images/iitaka_liar.png",
    "sakura": "/static/images/sakura_liar.png"
};

// ▼ 新しく追加：リベンジ成功時の土下座（制裁完了）画像リスト ▼
const dogezaImages = {
    "ricky": "/static/images/ricky_dogeza.png",
    "関根": "/static/images/sekine_dogeza.png",
    "かんな": "/static/images/kanna_dogeza.png",
    "Dalan": "/static/images/dalan_dogeza.png",
    "りょう": "/static/images/ryou_dogeza.png",
    "下呂成": "/static/images/geronari_dogeza.png",
    "富海子": "/static/images/iitaka_dogeza.png",
    "sakura": "/static/images/sakura_dogeza.png"
};
// ==========================================
// ページ読み込み完了時に実行される処理
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. HTMLに埋め込まれたキャラクターデータを取得して配列に変換
    const charDataEl = document.getElementById('char-data');
    if (charDataEl) {
        // JSON文字列をJavaScriptのオブジェクトに変換
        const charDataObj = JSON.parse(charDataEl.getAttribute('data-characters'));
        charArray = Object.values(charDataObj); // オブジェクトから配列に変換
        initCarousel(); // カルーセル（キャラクター選択画面）を初期化
    }
    
    // 2. ランキング表をサーバーから取得して表示
    loadRanking(); 

    // 3. リベンジゲームから戻ってきた時の結果処理
    const revengeDataEl = document.getElementById('revenge-data');
    if (revengeDataEl) {
        const resultRaw = revengeDataEl.getAttribute('data-result');
        if (resultRaw !== "null") {
            const revengeResult = JSON.parse(resultRaw);
            // ログイン画面を隠して、結果画面を直接表示する
            document.getElementById("login-screen").classList.remove("active");
            handleRevengeResult(revengeResult);
        }
    }
});

// ==========================================
// カルーセル（キャラクター選択）関連の関数
// ==========================================

// カルーセルの初期化（HTML要素の生成）
function initCarousel() {
    const container = document.getElementById("carousel-container");
    container.innerHTML = ""; // 中身を一旦リセット
    
    charArray.forEach((char, i) => {
        const el = document.createElement("div");
        el.classList.add("carousel-item");
        // 画像がない場合はダミー画像をセット
        const imageUrl = char.image || 'https://via.placeholder.com/100/555555/FFFFFF?text=?'; 
        el.style.backgroundImage = `url('${imageUrl}')`;
        // クリックされたら、そのキャラを中央にする
        el.onclick = () => { currentCarouselIndex = i; updateCarousel(); };
        container.appendChild(el);
    });
    updateCarousel(); // 配置を計算して並べる
}

// カルーセルを回転させる（引数dirには +1 や -1 が入る想定）※現在はクリックで直接選択するため未使用かも
function rotateCarousel(dir) {
    currentCarouselIndex = (currentCarouselIndex + dir + charArray.length) % charArray.length;
    updateCarousel();
}

// カルーセルのアイコン位置や大きさを計算して更新する
function updateCarousel() {
    const items = document.querySelectorAll(".carousel-item");
    
    // ▼ 円の半径を小さくして重ならないようにする（90 から 55 に変更） ▼
    const radius = 55; 
    
    // 円の中心座標をコンテナのサイズから計算
    const centerX = document.getElementById("carousel-container").offsetWidth / 2;
    const centerY = document.getElementById("carousel-container").offsetHeight / 2;
    
    items.forEach((item, i) => {
        // キャラを円状に均等配置するための角度計算
        const angleStep = (2 * Math.PI) / charArray.length;
        const angle = angleStep * (i - currentCarouselIndex);
        
        // 三角関数（sin, cos）を使ってX座標とY座標を割り出す
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        item.style.left = `${x}px`;
        item.style.top = `${y}px`;
        
        // 中央にきている（選択中の）キャラクターの場合の処理
        if (i === currentCarouselIndex) {
            item.classList.add("active");
            item.style.transform = "translate(-50%, -50%) scale(1.3)"; // アクティブ時の拡大率も少し調整
            item.style.zIndex = 10; // 一番手前に表示
            updateProfile(charArray[i]); // 下部のプロフィール表示を更新
            selectedCharId = charArray[i].id; // 選択中IDを保持
        } 
        // それ以外のキャラクターの場合の処理
        else {
            item.classList.remove("active");
            // 遠くにあるアイコンほど小さく見せる計算
            const scale = 0.6 + 0.4 * Math.cos(angle); 
            item.style.transform = `translate(-50%, -50%) scale(${scale})`;
            item.style.zIndex = Math.round(scale * 10); // 奥行き（重なり順）を設定
        }
    });
}

// 選択中のキャラクタープロフィールを画面に反映させる
function updateProfile(char) {
    const imageUrl = char.image || 'https://via.placeholder.com/100/555555/FFFFFF?text=?';
    document.getElementById("main-profile-img").style.backgroundImage = `url('${imageUrl}')`;
    document.getElementById("main-profile-name").textContent = char.name;
    document.getElementById("main-profile-job").textContent = `${char.age}歳 / ${char.job}`;
    document.getElementById("main-profile-bio").textContent = char.bio;
}

// ==========================================
// ランキング関連の関数
// ==========================================

// サーバーからランキングを取得してリストに表示
async function loadRanking() {
    const res = await fetch("/api/ranking");
    const data = await res.json();
    const list = document.getElementById("ranking-list");
    list.innerHTML = ""; // リストを初期化
    
    let displayRank = 0;      // 表示する順位（最初は0にしておく）
    let previousScore = null; // 直前の人のスコアを記録する用
    
    data.forEach((entry, index) => {
        // スコアが直前の人と同じでない場合のみ、順位を1つ繰り上げる
        if (entry.score !== previousScore) {
            displayRank++;
        }
        
        const li = document.createElement("li");
        li.innerHTML = `<span class="rank">${displayRank}</span><span class="name">${entry.name}</span><span class="score">${entry.score} pts</span>`;
        list.appendChild(li);
        
        // 次のループでの比較用に、現在のスコアを記録
        previousScore = entry.score;
    });
}

// ランキングをリセットする
async function resetRanking() {
    if(!confirm("本当にランキングをリセットしますか？\n（この操作は取り消せません）")) return;
    await fetch("/api/ranking/reset", { method: "POST" });
    loadRanking(); // リセット後に再読み込みして表示を空にする
}

// ==========================================
// ゲーム進行・チャット関連の関数
// ==========================================

// プレイヤー名をサーバーに登録する（SYSTEM LOGINボタン）
async function registerName() {
    const nameInput = document.getElementById("player-name").value.trim();
    if (!nameInput) { alert("名前を入力してください"); return; }
    
    try {
        const response = await fetch('/register_name', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameInput })
        });
        const data = await response.json();
        
        if (data.status === "error") {
            // エラーメッセージを表示する
            const errorMsgElement = document.getElementById('error-message');
            errorMsgElement.textContent = data.message; 
            errorMsgElement.style.opacity = 1; 
            
            // 3秒後にフェードアウトさせる
            setTimeout(() => {
                errorMsgElement.style.transition = "opacity 1s";
                errorMsgElement.style.opacity = 0;
            }, 3000);
        } else {
            // 成功した場合はスタンバイ画面へ切り替え
            document.getElementById("login-screen").classList.remove("active");
            document.getElementById("standby-screen").classList.add("active");
        }
    } catch (e) {
        console.error("名前登録エラー:", e);
    }
}

// ターゲットを決定してゲーム（チャット）を開始する
async function confirmSelection() {
    // 名前登録が済んでいない場合は警告
    if (!document.getElementById("standby-screen").classList.contains("active")) {
        alert("先に中央の画面でプレイヤー名を登録（SYSTEM LOGIN）してください！"); return;
    }
    
    // キャラクターが選択されていればサーバーに開始を通知
    if(selectedCharId) {
        const res = await fetch("/start_game", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ char_id: selectedCharId })
        });
        const data = await res.json();
        
        if (data.status === "started") {
            // 画面をチャット画面へ切り替え
            document.getElementById("standby-screen").classList.remove("active");
            document.getElementById("game-screen").classList.add("active");
            
            // チャットヘッダーに相手の情報をセット
            document.getElementById("target-name").textContent = data.character.name;
            document.getElementById("target-job").textContent = `${data.character.age}歳 / ${data.character.job}`;
            const imageUrl = data.character.image || 'https://via.placeholder.com/100/555555/FFFFFF?text=?';
            document.getElementById("target-icon").style.backgroundImage = `url('${imageUrl}')`;
            
            // システムメッセージ（接続完了など）をチャット欄に追加
            addMessage(`SYSTEM: ${data.message}`, "system-msg");
        }
    }
}

// チャット欄に吹き出しを追加する共通関数
function addMessage(text, className) {
    const chatBox = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.classList.add("message", className); // classNameには 'user-msg', 'ai-msg', 'system-msg' などが入る
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight; // 新しいメッセージが出たら一番下まで自動スクロール
}

// 固定の質問ボタン（トピック）を押した時の処理
async function sendTopic(topicType) {
    const btn = document.getElementById(`btn-${topicType}`);
    btn.disabled = true; // 同じ質問を連打できないようにボタンを無効化
    
    // ボタンのテキストから「① 」などを取り除いてユーザーのメッセージとして表示
    addMessage(btn.innerText.replace(/^[①②③]\s/, ""), "user-msg");
    document.getElementById("typing-indicator").classList.remove("hidden"); // 「Typing...」を表示
    
    const res = await fetch("/chat_topic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicType })
    });
    const data = await res.json();
    
    document.getElementById("typing-indicator").classList.add("hidden"); // 「Typing...」を隠す
    
    // 少し遅延させてから相手の返答を表示し、メーターを増やす（人間らしさの演出）
    setTimeout(() => { 
        addMessage(data.response, "ai-msg"); 
        increaseSuspicion(); 
    }, 500);
}

// SUSPICION（疑惑）メーターのゲージを伸ばす演出
function increaseSuspicion() {
    const meter = document.getElementById("meter-fill");
    let currentWidth = parseFloat(meter.style.width) || 0;
    let newWidth = Math.min(currentWidth + 20, 80); // 最大80%まで増える
    meter.style.width = `${newWidth}%`;
}

// ==========================================
// 結果判定・リベンジゲーム関連の関数
// ==========================================

// 「嘘つきと告発」または「本気と信じる」ボタンを押した時の判定処理
async function makeDecision(guess) {
    if(!confirm("ファイナルアンサー？")) return; // 確認ダイアログ
    
    // 演出：メーターを真っ赤にしてMAXにする
    const meter = document.getElementById("meter-fill");
    meter.style.transition = "width 1.5s ease-in-out"; 
    meter.style.width = "100%"; 
    meter.style.background = "red";
    
    // プレイヤーの予想（'truth' か 'liar'）をサーバーに送り、答え合わせをする
    const res = await fetch("/accuse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: guess })
    });
    const data = await res.json();
    
    // 演出のために少し待ってから結果画面を表示
    setTimeout(() => { showResultScreen(data); }, 1500);
}

// 尋問フェーズの結果（WIN/LOSE）を表示する
function showResultScreen(data) {
    document.getElementById("game-screen").classList.remove("active");
    const screen = document.getElementById("result-screen");
    screen.classList.add("active");
    
    const title = document.getElementById("result-title");
    const visual = document.getElementById("result-visual");
    
    if (data.win) {
        // 予想が的中した場合
        title.innerText = "YOU WIN"; title.style.color = "#00f2ff";
        visual.innerText = "WIN"; visual.style.color = "#00f2ff"; visual.style.border = "4px solid #00f2ff";
    } else {
        // 予想が外れた場合
        title.innerText = "YOU LOSE"; title.style.color = "#ff0055";
        visual.innerText = "LOSE"; visual.style.color = "#ff0055"; visual.style.border = "4px solid #ff0055";
    }
    
    const msgEl = document.getElementById("result-msg");
    const roleEl = document.getElementById("true-role-display");
    const videoContainer = document.getElementById("video-container");
    const endingVideo = document.getElementById("ending-video");
    const liarImageContainer = document.getElementById("liar-image-container");
    const liarImage = document.getElementById("liar-image");

    // ★★★ ここから追加！「絶望のすれ違い」判定 ★★★
    if (data.is_tragic_mistake) {
        // メッセージを絶望感のあるものに変更
        msgEl.innerText = "どうして…信じてくれなかったの…？";
        msgEl.style.color = "#ff0055"; 
        msgEl.style.display = "block";
        
        roleEl.innerHTML = `正体: <strong>LoVER</strong>`;
        roleEl.style.display = "block";

        // 動画は隠す
        videoContainer.style.display = "none";
        endingVideo.pause();
        endingVideo.removeAttribute('src');

        // 絶望画像を表示する
        liarImage.src = data.despair_image;
        liarImageContainer.style.display = "block";
        
        // 相手は悪くないのでリベンジボタンは隠す
        document.getElementById("revenge-btn").style.display = 'none';

    } else {
        // ★★★ これ以降は今までの処理 ★★★
        msgEl.innerText = data.message;
        msgEl.style.color = ""; // 色をリセット
        
        // truth もしくは lover なら「LoVER」
        const displayRole = (data.actual_role === 'truth' || data.actual_role === 'lover') ? 'LoVER' : 'LiAR';
        roleEl.innerHTML = `正体: <strong>${displayRole}</strong>`;
        
        if ((data.actual_role === 'truth' || data.actual_role === 'lover') && truthVideos[selectedCharId]) {
            endingVideo.src = truthVideos[selectedCharId];
            videoContainer.style.display = "block";
            
            // 動画が流れる時はジャマな文字を隠す
            msgEl.style.display = "none";
            roleEl.style.display = "none";
            
            // ボタンが隠れないギリギリの大画面サイズ！
            const shortVideoChars = ['下呂成', 'sakura', '関根', 'Dalan', 'りょう', 'かんな'];
            if (shortVideoChars.includes(selectedCharId)) {
                endingVideo.style.height = "380px"; 
                endingVideo.style.objectFit = "cover";
            } else {
                endingVideo.style.height = "auto";
            }
            
            endingVideo.play().catch(e => console.log("自動再生エラー:", e));
        } else {
            videoContainer.style.display = "none";
            endingVideo.pause();
            endingVideo.removeAttribute('src');
            
            // 動画がない時は文字をちゃんと表示させる
            msgEl.style.display = "block";
            roleEl.style.display = "block";
        }
        
        if (data.actual_role === 'liar' && liarImages[selectedCharId]) {
            liarImage.src = liarImages[selectedCharId];
            liarImageContainer.style.display = "block";
        } else {
            liarImageContainer.style.display = "none";
            liarImage.removeAttribute('src');
        }

        // 相手が「嘘つき(liar)」だった場合のみ、制裁（リベンジゲーム）ボタンを表示する
        document.getElementById("revenge-btn").style.display = (data.actual_role === 'liar') ? 'block' : 'none';
    }
}

// リベンジゲーム画面（別ページ）へ遷移する
function goToRevenge() { 
    window.location.href = "/revenge_game"; 
}

// リベンジゲームから戻ってきた時の最終結果表示処理
function handleRevengeResult(result) {
    document.getElementById("result-screen").classList.add("active");
    document.getElementById("revenge-result-container").classList.remove("hidden");
    
    // 尋問フェーズの結果要素を隠す
    document.getElementById("result-visual").style.display = 'none';
    document.getElementById("result-msg").style.display = 'none';
    document.getElementById("true-role-display").style.display = 'none';
    document.getElementById("revenge-btn").style.display = 'none';
    document.getElementById("liar-image-container").style.display = 'none';
    const title = document.getElementById("result-title");
    const statusText = document.getElementById("revenge-status-text");
    
    const dogezaContainer = document.getElementById("dogeza-image-container");
    const dogezaImg = document.getElementById("dogeza-image");

    // シューティングゲームのスコアに応じた最終表示
    if (result.status === 'win') {
        title.innerText = "REVENGE SUCCESS"; title.style.color = "#00f2ff";
        statusText.innerText = `SCORE: ${result.score} pts`; statusText.style.color = "#00f2ff";

        if (result.char_id && dogezaImages[result.char_id]) {
            dogezaImg.src = dogezaImages[result.char_id];
            dogezaContainer.style.display = "block";
        }
    } else {
        title.innerText = "REVENGE FAILED"; title.style.color = "#ff0055";
        statusText.innerText = `SCORE: ${result.score} pts\nYOU DEAD`; statusText.style.color = "#ff0055";

        dogezaContainer.style.display = "none";
        dogezaImg.removeAttribute('src');
    }
}