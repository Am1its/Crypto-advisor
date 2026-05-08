export const FALLBACK_MEMES = [
  {
    id: 'fb-1',
    url: 'https://i.imgflip.com/90ky9d.jpg',
    caption: 'Me checking Bitcoin price every 5 minutes',
  },
  {
    id: 'fb-2',
    url: 'https://i.imgflip.com/7jnlac.jpg',
    caption: 'HODLing through every dip like a champ 💎🙌',
  },
  {
    id: 'fb-3',
    url: 'https://i.imgflip.com/65939r.jpg',
    caption: 'This is fine. The market is fine.',
  },
  {
    id: 'fb-4',
    url: 'https://i.imgflip.com/3oevdk.jpg',
    caption: 'Wen moon? Sir this is a Wendy\'s 🚀',
  },
  {
    id: 'fb-5',
    url: 'https://i.imgflip.com/4t0m5.jpg',
    caption: 'One does not simply sell their crypto',
  },
];

export async function fetchMeme() {
  try {
    const res = await fetch(
      'https://www.reddit.com/r/cryptocurrencymemes/top.json?limit=30&t=week',
      { headers: { 'User-Agent': 'CryptoAdvisor/1.0' } }
    );
    if (!res.ok) throw new Error('Reddit API failed');
    const data = await res.json();

    const imagePosts = data.data.children.filter((p) => {
      const url = p.data.url || '';
      return !p.data.over_18 && /\.(jpg|jpeg|png|gif)($|\?)/i.test(url);
    });

    if (!imagePosts.length) throw new Error('No image posts');

    const post = imagePosts[Math.floor(Math.random() * Math.min(imagePosts.length, 15))];
    return {
      id: post.data.id,
      url: post.data.url,
      caption: post.data.title,
    };
  } catch {
    return FALLBACK_MEMES[Math.floor(Math.random() * FALLBACK_MEMES.length)];
  }
}
