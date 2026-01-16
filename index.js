const http = require('http');

// This makes a "fake" website so Render keeps the bot alive
http.createServer((req, res) => {
  res.write("I am alive");
  res.end();
}).listen(8080);
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --- 1. THE TAG CONFIGURATION ---
const TAG_LIST = {
  // YOUR NEW TAG ADDED HERE
  '1067988454': "OX", 
  '857292331': "ILY",

  // Owner Crew Tags
  '34721394': "DBIN",
  '330818699': "анђели",
  '154361656': "OF] [☑️] [⭐️",
  
  // Permanent Crew Tags
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

  // Private Crew Tags
  '526649056': "</3",
  '528695996': "^.^",
  '481483834': ":3",
  '909775996': "YAU",
  '35474227': "<3",
  '34423896': "092",
  '975405103': "kuks",

  // Standard Crew Tags
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

  // Temporary Crew Tags
  '36052811': "TRACE"
};

// --- 2. YOUR CLAN SETTINGS ---
// These are the IDs the bot looks for to put in the "OUR TAGS" field
const OUR_GROUP_IDS = [
  '857292331',  // ILY
  '1067988454'  // OX
];

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(',check')) {
    const args = message.content.split(' ');
    const username = args[1];

    if (!username) return message.reply('Usage: `,check username`');

    try {
      // --- STEP A: Get User ID ---
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
      });
      const userData = await userRes.json();

      if (!userData.data || userData.data.length === 0) {
        return message.reply(`❌ User **${username}** not found.`);
      }

      const user = userData.data[0];

      // --- STEP B: Get User's Groups ---
      const groupRes = await fetch(`https://groups.roblox.com/v1/users/${user.id}/groups/roles`);
      const groupData = await groupRes.json();
      const userGroups = groupData.data || [];

      // --- STEP C: Filter Tags ---
      let ourTagsFound = [];
      let otherTagsFound = [];

      userGroups.forEach(group => {
        const groupId = group.group.id.toString();
        
        // Check if it's in the BIG list of tags
        if (TAG_LIST[groupId]) {
          const tagName = TAG_LIST[groupId];
          
          // Is it OUR tag or THEIR tag?
          if (OUR_GROUP_IDS.includes(groupId)) {
            ourTagsFound.push(`[${tagName}]`);
          } else {
            otherTagsFound.push(`[${tagName}]`);
          }
        }
      });

      // Default text if none found
      const ourTagsText = ourTagsFound.length > 0 ? ourTagsFound.join('\n') : "None";
      const otherTagsText = otherTagsFound.length > 0 ? otherTagsFound.join(', ') : "None";

      // --- STEP D: Send Embed ---
      const embed = new EmbedBuilder()
        .setColor(0xFF0000) // Red color
        .setTitle(`🔎 User Check: ${user.name}`)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`)
        .addFields(
          { name: 'OUR TAGS', value: `\`\`\`\n${ourTagsText}\n\`\`\``, inline: false },
          { name: 'OTHER TAGS', value: `\`\`\`\n${otherTagsText}\n\`\`\``, inline: false },
          { name: 'User ID', value: user.id.toString(), inline: true },
          { name: 'Profile Link', value: `[Click Here](https://www.roblox.com/users/${user.id}/profile)`, inline: true }
        )
        .setFooter({ text: 'Roblox Database Checker' })
        .setTimestamp();

      message.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      message.reply('⚠️ Error fetching data.');
    }
  }
});

// PASTE YOUR TOKEN BELOW
client.login(process.env.DISCORD_TOKEN);