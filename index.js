const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, PermissionsBitField } = require('discord.js');
const http = require('http');
const fs = require('fs');

// --- 1. KEEP ALIVE ---
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
// ⚠️ PASTE YOUR "SOCIETY" ROLE ID HERE
const SOCIETY_ROLE_ID = 'REPLACE_WITH_SOCIETY_ROLE_ID'; 

// YOUR GROUP ID (Goyard)
const MAIN_GROUP_ID = '34770198';

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
    activities: [{ name: `Tickets`, type: ActivityType.Watching }],
    status: 'online',
  });
});

// --- 5. THE SPY (Updated for your specific question) ---
client.on('messageCreate', async message => {
  if (!message.author.bot) return; 

  if (message.embeds.length > 0) {
    const embed = message.embeds[0];
    
    if (embed.fields) {
      // ⚠️ UPDATED LINE: Checks for "what is your roblox" or "username"
      const robloxField = embed.fields.find(f => 
        f.name.toLowerCase().includes('what is your roblox') || 
        f.name.toLowerCase().includes('username')
      );
      
      if (robloxField) {
        // Find who opened the ticket (looks for <@12345> in description)
        const description = embed.description || "";
        const match = description.match(/<@!?(\d+)>/); 

        if (match) {
          const userId = match[1];
          const robloxName = robloxField.value;

          robloxData[userId] = robloxName;
          saveDatabase();
          console.log(`💾 Auto-Saved: ${userId} = ${robloxName}`);
          
          // Reacts with a disk to show it worked
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

  // COMMAND: ,roco @user
  if (command === ',roco') {
    let target = message.mentions.members.first();
    if (!target && args[1]) {
        try { target = await message.guild.members.fetch(args[1]); } catch(e) {}
    }
    if (!target && !args[1]) target = message.member;

    if (!target) return message.reply("Usage: `,roco @user`");

    const savedName = robloxData[target.id];

    if (savedName) {
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(`👤 Identity Found`)
        .addFields(
            { name: 'Discord User', value: `<@${target.id}>`, inline: true },
            { name: 'Roblox Username', value: `**${savedName}**`, inline: true },
            { name: 'Profile', value: `[Link](https://www.roblox.com/search/users?keyword=${savedName})`, inline: false }
        );
      message.reply({ embeds: [embed] });
    } else {
      message.reply(`❌ I don't know the Roblox username for **${target.user.tag}** yet.\nWait for them to open a ticket, or use \`,link @user name\` to add it manually.`);
    }
  }

  // COMMAND: ,link @user name
  if (command === ',link') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const target = message.mentions.members.first();
    const name = args[2];
    if (!target || !name) return message.reply("Usage: `,link @user RobloxName`");

    robloxData[target.id] = name;
    saveDatabase();
    message.reply(`✅ **Linked:** <@${target.id}> is now known as **${name}**.`);
  }

  // COMMAND: ,verify
  if (command === ',verify' || command === ',v') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply("❌ No permission.");
    const member = message.mentions.members.first();
    if (!member) return message.reply("Usage: `,v @user`");
    try {
      await member.roles.add(SOCIETY_ROLE_ID);
      message.reply(`✅ **Verified:** Given **Society** role to ${member.user.username}.`);
    } catch (e) { message.reply("❌ Error: Check my role hierarchy."); }
  }

  // COMMAND: ,see
  if (command === ',see') {
    const username = args[1];
    if (!username) return message.reply("Usage: `,see username`");
    try {
      const idRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
      });
      const idData = await idRes.json();
      if (!idData.data || idData.data.length === 0) return message.reply(`❌ User **${username}** not found.`);
      const user = idData.data[0];
      const rankRes = await fetch(`https://groups.roblox.com/v1/users/${user.id}/groups/roles`);
      const rankData = await rankRes.json();
      const goyardGroup = rankData.data.find(g => g.group.id.toString() === MAIN_GROUP_ID);
      const embed = new EmbedBuilder().setTimestamp().setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`);
      if (goyardGroup) {
        embed.setColor(0x00FF00).setTitle(`✅ User Found`).setDescription(`**${user.name}** is in the crew (Rank: ${goyardGroup.role.name}).`);
      } else {
        embed.setColor(0xFF0000).setTitle(`❌ User NOT in Goyard`).setDescription(`**${user.name}** is not in the group.`);
      }
      message.reply({ embeds: [embed] });
    } catch (e) { message.reply("⚠️ Error connecting to Roblox."); }
  }
});

client.login(process.env.DISCORD_TOKEN);