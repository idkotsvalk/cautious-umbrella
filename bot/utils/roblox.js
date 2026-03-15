const axios = require('axios');

async function getUser(username) {
  try {
    const res = await axios.post('https://users.roblox.com/v1/usernames/users',
      { usernames: [username], excludeBannedUsers: false }, { timeout: 8000 });

    const users = res.data?.data;
    if (!users?.length) return null;

    const profile = await axios.get(`https://users.roblox.com/v1/users/${users[0].id}`, { timeout: 8000 });

    let avatarUrl = null;
    try {
      const av = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${users[0].id}&size=150x150&format=Png`, { timeout: 8000 });
      avatarUrl = av.data?.data?.[0]?.imageUrl || null;
    } catch (_) {}

    return {
      id:          users[0].id,
      username:    profile.data.name,
      displayName: profile.data.displayName,
      created:     profile.data.created,
      avatarUrl,
    };
  } catch (e) {
    if (e.response?.status === 404) return null;
    return null;
  }
}

function ageString(iso) {
  const months = Math.floor((Date.now() - new Date(iso)) / (1000 * 60 * 60 * 24 * 30));
  if (months >= 12) return `${Math.floor(months / 12)}y ${months % 12}mo`;
  if (months > 0)   return `${months}mo`;
  return `${Math.floor((Date.now() - new Date(iso)) / 86400000)}d`;
}

module.exports = { getUser, ageString };
