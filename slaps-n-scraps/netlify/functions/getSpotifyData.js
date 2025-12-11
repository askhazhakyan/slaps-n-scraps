import axios from 'axios';

export async function handler(event) {
  try {
    const { type, id } = event.queryStringParameters || {};

    if (!type || !id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing type or id in request body' }),
      };
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SEC;

    if (!clientId || !clientSecret) {
      console.error('Missing Spotify credentials');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing Spotify credentials' }),
      };
    }

    const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${base64Credentials}`,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      console.error('Failed to get Spotify access token:', tokenResponse.data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to get Spotify access token' }),
      };
    }

    const apiEndpoint = type === 'track' ? 'tracks' : 'albums';

    const spotifyData = await axios.get(`https://api.spotify.com/v1/${apiEndpoint}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      statusCode: 200,
      body: JSON.stringify(spotifyData.data),
    };
  } catch (error) {
    console.error('Error in Netlify function:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.response?.data || error.message }),
    };
  }
}