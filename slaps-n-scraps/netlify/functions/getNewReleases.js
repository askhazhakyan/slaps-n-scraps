import axios from 'axios';

export async function handler(event, context) {
  try {
    const clientId = process.env.REACT_APP_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
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

    const newReleasesResponse = await axios.get(
      'https://api.spotify.com/v1/browse/new-releases?limit=25',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(newReleasesResponse.data),
    };
  } catch (error) {
    console.error('Error in Netlify function:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}