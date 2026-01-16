const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, PermissionsBitField } = require('discord.js');
const http = require('http');

// --- 1. KEEP ALIVE (FOR RENDER 24/7) ---
http.createServer((req, res) => {
  res.write("I am alive");
  res.end();
}).listen(8080);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers // Required for roles
  ]
});

// --- 2. CONFIGURATION ---
// ⚠️ PASTE THE ROLE ID FOR "society" HERE
const SOCIETY_ROLE_ID = '1412788700646998118'; 

// YOUR GROUP ID (Goyard)
const MAIN_GROUP_ID = '34770198';

// --- 3. TAG LIST (Your Custom Database) ---
const TAG_LIST = {
  '1067988454': "OX", 
  '857292331': "ILY",
  '34721394': "DBIN",
  '330818699': "анђели",
  '154361656': "OF] [☑️] [⭐️",
  '155020361': "PURGE] [🕷️",
  '35692393': "RICH] [💸",
  '34531592': "x] [🌌",
  '207697447': "DREAM] [✨",
  '34733738': "rr] [💘",
  '231745930': "XIX] [🩸",
  '33357680': "zzz] [💤",
  '35512078': "sinz] [🕊️",
  '465919461': "SPIRIT] [👻",
  '573727572': "rue] [💮",
  '56578165': "SEKAI] [🎭",
  '526649056': "</3",
  '528695996': "^.^",
  '481483834': ":3",
  '909775996': "YAU",
  '35474227': "<3",
  '34423896': "092",
  '975405103': "kuks",
  '102951198': "SOUL",
  '35953799': "PRETTY",
  '1015469631': "1887",
  '522792477': "XII",
  '1039567303': "MONKEY",
  '34585493': "PITY",
  '638893691': "224",
  '744245198': "77",
  '35053157': ">_<",
  '695715021': "CHILDSUPPORT",
  '711369814': "V3",
  '36052811': "TRACE"
};
const OUR_GROUP_IDS = ['857292331', '1067988454']; 

// --- 4. STARTUP ---
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: `Goyard Members`, type: ActivityType.Watching }],
    status: 'online',
  });
});

// --- 5. COMMANDS ---
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args[0].toLowerCase();

  // ---------------------------------------------------------
  // COMMAND: ,see <username> (Check if in Goyard Group)
  // ---------------------------------------------------------
  if (command === ',see') {
    const username = args[1];
    if (!username) return message.reply("Usage: `,see username`");

    try {
      // 1. Get User ID
      const idRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
      });
      const idData = await idRes.json();
      
      if (!idData.data || idData.data.length === 0) {
        return message.reply(`❌ Could not find Roblox user **${username}**`);
      }
      
      const user = idData.data[0];

      // 2. Check Rank in Goyard Group
      const rankRes = await fetch(`https://groups.roblox.com/v1/users/${user.id}/groups/roles`);
      const rankData = await rankRes.json();
      
      // Look for the Goyard Group ID in their groups
      const goyardGroup = rankData.data.find(g => g.group.id.toString() === MAIN_GROUP_ID);

      const embed = new EmbedBuilder()
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`)
        .setTimestamp();

      if (goyardGroup) {
        // THEY ARE IN THE GROUP
        embed.setColor(0x00FF00) // Green
        embed.setTitle(`✅ User Found in Goyard`)
        embed.setDescription(`**${user.name}** is a member of the crew.`)
        embed.addFields(
            { name: 'Rank', value: goyardGroup.role.name, inline: true },
            { name: 'Rank ID', value: goyardGroup.role.rank.toString(), inline: true }
        );
      } else {
        // THEY ARE NOT IN THE GROUP
        embed.setColor(0xFF0000) // Red
        embed.setTitle(`❌ User NOT in Goyard`)
        embed.setDescription(`**${user.name}** has NOT joined the group yet.`)
        embed.addFields(
            { name: 'Group Link', value: `[Join Here](https://www.roblox.com/communities/${MAIN_GROUP_ID})`, inline: true }
        );
      }

      message.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      message.reply("⚠️ Error connecting to Roblox.");
    }
  }

  // ---------------------------------------------------------
  // COMMAND: ,verify or ,v (Give Society Role)
  // ---------------------------------------------------------
  message.reply(`✅ **Verified:** Given **Society** role to ${member.user.username}.`);
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("❌ You do not have permission.");
    }
    const member = message.mentions.members.first();
    if (!member) return message.reply("Usage:  `,v @user`");

    try {
      await member.roles.add(SOCIETY_ROLE_ID);
      message.reply(`✅ **Verified:** Given <@&${SOCIETY_ROLE_ID}> to ${member.user.username}.`);
    } catch (error) {
      message.reply("❌ Error: My bot role must be HIGHER than the Society role!");
    }
  }

  if (command === ',unverify') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return;
    const member = message.mentions.members.first();
    if (!member) return;
    try {
        await member.roles.remove(SOCIETY_ROLE_ID);
        message.reply(`🚫 **Unverified:** Removed role from ${member.user.username}.`);
    } catch (e) { message.reply("❌ Error removing role."); }
  }

  // ---------------------------------------------------------
  // COMMAND: ,check (Your Tag Checker)
  // ---------------------------------------------------------
  if (command === ',check') {
    const username = args[1];
    if (!username) return message.reply('Usage: `,check username`');

    try {
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
      });
      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0) return message.reply(`❌ User **${username}** not found.`);
      const user = userData.data[0];

      const groupRes = await fetch(`https://groups.roblox.com/v1/users/${user.id}/groups/roles`);
      const groupData = await groupRes.json();
      const userGroups = groupData.data || [];

      let ourTagsFound = [];
      let otherTagsFound = [];

      userGroups.forEach(group => {
        const groupId = group.group.id.toString();
        if (TAG_LIST[groupId]) {
          const tagName = TAG_LIST[groupId];
          if (OUR_GROUP_IDS.includes(groupId)) ourTagsFound.push(`[${tagName}]`);
          else otherTagsFound.push(`[${tagName}]`);
        }
      });

      const ourTagsText = ourTagsFound.length > 0 ? ourTagsFound.join('\n') : "None";
      const otherTagsText = otherTagsFound.length > 0 ? otherTagsFound.join(', ') : "None";

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`🔎 User Check: ${user.name}`)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`)
        .addFields(
          { name: 'OUR TAGS', value: `\`\`\`\n${ourTagsText}\n\`\`\``, inline: false },
          { name: 'OTHER TAGS', value: `\`\`\`\n${otherTagsText}\n\`\`\``, inline: false },
          { name: 'User ID', value: user.id.toString(), inline: true },
          { name: 'Profile Link', value: `[Click Here](https://www.roblox.com/users/${user.id}/profile)`, inline: true }
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });

    } catch (error) { message.reply('⚠️ Error fetching data.'); }
  }
});

client.login(process.env.DISCORD_TOKEN);