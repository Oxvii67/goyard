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

  // --- 2. BACKGROUND CHECK (UPDATED FOR COMMUNITIES) ---
  if (command === ',backgroundcheck' || command === ',bgc') {
    // Look for a link in the message
    const link = args.find(arg => arg.includes('roblox.com'));
    
    // Extract Group ID from Link (Works for 'groups' AND 'communities')
    let targetGroupId = null;
    if (link) {
        const match = link.match(/(?:groups|communities)\/(\d+)/);
        if (match) targetGroupId = match[1];
    }

    if (!targetGroupId) return message.reply("❌ Invalid Usage.\n**Correct:** `,bgc https://www.roblox.com/communities/1067988454/...`");
    
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