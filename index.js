const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, PermissionsBitField } = require('discord.js');
const http = require('http');
const fs = require('fs');

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
    GatewayIntentBits.GuildMembers
  ]
});

// --- 2. CONFIGURATION ---

// ✅ YOUR SOCIETY ROLE ID (Hardcoded)
const SOCIETY_ROLE_ID = '1412788700646998118'; 

// YOUR GROUP ID (Goyard)
const MAIN_GROUP_ID = '34770198';

// TAG LIST (For ,check command)
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

// --- 3. DATABASE SYSTEM ---
let robloxData = {};
if (fs.existsSync('roblox_data.json')) {
  try {
    robloxData = JSON.parse(fs.readFileSync('roblox_data.json', 'utf8'));
  } catch (err) { console.error("Error loading database:", err); }
}

function saveDatabase() {
  fs.writeFileSync('roblox_data.json', JSON.stringify(robloxData, null, 2));
}

// --- 4. STARTUP ---
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: `Tickets & Tags`, type: ActivityType.Watching }],
    status: 'online',
  });
});

// --- 5. THE SPY (Auto-Save Roblox Names) ---
client.on('messageCreate', async message => {
  if (!message.author.bot) return; // Only listen to bots (Ticket Tool)

  if (message.embeds.length > 0) {
    const embed = message.embeds[0];
    
    // Search for "Roblox" in the question fields
    if (embed.fields) {
      const robloxField = embed.fields.find(f => 
        f.name.toLowerCase().includes('what is your roblox') || 
        f.name.toLowerCase().includes('username')
      );
      
      if (robloxField) {
        // Find User ID
        let userId = null;
        if (embed.description) {
            const match = embed.description.match(/<@!?(\d+)>/);
            if (match) userId = match[1];
        }
        if (!userId) {
            const userField = embed.fields.find(f => f.name.includes('Created by') || f.name.includes('Opened by'));
            if (userField) {
                const match = userField.value.match(/<@!?(\d+)>/);
                if (match) userId = match[1];
            }
        }

        if (userId) {
          robloxData[userId] = robloxField.value;
          saveDatabase();
          console.log(`💾 Auto-Saved: ${userId} = ${robloxField.value}`);
          message.react('💾'); 
        }
      }
    }
  }
});

// --- 6. COMMANDS ---
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const args = message.content.split(' ');
  const command = args[0].toLowerCase();

  // 1. ROCO (Lookup User)
  if (command === ',roco') {
    let target = message.mentions.members.first();
    if (!target && args[1]) try { target = await message.guild.members.fetch(args[1]); } catch(e) {}
    if (!target && !args[1]) target = message.member;
    if (!target) return message.reply("Usage: `,roco @user`");

    const savedName = robloxData[target.id];
    if (savedName) {
      const embed = new EmbedBuilder()
        .setColor(0x00FF00).setTitle(`👤 Identity Found`)
        .addFields({ name: 'User', value: `<@${target.id}>` }, { name: 'Roblox Username', value: `**${savedName}**` });
      message.reply({ embeds: [embed] });
    } else {
      message.reply(`❌ I don't know the Roblox username for **${target.user.tag}** yet. Use \`,link @user name\` to fix.`);
    }
  }

  // 2. LINK (Manual Save)
  if (command === ',link') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const target = message.mentions.members.first();
    const name = args[2];
    if (!target || !name) return message.reply("Usage: `,link @user RobloxName`");
    robloxData[target.id] = name;
    saveDatabase();
    message.reply(`✅ **Linked:** <@${target.id}> is now known as **${name}**.`);
  }

  // 3. VERIFY (,v) - UPDATED WITH LINK
  if (command === ',verify' || command === ',v') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply("❌ No permission.");
    const member = message.mentions.members.first();
    if (!member) return message.reply("Usage: `,v @user`");
    
    if (message.guild.members.me.roles.highest.position <= member.roles.highest.position) {
        return message.reply("❌ I cannot verify them (Their role is higher than mine!)");
    }

    try {
      await member.roles.add(SOCIETY_ROLE_ID);
      
      // CHECK DATABASE FOR LINK
      const savedName = robloxData[member.id];
      let replyMsg = `✅ **Verified:** Given **Society** role to ${member.user.username}.`;
      
      if (savedName) {
          replyMsg += `\n🔗 **Roblox:** [${savedName}](https://www.roblox.com/search/users?keyword=${savedName})`;
      }

      // Send the reply (using an embed is cleaner for links)
      if (savedName) {
          const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(replyMsg);
          message.reply({ embeds: [embed] });
      } else {
          message.reply(replyMsg);
      }

    } catch (e) { 
        console.log(e);
        message.reply("❌ Error: Check my role hierarchy."); 
    }
  }

  // 4. UNVERIFY
  if (command === ',unverify') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply("❌ No permission.");
    const member = message.mentions.members.first();
    if (!member) return message.reply("Usage: `,unverify @user`");

    if (message.guild.members.me.roles.highest.position <= member.roles.highest.position) {
        return message.reply("❌ I cannot unverify them (Their role is higher than mine!)");
    }

    try {
        await member.roles.remove(SOCIETY_ROLE_ID);
        message.reply(`🚫 **Unverified:** Removed role from ${member.user.username}.`);
    } catch (e) { 
        console.log(e);
        message.reply("❌ Error removing role."); 
    }
  }

  // 5. SEE (Check Group)
  if (command === ',see') {
    const username = args[1];
    if (!username) return message.reply("Usage: `,see username`");
    try {
      const idRes = await fetch('https://users.roblox.com/v1/usernames/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }) });
      const idData = await idRes.json();
      if (!idData.data || !idData.data.length) return message.reply("❌ User not found.");
      const user = idData.data[0];
      const rankRes = await fetch(`https://groups.roblox.com/v1/users/${user.id}/groups/roles`);
      const rankData = await rankRes.json();
      const group = rankData.data.find(g => g.group.id.toString() === MAIN_GROUP_ID);
      const embed = new EmbedBuilder().setTimestamp().setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`);
      if (group) embed.setColor(0x00FF00).setTitle("✅ In Goyard").setDescription(`**${user.name}** is Rank: ${group.role.name}`);
      else embed.setColor(0xFF0000).setTitle("❌ Not in Goyard");
      message.reply({ embeds: [embed] });
    } catch (e) { message.reply("⚠️ Roblox API Error"); }
  }

  // 6. CHECK (Check Tags)
  if (command === ',check') {
    const username = args[1];
    if (!username) return message.reply('Usage: `,check username`');
    try {
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }) });
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
          { name: 'OTHER TAGS', value: `\`\`\`\n${otherTagsText}\n\`\`\``, inline: false }
        );
      message.reply({ embeds: [embed] });
    } catch (error) { message.reply('⚠️ Error fetching data.'); }
  }
});

client.login(process.env.DISCORD_TOKEN);