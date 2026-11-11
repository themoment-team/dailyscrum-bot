# dailyscrum-bot

매일 오전 8시(KST)에 등록된 사람들을 멘션해 데일리 스크럼을 리마인드하는 디스코드 봇.

## 1. 봇 만들기
1. https://discord.com/developers/applications → New Application → **Bot** 탭에서 토큰 발급
2. **OAuth2 > URL Generator**: scopes `bot`, `applications.commands` / 권한 `Send Messages`, `View Channels`
3. 생성된 URL로 서버에 초대

## 2. 실행
```bash
cp .env.example .env   # 토큰, 서버 ID, 채널 ID 입력
npm install
npm start
```

## 3. 명령어
| 명령어 | 설명 |
|---|---|
| `/등록 @이름` | 아침 알림 때 멘션할 사람 등록 |
| `/해제 @이름` | 알림 대상에서 제외 |
| `/목록` | 등록된 사람 보기 |
| `/테스트` | 지금 바로 알림 보내보기 |

매일 아침 알림은 **등록된 사람만** 멘션합니다. 등록 인원은 `data/members.json`에 저장됩니다.

## 4. 학교 서버에 상시 실행 (systemd)
```bash
sudo cp dailyscrum-bot.service /etc/systemd/system/   # User, WorkingDirectory 수정
sudo systemctl daemon-reload
sudo systemctl enable --now dailyscrum-bot
journalctl -u dailyscrum-bot -f    # 로그 확인
```
pm2를 쓴다면: `pm2 start npm --name dailyscrum-bot -- start && pm2 save`
