const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, PermissionsBitField } = require('discord.js');
const http = require('http');

// --- 1. KEEP ALIVE (FOR RENDER) ---
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

// ✅ ROLE ID FOR VERIFICATION
const SOCIETY_ROLE_ID = '1412788700646998118'; 

// ✅ RAID ROLE IDS
const ROLE_RAID_PING = '1459434057439121450';
const ROLE_CS_FG = '1459402932268306533';
const ROLE_STATUS_FG = '1460060899304800437';
const ROLE_OX = '1459624056834752605';
const ROLE_ILY = '1459624016582021151';

// ✅ MAIN GROUP
const MAIN_GROUP_ID = '34770198';
const GROUP_LINK = "https://www.roblox.com/communities/34770198/goyard";

// ✅ TAG LIST (Used for Spies & Checks)
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

// --- 3. STARTUP ---
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setPresence({ activities: [{ name: `Tickets`, type: ActivityType.Watching }], status: 'online' });
});

// --- 4. COMMANDS ---
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const args = message.content.split(' ');
  const command = args[0].toLowerCase();

  // --- 1. RAID COMMAND (LINK ONLY) ---
  if (command === ',raid') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    
    // Extract Link
    const link = args.find(arg => arg.includes('roblox.com/users/'));
    let userId = null;
    if (link) {
        const match = link.match(/users\/(\d+)/);
        if (match) userId = match[1];
    } 

    if (!userId) return message.reply("❌ Invalid usage. You **MUST** provide a profile link.\nExample: `,raid https://www.roblox.com/users/123456/profile`");

    message.reply("⚔️ **Setting up Raid...** Checking join status...");

    try {
        const presenceRes = await fetch('https://presence.roblox.com/v1/presence/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: [userId] })
        });
        const presenceData = await presenceRes.json();
        const userPresence = presenceData.userPresences[0];

        const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
        const userData = await userRes.json();
        const username = userData.name || "Target";

        let joinLink = `https://www.roblox.com/users/${userId}/profile`; 
        let isDirect = false;
        let gameName = "Unknown Game";

        if (userPresence && userPresence.userPresenceType === 2 && userPresence.gameId) {
            joinLink = `roblox://experiences/start?placeId=${userPresence.rootPlaceId}&gameInstanceId=${userPresence.gameId}`;
            isDirect = true;
            gameName = userPresence.lastLocation || "In Game";
        }

        const pings = `<@&${ROLE_RAID_PING}> <@&${ROLE_CS_FG}> <@&${ROLE_STATUS_FG}> <@&${ROLE_OX}> <@&${ROLE_ILY}>`;

        const embed = new EmbedBuilder()
            .setTitle(isDirect ? "🚨 RAID STARTED - DIRECT JOIN" : "🚨 RAID STARTED - PROFILE ONLY")
            .setColor(isDirect ? 0x00FF00 : 0xFF0000)
            .setDescription(`**Target:** ${username}\n**Status:** ${gameName}`)
            .addFields(
                { name: 'Profile', value: `[Roblox Profile](https://www.roblox.com/users/${userId}/profile)`, inline: true }
            );

        if (isDirect) {
            embed.addFields({ name: '🚀 DIRECT JOIN', value: `[CLICK TO LAUNCH GAME](${joinLink})`, inline: true });
            embed.setFooter({ text: "Clicking the link will launch Roblox immediately." });
        } else {
            embed.setFooter({ text: "User is offline or joins are off. Profile linked." });
        }

        message.channel.send({ content: pings, embeds: [embed] });

    } catch (e) {
        console.log(e);
        message.reply("❌ Error fetching target details.");
    }
  }

  // --- 2. BACKGROUND CHECK (LINK BASED) ---
  if (command === ',backgroundcheck' || command === ',bgc') {
    // Look for a link in the message
    const link = args.find(arg => arg.includes('roblox.com/groups/'));
    
    // Extract Group ID from Link
    let targetGroupId = null;
    if (link) {
        const match = link.match(/groups\/(\d+)/);
        if (match) targetGroupId = match[1];
    }

    if (!targetGroupId) return message.reply("❌ Invalid Usage.\n**Correct:** `,bgc https://www.roblox.com/groups/330818699/Name`");
    
    message.reply(`🔎 **Scanning the last 100 members of Group ${targetGroupId}...**`);

    try {
        const membersRes = await fetch(`https://groups.roblox.com/v1/groups/${targetGroupId}/users?sortOrder=Desc&limit=100`);
        const membersData = await membersRes.json();
        
        if (!membersData.data) return message.reply("❌ Error fetching group members. (Group might be locked or invalid ID)");

        let spiesFound = [];
        const usersToCheck = membersData.data;

        for (const member of usersToCheck) {
            try {
                const groupsRes = await fetch(`https://groups.roblox.com/v1/users/${member.user.userId}/groups/roles`);
                const groupsData = await groupsRes.json();
                const userGroups = groupsData.data || [];

                let otherTags = [];
                userGroups.forEach(g => {
                    const gId = g.group.id.toString();
                    // We check if they are in ANY tracked tag group (except the one we are scanning)
                    if (TAG_LIST[gId] && gId !== targetGroupId) {
                        otherTags.push(TAG_LIST[gId]);
                    }
                });

                if (otherTags.length > 0) {
                    spiesFound.push(`**${member.user.username}** is also in: ${otherTags.join(', ')}`);
                }
            } catch (err) { continue; } 
        }

        const embed = new EmbedBuilder()
            .setTitle(`🕵️ Background Check Report`)
            .setColor(spiesFound.length > 0 ? 0xFF0000 : 0x00FF00)
            .setFooter({ text: `Scanned the newest ${usersToCheck.length} members from the provided link.` });

        if (spiesFound.length > 0) {
            const desc = `⚠️ **Found ${spiesFound.length} Double-Taggers:**\n\n${spiesFound.join('\n')}`;
            embed.setDescription(desc.length > 4000 ? desc.substring(0, 4000) + "..." : desc);
        } else {
            embed.setDescription("✅ **Clean:** No double-taggers found in the last 100 joiners.");
        }

        message.channel.send({ embeds: [embed] });

    } catch (e) { 
        console.log(e);
        message.reply("⚠️ Error connecting to Roblox API."); 
    }
  }

  // --- 3. CLASSIC COMMANDS ---
  if (command === ',mimic' || command === ',say') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    const text = args.slice(1).join(' ');
    if (!text) return;
    try { await message.delete(); } catch(e) {}
    message.channel.send(text);
  }

  if (command === ',verify' || command === ',v') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply("❌ No permission.");
    const member = message.mentions.members.first();
    if (!member) return message.reply("Usage: `,v @user`");
    if (message.guild.members.me.roles.highest.position <= member.roles.highest.position) return message.reply("❌ Hierarchy Error.");
    try { await member.roles.add(SOCIETY_ROLE_ID); message.reply(`✅ **Verified:** ${member.user.username}`); } catch (e) { message.reply("❌ Error."); }
  }

  if (command === ',unverify') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply("❌ No permission.");
    const member = message.mentions.members.first();
    if (!member) return message.reply("Usage: `,unverify @user`");
    try { await member.roles.remove(SOCIETY_ROLE_ID); message.reply(`🚫 **Unverified:** ${member.user.username}`); } catch (e) { message.reply("❌ Error."); }
  }

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
      else embed.setColor(0xFF0000).setTitle("❌ Not in Goyard").setDescription(`**${user.name}** is not in the group.\n[Click Here to Join](${GROUP_LINK})`);
      message.reply({ embeds: [embed] });
    } catch (e) { message.reply("⚠️ Roblox API Error"); }
  }

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
      let ourTagsFound = [], otherTagsFound = [];
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
      const embed = new EmbedBuilder().setColor(0xFF0000).setTitle(`🔎 User Check: ${user.name}`).setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`)
        .addFields({ name: 'OUR TAGS', value: `\`\`\`\n${ourTagsText}\n\`\`\`` }, { name: 'OTHER TAGS', value: `\`\`\`\n${otherTagsText}\n\`\`\`` });
      message.reply({ embeds: [embed] });
    } catch (error) { message.reply('⚠️ Error fetching data.'); }
  }
});

client.login(process.env.DISCORD_TOKEN);