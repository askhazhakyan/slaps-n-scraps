exports.handler = async (event, context) => {
    try {
      const clientId = process.env.REACT_APP_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_CLIENT_SECRET;
  
      const tokenUrl = "https://accounts.spotify.com/api/token";
  
      const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${creds}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      });
  
      const data = await res.json();
  
      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      };
    }
  }
  