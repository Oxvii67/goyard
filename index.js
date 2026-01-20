const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, PermissionsBitField, REST, Routes, SlashCommandBuilder } = require('discord.js');
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

// ✅ TAG LIST
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

// --- 3. SLASH COMMAND REGISTRATION ---
const commands = [
    new SlashCommandBuilder().setName('raid').setDescription('Start a raid with a Roblox Profile Link').addStringOption(option => option.setName('link').setDescription('The Roblox Profile Link').setRequired(true)),
    new SlashCommandBuilder().setName('bgc').setDescription('Background Check a Group').addStringOption(option => option.setName('link').setDescription('The Roblox Group/Community Link').setRequired(true)),
    new SlashCommandBuilder().setName('verify').setDescription('Give Society Role').addUserOption(option => option.setName('user').setDescription('The user to verify').setRequired(true)),
    new SlashCommandBuilder().setName('unverify').setDescription('Remove Society Role').addUserOption(option => option.setName('user').setDescription('The user to unverify').setRequired(true)),
    new SlashCommandBuilder().setName('check').setDescription('Check user tags').addStringOption(option => option.setName('username').setDescription('Roblox Username').setRequired(true)),
    new SlashCommandBuilder().setName('see').setDescription('Check Goyard rank').addStringOption(option => option.setName('username').setDescription('Roblox Username').setRequired(true)),
    new SlashCommandBuilder().setName('mimic').setDescription('Admin Only: Make bot say something').addStringOption(option => option.setName('text').setDescription('Text to say').setRequired(true)),
];

// --- 4. STARTUP & REGISTRATION ---
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setPresence({ activities: [{ name: `Tickets & /help`, type: ActivityType.Watching }], status: 'online' });

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    const guilds = client.guilds.cache.map(guild => guild.id);
    for (const guildId of guilds) {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });
    }
  } catch (error) { console.error(error); }
});

// --- 5. LOGIC HELPERS ---

// --- RAID HANDLER (UPDATED DESIGN) ---
async function handleRaid(targetLink, replyCallback, channel) {
    let userId = null;
    if (targetLink) {
        const match = targetLink.match(/users\/(\d+)/);
        if (match) userId = match[1];
    }
    if (!userId) return replyCallback("❌ Invalid usage. Provide a valid Roblox Profile Link.");

    await replyCallback("⚔️ **Setting up Raid...** Scanning target...");

    try {
        const presenceRes = await fetch('https://presence.roblox.com/v1/presence/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userIds: [userId] }) });
        const presenceData = await presenceRes.json();
        const userPresence = presenceData.userPresences[0];

        const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
        const userData = await userRes.json();
        const username = userData.name || "Target";
        const thumbnail = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`;

        // Default: Offline
        let statusText = "🔴 Offline";
        let joinText = "OPEN PROFILE";
        let joinLink = `https://www.roblox.com/users/${userId}/profile`;
        let color = 0xFF0000; // Red

        if (userPresence) {
            if (userPresence.userPresenceType === 1) {
                statusText = "🟢 Online (Website)";
                color = 0x00FF00;
            } else if (userPresence.userPresenceType === 2) {
                statusText = "🎮 In Game";
                color = 0x00FF00;
                
                // Try to get Server Link
                if (userPresence.gameId) {
                    joinLink = `roblox://experiences/start?placeId=${userPresence.rootPlaceId}&gameInstanceId=${userPresence.gameId}`;
                    joinText = "🚀 LAUNCH SERVER";
                } else if (userPresence.rootPlaceId) {
                    joinLink = `https://www.roblox.com/games/${userPresence.rootPlaceId}`;
                    joinText = "⚠️ OPEN GAME PAGE";
                }
            } else if (userPresence.userPresenceType === 3) {
                statusText = "🔨 In Studio";
                color = 0xFFA500;
            }
        }

        const pings = `<@&${ROLE_RAID_PING}> <@&${ROLE_CS_FG}> <@&${ROLE_STATUS_FG}> <@&${ROLE_OX}> <@&${ROLE_ILY}>`;
        
        const embed = new EmbedBuilder()
            .setTitle("🚨 RAID STARTED")
            .setColor(color)
            .setThumbnail(thumbnail)
            .setDescription(`# [${username}](https://www.roblox.com/users/${userId}/profile)`) // BIG USERNAME
            .addFields(
                { name: 'Status', value: statusText, inline: true },
                { name: 'JOIN', value: `[**${joinText}**](${joinLink})`, inline: true }
            )
            .setFooter({ text: "Click the JOIN link to attack." });
        
        await channel.send({ content: pings, embeds: [embed] });

    } catch (e) { console.log(e); replyCallback("❌ Error fetching target."); }
}

async function handleBGC(link, replyCallback, channel) {
    let targetGroupId = null;
    if (link) {
        const match = link.match(/(?:groups|communities)\/(\d+)/);
        if (match) targetGroupId = match[1];
    }
    if (!targetGroupId) return replyCallback("❌ Invalid Usage. Provide a valid Group Link.");
    
    await replyCallback(`🔎 **Scanning Group ${targetGroupId}...**`);

    try {
        const membersRes = await fetch(`https://groups.roblox.com/v1/groups/${targetGroupId}/users?sortOrder=Desc&limit=100`);
        const membersData = await membersRes.json();
        if (!membersData.data) return channel.send("❌ Error fetching group members.");

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
                    if (TAG_LIST[gId] && gId !== targetGroupId && !OUR_GROUP_IDS.includes(gId)) {
                        otherTags.push(TAG_LIST[gId]);
                    }
                });
                if (otherTags.length > 0) spiesFound.push(`**${member.user.username}** is also in: ${otherTags.join(', ')}`);
            } catch (err) { continue; } 
        }

        const embed = new EmbedBuilder()
            .setTitle(`🕵️ Background Check Report`)
            .setColor(spiesFound.length > 0 ? 0xFF0000 : 0x00FF00)
            .setFooter({ text: `Scanned the newest ${usersToCheck.length} members.` });

        if (spiesFound.length > 0) {
            const desc = `⚠️ **Found ${spiesFound.length} Double-Taggers:**\n\n${spiesFound.join('\n')}`;
            embed.setDescription(desc.length > 4000 ? desc.substring(0, 4000) + "..." : desc);
        } else {
            embed.setDescription("✅ **Clean:** No double-taggers found.");
        }
        channel.send({ embeds: [embed] });
    } catch (e) { channel.send("⚠️ Error connecting to Roblox API."); }
}

// --- 6. COMMAND HANDLERS ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'raid') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return interaction.reply({ content: "❌ No Permission.", ephemeral: true });
        await interaction.deferReply();
        await handleRaid(interaction.options.getString('link'), (msg) => interaction.editReply(msg), interaction.channel);
    }
    else if (interaction.commandName === 'bgc') {
        await interaction.deferReply();
        await handleBGC(interaction.options.getString('link'), (msg) => interaction.editReply(msg), interaction.channel);
    }
    else if (interaction.commandName === 'verify') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return interaction.reply({ content: "❌ No Permission.", ephemeral: true });
        const member = interaction.options.getMember('user');
        if (interaction.member.roles.highest.position <= member.roles.highest.position) return interaction.reply("❌ Hierarchy Error.");
        try { await member.roles.add(SOCIETY_ROLE_ID); interaction.reply(`✅ **Verified:** ${member.user.username}`); } catch (e) { interaction.reply("❌ Error."); }
    }
    else if (interaction.commandName === 'unverify') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return interaction.reply({ content: "❌ No Permission.", ephemeral: true });
        const member = interaction.options.getMember('user');
        if (interaction.member.roles.highest.position <= member.roles.highest.position) return interaction.reply("❌ Hierarchy Error.");
        try { await member.roles.remove(SOCIETY_ROLE_ID); interaction.reply(`🚫 **Unverified:** ${member.user.username}`); } catch (e) { interaction.reply("❌ Error."); }
    }
    else if (interaction.commandName === 'mimic') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Admin Only.", ephemeral: true });
        const text = interaction.options.getString('text');
        await interaction.reply({ content: "Sent.", ephemeral: true });
        interaction.channel.send(text);
    }
    else if (interaction.commandName === 'see' || interaction.commandName === 'check') {
        await interaction.deferReply();
        const username = interaction.options.getString('username');
        try {
            const userRes = await fetch('https://users.roblox.com/v1/usernames/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }) });
            const userData = await userRes.json();
            if (!userData.data || !userData.data.length) return interaction.editReply(`❌ User **${username}** not found.`);
            const user = userData.data[0];
            const groupRes = await fetch(`https://groups.roblox.com/v1/users/${user.id}/groups/roles`);
            const groupData = await groupRes.json();

            if (interaction.commandName === 'see') {
                 const group = groupData.data.find(g => g.group.id.toString() === MAIN_GROUP_ID);
                 const embed = new EmbedBuilder().setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`);
                 if (group) embed.setColor(0x00FF00).setTitle("✅ In Goyard").setDescription(`**${user.name}** is Rank: ${group.role.name}`);
                 else embed.setColor(0xFF0000).setTitle("❌ Not in Goyard").setDescription(`**${user.name}** is not in the group.\n[Click Here to Join](${GROUP_LINK})`);
                 interaction.editReply({ embeds: [embed] });
            } else {
                 let ourTagsFound = [], otherTagsFound = [];
                 groupData.data.forEach(group => {
                    const groupId = group.group.id.toString();
                    if (TAG_LIST[groupId]) {
                        if (OUR_GROUP_IDS.includes(groupId)) ourTagsFound.push(`[${TAG_LIST[groupId]}]`);
                        else otherTagsFound.push(`[${TAG_LIST[groupId]}]`);
                    }
                 });
                 const embed = new EmbedBuilder().setColor(0xFF0000).setTitle(`🔎 User Check: ${user.name}`).setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`)
                .addFields({ name: 'OUR TAGS', value: ourTagsFound.length ? ourTagsFound.join('\n') : "None" }, { name: 'OTHER TAGS', value: otherTagsFound.length ? otherTagsFound.join(', ') : "None" });
                 interaction.editReply({ embeds: [embed] });
            }
        } catch(e) { interaction.editReply("❌ API Error"); }
    }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const args = message.content.split(/\s+/);
  const command = args[0].toLowerCase();

  async function getMemberFromArg(arg) {
    if (!arg) return null;
    let userId = arg.replace(/[<@!>]/g, ''); 
    try { return await message.guild.members.fetch(userId); } catch (e) { return null; }
  }

  if (command === ',raid') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const link = args.find(arg => arg.includes('roblox.com/users/'));
    await handleRaid(link, (msg) => message.reply(msg), message.channel);
  }
  else if (command === ',backgroundcheck' || command === ',bgc') {
    const link = args.find(arg => arg.includes('roblox.com'));
    await handleBGC(link, (msg) => message.reply(msg), message.channel);
  }
  else if (command === ',mimic' || command === ',say') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    const text = args.slice(1).join(' ');
    try { await message.delete(); } catch(e) {}
    message.channel.send(text);
  }
  else if (command === ',verify' || command === ',v') {
     if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply("❌ No permission.");
     const member = await getMemberFromArg(args[1]);
     if (!member) return message.reply("Usage: `,v @user` OR `,v ID`");
     if (message.guild.members.me.roles.highest.position <= member.roles.highest.position) return message.reply("❌ Hierarchy Error.");
     try { await member.roles.add(SOCIETY_ROLE_ID); message.reply(`✅ **Verified:** ${member.user.username}`); } catch (e) { message.reply("❌ Error."); }
  }
  else if (command === ',unverify') {
     if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply("❌ No permission.");
     const member = await getMemberFromArg(args[1]);
     if (!member) return message.reply("Usage: `,unverify @user` OR `,unverify ID`");
     if (message.guild.members.me.roles.highest.position <= member.roles.highest.position) return message.reply("❌ Hierarchy Error.");
     try { await member.roles.remove(SOCIETY_ROLE_ID); message.reply(`🚫 **Unverified:** ${member.user.username}`); } catch (e) { message.reply("❌ Error."); }
  }
  else if (command === ',see' || command === ',check') {
      const username = args[1];
      if (!username) return message.reply(`Usage: ${command} username`);
      try {
        const userRes = await fetch('https://users.roblox.com/v1/usernames/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }) });
        const userData = await userRes.json();
        if (!userData.data || !userData.data.length) return message.reply(`❌ User **${username}** not found.`);
        const user = userData.data[0];
        const groupRes = await fetch(`https://groups.roblox.com/v1/users/${user.id}/groups/roles`);
        const groupData = await groupRes.json();
        if (command === ',see') {
             const group = groupData.data.find(g => g.group.id.toString() === MAIN_GROUP_ID);
             const embed = new EmbedBuilder().setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`);
             if (group) embed.setColor(0x00FF00).setTitle("✅ In Goyard").setDescription(`**${user.name}** is Rank: ${group.role.name}`);
             else embed.setColor(0xFF0000).setTitle("❌ Not in Goyard").setDescription(`**${user.name}** is not in the group.\n[Click Here to Join](${GROUP_LINK})`);
             message.reply({ embeds: [embed] });
        } else {
             let ourTagsFound = [], otherTagsFound = [];
             groupData.data.forEach(group => {
                const groupId = group.group.id.toString();
                if (TAG_LIST[groupId]) {
                    if (OUR_GROUP_IDS.includes(groupId)) ourTagsFound.push(`[${TAG_LIST[groupId]}]`);
                    else otherTagsFound.push(`[${TAG_LIST[groupId]}]`);
                }
             });
             const embed = new EmbedBuilder().setColor(0xFF0000).setTitle(`🔎 User Check: ${user.name}`).setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`)
            .addFields({ name: 'OUR TAGS', value: ourTagsFound.length ? ourTagsFound.join('\n') : "None" }, { name: 'OTHER TAGS', value: otherTagsFound.length ? otherTagsFound.join(', ') : "None" });
             message.reply({ embeds: [embed] });
        }
    } catch (e) { message.reply("⚠️ Error."); }
  }
});

client.login(process.env.DISCORD_TOKEN);