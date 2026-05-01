####準備(import・Flask設定)####
import os#
import random#
import time
import json#
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from dotenv import load_dotenv#

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)


RANKING_FILE = "ranking.json"

#ランキング管理#データ永続化
def load_ranking():
    if os.path.exists(RANKING_FILE):
        with open(RANKING_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_ranking(ranking):
    with open(RANKING_FILE, "w", encoding="utf-8") as f:
        json.dump(ranking, f, ensure_ascii=False, indent=2)

#キャラクターデータ
CHARACTERS = {
    "ricky": {
        "id": "ricky",
        "name": "Ricky",
        "age": 27,
        "job": "IT CEO",
        "image": "/static/images/ricky.jpg",
        "despair_image": "/static/images/ricky_despair.jpg",
        "bio": "合理的で自信家。仕事人間だが、ふと見せる寂しさが武器。",
        "speech_style": "一人称は「俺」、ユーザーのことは「君」と呼ぶ。語尾は「〜だよ」「〜だろ」「〜かな」。",
        "responses": {
            "weekend": {
                "lover": [
                    "ずっとコード書いてたよ。新しいサービスのリリース前でさ。",
                    "ジムで体鍛えてた。健康管理も社長の仕事だからね。",
                ],
                "liar": [
                    "接待ゴルフ！世話係って結構きついのなぁ。。。",
                    "ちょっと実家に帰ってた。圏外にいて連絡取れなかったんだ。",
                ],
            },
            "opinion": {
                "lover": [
                    "君の、物事をハッキリ言うところ、嫌いじゃないよ。",
                    "俺のペースについてこられるのは君くらいかもね。",
                ],
                "liar": [
                    "君みたいな癒やし系、ずっと探してたんだよね。",
                    "一目見たときから運命感じてる…って言ったら信じる？",
                ],
            },
            "secret": {
                "lover": [
                    "実は…甘いものがやめられないんだ。部下には秘密だけど。",
                    "実はまだ、、、おむつ履いてる。",
                ],
                "liar": [
                    "隠し事？あるわけないじゃん。俺の目を見てよ。",
                    "君への気持ち以外、隠してることなんてないよ。",
                ],
            },
        },
    },
    "関根": {
        "id": "関根",
        "name": "関根",
        "age": 33,
        "job": "数学教師",
        "image": "/static/images/precure-otaku1.png",
        "despair_image": "/static/images/sekine_despair.jpg",
        "bio": "数学教師のツンデレラ。プリキュアヲタクという二面性を持つ。",
        "responses": {
            "weekend": {
                "lover": [
                    "研究授業の準備してた。角度の確認とか。美は計算で成り立つものだから。",
                    "フレッシュ・プリキュアを一人で見た。静かな時間が必要だった。",
                ],
                "liar": [
                    "全プリキュア展行ってた。誰と行ったとかは関係ないと思うけど？",
                    "寝てた。…まあ、ちょっと外出したけど。どうでもいいでしょ。",
                ],
            },
            "opinion": {
                "lover": [
                    "冷静に見て、君は落ち着きがない。もう少し論理的に話して。",
                    "一緒にいると雑音が減る。それだけ。",
                ],
                "liar": [
                    "君、モデル“やれなくもない”と思う。数値的には平均以上だし。",
                    "可愛いとか、興味ない。質問の意図は？",
                ],
            },
            "secret": {
                "lover": [
                    "履歴書は見せない。見せる理由がないから。",
                    "昔は太ってた。努力の結果を軽く扱われるのは不快。",
                ],
                "liar": ["秘密。知ってどうするの？", "前のこと？その話、今関係ある？"],
            },
        },
    },
    "かんな": {
        "id": "かんな",
        "name": "かんな",
        "age": 20,
        "job": "平成ギャル💅",
        "image": "/static/images/gyaru1.png",
        "despair_image": "/static/images/kanna_despair.jpg",
        "bio": "元気いっぱいのメンヘラ平成ギャル。でも裏では将来に悩んでいる。",
        "responses": {
            "weekend": {
                "lover": [
                    "渋谷で爆買いしてた〜！足バッキバキやば笑",
                    "ネイル変えに3時間サロン籠もり！指パンパン💅",
                ],
                "liar": [
                    "女友達と普通にカフェ♡ あ、ガールズトークの詳細は内緒〜😜",
                    "バイト長引いて…誰かと一緒だったっけ？疲れただけ〜💦",
                ],
            },
            "opinion": {
                "lover": [
                    "○○さんの前だと素のギャルでいられるの癒される〜",
                    "兄貴肌で頼れる！…ドキドキしちゃうかも？笑",
                ],
                "liar": ["○○さんがいちおし🥰", "運命感じてま～す🔥🔥🔥"],
            },
            "secret": {
                "lover": [
                    "将来の夢迷っててメイクで誤魔化してるんだけど…",
                    "実家貧乏でバイトきつい💦誰にも言えない",
                ],
                "liar": [
                    "秘密？ないよ〜…あ！明日からLINEの返信遅れるかも、最近バイト忙しすぎて滅😭",
                    "するわけないじゃぁ～ン（笑）らりってる？笑笑",
                ],
            },
        },
    },
    "Dalan": {
        "id": "Dalan",
        "name": "Dalan",
        "age": 46,
        "job": "ゴッドファーザー",
        "image": "/static/images/dalan1.png",
        "despair_image": "/static/images/dalan_despair.jpg",
        "bio": "冷静で義理堅い、古き良き王・取引の達人",
        "responses": {
            "weekend": {
                "lover": [
                    "両親と過ごしていた。静かな時間は、組織より重い価値がある。",
                    "書類の整理と取引の振り返りをしていた。無駄を残すのは嫌いだ。",
                ],
                "liar": [
                    "古い友人と会っていた。ただの旧交を温める時間だよ。",
                    "出かけていた。細かい場所までは話す必要はないだろう。",
                ],
            },
            "opinion": {
                "lover": [
                    "お前の行動には筋がある。だからこそ、共に歩く意味があると思っている。",
                    "一緒にいると、感情ではなく理で話ができる。それが何よりの信頼だ。",
                ],
                "liar": [
                    "悪くない。今のところは、な。",
                    "従順な者は嫌いじゃない。だが、試すまでは信用しない。",
                ],
            },
            "secret": {
                "lover": [
                    "過去に裏切った者を許したことは、一度もない。",
                    "家族を一人、表の世界に出した。それが正解だったかはまだ分からん。",
                ],
                "liar": [
                    "誰にでも秘密はあるだろう。俺も同じだ。",
                    "知る必要のないことだ。知れば、お前が眠れなくなる。",
                ],
            },
        },
    },
    "りょう": {
        "id": "りょう",
        "name": "りょう",
        "age": 24,
        "job": "住職",
        "image": "/static/images/ryou.png",
        "despair_image": "/static/images/ryou_despair.jpg",
        "bio": "石の上にも三年・献身的・禅を極めし男",
        "responses": {
            "weekend": {
                "lover": [
                    "境内の掃除をしていた。日々の埃を払うのも、心の修行だ。",
                    "檀家の方の相談に乗っていた。話を聞くことも供養のひとつだからね。",
                ],
                "liar": [
                    "外に出ていた。俗世の風にも、たまには当たらねばならぬので。",
                    "少し遠出していた。誰と、というのは煩悩に繋がる話だ。",
                ],
            },
            "opinion": {
                "lover": [
                    "あなたの在り方は、静かに見ていて落ち着く。無理をしていないのがいい。",
                    "共にいると、心が波立たぬ。珍しいことだ。",
                ],
                "liar": [
                    "悪くない。だが執着は毒だ。近づきすぎぬことも大切。",
                    "あなたのような人は、悟りに近い。",
                ],
            },
            "secret": {
                "lover": [
                    "修行の途中で何度も逃げ出した。強さとは、戻ってくる根気のことだ。",
                    "瞑想中、よく寝落ちする。まだ未熟なんだ。",
                ],
                "liar": [
                    "住職にも秘密はある。語らねば、それもまた修行の一部だ。",
                    "隠し事などない。…あるとしても、それは迷いの名残だ。",
                ],
            },
        },
    },
    "下呂成": {
        "id": "下呂成",
        "name": "下呂成",
        "age": 32,
        "job": "DJ",
        "image": "/static/images/DJ-geronari1.PNG",
        "despair_image": "/static/images/geronari_despair.jpg",
        "bio": "超エネルギッシュでポジティブ・好奇心旺盛",
        "responses": {
            "weekend": {
                "lover": [
                    "イベントの準備してた！新しいミックス作っててさ、朝まで気づいたら音の海の中🐟YO！",
                    "仲間とスタジオにこもってた。ヘッドフォン越しの時間が一番燃えるんだよ。",
                ],
                "liar": [
                    "知り合いの集まり行ってた。音楽関係の人だよ。",
                    "寝てたよ。っていうか、あんまり記憶ないんだよね、昨日何してたっけ？haha！",
                ],
            },
            "opinion": {
                "lover": [
                    "君、テンション安定してて助かる。俺みたいなのにも冷静な人必要なんだよ。",
                    "一緒にいると空気が軽くなる。ノるペースが合う感じ、悪くないね！",
                ],
                "liar": [
                    "君のノリ、嫌いじゃないよ。…まあ、俺のテンションについて来れるならね。",
                    "可愛いじゃんLOL。そういうノリ、悪くないって。",
                ],
            },
            "secret": {
                "lover": [
                    "実はステージ降りた後、めっちゃ人見知り。テンション維持するの、けっこう大変なんだよ。",
                    "昔、音楽辞めようとしたことある。でも無音が怖くて戻った。",
                ],
                "liar": [
                    "秘密？DJに秘密なんてあると思う？全部音に混ぜてるよLOL。",
                    "プライベート？んー、そこは“OFFレコード”ってことで。",
                ],
            },
        },
    },
    "富海子": {
        "id": "富海子",
        "name": "フェアリー・マダム・富海子",
        "age": 65,
        "job": "ゴッドマザー",
        "image": "/static/images/iitaka1.png",
        "despair_image": "/static/images/iitaka_despair.jpg",
        "bio": "自称フェアリー・マダムのヒステリックばばぁ。",
        "speech_style": "一人称は「私」、ユーザーのことは「アンタ」と呼ぶ。コテコテの関西弁。",
        "responses": {
            "weekend": {
                "lover": [
                    "近所のスーパーの特売で、卵争奪戦に参加してたんや！",
                    "電動キックボードのバッテリー充電してたわ。",
                ],
                "liar": [
                    "リッツ・カールトンのラウンジで優雅にアフタヌーンティーしばいてたんや！",
                    "魔法のステッキのメンテナンスや。ホンマやで！",
                ],
            },
            "opinion": {
                "lover": [
                    "アンタ、姿勢が悪いで！猫背やと『安もん』に見えるんやから！",
                    "公務員の安定性はええけど、顔だけで選んだらあかんで！",
                ],
                "liar": [
                    "アンタこそ、私が探し求めてた完璧なプリンセスやわ！",
                    "もう可愛くて可愛くて、うちのパイン飴、全部あげちゃいたいわぁ！",
                ],
            },
            "secret": {
                "lover": [
                    "魔法の効果は『韓流ドラマ』が始まる時間までしか持たへんねん。",
                    "ガラスの靴って言うたけど、あれホンマはクロックスや。",
                ],
                "liar": [
                    "隠し事？この富海子にそんなもんあるわけないやろ！",
                    "この杖の先についてるの、ただのパイン飴やないで！伝説の魔法石や！",
                ],
            },
        },
    },
    "sakura": {
        "id": "sakura",
        "name": "白鳥 桜",
        "age": 17,
        "job": "図書委員・高校2年生",
        "image": "/static/images/josikousei1.png",
        "despair_image": "/static/images/sakura_despair.jpg",
        "bio": "いつも放課後の図書室で静かに佇んでいる少女。",
        "speech_style": "一人称は「私」。ユーザーのことは「あなた」または「さん」付けで呼ぶ。",
        "responses": {
            "weekend": {
                "lover": [
                    "お家の掃除をして、お気に入りの栞の整理をしていました。",
                    "図書室で、誰も借りないような古い詩集を読んでいました。",
                ],
                "liar": [
                    "あなたと一緒に行きたいお店をリストアップして眺めていたんです。",
                    "小鳥たちが集まる秘密の花園で、あなたの健康をお祈りしていました。",
                ],
            },
            "opinion": {
                "lover": [
                    "無理に笑わなくてもいいんですよ。あなたが少し疲れていること、わかってしまいますから。",
                    "その考え、少し危ういかもしれません。でも、私は最後まで隣にいます。",
                ],
                "liar": [
                    "あなたの選ぶ道なら、それがどんなに険しくても絶対に正しい答えになります！",
                    "あなたは、私の暗い世界に光をくれた王子様なんです。",
                ],
            },
            "secret": {
                "lover": [
                    "実は……少しだけ独占欲が強いんです。",
                    "制服の下に、こっそりペアリングをネックレスにして隠しているんです。",
                ],
                "liar": [
                    "秘密なんてありません。私はあなたの前では、透き通った存在でいたいんです。",
                    "実は私、あなたの前世と繋がっているんです。",
                ],
            },
        },
    },
}


#####ルーティング(@app.route)#####
###トップページ###
@app.route("/")
def top():
    return render_template("top.html")

#####キャラ選択画面#####
@app.route("/select")
def index():
    revenge_result = session.pop("last_revenge_result", None)
    player_name = session.get("player_name", "")
    return render_template(
        "index.html",
        characters=CHARACTERS,
        revenge_result=revenge_result,
        player_name=player_name,
    )

@app.route("/exit")
def exit_game():
    session.clear()
    return redirect(url_for("top"))

@app.route("/register_name", methods=["POST"])
def register_name():
    data = request.get_json() or {}
    new_name = data.get("name", "").strip() if data.get("name") else ""

    if not new_name:
        return jsonify({"status": "error", "message": "名前を入力してください"})

    ranking = load_ranking()

    if session.get("player_name") != new_name:
        name_exists = any(entry["name"] == new_name for entry in ranking)
        if name_exists:
            return jsonify(
                {"status": "error", "message": "少し名前を変化させてください"}
            )

    session["player_name"] = new_name
    return jsonify({"status": "success"})

@app.route("/api/ranking", methods=["GET"])
def get_ranking():
    return jsonify(load_ranking())

@app.route("/api/ranking/reset", methods=["POST"])
def reset_ranking():
    save_ranking([])
    return jsonify({"status": "success"})

#####ゲーム開始#####
@app.route("/start_game", methods=["POST"])
def start_game():
    data = request.get_json() or {}
    
    char_id = data.get("char_id")
    
    if char_id not in CHARACTERS:
        return jsonify({"error": "Invalid Character"}), 400
    
    session["char_id"] = char_id
    
    session["role"] = random.choice(["lover", "liar"])
    
    session["used_topics"] = []
    
    return jsonify(
        {
            "status": "started",
            "character": CHARACTERS[char_id],
            "message": f"{CHARACTERS[char_id]['name']}との接続を開始...",
        }
    )

#####話題を送る#####
@app.route("/chat_topic", methods=["POST"])
def chat_topic():
    if "char_id" not in session:
        return jsonify({"error": "No game"}), 400
    
    req_data = request.get_json() or {}
    topic = req_data.get("topic")
    
    char_id = session["char_id"]
    role = session["role"]
    if topic in session["used_topics"]:
        return jsonify({"error": "Already used."}), 400
    session["used_topics"].append(topic)
    session.modified = True
    
    char_data = CHARACTERS.get(char_id)
    if char_data is not None:
        responses_list = (
            char_data.get("responses", {}).get(topic, {}).get(role, ["..."])
        )
    else:
        responses_list = ["..."]
    return jsonify(
        {
            "response": random.choice(responses_list),
            "used_topics": session["used_topics"],
        }
    )

#####嘘つき判定#####
@app.route("/accuse", methods=["POST"])
def accuse():
    if "char_id" not in session:
        return jsonify({"error": "No game"}), 400

    req_data = request.get_json() or {}

    raw_guess = req_data.get("guess", "")
    guess = raw_guess.lower() if raw_guess else ""

    actual = session["role"]
    char_data = CHARACTERS[session["char_id"]]

    win = guess == actual

    is_tragic_mistake = guess == "liar" and actual == "lover"
    despair_img_url = char_data.get(
        "despair_image", char_data["image"]
    )

    msg = f"大正解！" if win else f"残念...真実は闇の中へ。"
    return jsonify(
        {
            "win": win,
            "actual_role": actual,
            "message": msg,
            "char_name": char_data["name"],
            "is_tragic_mistake": is_tragic_mistake,
            "despair_image": despair_img_url,
        }
    )

@app.route("/revenge_game")
def revenge_game():
    if "char_id" not in session:
        return "ゲームが開始されていません", 400
    return render_template("revenge.html", character=CHARACTERS[session["char_id"]])

#####スコア保存#####
@app.route("/revenge_result", methods=["POST"])
def revenge_result():
    if "char_id" not in session:
        return jsonify({"error": "No game"}), 400

    data = request.get_json() or {}
    result = data.get("result")
    score = data.get("score", 0)

    player_name = session.get("player_name", "Unknown")
    ranking = load_ranking()

    player_found = False
    for entry in ranking:
        if entry["name"] == player_name:
            player_found = True
            if score > entry["score"]:
                entry["score"] = score
            break

    if not player_found:
        ranking.append({"name": player_name, "score": score})

    ranking = sorted(ranking, key=lambda x: x["score"], reverse=True)
    save_ranking(ranking)

    session["last_revenge_result"] = {
        "status": result,
        "char_name": CHARACTERS[session["char_id"]]["name"],
        "score": score,
        "char_id": session["char_id"],
    }
    return jsonify({"status": "success"})

if __name__ == "__main__":
    app.run(debug=True)