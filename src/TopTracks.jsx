import React, { useState, useEffect } from "react";

const TopTracks = ({ accessToken }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fixed the fetch helper to include the $ for {endpoint}
  const fetchWebApi = async (endpoint, method, body) => {
    const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  };

  const getTopTracks = async () => {
    const data = await fetchWebApi(
      "v1/me/top/tracks?time_range=long_term&limit=5",
      "GET",
    );
    return data.items || [];
  };

  useEffect(() => {
    if (accessToken) {
      getTopTracks()
        .then((items) => {
          setTracks(items);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching tracks:", err);
          setLoading(false);
        });
    }
  }, [accessToken]);

  if (loading) return <div>Loading top tracks...</div>;

  return (
    <div className="top-tracks-container">
      <h3>Your Top Tracks</h3>
      <ul>
        {tracks.map((track) => (
          <li key={track.id}>
            <strong>{track.name}</strong> by{" "}
            {track.artists.map((a) => a.name).join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopTracks;
