/** 学習まわりの設定値。挙動を変えたいときはここを変更する */
export const learningConfig = {
  /** 間違えた問題を再出題するまでの日数。正解するたびに次の段階へ進む */
  reviewIntervalsDays: [1, 3, 7, 14],
  /** 操作がこの秒数ないと、学習時間の計測を止める */
  idleTimeoutSeconds: 5 * 60,
  /** 学習時間を保存する間隔（秒） */
  studyTickSeconds: 15,
  /** 最後のバックアップからこの日数が過ぎたら、書き出しを促す */
  backupReminderDays: 14,
} as const
