import axios from 'axios';

export async function handler(event) {
  try {
    const { type, id } = JSON.parse(event.body);

    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${process.env.REACT_APP_CLIENT_ID}:${process.env.REACT_APP_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const apiEndpoint = type === 'track' ? 'tracks' : 'albums';

    const spotifyData = await axios.get(`https://api.spotify.com/v1/${apiEndpoint}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      statusCode: 200,
      body: JSON.stringify(spotifyData.data),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Spotify fetch failed' }),
    };
  }
}