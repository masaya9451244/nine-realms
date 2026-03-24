export interface BossStory {
  realmId: number;
  bossName: string;
  portrait: string;   // DialogScene の portrait キー
  encounterLines: string[];  // バトル開始時のセリフ
  defeatLines: string[];     // ボス敗北時のセリフ（プレイヤー勝利）
  victoryLines?: string[];   // ボス勝利時のセリフ（プレイヤー敗北）
}

export const BOSS_STORIES: BossStory[] = [
  {
    realmId: 1,
    bossName: 'グリーン卿',
    portrait: 'boss_1',
    encounterLines: [
      'ほほう、よくぞここまで来たな、旅人よ。',
      'この草原は我が領地。数の力で貴様を打ち砕こう！',
      'かかってこい！ただし、覚悟はいいか？',
    ],
    defeatLines: [
      'ば、馬鹿な……数独でこの我が敗れるとは……',
      '貴様の数術の才、認めよう……草原は返してやる。',
    ],
  },
  {
    realmId: 2,
    bossName: 'フォレスト伯',
    portrait: 'boss_2',
    encounterLines: [
      '深き森の番人、フォレスト伯と申す。',
      '迷い込んだ愚か者よ、数の迷宮から抜け出せるかな？',
      '木々の囁きが、貴様の敗北を告げている……',
    ],
    defeatLines: [
      '……この森に、これほどの数術師が来ようとは。',
      '我が誇りをかけた数独が破られた。森は貴様に委ねよう。',
    ],
  },
  {
    realmId: 3,
    bossName: 'サンド侯爵',
    portrait: 'boss_3',
    encounterLines: [
      '灼熱の砂漠へようこそ、哀れな旅人よ。',
      'この熱波と数の謎が、貴様の意識を奪うであろう！',
      '砂塵のごとく、貴様を葬り去ってくれる！',
    ],
    defeatLines: [
      '信じられぬ……砂嵐の中でも冷静に解き続けるとは。',
      '砂漠の支配権、貴様に渡そう。だが魔王は容赦せぬぞ……',
    ],
  },
  {
    realmId: 4,
    bossName: 'フロスト公爵',
    portrait: 'boss_4',
    encounterLines: [
      '永遠の雪と氷に閉ざされた地へ、よく来た。',
      '我が数術は絶対零度の如く冷徹。貴様には解けまい。',
      '凍りついた思考で、この謎に挑んでみよ！',
    ],
    defeatLines: [
      'こ、凍りつくような集中力……見事じゃ。',
      '雪山の鍵は貴様のもの。先へ進むがいい、数術師よ。',
    ],
  },
  {
    realmId: 5,
    bossName: '海神ネプタス',
    portrait: 'boss_5',
    encounterLines: [
      '荒波よ、轟け！我は海神ネプタス！',
      '大海の深さほど複雑な数の謎、貴様には無理だ！',
      '波に飲まれて溺れるがよい！',
    ],
    defeatLines: [
      'ぐぬぬ……海の神たる我が、人間に敗れるとは……',
      '貴様の意志は海よりも深い。島国の支配権を渡そう。',
    ],
  },
  {
    realmId: 6,
    bossName: 'マグマ将軍',
    portrait: 'boss_6',
    encounterLines: [
      '灼熱のマグマが沸き立つぞ！我はマグマ将軍だ！',
      '炎と数の力で、貴様を溶かしてくれよう！',
      'この熱さに耐えながら数独が解けるか、試してやろう！',
    ],
    defeatLines: [
      'な、なんと……炎の中でも揺るがぬ精神……',
      '火山は鎮まった。だが魔王城はもっと苛烈だぞ、覚悟しろ。',
    ],
  },
  {
    realmId: 7,
    bossName: 'シャドウ公',
    portrait: 'boss_7',
    encounterLines: [
      'ようこそ、光の届かぬ闇の森へ……',
      '闇の中では目も役に立たぬ。数の感覚だけで挑んでみよ。',
      '貴様の魂を永遠の闇に閉じ込めてやろう……',
    ],
    defeatLines: [
      'まさか……闇の中でも光を見出すとは……',
      '呪われた森が解放されていく。貴様には頭が下がる。',
    ],
  },
  {
    realmId: 8,
    bossName: '天帝アルバス',
    portrait: 'boss_8',
    encounterLines: [
      '雲の上の楽園、天空の王国へよく来た、勇者よ。',
      '神聖なる数の摂理。貴様がこれを解けるとは思えぬ。',
      '天の裁きを受けるがいい！',
    ],
    defeatLines: [
      '……神が認めた数術師とは、貴様のことか。',
      '天界の封印を解いた。残るは魔王城のみ。気をつけよ。',
    ],
  },
  {
    realmId: 9,
    bossName: '魔王ナイン',
    portrait: 'boss_9',
    encounterLines: [
      'よくぞここまで来た、数術師よ。感心するぞ。',
      '我こそが魔王ナイン。九つのRealmを支配する者！',
      'だが、ここで貴様の旅は終わる。覚悟せよ！',
    ],
    defeatLines: [
      '……信じられぬ。この九つの謎を全て解くとは……',
      '貴様に敗れた。世界の封印は解かれる……九つの王国に、平和が戻るだろう。',
    ],
  },
];
