import axios from 'axios';

export async function handler(event, context) {
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

    // Encode credentials for Spotify token request
    const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Request Spotify access token
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
      console.error('Failed to get access token from Spotify:', tokenResponse.data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to get Spotify access token' }),
      };
    }

    // Fetch new releases
    const newReleasesResponse = await axios.get(
      'https://api.spotify.com/v1/browse/new-releases?limit=25',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(newReleasesResponse.data),
    };
  } catch (error) {
    console.error('Error in Netlify function:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.response?.data || error.message }),
    };
  }
}