exports.handler = async (event, context) => {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SEC;

    if (!clientId || !clientSecret) {
      console.error('Missing Spotify credentials');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing Spotify credentials' }),
      };
    }

    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Spotify token request failed:', errorText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch Spotify token', details: errorText }),
      };
    }

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('Error in Netlify function:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};