import {
  Client,
  GatewayIntentBits,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import cron from 'node-cron';
import { addMember, listMembers, removeMember } from './store.js';

const {
  DISCORD_TOKEN,
  GUILD_ID,
  CHANNEL_ID,
  CRON_SCHEDULE = '0 8 * * *', // 매일 08:00 (주말 제외하려면 '0 8 * * 1-5')
  TIMEZONE = 'Asia/Seoul',
} = process.env;

function buildMessage(mentions) {
  return `📢 데일리 스크럼 작성해주세요!\n${mentions}`;
}

for (const [key, value] of Object.entries({ DISCORD_TOKEN, GUILD_ID, CHANNEL_ID })) {
  if (!value) {
    console.error(`환경변수 ${key}가 설정되지 않았습니다. .env를 확인하세요.`);
    process.exit(1);
  }
}

const commands = [
  new SlashCommandBuilder()
    .setName('등록')
    .setDescription('아침 스크럼 알림 때 멘션할 사람을 등록해요')
    .addUserOption((o) => o.setName('대상').setDescription('등록할 사람').setRequired(true)),
  new SlashCommandBuilder()
    .setName('해제')
    .setDescription('아침 스크럼 알림 대상에서 제외해요')
    .addUserOption((o) => o.setName('대상').setDescription('제외할 사람').setRequired(true)),
  new SlashCommandBuilder().setName('목록').setDescription('알림 받을 사람 목록을 보여줘요'),
  new SlashCommandBuilder().setName('테스트').setDescription('스크럼 알림을 지금 바로 보내봐요'),
].map((c) => c.toJSON());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function sendReminder() {
  const members = listMembers();
  if (members.length === 0) {
    console.log('[reminder] 등록된 인원이 없어 건너뜀');
    return;
  }
  const channel = await client.channels.fetch(CHANNEL_ID);
  const mentions = members.map((id) => `<@${id}>`).join(' ');
  await channel.send({
    content: buildMessage(mentions),
    allowedMentions: { users: members },
  });
  console.log(`[reminder] ${members.length}명에게 전송 완료`);
}

client.once('clientReady', async () => {
  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.commands.set(commands); // 길드 커맨드는 즉시 반영됨
  console.log(`${client.user.tag} 로그인 완료 / 스케줄: "${CRON_SCHEDULE}" (${TIMEZONE})`);

  cron.schedule(
    CRON_SCHEDULE,
    () => sendReminder().catch((err) => console.error('[reminder] 전송 실패', err)),
    { timezone: TIMEZONE },
  );
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const reply = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });

  try {
    switch (interaction.commandName) {
      case '등록': {
        const user = interaction.options.getUser('대상', true);
        if (user.bot) return reply('봇은 등록할 수 없어요.');
        return reply(addMember(user.id) ? `✅ ${user}님을 등록했어요.` : `${user}님은 이미 등록되어 있어요.`);
      }

      case '해제': {
        const user = interaction.options.getUser('대상', true);
        return reply(removeMember(user.id) ? `👋 ${user}님을 제외했어요.` : `${user}님은 등록되어 있지 않아요.`);
      }

      case '목록': {
        const members = listMembers();
        return reply(
          members.length
            ? `📋 등록 인원 (${members.length}명)\n${members.map((id) => `- <@${id}>`).join('\n')}`
            : '등록된 인원이 없어요. `/등록 @이름`으로 등록하세요.',
        );
      }

      case '테스트':
        await sendReminder();
        return reply(listMembers().length ? '알림을 보냈어요.' : '등록된 인원이 없어서 보내지 않았어요.');
    }
  } catch (err) {
    console.error(err);
    const msg = '오류가 발생했어요. 봇 로그를 확인해주세요.';
    if (interaction.replied || interaction.deferred) await interaction.followUp({ content: msg, flags: MessageFlags.Ephemeral });
    else await reply(msg);
  }
});

process.on('SIGTERM', () => client.destroy().then(() => process.exit(0)));
process.on('SIGINT', () => client.destroy().then(() => process.exit(0)));

client.login(DISCORD_TOKEN);
